import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AnalysisResults from "@/components/AnalysisResults";
import { I18nProvider } from "@/lib/i18n";
import { XPProvider } from "@/lib/xpContext";
import type { AnalysisResult } from "@/types/analysis";

const MESSAGE = "URGENT: verify your account at univ-sso-verify.net";

const dangerous: AnalysisResult = {
  risk_score: 85,
  risk_level: "Dangerous",
  is_threat: true,
  attack_type: "Phishing",
  attack_type_ar: "التصيّد",
  clue_1: "The 24-hour deadline",
  clue_2: "The lookalike domain",
  clue_3: "The credential request",
  clue_1_ar: "الموعد النهائي",
  clue_2_ar: "النطاق المشابه",
  clue_3_ar: "طلب بيانات الدخول",
  explanation: "This is a phishing attempt.",
  explanation_ar: "هذه محاولة تصيّد.",
};

const safe: AnalysisResult = {
  ...dangerous,
  risk_score: 5,
  risk_level: "Safe",
  is_threat: false,
  attack_type: "Safe",
  attack_type_ar: "آمن",
};

const renderResult = (result: AnalysisResult) =>
  render(
    <I18nProvider initialLocale="en">
      <XPProvider>
        <AnalysisResults result={result} message={MESSAGE} onReset={vi.fn()} />
      </XPProvider>
    </I18nProvider>,
  );

beforeEach(() => {
  vi.spyOn(window, "scrollTo").mockImplementation(() => {});
});

describe("AnalysisResults", () => {
  it("keeps the analysed message on screen beside the verdict", () => {
    renderResult(dangerous);
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Dangerous");
    // The old result unmounted the form and took the message with it.
    expect(screen.getByText(MESSAGE)).toBeDefined();
    expect(screen.getByRole("heading", { name: "Why HARIS flagged this" })).toBeDefined();
  });

  it("moves focus to the verdict when the result replaces the form", () => {
    renderResult(dangerous);
    expect(document.activeElement?.textContent).toBe("Dangerous");
  });

  it("reveals the evidence one clue at a time, then asks for the attack type", async () => {
    renderResult(dangerous);

    expect(screen.queryByText("The lookalike domain")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /reveal clue 2/i }));
    expect(screen.getByText("The lookalike domain")).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: /reveal clue 3/i }));
    expect(screen.getByText("The credential request")).toBeDefined();

    // The guess appears after the last reveal, once the XP pill is scheduled.
    await waitFor(
      () => expect(screen.getByText(/what type of attack/i)).toBeDefined(),
      { timeout: 2000 },
    );
  });

  it("switches the reading language without translating the message", () => {
    renderResult(dangerous);

    fireEvent.click(screen.getByRole("button", { name: "العربية" }));

    expect(screen.getByText("هذه محاولة تصيّد.")).toBeDefined();
    expect(screen.getByText("الموعد النهائي")).toBeDefined();
    // The specimen is verbatim, whatever language the reader prefers.
    expect(screen.getByText(MESSAGE)).toBeDefined();
  });

  it("does not tell a safe message that HARIS flagged it", () => {
    renderResult(safe);
    expect(screen.getByRole("heading", { name: "Why this looks safe" })).toBeDefined();
    expect(screen.queryByText("Why HARIS flagged this")).toBeNull();
  });
});
