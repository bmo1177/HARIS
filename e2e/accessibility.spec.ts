import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

/**
 * Accessibility gate.
 *
 * Every other test in this suite checks that something is *present*. This one
 * checks that what is present can actually be used: by a screen reader, with a
 * keyboard, by someone who cannot rely on colour.
 *
 * It exists because the accessibility bugs in this app were the quiet kind.
 * A hardcoded `sr-only` string that stayed English, an unlabelled control, a
 * heading that was not a heading — none of them break a page, and all of them
 * are invisible to a test that only asserts the page rendered.
 *
 * axe is not a complete check. It cannot tell you whether a label is *useful*,
 * or whether a focus order makes sense. It reliably finds the mechanical
 * faults, which is exactly the class that survives review.
 *
 * Serious and critical only. `minor` findings are advisory and would make the
 * gate noise rather than strict; `serious` ones block the lesson.
 */

const ROUTES = ["/", "/scenarios", "/voice-lab", "/sandbox", "/about", "/nope"];

const LOCALES = ["en", "ar"] as const;

/** The app's own locale key. Set before the bundle runs, so the first paint is Arabic. */
const LOCALE_KEY = "haris_locale";

const setLocale = (page: Page, locale: string) => {
  page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key as string, value as string);
    },
    [LOCALE_KEY, locale] as const,
  );
};

const describeViolations = (
  violations: Awaited<ReturnType<AxeBuilder["analyze"]>>["violations"],
): string =>
  violations
    .map((v) => {
      const targets = v.nodes
        .slice(0, 3)
        .map((n) => n.target.join(" "))
        .join(", ");
      return `[${v.impact}] ${v.id}: ${v.help}\n    at ${targets}`;
    })
    .join("\n");

for (const locale of LOCALES) {
  test.describe(`accessibility (${locale})`, () => {
    for (const route of ROUTES) {
      test(`${route} has no serious accessibility violations`, async ({ page }) => {
        if (locale === "ar") setLocale(page, locale);

        await page.goto(route);
        // Let lazy routes and effects settle, so the scan sees the real page
        // rather than a spinner.
        await page.waitForLoadState("networkidle");

        const results = await new AxeBuilder({ page }).analyze();
        const blocking = results.violations.filter(
          (violation) =>
            violation.impact === "serious" || violation.impact === "critical",
        );

        expect(
          blocking,
          `accessibility violations on ${route} (${locale}):\n${describeViolations(blocking)}`,
        ).toEqual([]);
      });
    }
  });
}
