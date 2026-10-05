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
 */
Deno.serve(
  createHandler(async ({ req, body }) => {
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
  }),
);
