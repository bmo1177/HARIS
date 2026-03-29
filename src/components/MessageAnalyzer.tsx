import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, Gift, ShieldAlert, MessageSquare, Gamepad2 } from "lucide-react";

const EXAMPLES = [
  {
    label: "Fake prize",
    icon: Gift,
    message:
      "Congratulations! You have been selected to win a FREE PS5 from PlayStation Arabia! You are one of 10 lucky winners this week. Click here to claim your prize before it expires in 2 hours: ps5-winners-qatar.com/claim",
  },
  {
    label: "Phishing link",
    icon: ShieldAlert,
    message:
      "Your Snapchat account will be deleted in 24 hours due to suspicious activity. Verify your account now to keep it active: snapchat-verify-account.net/login",
  },
  {
    label: "Safe message",
    icon: MessageSquare,
    message:
      "Hi! Don't forget we have football practice tomorrow at 5pm at the school field. Bring your kit. See you there!",
  },
  {
    label: "Gaming scam",
    icon: Gamepad2,
    message:
      "FREE 10,000 V-Bucks! Limited offer for Fortnite players in Qatar. Download this mod to get free V-Bucks directly to your account: fortnite-vbucks-free.com — works 100% guaranteed!",
  },
];

interface MessageAnalyzerProps {
  onAnalyze: (message: string) => void;
  isLoading: boolean;
}

const MessageAnalyzer = ({ onAnalyze, isLoading }: MessageAnalyzerProps) => {
  const [message, setMessage] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Paste a suspicious message
        </label>
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Paste any suspicious message here — SMS, WhatsApp, email, DM... (Arabic or English)"
          className="min-h-[140px] text-base resize-none"
          dir="auto"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <span className="text-xs text-muted-foreground self-center mr-1">Try an example:</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            onClick={() => setMessage(ex.message)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-full border border-border bg-card hover:bg-accent transition-colors text-foreground"
          >
            <ex.icon className="w-3 h-3" />
            {ex.label}
          </button>
        ))}
      </div>

      <Button
        onClick={() => onAnalyze(message)}
        disabled={!message.trim() || isLoading}
        className="w-full h-12 text-base font-semibold"
        size="lg"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            HARIS is analyzing...
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            Analyze with HARIS
          </>
        )}
      </Button>

      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          { step: "1", text: "Paste the message" },
          { step: "2", text: "HARIS scores the threat" },
          { step: "3", text: "Discover what it is through clues" },
        ].map((s) => (
          <div key={s.step} className="p-3 rounded-lg border border-border bg-card">
            <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center mx-auto mb-1">
              {s.step}
            </div>
            <p className="text-xs text-muted-foreground">{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MessageAnalyzer;
