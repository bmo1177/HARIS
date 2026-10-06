import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { en, type MessageKey } from "@/locales/en";
import { ar } from "@/locales/ar";
import { I18nContext } from "@/lib/i18n-context";
import { LOCALES, type I18nValue, type Locale } from "@/lib/locale";

/**
 * Bilingual support for HARIS.
 *
 * ## Why this exists
 *
 * The app has been paying for Arabic output on every single AI call and
 * rendering none of it. `attack_type_ar`, `feedback_ar`, `debrief_ar`,
 * `top_tip_ar` and nine `titleAr` fields were all fetched, typed, and then
 * dropped on the floor — while `About.tsx` markets Arabic as a first-class
 * pillar of the product.
 *
 * ## Why not a library
 *
 * The requirement is one boolean, two dictionaries and a `dir` attribute. The
 * part worth doing properly is the *type*: `ar` is declared as
 * `Record<MessageKey, string>`, where `MessageKey` is derived from the English
 * dictionary. Adding a string to `en` and forgetting Arabic is a **compile
 * error**, not a runtime fallback. That guarantee is the reason to hand-roll
 * this rather than reach for a dependency.
 */

const MESSAGES: Record<Locale, Record<MessageKey, string>> = { en, ar };

const STORAGE_KEY = "haris_locale";

/** One key per entry in `LEVELS` in lib/xp.ts. Order must match. */
const LEVEL_TITLE_KEYS = ["level.0", "level.1", "level.2", "level.3", "level.4"] as const satisfies readonly MessageKey[];

const isLocale = (value: unknown): value is Locale =>
  typeof value === "string" && (LOCALES as string[]).includes(value);

function readStoredLocale(): Locale | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isLocale(stored) ? stored : null;
  } catch {
    return null;
  }
}

export function I18nProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  initialLocale?: Locale;
}) {
  // Arabic first for an Arabic-speaking visitor, but an explicit stored choice
  // always wins over the OS setting.
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (initialLocale) return initialLocale;
    const stored = readStoredLocale();
    if (stored) return stored;
    if (typeof navigator !== "undefined" && navigator.language?.startsWith("ar")) return "ar";
    return "en";
  });

  const dir = locale === "ar" ? "rtl" : "ltr";

  // Keep the document in sync so screen readers pick the right voice and the
  // browser applies the correct default text alignment.
  useEffect(() => {
    const root = document.documentElement;
    root.lang = locale;
    root.dir = dir;
  }, [locale, dir]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage unavailable; the choice still applies for this session.
    }
  }, []);

  const toggle = useCallback(() => {
    setLocale(locale === "ar" ? "en" : "ar");
  }, [locale, setLocale]);

  const t = useCallback(
    (key: MessageKey, vars?: Record<string, string | number>) => {
      // English is the source of truth; the Arabic dictionary is compile-time
      // exhaustive, so a missing key here can only come from a bad cast.
      const template = MESSAGES[locale][key] ?? MESSAGES.en[key];
      if (!vars) return template;
      return template.replace(/\{(\w+)\}/g, (match, name: string) =>
        name in vars ? String(vars[name]) : match,
      );
    },
    [locale],
  );

  const levelTitle = useCallback(
    (level: number) => {
      const index = Math.min(Math.max(Math.trunc(level) - 1, 0), LEVEL_TITLE_KEYS.length - 1);
      return t(LEVEL_TITLE_KEYS[index]);
    },
    [t],
  );

  const formatNumber = useCallback(
    (value: number) =>
      new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-GB", {
        // Arabic-Indic digits (٠١٢٣) are correct but markedly slower to read for
        // most users of a security tool, where numbers carry meaning.
        numberingSystem: "latn",
      }).format(value),
    [locale],
  );

  const value = useMemo<I18nValue>(
    () => ({
      locale,
      setLocale,
      toggle,
      dir,
      isRtl: dir === "rtl",
      t,
      levelTitle,
      formatNumber,
    }),
    [locale, setLocale, toggle, dir, t, levelTitle, formatNumber],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
