import { z } from "npm:zod@3.25.76";
import { UpstreamError } from "../_shared/env.ts";
import { generateStructured } from "../_shared/llm.ts";
import { createHandler, jsonResponse } from "../_shared/http.ts";
import { clampText, UNTRUSTED_CONTENT_RULES, wrapUntrusted } from "../_shared/prompt.ts";
import { enforceRateLimit } from "../_shared/rateLimit.ts";
import { parseRequest, scenarioFeedbackRequest } from "../_shared/schemas.ts";

const FEEDBACK_SCHEMA = {
  type: "object",
  properties: {
    safe: {
      type: "boolean",
      description: "True only if the student's reply was genuinely the safer option",
    },
    feedback: {
      type: "string",
      description: "1-2 sentences, direct and encouraging, addressed to the student",
    },
    feedback_ar: {
      type: "string",
      description: "Arabic translation of the feedback",
    },
    red_flag: {
      type: "string",
      description:
        "The red flag present in the attacker's message that the student should watch for. Empty string if there is none.",
    },
  },
  required: ["safe", "feedback", "feedback_ar", "red_flag"],
  additionalProperties: false,
} as const;

const MODEL_OUTPUT = z.object({
  safe: z.boolean(),
  feedback: z.string(),
  feedback_ar: z.string(),
  red_flag: z.string(),
});

const SYSTEM_PROMPT =
  `You are HARIS, a friendly cybersecurity coach for high school students aged 16-18.
A student is role-playing a social engineering scenario and has just replied to an attacker.
Judge their reply on its own merits and coach them on what to do instead.

How to respond:
- Be direct and encouraging. Never patronising, never harsh.
- Explain the reasoning behind the verdict in one or two sentences a 16-year-old can follow.
- If the reply was unsafe, name the specific risk it created (money sent, credentials shared,
  a channel handed over) rather than saying "be careful" in general terms.
- If the reply was safe, say specifically what made it a good instinct, so the student can
  repeat that reasoning next time.
- red_flag describes what was wrong with the *attacker's* message, not the student's reply.
  Leave it empty only when the attacker genuinely showed no warning sign.

${UNTRUSTED_CONTENT_RULES}`;

Deno.serve(
  createHandler(async ({ req, requestId, body }) => {
    await enforceRateLimit(req, "scenario-feedback");

    const { scenarioTitle, stepNumber, attackerMessage, userChoice } = parseRequest(
      scenarioFeedbackRequest,
      body,
    );

    const raw = await generateStructured({
      system: SYSTEM_PROMPT,
      user: [
        `Scenario: ${scenarioTitle}`,
        `Step: ${stepNumber}`,
        "",
        "What the attacker sent:",
        wrapUntrusted("ATTACKER_MESSAGE", attackerMessage),
        "",
        "What the student replied:",
        wrapUntrusted("STUDENT_REPLY", userChoice),
      ].join("\n"),
      schemaName: "suggest_feedback",
      schema: FEEDBACK_SCHEMA as unknown as Record<string, unknown>,
      maxTokens: 700,
    });

    const parsed = MODEL_OUTPUT.safeParse(raw);
    if (!parsed.success) {
      console.error(
        `[${requestId}] model output failed validation:`,
        parsed.error.issues,
      );
      throw new UpstreamError(
        "model output did not match the expected schema",
        502,
        false,
      );
    }

    const { safe, feedback, feedback_ar, red_flag } = parsed.data;

    return jsonResponse(req, 200, {
      safe,
      feedback: clampText(
        feedback.trim(),
        600,
        "Take another look at who was asking for what.",
      ),
      // The Arabic string is optional: an empty value renders as omitted rather
      // than as an empty bordered box.
      feedback_ar: clampText(feedback_ar.trim(), 600, ""),
      red_flag: clampText(red_flag.trim(), 300, ""),
    });
  }),
);
