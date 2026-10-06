import { useEffect, useState } from "react";
import { Shield } from "lucide-react";
import { useI18n } from "@/lib/useI18n";

interface LevelUpBannerProps {
  /** 1-based level index, used to look up the localized title. */
  level: number;
  onDone?: () => void;
}

/**
 * Level-up banner.
 *
 * Previously received the English title string, so `titleAr` existed on every
 * level in `lib/xp.ts` and was never shown. It now takes the level number and
 * reads the localized title, which means both dictionaries have to be present.
 */
const LevelUpBanner = ({ level, onDone }: LevelUpBannerProps) => {
  const [visible, setVisible] = useState(true);
  const { t, levelTitle } = useI18n();

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[110] animate-fade-in">
      <div className="flex items-center justify-center gap-2 bg-success px-4 py-3 text-center text-success-foreground shadow-lg">
        <Shield className="h-5 w-5" aria-hidden="true" />
        <span className="font-bold">{t("xp.levelUp")}</span>
        <span>{levelTitle(level)}</span>
      </div>
    </div>
  );
};

export default LevelUpBanner;
