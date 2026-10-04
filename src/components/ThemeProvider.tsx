import { useEffect } from "react";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";

/** Matches the `--background` values in index.css for each theme. */
const THEME_COLOR = {
  light: "#ffffff",
  dark: "#0c1018",
} as const;

const SyncThemeColor = () => {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) return;
    // Until the theme resolves, leave the declared value alone rather than
    // flashing the wrong colour.
    if (resolvedTheme !== "light" && resolvedTheme !== "dark") return;
    meta.content = THEME_COLOR[resolvedTheme];
  }, [resolvedTheme]);

  return null;
};

/**
 * Wires up theming.
 *
 * `next-themes` was a dependency and `tailwind.config.ts` had
 * `darkMode: ["class"]` with a complete `.dark` block in index.css, but nothing
 * ever rendered a `ThemeProvider` — so the class was never applied and the whole
 * dark palette was dead code. `ui/sonner.tsx` was calling `useTheme()` against
 * no provider at the same time.
 */
export const ThemeProvider = ({ children }: { children: React.ReactNode }) => (
  <NextThemesProvider
    attribute="class"
    /* `system`, not `dark`.
       The palette is designed dark-first and looks best there, but forcing dark
       on a visitor whose OS says light is worse than the reverse: they land on a
       dark page with no signal that a theme toggle exists. Measured with
       `defaultTheme="dark"` — `enableSystem` stops mattering once the choice is
       written to storage, so the OS preference is ignored on first visit. */
    defaultTheme="system"
    enableSystem
    disableTransitionOnChange
  >
    <SyncThemeColor />
    {children}
  </NextThemesProvider>
);
