import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, Gift, ShieldAlert, MessageSquare, Gamepad2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/locales/en";

const EXAMPLES: ReadonlyArray<{ key: MessageKey; icon: typeof Gift; message: string }> = [
  {
    key: "example.fakePrize",
    icon: Gift,
    message:
      "Congratulations! You have been selected to win a FREE PS5 from PlayStation! You are one of 10 lucky winners this week. Click here to claim your prize before it expires in 2 hours: ps5-winners-claim.com/claim",
  },
  {
    key: "example.phishingLink",
    icon: ShieldAlert,
    message:
      "Your Snapchat account will be deleted in 24 hours due to suspicious activity. Verify your account now to keep it active: snapchat-verify-account.net/login",
  },
  {
    key: "example.safeMessage",
    icon: MessageSquare,
    message:
      "Hi! Don't forget we have football practice tomorrow at 5pm at the school field. Bring your kit. See you there!",
  },
  {
    key: "example.gamingScam",
    icon: Gamepad2,
    message:
      "FREE 10,000 V-Bucks! Limited offer for Fortnite players. Download this mod to get free V-Bucks directly to your account: fortnite-vbucks-free.com — works 100% guaranteed!",
  },
];

const MESSAGE_ID = "message-input";
/** Matches the server-side cap in `_shared/schemas.ts`. */
const MAX_MESSAGE_LENGTH = 2_000;

interface MessageAnalyzerProps {
  onAnalyze: (message: string) => void;
  isLoading: boolean;
}

const MessageAnalyzer = ({ onAnalyze, isLoading }: MessageAnalyzerProps) => {
  const [message, setMessage] = useState("");
  const { t, formatNumber } = useI18n();
  const overLimit = message.length > MAX_MESSAGE_LENGTH;
  const canSubmit = message.trim().length > 0 && !overLimit && !isLoading;

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
          dir={overLimit ? undefined : "ltr"}
          className={`mt-1 text-start text-xs ${overLimit ? "text-destructive" : "text-muted-foreground"}`}
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
        ) : (
          <>
            <Search className="w-5 h-5" aria-hidden="true" />
            {t("analyzer.submit")}
          </>
        )}
      </Button>

      {/* The steps carry real sequence information, so the numbering stays. A
          connector line between them was tried and removed: it is geometrically
          fragile across a responsive grid and read as a strikethrough across
          the number badges. */}
      <ol className="grid grid-cols-3 gap-3 text-center">
        {([
          { step: "1", key: "analyzer.step1" },
          { step: "2", key: "analyzer.step2" },
          { step: "3", key: "analyzer.step3" },
        ] as const).map((s) => (
          <li
            key={s.step}
            className="flex min-h-[4.5rem] flex-col items-center gap-1.5 rounded-lg border border-border bg-card px-2 py-3"
          >
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
              {s.step}
            </span>
            <span className="text-xs leading-snug text-muted-foreground">{t(s.key)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};

export default MessageAnalyzer;
