import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, PhoneOff, Flag, CheckCircle2, XCircle, ChevronRight, RotateCcw } from "lucide-react";
import { voiceCalls, type VoiceCall } from "@/data/voiceCalls";
import { errorMessage, invokeHarisFunction } from "@/integrations/supabase/functions";
import { useXP } from "@/lib/xpContext";
import { voiceDebriefSchema, type VoiceDebrief } from "@/types/analysis";

const difficultyColor = {
  Beginner: "text-green-600 bg-green-50 border-green-200",
  Intermediate: "text-amber-600 bg-amber-50 border-amber-200",
  Advanced: "text-red-600 bg-red-50 border-red-200",
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
  const [isLoadingDebrief, setIsLoadingDebrief] = useState(false);
  const { awardXP } = useXP();
  const navigate = useNavigate();

  const clearAdvanceTimer = useCallback(() => {
    if (advanceTimerRef.current !== null) {
      window.clearTimeout(advanceTimerRef.current);
      advanceTimerRef.current = null;
    }
  }, []);

  const fetchDebrief = useCallback(async (call: VoiceCall) => {
    setIsLoadingDebrief(true);
    try {
      const flags = userFlagsRef.current;
      const redFlagLines = call.lines
        .map((line, index) => ({ line, index }))
        .filter(({ line }) => line.isRedFlag);
      const totalFlags = redFlagLines.length;
      const caught = redFlagLines.filter(({ index }) => flags.has(index)).length;

      const result = await invokeHarisFunction(
        "voice-debrief",
        {
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
        },
        voiceDebriefSchema,
      );

      setDebrief(result);
    } catch (error) {
      // Previously swallowed entirely, so a failed debrief was invisible.
      toast.error(errorMessage(error));
    } finally {
      setIsLoadingDebrief(false);
    }
  }, []);

  const speakLine = useCallback((call: VoiceCall, lineIndex: number) => {
    if (lineIndex >= call.lines.length) {
      setIsPlaying(false);
      setIsComplete(true);

      const flags = userFlagsRef.current;
      const totalFlags = call.lines.filter((line) => line.isRedFlag).length;
      const caught = call.lines.filter((line, i) => line.isRedFlag && flags.has(i)).length;
      awardXP(caught > 0 && caught / totalFlags >= 0.75 ? 60 : 40);
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
      awardXP(caught > 0 && caught / totalFlags >= 0.75 ? 60 : 40);
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
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
          <h2 className="text-xl font-bold text-foreground">Call Debrief</h2>
          <p className="text-muted-foreground">You caught {caught} of {totalFlags} red flags.</p>

          <div className="space-y-2">
            {selected.lines.map((line, i) => {
              const flagged = userFlags.has(i);
              return (
                <div
                  key={i}
                  className={`p-3 rounded-lg border text-sm ${
                    line.isRedFlag
                      ? flagged
                        ? "border-green-200 bg-green-50"
                        : "border-destructive/20 bg-destructive/5"
                      : flagged
                        ? "border-amber-200 bg-amber-50"
                        : "border-border bg-card"
                  }`}
                  dir={line.lang.startsWith("ar") ? "rtl" : "ltr"}
                >
                  <div className="flex items-start gap-2">
                    {line.isRedFlag && flagged && <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />}
                    {line.isRedFlag && !flagged && <XCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />}
                    <div>
                      <p className="text-foreground">{line.text}</p>
                      {line.isRedFlag && (
                        <p className={`text-xs mt-1 ${flagged ? "text-green-600" : "text-destructive"}`}>
                          {flagged ? "You caught this!" : `Missed: ${line.flagReason}`}
                        </p>
                      )}
                      {!line.isRedFlag && flagged && (
                        <p className="text-xs mt-1 text-amber-600">Good instinct, but this one was safe.</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {isLoadingDebrief ? (
            <div className="rounded-lg border border-border bg-card p-4 flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              HARIS is writing your debrief...
            </div>
          ) : debrief ? (
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <p className="text-sm text-foreground">{debrief.debrief}</p>
              <p className="text-sm font-semibold text-primary">{debrief.top_tip}</p>
            </div>
          ) : null}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setSelected(null)} className="flex-1 gap-2">
              <RotateCcw className="w-4 h-4" /> Try another call
            </Button>
            <Button onClick={() => navigate("/scenarios")} className="flex-1 gap-2">
              Go to Scenarios <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (selected) {
    const line = selected.lines[currentLine];
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-6 max-w-2xl space-y-6">
          <Button variant="ghost" size="sm" onClick={() => { window.speechSynthesis.cancel(); setSelected(null); }}>Back</Button>

          <div className="rounded-xl border-2 border-border bg-card p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Phone className="w-8 h-8 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{selected.callerName}</p>
              <p className="text-sm text-muted-foreground">{selected.callerNumber}</p>
            </div>

            {!isPlaying ? (
              !speechSupported ? (
                <p className="text-sm text-destructive">Voice not supported in your browser. Please use Chrome or Safari.</p>
              ) : (
                <Button onClick={handlePlay} className="gap-2">
                  <Phone className="w-4 h-4" /> Answer Call
                </Button>
              )
            ) : (
              <>
                <div className="min-h-[80px] flex items-center justify-center px-4">
                  <p
                    className={`text-foreground text-center ${isSpeaking ? "animate-pulse" : ""}`}
                    dir={line?.lang.startsWith("ar") ? "rtl" : "ltr"}
                  >
                    {line?.text}
                  </p>
                </div>

                <p className="text-xs text-muted-foreground">
                  Line {currentLine + 1} of {selected.lines.length}
                </p>

                <div className="flex gap-3 justify-center">
                  <Button
                    variant="destructive"
                    onClick={handleFlag}
                    disabled={userFlags.has(currentLine)}
                    className="gap-2"
                  >
                    <Flag className="w-4 h-4" />
                    {userFlags.has(currentLine) ? "Flagged" : "FLAG — Suspicious!"}
                  </Button>
                  <Button variant="outline" onClick={handleEndCall} className="gap-2">
                    <PhoneOff className="w-4 h-4" /> End Call
                  </Button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Voice Lab</h2>
          <p className="text-muted-foreground mt-1">Hear a real scam call. Flag the red flags in real time. Train your ear.</p>
        </div>

        <div className="grid gap-3">
          {voiceCalls.map((call) => (
            <Card key={call.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleStart(call)}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{call.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${difficultyColor[call.difficulty]}`}>
                      {call.difficulty}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{call.description}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
};

export default VoiceLab;
