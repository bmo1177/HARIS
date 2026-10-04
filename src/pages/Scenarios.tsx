import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Target, ChevronRight, RotateCcw, ArrowRight } from "lucide-react";
import { scenarios, type Scenario } from "@/data/scenarios";
import { errorMessage } from "@/lib/api";
import { useHarisMutation } from "@/lib/useHarisMutation";
import { useXP } from "@/lib/xpContext";
import { scenarioMaxReward, scenarioReward } from "@/lib/xp";
import { scenarioFeedbackSchema, type ScenarioFeedback } from "@/types/analysis";

const difficultyColor = {
  Beginner: "text-success bg-success/10 border-success/30",
  Intermediate: "text-warning bg-warning/10 border-warning/30",
  Advanced: "text-destructive bg-destructive/10 border-destructive/30",
};

const Scenarios = () => {
  const [selected, setSelected] = useState<Scenario | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [safeCount, setSafeCount] = useState(0);
  const [redFlags, setRedFlags] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<ScenarioFeedback | null>(null);
  const [chatHistory, setChatHistory] = useState<{ role: "attacker" | "user"; text: string; feedbackData?: ScenarioFeedback }[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const { awardXP } = useXP();
  const navigate = useNavigate();
  const feedbackRequest = useHarisMutation("scenario-feedback", scenarioFeedbackSchema);

  const handleStart = (scenario: Scenario) => {
    setSelected(scenario);
    setStepIndex(0);
    setSafeCount(0);
    setRedFlags([]);
    setFeedback(null);
    setChatHistory([]);
    setIsComplete(false);
    feedbackRequest.reset();
  };

  const handleChoice = async (choiceIndex: number) => {
    if (!selected) return;
    const step = selected.steps[stepIndex];
    const choice = step.choices[choiceIndex];

    setChatHistory((prev) => [
      ...prev,
      { role: "attacker", text: step.attacker },
      { role: "user", text: choice.label },
    ]);

    setFeedback(null);

    try {
      // `choiceType` is deliberately not sent. It used to be passed straight to
      // the model as "this is a safe choice", so the AI was narrating an answer
      // the client already held rather than judging the reply.
      const fb = await feedbackRequest.mutateAsync({
        scenarioTitle: selected.title,
        stepNumber: stepIndex + 1,
        attackerMessage: step.attacker,
        userChoice: choice.label,
      });

      setFeedback(fb);

      if (choice.type === "safe") setSafeCount((c) => c + 1);
      if (fb.red_flag) setRedFlags((prev) => [...prev, fb.red_flag]);

      setChatHistory((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { ...updated[updated.length - 1], feedbackData: fb };
        return updated;
      });
    } catch (error) {
      // Say so rather than silently substituting a canned answer, which left
      // students unable to tell that HARIS had not actually responded.
      toast.error(errorMessage(error));

      const fallbackFb: ScenarioFeedback = {
        safe: choice.type === "safe",
        feedback:
          choice.type === "safe"
            ? "Smart move! You spotted the red flag."
            : choice.type === "unsafe"
              ? "Be careful — this could put your personal information at risk."
              : "Not the worst choice, but there's a safer option.",
        feedback_ar: "",
        red_flag: choice.type !== "safe" ? "Watch for this pattern in real life." : "",
      };
      setFeedback(fallbackFb);
      if (choice.type === "safe") setSafeCount((c) => c + 1);
      if (fallbackFb.red_flag) setRedFlags((prev) => [...prev, fallbackFb.red_flag]);
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
    if (score === 1) message = "Perfect score! You are a human firewall.";
    else if (score >= 0.75) message = "Strong instincts! One slip — review what you missed.";
    else if (score >= 0.5) message = "Getting there. Scammers almost had you.";
    else message = "This scenario would have fooled you — but not anymore.";

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
            <Target className="w-8 h-8 text-primary" aria-hidden="true" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">{safeCount}/{total} Safe Choices</h2>
          <p className="text-muted-foreground">{message}</p>
          <p className="text-sm font-semibold text-primary">
            +{scenarioReward(safeCount, total)} XP
          </p>
        </div>

        {redFlags.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Red flags to remember:</h3>
            {redFlags.map((flag, i) => (
              <div key={i} className="flex items-start gap-2 p-3 rounded-lg border border-destructive/20 bg-destructive/5">
                <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">{flag}</p>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => { setSelected(null); }} className="flex-1 gap-2">
            <RotateCcw className="w-4 h-4" />
            Try another scenario
          </Button>
          <Button onClick={() => navigate("/")} className="flex-1 gap-2">
            <ArrowRight className="w-4 h-4" />
            Test a real message
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
            <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>Back</Button>
            <span className="text-sm text-muted-foreground font-medium">Step {stepIndex + 1} of {selected.steps.length}</span>
          </div>

          <h2 className="text-lg font-bold text-foreground">{selected.title}</h2>

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
                        <div className={`rounded-lg p-3 border text-sm ${msg.feedbackData.safe ? "border-success/30 bg-success/10 text-success" : "border-destructive/20 bg-destructive/5 text-destructive"}`}>
                          {msg.feedbackData.feedback}
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
                  <p className="text-xs text-muted-foreground mb-1">{step.attackerRole}</p>
                  <p className="text-sm text-foreground">{step.attacker}</p>
                </div>
              </div>
            )}
          </div>

          {feedbackRequest.isPending ? (
            <div className="text-center py-4">
              <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                HARIS is evaluating...
              </div>
            </div>
          ) : feedback ? (
            <div className="animate-fade-in">
              <Button onClick={handleNextStep} className="w-full gap-2">
                {stepIndex + 1 >= selected.steps.length ? "See results" : "Next step"}
                <ChevronRight className="w-4 h-4" />
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
                  <span className="text-sm">{choice.label}</span>
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
          <h2 className="text-2xl font-bold text-foreground">Scenario Simulator</h2>
          <p className="text-muted-foreground mt-1">Live through a real attack. Make smart choices. Earn XP.</p>
        </div>

        <div className="grid gap-3">
          {scenarios.map((s) => (
            <Card
              key={s.id}
              role="button"
              tabIndex={0}
              aria-label={`${s.title}. ${s.difficulty}. Up to ${scenarioMaxReward(s.steps.length)} XP.`}
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
                    <h3 className="font-semibold text-foreground">{s.title}</h3>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${difficultyColor[s.difficulty]}`}
                    >
                      {s.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{s.description}</p>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
                  {/* Derived from the same function that pays out, so the card
                      cannot advertise a number the game does not award. */}
                  <span className="text-xs font-semibold text-primary">
                    up to {scenarioMaxReward(s.steps.length)} XP
                  </span>
                  <ChevronRight
                    className="h-4 w-4 text-muted-foreground"
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
