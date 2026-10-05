/**
 * Request/response plumbing: body limits, JSON helpers and a safe error
 * envelope.
 *
 * The previous edge functions returned `e.message` straight to the caller,
 * which leaked the names of unconfigured environment variables and raw upstream
 * `fetch` errors to anonymous users. Everything now goes through
 * `errorResponse`, which logs the real cause server-side and returns a fixed,
 * client-safe message plus a request id for correlation.
 */

import { corsHeaders } from "./cors.ts";
import { MissingConfigError, UpstreamError } from "./env.ts";

/** Hard ceiling on the raw request body, applied before JSON parsing. */
const MAX_BODY_BYTES = 24 * 1024;

export type ErrorCode =
  | "invalid_request"
  | "rate_limited"
  | "service_unavailable"
  | "upstream_error"
  | "internal_error";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  invalid_request: 400,
  rate_limited: 429,
  service_unavailable: 503,
  upstream_error: 502,
  internal_error: 500,
};

/**
 * Messages are written for end users (secondary-school students) and must never
 * contain internal detail.
 */
const SAFE_MESSAGE: Record<ErrorCode, string> = {
  invalid_request: "That request could not be processed. Check the input and try again.",
  rate_limited: "Too many requests. Take a short break, then try again.",
  service_unavailable: "HARIS is briefly unavailable. Please try again in a moment.",
  upstream_error: "The analysis could not be completed. Please try again.",
  internal_error: "Something went wrong. Please try again.",
};

export function newRequestId(): string {
  return crypto.randomUUID();
}

export function jsonResponse(
  req: Request,
  status: number,
  body: unknown,
  extraHeaders: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...extraHeaders,
    },
  });
}

export function errorResponse(
  req: Request,
  code: ErrorCode,
  requestId: string,
  options: { retryAfterSeconds?: number } = {},
): Response {
  const headers: Record<string, string> = { "X-Request-Id": requestId };
  if (options.retryAfterSeconds !== undefined) {
    headers["Retry-After"] = String(options.retryAfterSeconds);
  }

  return jsonResponse(
    req,
    STATUS_BY_CODE[code],
    { error: SAFE_MESSAGE[code], code, requestId },
    headers,
  );
}

export class RequestError extends Error {
  constructor(readonly code: ErrorCode, message?: string) {
    super(message ?? code);
    this.name = "RequestError";
  }
}

/**
 * Reads and parses the request body, rejecting anything oversized or malformed.
 * Reading as text and measuring first avoids handing a multi-megabyte body to
 * `JSON.parse`.
 */
export async function readJsonBody(req: Request): Promise<unknown> {
  const declared = req.headers.get("content-length");
  if (declared !== null) {
    const size = Number.parseInt(declared, 10);
    if (Number.isFinite(size) && size > MAX_BODY_BYTES) {
      throw new RequestError("invalid_request", "Request body too large");
    }
  }

  const raw = await req.text();
  if (new TextEncoder().encode(raw).length > MAX_BODY_BYTES) {
    throw new RequestError("invalid_request", "Request body too large");
  }

  try {
    return JSON.parse(raw);
  } catch {
    throw new RequestError("invalid_request", "Body was not valid JSON");
  }
}

export type Handler = (ctx: {
  req: Request;
  requestId: string;
  body: unknown;
}) => Promise<Response>;

/**
 * Wraps a handler with method enforcement, a request id and a catch-all that
 * converts any escaping error into a safe response.
 */
export function createHandler(handler: Handler) {
  return async (req: Request): Promise<Response> => {
    const requestId = newRequestId();

    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(req) });
    }

    if (req.method !== "POST") {
      return errorResponse(req, "invalid_request", requestId);
    }

    try {
      const body = await readJsonBody(req);
      return await handler({ req, requestId, body });
    } catch (error) {
      if (error instanceof RequestError) {
        return errorResponse(req, error.code, requestId);
      }

      if (error instanceof MissingConfigError) {
        // Loud on the server, opaque to the caller.
        console.error(`[${requestId}] misconfigured:`, error.message);
        return errorResponse(req, "service_unavailable", requestId);
      }

      if (error instanceof UpstreamError) {
        console.error(
          `[${requestId}] upstream failure status=${error.status}:`,
          error.message,
        );
        return errorResponse(
          req,
          error.status === 429 ? "rate_limited" : "upstream_error",
          requestId,
          error.status === 429 ? { retryAfterSeconds: 20 } : undefined,
        );
      }

      console.error(`[${requestId}] unhandled error:`, error);
      return errorResponse(req, "internal_error", requestId);
    }
  };
}
