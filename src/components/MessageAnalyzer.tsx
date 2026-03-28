import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Search, Mail, MessageSquare, Phone } from "lucide-react";

const EXAMPLES = [
  {
    label: "Phishing",
    icon: Mail,
    color: "text-destructive",
    message:
      "Your QNB account has been suspended. Verify your identity immediately at: qnb-secure-verify.net or your account will be permanently closed within 24 hours.",
  },
  {
    label: "Safe",
    icon: MessageSquare,
    color: "text-green-600",
    message:
      "Hi, your grocery order #4821 has been delivered to your door. Thank you for shopping with us!",
  },
  {
    label: "Social Engineering",
    icon: Phone,
    color: "text-amber-600",
    message:
      "Hello, I'm calling from Microsoft support. We detected a virus on your computer. Please install this tool immediately so we can fix it remotely: bit.ly/fix-now",
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
          placeholder="Paste a suspicious message here... (Arabic or English supported)"
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
            <ex.icon className={`w-3 h-3 ${ex.color}`} />
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
            Analyzing...
          </>
        ) : (
          <>
            <Search className="w-5 h-5" />
            Analyze with AI
          </>
        )}
      </Button>
    </div>
  );
};

export default MessageAnalyzer;
