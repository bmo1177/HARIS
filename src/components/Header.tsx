import { Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LocaleSwitch } from "@/components/LocaleSwitch";
import XPBar from "@/components/XPBar";
import { useXP } from "@/lib/xpContext";
import { useI18n } from "@/lib/i18n";
import type { MessageKey } from "@/locales/en";

const NAV_ITEMS = [
  { to: "/", key: "nav.home" },
  { to: "/scenarios", key: "nav.scenarios" },
  { to: "/voice-lab", key: "nav.voiceLab" },
  { to: "/sandbox", key: "nav.sandbox" },
  { to: "/about", key: "nav.about" },
] as const satisfies ReadonlyArray<{ to: string; key: MessageKey }>;

const Header = () => {
  const { state } = useXP();
  const { t } = useI18n();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/85 backdrop-blur-sm">
      {/*
        The nav moves to its own full-width row below `sm`.

        Previously brand, four nav links and the XP bar sat on one flex row at
        every width. At 390px that produced a 533px-wide header inside a 390px
        viewport, so the entire page scrolled sideways, "0 XP" was clipped off
        the right edge and "Voice Lab" wrapped onto two lines.
      */}
      <div className="container mx-auto flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link
          to="/"
          className="flex shrink-0 items-center gap-2 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="flex w-9 h-9 items-center justify-center rounded-xl bg-primary">
            <Shield className="w-5 h-5 text-primary-foreground" aria-hidden="true" />
          </span>
          {/* Visible at every width now that the nav has its own row. Previously
              `hidden sm:block`, which left mobile with no wordmark and no
              <h1> on any page. */}
          <h1 className="text-lg font-bold leading-none tracking-tight text-foreground">
            HARIS{" "}
            <span dir="rtl" lang="ar" className="text-sm font-normal text-muted-foreground">
              هاريس
            </span>
          </h1>
        </Link>

        <div className="ml-auto flex shrink-0 items-center gap-1 sm:gap-2">
          <LocaleSwitch />
          <ThemeToggle />
          <XPBar state={state} />
        </div>

        <nav
          aria-label={t("nav.main")}
          className="order-last w-full border-t border-border/60 pt-2 sm:order-none sm:w-auto sm:border-0 sm:pt-0"
        >
          {/* `overflow-x-auto` is a deliberate fallback: Arabic labels run
              longer than English ones, and a future translation must never be
              able to push the whole page sideways. At every width we ship, the
              row fits and this never scrolls. */}
          <ul className="flex items-center justify-between overflow-x-auto sm:justify-start sm:gap-0.5">
            {NAV_ITEMS.map((item) => (
              <li key={item.to} className="flex-1 sm:flex-none">
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className="block w-full whitespace-nowrap rounded-lg px-2 py-2 text-center text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-3 sm:py-1.5 sm:text-sm"
                  activeClassName="bg-accent font-medium text-foreground"
                >
                  {t(item.key)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
};

export default Header;
