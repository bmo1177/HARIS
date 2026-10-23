import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Loader2,
  Search,
  Gift,
  ShieldAlert,
  MessageSquare,
  Briefcase,
  Lock,
} from "lucide-react";
import { useI18n } from "@/lib/useI18n";
import type { MessageKey } from "@/locales/en";

const EXAMPLES: ReadonlyArray<{ key: MessageKey; icon: typeof Gift; message: string }> = [
  {
    key: "example.freePass",
    icon: Gift,
    message:
      "You've won a free pass to the AI Security Summit 2026! Claim it within 2 hours or it goes to someone else: ai-security-summit-tickets.com/claim",
  },
  {
    key: "example.phishingLink",
    icon: ShieldAlert,
    message:
      "IT Helpdesk: your university account will be disabled in 24 hours for a security review. Re-verify your credentials here to keep access: univ-sso-verify.net/login",
  },
  {
    key: "example.safeMessage",
    icon: MessageSquare,
    message:
      "The seminar has moved to Room 204 on Thursday at 10:00. Bring the reading from last week — we'll start with the case study.",
  },
  {
    key: "example.fakeRecruiter",
    icon: Briefcase,
    message:
      "Hi, I found your CV on LinkedIn. We're hiring a remote security analyst at $180/hour. Send your ID and bank details today to secure the role: careers-verify.io/apply",
  },
];

const MESSAGE_ID = "message-input";
/** Matches the server-side cap in `_shared/schemas.ts`. */
const MAX_MESSAGE_LENGTH = 2_000;

interface MessageAnalyzerProps {
  onAnalyze: (message: string) => void;
  isLoading: boolean;
  /**
   * Seconds left on a server rate limit, if one is in force. The button is
   * disabled while it counts down, so a student is not told to wait and then
   * offered a button that fails.
   */
  waitSeconds?: number;
}

const MessageAnalyzer = ({ onAnalyze, isLoading, waitSeconds = 0 }: MessageAnalyzerProps) => {
  const [message, setMessage] = useState("");
  const { t, formatNumber } = useI18n();
  const overLimit = message.length > MAX_MESSAGE_LENGTH;
  const rateLimited = waitSeconds > 0;
  const canSubmit = message.trim().length > 0 && !overLimit && !isLoading && !rateLimited;

  return (
    <div className="space-y-6">
      <div>
        {/* The label was a sibling of the textarea with no htmlFor, so screen
            readers announced nothing at all for the app's main input. */}
        <label htmlFor={MESSAGE_ID} className="block text-sm font-medium text-foreground mb-2">
          {t("analyzer.label")}
        </label>
        <Textarea
          id={MESSAGE_ID}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("analyzer.placeholder")}
          className="min-h-[140px] text-base resize-none"
          dir="auto"
          maxLength={MAX_MESSAGE_LENGTH * 2}
          aria-describedby={`${MESSAGE_ID}-hint`}
          aria-invalid={overLimit}
        />
        {/* "0 / 2,000" is numbers and a slash, so inside an RTL paragraph it
            renders visually reversed as "2,000 / 0". Pin the direction. */}
        <p
          id={`${MESSAGE_ID}-hint`}
          // "0 / 2,000" is two numbers and a slash, so an unpinned RTL paragraph
          // renders it as "2,000 / 0". The base direction is pinned, and the
          // alignment is pulled back to the page's start so the counter still
          // sits under the field it belongs to.
          dir={overLimit ? undefined : "ltr"}
          className={`mt-1 text-start text-xs ${overLimit ? "text-destructive" : "text-muted-foreground rtl:text-right"}`}
          role={overLimit ? "alert" : undefined}
        >
          {overLimit
            ? t("analyzer.tooLong", {
                count: formatNumber(message.length),
                max: formatNumber(MAX_MESSAGE_LENGTH),
              })
            : t("analyzer.counter", {
                count: formatNumber(message.length),
                max: formatNumber(MAX_MESSAGE_LENGTH),
              })}
        </p>
        {/* The trust contract, at the point of paste. The app asks for a
            message that may be private and previously said nothing about what
            happens to it. */}
        <p className="mt-2 flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground">
          <Lock className="mt-0.5 h-3 w-3 shrink-0" aria-hidden="true" />
          <span>{t("analyzer.privacy")}</span>
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="mr-1 self-center text-xs text-muted-foreground">
          {t("analyzer.tryExample")}
        </span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.key}
            type="button"
            onClick={() => setMessage(ex.message)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border border-border bg-card hover:bg-accent transition-colors text-foreground"
          >
            <ex.icon className="w-3 h-3" aria-hidden="true" />
            {t(ex.key)}
          </button>
        ))}
      </div>

      <Button
        onClick={() => onAnalyze(message.slice(0, MAX_MESSAGE_LENGTH))}
        disabled={!canSubmit}
        className="w-full h-12 text-base font-semibold"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" aria-hidden="true" />
            {t("analyzer.submitting")}
          </>
        ) : rateLimited ? (
          <>
            <ShieldAlert className="w-5 h-5" aria-hidden="true" />
            {t("analyzer.rateLimited", { seconds: formatNumber(waitSeconds) })}
          </>
        ) : (
          <>
            <Search className="w-5 h-5" aria-hidden="true" />
            {t("analyzer.submit")}
          </>
        )}
      </Button>

      {/* The three-card stepper that used to sit here was removed: it looked
          like a progress indicator and tracked nothing. What it explained is
          said in one sentence, and the space now carries the privacy line. */}
      <p className="text-center text-xs leading-relaxed text-muted-foreground">
        {t("analyzer.method")}
      </p>
    </div>
  );
};

export default MessageAnalyzer;
