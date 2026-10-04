import { describe, expect, it } from "vitest";
import { ar } from "@/locales/ar";
import { en, type MessageKey } from "@/locales/en";
import { scenarios } from "@/data/scenarios";
import { voiceCalls } from "@/data/voiceCalls";

const keys = Object.keys(en) as MessageKey[];

/**
 * Guards on the Arabic dictionary.
 *
 * The `Record<MessageKey, string>` type already makes a *missing* key a compile
 * error. These checks catch the failure mode types cannot: an Arabic string that
 * is present, plausible-looking, and wrong.
 *
 * Every one of these was hit while writing the file — a key typo, an English word
 * left inside an Arabic sentence, and one line of garbled text that a reviewer
 * would have had to catch by eye.
 */
describe("Arabic dictionary", () => {
  it("has a string for every English key", () => {
    for (const key of keys) {
      expect(typeof ar[key], `missing ar["${key}"]`).toBe("string");
    }
  });

  it("has no extra keys that English does not have", () => {
    const englishKeys = new Set(keys);
    for (const key of Object.keys(ar)) {
      expect(englishKeys.has(key as MessageKey), `ar has unknown key "${key}"`).toBe(true);
    }
  });

  it("has no empty strings", () => {
    for (const key of keys) {
      expect(ar[key].trim().length, `ar["${key}"] is empty`).toBeGreaterThan(0);
    }
  });

  /**
   * Strings that are legitimately Latin, with the reason. A blanket allowlist
   * would defeat the check; each entry has to justify itself.
   */
  const LATIN_ALLOWED = new Set<MessageKey>([
    // Numerals and a separator only.
    "analyzer.counter",
    // The language's own name, so a reader can find their language in the tab.
    "results.english",
    // Attack-type names. These are the exact strings the model returns in
    // `attack_type`; translating only the UI copy would leave a student unable
    // to match what they read against what HARIS told them.
    "threat.phishing",
    "threat.vishing",
    "threat.smishing",
    "threat.fakeGiveaways",
    "threat.gamingScams",
    "threat.socialEngineering",
    "threat.strangerDanger",
    "threat.safeMessages",
  ]);

  it("contains Arabic script, not only Latin", () => {
    // Every other user-facing string should actually be in Arabic. A value that
    // is pure ASCII is almost always an untranslated leftover.
    const latinOnly = keys.filter(
      (key) => !LATIN_ALLOWED.has(key) && !/[؀-ۿ]/.test(ar[key]),
    );
    expect(latinOnly, `untranslated: ${latinOnly.join(", ")}`).toEqual([]);
  });

  it("does not embed long runs of Latin words in Arabic sentences", () => {
    // Latin is legitimately present for product names, env var names and file
    // paths, so this allows short tokens but catches sentences left in English.
    // The setup strings are technical instructions where the identifiers *are*
    // the content and must not be translated.
    const LATIN_HEAVY_ALLOWED = new Set<MessageKey>([
      "setup.step2",
      "setup.backend",
      "setup.step1",
    ]);

    const suspicious = keys.filter((key) => {
      if (LATIN_HEAVY_ALLOWED.has(key)) return false;
      const words = ar[key].match(/[A-Za-z]{2,}/g) ?? [];
      const totalWords = ar[key].trim().split(/\s+/).length;
      return words.length >= 4 && words.length / totalWords > 0.4;
    });
    expect(suspicious, `mixed script: ${suspicious.join(", ")}`).toEqual([]);
  });

  it("keeps the same placeholder tokens as English", () => {
    // A missing {count} renders as a literal brace in the UI, which is exactly
    // the kind of bug a type cannot catch.
    const placeholders = (value: string) => (value.match(/\{(\w+)\}/g) ?? []).sort();
    for (const key of keys) {
      expect(placeholders(ar[key]), `placeholders differ for "${key}"`).toEqual(
        placeholders(en[key]),
      );
    }
  });

  it("declares no key that English omits", () => {
    expect(Object.keys(ar).length).toBe(keys.length);
  });
});

describe("English dictionary", () => {
  it("has unique values for the XP level titles", () => {
    const titles = keys.filter((k) => k.startsWith("level.")).map((k) => en[k]);
    expect(new Set(titles).size).toBe(titles.length);
  });

  it("covers all five XP levels defined in lib/xp.ts", () => {
    const levelKeys = keys.filter((k) => k.startsWith("level."));
    expect(levelKeys.length).toBe(5);
  });
});

/**
 * Guards on Arabic content in the data files.
 *
 * Arabic strings are authored by hand, and a stray character from another script
 * is invisible in review and meaningless to a reader. Two of these were caught
 * this way while writing the data: Chinese and Latin fragments inside Arabic
 * descriptions.
 */
describe("Arabic content in data files", () => {
  const SCRIPTS: ReadonlyArray<{ name: string; re: RegExp }> = [
    { name: "Han", re: /[一-鿿㐀-䶿]/ },
    { name: "Devanagari", re: /[ऀ-ॿ]/ },
    { name: "Cyrillic", re: /[Ѐ-ӿ]/ },
    { name: "Hebrew", re: /[֐-׿]/ },
    { name: "Thai", re: /[฀-๿]/ },
    { name: "Greek", re: /[Ͱ-Ͽ]/ },
  ];

  const arabicFields: Array<{ label: string; value: string }> = [
    ...scenarios.map((s) => ({ label: `scenarios/${s.id}/titleAr`, value: s.titleAr })),
    ...scenarios.map((s) => ({ label: `scenarios/${s.id}/descriptionAr`, value: s.descriptionAr })),
    ...voiceCalls.map((c) => ({ label: `voiceCalls/${c.id}/titleAr`, value: c.titleAr })),
    ...voiceCalls.map((c) => ({ label: `voiceCalls/${c.id}/descriptionAr`, value: c.descriptionAr })),
    ...voiceCalls.flatMap((c) =>
      c.lines
        .filter((l) => l.lang.startsWith("ar"))
        .map((l, i) => ({ label: `voiceCalls/${c.id}/line[${i}]`, value: l.text })),
    ),
  ];

  it("has Arabic fields to check", () => {
    expect(arabicFields.length).toBeGreaterThan(20);
  });

  it("contains no characters from another script", () => {
    const offenders: string[] = [];
    for (const field of arabicFields) {
      for (const script of SCRIPTS) {
        if (script.re.test(field.value)) offenders.push(`${field.label} (${script.name})`);
      }
    }
    expect(offenders, `foreign script found: ${offenders.join(", ")}`).toEqual([]);
  });

  it("has no empty Arabic fields", () => {
    const empty = arabicFields.filter((f) => f.value.trim().length === 0).map((f) => f.label);
    expect(empty, `empty: ${empty.join(", ")}`).toEqual([]);
  });

  it("agrees with English on how many calls are declared", () => {
    // Guards against adding an Arabic field to one call and forgetting another.
    expect(scenarios.every((s) => s.descriptionAr.trim().length > 0)).toBe(true);
    expect(voiceCalls.every((c) => c.descriptionAr.trim().length > 0)).toBe(true);
  });
});
