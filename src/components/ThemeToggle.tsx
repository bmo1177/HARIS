import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useI18n } from "@/lib/i18n";

/**
 * Light/dark toggle.
 *
 * Renders a fixed-size placeholder until mounted: the resolved theme is unknown
 * during SSR and on the first client render, so rendering the real icon
 * immediately produces a hydration mismatch.
 */
export const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useI18n();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      // The three keys already existed in both dictionaries and were never wired
      // up, so the only user-facing string the e2e suite could match by English
      // text was this one.
      aria-label={
        !mounted
          ? t("nav.toggleTheme")
          : isDark
            ? t("nav.switchToLight")
            : t("nav.switchToDark")
      }
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {mounted && isDark ? (
        <Moon className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Sun className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
};
