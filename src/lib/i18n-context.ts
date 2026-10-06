import { createContext } from "react";
import type { I18nValue } from "@/lib/locale";

/**
 * The context object lives alone so neither the provider module nor the hook
 * module mixes component and non-component exports. See the module docblock on
 * `lib/i18n.tsx` for why the bilingual system is hand-rolled at all.
 */
export const I18nContext = createContext<I18nValue | null>(null);
