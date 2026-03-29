import { useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, PhoneOff, Flag, CheckCircle2, XCircle, ChevronRight, RotateCcw } from "lucide-react";
import { voiceCalls, type VoiceCall, type CallLine } from "@/data/voiceCalls";
import { supabase } from "@/integrations/supabase/client";
import { useXP } from "@/lib/xpContext";

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
  const [debrief, setDebrief] = useState<{ debrief: string; debrief_ar: string; top_tip: string; top_tip_ar: string } | null>(null);
  const [speechSupported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);
  const utterRef = useRef<SpeechSynthesisUtterance | null>(null);
  const { awardXP } = useXP();
  const navigate = useNavigate();

  const speakLine = useCallback((call: VoiceCall, lineIndex: number) => {
    if (lineIndex >= call.lines.length) {
      setIsPlaying(false);
      setIsComplete(true);
      // Award XP
      const totalFlags = call.lines.filter((l) => l.isRedFlag).length;
      const caught = call.lines.filter((l, i) => l.isRedFlag && userFlags.has(i)).length;
      let xp = 40;
      if (totalFlags > 0 && caught / totalFlags >= 0.75) xp += 20;
      awardXP(xp);
      fetchDebrief(call);
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
      setTimeout(() => speakLine(call, lineIndex + 1), 1200);
    };
    utter.onerror = () => {
      setIsSpeaking(false);
      setTimeout(() => speakLine(call, lineIndex + 1), 500);
    };
    utterRef.current = utter;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  }, [userFlags, awardXP]);

  const fetchDebrief = async (call: VoiceCall) => {
    try {
      const totalFlags = call.lines.filter((l) => l.isRedFlag).length;
      const caught = call.lines.filter((l, i) => l.isRedFlag && userFlags.has(i)).length;
      const missed = totalFlags - caught;

      const { data } = await supabase.functions.invoke("voice-debrief", {
        body: {
          callTitle: call.title,
          totalFlags,
          caughtFlags: caught,
          missedFlags: missed,
          flagDetails: call.lines.map((l, i) => ({
            text: l.text,
            isRedFlag: l.isRedFlag,
            flagReason: l.flagReason,
            userFlagged: userFlags.has(i),
          })),
        },
      });

      if (data) setDebrief(data);
    } catch {
      // fallback
    }
  };

  const handleStart = (call: VoiceCall) => {
    setSelected(call);
    setCurrentLine(0);
    setIsPlaying(false);
    setIsSpeaking(false);
    setUserFlags(new Set());
    setIsComplete(false);
    setDebrief(null);
  };

  const handlePlay = () => {
    if (!selected || !speechSupported) return;
    setIsPlaying(true);
    speakLine(selected, 0);
  };

  const handleEndCall = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
    setIsComplete(true);
    if (selected) {
      awardXP(40);
      fetchDebrief(selected);
    }
  };

  const handleFlag = () => {
    setUserFlags((prev) => new Set(prev).add(currentLine));
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

          {debrief && (
            <div className="rounded-lg border border-border bg-card p-4 space-y-2">
              <p className="text-sm text-foreground">{debrief.debrief}</p>
              <p className="text-sm font-semibold text-primary">{debrief.top_tip}</p>
            </div>
          )}

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
