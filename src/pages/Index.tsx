import { useState } from "react";
import { toast } from "sonner";
import Header from "@/components/Header";
import MessageAnalyzer from "@/components/MessageAnalyzer";
import AnalysisResults from "@/components/AnalysisResults";
import { supabase } from "@/integrations/supabase/client";
import type { AnalysisResult } from "@/types/analysis";

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const handleAnalyze = async (message: string) => {
    setIsLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("analyze-message", {
        body: { message },
      });

      if (error) {
        throw new Error(error.message || "Analysis failed");
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      setResult(data as AnalysisResult);
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
