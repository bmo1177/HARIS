import { z } from "zod";
import {
  functionsBaseUrl,
  isConfigured,
  missingEnv,
  supabasePublishableKey,
} from "@/lib/env";

/**
 * Typed client for the HARIS Edge Functions.
 *
 * ## Why this does not use `supabase-js`
 *
 * The app previously called `supabase.functions.invoke`, which pulled the whole
 * `@supabase/supabase-js` package into the bundle: GoTrue (auth), Storage,
 * PostgREST, Realtime and the Phoenix WebSocket — roughly **500 kB of a 658 kB
 * bundle**, about 60% of the JavaScript a first-time visitor downloaded.
 *
 * None of it was used. HARIS calls three HTTPS endpoints, has no accounts, no
 * database and no realtime subscriptions. Calling them with `fetch` removes the
 * entire dependency.
 *
 * This matters most for the target audience: the first thing a student on a
 * school phone or a weak connection downloads was an auth client they will never
 * authenticate against.
 */

export type HarisErrorCode =
  | "invalid_request"
  | "rate_limited"
  | "service_unavailable"
  | "upstream_error"
  | "internal_error"
  | "network_error"
  | "timeout"
  | "invalid_response";

export class HarisError extends Error {
  constructor(
    message: string,
    readonly code: HarisErrorCode,
    readonly requestId?: string,
  ) {
    super(message);
    this.name = "HarisError";
  }

  /** True when the request never reached the model, so retrying may help. */
  get isTransient(): boolean {
    return (
      this.code === "rate_limited" ||
      this.code === "network_error" ||
      this.code === "timeout" ||
      this.code === "upstream_error"
    );
  }
}

/** Mirrors the error envelope in `supabase/functions/_shared/http.ts`. */
const errorEnvelope = z.object({
  error: z.string(),
  code: z.string().optional(),
  requestId: z.string().optional(),
});

const FALLBACK_MESSAGES: Record<HarisErrorCode, string> = {
  invalid_request: "That request could not be processed.",
  rate_limited: "Too many requests. Take a short break, then try again.",
  service_unavailable: "HARIS is briefly unavailable. Please try again in a moment.",
  upstream_error: "The analysis could not be completed. Please try again.",
  internal_error: "Something went wrong. Please try again.",
  network_error: "Could not reach HARIS. Check your connection and try again.",
  timeout: "HARIS took too long to respond. Please try again.",
  invalid_response: "HARIS sent back something unexpected. Please try again.",
};

/** Slightly longer than the server's `LLM_TIMEOUT_MS` so the server wins the race. */
const REQUEST_TIMEOUT_MS = 30_000;

const asCode = (value: string | undefined): HarisErrorCode =>
  value !== undefined && value in FALLBACK_MESSAGES ? (value as HarisErrorCode) : "internal_error";

export async function invokeHarisFunction<TOutput extends z.ZodTypeAny>(
  name: string,
  body: Record<string, unknown>,
  schema: TOutput,
  signal?: AbortSignal,
): Promise<z.infer<TOutput>> {
  if (!isConfigured) {
    throw new HarisError(
      `HARIS is not configured: ${missingEnv.join(", ")}`,
      "service_unavailable",
    );
  }

  // Caller-supplied cancellation and our own timeout both need to apply, so they
  // are combined rather than overwriting one another.
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  const combined = signal ? AbortSignal.any([signal, timeout]) : timeout;

  let response: Response;
  try {
    response = await fetch(`${functionsBaseUrl}/${name}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: supabasePublishableKey,
        Authorization: `Bearer ${supabasePublishableKey}`,
      },
      body: JSON.stringify(body),
      signal: combined,
      // Edge Function responses are never cacheable and must reflect deploy state.
      cache: "no-store",
    });
  } catch (error) {
    if (timeout.aborted) {
      throw new HarisError(FALLBACK_MESSAGES.timeout, "timeout");
    }
    if (signal?.aborted) throw error;
    throw new HarisError(FALLBACK_MESSAGES.network_error, "network_error");
  }

  const requestId = response.headers.get("x-request-id") ?? undefined;

  if (!response.ok) {
    const envelope = errorEnvelope.safeParse(await response.json().catch(() => null));
    const code = asCode(envelope.success ? envelope.data.code : undefined);
    throw new HarisError(
      envelope.success ? envelope.data.error : FALLBACK_MESSAGES[code],
      code,
      envelope.success ? envelope.data.requestId : requestId,
    );
  }

  const data: unknown = await response.json().catch(() => null);

  // Guard against a 200 carrying an error body.
  const envelope = errorEnvelope.safeParse(data);
  if (envelope.success) {
    const code = asCode(envelope.data.code);
    throw new HarisError(envelope.data.error, code, envelope.data.requestId ?? requestId);
  }

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    console.error(`${name} returned an unexpected shape:`, parsed.error.issues);
    throw new HarisError(FALLBACK_MESSAGES.invalid_response, "invalid_response", requestId);
  }

  return parsed.data;
}

/** Normalises anything thrown by this module (or by React) into a message. */
export function errorMessage(error: unknown): string {
  if (error instanceof HarisError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return FALLBACK_MESSAGES.internal_error;
}
