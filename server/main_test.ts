import { assertEquals } from "jsr:@std/assert@1";
import { resetConfigCache } from "../supabase/functions/_shared/env.ts";
import { resetMemoryBuckets } from "../supabase/functions/_shared/rateLimit.ts";
import { route } from "./router.ts";

/**
 * The router is the only new code between the browser and the handlers that
 * already exist. These tests pin the properties the deployment depends on:
 *
 *   - a healthy process says so, and a misconfigured one says so without
 *     leaking which variable is missing;
 *   - the paths the browser calls reach the right handler;
 *   - an unknown path is a 404, not a confusing 400 from a handler;
 *   - the safe error envelope still works when the deployment has no secrets
 *     at all (the CORS headers used to require the full config, which turned
 *     that case into an opaque platform 500).
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

const STANDALONE = {
  LLM_API_KEY: "sk-test",
  LLM_BASE_URL: "https://example.invalid/v1",
  RATE_LIMIT_BACKEND: "memory",
  SUPABASE_URL: undefined,
  SUPABASE_SECRET_KEYS: undefined,
  SUPABASE_SERVICE_ROLE_KEY: undefined,
  DENO_DEPLOYMENT_ID: undefined,
};

Deno.test("health is 200 when the process can read its configuration", async () => {
  await withEnv(STANDALONE, async () => {
    const response = await route(new Request("https://haris.example/health"));
    assertEquals(response.status, 200);
    assertEquals(await response.json(), { status: "ok", service: "haris" });
  });
});

Deno.test("health is 503 when the LLM key is missing, without naming it", async () => {
  await withEnv(
    { ...STANDALONE, LLM_API_KEY: undefined },
    async () => {
      const response = await route(new Request("https://haris.example/health"));
      assertEquals(response.status, 503);
      const body = await response.text();
      assertEquals(body.includes("LLM_API_KEY"), false);
      assertEquals(body.includes("misconfigured"), true);
    },
  );
});

Deno.test("a preflight request reaches CORS without any configuration", async () => {
  await withEnv({ LLM_API_KEY: undefined }, async () => {
    const response = await route(
      new Request("https://haris.example/voice-debrief", {
        method: "OPTIONS",
        headers: { Origin: "https://haris-two-xi.vercel.app" },
      }),
    );

    assertEquals(response.status, 204);
    assertEquals(
      response.headers.get("Access-Control-Allow-Origin"),
      "https://haris-two-xi.vercel.app",
    );
  });
});

Deno.test("a method the endpoints do not accept is a safe 400, not a crash", async () => {
  await withEnv({ LLM_API_KEY: undefined }, async () => {
    const response = await route(
      new Request("https://haris.example/analyze-message", { method: "GET" }),
    );

    assertEquals(response.status, 400);
    const body = await response.json() as { code?: string };
    assertEquals(body.code, "invalid_request");
  });
});

Deno.test("the three browser paths are mounted", async () => {
  await withEnv(STANDALONE, async () => {
    resetMemoryBuckets();

    for (
      const [index, path] of [
        "/analyze-message",
        "/scenario-feedback",
        "/voice-debrief",
      ].entries()
    ) {
      const response = await route(
        new Request(`https://haris.example${path}`, {
          method: "POST",
          body: "{}",
          headers: {
            "Content-Type": "application/json",
            "x-forwarded-for": `203.0.113.${20 + index}`,
          },
        }),
      );

      // `{}` is a valid JSON body but not a valid request, so the handler's own
      // schema rejects it. Reaching that 400 proves the route is mounted; a 404
      // or a 500 would mean it is not.
      assertEquals(response.status, 400, `${path} returned ${response.status}`);
      const body = await response.json() as { code?: string };
      assertEquals(body.code, "invalid_request");
    }
  });
});

Deno.test("an unknown path is a clear 404 with CORS headers", async () => {
  const response = await route(
    new Request("https://haris.example/not-a-function", {
      headers: { Origin: "https://haris-two-xi.vercel.app" },
    }),
  );

  assertEquals(response.status, 404);
  assertEquals(
    response.headers.get("Access-Control-Allow-Origin"),
    "https://haris-two-xi.vercel.app",
  );
});

Deno.test("a misconfigured deployment still answers with the safe error envelope", async () => {
  await withEnv({ ...STANDALONE, LLM_API_KEY: undefined }, async () => {
    const response = await route(
      new Request("https://haris.example/analyze-message", {
        method: "POST",
        body: "{}",
        headers: { "Content-Type": "application/json", "x-forwarded-for": "203.0.113.40" },
      }),
    );

    assertEquals(response.status, 503);
    const body = await response.json() as { code?: string; error?: string };
    assertEquals(body.code, "service_unavailable");
    assertEquals(typeof body.error, "string");
    assertEquals(body.error?.includes("LLM_API_KEY"), false);
  });
});
