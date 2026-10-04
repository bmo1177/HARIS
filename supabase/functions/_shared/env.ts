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

  cached = {
    llm: {
      apiKey: required("LLM_API_KEY"),
      baseUrl: (optional("LLM_BASE_URL") ?? "https://openrouter.ai/api/v1")
        .replace(/\/+$/, ""),
      model: optional("LLM_MODEL") ?? "google/gemini-3.5-flash",
      timeoutMs: positiveInt("LLM_TIMEOUT_MS", 20_000),
      maxTokens: positiveInt("LLM_MAX_TOKENS", 1_200),
    },
    supabase: {
      url: required("SUPABASE_URL"),
      serviceRoleKey: required("SUPABASE_SERVICE_ROLE_KEY"),
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
  };

  return cached;
}

/** Test seam: drops the memoised config so env changes take effect. */
export function resetConfigCache(): void {
  cached = null;
}
