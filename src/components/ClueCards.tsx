import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";
import { useI18n } from "@/lib/useI18n";

interface ClueCardsProps {
  clues: readonly string[];
  /** How many clues are currently visible (1–3). */
  revealed: number;
  onReveal: () => void;
}

/**
 * The evidence, revealed one item at a time.
 *
 * The coloured dots and tinted panels are gone: green/amber/red is a promise
 * that means risk, and a blue dot on clue 1 spent part of it on decoration.
 * The numeral carries the order instead, in mono, which is what mono is for.
 */
const ClueCards = ({ clues, revealed, onReveal }: ClueCardsProps) => {
  const { t } = useI18n();

  return (
    <div>
      <ol className="overflow-hidden rounded-xl border border-border bg-card/60 shadow-panel" aria-live="polite">
        {clues.slice(0, revealed).map((clue, i) => (
          <li
            key={i}
            className="flex gap-3.5 bg-card/60 px-4 py-4 animate-fade-in motion-reduce:animate-none sm:gap-4 sm:px-5"
            style={{ animationDelay: `${i * 60}ms` }}
          >
            <span
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-background font-mono text-[11px] tabular-nums text-muted-foreground"
              aria-hidden="true"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="min-w-0 pt-0.5 text-pretty text-sm leading-[1.65] text-foreground">{clue}</p>
          </li>
        ))}
      </ol>
      {revealed < clues.length && (
        <Button variant="outline" size="sm" onClick={onReveal} className="group mt-3 gap-2 shadow-panel transition-all duration-150 hover:-translate-y-px">
          <Eye className="h-4 w-4 transition-transform duration-150 group-hover:scale-110" aria-hidden="true" />
          {t("results.revealClue", { n: revealed + 1 })}
        </Button>
      )}
    </div>
  );
};

export default ClueCards;
