import { useEffect, useState } from "react";
import { ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";

interface RiskBadgeProps {
  score: number;
  level: "Safe" | "Suspicious" | "Dangerous";
}

// Ease-out cubic for smooth deceleration
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const RiskBadge = ({ score, level }: RiskBadgeProps) => {
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const duration = 1200;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      setDisplayScore(Math.round(eased * score));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  const config = {
    Safe: {
      bg: "bg-green-50 dark:bg-green-950/30",
      border: "border-green-200 dark:border-green-800",
      text: "text-green-700 dark:text-green-400",
      icon: ShieldCheck,
    },
    Suspicious: {
      bg: "bg-amber-50 dark:bg-amber-950/30",
      border: "border-amber-200 dark:border-amber-800",
      text: "text-amber-700 dark:text-amber-400",
      icon: ShieldQuestion,
    },
    Dangerous: {
      bg: "bg-red-50 dark:bg-red-950/30",
      border: "border-red-200 dark:border-red-800",
      text: "text-red-700 dark:text-red-400",
      icon: ShieldAlert,
    },
  }[level];

  const Icon = config.icon;

  return (
    <div className={`rounded-2xl border-2 ${config.border} ${config.bg} p-6 text-center animate-fade-in`}>
      <Icon className={`w-12 h-12 mx-auto mb-3 ${config.text}`} />
      <div className={`text-5xl font-bold ${config.text} tabular-nums`}>
        {displayScore}%
      </div>
      <div className={`text-lg font-semibold mt-1 ${config.text}`}>{level}</div>
    </div>
  );
};

export default RiskBadge;
