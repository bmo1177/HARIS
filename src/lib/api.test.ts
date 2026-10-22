import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { z } from "zod";
import { HarisError, invokeHarisFunction } from "@/lib/api";

/**
 * The client half of the `Retry-After` contract.
 *
 * The server sets the header when it knows when a rate limit lifts; these
 * tests pin that the header survives the trip into a `HarisError`, because the
 * previous version sent it and the client dropped it.
 */

vi.mock("@/lib/env", () => ({
  isConfigured: true,
  missingEnv: [],
  functionsBaseUrl: "https://example.supabase.co/functions/v1",
  supabasePublishableKey: "sb_publishable_test",
}));

const schema = z.object({ ok: z.boolean() });

const respondWith = (status: number, headers: Record<string, string>, body: unknown) => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () =>
      new Response(JSON.stringify(body), {
        status,
        headers: { "Content-Type": "application/json", ...headers },
      }),
    ),
  );
};

beforeEach(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("invokeHarisFunction", () => {
  it("carries Retry-After into the error", async () => {
    respondWith(
      429,
      { "Retry-After": "20", "X-Request-Id": "req-1" },
      { error: "Too many requests.", code: "rate_limited", requestId: "req-1" },
    );

    const error = await invokeHarisFunction("analyze-message", {}, schema).catch(
      (caught: unknown) => caught,
    );

    expect(error).toBeInstanceOf(HarisError);
    expect((error as HarisError).code).toBe("rate_limited");
    expect((error as HarisError).retryAfterSeconds).toBe(20);
  });

  it("leaves the wait undefined when the server did not say", async () => {
    respondWith(429, {}, { error: "Too many requests.", code: "rate_limited" });

    const error = await invokeHarisFunction("analyze-message", {}, schema).catch(
      (caught: unknown) => caught,
    );

    expect((error as HarisError).retryAfterSeconds).toBeUndefined();
  });

  it("ignores a malformed Retry-After rather than trusting NaN", async () => {
    respondWith(429, { "Retry-After": "soon" }, { error: "Too many requests." });

    const error = await invokeHarisFunction("analyze-message", {}, schema).catch(
      (caught: unknown) => caught,
    );

    expect((error as HarisError).retryAfterSeconds).toBeUndefined();
  });

  it("ignores a negative Retry-After", async () => {
    respondWith(429, { "Retry-After": "-5" }, { error: "Too many requests." });

    const error = await invokeHarisFunction("analyze-message", {}, schema).catch(
      (caught: unknown) => caught,
    );

    expect((error as HarisError).retryAfterSeconds).toBeUndefined();
  });

  it("gives up on a request that never answers", async () => {
    vi.useFakeTimers();
    // A fetch that only ever rejects when the signal aborts.
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init.signal?.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError")),
            );
          }),
      ),
    );

    const pending = invokeHarisFunction("analyze-message", {}, schema).catch(
      (caught: unknown) => caught,
    );
    // The client must wait longer than the server's whole budget, so that the
    // server wins the race rather than the browser abandoning a request that
    // was about to succeed.
    await vi.advanceTimersByTimeAsync(80_001);
    const error = await pending;

    expect((error as HarisError).code).toBe("timeout");
    vi.useRealTimers();
  });

  it("does not report a caller cancellation as a timeout", async () => {
    const controller = new AbortController();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (_url: string, init: RequestInit) =>
          new Promise<Response>((_resolve, reject) => {
            init.signal?.addEventListener("abort", () =>
              reject(new DOMException("Aborted", "AbortError")),
            );
          }),
      ),
    );

    const pending = invokeHarisFunction(
      "analyze-message",
      {},
      schema,
      controller.signal,
    ).catch((caught: unknown) => caught);
    controller.abort();
    const error = await pending;

    // The two must stay distinguishable: a timeout is worth retrying, a cancel
    // is not.
    expect((error as { code?: string }).code).not.toBe("timeout");
  });
});
