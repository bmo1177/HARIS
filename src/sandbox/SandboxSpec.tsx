import { useI18n } from "@/lib/i18n";
import { blueBattery, redChallenges } from "@/sandbox/dataset";

/**
 * The four requested deliverables, rendered rather than attached:
 * schemas, engine pseudocode, component outline, and the battery itself.
 * Code samples stay left-to-right inside an RTL page so brackets never mirror.
 */
const SandboxSpec = () => {
  const { locale, t } = useI18n();

  const code = (children: string) => (
    <pre
      dir="ltr"
      className="overflow-x-auto whitespace-pre rounded bg-muted p-3 font-mono text-[11px] leading-relaxed text-foreground"
    >
      {children}
    </pre>
  );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-foreground">{t("sandbox.spec.title")}</h2>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">{t("sandbox.spec.schemas")}</h3>
        {code(`interface RedChallenge {
  id: "credential-leakage" | "unauthorized-transfer"
    | "rag-exfiltration" | "service-disruption";
  level: 1 | 2 | 3 | 4;
  title: string; titleAr: string;
  objective: string; objectiveAr: string;
  context: string;            // simulated config, never real data
  triggers: string[];         // lowercase fragments
  flags: string[];            // MOCK-… markers
  requiredMatches: number;
  refusal: LocalizedText;
  successTemplate: LocalizedText; // contains {flags}
  lockedNotice: LocalizedText;
  hints: LocalizedText[];
  maxAttempts: number;
}

interface GuardrailConfig {
  systemPrompt: string;
  stripControlChars: boolean;
  removeFenceTags: boolean;
  neutralizeOverrides: boolean;
  boundaryOpen: string; boundaryClose: string;
  requireClosedBoundary: boolean;
  denyOutputMarkers: boolean;
  maxOutputLength: number;
}

interface BatteryCase {
  id: string;
  vector: AttackVector | "benign";
  payload: string;            // exact test string
  expectBlocked: boolean;
  mitigatedBy: GuardrailRuleId[];
  rationale: string; rationaleAr: string;
}

interface BatteryReport {
  attacksBlocked: number; attacksTotal: number;
  benignAnswered: number; benignTotal: number;
  defenseEfficacy: number; utility: number; // 0-100, never NaN
  log: BatteryRun[];
}`)}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">{t("sandbox.spec.engine")}</h3>
        {code(`RED: evaluate(challenge, input, failures, locked)
  1. locked? -> locked notice, no run
  2. normalize(input); match challenge.triggers
  3. no hit -> refusal; failures+1; hint from 2nd failure
  4. hit -> answer with flags; matched = flags in answer
  5. success = matched >= requiredMatches
  6. level 4 + success -> locked

BLUE: evaluate(case, config)
  1. sanitize(payload) per enabled rules
  2. wrap in author's delimiters
  3. blockedBy = enabled rules ∩ case.mitigatedBy
  4. blocked? -> refusal, log the rules
  5. else simulate: attack -> marker; benign -> answer
  6. marker in output + denyOutputMarkers? -> block, redact
  7. efficacy = blocked/attacks; utility = answered/benign`)}
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">{t("sandbox.spec.architecture")}</h3>
        <ul className="list-disc space-y-1 ps-5 text-sm text-muted-foreground">
          <li dir="auto">Sandbox page: mode tabs — RedSandbox, BlueWorkshop, SandboxSpec.</li>
          <li dir="auto">RedSandbox: level picker, console, state badge, hint box; state only, verdicts from the engine.</li>
          <li dir="auto">BlueWorkshop: defense editors, run button, metric bars, execution log.</li>
          <li dir="auto">Engine: sanitize, boundary, simulate, evaluate — pure functions, fully unit-tested.</li>
          <li dir="auto">Dataset: four red challenges, ten fixed battery cases; mock markers only.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">{t("sandbox.spec.dataset")}</h3>
        <h4 className="text-sm font-medium text-foreground">{t("sandbox.spec.redLevels")}</h4>
        <ul className="space-y-2">
          {redChallenges.map((c) => (
            <li key={c.id} className="rounded-lg border border-border bg-card p-3 text-sm">
              <p className="font-semibold text-foreground">
                {t("sandbox.red.level", { level: c.level })} · {locale === "ar" ? c.titleAr : c.title}
              </p>
              <p className="text-muted-foreground">
                {locale === "ar" ? c.objectiveAr : c.objective}
              </p>
              <p dir="ltr" className="mt-1 font-mono text-xs text-muted-foreground">
                {c.flags.join(", ")}
              </p>
            </li>
          ))}
        </ul>
        <h4 className="text-sm font-medium text-foreground">{t("sandbox.spec.vectors")}</h4>
        <ul className="space-y-2">
          {blueBattery
            .filter((c) => c.vector !== "benign")
            .map((c) => (
              <li key={c.id} className="rounded-lg border border-border bg-card p-3 text-sm">
                <p dir="ltr" className="font-mono text-xs text-muted-foreground">
                  {c.id}
                </p>
                <p dir="auto" className="mt-1 break-words text-foreground">
                  {c.payload}
                </p>
                <p className="mt-1 text-xs text-muted-foreground" dir="auto">
                  {locale === "ar" ? c.rationaleAr : c.rationale}
                </p>
              </li>
            ))}
        </ul>
        <h4 className="text-sm font-medium text-foreground">{t("sandbox.spec.benign")}</h4>
        <ul className="space-y-2">
          {blueBattery
            .filter((c) => c.vector === "benign")
            .map((c) => (
              <li key={c.id} className="rounded-lg border border-border bg-card p-3 text-sm">
                <p dir="auto" className="break-words text-foreground">
                  {c.payload}
                </p>
                <p className="mt-1 text-xs text-muted-foreground" dir="auto">
                  {locale === "ar" ? c.rationaleAr : c.rationale}
                </p>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
};

export default SandboxSpec;
