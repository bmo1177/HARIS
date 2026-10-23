import { Outlet, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import { useI18n } from "@/lib/useI18n";

/**
 * Shared page frame.
 *
 * Every page previously repeated the same shell: a `min-h-screen bg-background`
 * wrapper, `<Header />`, and a `container mx-auto px-4 py-8 max-w-2xl main`.
 * Four copies that had already drifted — two used `max-w-2xl`, the scenario and
 * voice-lab play screens used `max-w-2xl` with different padding, and none of
 * them shared the viewport-height handling.
 *
 * Two routes need more than a reading column: the analyzer result is a
 * two-column evidence workspace, and the sandbox puts four challenge cards in a
 * row. The width lives here so the frame stays defined in one place.
 */
const WIDE_FRAME: Record<string, string> = {
  "/": "max-w-5xl",
  "/sandbox": "max-w-4xl",
};

const Layout = () => {
  const { pathname } = useLocation();
  const { t } = useI18n();
  const width = WIDE_FRAME[pathname] ?? "max-w-2xl";

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* There was no way past the header and its five links. */}
      <a
        href="#main"
        className="absolute left-4 top-4 z-[60] -translate-y-24 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-transform focus:translate-y-0"
      >
        {t("nav.skip")}
      </a>
      <Header />
      <main
        id="main"
        tabIndex={-1}
        className={`container mx-auto w-full flex-1 px-4 py-6 outline-none sm:py-8 ${width}`}
      >
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
