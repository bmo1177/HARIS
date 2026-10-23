import { useEffect, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import VerdictPanel from "./VerdictPanel";
import ClueCards from "./ClueCards";
import GuessAttack from "./GuessAttack";
import { useXP } from "@/lib/useXP";
import { useI18n } from "@/lib/useI18n";
import { localizedText } from "@/lib/localized";
import { REWARDS } from "@/lib/xp";
import type { AnalysisResult } from "@/types/analysis";
import type { MessageKey } from "@/locales/en";

interface AnalysisResultsProps {
  result: AnalysisResult;
  /** The exact text that was analysed. The result is about this, so it stays. */
  message: string;
  onReset: () => void;
}

const TOTAL_CLUES = 3;

const NEXT_STEPS: Record<AnalysisResult["risk_level"], readonly MessageKey[]> = {
  Safe: ["results.next.safe.1", "results.next.safe.2"],
  Suspicious: [
    "results.next.suspicious.1",
    "results.next.suspicious.2",
    "results.next.suspicious.3",
  ],
  Dangerous: [
    "results.next.dangerous.1",
    "results.next.dangerous.2",
    "results.next.dangerous.3",
  ],
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * The evidence workspace: the message on one side, the reading of it on the
 * other.
 *
 * The previous result removed the text it was judging — `MessageAnalyzer`
 * unmounted and took the textarea with it — so a student was asked to match
 * three clues against a message they had to remember. This keeps the specimen
 * pinned (sticky on desktop, stacked on mobile) and puts the clues beside it.
 *
 * The language control is a real control now. It used to be a Radix `Tabs`
 * pinned to `value={locale === "ar" ? "ar" : "en"}` with no `onValueChange`, so
 * both triggers were focusable, announced as tabs, and did nothing.
 */
const AnalysisResults = ({ result, message, onReset }: AnalysisResultsProps) => {
  const { t, locale } = useI18n();
  const { awardXP } = useXP();
  const [showGuess, setShowGuess] = useState(false);
  const [revealed, setRevealed] = useState(1);
  const [analysisLocale, setAnalysisLocale] = useState(locale);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const guessScheduled = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // The result replaces the form, so focus would otherwise stay on a submit
  // button that no longer exists. Move it to the verdict and return to the top.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    window.scrollTo({
      top: 0,
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  // Reading the whole page in one language at a time; the message itself is
  // never translated, only quoted.
  useEffect(() => {
    setAnalysisLocale(locale);
  }, [locale]);

  const revealNext = () => {
    const next = Math.min(revealed + 1, TOTAL_CLUES);
    setRevealed(next);

    if (next === TOTAL_CLUES && !guessScheduled.current) {
      guessScheduled.current = true;
      timerRef.current = setTimeout(() => {
        awardXP(REWARDS.allCluesRevealed);
        setShowGuess(true);
      }, 500);
    }
  };

  const clues = [
    localizedText(result.clue_1, result.clue_1_ar, analysisLocale),
    localizedText(result.clue_2, result.clue_2_ar, analysisLocale),
    localizedText(result.clue_3, result.clue_3_ar, analysisLocale),
  ];

  return (
    <div className="animate-fade-in">
      <VerdictPanel level={result.risk_level} headingRef={headingRef} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-10">
        <section
          aria-labelledby="message-heading"
          className="lg:sticky lg:top-24 lg:self-start"
        >
          <h2
            id="message-heading"
            className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground rtl:tracking-normal"
          >
            {t("results.message")}
          </h2>
          {/* `dir="auto"` so an Arabic message reads right-to-left inside an
              English page, and `whitespace-pre-wrap` so line breaks in the
              original survive. */}
          <blockquote
            dir="auto"
            className="mt-3 max-h-[55vh] overflow-y-auto whitespace-pre-wrap break-words rounded-lg border border-border bg-card p-4 text-sm leading-relaxed text-foreground"
          >
            {message}
          </blockquote>
        </section>

        <div className="space-y-8">
          <section aria-labelledby="evidence-heading">
            <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
              <h2 id="evidence-heading" className="text-lg font-semibold text-foreground">
                {result.is_threat ? t("results.whyFlagged") : t("results.whySafe")}
              </h2>
              <div className="flex items-center gap-3">
                <span
                  className="font-mono text-xs tabular-nums text-muted-foreground"
                  aria-label={t("results.clueProgress", {
                    shown: revealed,
                    total: TOTAL_CLUES,
                  })}
                >
                  {revealed}/{TOTAL_CLUES}
                </span>
                <div
                  role="group"
                  aria-label={t("results.readIn")}
                  className="flex overflow-hidden rounded-md border border-border"
                >
                  {(["en", "ar"] as const).map((code) => (
                    <button
                      key={code}
                      type="button"
                      onClick={() => setAnalysisLocale(code)}
                      aria-pressed={analysisLocale === code}
                      className={`px-2.5 py-1 text-xs transition-colors ${
                        analysisLocale === code
                          ? "bg-accent font-medium text-foreground"
                          : "text-muted-foreground hover:bg-accent/60 hover:text-foreground"
                      }`}
                    >
                      {code === "en" ? t("results.english") : t("results.arabic")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-3">
              <ClueCards clues={clues} revealed={revealed} onReveal={revealNext} />
            </div>
          </section>

          {showGuess && (
            <section aria-label={t("guess.title")} className="animate-fade-in">
              {result.is_threat ? (
                <GuessAttack
                  attackType={result.attack_type}
                  attackTypeLocalized={
                    analysisLocale === "ar" ? result.attack_type_ar : result.attack_type
                  }
                  onCorrectGuess={(attempt) =>
                    awardXP(
                      attempt === 1
                        ? REWARDS.correctGuessFirstTry
                        : REWARDS.correctGuessRetry,
                    )
                  }
                />
              ) : (
                <p className="border-l-2 border-success pl-4 text-sm leading-relaxed text-success">
                  {t("guess.nothingToGuess")}
                </p>
              )}
            </section>
          )}

          <section aria-labelledby="explanation-heading" className="border-t border-border pt-5">
            <h2
              id="explanation-heading"
              className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground rtl:tracking-normal"
            >
              {t("results.whatThisIs")}
            </h2>
            <p
              dir={analysisLocale === "ar" ? "rtl" : undefined}
              lang={analysisLocale}
              className="mt-2 text-sm leading-relaxed text-foreground"
            >
              {analysisLocale === "ar" ? result.explanation_ar : result.explanation}
            </p>
          </section>

          <section
            aria-labelledby="next-heading"
            className="rounded-lg border border-border bg-card p-4 sm:p-5"
          >
            <h2 id="next-heading" className="text-sm font-semibold text-foreground">
              {t("results.nextSteps")}
            </h2>
            <ol className="mt-3 space-y-2.5">
              {NEXT_STEPS[result.risk_level].map((key, i) => (
                <li key={key} className="flex gap-3 text-sm leading-relaxed">
                  <span className="mt-0.5 shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="text-foreground">{t(key)}</span>
                </li>
              ))}
            </ol>
          </section>

          <Button variant="outline" onClick={onReset} className="w-full gap-2 sm:w-auto">
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            {t("results.analyzeAnother")}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AnalysisResults;
