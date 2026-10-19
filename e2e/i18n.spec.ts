import { expect, test } from "@playwright/test";

/**
 * Guard for untranslated copy on an otherwise-bilingual page.
 *
 * The sandbox architecture bullets were five hardcoded English `<li>` elements
 * beneath an Arabic section heading. The locale tests could not catch it (they
 * only check keys that exist) and the existing E2E suite only asserted on pages
 * that were already translated, so it survived while the rest of the page
 * switched to Arabic correctly.
 */
test("the sandbox architecture bullets are Arabic in Arabic mode", async ({ page }) => {
  await page.goto("/sandbox");
  await page.getByRole("tab", { name: "Spec & Dataset" }).click();
  await expect(page.getByRole("heading", { name: "Component architecture" })).toBeVisible();

  await page.getByRole("button", { name: /العربية|arabic/i }).first().click();

  const section = page
    .locator("section")
    .filter({ has: page.getByRole("heading", { name: "بنية المكونات" }) });
  await expect(section).toBeVisible();
  // The English original must be gone, and the Arabic replacement present.
  await expect(section).not.toContainText("Sandbox page: mode tabs");
  await expect(section).toContainText("صفحة الصندوق");
});
