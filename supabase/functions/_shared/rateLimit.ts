/**
 * Fixed-window rate limiting.
 *
 * The functions were previously an open, unmetered proxy: no auth, no quota,
 * `Access-Control-Allow-Origin: *`, and no cap on request size or output
 * tokens. Anyone who found the URL could drain the AI budget at will.
 *
 * This remains defence against *cost* abuse, not an authentication system. HARIS
 * is deliberately usable without an account (the audience is secondary-school
 * students), so there is no identity to rate-limit against beyond the client IP.
 *
 * ## Why there is more than one backend
 *
 * Counters cannot live in process memory on a serverless host: isolates are
 * short-lived and horizontally scaled, so an in-memory counter resets on every
 * cold start and is trivially multiplied by spinning up instances. That is why
 * the original implementation used Postgres.
 *
 * HARIS now also runs on Deno Deploy, where Supabase does not exist. Deno KV
 * gives the same cross-isolate property without a second account, so it is the
 * default there. Memory remains for local development and for the eval harness,
 * where a single process is the only thing making requests, and the limiter is
 * explicitly documented as best-effort.
 *
 * The backend is chosen once per request:
 *
 *   1. `RATE_LIMIT_BACKEND` when set to `supabase`, `kv` or `memory`;
 *   2. Supabase when its credentials are present — so the existing deployment
 *      keeps the stronger limiter, including on Supabase's own runtime;
 *   3. Deno KV when running on Deno Deploy;
 *   4. memory otherwise.
 */

import { getConfig, hasSupabaseConfig, type RateLimitConfig } from "./env.ts";
import { RequestError } from "./http.ts";

const RPC_PATH = "/rest/v1/rpc/bump_rate_limit";

export type RateLimitBackend = "supabase" | "kv" | "memory";

export function selectedRateLimitBackend(): RateLimitBackend {
  const explicit = Deno.env.get("RATE_LIMIT_BACKEND")?.trim().toLowerCase();
  if (explicit === "supabase" || explicit === "kv" || explicit === "memory") {
    return explicit;
  }

  // Supabase's own Edge Function runtime also exposes `DENO_DEPLOYMENT_ID`, so
  // the credential check must come first: otherwise the deployment that has a
  // working Postgres limiter would be moved onto a KV store its runtime does
  // not provide.
  if (hasSupabaseConfig()) return "supabase";
  if (Deno.env.get("DENO_DEPLOYMENT_ID")) return "kv";
  return "memory";
}

/**
 * Best-effort client identity. Every supported host sets at least one of these
 * headers; the left-most `x-forwarded-for` entry is the original client.
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

/**
 * In-process counters.
 *
 * Only correct for a single process. Deno Deploy and Supabase both select a
 * different backend automatically; this exists for local runs and tests, and
 * must not be presented as a hard quota in a multi-isolate deployment.
 */
const memoryBuckets = new Map<string, { count: number; expiresAt: number }>();

/** Test seam: clears the in-process counters between cases. */
export function resetMemoryBuckets(): void {
  memoryBuckets.clear();
}

function bumpMemory(key: string, windowSeconds: number): number {
  const windowMs = windowSeconds * 1_000;
  const bucket = Math.floor(Date.now() / windowMs);
  const bucketKey = `${key}:${bucket}`;
  const now = Date.now();
  const current = memoryBuckets.get(bucketKey);
  const count = (current && current.expiresAt > now ? current.count : 0) + 1;

  memoryBuckets.set(bucketKey, { count, expiresAt: (bucket + 1) * windowMs });

  // Keep a long-running local process from growing the map without bound. The
  // sweep is cheap and only runs once the map is large enough to matter.
  if (memoryBuckets.size > 10_000) {
    for (const [candidate, entry] of memoryBuckets) {
      if (entry.expiresAt <= now) memoryBuckets.delete(candidate);
    }
  }

  return count;
}

let kvHandle: Deno.Kv | null = null;
let kvUnavailable = false;

/** Test seam: closes the handle so an in-memory database can be reopened. */
export function resetKvHandle(): void {
  try {
    kvHandle?.close();
  } catch {
    // Already closed; nothing to release.
  }
  kvHandle = null;
  kvUnavailable = false;
}

