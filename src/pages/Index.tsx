import { useRef, useState } from "react";
import { toast } from "sonner";
import AnalysisWait from "@/components/AnalysisWait";
import MessageAnalyzer from "@/components/MessageAnalyzer";
import AnalysisResults from "@/components/AnalysisResults";
import { useErrorMessage } from "@/lib/useErrorMessage";
import { useI18n } from "@/lib/useI18n";
import { useHarisMutation } from "@/lib/useHarisMutation";
import { useRateLimitWait } from "@/lib/useRateLimitWait";
import { useXP } from "@/lib/useXP";
import { REWARDS } from "@/lib/xp";
import { analysisResultSchema, type AnalysisResult } from "@/types/analysis";

const Index = () => {
  const [result, setResult] = useState<AnalysisResult | null>(null);
  /**
   * The text that produced the current result.
   *
   * It lives here rather than in `MessageAnalyzer` because that component
   * unmounts when the result arrives, and the result is about this text — the
   * student has to be able to read the evidence against it.
   */
  const [submitted, setSubmitted] = useState("");
  const { awardXP } = useXP();
  const { t } = useI18n();
  const errorText = useErrorMessage();

  const analyze = useHarisMutation("analyze-message", analysisResultSchema);
  // Counts down the server's rate limit, so the submit button is disabled for
  // exactly as long as the limit lasts.
  const waitSeconds = useRateLimitWait(analyze.error);

  // Distinguishes a user cancel from a genuine failure, so cancelling does not
  // surface as a red error toast — nothing went wrong, they chose to stop.
  const cancelledRef = useRef(false);

  const handleAnalyze = async (message: string) => {
    setResult(null);
    setSubmitted(message);
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
      toast.error(errorText(error));
    }
  };

  const handleCancel = () => {
    cancelledRef.current = true;
    analyze.cancel();
  };

  const handleReset = () => {
    setResult(null);
    setSubmitted("");
    analyze.reset();
  };

  // `my-auto` rather than `justify-center`: when a result is shown the content is
  // taller than the viewport, and flex centring pushes the overflow off the top
  // where it cannot be scrolled to. `margin: auto` degrades correctly.
  return (
    <div className="flex h-full flex-col">
      <div className="my-auto">
        {!result && (
          <div className="mx-auto mb-8 max-w-2xl space-y-2 text-center">
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">
              {t("analyzer.title")}
            </h1>
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
          <div className="mx-auto max-w-2xl space-y-6">
            <MessageAnalyzer
              onAnalyze={handleAnalyze}
              isLoading={analyze.isPending}
              waitSeconds={waitSeconds}
            />
            {analyze.isPending && <AnalysisWait onCancel={handleCancel} />}
          </div>
        ) : (
          <AnalysisResults result={result} message={submitted} onReset={handleReset} />
        )}
      </div>
    </div>
  );
};

export default Index;
