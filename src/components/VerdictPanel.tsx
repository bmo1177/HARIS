import type { RefObject } from "react";
import { Shield, ShieldAlert, ShieldCheck, ShieldQuestion } from "lucide-react";
import { useI18n } from "@/lib/useI18n";
import type { AnalysisResult } from "@/types/analysis";

type RiskLevel = AnalysisResult["risk_level"];

interface VerdictPanelProps {
  level: RiskLevel;
  /** Focus target: the result replaces the form, so the heading receives focus. */
  headingRef?: RefObject<HTMLHeadingElement>;
  /** Absent/"model" means the deployed model; "local" means the rule set. */
  source?: AnalysisResult["analysis_source"];
}

/**
 * The verdict, as a band rather than a measurement.
 *
 * The model answers with one of four bands and the server derives a
 * representative score from it, so a continuous meter (the 28-segment gauge
 * with an animated percentage this replaces) claimed a resolution the system
 * does not have. Here the scale has exactly the three outcomes a student can
 * receive, each drawn at the width of its actual range — 0–24, 25–64, 65–100 —
 * and the current band is the only thing marked. No number, no count-up, no
 * ticks in the wrong place.
 */
const CONFIG: Record<
  RiskLevel,
  { text: string; fill: string; icon: typeof ShieldCheck }
> = {
  Safe: { text: "text-success", fill: "bg-success", icon: ShieldCheck },
  Suspicious: { text: "text-warning", fill: "bg-warning", icon: ShieldQuestion },
  Dangerous: { text: "text-destructive", fill: "bg-destructive", icon: ShieldAlert },
};

/** The three bands, at their true relative widths (25 / 40 / 35 out of 100). */
const ZONES: ReadonlyArray<{ level: RiskLevel; width: string }> = [
  { level: "Safe", width: "25fr" },
  { level: "Suspicious", width: "40fr" },
  { level: "Dangerous", width: "35fr" },
];

const VerdictPanel = ({ level, headingRef, source }: VerdictPanelProps) => {
  const { t } = useI18n();
  const config = CONFIG[level] ?? {
    text: "text-muted-foreground",
    fill: "bg-muted-foreground",
    icon: Shield,
  };
  const Icon = config.icon;

  return (
    <section
      className="overflow-hidden rounded-2xl border border-border bg-card shadow-panel animate-fade-up motion-reduce:animate-none"
      aria-labelledby="verdict-heading"
    >
      <div className="flex items-start gap-4 p-5 sm:p-7">
        <span
          className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border animate-scale-in motion-reduce:animate-none ${
            level === "Safe"
              ? "border-success/25 bg-success/10"
              : level === "Suspicious"
                ? "border-warning/25 bg-warning/10"
                : "border-destructive/25 bg-destructive/10"
          }`}
        >
          <Icon className={`h-7 w-7 ${config.text}`} aria-hidden="true" />
        </span>
        <div className="min-w-0 pt-1">
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground rtl:tracking-normal">
            {t("risk.verdict")}
          </p>
          <h1
            id="verdict-heading"
            ref={headingRef}
            tabIndex={-1}
            className={`mt-1.5 text-balance text-4xl font-bold leading-[1.05] tracking-[-0.03em] outline-none rtl:tracking-normal sm:text-5xl ${config.text}`}
          >
            {t(`risk.${level}`)}
          </h1>
          <p className="mt-2.5 max-w-[54ch] text-pretty text-sm leading-relaxed text-muted-foreground sm:text-[15px]">
            {t(`risk.summary.${level}`)}
          </p>
        </div>
      </div>

      <div
        className="grid gap-1.5 px-5 pb-5 sm:px-7 sm:pb-6"
        style={{ gridTemplateColumns: ZONES.map((zone) => zone.width).join(" ") }}
        role="img"
        aria-label={t("risk.zones")}
      >
        {ZONES.map((zone, i) => {
          const active = zone.level === level;
          return (
            <div key={zone.level} className="min-w-0">
              <div className="h-2 overflow-hidden rounded-full bg-muted-foreground/20">
                <div
                  className={`h-full w-full rounded-full [transform-origin:inline-start] motion-safe:animate-zone-fill motion-reduce:animate-none ${active ? CONFIG[zone.level].fill : "bg-muted-foreground/25"}`}
                  style={{ animationDelay: `${120 + i * 140}ms` }}
                />
              </div>
              {/* The tick carries no colour of its own. At 10px a status hue
                  is hard to read and would spend the colour contract on a
                  label; the bar above already states the zone in colour, so
                  weight and `aria-current` mark the active tick. */}
              <p
                aria-current={active ? "true" : undefined}
                className={`mt-2 truncate text-center font-mono text-[10px] uppercase tracking-[0.08em] rtl:tracking-normal ${
                  active ? "font-medium text-foreground" : "text-muted-foreground"
                }`}
              >
                {t(`risk.${zone.level}`)}
              </p>
            </div>
          );
        })}
      </div>

      <p className="border-t border-border px-5 py-3 text-xs leading-relaxed text-muted-foreground sm:px-6">
        {source === "local" ? t("results.limitsLocal") : t("results.limits")}
      </p>
    </section>
  );
};

export default VerdictPanel;
