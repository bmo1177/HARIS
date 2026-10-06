import { useState } from "react";
import { Play, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/i18n";
import { blueBattery } from "@/sandbox/dataset";
import { DEFAULT_GUARDRAILS, evaluateBattery } from "@/sandbox/engine";
import type { BatteryReport, GuardrailConfig, GuardrailRuleId } from "@/sandbox/types";

const RULE_LABEL: Record<GuardrailRuleId, "sandbox.blue.stripControl" | "sandbox.blue.removeFences" | "sandbox.blue.neutralizeOverrides" | "sandbox.blue.requireClosed" | "sandbox.blue.denyOutput"> = {
  stripControlChars: "sandbox.blue.stripControl",
  removeFenceTags: "sandbox.blue.removeFences",
  neutralizeOverrides: "sandbox.blue.neutralizeOverrides",
  requireClosedBoundary: "sandbox.blue.requireClosed",
  denyOutputMarkers: "sandbox.blue.denyOutput",
};

/**
 * Mode 2: author defenses, then run the fixed battery against them.
 *
 * The battery never changes — the same ten payloads every run — so the only
 * variable is the configuration on this screen. That is what makes the scores
 * comparable across attempts: a better number means better rules, not an
 * easier test.
 */
const BlueWorkshop = () => {
  const { locale, t, formatNumber } = useI18n();
  const [config, setConfig] = useState<GuardrailConfig>(DEFAULT_GUARDRAILS);
  const [report, setReport] = useState<BatteryReport | null>(null);

  const update = <K extends keyof GuardrailConfig>(key: K, value: GuardrailConfig[K]): void =>
    setConfig((prev) => ({ ...prev, [key]: value }));

  const reset = () => {
    setConfig(DEFAULT_GUARDRAILS);
    setReport(null);
  };

  const toggleRow = (
    key: "stripControlChars" | "removeFenceTags" | "neutralizeOverrides" | "requireClosedBoundary" | "denyOutputMarkers",
    labelKey: Parameters<typeof t>[0],
  ) => (
    <label className="flex cursor-pointer items-start gap-2 text-sm text-foreground">
      <input
        type="checkbox"
        checked={config[key]}
        onChange={(e) => update(key, e.target.checked)}
        className="mt-1 h-4 w-4 accent-current"
      />
      <span>{t(labelKey)}</span>
    </label>
  );

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">{t("sandbox.blue.title")}</h2>

      <Card>
        <CardContent className="space-y-3 p-4">
          <label htmlFor="blue-system-prompt" className="text-sm font-medium text-foreground">
            {t("sandbox.blue.systemPrompt")}
          </label>
          <Textarea
            id="blue-system-prompt"
            value={config.systemPrompt}
            maxLength={2000}
            onChange={(e) => update("systemPrompt", e.target.value)}
            rows={3}
          />
          <div className="space-y-2">
            {toggleRow("stripControlChars", "sandbox.blue.stripControl")}
            {toggleRow("removeFenceTags", "sandbox.blue.removeFences")}
            {toggleRow("neutralizeOverrides", "sandbox.blue.neutralizeOverrides")}
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <label htmlFor="blue-open" className="text-sm font-medium text-foreground">
                {t("sandbox.blue.open")}
              </label>
              <Input
                id="blue-open"
                value={config.boundaryOpen}
                maxLength={24}
                onChange={(e) => update("boundaryOpen", e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="blue-close" className="text-sm font-medium text-foreground">
                {t("sandbox.blue.close")}
              </label>
              <Input
                id="blue-close"
                value={config.boundaryClose}
                maxLength={24}
                onChange={(e) => update("boundaryClose", e.target.value)}
                dir="ltr"
              />
            </div>
          </div>
          <div className="space-y-2">
            {toggleRow("requireClosedBoundary", "sandbox.blue.requireClosed")}
            {toggleRow("denyOutputMarkers", "sandbox.blue.denyOutput")}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              onClick={() => setReport(evaluateBattery(blueBattery, config))}
              className="flex-1"
            >
              <Play className="h-4 w-4" aria-hidden="true" />
              {t("sandbox.blue.run")}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                setConfig((prev) => ({
                  ...prev,
                  stripControlChars: true,
                  removeFenceTags: true,
                  neutralizeOverrides: true,
                  requireClosedBoundary: true,
                  denyOutputMarkers: true,
                }))
              }
            >
              {t("sandbox.blue.enableAll")}
            </Button>
            <Button type="button" variant="outline" onClick={reset}>
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              {t("sandbox.blue.reset")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {!report ? (
        <p className="text-sm text-muted-foreground">{t("sandbox.blue.noRun")}</p>
      ) : (
        <div className="space-y-3">
          <Card>
            <CardContent className="space-y-3 p-4">
              <div>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium text-foreground">{t("sandbox.blue.defense")}</span>
                  <span className="font-mono" dir="ltr">
                    {formatNumber(report.defenseEfficacy)}% ·{" "}
                    {t("analyzer.counter", {
                      count: report.attacksBlocked,
                      max: report.attacksTotal,
                    })}
                  </span>
                </div>
                <Progress value={report.defenseEfficacy} className="mt-1" />
              </div>
              <div>
                <div className="flex items-baseline justify-between gap-2 text-sm">
                  <span className="font-medium text-foreground">{t("sandbox.blue.utility")}</span>
                  <span className="font-mono" dir="ltr">
                    {formatNumber(report.utility)}% ·{" "}
                    {t("analyzer.counter", {
                      count: report.benignAnswered,
                      max: report.benignTotal,
                    })}
                  </span>
                </div>
                <Progress value={report.utility} className="mt-1" />
              </div>
            </CardContent>
          </Card>

          <h3 className="text-sm font-semibold text-foreground">{t("sandbox.blue.log")}</h3>
          <ol className="space-y-2">
            {report.log.map((run) => {
              const batteryCase = blueBattery.find((c) => c.id === run.caseId)!;
              return (
                <li key={run.caseId} className="rounded-lg border border-border bg-card p-3 text-sm">
                  <div className="flex items-center justify-between gap-2">
                    <span dir="ltr" className="font-mono text-xs text-muted-foreground">
                      {run.caseId}
                    </span>
                    <span
                      className={`text-xs font-bold ${run.passed ? "text-foreground" : "text-muted-foreground"}`}
                    >
                      {run.passed ? t("sandbox.blue.passed") : t("sandbox.blue.failed")}
                    </span>
                  </div>
                  <p className="mt-1 text-foreground">
                    {run.blocked ? t("sandbox.blue.blocked") : t("sandbox.blue.allowed")}
                    {" · "}
                    <span className="text-muted-foreground">
                      {run.expectedBlocked ? t("sandbox.blue.blocked") : t("sandbox.blue.allowed")}
                    </span>
                  </p>
                  {run.blockedBy.length > 0 && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {run.blockedBy.map((rule) => t(RULE_LABEL[rule])).join(" · ")}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground" dir="auto">
                    {locale === "ar" ? batteryCase.rationaleAr : batteryCase.rationale}
                  </p>
                  <p dir="auto" className="mt-1 break-words text-xs text-muted-foreground">
                    {batteryCase.payload}
                  </p>
                  <p dir="auto" className="mt-1 break-words text-xs text-muted-foreground">
                    {locale === "ar" ? run.assistantPreviewAr : run.assistantPreview}
                  </p>
                </li>
              );
            })}
          </ol>
        </div>
      )}
    </div>
  );
};

export default BlueWorkshop;
