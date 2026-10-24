import { assertEquals, assertRejects } from "jsr:@std/assert@1";
import { createHandler, RequestError } from "./http.ts";
import { resetConfigCache } from "./env.ts";
import {
  clientIdentity,
  enforceRateLimit,
  resetKvHandle,
  resetMemoryBuckets,
  secondsUntilWindowReset,
  selectedRateLimitBackend,
} from "./rateLimit.ts";

/**
 * Rate limiting now has three possible backends because HARIS runs on two
 * hosts. The important properties are:
 *
 *   - the backend is chosen without requiring the wrong host's credentials;
 *   - Supabase still wins when its credentials are present, including on
 *     Supabase's own runtime (which also sets `DENO_DEPLOYMENT_ID`);
 *   - the in-process backend actually enforces a limit and tells the caller
 *     when to retry.
 */

async function withEnv(
  vars: Record<string, string | undefined>,
  fn: () => Promise<void> | void,
): Promise<void> {
  const saved = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(vars)) {
    saved.set(key, Deno.env.get(key));
    if (value === undefined) Deno.env.delete(key);
    else Deno.env.set(key, value);
  }
  resetConfigCache();
  try {
    await fn();
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) Deno.env.delete(key);
      else Deno.env.set(key, value);
    }
    resetConfigCache();
  }
}

const NO_SUPABASE = {
  SUPABASE_URL: undefined,
  SUPABASE_SECRET_KEYS: undefined,
  SUPABASE_SERVICE_ROLE_KEY: undefined,
};

Deno.test("secondsUntilWindowReset returns the time left in the current window", () => {
  const now = Math.floor(Date.now() / 1000);
  const remaining = secondsUntilWindowReset(60);

  assertEquals(remaining >= 1 && remaining <= 60, true);
  // The bucket key is aligned to multiples of the window since the epoch (see
  // `bump_rate_limit`), so the next rollover is exactly `remaining` seconds
  // away and lands on a window boundary.
  assertEquals((now + remaining) % 60, 0);
});

Deno.test("the client identity prefers the original address in x-forwarded-for", () => {
  const request = new Request("https://example.com", {
    headers: { "x-forwarded-for": "203.0.113.9, 10.0.0.1", "x-real-ip": "10.0.0.1" },
  });

  assertEquals(clientIdentity(request), "203.0.113.9");
});

Deno.test("the client identity falls back to the host header, then to unknown", () => {
  assertEquals(
    clientIdentity(
      new Request("https://example.com", { headers: { "cf-connecting-ip": "198.51.100.4" } }),
    ),
    "198.51.100.4",
  );
  assertEquals(clientIdentity(new Request("https://example.com")), "unknown");
});

Deno.test("Supabase credentials keep the Postgres limiter, even on Deno Deploy", async () => {
  await withEnv(
    {
      DENO_DEPLOYMENT_ID: "deployment-1",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SECRET_KEYS: '{"default":"sb_secret_x"}',
      SUPABASE_SERVICE_ROLE_KEY: undefined,
      RATE_LIMIT_BACKEND: undefined,
    },
    () => {
      // Supabase Edge Functions also expose DENO_DEPLOYMENT_ID. Selecting KV
      // there would break the deployment that already has a working limiter.
      assertEquals(selectedRateLimitBackend(), "supabase");
    },
  );
});

Deno.test("Deno Deploy without Supabase credentials selects Deno KV", async () => {
  await withEnv(
    {
      DENO_DEPLOYMENT_ID: "deployment-1",
      ...NO_SUPABASE,
      RATE_LIMIT_BACKEND: undefined,
    },
    () => {
      assertEquals(selectedRateLimitBackend(), "kv");
    },
  );
});

Deno.test("a local process without credentials selects memory", async () => {
  await withEnv(
    {
      DENO_DEPLOYMENT_ID: undefined,
      ...NO_SUPABASE,
      RATE_LIMIT_BACKEND: undefined,
    },
    () => {
      assertEquals(selectedRateLimitBackend(), "memory");
    },
  );
});

