import { UpstreamError } from "../_shared/env.ts";
import { createHandler, jsonResponse } from "../_shared/http.ts";
import { enforceRateLimit } from "../_shared/rateLimit.ts";
import { analyzeMessageRequest, parseRequest } from "../_shared/schemas.ts";
import { analyzeMessage } from "../_shared/analysis.ts";

/**
 * HTTP wrapper only.
 *
 * The analysis itself lives in `_shared/analysis.ts` so the eval harness can
 * measure the same code path that serves students, rather than a reimplementation
 * of it. See `eval/README.md`.
 *
 * The handler is exported rather than served at module scope so the same code
 * can be mounted by `server/main.ts` on Deno Deploy. `import.meta.main` is true
 * only when this file is the process entrypoint, so importing it no longer
 * starts a second HTTP server.
 */
export const analyzeMessageHandler = createHandler(async ({ req, body }) => {
  await enforceRateLimit(req, "analyze-message");

  const { message } = parseRequest(analyzeMessageRequest, body);

  try {
    return jsonResponse(req, 200, await analyzeMessage(message));
  } catch (error) {
    // `analyzeMessage` throws a plain Error on schema mismatch; everything else
    // is already an UpstreamError carrying the right status.
    if (error instanceof UpstreamError) throw error;
    throw new UpstreamError(
      error instanceof Error ? error.message : "analysis failed",
      502,
      false,
    );
  }
});

if (import.meta.main) Deno.serve(analyzeMessageHandler);
