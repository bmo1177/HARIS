import { useContext } from "react";
import { XPContext } from "@/lib/xp-context";

export function useXP() {
  const ctx = useContext(XPContext);
  if (!ctx) throw new Error("useXP must be used within XPProvider");
  return ctx;
}
