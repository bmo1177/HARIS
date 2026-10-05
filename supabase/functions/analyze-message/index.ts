import { z } from "npm:zod@3.25.76";
import { UpstreamError } from "../_shared/env.ts";
import { generateStructured } from "../_shared/llm.ts";
import { createHandler, jsonResponse } from "../_shared/http.ts";
import { UNTRUSTED_CONTENT_RULES, clampText, wrapUntrusted } from "../_shared/prompt.ts";
import { enforceRateLimit } from "../_shared/rateLimit.ts";
import { analyzeMessageRequest, parseRequest } from "../_shared/schemas.ts";

/**
 * The model is asked for a continuous score plus narrative fields only.
 *
 * `risk_level` and `is_threat` are deliberately absent: the server derives them
 * from `risk_score`. That guarantees the three verdict fields can never
 * contradict each other, removes them as targets for prompt injection, and means
 * a truncated or malformed model response can no longer produce a value that
 * crashes the UI (`RiskBadge` previously indexed a config map with this field and
 * threw on anything unexpected).
 */
const ANALYSIS_SCHEMA = {
  type: "object",
  properties: {
    risk_score: {
      type: "number",
      description: "Overall risk from 0 (completely safe) to 100 (certainly hostile)",
    },
    attack_type: {
      type: "string",
      description:
        "Attack category in English, e.g. Phishing, Smishing, Vishing, Romance Scam, Social Engineering. Use 'Safe' when there is no attack.",
    },
    attack_type_ar: { type: "string", description: "The same category in Arabic" },
    clue_1: {
      type: "string",
      description: "First concrete clue in the message: a specific red flag, or a specific sign it is safe",
    },
    clue_2: { type: "string", description: "Second clue" },
    clue_3: { type: "string", description: "Third clue" },
    explanation: {
      type: "string",
      description: "2-3 plain-English sentences on what this is and how to stay safe",
    },
    explanation_ar: { type: "string", description: "Arabic translation of the explanation" },
  },
  required: [
    "risk_score",
    "attack_type",
    "attack_type_ar",
    "clue_1",
    "clue_2",
    "clue_3",
    "explanation",
    "explanation_ar",
  ],
  additionalProperties: false,
} as const;

/**
 * Re-validates the model's output before it reaches a user. The provider's
 * structured-output mode makes the shape reliable; this makes the *values*
 * trustworthy, which is what actually matters for an anti-scam verdict.
 */
const MODEL_OUTPUT = z.object({
  risk_score: z.number(),
  attack_type: z.string(),
  attack_type_ar: z.string(),
  clue_1: z.string(),
  clue_2: z.string(),
  clue_3: z.string(),
  explanation: z.string(),
  explanation_ar: z.string(),
});

const RISK_DANGEROUS = 65;
const RISK_SUSPICIOUS = 25;

const FALLBACK_CLUE = "Look closely at who is contacting you and what they want you to do.";

function reconcile(raw: z.infer<typeof MODEL_OUTPUT>) {
  const score = Math.min(100, Math.max(0, Math.round(raw.risk_score)));
  const riskLevel = score >= RISK_DANGEROUS
    ? "Dangerous"
    : score >= RISK_SUSPICIOUS
    ? "Suspicious"
    : "Safe";
  const isSafe = riskLevel === "Safe";

  return {
    risk_score: score,
    risk_level: riskLevel,
    is_threat: !isSafe,
    // A "Safe" verdict carrying a phishing category would be incoherent; the
    // derived score wins.
    attack_type: clampText(raw.attack_type, 80, isSafe ? "Safe" : "Social Engineering"),
    attack_type_ar: clampText(raw.attack_type_ar, 80, isSafe ? "آمن" : "هندسة اجتماعية"),
    clue_1: clampText(raw.clue_1, 300, FALLBACK_CLUE),
    clue_2: clampText(raw.clue_2, 300, FALLBACK_CLUE),
    clue_3: clampText(raw.clue_3, 300, FALLBACK_CLUE),
    explanation: clampText(raw.explanation, 900, "Review the message carefully before you reply."),
    explanation_ar: clampText(
      raw.explanation_ar,
      900,
      "راجع الرسالة بعناية قبل أن ترد عليها.",
    ),
  };
}

const SYSTEM_PROMPT = `You are HARIS, a cybersecurity educator for high school students aged 16-18.
Analyse the message the student provides and report your verdict using the JSON schema provided.

How to respond:
- Talk directly to a teenager in a friendly, encouraging tone. Simple language, no jargon.
- Frame threats as puzzles to solve rather than dangers to fear.
- Base every clue on something concretely visible in the message: a specific link, a
  claimed urgency, an unusual payment method, an impersonated brand, a request for
  personal details. Never invent a clue that is not present.
- Be honest about uncertainty. If a message is merely unwise rather than hostile, score
  it low and say why.
- Not every message is an attack. Reward the honest "Safe" answer when it is genuinely
  safe; do not inflate scores to seem useful.

${UNTRUSTED_CONTENT_RULES}`;

Deno.serve(
  createHandler(async ({ req, requestId, body }) => {
    await enforceRateLimit(req, "analyze-message");

    const { message } = parseRequest(analyzeMessageRequest, body);

    const raw = await generateStructured({
      system: SYSTEM_PROMPT,
      user: [
        "Analyse the message below for cybersecurity threats.",
        "",
        wrapUntrusted("MESSAGE", message),
      ].join("\n"),
      schemaName: "suggest_analysis",
      schema: ANALYSIS_SCHEMA as unknown as Record<string, unknown>,
    });

    const parsed = MODEL_OUTPUT.safeParse(raw);
    if (!parsed.success) {
      console.error(`[${requestId}] model output failed validation:`, parsed.error.issues);
      throw new UpstreamError("model output did not match the expected schema", 502, false);
    }

    return jsonResponse(req, 200, reconcile(parsed.data));
  }),
);
