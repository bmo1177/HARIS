import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import AnalysisWait from "@/components/AnalysisWait";
import { I18nProvider } from "@/lib/i18n";

/**
 * The waiting state is the only feedback a student has for 5-15 seconds, so these
 * tests pin the properties that make that wait tolerable rather than the styling.
 */

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

// Pinned to English so the assertions can match literal copy: the elapsed timer
// and the slow-state line are what these tests are actually checking.
const renderWait = (onCancel = vi.fn()) => {
  render(
    <I18nProvider initialLocale="en">
      <AnalysisWait onCancel={onCancel} />
    </I18nProvider>,
  );
  return onCancel;
};

describe("AnalysisWait", () => {
  it("announces the pending state politely and marks itself busy", () => {
    renderWait();
    // aria-live="polite" implies role=status; aria-busy marks it as pending.
    const region = screen.getByRole("status");
    expect(region.getAttribute("aria-busy")).toBe("true");
    expect(region.getAttribute("aria-live")).toBe("polite");
  });

  it("counts elapsed time up, so a frozen spinner cannot read as a hang", () => {
    renderWait();
    expect(screen.getByText("0s")).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(screen.getByText("3s")).toBeDefined();

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(screen.getByText("5s")).toBeDefined();
  });

  it("states an expected duration up front", () => {
    renderWait();
    // Without this, fifteen seconds reads as broken rather than normal.
    expect(screen.getByText(/5-15 seconds/)).toBeDefined();
  });

  it("switches to a slow-state reassurance only after the usual window", () => {
    renderWait();
    expect(screen.queryByText(/longer than usual/)).toBeNull();

    act(() => {
      vi.advanceTimersByTime(12_000);
    });
    expect(screen.getByText(/longer than usual/)).toBeDefined();
    // The normal expectation is replaced rather than stacked, so the line does
    // not grow into a paragraph.
    expect(screen.queryByText(/5-15 seconds/)).toBeNull();
  });

  it("offers a cancel that the caller can act on", () => {
    const onCancel = renderWait();
    act(() => {
      screen.getByRole("button", { name: /cancel/i }).click();
    });
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it("stops counting when unmounted, so no interval leaks", () => {
    const clearSpy = vi.spyOn(globalThis, "clearInterval");
    const { unmount } = render(
      <I18nProvider initialLocale="en">
        <AnalysisWait onCancel={vi.fn()} />
      </I18nProvider>,
    );
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });

  it("hides the shimmer from assistive tech", () => {
    const { container } = render(
      <I18nProvider initialLocale="en">
        <AnalysisWait onCancel={vi.fn()} />
      </I18nProvider>,
    );
    // The live region already narrates the state; announcing animation as well
    // would be noise.
    const skeleton = container.querySelectorAll('[aria-hidden="true"]');
    expect(skeleton.length).toBeGreaterThan(0);
  });
});