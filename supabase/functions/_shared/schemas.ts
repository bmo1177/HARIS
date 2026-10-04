/**
 * Request schemas.
 *
 * The previous functions validated, in total, that `message` was a non-empty
 * string. `scenario-feedback` and `voice-debrief` validated nothing at all —
 * `voice-debrief` interpolated `flagDetails`, an arbitrary untyped JSON blob
 * from an anonymous caller, straight into a prompt.
 *
 * Every field is now bounded in both type and length, which caps the token cost
 * of a single request. Combined with `LLM_MAX_TOKENS` this puts a ceiling on
 * what one call to an open endpoint can cost.
 */

import { z } from "npm:zod@3.25.76";
import { RequestError } from "./http.ts";

/** Parses with `zod`, converting any failure into a safe 400. */
export function parseRequest<T extends z.ZodTypeAny>(
  schema: T,
  body: unknown,
): z.infer<T> {
  const result = schema.safeParse(body);
  if (result.success) return result.data;

  // Log the shape of the problem, never the payload: it is attacker-supplied.
  const issues = result.error.issues
    .slice(0, 5)
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.code}`)
    .join(", ");
  console.warn("request validation failed:", issues);

  throw new RequestError("invalid_request");
}

/** Trims, then bounds length. Every free-text field goes through this. */
const shortText = (max: number) =>
  z
    .string()
    .transform((value) => value.trim())
    .pipe(z.string().min(1).max(max));

const count = (max: number) => z.number().int().min(0).max(max);

export const analyzeMessageRequest = z.object({
  message: shortText(2_000),
});

export const scenarioFeedbackRequest = z.object({
  scenarioTitle: shortText(200),
  stepNumber: z.number().int().min(1).max(20),
  attackerMessage: shortText(1_000),
  userChoice: shortText(500),
});

/**
 * One line of a simulated call, plus whether it was a red flag and whether the
 * student caught it.
 *
 * This is deliberately a typed object rather than the free-form `flagDetails`
 * JSON blob that used to be interpolated into the prompt unvalidated.
 */
const flagDetail = z.object({
  lineNumber: z.number().int().min(1).max(200),
  text: shortText(300),
  isRedFlag: z.boolean(),
  flagReason: z.string().trim().max(200).optional(),
  userFlagged: z.boolean(),
});

export const voiceDebriefRequest = z
  .object({
    callTitle: shortText(200),
    totalFlags: count(50),
    caughtFlags: count(50),
    missedFlags: count(50),
    flagDetails: z.array(flagDetail).max(50),
  })
  // Cross-field consistency. Without these checks a crafted request could assert
  // any score it liked ("caught 12 of 12, flawless instinct, cybersecurity
  // expert") and the model would faithfully narrate it back to the student.
  .refine((value) => value.caughtFlags <= value.totalFlags, {
    message: "caughtFlags cannot exceed totalFlags",
  })
  .refine(
    (value) => value.caughtFlags + value.missedFlags === value.totalFlags,
    {
      message: "caughtFlags and missedFlags must sum to totalFlags",
    },
  )
  .refine(
    (value) =>
      value.flagDetails.filter((detail) => detail.isRedFlag && detail.userFlagged).length ===
        value.caughtFlags,
    { message: "caughtFlags does not match the supplied flag details" },
  );
