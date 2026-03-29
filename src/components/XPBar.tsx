import { Shield } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { XPState } from "@/lib/xp";

interface XPBarProps {
  state: XPState;
}

const XPBar = ({ state }: XPBarProps) => {
  const range = state.nextLevelXP - state.currentLevelXP;
  const progress = state.level >= 5 ? 100 : ((state.xp - state.currentLevelXP) / range) * 100;

  return (
    <div className="flex items-center gap-2">
      <Shield className="w-4 h-4 text-primary" />
      <span className="text-xs font-semibold text-foreground whitespace-nowrap">
        Lv {state.level}
      </span>
      <Progress value={progress} className="w-20 h-2" />
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {state.xp} XP
      </span>
    </div>
  );
};

export default XPBar;
