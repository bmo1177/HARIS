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
      <ol className="border-t border-border" aria-live="polite">
        {clues.slice(0, revealed).map((clue, i) => (
          <li
            key={i}
            className="flex gap-4 border-b border-border py-4 animate-fade-in"
            style={{ animationDuration: "0.4s", animationFillMode: "both" }}
          >
            <span
              className="mt-0.5 shrink-0 font-mono text-xs tabular-nums text-muted-foreground"
              aria-hidden="true"
            >
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="min-w-0 text-sm leading-relaxed text-foreground">{clue}</p>
          </li>
        ))}
      </ol>
      {revealed < clues.length && (
        <Button variant="outline" size="sm" onClick={onReveal} className="mt-4 gap-2">
          <Eye className="h-4 w-4" aria-hidden="true" />
          {t("results.revealClue", { n: revealed + 1 })}
        </Button>
      )}
    </div>
  );
};

export default ClueCards;
