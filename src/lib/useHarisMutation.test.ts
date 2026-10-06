import { describe, expect, it, vi } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useHarisMutation } from "@/lib/useHarisMutation";
import { invokeHarisFunction } from "@/lib/api";
import { z } from "zod";

vi.mock("@/lib/api", async () => {
  const actual = await vi.importActual<typeof import("@/lib/api")>("@/lib/api");
  return {
    ...actual,
    invokeHarisFunction: vi.fn(),
  };
});

const mocked = vi.mocked(invokeHarisFunction);
const schema = z.object({ verdict: z.string() });

/**
 * `cancel()` was added for the analysis waiting state. The subtle part is what it
 * leaves behind: aborting the controller is obvious, but if the aborted signal
 * stays on the ref then every later request inherits it and fails instantly
 * without ever reaching the network.
 */
describe("useHarisMutation cancel", () => {
  it("aborts the in-flight request", async () => {
    mocked.mockImplementation(
      (_n, _b, _s, signal) =>
        new Promise((_resolve, reject) => {
          signal?.addEventListener("abort", () => reject(new Error("aborted")));
        }),
    );

    const { result } = renderHook(() => useHarisMutation("analyze-message", schema));

    let pending: Promise<unknown> | undefined;
    act(() => {
      pending = result.current.mutateAsync({ message: "hi" });
    });
    expect(result.current.isPending).toBe(true);

    await act(async () => {
      result.current.cancel();
      await pending?.catch(() => undefined);
    });

    expect(result.current.isPending).toBe(false);
  });

  it("leaves a usable signal so the next request is not born aborted", async () => {
    const seen: Array<AbortSignal | undefined> = [];
    mocked.mockImplementation((_n, _b, _s, signal) => {
      seen.push(signal);
      if (signal?.aborted) return Promise.reject(new Error("born aborted"));
      return Promise.resolve({ verdict: "ok" } as never);
    });

    const { result } = renderHook(() => useHarisMutation("analyze-message", schema));

    let first: Promise<unknown> | undefined;
    act(() => {
      first = result.current.mutateAsync({ message: "one" });
    });
    await act(async () => {
      result.current.cancel();
      await first?.catch(() => undefined);
    });

    // The regression this guards: with no fresh controller, this second call would
    // reject on `signal.aborted` before any fetch happened.
    await act(async () => {
      await expect(result.current.mutateAsync({ message: "two" })).resolves.toEqual({
        verdict: "ok",
      });
    });

    await waitFor(() => expect(seen.length).toBeGreaterThanOrEqual(2));
    expect(seen[0]?.aborted).toBe(true);
    expect(seen[1]?.aborted).toBe(false);
  });

  it("clears a pending error so the UI does not show a stale failure", async () => {
    mocked.mockRejectedValueOnce(new Error("boom"));
    const { result } = renderHook(() => useHarisMutation("analyze-message", schema));

    await act(async () => {
      await result.current.mutateAsync({ message: "hi" }).catch(() => undefined);
    });
    expect(result.current.error).not.toBeNull();

    act(() => {
      result.current.cancel();
    });
    expect(result.current.error).toBeNull();
  });
});