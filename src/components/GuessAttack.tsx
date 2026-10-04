import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, HelpCircle } from "lucide-react";

interface GuessAttackProps {
  attackType: string;
  onCorrectGuess?: (attempt: number) => void;
}

const MAX_ATTEMPTS = 3;

const normalise = (value: string) => value.trim().toLowerCase();

/** Words that carry no signal when matching a short answer. */
const STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "from", "your", "you", "are", "was",
  "not", "but", "its", "his", "her", "their", "attack", "type", "scam", "fraud",
]);

/** Minimum length before a guess word may match by prefix. */
const PREFIX_MATCH_MIN = 4;

/**
 * Token-based matching rather than substring matching.
 *
 * The previous check was `answer.includes(guess) || guess.includes(answer)`, with
 * a minimum length guard applied only to the third clause. That made the
 * headline mechanic winnable by typing any single letter: `"s"` matched
 * `"smishing"`. The guard now applies to the whole guess, and matching happens
 * on word sets so `"social engineering"` is accepted for `"Social Engineering"`
 * without `"eng"` or `"e"` being accepted too.
 */
export function isGuessCorrect(guess: string, answer: string): boolean {
  const normalisedGuess = normalise(guess);
  const normalisedAnswer = normalise(answer);

  if (normalisedGuess.length < 3) return false;
  if (normalisedAnswer.length < 3) return false;
  if (normalisedGuess === normalisedAnswer) return true;

  const meaningful = (value: string) =>
    value
      .split(/[^a-z0-9]+/)
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word));

  const answerWords = new Set(meaningful(normalisedAnswer));
  if (answerWords.size === 0) return normalisedGuess === normalisedAnswer;

  const matches = (word: string) =>
    answerWords.has(word) ||
    // "phish" for "Phishing", but not "phi" or "p".
    (word.length >= PREFIX_MATCH_MIN &&
      [...answerWords].some((candidate) => candidate.startsWith(word)));

  // Every meaningful word the student typed must appear in the answer. Guessing
  // "phishing smishing" against "Smishing" is still wrong.
  const guessWords = meaningful(normalisedGuess);
  return guessWords.length > 0 && guessWords.every(matches);
}

const GuessAttack = ({ attackType, onCorrectGuess }: GuessAttackProps) => {
  const [guess, setGuess] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [status, setStatus] = useState<"guessing" | "correct" | "revealed">("guessing");
  const [flashCorrect, setFlashCorrect] = useState(false);

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
            Correct! It's <span className="underline">{attackType}</span>
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
              It's <span className="underline">{attackType}</span>! No worries — now you know it.
            </p>
            <p className="text-sm text-warning mt-1">
              The full explanation is below.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3 animate-fade-in">
      <h3 className="text-lg font-semibold text-foreground">What type of attack is this? Take a guess!</h3>
      {attempts > 0 && status === "guessing" && (
        <div className="flex items-center gap-2 text-sm text-warning" role="status">
          <XCircle className="w-4 h-4" aria-hidden="true" />
          Not quite — try again ({MAX_ATTEMPTS - attempts}{" "}
          {MAX_ATTEMPTS - attempts === 1 ? "attempt" : "attempts"} left)
        </div>
      )}
      <div className="flex gap-2">
        <Input
          value={guess}
          onChange={(e) => setGuess(e.target.value)}
          placeholder="What type of attack is this?"
          aria-label="Your guess at the attack type"
          maxLength={60}
          onKeyDown={(e) => {
            if (e.key === "Enter" && guess.trim()) checkGuess();
          }}
        />
        <Button onClick={checkGuess} disabled={!guess.trim()}>
          Submit
        </Button>
      </div>
    </div>
  );
};

export default GuessAttack;
