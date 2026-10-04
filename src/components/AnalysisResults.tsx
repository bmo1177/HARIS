import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, RotateCcw } from "lucide-react";
import RiskBadge from "./RiskBadge";
import ClueCards from "./ClueCards";
import GuessAttack from "./GuessAttack";
import { useXP } from "@/lib/xpContext";
import { REWARDS } from "@/lib/xp";
import type { AnalysisResult } from "@/types/analysis";

interface AnalysisResultsProps {
  result: AnalysisResult;
  onReset: () => void;
}

const AnalysisResults = ({ result, onReset }: AnalysisResultsProps) => {
  const [showGuess, setShowGuess] = useState(false);
  const { awardXP } = useXP();

  const handleAllCluesRevealed = () => {
    awardXP(REWARDS.allCluesRevealed);
    setShowGuess(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <RiskBadge score={result.risk_score} level={result.risk_level} />

      {result.is_threat && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive shrink-0" />
          <p className="text-sm font-medium text-destructive">
            Do not click any links in this message!
          </p>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Why HARIS flagged this — <span dir="rtl" lang="ar">اكتشف السبب</span>
        </h3>
        <ClueCards
          clues={[result.clue_1, result.clue_2, result.clue_3]}
          onAllRevealed={handleAllCluesRevealed}
        />
      </div>

      {showGuess && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          {/* Only asked when there is an attack to name. */}
          {result.is_threat ? (
            <GuessAttack
              attackType={result.attack_type}
              onCorrectGuess={(attempt) =>
                awardXP(
                  attempt === 1 ? REWARDS.correctGuessFirstTry : REWARDS.correctGuessRetry,
                )
              }
            />
          ) : (
            <div className="rounded-xl border border-success/30 bg-success/10 p-5 animate-fade-in">
              <p className="text-sm text-success">
                <span className="font-semibold">Nothing to guess here.</span> This message showed
                no attack indicators — noticing that is the skill. Try a message you suspect is
                hostile and see what HARIS spots.
              </p>
            </div>
          )}
        </div>
      )}

      <Tabs defaultValue="en" className="mt-6">
        <TabsList>
          <TabsTrigger value="en">English</TabsTrigger>
          <TabsTrigger value="ar">العربية</TabsTrigger>
        </TabsList>
        <TabsContent value="en" className="rounded-lg border border-border bg-card p-4 mt-3">
          <p className="text-sm text-foreground leading-relaxed">{result.explanation}</p>
        </TabsContent>
        <TabsContent value="ar" className="rounded-lg border border-border bg-card p-4 mt-3">
          <p className="text-sm text-foreground leading-relaxed" dir="rtl" lang="ar">
            {result.explanation_ar}
          </p>
        </TabsContent>
      </Tabs>

      <Button variant="outline" onClick={onReset} className="w-full gap-2">
        <RotateCcw className="w-4 h-4" />
        Analyze another message
      </Button>
    </div>
  );
};

export default AnalysisResults;
