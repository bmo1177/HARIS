import { Link } from "react-router-dom";
import { NavLink } from "@/components/NavLink";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LocaleSwitch } from "@/components/LocaleSwitch";
import XPBar from "@/components/XPBar";
import { useXP } from "@/lib/useXP";
import { useI18n } from "@/lib/useI18n";
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
    <header className="sticky top-0 z-50 border-b border-border bg-background/82 backdrop-blur-md supports-[backdrop-filter]:bg-background/70 shadow-[0_1px_0_hsl(var(--border)/0.6)]">
      {/*
        The nav moves to its own full-width row below `sm`.

        Previously brand, four nav links and the XP bar sat on one flex row at
        every width. At 390px that produced a 533px-wide header inside a 390px
        viewport, so the entire page scrolled sideways, "0 XP" was clipped off
        the right edge and "Voice Lab" wrapped onto two lines.
      */}
      <div className="container mx-auto flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 py-2 sm:py-3">
        <Link
          to="/"
          className="group flex shrink-0 items-center gap-2.5 rounded-lg px-1 py-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          <span className="flex w-9 h-9 items-center justify-center rounded-[0.65rem] bg-primary shadow-[0_4px_14px_hsl(var(--primary)/0.28)] transition-transform duration-150 group-hover:scale-[1.04] group-active:scale-[0.98]">
            {/* H lettermark: same geometry as public/favicon.svg. currentColor
                so it follows primary-foreground across themes, like the Shield
                it replaces. */}
            <svg
              viewBox="0 0 64 64"
              className="h-5 w-5 text-primary-foreground"
              aria-hidden="true"
              focusable="false"
            >
              <rect x="16" y="14" width="10" height="36" fill="currentColor" />
              <rect x="38" y="14" width="10" height="36" fill="currentColor" />
              <rect x="16" y="29" width="32" height="6" fill="currentColor" />
            </svg>
          </span>
          {/* The wordmark is not a heading. It was an <h1> on every route, so
              five of six pages began their document outline with "HARIS" and
              the actual page title was an <h2>. Each page owns its own <h1>
              now, and this is a link like any other. */}
          <span className="flex flex-col leading-none">
            <span className="text-[17px] font-bold tracking-[-0.02em] text-foreground">HARIS</span>
            <span dir="rtl" lang="ar" className="mt-0.5 hidden text-[11px] font-medium tracking-[0.04em] text-muted-foreground sm:block">
              هاريس
            </span>
          </span>
        </Link>

        <div className="ms-auto flex shrink-0 items-center gap-1 sm:gap-2">
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
              able to push the whole page sideways. The row itself must fit at
              320px — the fifth item broke that once, and the e2e nav-fit test
              pins it so it cannot regress silently. */}
          <ul className="flex items-center justify-between overflow-x-auto sm:justify-start sm:gap-0.5">
            {NAV_ITEMS.map((item) => (
              <li key={item.to} className="flex-1 sm:flex-none">
                <NavLink
                  to={item.to}
                  end={item.to === "/"}
                  className="flex min-h-[44px] w-full items-center justify-center whitespace-nowrap rounded-full px-1 text-center text-[12px] text-muted-foreground transition-all duration-150 hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:min-h-0 sm:px-3 sm:py-1.5 sm:text-sm"
                  activeClassName="bg-accent font-semibold text-foreground shadow-[inset_0_0_0_1px_hsl(var(--border))] hover:bg-accent"
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
