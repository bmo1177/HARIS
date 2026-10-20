import { assertEquals } from "jsr:@std/assert@1";
import { createHandler, RequestError } from "./http.ts";
import { secondsUntilWindowReset } from "./rateLimit.ts";

Deno.test("secondsUntilWindowReset returns the time left in the current window", () => {
  const now = Math.floor(Date.now() / 1000);
  const remaining = secondsUntilWindowReset(60);

  assertEquals(remaining >= 1 && remaining <= 60, true);
  // The bucket key is aligned to multiples of the window since the epoch (see
  // `bump_rate_limit`), so the next rollover is exactly `remaining` seconds
  // away and lands on a window boundary.
  assertEquals((now + remaining) % 60, 0);
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
