import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useI18n } from "@/lib/useI18n";

interface ClueCardsProps {
  clues: [string, string, string];
  onAllRevealed: () => void;
}

const CLUE_CONFIG = [
  { dot: "bg-blue-500", tint: "bg-blue-50/60 dark:bg-blue-950/25" },
  { dot: "bg-amber-500", tint: "bg-amber-50/60 dark:bg-amber-950/25" },
  { dot: "bg-red-500", tint: "bg-red-50/60 dark:bg-red-950/25" },
];

const ALL_REVEALED = CLUE_CONFIG.length;

const ClueCards = ({ clues, onAllRevealed }: ClueCardsProps) => {
  const [revealed, setRevealed] = useState(1); // Start with only clue 1 visible
  const { t } = useI18n();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const notifiedRef = useRef(false);

  // The reveal delay was previously a bare setTimeout that was never cleared, so
  // navigating away mid-reveal still fired the callback.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const revealNext = () => {
    const next = revealed + 1;
    setRevealed(next);

    if (next >= ALL_REVEALED && !notifiedRef.current) {
      notifiedRef.current = true;
      // Small delay so the last clue animates in before showing the guess input
      timerRef.current = setTimeout(onAllRevealed, 600);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {clues.map((clue, i) => {
          if (i >= revealed) return null;
          const cfg = CLUE_CONFIG[i];
          return (
            <div
              key={i}
              className={`flex gap-3 rounded-lg border border-border/70 ${cfg.tint} p-4 animate-fade-in`}
              style={{ animationDuration: "0.5s", animationFillMode: "both" }}
            >
              {/* A dot rather than a thick coloured side border, which reads as a
                  generic AI-generated callout. */}
              <span
                className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${cfg.dot}`}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  {t("results.clue", { n: i + 1 })}
                </span>
                <p className="mt-1 text-sm text-foreground">{clue}</p>
              </div>
            </div>
          );
        })}
      </div>
      {revealed < ALL_REVEALED && (
        <Button variant="outline" size="sm" onClick={revealNext} className="gap-2">
          <Eye className="w-4 h-4" aria-hidden="true" />
          {t("results.revealClue", { n: revealed + 1 })}
        </Button>
      )}
    </div>
  );
};

export default ClueCards;
