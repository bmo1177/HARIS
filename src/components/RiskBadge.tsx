import { useEffect, useRef } from "react";
import { ShieldAlert, ShieldCheck, ShieldQuestion, Shield } from "lucide-react";
import { useI18n } from "@/lib/useI18n";
import type { AnalysisResult } from "@/types/analysis";

interface RiskBadgeProps {
  score: number;
  level: AnalysisResult["risk_level"];
}

type RiskLevel = AnalysisResult["risk_level"];

const DURATION_MS = 1200;

/**
 * The verdict, presented as an instrument readout.
 *
 * This is the single most important number in the app, so it gets the treatment:
 * tabular monospace figures, a segmented scale beneath it, and the threshold
 * marked so the score is legible rather than decorative. The count-up is written
 * straight to the DOM — the previous version drove ~70 React renders per
 * animation through `setState` and never cancelled its frame callback.
 */
const CONFIG: Record<
  RiskLevel,
  { text: string; rule: string; track: string; fill: string; icon: typeof ShieldCheck }
> = {
  Safe: {
    text: "text-success",
    rule: "bg-success/25",
    track: "bg-success/10",
    fill: "bg-success",
    icon: ShieldCheck,
  },
  Suspicious: {
    text: "text-warning",
    rule: "bg-warning/25",
    track: "bg-warning/10",
    fill: "bg-warning",
    icon: ShieldQuestion,
  },
  Dangerous: {
    text: "text-destructive",
    rule: "bg-destructive/25",
    track: "bg-destructive/10",
    fill: "bg-destructive",
    icon: ShieldAlert,
  },
};

/** Neutral styling for a level we do not recognise. */
const UNKNOWN_CONFIG = {
  text: "text-muted-foreground",
  rule: "bg-border",
  track: "bg-muted",
  fill: "bg-muted-foreground",
  icon: Shield,
};

// Ease-out cubic for smooth deceleration
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const SEGMENTS = 28;

const RiskBadge = ({ score, level }: RiskBadgeProps) => {
  const { t, formatNumber } = useI18n();
  const scoreRef = useRef<HTMLDivElement>(null);
  const fillRef = useRef<HTMLDivElement>(null);

  // `level` is model-derived data. It arrives through a validated schema now, but
  // the previous implementation indexed a config object with it directly and
  // threw on anything unexpected — and with no error boundary in a position to
  // catch it, that was a blank page. An unknown level degrades to neutral.
  const config = CONFIG[level] ?? UNKNOWN_CONFIG;
  const Icon = config.icon;

  const safeScore = Number.isFinite(score) ? Math.min(100, Math.max(0, Math.round(score))) : 0;

  useEffect(() => {
    const node = scoreRef.current;
    const fill = fillRef.current;
    if (!node) return;

    const write = (value: number) => {
      node.textContent = `${value}%`;
      if (fill) fill.style.width = `${value}%`;
    };

    if (prefersReducedMotion()) {
      write(safeScore);
      return;
    }

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

  const filledSegments = Math.round((safeScore / 100) * SEGMENTS);

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            {t("risk.score")}
          </p>
          <div
            ref={scoreRef}
            className={`mt-1 font-mono text-display tabular-nums ${config.text}`}
            role="status"
            aria-label={t("risk.scoreOf", { score: formatNumber(safeScore) })}
          >
            {safeScore}%
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Icon className={`h-6 w-6 ${config.text}`} aria-hidden="true" />
          <span
            className={`font-mono text-sm uppercase tracking-wider ${config.text}`}
            aria-label={t("risk.level", { level: t(`risk.${level}` as never) })}
          >
            {t(`risk.${level}` as never)}
          </span>
        </div>
      </div>

      {/* Segmented scale. Reads as a meter, and the gaps make the value
          countable rather than impressionistic. */}
      <div
        className="mt-5 flex gap-px"
        role="img"
        aria-label={t("risk.scale")}
      >
        {Array.from({ length: SEGMENTS }, (_, i) => (
          <span
            key={i}
            className={`h-6 flex-1 ${i < filledSegments ? config.fill : config.track}`}
          />
        ))}
      </div>

      <div className={`mt-2 h-px w-full ${config.rule}`} aria-hidden="true" />

      <div className="mt-1 flex justify-between font-mono text-[10px] tabular-nums text-muted-foreground">
        <span>0</span>
        <span>25</span>
        <span>65</span>
        <span>100</span>
      </div>
    </div>
  );
};

export default RiskBadge;
