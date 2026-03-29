import { useState } from "react";
import { toast } from "sonner";
import Header from "@/components/Header";
import MessageAnalyzer from "@/components/MessageAnalyzer";
import AnalysisResults from "@/components/AnalysisResults";
import { supabase } from "@/integrations/supabase/client";
import { useXP } from "@/lib/xpContext";
import type { AnalysisResult } from "@/types/analysis";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { awardXP } = useXP();

  const handleAnalyze = async (message: string) => {
    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-message", {
        body: { message },
      });

      if (error) throw new Error(error.message || "Analysis failed");
      if (data?.error) throw new Error(data.error);

      setResult(data as AnalysisResult);
      awardXP(10); // +10 XP for completing analysis
    } catch (err: any) {
      console.error("Analysis error:", err);
      toast.error(err.message || "Something went wrong. Please try again.");
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
