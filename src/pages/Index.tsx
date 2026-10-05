import { useState } from "react";
import { toast } from "sonner";
import MessageAnalyzer from "@/components/MessageAnalyzer";
import AnalysisResults from "@/components/AnalysisResults";
import { errorMessage } from "@/lib/api";
import { useI18n } from "@/lib/i18n";
import { useHarisMutation } from "@/lib/useHarisMutation";
import { useXP } from "@/lib/xpContext";
import { REWARDS } from "@/lib/xp";
import { analysisResultSchema, type AnalysisResult } from "@/types/analysis";

const Index = () => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const { awardXP } = useXP();
  const { t } = useI18n();

  const analyze = useHarisMutation("analyze-message", analysisResultSchema);

  const handleAnalyze = async (message: string) => {
    setResult(null);

    try {
      const analysis = await analyze.mutateAsync({ message });
      setResult(analysis);
      awardXP(REWARDS.analysis);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const handleReset = () => {
    setResult(null);
    analyze.reset();
  };

  // `my-auto` rather than `justify-center`: when a result is shown the content is
  // taller than the viewport, and flex centring pushes the overflow off the top
  // where it cannot be scrolled to. `margin: auto` degrades correctly.
  return (
    <div className="flex h-full flex-col">
      <div className="my-auto">
        {!result && (
          <div className="mb-8 space-y-2 text-center">
            <h2 className="text-2xl font-bold text-foreground sm:text-3xl">
              {t("analyzer.title")}
            </h2>
            <p className="text-muted-foreground">
              {t("analyzer.subtitle")}
            </p>
            <p className="text-sm text-muted-foreground" dir="rtl" lang="ar">
              {t("analyzer.tagline")}
            </p>
          </div>
        )}

        {!result ? (
          <MessageAnalyzer onAnalyze={handleAnalyze} isLoading={analyze.isPending} />
        ) : (
          <AnalysisResults result={result} onReset={handleReset} />
        )}
      </div>
    </div>
  );
};

export default Index;
