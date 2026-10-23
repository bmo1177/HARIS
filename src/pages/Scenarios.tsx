import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Target, ChevronRight, RotateCcw, ArrowRight } from "lucide-react";
import { scenarios, type Scenario } from "@/data/scenarios";
import { useErrorMessage } from "@/lib/useErrorMessage";
import { useHarisMutation } from "@/lib/useHarisMutation";
import { useXP } from "@/lib/useXP";
import { useI18n } from "@/lib/useI18n";
import { localizedText } from "@/lib/localized";
import DifficultyMeter from "@/components/DifficultyMeter";
import { scenarioMaxReward, scenarioReward } from "@/lib/xp";
import { scenarioFeedbackSchema, type ScenarioFeedback } from "@/types/analysis";

const Scenarios = () => {
  const [selected, setSelected] = useState<Scenario | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [safeCount, setSafeCount] = useState(0);
  /**
   * Red flags keep both languages: the model returns an English flag and an
   * Arabic one, and which is shown depends on the interface language at the
   * moment it is read.
   */
  const [redFlags, setRedFlags] = useState<{ en: string; ar?: string }[]>([]);
  const [feedback, setFeedback] = useState<ScenarioFeedback | null>(null);
  const [chatHistory, setChatHistory] = useState<{ role: "attacker" | "user"; text: string; feedbackData?: ScenarioFeedback }[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const { awardXP } = useXP();
  const navigate = useNavigate();
  const { t, locale, formatNumber } = useI18n();
  const errorText = useErrorMessage();
  const feedbackRequest = useHarisMutation("scenario-feedback", scenarioFeedbackSchema);

  /**
   * Single definition of "back to the list". The score screen's "Try another
   * scenario" button used to call `setSelected(null)` alone, leaving
   * `isComplete === true` — and since the completion branch is checked after the
   * play branch, the route fell through to `renderScoreScreen()`, which returns
   * null with nothing selected. The result was a blank page with no way back to
   * the list except reloading or navigating away.
   */
  const resetToList = () => {
    setSelected(null);
    setStepIndex(0);
    setSafeCount(0);
    setRedFlags([]);
    setFeedback(null);
    setChatHistory([]);
    setIsComplete(false);
    feedbackRequest.reset();
  };

  const handleStart = (scenario: Scenario) => {
    resetToList();
    setSelected(scenario);
  };

  const handleChoice = async (choiceIndex: number) => {
    if (!selected) return;
    const step = selected.steps[stepIndex];
    const choice = step.choices[choiceIndex];

    // The model is sent exactly what the student read. Asking it to judge an
    // English message while the student answered an Arabic one produced
    // coaching about text the student had never seen.
    const attackerText = locale === "ar" ? step.attackerAr : step.attacker;
    const choiceText = locale === "ar" ? choice.labelAr : choice.label;

    setChatHistory((prev) => [
      ...prev,
      { role: "attacker", text: attackerText },
      { role: "user", text: choiceText },
    ]);

    setFeedback(null);

    try {
      // `choiceType` is deliberately not sent. It used to be passed straight to
      // the model as "this is a safe choice", so the AI was narrating an answer
      // the client already held rather than judging the reply.
      const fb = await feedbackRequest.mutateAsync({
        scenarioTitle: locale === "ar" ? selected.titleAr : selected.title,
        stepNumber: stepIndex + 1,
        attackerMessage: attackerText,
        userChoice: choiceText,
      });

      setFeedback(fb);

      if (choice.type === "safe") setSafeCount((c) => c + 1);
      if (fb.red_flag) {
        setRedFlags((prev) => [...prev, { en: fb.red_flag, ar: fb.red_flag_ar }]);
      }

      setChatHistory((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], feedbackData: fb };
        return updated;
      });
    } catch (error) {
      // Say so rather than silently substituting a canned answer, which left
      // students unable to tell that HARIS had not actually responded.
      toast.error(errorText(error));

      // The canned copy was hardcoded English, so an Arabic student whose
      // request failed was told what went wrong in the one language they can
      // read least well.
      const fallbackFb: ScenarioFeedback = {
        safe: choice.type === "safe",
        feedback:
          choice.type === "safe"
            ? t("scenarios.fallback.safe")
            : choice.type === "unsafe"
              ? t("scenarios.fallback.unsafe")
              : t("scenarios.fallback.neutral"),
        feedback_ar: "",
        red_flag: choice.type !== "safe" ? t("scenarios.fallback.redFlag") : "",
      };
      setFeedback(fallbackFb);
      if (choice.type === "safe") setSafeCount((c) => c + 1);
      if (fallbackFb.red_flag) {
        setRedFlags((prev) => [...prev, { en: fallbackFb.red_flag }]);
      }
    }
  };

  const handleNextStep = () => {
    if (!selected) return;
    if (stepIndex + 1 >= selected.steps.length) {
      setIsComplete(true);
      awardXP(scenarioReward(safeCount, selected.steps.length));
    } else {
      setStepIndex((i) => i + 1);
      setFeedback(null);
    }
  };

  const renderScoreScreen = () => {
    if (!selected) return null;
    const total = selected.steps.length;
    const score = total > 0 ? safeCount / total : 0;

    let message = "";
    if (score === 1) message = t("scenarios.perfect");
    else if (score >= 0.75) message = t("scenarios.strong");
    else if (score >= 0.5) message = t("scenarios.gettingThere");
    else message = t("scenarios.fooled");

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Target className="w-8 h-8 text-primary" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("scenarios.scoreTitle", {
              safe: formatNumber(safeCount),
              total: formatNumber(total),
            })}
          </h1>
          <p className="text-muted-foreground">{message}</p>
          <p className="text-sm font-semibold text-primary">
            {t("scenarios.scoreXp", { xp: formatNumber(scenarioReward(safeCount, total)) })}
          </p>
        </div>

        {redFlags.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">{t("scenarios.redFlags")}</h3>
            {redFlags.map((flag, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">
                  {localizedText(flag.en, flag.ar, locale)}
                </p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={resetToList} className="flex-1 gap-2">
            <RotateCcw className="w-4 h-4" aria-hidden="true" />
            {t("scenarios.tryAnother")}
          </Button>
          <Button onClick={() => navigate("/")} className="flex-1 gap-2">
            <ArrowRight className="w-4 h-4 rtl:rotate-180" aria-hidden="true" />
            {t("scenarios.testReal")}
          </Button>
        </div>
      </div>
    );
  };

  if (selected && !isComplete) {
    const step = selected.steps[stepIndex];
    return (
      <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={resetToList}>
              {t("scenarios.back")}
            </Button>
            <span className="text-sm font-medium text-muted-foreground">
              {t("scenarios.step", {
                current: formatNumber(stepIndex + 1),
                total: formatNumber(selected.steps.length),
              })}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-foreground">{locale === "ar" ? selected.titleAr : selected.title}</h1>

          <div className="space-y-3">
            {chatHistory.map((msg, i) => (
              <div key={i}>
                {msg.role === "attacker" ? (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="rounded-lg border border-border bg-card p-3 max-w-[85%]">
                      <p className="text-xs text-muted-foreground mb-1">{selected.steps[Math.floor(i / 2)]?.attackerRole}</p>
                      <p className="text-sm text-foreground">{msg.text}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-end">
                    <div className="space-y-2 max-w-[85%]">
                      <div className="rounded-lg bg-primary text-primary-foreground p-3">
                        <p className="text-sm">{msg.text}</p>
                      </div>
                      {msg.feedbackData && (
                        <div
                          dir={locale === "ar" ? "rtl" : "ltr"}
                          className={`rounded-lg border p-3 text-sm ${
                            msg.feedbackData.safe
                              ? "border-success/30 bg-success/10 text-success"
                              : "border-destructive/20 bg-destructive/5 text-destructive"
                          }`}
                        >
                          {/* `feedback_ar` was generated on every single call and
                              never rendered. */}
                          {locale === "ar" && msg.feedbackData.feedback_ar
                            ? msg.feedbackData.feedback_ar
                            : msg.feedbackData.feedback}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {!feedback && (
              <div className="flex gap-3 animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="rounded-lg border border-border bg-card p-3 max-w-[85%]">
                  <p className="text-xs text-muted-foreground mb-1">
                    {locale === "ar" ? step.attackerRoleAr : step.attackerRole}
                  </p>
                  <p className="text-sm text-foreground">
                    {locale === "ar" ? step.attackerAr : step.attacker}
                  </p>
                </div>
              </div>
            )}
          </div>

          {feedbackRequest.isPending ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                {t("scenarios.evaluating")}
              </div>
            </div>
          ) : feedback ? (
            <div className="animate-fade-in">
              <Button onClick={handleNextStep} className="w-full gap-2">
                {stepIndex + 1 >= selected.steps.length
                  ? t("scenarios.seeResults")
                  : t("scenarios.nextStep")}
                <ChevronRight className="w-4 h-4 rtl:rotate-180" />
              </Button>
            </div>
          ) : (
            <div className="space-y-2 animate-fade-in">
              {step.choices.map((choice, i) => (
                <Button
                  key={i}
                  variant="outline"
                  className="w-full text-left justify-start h-auto py-3 px-4"
                  onClick={() => handleChoice(i)}
                >
                  <span className="text-sm">
                    {locale === "ar" ? choice.labelAr : choice.label}
                  </span>
                </Button>
              ))}
            </div>
          )}
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="py-2">{renderScoreScreen()}</div>
    );
  }

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t("scenarios.title")}</h1>
          <p className="mt-1 text-muted-foreground">{t("scenarios.subtitle")}</p>
        </div>

        <div className="grid gap-3">
          {scenarios.map((s) => (
            <Card
              key={s.id}
              role="button"
              tabIndex={0}
              // No aria-label. The card's own text is its name, which is both
              // what a voice-control user can see and what a screen reader
              // should hear — the old label named the card "Title. Difficulty.
              // up to 40 XP." while the description, the part that says what the
              // scenario is, was visible but not in the name. An author-supplied
              // name that omits visible text also breaks WCAG 2.5.3 (Label in
              // Name), which is what the accessibility gate flags.
              className="cursor-pointer hover:shadow-md transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              onClick={() => handleStart(s)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleStart(s);
                }
              }}
            >
              {/* Stacks on narrow screens. Previously the XP badge and chevron
                  were vertically centred against a description that wrapped to
                  three lines, which tore a hole in the middle of the card. */}
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                      {locale === "ar" ? s.titleAr : s.title}
                    </h3>
                    <DifficultyMeter difficulty={s.difficulty} />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {locale === "ar" ? s.descriptionAr : s.description}
                  </p>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
                  {/* Derived from the same function that pays out, so the card
                      cannot advertise a number the game does not award. */}
                  <span className="text-xs font-semibold text-primary">
                    {t("scenarios.upToXp", {
                      xp: formatNumber(scenarioMaxReward(s.steps.length)),
                    })}
                  </span>
                  <ChevronRight
                    className="h-4 w-4 text-muted-foreground rtl:rotate-180"
                    aria-hidden="true"
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
    </div>
  );
};

export default Scenarios;
