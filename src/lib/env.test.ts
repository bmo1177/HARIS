import { afterEach, describe, expect, it, vi } from "vitest";

/**
 * Backend selection is the one piece of client configuration that has to work
 * with *either* host. The failure this guards against is subtle: if the
 * standalone URL still required the Supabase variables, a Supabase-free
 * deployment would render the setup screen instead of the app.
 */

afterEach(() => {
  vi.unstubAllEnvs();
  vi.resetModules();
});

describe("backend configuration", () => {
  it("uses VITE_HARIS_API_URL without requiring Supabase", async () => {
    vi.stubEnv("VITE_HARIS_API_URL", "https://haris.deno.dev/");
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");

    const env = await import("./env");

    expect(env.usingStandaloneApi).toBe(true);
    expect(env.functionsBaseUrl).toBe("https://haris.deno.dev");
    expect(env.missingEnv).toEqual([]);
    expect(env.isConfigured).toBe(true);
    // No Supabase gateway means no `apikey` header; an empty key must not be
    // sent as if it were one.
    expect(env.supabasePublishableKey).toBe("");
  });

  it("keeps deriving the Edge Function URL when no standalone URL is set", async () => {
    vi.stubEnv("VITE_HARIS_API_URL", "");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co/");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");

    const env = await import("./env");

    expect(env.usingStandaloneApi).toBe(false);
    expect(env.functionsBaseUrl).toBe("https://example.supabase.co/functions/v1");
    expect(env.supabasePublishableKey).toBe("sb_publishable_test");
    expect(env.isConfigured).toBe(true);
  });

  it("prefers the standalone URL when both are configured", async () => {
    vi.stubEnv("VITE_HARIS_API_URL", "https://haris.deno.dev");
    vi.stubEnv("VITE_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");

    const env = await import("./env");

    expect(env.functionsBaseUrl).toBe("https://haris.deno.dev");
    expect(env.supabasePublishableKey).toBe("");
  });

  it("still reports missing Supabase variables when nothing is configured", async () => {
    vi.stubEnv("VITE_HARIS_API_URL", "");
    vi.stubEnv("VITE_SUPABASE_URL", "");
    vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "");

    const env = await import("./env");

    expect(env.isConfigured).toBe(false);
    expect(env.missingEnv).toEqual([
      "VITE_SUPABASE_URL",
      "VITE_SUPABASE_PUBLISHABLE_KEY",
    ]);
  });
});
