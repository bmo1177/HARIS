/**
 * Centralised, validated access to environment configuration.
 *
 * Reading `Deno.env` ad-hoc at call sites is how secrets end up leaked in error
 * messages. Everything goes through here so that a missing variable fails loudly
 * on the server (with the variable name in the logs) and never reaches a client.
 */

export class MissingConfigError extends Error {
  constructor(readonly variable: string) {
    super(`Missing required environment variable: ${variable}`);
    this.name = "MissingConfigError";
  }
}

export class UpstreamError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly retryable: boolean,
  ) {
    super(message);
    this.name = "UpstreamError";
  }
}

function optional(name: string): string | undefined {
  const value = Deno.env.get(name)?.trim();
  return value ? value : undefined;
}

function required(name: string): string {
  const value = optional(name);
  if (!value) throw new MissingConfigError(name);
  return value;
}

function positiveInt(name: string, fallback: number): number {
  const raw = optional(name);
  if (raw === undefined) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

export interface LlmConfig {
  apiKey: string;
  baseUrl: string;
  model: string;
  timeoutMs: number;
  maxTokens: number;
}

export interface RateLimitConfig {
  /** Requests permitted per window, per client. */
  max: number;
  /** Window length in seconds. */
  windowSeconds: number;
}

export interface AppConfig {
  llm: LlmConfig;
  supabase: { url: string; serviceRoleKey: string };
  allowedOrigins: string[];
  /** Applied to every function unless overridden per function. */
  rateLimit: RateLimitConfig;
  dailyRateLimit: RateLimitConfig;
}

/**
 * Resolves the privileged key used for rate-limit bookkeeping.
 *
 * Supabase injects `SUPABASE_SECRET_KEYS` into the Edge Function runtime as a
 * JSON dictionary keyed by key name, and that is where the current
 * `sb_secret_…` keys live. The documented `SUPABASE_SERVICE_ROLE_KEY` variable
 * still exists but carries the **legacy** JWT, and Supabase is deprecating the
 * `anon` / `service_role` JWT keys — reading it keeps the project on the
 * deprecated path.
 *
 * Order matters: the injected dictionary first, then an explicitly configured
 * secret for local development, then the legacy variable for older runtimes.
 */
function resolveServiceRoleKey(): string {
  const injected = optional("SUPABASE_SECRET_KEYS");
  if (injected) {
    try {
      const keys = JSON.parse(injected) as Record<string, string>;
      const value = keys.default ?? Object.values(keys)[0];
      if (value) return value;
    } catch {
      // Fall through to the explicit secret below.
    }
  }

  return required("SUPABASE_SERVICE_ROLE_KEY");
}

const DEFAULT_ORIGINS = [
  "https://haris-two-xi.vercel.app",
  "http://localhost:8080",
  "http://localhost:5173",
];

let cached: AppConfig | null = null;

export function getConfig(): AppConfig {
  if (cached) return cached;

  const origins = optional("ALLOWED_ORIGINS")
    ? (optional("ALLOWED_ORIGINS") as string).split(",").map((o) => o.trim())
      .filter(Boolean)
    : DEFAULT_ORIGINS;

  const config = {
    llm: {
      apiKey: required("LLM_API_KEY"),
      baseUrl: (optional("LLM_BASE_URL") ?? "https://openrouter.ai/api/v1")
        .replace(/\/+$/, ""),
      model: optional("LLM_MODEL") ?? "google/gemini-3.5-flash",
      timeoutMs: positiveInt("LLM_TIMEOUT_MS", 20_000),
      maxTokens: positiveInt("LLM_MAX_TOKENS", 1_200),
    },
    allowedOrigins: origins,
    rateLimit: {
      max: positiveInt("RATE_LIMIT_MAX", 10),
      windowSeconds: positiveInt("RATE_LIMIT_WINDOW_SECONDS", 60),
    },
    dailyRateLimit: {
      max: positiveInt("DAILY_RATE_LIMIT_MAX", 100),
      windowSeconds: 86_400,
    },
    // `supabase` is attached below as a lazy accessor. Asserted rather than
    // written out so the required property is not duplicated in two places.
  } as AppConfig;

  // Resolved on first access rather than here. Building the whole config eagerly
  // meant every caller needed both sets of credentials, so the eval harness — which
  // calls the LLM path and never touches the database — failed all 45 cases with
  // "Missing required environment variable: SUPABASE_URL". A failure that has
  // nothing to do with the model under test is worse than no measurement, because
  // it is easy to misread as a bad score.
  //
  // Injected by the Edge Function runtime, and by `supabase start` locally, so
  // this still resolves in both places without a separate override.
  Object.defineProperty(config, "supabase", {
    enumerable: true,
    configurable: true,
    get: () => ({
      url: required("SUPABASE_URL"),
      serviceRoleKey: resolveServiceRoleKey(),
    }),
  });

  cached = config;
  return cached;
}

/** Test seam: drops the memoised config so env changes take effect. */
export function resetConfigCache(): void {
  cached = null;
}
