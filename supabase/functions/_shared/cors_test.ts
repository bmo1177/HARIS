import { assertEquals } from "jsr:@std/assert@1";
import { corsHeaders } from "./cors.ts";

/**
 * CORS is not just about who may call the functions. It also decides what the
 * browser lets JavaScript *read* from the response.
 *
 * Only a small safelist (Cache-Control, Content-Type, ...) is readable by
 * default. `Retry-After` and `X-Request-Id` are not on it, so without an
 * explicit `Access-Control-Expose-Headers` the browser strips them and the
 * client never sees them — even though the server sent them. The rate limit's
 * retry hint and the error's correlation id were both invisible for exactly
 * this reason.
 */

Deno.test("corsHeaders exposes the headers the client reads", () => {
  const headers = corsHeaders(new Request("https://example.com"));
  const exposed = (headers["Access-Control-Expose-Headers"] ?? "").toLowerCase();

  assertEquals(exposed.includes("retry-after"), true);
  assertEquals(exposed.includes("x-request-id"), true);
});

Deno.test("corsHeaders keeps the origin allowlist intact", () => {
  const headers = corsHeaders(new Request("https://example.com"));
  assertEquals(headers["Access-Control-Allow-Methods"], "POST, OPTIONS");
  // No Origin header means a non-browser client, which is allowed through.
  assertEquals(headers["Access-Control-Allow-Origin"], undefined);
});
