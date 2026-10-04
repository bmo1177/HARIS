import { Shield } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { isMaxLevel, type XPState } from "@/lib/xp";

interface XPBarProps {
  state: XPState;
}

const XPBar = ({ state }: XPBarProps) => {
  // At max level `nextLevelXP === currentLevelXP`, so the range is 0 and the
  // previous unguarded division produced NaN. It was only masked by a hardcoded
  // `state.level >= 5` check, which would have broken silently the moment a
  // sixth level was added.
  const atMax = isMaxLevel(state.xp);
  const range = state.nextLevelXP - state.currentLevelXP;
  const progress = atMax || range <= 0
    ? 100
    : Math.min(100, Math.max(0, ((state.xp - state.currentLevelXP) / range) * 100));

  return (
    <div className="flex items-center gap-2">
      <Shield className="w-4 h-4 text-primary" aria-hidden="true" />
      <span className="text-xs font-semibold text-foreground whitespace-nowrap">
        Lv {state.level}
      </span>
      <Progress
        value={progress}
        className="w-20 h-2"
        aria-label={atMax ? `Level ${state.level}, maximum level reached` : `Level ${state.level} progress`}
      />
      <span className="text-xs text-muted-foreground whitespace-nowrap">
        {state.xp} XP
      </span>
    </div>
  );
};

export default XPBar;
