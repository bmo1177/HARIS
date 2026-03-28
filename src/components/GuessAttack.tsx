import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";

interface GuessAttackProps {
  attackType: string;
  explanation: string;
}

const GuessAttack = ({ attackType, explanation }: GuessAttackProps) => {
  const [guess, setGuess] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [status, setStatus] = useState<"guessing" | "correct" | "revealed">("guessing");
  const [flashCorrect, setFlashCorrect] = useState(false);

  const checkGuess = () => {
    const normalizedGuess = guess.trim().toLowerCase();
    const normalizedAnswer = attackType.toLowerCase();

    if (
      normalizedAnswer.includes(normalizedGuess) ||
      normalizedGuess.includes(normalizedAnswer) ||
      normalizedGuess.split(/\s+/).some((w) => normalizedAnswer.includes(w) && w.length > 3)
    ) {
      setFlashCorrect(true);
      setTimeout(() => setStatus("correct"), 150);
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 3) {
        setStatus("revealed");
      }
      setGuess("");
    }
  };

  if (status === "correct") {
    return (
      <div
        className={`rounded-xl border-2 border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950/30 p-5 animate-fade-in transition-colors duration-300 ${flashCorrect ? "ring-4 ring-green-400/50" : ""}`}
      >
        <div className="flex items-start gap-3">
          <CheckCircle2 className="w-6 h-6 text-green-600 mt-0.5 shrink-0 animate-scale-in" />
          <div>
            <p className="font-semibold text-green-800 dark:text-green-300">
              Correct! It's <span className="underline">{attackType}</span>
            </p>
            <p className="text-sm text-green-700 dark:text-green-400 mt-1">{explanation}</p>
          </div>
        </div>
      </div>
    );
  }

  if (status === "revealed") {
    return (
      <div className="rounded-xl border-2 border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-5 animate-fade-in">
        <div className="flex items-start gap-3">
          <HelpCircle className="w-6 h-6 text-amber-600 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-amber-800 dark:text-amber-300">
              The answer is: <span className="underline">{attackType}</span>
            </p>
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">{explanation}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground">🎯 What attack is this?</h3>
      {attempts > 0 && (
        <div className="flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
          <XCircle className="w-4 h-4" />
          Not quite — try again ({3 - attempts} {3 - attempts === 1 ? "attempt" : "attempts"} left)
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="What type of attack is this?"
          onKeyDown={(e) => e.key === "Enter" && guess.trim() && checkGuess()}
        />
        <Button onClick={checkGuess} disabled={!guess.trim()}>
          Submit guess
        </Button>
      </div>
    </div>
  );
};

export default GuessAttack;
