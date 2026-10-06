import { useState, useCallback, type ReactNode } from "react";
import { XPContext } from "@/lib/xp-context";
import { addXP as addXPToStorage, getState, type XPState } from "@/lib/xp";
import XPPill from "@/components/XPPill";
import LevelUpBanner from "@/components/LevelUpBanner";

export function XPProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<XPState>(getState);
  const [pill, setPill] = useState<number | null>(null);
  const [levelUp, setLevelUp] = useState<number | null>(null);

  const awardXP = useCallback((amount: number) => {
    const result = addXPToStorage(amount);
    setState(result.state);
    setPill(amount);
    if (result.leveledUp) {
      setLevelUp(result.state.level);
    }
  }, []);

  // These must be referentially stable. They were previously inline arrows, and
  // both XPPill and LevelUpBanner run their dismissal timer in an effect keyed
  // on `onDone` — so every re-render of this provider tore down and restarted
  // the countdown, and the reward feedback could stick on screen indefinitely.
  const dismissPill = useCallback(() => setPill(null), []);
  const dismissLevelUp = useCallback(() => setLevelUp(null), []);

  return (
    <XPContext.Provider value={{ state, awardXP }}>
      {children}
      {pill !== null && <XPPill amount={pill} onDone={dismissPill} />}
      {levelUp !== null && <LevelUpBanner level={levelUp} onDone={dismissLevelUp} />}
    </XPContext.Provider>
  );
}
