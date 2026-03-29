const XP_KEY = "haris_xp";

export interface XPState {
  xp: number;
  level: number;
  title: string;
  titleAr: string;
  nextLevelXP: number;
  currentLevelXP: number;
}

const LEVELS = [
  { min: 0, title: "Digital Newbie", titleAr: "مبتدئ رقمي" },
  { min: 100, title: "Scam Spotter", titleAr: "كاشف الاحتيال" },
  { min: 250, title: "Threat Hunter", titleAr: "صائد التهديدات" },
  { min: 500, title: "Cyber Guardian", titleAr: "حارس إلكتروني" },
  { min: 800, title: "HARIS Elite", titleAr: "نخبة هاريس" },
];

export function getXP(): number {
  try {
    return parseInt(localStorage.getItem(XP_KEY) || "0", 10);
  } catch {
    return 0;
  }
}

export function addXP(amount: number): { newXP: number; leveledUp: boolean; state: XPState } {
  const oldXP = getXP();
  const newXP = oldXP + amount;
  localStorage.setItem(XP_KEY, String(newXP));
  const oldState = computeState(oldXP);
  const newState = computeState(newXP);
  return { newXP, leveledUp: newState.level > oldState.level, state: newState };
}

export function computeState(xp: number): XPState {
  let level = 1;
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].min) {
      level = i + 1;
      break;
    }
  }
  const current = LEVELS[level - 1];
  const next = LEVELS[level] || null;
  return {
    xp,
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
