import { useRef, useState } from "react";
import { toast } from "sonner";
import AnalysisWait from "@/components/AnalysisWait";
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

  // Distinguishes a user cancel from a genuine failure, so cancelling does not
  // surface as a red error toast — nothing went wrong, they chose to stop.
  const cancelledRef = useRef(false);

  const handleAnalyze = async (message: string) => {
    setResult(null);
    cancelledRef.current = false;

    try {
      const analysis = await analyze.mutateAsync({ message });
      setResult(analysis);
      awardXP(REWARDS.analysis);
    } catch (error) {
      if (cancelledRef.current) {
        toast.info(t("analyzer.wait.cancelled"));
        return;
      }
      toast.error(errorMessage(error));
    }
  };

  const handleCancel = () => {
    cancelledRef.current = true;
    analyze.cancel();
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
            {/* Direction now comes from the active locale on <html>. Hardcoding
                `dir="rtl"` here made the English string render with its trailing
                period on the wrong side. */}
            <p className="text-sm text-muted-foreground">{t("analyzer.tagline")}</p>
          </div>
        )}

        {!result ? (
          // The form stays mounted while pending. Swapping it for the waiting
          // state unmounted it, which discarded the typed message — so cancelling
          // returned an empty box and the student had to retype. Keeping it
          // visible also shows them what the analysis is actually about, which is
          // most of what makes the wait bearable.
          <div className="space-y-6">
            <MessageAnalyzer
              onAnalyze={handleAnalyze}
              isLoading={analyze.isPending}
            />
            {analyze.isPending && <AnalysisWait onCancel={handleCancel} />}
          </div>
        ) : (
          <AnalysisResults result={result} onReset={handleReset} />
        )}
      </div>
    </div>
  );
};

export default Index;
