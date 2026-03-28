import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye } from "lucide-react";

interface ClueCardsProps {
  clues: [string, string, string];
  onAllRevealed: () => void;
}

const CLUE_CONFIG = [
  { label: "Clue 1", border: "border-l-blue-500", bg: "bg-blue-50/50 dark:bg-blue-950/20" },
  { label: "Clue 2", border: "border-l-amber-500", bg: "bg-amber-50/50 dark:bg-amber-950/20" },
  { label: "Clue 3", border: "border-l-red-500", bg: "bg-red-50/50 dark:bg-red-950/20" },
];

const ClueCards = ({ clues, onAllRevealed }: ClueCardsProps) => {
  const [revealed, setRevealed] = useState(1); // Start with only clue 1 visible

  const revealNext = () => {
    const next = revealed + 1;
    setRevealed(next);
    if (next >= 3) {
      // Small delay so the last clue animates in before showing the guess input
      setTimeout(() => onAllRevealed(), 600);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">🔍 Why HARIS flagged this</h3>
      <div className="space-y-3">
        {clues.map((clue, i) => {
          if (i >= revealed) return null;
          const cfg = CLUE_CONFIG[i];
          return (
            <div
              key={i}
              className={`border-l-4 ${cfg.border} ${cfg.bg} rounded-r-lg p-4 animate-fade-in`}
              style={{ animationDuration: "0.5s", animationFillMode: "both", animationDelay: i === 0 ? "0ms" : "0ms" }}
            >
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {cfg.label}
              </span>
              <p className="text-sm text-foreground mt-1">{clue}</p>
            </div>
          );
        })}
      </div>
      {revealed < 3 && (
        <Button variant="outline" size="sm" onClick={revealNext} className="gap-2">
          <Eye className="w-4 h-4" />
          Reveal clue {revealed + 1}
        </Button>
      )}
    </div>
  );
};

export default ClueCards;
