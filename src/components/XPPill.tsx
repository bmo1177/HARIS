import { useEffect, useState } from "react";
import { useI18n } from "@/lib/useI18n";

interface XPPillProps {
  amount: number;
  onDone?: () => void;
}

/**
 * Floating "+N XP" confirmation.
 *
 * Three things were wrong here. It hardcoded `bg-green-500 text-white`, which
 * bypasses `--success` and made this the one green surface in the app whose
 * contrast was never solved against its own background — while PRODUCT.md claims
 * every status pair clears 4.5:1. `right-6` is physical, so the pill appeared on
 * the wrong side in Arabic. And the label was a hardcoded literal, so it stayed
 * English in Arabic mode.
 */
const XPPill = ({ amount, onDone }: XPPillProps) => {
  const [visible, setVisible] = useState(true);
  const { t, formatNumber } = useI18n();

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 2000);
    return () => clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  return (
    <div className="fixed end-6 top-20 z-[100] animate-fade-in">
      <div className="rounded-full bg-success px-4 py-2 text-sm font-bold text-success-foreground shadow-lg">
        {t("xp.earned", { amount: formatNumber(amount) })}
      </div>
    </div>
  );
};

export default XPPill;