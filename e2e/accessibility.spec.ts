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

/**
 * The result screen.
 *
 * The loop above covers every static route. The result needs a model response,
 * so it is mocked here — and it is the screen that matters most: the verdict
 * word, the band scale, the evidence trail and the next steps all live behind
 * it, in both palettes, with status colours on tinted surfaces.
 */
const RESULT = {
  risk_score: 85,
  risk_level: "Dangerous",
  is_threat: true,
  attack_type: "Phishing",
  attack_type_ar: "التصيّد",
  clue_1: "The link points at a lookalike domain.",
  clue_2: "The deadline is designed to stop you checking.",
  clue_3: "It asks for credentials on a page the sender controls.",
  clue_1_ar: "الرابط يؤدي إلى نطاق مشابه.",
  clue_2_ar: "الموعد النهائي مصمم ليمنعك من التحقق.",
  clue_3_ar: "يطلب بيانات الدخول في صفحة يسيطر عليها المرسل.",
  explanation:
    "This is a credential-phishing message. The urgency and the lookalike domain exist to get your password onto a page the attacker controls.",
  explanation_ar:
    "هذه رسالة تصيّد لبيانات الدخول. الاستعجال والنطاق المشابه هدفهما أخذ كلمة مرورك إلى صفحة يسيطر عليها المهاجم.",
};

for (const locale of LOCALES) {
  for (const theme of ["light", "dark"] as const) {
    test(`the analysis result has no serious accessibility violations (${locale}, ${theme})`, async ({
      page,
    }) => {
      await page.addInitScript(
        ([l, t]) => {
          window.localStorage.setItem("haris_locale", l as string);
          window.localStorage.setItem("theme", t as string);
        },
        [locale, theme] as const,
      );
      await page.route("**/functions/v1/analyze-message", (route) =>
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(RESULT),
        }),
      );

      await page.goto("/");
      await page
        .getByLabel(/suspicious message|رسالة مشبوهة/i)
        .fill("IT Helpdesk: verify your account at univ-sso-verify.net/login");
      await page.getByRole("button", { name: /analyze with haris|حلّل بهاريس/i }).click();
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

      // Open the full trail, so the guess form and the next steps are scanned
      // rather than hidden behind the reveal button.
      for (let i = 0; i < 2; i++) {
        await page
          .getByRole("button", { name: /reveal clue|اكشف القرينة/i })
          .first()
          .click();
      }
      await page.waitForTimeout(900);

      const results = await new AxeBuilder({ page }).analyze();
      const blocking = results.violations.filter(
        (violation) =>
          violation.impact === "serious" || violation.impact === "critical",
      );

      expect(
        blocking,
        `accessibility violations on the result (${locale}, ${theme}):\n${describeViolations(blocking)}`,
      ).toEqual([]);
    });
  }
}
