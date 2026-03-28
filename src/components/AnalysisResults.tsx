import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, RotateCcw } from "lucide-react";
import RiskBadge from "./RiskBadge";
import ClueCards from "./ClueCards";
import GuessAttack from "./GuessAttack";
import type { AnalysisResult } from "@/types/analysis";

interface AnalysisResultsProps {
  result: AnalysisResult;
  onReset: () => void;
}

const AnalysisResults = ({ result, onReset }: AnalysisResultsProps) => {
  const [showGuess, setShowGuess] = useState(false);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <RiskBadge score={result.risk_score} level={result.risk_level} />

      {result.is_threat && (
        <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
          <p className="text-sm font-medium text-red-800 dark:text-red-300">
            Threat detected — do not click any links in this message
          </p>
        </div>
      )}

      <ClueCards
        clues={[result.clue_1, result.clue_2, result.clue_3]}
        onAllRevealed={() => setShowGuess(true)}
      />

      {showGuess && (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
          <GuessAttack
            attackType={result.attack_type}
            explanation={result.explanation}
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
