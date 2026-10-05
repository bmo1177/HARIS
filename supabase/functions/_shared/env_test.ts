import { assertEquals, assertThrows } from "jsr:@std/assert@1";
import { getConfig, resetConfigCache } from "./env.ts";

/**
 * The eval harness calls the LLM path and never touches the database, so it must
 * not need Supabase credentials. When `getConfig()` resolved both sections
 * eagerly, every one of the 45 eval cases failed with "Missing required
 * environment variable: SUPABASE_URL" — a failure unrelated to the model under
 * test, which is easy to misread as a bad score rather than a broken harness.
 */

function withEnv(vars: Record<string, string | undefined>, fn: () => void): void {
  const saved = new Map<string, string | undefined>();
  for (const [key, value] of Object.entries(vars)) {
    saved.set(key, Deno.env.get(key));
    if (value === undefined) Deno.env.delete(key);
    else Deno.env.set(key, value);
  }
  resetConfigCache();
  try {
    fn();
  } finally {
    for (const [key, value] of saved) {
      if (value === undefined) Deno.env.delete(key);
      else Deno.env.set(key, value);
    }
    resetConfigCache();
  }
}

Deno.test("the LLM config resolves with no Supabase credentials present", () => {
  withEnv(
    {
      LLM_API_KEY: "sk-test",
      SUPABASE_URL: undefined,
      SUPABASE_SECRET_KEYS: undefined,
      SUPABASE_SERVICE_ROLE_KEY: undefined,
    },
    () => {
      const { llm } = getConfig();
      assertEquals(llm.apiKey, "sk-test");
      // Reading it must not have resolved the database section.
      assertEquals(llm.model.length > 0, true);
    },
  );
});

Deno.test("the Supabase section still throws when genuinely needed", () => {
  // Laziness must not become silence: a caller that really does need the database
  // still gets a clear error rather than undefined.
  withEnv(
    {
      LLM_API_KEY: "sk-test",
      SUPABASE_URL: undefined,
      SUPABASE_SECRET_KEYS: undefined,
      SUPABASE_SERVICE_ROLE_KEY: undefined,
    },
    () => {
      assertThrows(() => getConfig().supabase.url, Error, "SUPABASE_URL");
    },
  );
});

Deno.test("the Supabase section resolves once its variables are present", () => {
  withEnv(
    {
      LLM_API_KEY: "sk-test",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SECRET_KEYS: '{"default":"sb_secret_x"}',
      SUPABASE_SERVICE_ROLE_KEY: undefined,
    },
    () => {
      assertEquals(getConfig().supabase.url, "https://example.supabase.co");
    },
  );
});

Deno.test("a missing LLM key still fails fast", () => {
  withEnv({ LLM_API_KEY: undefined }, () => {
    assertThrows(() => getConfig(), Error, "LLM_API_KEY");
  });
});

Deno.test("the injected dictionary supplies the key without the deprecated JWT", () => {
  // Supabase injects SUPABASE_SECRET_KEYS as a JSON object, and the legacy
  // SUPABASE_SERVICE_ROLE_KEY JWT is on a deprecation path. If the dictionary
  // were only consulted as a fallback, every modern project would still depend
  // on the deprecated variable — which is the opposite of the intent.
  withEnv(
    {
      LLM_API_KEY: "sk-test",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SECRET_KEYS: '{"default":"sb_secret_from_dictionary"}',
      SUPABASE_SERVICE_ROLE_KEY: undefined,
    },
    () => {
      assertEquals(getConfig().supabase.serviceRoleKey, "sb_secret_from_dictionary");
    },
  );
});

Deno.test("a non-JSON SUPABASE_SECRET_KEYS falls back to the legacy variable", () => {
  withEnv(
    {
      LLM_API_KEY: "sk-test",
      SUPABASE_URL: "https://example.supabase.co",
      SUPABASE_SECRET_KEYS: "not-json",
      SUPABASE_SERVICE_ROLE_KEY: "legacy-jwt",
    },
    () => {
      assertEquals(getConfig().supabase.serviceRoleKey, "legacy-jwt");
    },
  );
});
