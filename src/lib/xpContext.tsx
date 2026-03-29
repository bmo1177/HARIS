import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { addXP as addXPToStorage, getState, type XPState } from "@/lib/xp";
import XPPill from "@/components/XPPill";
import LevelUpBanner from "@/components/LevelUpBanner";

interface XPContextValue {
  state: XPState;
  awardXP: (amount: number) => void;
}

const XPContext = createContext<XPContextValue | null>(null);

export function useXP() {
  const ctx = useContext(XPContext);
  if (!ctx) throw new Error("useXP must be used within XPProvider");
  return ctx;
}

export function XPProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<XPState>(getState);
  const [pill, setPill] = useState<number | null>(null);
  const [levelUp, setLevelUp] = useState<string | null>(null);

  const awardXP = useCallback((amount: number) => {
    const result = addXPToStorage(amount);
    setState(result.state);
    setPill(amount);
    if (result.leveledUp) {
      setLevelUp(result.state.title);
    }
  }, []);

  return (
    <XPContext.Provider value={{ state, awardXP }}>
      {children}
      {pill !== null && <XPPill amount={pill} onDone={() => setPill(null)} />}
      {levelUp !== null && <LevelUpBanner title={levelUp} onDone={() => setLevelUp(null)} />}
    </XPContext.Provider>
  );
}
