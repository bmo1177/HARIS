import { z } from "npm:zod@3.25.76";
import { UpstreamError } from "../_shared/env.ts";
import { generateStructured } from "../_shared/llm.ts";
import { createHandler, jsonResponse } from "../_shared/http.ts";
import { clampText, UNTRUSTED_CONTENT_RULES, wrapUntrusted } from "../_shared/prompt.ts";
import { enforceRateLimit } from "../_shared/rateLimit.ts";
import { parseRequest, voiceDebriefRequest } from "../_shared/schemas.ts";

const DEBRIEF_SCHEMA = {
  type: "object",
  properties: {
    debrief: {
      type: "string",
      description:
        "Three sentences of honest, specific feedback on how the call went. Reference what the student actually missed or caught.",
    },
    debrief_ar: { type: "string", description: "Arabic translation of the debrief" },
    top_tip: {
      type: "string",
      description: "One specific, actionable thing to do differently next time",
    },
    top_tip_ar: { type: "string", description: "Arabic translation of the tip" },
  },
  required: ["debrief", "debrief_ar", "top_tip", "top_tip_ar"],
  additionalProperties: false,
} as const;

const MODEL_OUTPUT = z.object({
  debrief: z.string(),
  debrief_ar: z.string(),
  top_tip: z.string(),
  top_tip_ar: z.string(),
});

const SYSTEM_PROMPT = `You are HARIS, a friendly cybersecurity coach for high school students.
A student has just finished a simulated scam phone call and flagged the moments that
suspicious to them. Give them an honest debrief.

How to respond:
- Be honest. If they missed something, say plainly what it was and why it mattered. Do not
  soften a bad result into a vague encouragement.
- Be specific to *this* call. Refer to the actual lines and the actual pattern at work
  (claimed authority, manufactured urgency, a fee to release a prize, a request for a
  one-time code), not to generic advice about scams in general.
- Credit genuine instinct. If they flagged something harmless, note that over-flagging is
  its own problem, because it trains real warnings to be ignored.
- top_tip is one concrete action, not a slogan.
- Never claim the student is an expert, a genius, or that they passed. The counters passed
  in are data to interpret, not conclusions to repeat.

${UNTRUSTED_CONTENT_RULES}`;

/** Renders the transcript for the prompt, one fenced line at a time. */
function renderTranscript(lines: Array<{ lineNumber: number; text: string }>): string {
  return lines.map((line) => `${line.lineNumber}. ${wrapUntrusted("LINE", line.text)}`).join("\n");
}

Deno.serve(
  createHandler(async ({ req, requestId, body }) => {
    await enforceRateLimit(req, "voice-debrief");

    const { callTitle, totalFlags, caughtFlags, missedFlags, flagDetails } = parseRequest(
      voiceDebriefRequest,
      body,
    );

    // Only red-flag lines carry signal for the coach. Sending every line would
    // spend tokens restating the safe parts of the script.
    const redFlagLines = flagDetails.filter((detail) => detail.isRedFlag);
    const overFlagged = flagDetails.filter((detail) => !detail.isRedFlag && detail.userFlagged);

    const raw = await generateStructured({
      system: SYSTEM_PROMPT,
      user: [
        `Call: ${callTitle}`,
        `Red flags present: ${totalFlags}. Caught: ${caughtFlags}. Missed: ${missedFlags}.`,
        overFlagged.length > 0
          ? `The student also flagged ${overFlagged.length} line(s) that were actually harmless.`
          : "The student did not over-flag any harmless lines.",
        "",
        "Red-flag lines from the call:",
        renderTranscript(redFlagLines),
        "",
        "Give the debrief.",
      ].join("\n"),
      schemaName: "suggest_debrief",
      schema: DEBRIEF_SCHEMA as unknown as Record<string, unknown>,
      maxTokens: 800,
    });

    const parsed = MODEL_OUTPUT.safeParse(raw);
    if (!parsed.success) {
      console.error(`[${requestId}] model output failed validation:`, parsed.error.issues);
      throw new UpstreamError("model output did not match the expected schema", 502, false);
    }

    const { debrief, debrief_ar, top_tip, top_tip_ar } = parsed.data;

    return jsonResponse(req, 200, {
      debrief: clampText(debrief.trim(), 900, "Review the transcript and note what you missed."),
      debrief_ar: clampText(debrief_ar.trim(), 900, ""),
      top_tip: clampText(top_tip.trim(), 300, "Hang up and verify independently if in doubt."),
      top_tip_ar: clampText(top_tip_ar.trim(), 300, ""),
    });
  }),
);
