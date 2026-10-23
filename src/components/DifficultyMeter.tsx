import { useI18n } from "@/lib/useI18n";
import { DIFFICULTY_LEVEL, type Difficulty } from "@/lib/difficulty";

interface DifficultyMeterProps {
  difficulty: Difficulty;
}

/**
 * Three bars and a word. The bars give the rank at a glance; the word carries
 * it when colour and shape are not available. Neutral by design — the risk ramp
 * belongs to the verdict.
 */
const DifficultyMeter = ({ difficulty }: DifficultyMeterProps) => {
  const { t } = useI18n();
  const level = DIFFICULTY_LEVEL[difficulty];

  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
      <span className="flex items-end gap-[2px]" aria-hidden="true">
        {[1, 2, 3].map((bar) => (
          <span
            key={bar}
            className={`w-[3px] rounded-sm ${
              bar <= level ? "bg-foreground/60" : "bg-border"
            } ${bar === 1 ? "h-1.5" : bar === 2 ? "h-2.5" : "h-3.5"}`}
          />
        ))}
      </span>
      {t(`difficulty.${difficulty}` as const)}
    </span>
  );
};

export default DifficultyMeter;
