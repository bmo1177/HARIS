import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, PhoneOff, Flag, CheckCircle2, XCircle, ChevronRight, RotateCcw } from "lucide-react";
import { voiceCalls, type VoiceCall } from "@/data/voiceCalls";
import { errorMessage } from "@/lib/api";
import { useHarisMutation } from "@/lib/useHarisMutation";
import { useXP } from "@/lib/xpContext";
import { useI18n } from "@/lib/i18n";
import { voiceCallReward } from "@/lib/xp";
import { voiceDebriefSchema, type VoiceDebrief } from "@/types/analysis";

const difficultyColor = {
  Beginner: "text-success bg-success/10 border-success/30",
  Intermediate: "text-warning bg-warning/10 border-warning/30",
  Advanced: "text-destructive bg-destructive/10 border-destructive/30",
};

const VoiceLab = () => {
  const [selected, setSelected] = useState<VoiceCall | null>(null);
  const [currentLine, setCurrentLine] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [userFlags, setUserFlags] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);
  const [debrief, setDebrief] = useState<VoiceDebrief | null>(null);
  const [speechSupported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  /**
   * Flags live in a ref as well as state.
   *
   * `speakLine` schedules itself through `setTimeout` inside `utter.onend`, which
   * captures the `speakLine` closure from the render in which the utterance was
   * created. With flags in state, pressing FLAG mid-call produced a new
   * `speakLine`, but the already-scheduled timer still called the old one — so
   * every flag clicked after the first line was silently discarded from the
   * final score, the XP bonus, and the AI debrief.
   */
  const userFlagsRef = useRef<Set<number>>(new Set());
  const advanceTimerRef = useRef<number | null>(null);
  const { awardXP } = useXP();
  const navigate = useNavigate();
  const { t, locale, formatNumber } = useI18n();
  const debriefRequest = useHarisMutation("voice-debrief", voiceDebriefSchema);

  const clearAdvanceTimer = useCallback(() => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, []);

  const fetchDebrief = useCallback(
    async (call: VoiceCall) => {
      const flags = userFlagsRef.current;
      const redFlagLines = call.lines
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => line.isRedFlag);
      const totalFlags = redFlagLines.length;
      const caught = redFlagLines.filter(({ index }) => flags.has(index)).length;

      try {
        const result = await debriefRequest.mutateAsync({
          callTitle: call.title,
          totalFlags,
          caughtFlags: caught,
          missedFlags: totalFlags - caught,
          flagDetails: redFlagLines.map(({ line, index }) => ({
            lineNumber: index + 1,
            text: line.text,
            isRedFlag: line.isRedFlag,
            flagReason: line.flagReason,
            userFlagged: flags.has(index),
          })),
        });

        setDebrief(result);
      } catch (error) {
        // Previously swallowed entirely, so a failed debrief was invisible.
        toast.error(errorMessage(error));
      }
    },
    [debriefRequest],
  );

  const speakLine = useCallback((call: VoiceCall, lineIndex: number) => {
    if (lineIndex >= call.lines.length) {
      setIsPlaying(false);
      setIsComplete(true);

      const flags = userFlagsRef.current;
      const totalFlags = call.lines.filter((line) => line.isRedFlag).length;
      const caught = call.lines.filter((line, i) => line.isRedFlag && flags.has(i)).length;
      awardXP(voiceCallReward(caught, totalFlags));
      void fetchDebrief(call);
      return;
    }

    const line = call.lines[lineIndex];
    setCurrentLine(lineIndex);
    setIsSpeaking(true);

    const utter = new SpeechSynthesisUtterance(line.text);
    utter.lang = line.lang;
    utter.rate = 0.9;
    utter.onend = () => {
      setIsSpeaking(false);
      clearAdvanceTimer();
      advanceTimerRef.current = window.setTimeout(() => speakLine(call, lineIndex + 1), 1200);
    };
    utter.onerror = () => {
      setIsSpeaking(false);
      clearAdvanceTimer();
      advanceTimerRef.current = window.setTimeout(() => speakLine(call, lineIndex + 1), 500);
    };
    utterRef.current = utter;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }, [awardXP, clearAdvanceTimer, fetchDebrief]);

  // Leaving the page mid-call used to leave the phone talking, because
  // speechSynthesis was only cancelled by the Back button.
  useEffect(() => {
    return () => {
      if (advanceTimerRef.current !== null) window.clearTimeout(advanceTimerRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);

  const handleStart = (call: VoiceCall) => {
    clearAdvanceTimer();
    window.speechSynthesis?.cancel();
    setSelected(call);
    setCurrentLine(0);
    setIsPlaying(false);
    setIsSpeaking(false);
    setUserFlags(new Set());
    userFlagsRef.current = new Set();
    setIsComplete(false);
    setDebrief(null);
    debriefRequest.reset();
  };

  const handlePlay = () => {
    if (!selected || !speechSupported) return;
    setIsPlaying(true);
    speakLine(selected, 0);
  };

  const handleEndCall = () => {
    clearAdvanceTimer();
    window.speechSynthesis?.cancel();
    setIsPlaying(false);
    setIsSpeaking(false);
    setIsComplete(true);
    if (selected) {
      // Was a flat 40 XP regardless of performance, which made hanging up
      // immediately strictly better than playing well.
      const flags = userFlagsRef.current;
      const totalFlags = selected.lines.filter((line) => line.isRedFlag).length;
      const caught = selected.lines.filter((line, i) => line.isRedFlag && flags.has(i)).length;
      awardXP(voiceCallReward(caught, totalFlags));
      void fetchDebrief(selected);
    }
  };

  const handleFlag = () => {
    setUserFlags((prev) => {
      const next = new Set(prev).add(currentLine);
      userFlagsRef.current = next;
      return next;
    });
  };

  if (selected && isComplete) {
    const totalFlags = selected.lines.filter((l) => l.isRedFlag).length;
    const caught = selected.lines.filter((l, i) => l.isRedFlag && userFlags.has(i)).length;

    return (
      <div className="space-y-6">
          <h2 className="text-xl font-bold text-foreground">{t("voice.debrief")}</h2>
          <p className="text-muted-foreground">
            {t("voice.caught", {
              caught: formatNumber(caught),
              total: formatNumber(totalFlags),
            })}
          </p>

          <div className="space-y-2">
            {selected.lines.map((line, i) => {
              const flagged = userFlags.has(i);
              return (
                <div
                  key={i}
                  className={`p-3 rounded-lg border text-sm ${
                    line.isRedFlag
                      ? flagged
                        ? "border-success/30 bg-success/10"
                        : "border-destructive/20 bg-destructive/5"
                      : flagged
                        ? "border-warning/30 bg-warning/10"
                        : "border-border bg-card"
                  }`}
                  dir={line.lang.startsWith("ar") ? "rtl" : "ltr"}
                >
                  <div className="flex items-start gap-2">
                    {line.isRedFlag && flagged && <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />}
                    {line.isRedFlag && !flagged && <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />}
                    <div>
                      <p className="text-foreground">{line.text}</p>
                      {line.isRedFlag && (
                        <p className={`text-xs mt-1 ${flagged ? "text-success" : "text-destructive"}`}>
                          {flagged
                            ? t("scenarios.caught")
                            : t("scenarios.missed", { reason: line.flagReason ?? "" })}
                        </p>
                      )}
                      {!line.isRedFlag && flagged && (
                        <p className="mt-1 text-xs text-warning">
                          {t("scenarios.overFlagged")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {debriefRequest.isPending ? (
            <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              {t("voice.writingDebrief")}
            </div>
          ) : debrief ? (
            /* `debrief_ar` and `top_tip_ar` were generated on every completed
               call and never rendered. */
            <div
              dir={locale === "ar" ? "rtl" : "ltr"}
              className="space-y-2 rounded-lg border border-border bg-card p-4"
            >
              <p className="text-sm text-foreground">
                {locale === "ar" && debrief.debrief_ar ? debrief.debrief_ar : debrief.debrief}
              </p>
              <p className="text-sm font-semibold text-primary">
                {locale === "ar" && debrief.top_tip_ar ? debrief.top_tip_ar : debrief.top_tip}
              </p>
            </div>
          ) : null}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setSelected(null)} className="flex-1 gap-2">
              <RotateCcw className="w-4 h-4" aria-hidden="true" /> {t("voice.tryAnother")}
            </Button>
            <Button onClick={() => navigate("/scenarios")} className="flex-1 gap-2">
              {t("voice.goToScenarios")} <ChevronRight className="w-4 h-4" aria-hidden="true" />
            </Button>
          </div>
      </div>
    );
  }

  if (selected) {
    const line = selected.lines[currentLine];
    return (
      <div className="flex h-full flex-col">
          <div className="my-auto space-y-6">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  window.speechSynthesis.cancel();
                  setSelected(null);
                }}
              >
                Back
              </Button>
              {isPlaying && (
                <span className="text-sm font-medium text-muted-foreground">
                  {t("voice.line", {
                    current: formatNumber(currentLine + 1),
                    total: formatNumber(selected.lines.length),
                  })}
                </span>
              )}
            </div>

            <div className="space-y-4 rounded-xl border-2 border-border bg-card p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
                <Phone className="h-8 w-8 text-primary" aria-hidden="true" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{selected.callerName}</p>
                <p className="text-sm text-muted-foreground">{selected.callerNumber}</p>
              </div>

              {!isPlaying ? (
                !speechSupported ? (
                  <div className="space-y-2">
                    <p className="text-sm text-destructive">
                      {t("voice.unsupported")}
                    </p>
                    {/* The lesson still works: the transcript is the exercise, the
                        audio is only a convenience. */}
                    <Button onClick={handleEndCall} variant="outline" className="gap-2">
                      <PhoneOff className="h-4 w-4" /> Skip to the debrief
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      Answer the call. Tap <span className="font-medium text-foreground">FLAG</span>{" "}
                      the moment a line feels off — you will not be told whether you were right
                      until the debrief.
                    </p>
                    <Button onClick={handlePlay} className="gap-2">
                      <Phone className="h-4 w-4" aria-hidden="true" /> {t("voice.answer")}
                    </Button>
                  </div>
                )
              ) : (
                <>
                  {/* A caption region: `aria-live` so each line is announced as it
                      is spoken, and `lang` so an Arabic line is read by a screen
                      reader using an Arabic voice. */}
                  <div
                    className="min-h-[5rem] flex items-center justify-center px-4"
                    role="status"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    <p
                      className={`text-foreground text-center ${isSpeaking ? "animate-pulse" : ""}`}
                      dir={line?.lang.startsWith("ar") ? "rtl" : "ltr"}
                      lang={line?.lang}
                      /* The transcript is the lesson; audio is a convenience, so
                         an Arabic line stays readable whatever the speech voice. */
                    >
                      {line?.text}
                    </p>
                  </div>

                  <div
                    className="mx-auto h-1 w-40 overflow-hidden rounded-full bg-muted"
                    role="progressbar"
                    aria-label={t("voice.callProgress")}
                    aria-valuemin={1}
                    aria-valuemax={selected.lines.length}
                    aria-valuenow={currentLine + 1}
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500"
                      style={{
                        width: `${((currentLine + 1) / selected.lines.length) * 100}%`,
                      }}
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <Button
                      variant="destructive"
                      onClick={handleFlag}
                      disabled={userFlags.has(currentLine)}
                      className="gap-2"
                    >
                      <Flag className="h-4 w-4" aria-hidden="true" />
                      {userFlags.has(currentLine) ? t("voice.flagged") : t("voice.flag")}
                    </Button>
                    <Button variant="outline" onClick={handleEndCall} className="gap-2">
                      <PhoneOff className="h-4 w-4" aria-hidden="true" /> {t("voice.endCall")}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{t("voice.title")}</h2>
          <p className="mt-1 text-muted-foreground">{t("voice.subtitle")}</p>
        </div>

        <div className="grid gap-3">
          {voiceCalls.map((call) => (
            <Card
              key={call.id}
              role="button"
              tabIndex={0}
              aria-label={`${locale === "ar" ? call.titleAr : call.title}. ${t(`difficulty.${call.difficulty}` as const)}.`}
              className="cursor-pointer hover:shadow-md transition-shadow focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              onClick={() => handleStart(call)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleStart(call);
                }
              }}
            >
              <CardContent className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-foreground">
                      {locale === "ar" ? call.titleAr : call.title}
                    </h3>
                    <span
                      className={`rounded-full border px-2 py-0.5 text-xs ${difficultyColor[call.difficulty]}`}
                    >
                      {t(`difficulty.${call.difficulty}` as const)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {locale === "ar" ? call.descriptionAr : call.description}
                  </p>
                </div>
                <div className="flex shrink-0 items-center justify-between gap-2 sm:justify-end">
                  <span className="text-xs font-semibold text-primary">
                    {t("voice.redFlagCount", {
                      count: formatNumber(call.lines.filter((line) => line.isRedFlag).length),
                    })}
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

export default VoiceLab;
