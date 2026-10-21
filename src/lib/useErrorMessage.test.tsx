import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { HarisError } from "@/lib/api";
import { I18nProvider } from "@/lib/i18n";
import { useErrorMessage } from "@/lib/useErrorMessage";

/**
 * The server returns a fixed English sentence per error code, so every toast in
 * Arabic mode used to be English. The client now translates the code instead.
 */

// Unexpected throws are logged for developers; silence that in test output.
beforeEach(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

const wrapperFor = (locale: "en" | "ar") =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <I18nProvider initialLocale={locale}>{children}</I18nProvider>;
  };

describe("useErrorMessage", () => {
  it("translates an API error code into the active locale", () => {
    const { result } = renderHook(() => useErrorMessage(), { wrapper: wrapperFor("ar") });

    const message = result.current(
      new HarisError("Too many requests. Take a short break, then try again.", "rate_limited"),
    );

    expect(message).toContain("طلبات كثيرة");
    expect(message).not.toContain("Too many requests");
  });

  it("uses English copy for the same code in English", () => {
    const { result } = renderHook(() => useErrorMessage(), { wrapper: wrapperFor("en") });

    expect(result.current(new HarisError("ignored", "timeout"))).toContain("took too long");
  });

  it("translates a network error rather than leaking the browser's wording", () => {
    const { result } = renderHook(() => useErrorMessage(), { wrapper: wrapperFor("ar") });

    expect(result.current(new HarisError("Failed to fetch", "network_error"))).toContain(
      "تعذّر الوصول",
    );
  });

  it("distinguishes a rejected provider key from a model failure", () => {
    const { result } = renderHook(() => useErrorMessage(), { wrapper: wrapperFor("en") });

    const message = result.current(
      new HarisError("HARIS could not reach the AI provider.", "provider_unauthorized"),
    );

    // Not "the analysis could not be completed": nothing about the student's
    // message failed, our own credentials did.
    expect(message).toContain("cannot reach the AI provider");
    expect(message).not.toContain("could not be completed");
  });

  it("does not treat a rejected provider key as worth retrying", () => {
    // A wrong key fails identically every time, so retrying only wastes the
    // student's time behind a spinner.
    const error = new HarisError("nope", "provider_unauthorized");
    expect(error.isTransient).toBe(false);
  });

  it("keeps a non-API error's detail out of the UI and localizes the fallback", () => {
    const { result } = renderHook(() => useErrorMessage(), { wrapper: wrapperFor("ar") });

    // Logged for developers, not shown to the student: the raw message is not
    // actionable and would be English on an Arabic screen.
    expect(result.current(new Error("boom"))).toContain("حدث خطأ");
  });

  it("falls back to a generic message for a non-Error throw", () => {
    const { result } = renderHook(() => useErrorMessage(), { wrapper: wrapperFor("ar") });

    expect(result.current("not an error")).toContain("حدث خطأ");
  });
});