Deno.test("an explicit backend overrides automatic selection", async () => {
  await withEnv(
    {
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SECRET_KEYS: '{"default":"sb_secret_x"}',
      RATE_LIMIT_BACKEND: "memory",
    },
    () => {
      assertEquals(selectedRateLimitBackend(), "memory");
    },
  );
});

Deno.test("the memory backend enforces the minute limit and says when to retry", async () => {
  await withEnv(
    {
      LLM_API_KEY: "sk-test",
      RATE_LIMIT_BACKEND: "memory",
      RATE_LIMIT_MAX: "2",
      RATE_LIMIT_WINDOW_SECONDS: "60",
      DAILY_RATE_LIMIT_MAX: "100",
      ...NO_SUPABASE,
    },
    async () => {
      resetMemoryBuckets();
      const request = () =>
        new Request("https://example.com", {
          method: "POST",
          body: "{}",
          headers: { "x-forwarded-for": "203.0.113.10" },
        });

      await enforceRateLimit(request(), "memory-limit-test");
      await enforceRateLimit(request(), "memory-limit-test");

      const error = await assertRejects(
        () => enforceRateLimit(request(), "memory-limit-test"),
        RequestError,
      );

      assertEquals(error.code, "rate_limited");
      assertEquals(typeof error.retryAfterSeconds, "number");
      assertEquals((error.retryAfterSeconds ?? 0) >= 1, true);
    },
  );
});

/**
 * The KV backend is what protects the Deno Deploy deployment, so it needs a
 * test that would fail if the counter silently stopped counting.
 *
 * That is not hypothetical: the first implementation stored a plain `bigint`.
 * Deno KV does not return bigints as-is, so the read came back `undefined` and
 * every request looked like the first one — the limit could never trip. A test
 * that only asserted "no error was thrown" would have passed.
 *
 * `:memory:` gives an isolated database per `openKv`, so this cannot touch a
 * real deployment. The handle is a module-level cache, hence the reset. The
 * test skips rather than fails when Deno was started without `--unstable-kv`,
 * which is what `npm run test:deno` and CI pass.
 */
Deno.test({
  name: "the KV backend counts across requests and enforces the limit",
  ignore: typeof Deno.openKv !== "function",
  fn: async () => {
    try {
      await withEnv(
        {
          LLM_API_KEY: "sk-test",
          RATE_LIMIT_BACKEND: "kv",
          DENO_KV_PATH: ":memory:",
          RATE_LIMIT_MAX: "2",
          RATE_LIMIT_WINDOW_SECONDS: "60",
          DAILY_RATE_LIMIT_MAX: "100",
          ...NO_SUPABASE,
        },
        async () => {
          resetKvHandle();
          const request = () =>
            new Request("https://example.com", {
              method: "POST",
              body: "{}",
              headers: { "x-forwarded-for": "203.0.113.11" },
            });

          assertEquals(selectedRateLimitBackend(), "kv");
          await enforceRateLimit(request(), "kv-limit-test");
          await enforceRateLimit(request(), "kv-limit-test");

          const error = await assertRejects(
            () => enforceRateLimit(request(), "kv-limit-test"),
            RequestError,
          );

          assertEquals(error.code, "rate_limited");
          assertEquals((error.retryAfterSeconds ?? 0) >= 1, true);
        },
      );
    } finally {
      resetKvHandle();
    }
  },
});

Deno.test("a rate limit says how long to wait, in a Retry-After header", async () => {
  // `Promise.reject` rather than an `async` function that only throws: the
  // lint rule `require-await` rejects an async callback with no await.
  const handler = createHandler(() =>
    Promise.reject(new RequestError("rate_limited", "per-minute quota exhausted", 42))
  );

  const response = await handler(
    new Request("https://example.com", { method: "POST", body: "{}" }),
  );

  assertEquals(response.status, 429);
  assertEquals(response.headers.get("Retry-After"), "42");
});

Deno.test("an error with no known wait sends no Retry-After header", async () => {
  const handler = createHandler(() => Promise.reject(new RequestError("internal_error", "boom")));

  const response = await handler(
    new Request("https://example.com", { method: "POST", body: "{}" }),
  );

  assertEquals(response.status, 500);
  assertEquals(response.headers.get("Retry-After"), null);
});
