import { z } from "zod";

/**
 * The shape every HARIS analysis must have.
 *
 * Previously this was a hand-written `interface` and the response was accepted
 * via `data as AnalysisResult`, which asserted that the model had respected the
 * `risk_level` union without anything checking it. `RiskBadge` then indexed a
 * config map with that field and threw on anything unexpected, with no error
 * boundary anywhere in the app — so one malformed response produced a blank
 * page. The type is now derived from the schema that actually validates it.
 */
export const analysisResultSchema = z.object({
  risk_score: z.number(),
  risk_level: z.enum(["Safe", "Suspicious", "Dangerous"]),
  is_threat: z.boolean(),
  attack_type: z.string(),
  attack_type_ar: z.string(),
  clue_1: z.string(),
  clue_2: z.string(),
  clue_3: z.string(),
  explanation: z.string(),
  explanation_ar: z.string(),
});

export type AnalysisResult = z.infer<typeof analysisResultSchema>;

export const scenarioFeedbackSchema = z.object({
  safe: z.boolean(),
  feedback: z.string(),
  feedback_ar: z.string(),
  red_flag: z.string(),
});

export type ScenarioFeedback = z.infer<typeof scenarioFeedbackSchema>;

export const voiceDebriefSchema = z.object({
  debrief: z.string(),
  debrief_ar: z.string(),
  top_tip: z.string(),
  top_tip_ar: z.string(),
});

export type VoiceDebrief = z.infer<typeof voiceDebriefSchema>;
