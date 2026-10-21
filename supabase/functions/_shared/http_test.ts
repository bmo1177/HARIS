import { assertEquals } from "jsr:@std/assert@1";
import { createHandler } from "./http.ts";
import { generateStructured } from "./llm.ts";
import { resetConfigCache } from "./env.ts";

/**
 * What a rejected provider key looks like from the outside.
 *
 * A rotated, expired or mistyped key is answered by the provider with a 401.
 * That used to be reported to the student as `upstream_error` — "the analysis
 * could not be completed" — which is both untrue (the analysis was never
 * attempted) and useless to whoever has to fix it. The failure was only
 * identifiable from a server log line.
 *
 * It now has its own code, and these tests pin the whole chain: provider 401 →
 * `UpstreamError` → the `provider_unauthorized` envelope.
 */

const SCHEMA = {
  type: "object",
  properties: { answer: { type: "string" } },
  required: ["answer"],
} as const;

const withStubbedFetch = async (
  status: number,
  body: string,
  fn: () => Promise<void>,
): Promise<void> => {
  const original = globalThis.fetch;
  globalThis.fetch = (() =>
    Promise.resolve(
      new Response(body, {
        status,
        headers: { "Content-Type": "application/json" },
      }),
    )) as typeof globalThis.fetch;

  const savedKey = Deno.env.get("LLM_API_KEY");
  Deno.env.set("LLM_API_KEY", "sk-test");
  resetConfigCache();

  try {
    await fn();
  } finally {
    globalThis.fetch = original;
    if (savedKey === undefined) Deno.env.delete("LLM_API_KEY");
    else Deno.env.set("LLM_API_KEY", savedKey);
    resetConfigCache();
  }
};

Deno.test("a provider 401 surfaces as provider_unauthorized, not upstream_error", async () => {
  await withStubbedFetch(
    401,
    JSON.stringify({ error: { message: "User not found." } }),
    async () => {
      const handler = createHandler(async () => {
        await generateStructured({
          system: "s",
          user: "u",
          schemaName: "x",
          schema: SCHEMA as unknown as Record<string, unknown>,
        });
        return new Response("unreachable");
      });

      const response = await handler(
        new Request("https://example.com", { method: "POST", body: "{}" }),
      );
      const body = await response.json();

      assertEquals(response.status, 503);
      assertEquals(body.code, "provider_unauthorized");
      // The student is told HARIS cannot reach the provider, not that their
      // message failed to analyse.
      assertEquals(body.error.includes("could not be completed"), false);
    },
  );
});

Deno.test("a provider 403 is treated the same way", async () => {
  await withStubbedFetch(403, JSON.stringify({ error: { message: "Forbidden" } }), async () => {
    const handler = createHandler(async () => {
      await generateStructured({
        system: "s",
        user: "u",
        schemaName: "x",
        schema: SCHEMA as unknown as Record<string, unknown>,
      });
      return new Response("unreachable");
    });

    const response = await handler(
      new Request("https://example.com", { method: "POST", body: "{}" }),
    );
    const body = await response.json();

    assertEquals(body.code, "provider_unauthorized");
  });
});

Deno.test("a provider 500 is still an upstream error", async () => {
  await withStubbedFetch(500, JSON.stringify({ error: { message: "boom" } }), async () => {
    const handler = createHandler(async () => {
      await generateStructured({
        system: "s",
        user: "u",
        schemaName: "x",
        schema: SCHEMA as unknown as Record<string, unknown>,
      });
      return new Response("unreachable");
    });

    const response = await handler(
      new Request("https://example.com", { method: "POST", body: "{}" }),
    );
    const body = await response.json();

    // A 500 is a model failure, and must not be reported as a key problem.
    assertEquals(body.code, "upstream_error");
  });
});
