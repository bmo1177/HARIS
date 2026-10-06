import { useMemo, useState } from "react";
import { RotateCcw, Send, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useI18n } from "@/lib/useI18n";
import { redChallenges } from "@/sandbox/dataset";
import { simulateRedTurn, targetState } from "@/sandbox/engine";
import { SANDBOX_MAX_INPUT_LENGTH, type RedChallengeId, type RedTurn } from "@/sandbox/types";

interface TurnRecord {
  input: string;
  turn: RedTurn;
}

const stateKey = {
  operational: "sandbox.red.operational",
  degraded: "sandbox.red.degraded",
  locked: "sandbox.red.locked",
} as const;

/**
 * Mode 1: attack the simulated target and watch what happens.
 *
 * The component itself holds no logic beyond session state — attempts,
 * failures, lock status, completion. Every verdict comes from
 * `simulateRedTurn`, so the rules for success live in one tested place rather
 * than drifting between the UI and the engine.
 */
const RedSandbox = () => {
  const { locale, t } = useI18n();
  const [challengeId, setChallengeId] = useState<RedChallengeId>("credential-leakage");
  const [input, setInput] = useState("");
  const [turns, setTurns] = useState<TurnRecord[]>([]);
  const [failures, setFailures] = useState(0);
  const [locked, setLocked] = useState(false);
  const [solved, setSolved] = useState<Record<RedChallengeId, boolean>>({
    "credential-leakage": false,
    "unauthorized-transfer": false,
    "rag-exfiltration": false,
    "service-disruption": false,
  });

  const challenge = useMemo(
    () => redChallenges.find((c) => c.id === challengeId)!,
    [challengeId],
  );
  const state = targetState(failures, locked);
  // `maxAttempts` is the designed budget for the challenge, currently advisory:
  // the engine degrades the target after repeated failures instead of cutting the
  // student off, because a lockout would punish curiosity rather than teach. The
  // factor of two keeps the console bounded if someone hammers the submit button.
  const canSubmit =
    input.trim().length > 0 && !locked && turns.length < challenge.maxAttempts * 2;
  const hint = turns.length > 0 ? turns[turns.length - 1]!.turn.hintIndex : null;
  const lastTurn = turns.length > 0 ? turns[turns.length - 1]!.turn : null;

  const switchChallenge = (id: RedChallengeId) => {
    setChallengeId(id);
    setInput("");
    setTurns([]);
    setFailures(0);
    setLocked(false);
  };

  const resetTarget = () => {
    setInput("");
    setTurns([]);
    setFailures(0);
    setLocked(false);
  };

  const sendAttack = () => {
    const text = input.slice(0, SANDBOX_MAX_INPUT_LENGTH);
    if (text.trim().length === 0) return;
    const turn = simulateRedTurn(challenge, text, failures, locked);
    setTurns((prev) => [...prev, { input: text, turn }]);
    setFailures(turn.consecutiveFailures);
    if (turn.locked) setLocked(true);
    if (turn.success) setSolved((prev) => ({ ...prev, [challengeId]: true }));
    setInput("");
  };

  const assistantText = (turn: RedTurn): string =>
    locale === "ar" ? turn.assistantAr : turn.assistantEn;

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">{t("sandbox.red.title")}</h2>

      <div>
        <p className="mb-2 text-sm font-medium text-foreground">{t("sandbox.red.choose")}</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {redChallenges.map((c) => (
            <Button
              key={c.id}
              type="button"
              variant={c.id === challengeId ? "default" : "outline"}
              size="sm"
              onClick={() => switchChallenge(c.id)}
              className="h-auto flex-col items-start gap-0.5 px-3 py-2 text-start"
            >
              <span className="text-xs font-bold">
                {t("sandbox.red.level", { level: c.level })}
                {solved[c.id] ? " ✓" : ""}
              </span>
              <span className="text-xs font-normal opacity-90">
                {locale === "ar" ? c.titleAr : c.title}
              </span>
            </Button>
          ))}
        </div>
      </div>

      <Card>
        <CardContent className="space-y-2 p-4">
          <p className="text-sm font-semibold text-foreground">{t("sandbox.red.objective")}</p>
          <p className="text-sm text-muted-foreground">
            {locale === "ar" ? challenge.objectiveAr : challenge.objective}
          </p>
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{t("sandbox.red.target")}: </span>
            {locale === "ar" ? challenge.targetNameAr : challenge.targetName}
            {" · "}
            <span className="font-mono text-xs">{t(stateKey[state])}</span>
          </p>
          <details className="text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium text-foreground">
              {t("sandbox.red.console")}
            </summary>
            <pre
              dir="ltr"
              className="mt-2 overflow-x-auto whitespace-pre-wrap break-words rounded bg-muted p-3 font-mono text-[11px] leading-relaxed"
            >
              {challenge.context}
            </pre>
          </details>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <label htmlFor="red-attack-input" className="text-sm font-medium text-foreground">
            {t("sandbox.red.inputLabel")}
          </label>
          <span className="text-xs text-muted-foreground">
            {t("sandbox.red.progress", {
              solved: Object.values(solved).filter(Boolean).length,
              total: redChallenges.length,
            })}
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setInput(challenge.exampleAttack)}
          className="h-auto gap-1 px-2 py-1 text-xs text-muted-foreground"
        >
          {t("analyzer.tryExample")}
        </Button>
        <Textarea
          id="red-attack-input"
          value={input}
          maxLength={SANDBOX_MAX_INPUT_LENGTH}
          onChange={(e) => setInput(e.target.value)}
          placeholder={t("sandbox.red.placeholder")}
          disabled={locked}
          rows={3}
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground" dir="ltr">
            {t("analyzer.counter", { count: input.length, max: SANDBOX_MAX_INPUT_LENGTH })}
          </span>
          <span className="text-xs text-muted-foreground">
            {t("sandbox.red.attempts", { count: turns.length })}
          </span>
        </div>
        <div className="flex gap-2">
          <Button type="button" onClick={sendAttack} disabled={!canSubmit} className="flex-1">
            <Send className="h-4 w-4" aria-hidden="true" />
            {t("sandbox.red.submit")}
          </Button>
          <Button type="button" variant="outline" onClick={resetTarget}>
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {t("sandbox.red.reset")}
          </Button>
        </div>
      </div>

      {lastTurn?.success && (
        <p
          role="status"
          className="rounded-lg border border-border bg-card p-3 text-sm font-semibold text-foreground"
        >
          {t("sandbox.red.success")} · {t("sandbox.red.complete")}
        </p>
      )}

      {hint !== null && (
        <p className="rounded-lg border border-border bg-card p-3 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{t("sandbox.red.hint")}: </span>
          {locale === "ar"
            ? challenge.hints[hint]!.ar
            : challenge.hints[hint]!.en}
        </p>
      )}

      {turns.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">{t("sandbox.red.console")}</h3>
          <ol className="space-y-2">
            {turns.map((record, i) => (
              <li key={i} className="rounded-lg border border-border bg-card p-3 text-sm">
                <p dir="auto" className="break-words text-muted-foreground">
                  <span className="font-mono text-xs">&gt; </span>
                  {record.input}
                </p>
                <p dir="auto" className="mt-1 break-words text-foreground">
                  {assistantText(record.turn)}
                </p>
                {record.turn.matchedFlags.length > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t("sandbox.red.matched")}:{" "}
                    <span dir="ltr" className="font-mono">
                      {record.turn.matchedFlags.join(", ")}
                    </span>
                  </p>
                )}
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  {record.turn.success ? t("sandbox.red.success") : t("sandbox.red.stopped")}
                </p>
              </li>
            ))}
          </ol>
        </div>
      )}

      <p className="flex items-start gap-2 text-xs text-muted-foreground">
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
        {t("sandbox.safety")}
      </p>
    </div>
  );
};

export default RedSandbox;
