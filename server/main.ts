/**
 * Deno Deploy entrypoint.
 *
 * HARIS used to run entirely on Supabase Edge Functions. That made Supabase a
 * single point of failure for the AI features: when the project host stopped
 * resolving, the browser could not reach any model even though the provider was
 * healthy. The analysis code was never Supabase-specific — only the host, the
 * rate-limit table and the secret storage were.
 *
 * This file mounts the *same* handlers the Edge Functions export, so there is
 * one implementation of the prompts and the validation, and a fix cannot land
 * on one host but not the other. Rate limiting is selected by
 * `_shared/rateLimit.ts`; on Deno Deploy it uses Deno KV.
 *
 * Deploy:
 *   - create an app from this repository,
 *   - set the entrypoint to `server/main.ts`,
 *   - add `LLM_API_KEY` (and the optional `LLM_*` / `ALLOWED_ORIGINS` values)
 *     as secrets,
 *   - point the frontend at the app with `VITE_HARIS_API_URL`.
 *
 * Local:
 *   deno run --allow-net --allow-env --allow-read server/main.ts
 *
 * `RATE_LIMIT_BACKEND=memory` is appropriate locally and `kv` on Deno Deploy.
 * See `README.md`.
 */

import { getAllowedOrigins, getConfig } from "../supabase/functions/_shared/env.ts";
import { corsHeaders } from "../supabase/functions/_shared/cors.ts";
import { analyzeMessageHandler } from "../supabase/functions/analyze-message/index.ts";
import { scenarioFeedbackHandler } from "../supabase/functions/scenario-feedback/index.ts";
import { voiceDebriefHandler } from "../supabase/functions/voice-debrief/index.ts";

export type RouteHandler = (req: Request) => Promise<Response>;

const ROUTES: Record<string, RouteHandler> = {
  "/analyze-message": analyzeMessageHandler,
  "/scenario-feedback": scenarioFeedbackHandler,
  "/voice-debrief": voiceDebriefHandler,
};

function json(
  req: Request,
  status: number,
  body: unknown,
  extra: Record<string, string> = {},
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders(req),
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...extra,
    },
  });
}

/**
 * Liveness and configuration check.
 *
 * It deliberately does not call the model provider: a health check that spends
 * tokens is a health check that can be used to drain the budget. It only proves
 * this process can read the configuration it needs to serve a request.
 */
function healthResponse(req: Request): Response {
  let configured = true;
  try {
    getConfig();
  } catch {
    configured = false;
  }

  return json(
    req,
    configured ? 200 : 503,
    {
      status: configured ? "ok" : "misconfigured",
      service: "haris",
    },
  );
}

/**
 * Router shared by the deployed app and the tests.
 *
 * Paths are exact: the frontend builds `${base}/${name}`, and an unknown path
 * should be a clear 404 rather than a 400 from the wrong handler.
 */
export async function route(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname.length > 1 ? url.pathname.replace(/\/+$/, "") : url.pathname;

  if (path === "/" || path === "/health") {
    if (req.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(req) });
    }
    return healthResponse(req);
  }

  const handler = ROUTES[path];
  if (!handler) {
    return json(req, 404, {
      error: "Not found.",
      code: "invalid_request",
    });
  }

  return await handler(req);
}

if (import.meta.main) {
  const port = Number.parseInt(Deno.env.get("PORT") ?? "8000", 10);
  console.log(
    `HARIS backend listening on :${port} (origins: ${getAllowedOrigins().join(", ")})`,
  );
  Deno.serve({ port }, route);
}
