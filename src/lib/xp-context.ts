import { createContext } from "react";
import type { XPState } from "@/lib/xp";

export interface XPContextValue {
  state: XPState;
  awardXP: (amount: number) => void;
}

/**
 * The context object lives alone so neither the provider module nor the hook
 * module mixes component and non-component exports.
 */
export const XPContext = createContext<XPContextValue | null>(null);
