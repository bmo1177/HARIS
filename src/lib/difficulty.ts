import type { Scenario } from "@/data/scenarios";
import type { VoiceCall } from "@/data/voiceCalls";

export type Difficulty = Scenario["difficulty"] | VoiceCall["difficulty"];

const DIFFICULTY_STYLES = {
  Beginner: "text-success bg-success/10 border-success/30",
  Intermediate: "text-warning bg-warning/10 border-warning/30",
  Advanced: "text-destructive bg-destructive/10 border-destructive/30",
} as const;

/**
 * Status colour for a difficulty pill.
 *
 * Was duplicated byte-for-byte in `Scenarios.tsx` and `VoiceLab.tsx`, and the
 * two copies had already drifted — one carried `as const` and the other did not,
 * so they inferred different types for the same values. Difficulty maps to status
 * colour, which is the one place in the app where green/amber/red is decorative
 * rather than a verdict, so it lives next to the difficulty type rather than
 * being re-invented per page.
 */
export const difficultyClassName = (difficulty: Difficulty): string =>
  DIFFICULTY_STYLES[difficulty];