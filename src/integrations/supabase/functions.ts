import { z } from "zod";
import { supabase } from "./client";

/**
 * Typed wrapper around `supabase.functions.invoke`.
 *
 * Call sites previously destructured `{ data }` and cast it to whatever shape
 * they expected — `VoiceLab` did not even look at `error`, so a failed debrief
 * was silently invisible. Every call now goes through here, which:
 *
 *   - checks the transport error,
 *   - surfaces the server's stable `code` rather than guessing from a message,
 *   - validates the response against a schema instead of trusting it.
 */

const errorEnvelope = z.object({
  error: z.string(),
  code: z.string().optional(),
  requestId: z.string().optional(),
});

export type HarisErrorCode =
  | "invalid_request"
  | "rate_limited"
  | "service_unavailable"
  | "upstream_error"
  | "internal_error"
  | "network_error"
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
    return this.code === "rate_limited" || this.code === "network_error" || this.code === "upstream_error";
  }
}

const FALLBACK_MESSAGES: Record<HarisErrorCode, string> = {
  invalid_request: "That request could not be processed.",
  rate_limited: "Too many requests. Take a short break, then try again.",
  service_unavailable: "HARIS is briefly unavailable. Please try again in a moment.",
  upstream_error: "The analysis could not be completed. Please try again.",
  internal_error: "Something went wrong. Please try again.",
  network_error: "Could not reach HARIS. Check your connection and try again.",
  invalid_response: "HARIS sent back something unexpected. Please try again.",
};

/** Digs the error envelope out of a supabase-js FunctionsHttpError, if present. */
async function readEnvelope(error: unknown): Promise<z.infer<typeof errorEnvelope> | null> {
  const context = (error as { context?: unknown })?.context;
  if (!(context instanceof Response)) return null;

  try {
    return errorEnvelope.parse(await context.clone().json());
  } catch {
    return null;
  }
}

export async function invokeHarisFunction<TOutput extends z.ZodTypeAny>(
  name: string,
  body: Record<string, unknown>,
  schema: TOutput,
): Promise<z.infer<TOutput>> {
  // `Database["Functions"]` is empty (there is no schema yet), so supabase-js
  // types `body` as `never`. The cast is confined to this one line; the
  // response is still validated by `schema` below.
  const { data, error } = await supabase.functions.invoke(name, {
    body: body as never,
  });

  if (error) {
    const envelope = await readEnvelope(error);
    const code = (envelope?.code as HarisErrorCode | undefined) ?? "network_error";
    throw new HarisError(
      envelope?.error ?? FALLBACK_MESSAGES[code],
      code,
      envelope?.requestId,
    );
  }

  // The client also guards against a 200 carrying an error body, which is how
  // the old functions reported some failures.
  const envelope = errorEnvelope.safeParse(data);
  if (envelope.success) {
    const code = (envelope.data.code as HarisErrorCode | undefined) ?? "internal_error";
    throw new HarisError(envelope.data.error, code, envelope.data.requestId);
  }

  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    console.error(`${name} returned an unexpected shape:`, parsed.error.issues);
    throw new HarisError(FALLBACK_MESSAGES.invalid_response, "invalid_response");
  }

  return parsed.data;
}

/** Normalises anything thrown by this module (or by React) into a message. */
export function errorMessage(error: unknown): string {
  if (error instanceof HarisError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return FALLBACK_MESSAGES.internal_error;
}
