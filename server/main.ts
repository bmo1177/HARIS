/**
 * Deno Deploy entrypoint.
 *
 * Run this process, and it serves the HARIS backend on `PORT` (8000 by
 * default). The routes themselves live in `router.ts`; this file only opens the
 * listener, so it has no import-time side effect on the test suite.
 *
 * Deploy:
 *   - create an app from this repository,
 *   - set the entrypoint to `server/main.ts`,
 *   - provision and assign a Deno KV database (the rate limiter uses it),
 *   - add `LLM_API_KEY` (and the optional `LLM_*` / `ALLOWED_ORIGINS` values)
 *     as environment variables,
 *   - point the frontend at the app with `VITE_HARIS_API_URL`.
 *
 * Local:
 *   npm run serve
 *
 * `RATE_LIMIT_BACKEND` is chosen automatically: Supabase when its credentials
 * exist, Deno KV on Deno Deploy, process memory elsewhere. See `README.md`.
 */

import { describeOrigins, route } from "./router.ts";

const port = Number.parseInt(Deno.env.get("PORT") ?? "8000", 10);

// Logged once, at boot: if the allowlist is wrong, the CORS rejection is silent
// in the browser and this line is the fastest way to see why.
console.log(`HARIS backend listening on :${port} (origins: ${describeOrigins()})`);

Deno.serve({ port }, route);
