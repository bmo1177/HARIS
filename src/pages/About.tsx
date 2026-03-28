import Header from "@/components/Header";
import { Shield, BookOpen, Zap, Eye, ShieldAlert, Phone, MessageSquare, Bot, ShieldCheck, Award, FileText } from "lucide-react";

const THREAT_TYPES = [
  { name: "Phishing", icon: ShieldAlert, color: "text-red-500" },
  { name: "Vishing", icon: Phone, color: "text-amber-500" },
  { name: "Smishing", icon: MessageSquare, color: "text-orange-500" },
  { name: "Malware", icon: ShieldAlert, color: "text-red-600" },
  { name: "Social Engineering", icon: Bot, color: "text-purple-500" },
  { name: "Deepfake Scams", icon: Eye, color: "text-indigo-500" },
  { name: "Safe Messages", icon: ShieldCheck, color: "text-green-500" },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-4">What HARIS Does</h2>
          <div className="space-y-3">
            {[
              { icon: Shield, text: "Analyzes suspicious messages (SMS, email, or social media) using AI to detect cyber threats in Arabic and English" },
              { icon: Eye, text: "Teaches you to spot red flags through an interactive clue-based detective game" },
              { icon: Zap, text: "Gives you instant, actionable advice to protect yourself from phishing, scams, and social engineering" },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
                <item.icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <p className="text-sm text-foreground">{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-3">
            <BookOpen className="w-5 h-5 inline mr-2" />
            Clue-Based Learning Model
          </h2>
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              HARIS uses a <strong className="text-foreground">ludic didactic approach</strong> — a research-backed educational method that 
              combines game mechanics with learning. Instead of simply telling you if a message is dangerous, 
              HARIS reveals clues progressively, engaging your critical thinking skills. You then guess the type 
              of attack, reinforcing your understanding through active participation. This approach has been shown 
              in educational research to improve knowledge retention and awareness compared to passive learning methods.
            </p>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Supported Threat Types</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {THREAT_TYPES.map((t) => (
              <div
                key={t.name}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground"
              >
                <t.icon className={`w-4 h-4 ${t.color} shrink-0`} />
                {t.name}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold text-foreground mb-3">
            <FileText className="w-5 h-5 inline mr-2" />
            Research Foundation
          </h2>
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              HARIS is the practical implementation of the paper{" "}
              <strong className="text-foreground italic">
                "A Ludic Didactic Approach to Cybersecurity Education for Digital Citizens"
              </strong>
              , which proposes that cybersecurity concepts can be effectively taught through vulgarization 
              and conceptual explicitation within a gamified framework.
            </p>
          </div>
        </div>

        <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 text-center space-y-2">
          <Award className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">
            HARIS was built for the{" "}
            <strong>----- AI Security 2026</strong>
          </p>
          <p className="text-xs text-muted-foreground">
            By Prof. Ouared Abdelkader & Belalia Mohamed Oussama - University of Ibn Khaldoun, Tiaret, Algeria
          </p>
        </div>
      </main>
    </div>
  );
};

export default About;
