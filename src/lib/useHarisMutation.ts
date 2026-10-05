import { useCallback, useEffect, useRef, useState } from "react";
import type { z } from "zod";
import { HarisError, errorMessage, invokeHarisFunction } from "@/lib/api";

const MAX_ATTEMPTS = 3;
const BASE_BACKOFF_MS = 600;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface HarisMutation<TOutput extends z.ZodTypeAny> {
  isPending: boolean;
  error: HarisError | null;
  /** Resolves with the validated response, or throws a `HarisError`. */
  mutateAsync: (body: Record<string, unknown>) => Promise<z.infer<TOutput>>;
  reset: () => void;
}

/**
 * Typed mutation hook for the HARIS Edge Functions.
 *
 * Replaces `@tanstack/react-query`, which was mounted in `App.tsx` but never
 * used: every call was a hand-rolled `useState` pair for `isLoading`/`error`
 * plus a try/catch. Three mutations with no queries, no cache and no optimistic
 * updates did not justify ~49 kB of `query-core` in the bundle.
 *
 * What it does keep from a query library, because it was genuinely missing:
 *
 *   - **Retries**, but only for transient failures. A rate-limit or a dropped
 *     connection is worth another attempt; a validation error is not, and
 *     retrying it would just burn the user's quota.
 *   - **Cancellation** on unmount, so a response that arrives after the student
 *     has navigated away does not update a dead component.
 *   - **One place** where pending state and error shape are decided, instead of
 *     three copies that drifted apart.
 */
export function useHarisMutation<TOutput extends z.ZodTypeAny>(
  name: string,
  schema: TOutput,
): HarisMutation<TOutput> {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<HarisError | null>(null);

  const controllerRef = useRef<AbortController | null>(null);
  // Reset in the effect body, not only in cleanup: React StrictMode remounts the
  // same instance in development, so a ref set to false on the first unmount
  // would leave it stuck.
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    const controller = new AbortController();
    controllerRef.current = controller;

    return () => {
      mountedRef.current = false;
      controller.abort();
      controllerRef.current = null;
    };
  }, []);

  const mutateAsync = useCallback(
    async (body: Record<string, unknown>): Promise<z.infer<TOutput>> => {
      const signal = controllerRef.current?.signal;

      if (mountedRef.current) {
        setIsPending(true);
        setError(null);
      }

      let lastError: HarisError | null = null;

      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const result = await invokeHarisFunction(name, body, schema, signal);
          if (mountedRef.current) setIsPending(false);
          return result;
        } catch (caught) {
          const normalised =
            caught instanceof HarisError
              ? caught
              : new HarisError(errorMessage(caught), "internal_error");

          // An aborted request means the component unmounted; stop immediately
          // rather than retrying into nothing.
          if (signal?.aborted) throw normalised;

          lastError = normalised;
          const canRetry = normalised.isTransient && attempt < MAX_ATTEMPTS;
          if (!canRetry) break;

          await sleep(BASE_BACKOFF_MS * 2 ** (attempt - 1));
          if (signal?.aborted) throw normalised;
        }
      }

      if (mountedRef.current) {
        setIsPending(false);
        setError(lastError);
      }
      throw lastError;
    },
    [name, schema],
  );

  const reset = useCallback(() => {
    setError(null);
    setIsPending(false);
  }, []);

  return { isPending, error, mutateAsync, reset };
}
