import type { MessageKey } from "@/locales/en";

export type Locale = "en" | "ar";

export const LOCALES: Locale[] = ["en", "ar"];

export interface I18nValue {
  locale: Locale;
  setLocale: (next: Locale) => void;
  toggle: () => void;
  /** "ltr" or "rtl". */
  dir: "ltr" | "rtl";
  isRtl: boolean;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
  /** Localized title for a 1-based XP level. */
  levelTitle: (level: number) => string;
  /** Locale-aware number formatting, keeping Latin digits for readability. */
  formatNumber: (value: number) => string;
}
