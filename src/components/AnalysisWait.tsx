import { useEffect, useRef, useState } from "react";
import { Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

/** Below this many seconds, "still working" would be alarming rather than honest. */
const SLOW_AFTER_SECONDS = 12;

/**
 * The waiting state for an analysis.
 *
 * A live request takes 5-15 seconds against a free inference provider, and the
 * whole point of this component is that the wait is *legible* rather than a dead
 * spinner. Four things do that work:
 *
 *   - **An elapsed timer.** A frozen spinner reads as a hang. Counting up reads
 *     as work, because it is only counting if something is genuinely pending.
 *   - **An expected duration, stated up front.** 15 seconds feels long when
 *     nothing said it would; it feels normal when it did.
 *   - **A skeleton of the answer.** The result card's shape, so the page does not
 *     jump when the real content lands.
 *   - **A cancel.** Without one, the only way out of a slow request is to
 *     navigate away and lose the result.
 *
 * Deliberately *not* included: a step-by-step progress bar. HARIS makes one model
 * call, so there is no intermediate signal to report — animating the three steps
 * on a timer would be theatre that implies knowledge the client does not have.
 * The one honest status is "still working", which the timer and the slow-state
 * line convey.
 */
interface AnalysisWaitProps {
  /** Clears pending state and aborts the in-flight request. */
  onCancel: () => void;
}

const AnalysisWait = ({ onCancel }: AnalysisWaitProps) => {
  const { t } = useI18n();
  const [seconds, setSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    };
  }, []);

  const slow = seconds >= SLOW_AFTER_SECONDS;

  return (
    <section
      // Explicit rather than relying on aria-live alone: aria-live does not imply
      // a role, so assistive tech sees an unlabelled region without this.
      role="status"
      aria-live="polite"
      aria-busy="true"
      className="space-y-4 rounded-xl border border-border bg-card p-5"
    >
      <div className="flex items-start gap-3">
        <Loader2
          className="mt-0.5 h-5 w-5 shrink-0 animate-spin text-primary motion-reduce:animate-none"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-semibold text-foreground">{t("analyzer.wait.headline")}</p>
          {/* `tabular-nums` stops the counter jittering as digits change width. */}
          <p className="text-sm text-muted-foreground">
            <span className="font-mono tabular-nums" aria-hidden="true">
              {t("analyzer.wait.elapsed", { seconds })}
            </span>
            <span className="sr-only">{seconds} seconds elapsed</span>
            {" · "}
            {slow ? t("analyzer.wait.slow") : t("analyzer.wait.typical")}
          </p>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="shrink-0 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden="true" />
          {t("analyzer.wait.cancel")}
        </Button>
      </div>

      {/* Skeleton. `aria-hidden` because the live region above already narrates
          the state; announcing shimmer would be noise for a screen reader. */}
      <div aria-hidden="true" className="space-y-3">
        <div className="h-5 w-2/5 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="h-4 w-full animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="h-4 w-11/12 animate-pulse rounded bg-muted motion-reduce:animate-none" />
        <div className="h-4 w-3/5 animate-pulse rounded bg-muted motion-reduce:animate-none" />
      </div>

      <p className="text-xs text-muted-foreground">
        {t("analyzer.wait.skeletonVerdict")}
      </p>
      <p className="text-xs text-muted-foreground">{t("analyzer.wait.keepOpen")}</p>
    </section>
  );
};

export default AnalysisWait;