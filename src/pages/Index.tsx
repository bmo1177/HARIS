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
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      {/*
        `my-auto` on the inner wrapper rather than `justify-center` on the flex
        parent: when a result is shown the content is taller than the viewport,
        and flex centring pushes the overflow off the top where it cannot be
        scrolled to. `margin: auto` degrades correctly in both directions.
      */}
      <main className="container mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8">
        <div className="my-auto">
          {!result && (
            <div className="mb-8 space-y-2 text-center">
              <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
                Got a suspicious message?
              </h2>
              <p className="text-muted-foreground">
                Paste it below. HARIS will analyze it and teach you exactly what it is.
              </p>
              <p className="text-sm text-muted-foreground" dir="rtl" lang="ar">
                درّب حدسك. تفوّق على التهديدات.
              </p>
            </div>
          )}

          {!result ? (
            <MessageAnalyzer onAnalyze={handleAnalyze} isLoading={isLoading} />
          ) : (
            <AnalysisResults result={result} onReset={handleReset} />
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
