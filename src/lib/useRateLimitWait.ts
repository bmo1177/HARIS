import { useEffect, useState } from "react";
import type { HarisError } from "@/lib/api";

/**
 * Seconds left on a rate limit, counting down. Returns 0 when there is none.
 *
 * The deadline is computed once from the server's `Retry-After` and then
 * counted down locally. The server is deliberately not asked again: doing so
 * would spend the very quota the student is waiting out, and every attempt
 * would push the window further away.
 */
export function useRateLimitWait(error: HarisError | null): number {
  const [seconds, setSeconds] = useState(0);

  // Depend on the values, not the object's identity. A caller that rebuilds the
  // error on every render would otherwise restart the countdown each time it
  // ticks — the wait would never appear to move.
  const code = error?.code;
  const retryAfterSeconds = error?.retryAfterSeconds;

  useEffect(() => {
    if (code !== "rate_limited" || !retryAfterSeconds) {
      setSeconds(0);
      return;
    }

    const deadline = Date.now() + retryAfterSeconds * 1000;
    const tick = () =>
      setSeconds(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));

    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [code, retryAfterSeconds]);

  return seconds;
}
