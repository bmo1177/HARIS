import { useEffect, useRef } from "react";
import { ShieldAlert, ShieldCheck, ShieldQuestion, Shield } from "lucide-react";
import type { AnalysisResult } from "@/types/analysis";

interface RiskBadgeProps {
  score: number;
  level: AnalysisResult["risk_level"];
}

type RiskLevel = AnalysisResult["risk_level"];

const DURATION_MS = 1200;

const CONFIG: Record<RiskLevel, { bg: string; border: string; text: string; icon: typeof ShieldCheck }> = {
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
};

/** Neutral styling for a level we do not recognise. */
const UNKNOWN_CONFIG = {
  bg: "bg-muted",
  border: "border-border",
  text: "text-muted-foreground",
  icon: Shield,
};

// Ease-out cubic for smooth deceleration
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const RiskBadge = ({ score, level }: RiskBadgeProps) => {
  const scoreRef = useRef<HTMLDivElement>(null);

  // `level` is model-derived data. It arrives through a validated schema now,
  // but the previous implementation indexed a config object with it directly and
  // threw on anything unexpected — and with no error boundary in the app that
  // was a blank page. An unknown level now degrades to neutral styling.
  const config = CONFIG[level] ?? UNKNOWN_CONFIG;
  const Icon = config.icon;

  const safeScore = Number.isFinite(score) ? Math.min(100, Math.max(0, Math.round(score))) : 0;

  useEffect(() => {
    const node = scoreRef.current;
    if (!node) return;

    const write = (value: number) => {
      node.textContent = `${value}%`;
    };

    if (prefersReducedMotion()) {
      write(safeScore);
      return;
    }

    // The score is written straight to the DOM rather than through state. The
    // previous version called setState on every animation frame — around 70
    // React renders to display one number — and never cancelled its frame
    // callback.
    let frame = 0;
    const startTime = performance.now();

    const animate = (now: number) => {
      const progress = Math.min((now - startTime) / DURATION_MS, 1);
      write(Math.round(easeOutCubic(progress) * safeScore));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [safeScore]);

  return (
    <div className={`rounded-2xl border-2 ${config.border} ${config.bg} p-6 text-center animate-fade-in`}>
      <Icon className={`w-12 h-12 mx-auto mb-3 ${config.text}`} aria-hidden="true" />
      <div
        ref={scoreRef}
        className={`text-5xl font-bold ${config.text} tabular-nums`}
        role="status"
        aria-label={`Risk score ${safeScore} out of 100. Verdict: ${level}.`}
      >
        {safeScore}%
      </div>
      <div className={`text-lg font-semibold mt-1 ${config.text}`}>{level}</div>
    </div>
  );
};

export default RiskBadge;
