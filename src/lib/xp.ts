const XP_KEY = "haris_xp";

export interface XPState {
  xp: number;
  level: number;
  title: string;
  titleAr: string;
  nextLevelXP: number;
  currentLevelXP: number;
}

export const LEVELS = [
  { min: 0, title: "Digital Newbie", titleAr: "مبتدئ رقمي" },
  { min: 100, title: "Scam Spotter", titleAr: "كاشف الاحتيال" },
  { min: 250, title: "Threat Hunter", titleAr: "صائد التهديدات" },
  { min: 500, title: "Cyber Guardian", titleAr: "حارس إلكتروني" },
  { min: 800, title: "HARIS Elite", titleAr: "نخبة هاريس" },
] as const;

/**
 * Every XP award in the app, in one place.
 *
 * These were previously scattered as bare literals across six call sites, which
 * is how scenario cards ended up advertising "50 XP" while the completion logic
 * paid 10/25/50/75 — the UI told students one number and the game paid another.
 */
export const REWARDS = {
  /** Completing a message analysis. */
  analysis: 10,
  /** Revealing the final clue. */
  allCluesRevealed: 15,
  /** Correctly identifying the attack type. */
  correctGuessFirstTry: 30,
  correctGuessRetry: 15,
  /** Scenario: awarded per safe choice, so the maximum scales with length. */
  scenarioSafeChoice: 10,
  /** Voice call: base, plus a bonus at 75% or better. */
  voiceCall: 40,
  voiceCallHighScore: 20,
} as const;

/** XP for a scenario completed with `safeChoices` out of `totalChoices`. */
export function scenarioReward(safeChoices: number, totalChoices: number): number {
  if (totalChoices <= 0) return 0;
  const safe = Math.min(totalChoices, Math.max(0, safeChoices));
  return safe * REWARDS.scenarioSafeChoice;
}

/** The most a scenario of this length can award, for display on the card. */
export function scenarioMaxReward(totalChoices: number): number {
  return Math.max(0, totalChoices) * REWARDS.scenarioSafeChoice;
}

/** XP for a voice call, given how many red flags were caught. */
export function voiceCallReward(caughtFlags: number, totalFlags: number): number {
  const highScore = totalFlags > 0 && caughtFlags / totalFlags >= 0.75;
  return REWARDS.voiceCall + (highScore ? REWARDS.voiceCallHighScore : 0);
}

/** Coerces anything to a usable XP total. */
function sanitiseXP(value: number): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  return Math.floor(value);
}

export function getXP(): number {
  try {
    const stored = localStorage.getItem(XP_KEY);
    if (stored === null) return 0;
    // `parseInt("abc")` is NaN, and NaN used to flow straight through to the
    // header, rendering a literal "NaN XP".
    return sanitiseXP(Number.parseInt(stored, 10));
  } catch {
    // localStorage throws in Safari private mode and when storage is disabled.
    return 0;
  }
}

export function addXP(amount: number): { newXP: number; leveledUp: boolean; state: XPState } {
  const delta = sanitiseXP(amount);
  const oldXP = getXP();
  const newXP = oldXP + delta;

  try {
    localStorage.setItem(XP_KEY, String(newXP));
  } catch {
    // Storage can be unavailable or full. The award still applies for this
    // session; it just will not persist. Previously this threw and took down
    // whatever awarded the XP.
    console.warn("Could not persist XP:", newXP);
  }

  const oldState = computeState(oldXP);
  const newState = computeState(newXP);
  return { newXP, leveledUp: newState.level > oldState.level, state: newState };
}

export function computeState(xp: number): XPState {
  const safeXP = sanitiseXP(xp);
  let level = 1;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (safeXP >= LEVELS[i].min) {
      level = i + 1;
      break;
    }
  }
  const current = LEVELS[level - 1];
  const next = LEVELS[level] ?? null;
  return {
    xp: safeXP,
    level,
    title: current.title,
    titleAr: current.titleAr,
    nextLevelXP: next ? next.min : current.min,
    currentLevelXP: current.min,
  };
}

export function getState(): XPState {
  return computeState(getXP());
}

/** Whether `xp` is enough to reach the next level. `false` at max level. */
export function isMaxLevel(xp: number): boolean {
  return sanitiseXP(xp) >= LEVELS[LEVELS.length - 1].min;
}
