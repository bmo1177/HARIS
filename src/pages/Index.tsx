import { useState } from "react";
import { toast } from "sonner";
import Header from "@/components/Header";
import MessageAnalyzer from "@/components/MessageAnalyzer";
import AnalysisResults from "@/components/AnalysisResults";
import { errorMessage, invokeHarisFunction } from "@/integrations/supabase/functions";
import { useXP } from "@/lib/xpContext";
import { REWARDS } from "@/lib/xp";
import { analysisResultSchema, type AnalysisResult } from "@/types/analysis";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { awardXP } = useXP();

  const handleAnalyze = async (message: string) => {
    setIsLoading(true);
    setResult(null);

    try {
      const analysis = await invokeHarisFunction(
        "analyze-message",
        { message },
        analysisResultSchema,
      );

      setResult(analysis);
      awardXP(REWARDS.analysis);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {!result && (
          <div className="text-center mb-8 space-y-2">
            <h2 className="text-2xl font-bold text-foreground">Got a suspicious message?</h2>
            <p className="text-muted-foreground">Paste it below. HARIS will analyze it and teach you exactly what it is.</p>
            <p className="text-sm text-muted-foreground" dir="rtl" lang="ar">درّب حدسك. تفوّق على التهديدات.</p>
          </div>
        )}

        {!result ? (
          <MessageAnalyzer onAnalyze={handleAnalyze} isLoading={isLoading} />
        ) : (
          <AnalysisResults result={result} onReset={handleReset} />
        )}
      </main>
    </div>
  );
};

export default Index;
