/**
 * Database-backed fixed-window rate limiting.
 *
 * The functions were previously an open, unmetered proxy: no auth, no quota,
 * `Access-Control-Allow-Origin: *`, and no cap on request size or output
 * tokens. Anyone who found the URL could drain the AI budget at will.
 *
 * Counters live in Postgres rather than process memory because edge isolates
 * are short-lived and horizontally scaled — an in-memory counter resets on every
 * cold start and is trivially multiplied by spinning up instances.
 *
 * This remains defence against *cost* abuse, not an authentication system. HARIS
 * is deliberately usable without an account (the audience is secondary-school
 * students), so there is no identity to rate-limit against beyond the client IP.
 */

import { getConfig, type RateLimitConfig } from "./env.ts";
import { RequestError } from "./http.ts";

const RPC_PATH = "/rest/v1/rpc/bump_rate_limit";

/**
 * Best-effort client identity. Supabase fronts every request with
 * `x-forwarded-for`; the left-most entry is the original client.
 */
export function clientIdentity(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim();
  if (ip) return ip;

  return (
    req.headers.get("cf-connecting-ip")?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

async function bump(
  key: string,
  windowSeconds: number,
): Promise<number | null> {
  const { supabase } = getConfig();

  const response = await fetch(`${supabase.url}${RPC_PATH}`, {
    method: "POST",
    headers: {
      apikey: supabase.serviceRoleKey,
      Authorization: `Bearer ${supabase.serviceRoleKey}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({ p_key: key, p_window_seconds: windowSeconds }),
    signal: AbortSignal.timeout(5_000),
  });

  if (!response.ok) {
    // Fail closed. If we cannot count requests we cannot bound spend, and an
    // unbounded LLM endpoint is exactly the problem this module exists to fix.
    console.error(
      "rate limit RPC failed:",
      response.status,
      await response.text(),
    );
    throw new RequestError("service_unavailable", "rate limiter unavailable");
  }

  const body = await response.text();
  const count = Number.parseInt(body, 10);
  return Number.isFinite(count) ? count : null;
}

/**
 * Enforces both a short and a long window. The minute window smooths bursts;
 * the daily window is the real ceiling on cost per client.
 */
export async function enforceRateLimit(
  req: Request,
  scope: string,
  override?: RateLimitConfig,
): Promise<void> {
  const config = getConfig();
  const minuteLimit = override ?? config.rateLimit;
  const identity = clientIdentity(req);

  const dailyCount = await bump(
    `${scope}:day:${identity}`,
    config.dailyRateLimit.windowSeconds,
  );
  if (dailyCount !== null && dailyCount > config.dailyRateLimit.max) {
    throw new RequestError("rate_limited", "daily quota exhausted");
  }

  const minuteCount = await bump(
    `${scope}:min:${identity}`,
    minuteLimit.windowSeconds,
  );
  if (minuteCount !== null && minuteCount > minuteLimit.max) {
    throw new RequestError("rate_limited", "per-minute quota exhausted");
  }

  // Amortised cleanup so the bucket table cannot grow without bound. One
  // request in fifty sweeps rows that can no longer affect a decision.
  if (crypto.getRandomValues(new Uint8Array(1))[0] % 50 === 0) {
    void sweepStaleBuckets();
  }
}

async function sweepStaleBuckets(): Promise<void> {
  const { supabase } = getConfig();

  try {
    await fetch(
      `${supabase.url}/rest/v1/rate_limit_buckets?window_start=lt.${Date.now() / 1000 - 172_800}`,
      {
        method: "DELETE",
        headers: {
          apikey: supabase.serviceRoleKey,
          Authorization: `Bearer ${supabase.serviceRoleKey}`,
          Prefer: "return=minimal",
        },
        signal: AbortSignal.timeout(5_000),
      },
    );
  } catch (error) {
    // Housekeeping only; never surface to the caller.
    console.warn(
      "rate limit sweep failed:",
      error instanceof Error ? error.message : error,
    );
  }
}
