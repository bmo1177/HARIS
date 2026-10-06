import { z } from "zod";

/**
 * Shared contracts for the Prompt Injection Sandbox.
 *
 * Everything here is offline and deterministic: the Red Team target is a
 * simulated assistant, the Blue Team battery runs against fixed payloads, and no
 * user-supplied text ever leaves the browser. Mock secrets are clearly marked
 * (`MOCK-…`, `BLUE-MOCK-…`, zero-value transfers) so a flag can never be
 * mistaken for a real credential.
 */

export const SANDBOX_MAX_INPUT_LENGTH = 2000;
export const SANDBOX_MAX_OUTPUT_LENGTH = 1200;
export const SANDBOX_MAX_SYSTEM_PROMPT_LENGTH = 2000;

export const sandboxAttackVectorSchema = z.enum([
  "direct-override",
  "delimiter-confusion",
  "persona-hijacking",
  "obfuscated-payload",
]);
export type SandboxAttackVector = z.infer<typeof sandboxAttackVectorSchema>;

export const redChallengeIdSchema = z.enum([
  "credential-leakage",
  "unauthorized-transfer",
  "rag-exfiltration",
  "service-disruption",
]);
export type RedChallengeId = z.infer<typeof redChallengeIdSchema>;

export const redLevelSchema = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4)]);
export type RedLevel = z.infer<typeof redLevelSchema>;

export const targetStateSchema = z.enum(["operational", "degraded", "locked"]);
export type TargetState = z.infer<typeof targetStateSchema>;

export const guardrailRuleIdSchema = z.enum([
  "stripControlChars",
  "removeFenceTags",
  "neutralizeOverrides",
  "requireClosedBoundary",
  "denyOutputMarkers",
]);
export type GuardrailRuleId = z.infer<typeof guardrailRuleIdSchema>;

const localizedTextSchema = z.object({
  en: z.string().min(1).max(800),
  ar: z.string().min(1).max(800),
});
export type LocalizedText = z.infer<typeof localizedTextSchema>;

export const redChallengeSchema = z
  .object({
    id: redChallengeIdSchema,
    level: redLevelSchema,
    title: z.string().min(1).max(80),
    titleAr: z.string().min(1).max(80),
    objective: z.string().min(1).max(500),
    objectiveAr: z.string().min(1).max(500),
    targetName: z.string().min(1).max(80),
    targetNameAr: z.string().min(1).max(80),
    /** Simulated system context. Data, not prose: kept in English like real config. */
    context: z.string().min(1).max(2000),
    /** Lowercase fragments the vulnerable simulator reacts to. */
    triggers: z.array(z.string().min(1).max(80)).min(1).max(24),
    flags: z.array(z.string().min(1).max(80)).min(1).max(4),
    requiredMatches: z.number().int().min(1).max(4),
    /** Prefilled starter attack for students facing a blank box. Must trigger. */
    exampleAttack: z.string().min(1).max(500),
    refusal: localizedTextSchema,
    /** Must contain `{flags}`, replaced with the matched markers. */
    successTemplate: localizedTextSchema,
    lockedNotice: localizedTextSchema,
    hints: z.array(localizedTextSchema).min(1).max(4),
    maxAttempts: z.number().int().min(1).max(20),
  })
  .superRefine((challenge, ctx) => {
    if (challenge.requiredMatches > challenge.flags.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "requiredMatches cannot exceed the number of flags",
      });
    }
    for (const key of ["successTemplate"] as const) {
      for (const locale of ["en", "ar"] as const) {
        if (!challenge[key][locale].includes("{flags}")) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `${key}.${locale} must contain {flags}`,
          });
        }
      }
    }
  });
export type RedChallenge = z.infer<typeof redChallengeSchema>;

export const redAttemptInputSchema = z.object({
  challengeId: redChallengeIdSchema,
  input: z.string().min(1).max(SANDBOX_MAX_INPUT_LENGTH),
});
export type RedAttemptInput = z.infer<typeof redAttemptInputSchema>;

export interface RedTurn {
  assistantEn: string;
  assistantAr: string;
  matchedFlags: string[];
  success: boolean;
  locked: boolean;
  consecutiveFailures: number;
  /** Index into challenge.hints, or null when no hint is unlocked yet. */
  hintIndex: number | null;
}

export const guardrailConfigSchema = z.object({
  systemPrompt: z.string().max(SANDBOX_MAX_SYSTEM_PROMPT_LENGTH),
  stripControlChars: z.boolean(),
  removeFenceTags: z.boolean(),
  neutralizeOverrides: z.boolean(),
  boundaryOpen: z.string().min(1).max(24),
  boundaryClose: z.string().min(1).max(24),
  requireClosedBoundary: z.boolean(),
  denyOutputMarkers: z.boolean(),
  maxOutputLength: z.number().int().min(200).max(2000),
});
export type GuardrailConfig = z.infer<typeof guardrailConfigSchema>;

export const batteryCaseSchema = z.object({
  id: z.string().min(1).max(64),
  vector: z.union([sandboxAttackVectorSchema, z.literal("benign")]),
  payload: z.string().min(1).max(SANDBOX_MAX_INPUT_LENGTH),
  expectBlocked: z.boolean(),
  /** Which authored defenses stop this case. Empty for benign cases. */
  mitigatedBy: z.array(guardrailRuleIdSchema).max(5),
  rationale: z.string().min(1).max(500),
  rationaleAr: z.string().min(1).max(500),
});
export type BatteryCase = z.infer<typeof batteryCaseSchema>;

export interface BatteryRun {
  caseId: string;
  vector: SandboxAttackVector | "benign";
  sanitizedPreview: string;
  assistantPreview: string;
  assistantPreviewAr: string;
  blocked: boolean;
  expectedBlocked: boolean;
  passed: boolean;
  blockedBy: GuardrailRuleId[];
}

export interface BatteryReport {
  attacksBlocked: number;
  attacksTotal: number;
  benignAnswered: number;
  benignTotal: number;
  /** Whole-number percentages. Zero denominators report 0, never NaN. */
  defenseEfficacy: number;
  utility: number;
  log: BatteryRun[];
}

/** Markers the simulator may emit. Authored defenses must keep these from users. */
export const RESTRICTED_MARKERS = [
  "MOCK-ADMIN-operator",
  "MOCK-PASSWORD-sandbox-only-001",
  "MOCK-TRANSFER-QAR-0.00-SANDBOX",
  "MOCK-HR-EMP-0001-SANDBOX",
  "MOCK-SERVICE-LOCKED",
  "BLUE-MOCK-SECRET-001",
  "BLUE-MOCK-RECORD-042",
  "BLUE-MOCK-SERVICE-KEY",
] as const;
