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
