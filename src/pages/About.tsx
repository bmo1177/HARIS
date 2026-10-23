import {
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
import { useI18n } from "@/lib/useI18n";
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

/**
 * About was eight bordered cards in a column, each with the same weight, so
 * nothing on the page read as more important than anything else. It is now an
 * argument: who this is for, how it teaches, what it covers.
 */
const About = () => {
  const { t, formatNumber } = useI18n();
  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{t("about.title")}</h1>
        <p className="max-w-[64ch] text-base leading-relaxed text-muted-foreground">
          {t("about.body")}
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">{t("about.threeWays")}</h2>
        {/* One chassis with hairline dividers rather than four cards inside a
            page of cards. */}
        <div className="grid overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2">
          {PILLARS.map((item) => (
            <div key={item.titleKey} className="bg-card p-4">
              <div className="flex items-center gap-2">
                <item.icon className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
                <h3 className="text-sm font-medium text-foreground">{t(item.titleKey)}</h3>
              </div>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {t(item.descKey)}
              </p>
            </div>
          ))}
        </div>
        <p className="font-mono text-xs text-muted-foreground">
          {t("scenarios.available", {
            count: formatNumber(scenarios.length),
            calls: formatNumber(voiceCalls.length),
          })}
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">{t("about.howItTeaches")}</h2>
        <div className="max-w-[65ch] space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>{t("about.teachesBody1")}</p>
          <p className="border-l-2 border-primary/40 pl-4 text-foreground">
            {t("about.teachesBody2")}
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">{t("about.threatTypes")}</h2>
        <ul className="flex flex-wrap gap-x-5 gap-y-2">
          {THREAT_TYPES.map((threat) => (
            <li
              key={threat.name}
              className="flex items-center gap-1.5 text-sm text-muted-foreground"
            >
              <threat.icon className="h-3.5 w-3.5 shrink-0 text-primary/70" aria-hidden="true" />
              {t(threat.key)}
            </li>
          ))}
        </ul>
      </section>

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
