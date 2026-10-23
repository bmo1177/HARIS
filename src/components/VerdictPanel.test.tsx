import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import VerdictPanel from "@/components/VerdictPanel";
import { I18nProvider } from "@/lib/i18n";

const renderPanel = (level: "Safe" | "Suspicious" | "Dangerous") =>
  render(
    <I18nProvider initialLocale="en">
      <VerdictPanel level={level} />
    </I18nProvider>,
  );

describe("VerdictPanel", () => {
  it("states the verdict as a word, never a percentage", () => {
    renderPanel("Dangerous");
    expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Dangerous");
    // The old gauge animated a percentage the system cannot produce: four bands
    // exist, so there is no 84% to show. This is the regression guard.
    expect(document.body.textContent).not.toMatch(/\d+\s*%/);
  });

  it("marks exactly the current zone on a three-zone scale", () => {
    renderPanel("Suspicious");
    const current = document.querySelectorAll("[aria-current]");
    expect(current).toHaveLength(1);
    expect(current[0]?.textContent).toBe("Suspicious");
  });

  it("renders all three bands at their real widths", () => {
    renderPanel("Safe");
    const scale = screen.getByRole("img", { name: /verdict scale/i });
    // 0–24 / 25–64 / 65–100.
    expect(scale.getAttribute("style")).toContain("25fr 40fr 35fr");
  });

  it("states the tool's limits next to the verdict", () => {
    renderPanel("Safe");
    expect(screen.getByText(/An AI assessment, not a guarantee/i)).toBeDefined();
  });
});