function openKv(): Promise<Deno.Kv | null> {
  if (kvHandle) return Promise.resolve(kvHandle);
  if (kvUnavailable) return Promise.resolve(null);

  if (typeof Deno.openKv !== "function") {
    kvUnavailable = true;
    console.warn("Deno KV is not available; rate limiting falls back to process memory");
    return Promise.resolve(null);
  }

  // Deno Deploy supplies the connection implicitly. Locally, Deno KV serialises
  // to a file beside the working directory unless a path is given, so tests and
  // local runs can point it at `:memory:` with `DENO_KV_PATH`.
  const path = Deno.env.get("DENO_KV_PATH")?.trim() || undefined;

  try {
    return Deno.openKv(path).then((handle) => {
      kvHandle = handle;
      return handle;
    }).catch((error: unknown) => {
      kvUnavailable = true;
      console.warn(
        "could not open Deno KV; rate limiting falls back to process memory:",
        error instanceof Error ? error.message : error,
      );
      return null;
    });
  } catch (error) {
    kvUnavailable = true;
    console.warn(
      "could not open Deno KV; rate limiting falls back to process memory:",
      error instanceof Error ? error.message : error,
    );
    return Promise.resolve(null);
  }
}

async function bumpKv(key: string, windowSeconds: number): Promise<number> {
  const db = await openKv();
  if (!db) return bumpMemory(key, windowSeconds);

  const windowMs = windowSeconds * 1_000;
  const bucket = Math.floor(Date.now() / windowMs);
  const kvKey: Deno.KvKey = ["rate_limit", key, bucket];

  try {
    // Read-check-set rather than `atomic().sum()`: the counter needs a TTL, and
    // `sum` cannot set one. Five attempts is enough to absorb normal contention
    // between isolates; after that the request still counts, just without a
    // refreshed expiry.
    for (let attempt = 0; attempt < 5; attempt++) {
      const entry = await db.get<number>(kvKey);
      const next = (entry.value ?? 0) + 1;
      const result = await db.atomic()
        .check({ key: kvKey, versionstamp: entry.versionstamp })
        .set(kvKey, next, { expireIn: windowMs * 2 })
        .commit();
      if (result.ok) return next;
    }

    const entry = await db.get<number>(kvKey);
    return entry.value ?? 0;
  } catch (error) {
    // Fail closed, for the same reason the Postgres path does: if requests
    // cannot be counted, spend cannot be bounded.
    console.error(
      "rate limit KV operation failed:",
      error instanceof Error ? error.message : error,
    );
    throw new RequestError("service_unavailable", "rate limiter unavailable");
  }
}

async function bumpSupabase(
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

async function bump(key: string, windowSeconds: number): Promise<number | null> {
  switch (selectedRateLimitBackend()) {
    case "supabase":
      return await bumpSupabase(key, windowSeconds);
    case "kv":
      return await bumpKv(key, windowSeconds);
    case "memory":
      return bumpMemory(key, windowSeconds);
  }
}

/**
 * Seconds until the current fixed window rolls over.
 *
 * The bucket key is aligned to multiples of `window_seconds` since the epoch
 * (see `bump_rate_limit` in the migration), so the remaining time is the
 * remainder of the current window — not a guess, and not the full window.
 */
export function secondsUntilWindowReset(windowSeconds: number): number {
  const now = Math.floor(Date.now() / 1000);
  return Math.max(1, windowSeconds - (now % windowSeconds));
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
  const backend = selectedRateLimitBackend();

  const dailyCount = await bump(
    `${scope}:day:${identity}`,
    config.dailyRateLimit.windowSeconds,
  );
  if (dailyCount !== null && dailyCount > config.dailyRateLimit.max) {
    throw new RequestError(
      "rate_limited",
      "daily quota exhausted",
      secondsUntilWindowReset(config.dailyRateLimit.windowSeconds),
    );
  }

  const minuteCount = await bump(
    `${scope}:min:${identity}`,
    minuteLimit.windowSeconds,
  );
  if (minuteCount !== null && minuteCount > minuteLimit.max) {
    throw new RequestError(
      "rate_limited",
      "per-minute quota exhausted",
      secondsUntilWindowReset(minuteLimit.windowSeconds),
    );
  }

  // Amortised cleanup so the Postgres bucket table cannot grow without bound.
  // One request in fifty sweeps rows that can no longer affect a decision. KV
  // entries expire on their own, and the memory map sweeps itself.
  if (
    backend === "supabase" &&
    crypto.getRandomValues(new Uint8Array(1))[0] % 50 === 0
  ) {
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
