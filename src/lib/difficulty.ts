import type { Scenario } from "@/data/scenarios";
import type { VoiceCall } from "@/data/voiceCalls";

export type Difficulty = Scenario["difficulty"] | VoiceCall["difficulty"];

/**
 * Difficulty is ordinal, not a status.
 *
 * It used to borrow `success` / `warning` / `destructive`, which spent the
 * green-amber-red ramp — reserved for safe / suspicious / dangerous — on
 * something that is neither safe nor dangerous. The meter below shows rank
 * with three bars and the word, so it does not depend on colour at all.
 */
export const DIFFICULTY_LEVEL: Record<Difficulty, 1 | 2 | 3> = {
  Beginner: 1,
  Intermediate: 2,
  Advanced: 3,
};
