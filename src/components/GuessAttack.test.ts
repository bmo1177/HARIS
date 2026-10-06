import { describe, expect, it } from "vitest";
import { isGuessCorrect } from "@/lib/guess";

describe("isGuessCorrect", () => {
  it("accepts the exact answer regardless of case or padding", () => {
    expect(isGuessCorrect("Smishing", "Smishing")).toBe(true);
    expect(isGuessCorrect("  smishing ", "Smishing")).toBe(true);
    expect(isGuessCorrect("SMISHING", "smishing")).toBe(true);
  });

  it("rejects a single character", () => {
    // The core bug: the old check was `answer.includes(guess)`, so "s" matched
    // "smishing" and won 30 XP.
    for (const letter of ["s", "a", "i", "o", "e", "n", "g", "m"]) {
      expect(isGuessCorrect(letter, "Smishing")).toBe(false);
    }
  });

  it("rejects any guess shorter than three characters", () => {
    expect(isGuessCorrect("sm", "Smishing")).toBe(false);
    expect(isGuessCorrect("ph", "Phishing")).toBe(false);
  });

  it("rejects an empty or whitespace guess", () => {
    expect(isGuessCorrect("", "Smishing")).toBe(false);
    expect(isGuessCorrect("   ", "Smishing")).toBe(false);
  });

  it("accepts a correct multi-word answer typed in either order", () => {
    expect(isGuessCorrect("Social Engineering", "social engineering")).toBe(true);
    expect(isGuessCorrect("engineering social", "Social Engineering")).toBe(true);
    expect(isGuessCorrect("  social   engineering  ", "Social Engineering")).toBe(true);
  });

  it("accepts a truncated word but only from four characters", () => {
    // "phish" is a reasonable thing for a student to type for "Phishing".
    expect(isGuessCorrect("phish", "Phishing")).toBe(true);
    expect(isGuessCorrect("smish", "Smishing")).toBe(true);
    // Three characters is not enough to commit to a prefix.
    expect(isGuessCorrect("phi", "Phishing")).toBe(false);
  });

  it("still rejects an unrelated attack type", () => {
    expect(isGuessCorrect("smishing", "Phishing")).toBe(false);
  });

  it("rejects a guess that mixes a wrong word into a correct answer", () => {
    expect(isGuessCorrect("social bank", "Social Engineering")).toBe(false);
    expect(isGuessCorrect("romance scam", "Phishing")).toBe(false);
  });

  it("ignores punctuation and extra separators", () => {
    expect(isGuessCorrect("social-engineering!", "Social Engineering")).toBe(true);
    expect(isGuessCorrect("social_engineering", "Social Engineering")).toBe(true);
  });

  it("is case and direction independent for Arabic answers", () => {
    expect(isGuessCorrect("تصيد", "التصيّد")).toBe(false);
    // Guards against a regression where the token split on [a-z0-9] emptied the
    // set and made everything vacuously correct.
    expect(isGuessCorrect("التصيّد", "التصيّد")).toBe(true);
  });

  it("rejects everything when the answer carries no usable words", () => {
    expect(isGuessCorrect("anything", "!!!")).toBe(false);
  });
});
