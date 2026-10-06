import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";
import { useI18n } from "@/lib/useI18n";
import { isGuessCorrect } from "@/lib/guess";

interface GuessAttackProps {
  /** The attack type in English. Used for matching the student's guess. */
  attackType: string;
  /**
   * The attack type in the reader's language, shown in the result panel. This
   * field has existed on every model response since the app was first written
   * and was never rendered.
   */
  attackTypeLocalized: string;
  onCorrectGuess?: (attempt: number) => void;
}

const MAX_ATTEMPTS = 3;

const GuessAttack = ({ attackType, attackTypeLocalized, onCorrectGuess }: GuessAttackProps) => {
  const [guess, setGuess] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [status, setStatus] = useState<"guessing" | "correct" | "revealed">("guessing");
  const [flashCorrect, setFlashCorrect] = useState(false);
  const { t } = useI18n();

  const checkGuess = () => {
    const newAttempts = attempts + 1;

    if (isGuessCorrect(guess, attackType)) {
      setFlashCorrect(true);
      setStatus("correct");
      onCorrectGuess?.(newAttempts);
    } else {
      setAttempts(newAttempts);
      if (newAttempts >= MAX_ATTEMPTS) {
        setStatus("revealed");
      }
      setGuess("");
    }
  };

  if (status === "correct") {
    return (
      <div className={`rounded-xl border-2 border-success/30 bg-success/10 p-5 animate-fade-in transition-colors duration-300 ${flashCorrect ? "ring-4 ring-green-400/50" : ""}`}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-success mt-0.5 shrink-0 animate-scale-in" aria-hidden="true" />
          {/* The full explanation is not repeated here: it is rendered in the
              English/Arabic tabs directly below, and it used to appear twice. */}
          <p className="font-semibold text-success">
            {t("guess.correct", { type: "" }).trim()}{" "}
            <span className="underline">{attackTypeLocalized}</span>
          </p>
        </div>
      </div>
    );
  }

  if (status === "revealed") {
    return (
      <div className="rounded-xl border-2 border-warning/30 bg-warning/10 p-5 animate-fade-in">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-6 h-6 text-warning mt-0.5 shrink-0" aria-hidden="true" />
          <div>
            <p className="font-semibold text-warning">
              {t("guess.revealed", { type: attackTypeLocalized })}
            </p>

          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground">{t("guess.title")}</h3>
      {attempts > 0 && status === "guessing" && (
        <div className="flex items-center gap-2 text-sm text-warning" role="status">
          <XCircle className="w-4 h-4" aria-hidden="true" />
          {t("guess.retry", {
            count: MAX_ATTEMPTS - attempts,
            unit:
              MAX_ATTEMPTS - attempts === 1 ? t("guess.attempt") : t("guess.attempts"),
          })}
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder={t("guess.placeholder")}
          aria-label={t("guess.label")}
          maxLength={60}
          onKeyDown={(e) => {
            if (e.key === "Enter" && guess.trim()) checkGuess();
          }}
        />
        <Button onClick={checkGuess} disabled={!guess.trim()}>
          {t("guess.submit")}
        </Button>
      </div>
    </div>
  );
};

export default GuessAttack;
