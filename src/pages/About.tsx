import {
  BookOpen,
  Eye,
  FlaskConical,
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
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/locales/en";
import { voiceCalls } from "@/data/voiceCalls";

const THREAT_TYPES: ReadonlyArray<{ name: string; key: MessageKey; icon: typeof Shield }> = [
  { name: "Phishing", key: "threat.phishing", icon: ShieldAlert },
  { name: "Vishing", key: "threat.vishing", icon: Phone },
  { name: "Smishing", key: "threat.smishing", icon: MessageSquare },
  { name: "Fake Giveaways", key: "threat.fakeGiveaways", icon: Gift },
  { name: "Gaming Scams", key: "threat.gamingScams", icon: Gamepad2 },
  { name: "Social Engineering", key: "threat.socialEngineering", icon: Users },
  { name: "Stranger Danger", key: "threat.strangerDanger", icon: Eye },
  { name: "Safe Messages", key: "threat.safeMessages", icon: ShieldCheck },
];

const PILLARS = [
  {
    icon: Shield,
    titleKey: "about.analyzerTitle",
    descKey: "about.analyzerDesc",
  },
  {
    icon: Target,
    titleKey: "about.scenariosTitle",
    descKey: "about.scenariosDesc",
  },
  {
    icon: Phone,
    titleKey: "about.voiceTitle",
    descKey: "about.voiceDesc",
  },
  {
    icon: FlaskConical,
    titleKey: "sandbox.title",
    descKey: "sandbox.subtitle",
  },
] as const;

const About = () => {
  const { t } = useI18n();
  return (
    <div className="space-y-8">
        <h2 className="text-2xl font-bold text-foreground">{t("about.title")}</h2>

        <div className="rounded-lg border border-border bg-card p-5">
          <h3 className="mb-2 font-semibold text-foreground">{t("about.builtFor")}</h3>
          <p className="prose-measure text-sm leading-relaxed text-muted-foreground">
            {t("about.body")}
          </p>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-bold text-foreground">{t("about.threeWays")}</h3>
          <div className="space-y-3">
            {PILLARS.map((item) => (
              <div
                key={item.titleKey}
                className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card"
              >
                <item.icon
                  className="w-5 h-5 text-primary mt-0.5 shrink-0"
                  aria-hidden="true"
                />
                <div>
                  <p className="text-sm font-medium text-foreground">{t(item.titleKey)}</p>
                  <p className="text-sm text-muted-foreground">{t(item.descKey)}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {t("scenarios.available", { count: scenarios.length, calls: voiceCalls.length })}
          </p>
        </div>

        <div>
          <h3 className="text-lg font-bold text-foreground mb-2">
            <BookOpen className="w-5 h-5 inline mr-2" aria-hidden="true" />
            {t("about.howItTeaches")}
          </h3>
          <div className="rounded-lg border border-border bg-card p-5 space-y-3">
            <p className="prose-measure text-sm leading-relaxed text-muted-foreground">
              {t("about.teachesBody1")}
            </p>
            <p className="prose-measure text-sm leading-relaxed text-muted-foreground">
              {t("about.teachesBody2")}
            </p>
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-bold text-foreground">{t("about.threatTypes")}</h3>
          <ul className="grid grid-cols-2 sm:grid-cols-4 gap-2 list-none p-0 m-0">
            {THREAT_TYPES.map((threat) => (
              <li
                key={threat.name}
                className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-card text-sm text-foreground"
              >
                <threat.icon className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
                {t(threat.key)}
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
