import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, RotateCcw } from "lucide-react";
import RiskBadge from "./RiskBadge";
import ClueCards from "./ClueCards";
import GuessAttack from "./GuessAttack";
import { useXP } from "@/lib/xpContext";
import type { AnalysisResult } from "@/types/analysis";

interface AnalysisResultsProps {
  result: AnalysisResult;
  onReset: () => void;
}

const AnalysisResults = ({ result, onReset }: AnalysisResultsProps) => {
  const [showGuess, setShowGuess] = useState(false);
  const { awardXP } = useXP();

  const handleAllCluesRevealed = () => {
    awardXP(15); // +15 for revealing all clues
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
          <GuessAttack
            attackType={result.attack_type}
            explanation={result.explanation}
            onCorrectGuess={(attempt) => {
              awardXP(attempt === 1 ? 30 : 15);
            }}
          />
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
