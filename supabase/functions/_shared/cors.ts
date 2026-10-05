/**
 * CORS handling.
 *
 * The previous implementation sent `Access-Control-Allow-Origin: *` to every
 * response, which let any web page call these functions from a visitor's
 * browser. We now only echo back an allowlisted origin.
 *
 * Important caveat, deliberately not papered over: CORS is a browser
 * mechanism. `curl`, Postman or a script ignore it entirely, so an allowlist is
 * *not* access control and is not treated as such here. The controls that
 * actually bound abuse are the rate limiter (`rateLimit.ts`), the request size
 * caps in `schemas.ts`, and `LLM_MAX_TOKENS`.
 *
 * Requests with no `Origin` header (non-browser clients) are permitted through,
 * because denying them would break nothing legitimate while pretending to
 * provide security they do not provide. They remain subject to rate limiting.
 */

import { getConfig } from "./env.ts";

const ALLOWED_HEADERS = [
  "authorization",
  "x-client-info",
  "apikey",
  "content-type",
  "x-supabase-client-platform",
  "x-supabase-client-platform-version",
  "x-supabase-client-runtime",
  "x-supabase-client-runtime-version",
].join(", ");

const ALLOWED_METHODS = "POST, OPTIONS";

export function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin");
  const allowed = origin !== null && getConfig().allowedOrigins.includes(origin);

  const headers: Record<string, string> = {
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Access-Control-Allow-Methods": ALLOWED_METHODS,
    "Access-Control-Max-Age": "86400",
    // Caches must not serve one origin's response to another.
    Vary: "Origin",
  };

  if (origin !== null) {
    headers["Access-Control-Allow-Origin"] = allowed ? origin : "null";
  }

  return headers;
}
