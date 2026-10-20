import type { Locale } from "@/lib/locale";

/**
 * Picks the Arabic variant of a model-produced string when the interface is in
 * Arabic.
 *
 * Every Arabic field the model returns is optional in practice, for two
 * different reasons, and both have to fall back to the English text rather than
 * render a blank:
 *
 *   - The functions and the client are deployed separately, so a client can
 *     arrive before the functions that produce the field.
 *   - A model can decline to translate, or return an empty string, and the
 *     server passes that through rather than inventing Arabic.
 *
 * An empty Arabic string is therefore treated as "not translated", not as
 * content: a blank clue card helps nobody, and the English one at least says
 * something true.
 */
export function localizedText(
  english: string,
  arabic: string | undefined,
  locale: Locale,
): string {
  if (locale === "ar" && arabic !== undefined && arabic.trim().length > 0) {
    return arabic;
  }
  return english;
}
