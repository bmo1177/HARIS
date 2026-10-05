import { Languages } from "lucide-react";
import { useI18n } from "@/lib/i18n";

/**
 * Language switch.
 *
 * The app has always generated Arabic for every model response and never shown
 * any of it. This makes the choice explicit and puts Arabic content — the
 * explanations, the attack type, the red-flag reasons — in front of the student.
 */
export const LocaleSwitch = () => {
  const { locale, setLocale, t } = useI18n();
  const next = locale === "ar" ? "en" : "ar";

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      aria-label={next === "ar" ? t("nav.switchToArabic") : t("nav.switchToEnglish")}
      className="flex h-8 shrink-0 items-center gap-1 rounded-lg px-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Languages className="h-4 w-4" aria-hidden="true" />
      <span aria-hidden="true">{next === "ar" ? "ع" : "EN"}</span>
    </button>
  );
};
