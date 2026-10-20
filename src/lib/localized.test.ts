import { describe, expect, it } from "vitest";
import { localizedText } from "@/lib/localized";

/**
 * The rule that keeps a missing translation from becoming a blank card.
 *
 * Every Arabic field the model returns can be absent (a client deployed before
 * the functions) or empty (a model that declined to translate). Both have to
 * fall back to the English text.
 */

describe("localizedText", () => {
  it("returns the Arabic text in Arabic", () => {
    expect(localizedText("Phishing", "التصيّد", "ar")).toBe("التصيّد");
  });

  it("returns the English text in English, even when Arabic is available", () => {
    expect(localizedText("Phishing", "التصيّد", "en")).toBe("Phishing");
  });

  it("falls back to English when the Arabic is missing", () => {
    expect(localizedText("Phishing", undefined, "ar")).toBe("Phishing");
  });

  it("falls back to English when the Arabic is empty", () => {
    // The server passes an empty string through rather than inventing Arabic.
    expect(localizedText("Phishing", "", "ar")).toBe("Phishing");
  });

  it("falls back to English when the Arabic is only whitespace", () => {
    expect(localizedText("Phishing", "   ", "ar")).toBe("Phishing");
  });

  it("keeps a genuine Arabic string that happens to be short", () => {
    expect(localizedText("Safe", "آمن", "ar")).toBe("آمن");
  });
});
