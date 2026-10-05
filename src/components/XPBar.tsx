import { Shield } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { isMaxLevel, type XPState } from "@/lib/xp";
import { useI18n } from "@/lib/i18n";

interface XPBarProps {
  state: XPState;
}

const XPBar = ({ state }: XPBarProps) => {
  const { t, formatNumber } = useI18n();
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
    <div className="flex items-center gap-1.5 sm:gap-2">
      <Shield className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
      <span className="whitespace-nowrap font-mono text-xs tabular-nums text-foreground">
        {t("xp.level", { level: formatNumber(state.level) })}
      </span>
      <Progress
        value={progress}
        className="h-1.5 w-12 sm:w-20"
        aria-label={
          atMax
            ? t("xp.maxLevel", { level: formatNumber(state.level) })
            : t("xp.progress", { level: formatNumber(state.level) })
        }
      />
      <span className="whitespace-nowrap font-mono text-xs tabular-nums text-muted-foreground">
        {t("xp.total", { xp: formatNumber(state.xp) })}
      </span>
    </div>
  );
};

export default XPBar;
