import { describe, expect, it, vi, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { HarisError } from "@/lib/api";
import { useRateLimitWait } from "@/lib/useRateLimitWait";

/**
 * The countdown behind a disabled submit button.
 *
 * It must count the wait down locally. Asking the server again would spend the
 * quota the student is waiting out, and every attempt would push the window
 * further away.
 */

/**
 * `Date` has to be faked explicitly: the hook measures the remaining time
 * against the wall clock, and Vitest's default fake timer set does not include
 * it. Without this the countdown appears frozen while the interval fires.
 */
const useFakeClock = () =>
  vi.useFakeTimers({
    toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval", "Date"],
  });

afterEach(() => {
  vi.useRealTimers();
});

describe("useRateLimitWait", () => {
  it("is zero when there is no error", () => {
    const { result } = renderHook(() => useRateLimitWait(null));
    expect(result.current).toBe(0);
  });

  it("is zero for an error that is not a rate limit", () => {
    const { result } = renderHook(() =>
      useRateLimitWait(new HarisError("boom", "internal_error")),
    );
    expect(result.current).toBe(0);
  });

  it("is zero for a rate limit that did not say how long to wait", () => {
    const { result } = renderHook(() =>
      useRateLimitWait(new HarisError("slow down", "rate_limited")),
    );
    expect(result.current).toBe(0);
  });

  it("starts at the number of seconds the server asked for", () => {
    useFakeClock();
    const { result } = renderHook(() =>
      useRateLimitWait(new HarisError("slow down", "rate_limited", undefined, 20)),
    );
    expect(result.current).toBe(20);
  });

  it("counts down to zero without asking the server again", () => {
    useFakeClock();
    const { result } = renderHook(() =>
      useRateLimitWait(new HarisError("slow down", "rate_limited", undefined, 5)),
    );

    act(() => {
      vi.advanceTimersByTime(2_000);
    });
    expect(result.current).toBe(3);

    act(() => {
      vi.advanceTimersByTime(10_000);
    });
    expect(result.current).toBe(0);
  });

  it("stops counting when unmounted, so no interval leaks", () => {
    useFakeClock();
    const clearSpy = vi.spyOn(globalThis, "clearInterval");
    const { unmount } = renderHook(() =>
      useRateLimitWait(new HarisError("slow down", "rate_limited", undefined, 20)),
    );

    act(() => {
      vi.advanceTimersByTime(1_000);
    });
    unmount();
    expect(clearSpy).toHaveBeenCalled();
    clearSpy.mockRestore();
  });
});
