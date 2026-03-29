import Header from "@/components/Header";
import { Shield, Eye, Zap, BookOpen, ShieldAlert, Phone, MessageSquare, Gamepad2, Users, ShieldCheck, Award, FileText, Target } from "lucide-react";

const THREAT_TYPES = [
  { name: "Phishing", icon: ShieldAlert },
  { name: "Vishing", icon: Phone },
  { name: "Smishing", icon: MessageSquare },
  { name: "Fake Giveaways", icon: Gamepad2 },
  { name: "Gaming Scams", icon: Gamepad2 },
  { name: "Social Engineering", icon: Users },
  { name: "Stranger Danger", icon: Eye },
  { name: "Safe Messages", icon: ShieldCheck },
];

const About = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-2xl space-y-8">
        <h2 className="text-2xl font-bold text-foreground">About HARIS</h2>

        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="font-semibold text-foreground mb-2">Built for students, by researchers</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            HARIS is a cybersecurity awareness platform designed specifically for high school students (K11-K12). In a world where teenagers face online threats daily — through social media, gaming, messaging apps, and fake offers — HARIS trains real instincts through AI-powered analysis, interactive scenarios, and voice simulations.
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-foreground mb-3">Three ways to learn</h3>
          <div className="space-y-3">
            {[
              { icon: Shield, title: "Message Analyzer", desc: "Paste any suspicious message and discover through clues what kind of attack it is." },
              { icon: Target, title: "Scenario Simulator", desc: "Live through 5 realistic attack scenarios. Make choices. Learn from every decision." },
              { icon: Phone, title: "Voice Lab", desc: "Hear vishing calls in Arabic and English. Flag red flags in real time. Train your ear." },
            ].map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
                <item.icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-foreground text-sm">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            <BookOpen className="w-5 h-5 inline mr-2" />
            The learning model
          </h3>
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              HARIS is built on the <strong className="text-foreground">ludic didactic approach</strong> — a research-backed educational method from the paper <em>"A Ludic Didactic Approach to Cybersecurity Education for Digital Citizens"</em>. Instead of lecturing students about threats, HARIS makes them discover attacks through progressive clues, active decision-making, and real-time feedback. This approach — combining vulgarization and conceptual explicitation within a gamified framework — has been shown in educational research to significantly improve knowledge retention compared to passive learning.
            </p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-foreground mb-3">Supported threat types</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {THREAT_TYPES.map((t) => (
              <div key={t.name} className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground">
                <t.icon className="w-4 h-4 text-primary shrink-0" />
                {t.name}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            <FileText className="w-5 h-5 inline mr-2" />
            Research Foundation
          </h3>
          <div className="rounded-lg border border-border bg-card p-5">
            <p className="text-sm text-muted-foreground leading-relaxed">
              HARIS is the practical implementation of the paper{" "}
              <strong className="text-foreground italic">"A Ludic Didactic Approach to Cybersecurity Education for Digital Citizens"</strong>
              , which proposes that cybersecurity concepts can be effectively taught through vulgarization and conceptual explicitation within a gamified framework.
            </p>
          </div>
        </div>

        <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 text-center space-y-2">
          <Award className="w-8 h-8 text-primary mx-auto mb-2" />
          <p className="text-sm font-medium text-foreground">
            HARIS was built for the <strong>----- AI Security Comp 2026</strong>
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
