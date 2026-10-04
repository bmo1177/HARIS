import {
  BookOpen,
  Eye,
  Gamepad2,
  Gift,
  MessageSquare,
  Phone,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Target,
  Users,
} from "lucide-react";
import { scenarios } from "@/data/scenarios";
import { voiceCalls } from "@/data/voiceCalls";

const THREAT_TYPES = [
  { name: "Phishing", icon: ShieldAlert },
  { name: "Vishing", icon: Phone },
  { name: "Smishing", icon: MessageSquare },
  { name: "Fake Giveaways", icon: Gift },
  { name: "Gaming Scams", icon: Gamepad2 },
  { name: "Social Engineering", icon: Users },
  { name: "Stranger Danger", icon: Eye },
  { name: "Safe Messages", icon: ShieldCheck },
];

const PILLARS = [
  {
    icon: Shield,
    title: "Message Analyzer",
    desc: "Paste any suspicious message and discover through clues what kind of attack it is.",
  },
  {
    icon: Target,
    title: "Scenario Simulator",
    desc: "Live through realistic attack scenarios. Make choices. Learn from every decision.",
  },
  {
    icon: Phone,
    title: "Voice Lab",
    desc: "Hear vishing calls in Arabic and English. Flag red flags in real time. Train your ear.",
  },
];

const About = () => {
  return (
    <div className="space-y-8">
        <h2 className="text-2xl font-bold text-foreground">About HARIS</h2>

        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-2">Built for students</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            HARIS is a cybersecurity awareness platform designed for high school students
            (K11–K12). In a world where teenagers face online threats daily — through social
            media, gaming, messaging apps, and fake offers — HARIS trains real instincts through
            AI-powered analysis, interactive scenarios, and voice simulations.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-foreground mb-3">Three ways to learn</h3>
          <div className="space-y-3">
            {PILLARS.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card"
              >
                <item.icon
                  className="w-5 h-5 text-primary mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="font-medium text-foreground text-sm">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {scenarios.length} scenarios and {voiceCalls.length} voice calls available today.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            <BookOpen className="w-5 h-5 inline mr-2" aria-hidden="true" />
            How it teaches
          </h3>
          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <p className="text-sm text-muted-foreground leading-relaxed">
              Rather than lecturing students about threats, HARIS makes them{" "}
              <strong className="text-foreground">discover</strong> them. Every analysis reveals
              one clue at a time, so a student forms their own hypothesis before seeing the
              verdict. Scenarios and voice calls put the decision in their hands, and feedback
              arrives immediately afterwards while the reasoning is still fresh.
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              The aim is to make the skill automatic: not "HARIS said this was a scam" but "I
              noticed the urgency and the payment channel, so I stopped."
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-foreground mb-3">Supported threat types</h3>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2 list-none p-0 m-0">
            {THREAT_TYPES.map((threat) => (
              <li
                key={threat.name}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground"
              >
                <threat.icon className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                {threat.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Credits are intentionally not rendered.

            They previously named a specific competition, university and
            supervisors, and the competition field was still an unfilled
            placeholder ("----- AI Security Comp 2026") that shipped to
            production. The surrounding content also mixed Algerian and Qatari
            details. Restore this block once those facts are settled:

              <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 ...">
                <Award ... />
                <p>HARIS was built for the <strong>{competitionName} {competitionYear}</strong></p>
                <p>By {supervisors} — {institution}</p>
              </div>
        */}
    </div>
  );
};

export default About;
