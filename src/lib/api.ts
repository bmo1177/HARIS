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
  | "provider_unauthorized"
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
    /**
     * Seconds the client should wait before retrying, taken from the server's
     * `Retry-After` header. Only present when the server sent one — a rate
     * limit knows exactly when its window rolls over, and saying so is the
     * difference between "try again" and "try again in 20 seconds".
     */
    readonly retryAfterSeconds?: number,
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
  provider_unauthorized:
    "HARIS cannot reach the AI provider right now. Please try again in a moment.",
  upstream_error: "The analysis could not be completed. Please try again.",
  internal_error: "Something went wrong. Please try again.",
  network_error: "Could not reach HARIS. Check your connection and try again.",
  timeout: "HARIS took too long to respond. Please try again.",
  invalid_response: "HARIS sent back something unexpected. Please try again.",
};

/** Slightly longer than the server's `LLM_TIMEOUT_MS` so the server wins the race. */
const REQUEST_TIMEOUT_MS = 30_000;

/**
 * A request signal that is aborted by our timeout or by the caller's
 * cancellation, whichever comes first.
 *
 * `AbortSignal.any([...])` and `AbortSignal.timeout(ms)` are the obvious
 * tools, but `AbortSignal.any` only landed in Safari 17.4 (March 2024) and
 * `AbortSignal.timeout` in Safari 16. On an older browser — which a managed
 * school laptop is quite likely to be — `AbortSignal.any` is simply not a
 * function, and the throw happens inside the `try` of every single analysis.
 * The failure would be total: the analyzer never works, on a class of device
 * nobody tests on.
 *
 * So the combination is done by hand. It is a few more lines than the built-in
 * and it works everywhere.
 */
interface RequestSignal {
  signal: AbortSignal;
  /** True when *our* timeout fired, as opposed to the caller cancelling. */
  timedOut: () => boolean;
  /** Clears the timer and detaches the listener. */
  dispose: () => void;
}

function requestSignal(timeoutMs: number, caller?: AbortSignal): RequestSignal {
  const controller = new AbortController();
  let timedOut = false;

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const onCallerAbort = () => controller.abort();
  if (caller) {
    if (caller.aborted) {
      controller.abort();
    } else {
      caller.addEventListener("abort", onCallerAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    timedOut: () => timedOut,
    dispose: () => {
      clearTimeout(timer);
      caller?.removeEventListener("abort", onCallerAbort);
    },
  };
}

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

  // Caller-supplied cancellation and our own timeout both need to apply, so
  // they are combined rather than overwriting one another.
  const { signal: combined, timedOut, dispose } = requestSignal(REQUEST_TIMEOUT_MS, signal);

  try {
    let response: Response;
    try {
      response = await fetch(`${functionsBaseUrl}/${name}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Supabase keys are short strings, not JWTs. They go on `apikey` only:
          // sending one as `Authorization: Bearer` asks the gateway to verify a
          // non-JWT as a JWT, which fails. The previous version sent both headers
          // because the key used to be a legacy `eyJ...` JWT.
          apikey: supabasePublishableKey,
        },
        body: JSON.stringify(body),
        signal: combined,
        // Edge Function responses are never cacheable and must reflect deploy state.
        cache: "no-store",
      });
    } catch (error) {
      if (timedOut()) {
        throw new HarisError(FALLBACK_MESSAGES.timeout, "timeout");
      }
      if (signal?.aborted) throw error;
      throw new HarisError(FALLBACK_MESSAGES.network_error, "network_error");
    }

    const requestId = response.headers.get("x-request-id") ?? undefined;

    // The server sets `Retry-After` when it knows when the limit lifts: on a
    // rate limit that is the moment the fixed window rolls over. It used to send
    // the header and the client dropped it on the floor.
    const retryAfterHeader = Number.parseInt(response.headers.get("retry-after") ?? "", 10);
    const retryAfterSeconds =
      Number.isFinite(retryAfterHeader) && retryAfterHeader > 0 ? retryAfterHeader : undefined;

    if (!response.ok) {
      const envelope = errorEnvelope.safeParse(await response.json().catch(() => null));
      const code = asCode(envelope.success ? envelope.data.code : undefined);
      throw new HarisError(
        envelope.success ? envelope.data.error : FALLBACK_MESSAGES[code],
        code,
        envelope.success ? envelope.data.requestId : requestId,
        retryAfterSeconds,
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
  } finally {
    // Only now: the timeout also covers reading the body, and clearing it
    // earlier would let a slow response hang forever.
    dispose();
  }
}

/** Normalises anything thrown by this module (or by React) into a message. */
export function errorMessage(error: unknown): string {
  if (error instanceof HarisError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return FALLBACK_MESSAGES.internal_error;
}
