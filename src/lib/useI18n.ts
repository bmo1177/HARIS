import { useContext } from "react";
import { I18nContext } from "@/lib/i18n-context";
import type { I18nValue } from "@/lib/locale";

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within I18nProvider");
  return ctx;
}
