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

/**
 * The exercise content itself used to be English-only: scenario titles and
 * descriptions were bilingual, but the attacker messages, roles and choice
 * labels — the parts a student actually plays — were not. An Arabic student
 * read an Arabic card and then played the scenario in English.
 */
test("a scenario plays in Arabic in Arabic mode", async ({ page }) => {
  let sentBody = "";

  await page.route("**/functions/v1/scenario-feedback", async (route) => {
    sentBody = route.request().postData() ?? "";
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        safe: false,
        feedback: "Good instinct.",
        feedback_ar: "حدس جيد.",
        red_flag: "Unsolicited prize claim",
        red_flag_ar: "جائزة لم تطلبها",
      }),
    });
  });

  await page.goto("/scenarios");
  await page.getByRole("button", { name: /العربية|arabic/i }).first().click();
  // The English tests find the first scenario card by its "XP" text; that is
  // translated away in Arabic, so the role is used instead.
  await page.locator('main [role="button"]').first().click();

  // The attacker speaks Arabic, and the choices are Arabic. Asserted before a
  // choice is made, because the choices are replaced by the feedback panel
  // once one is picked.
  await expect(page.getByText(/تم اختيار حسابك عشوائياً/)).toBeVisible();
  await expect(
    page.getByRole("button", { name: /أتحقّق ممّا إذا كان هذا حساب/ }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: /Reply with my name/ })).toHaveCount(0);

  // The choice labels are Arabic too, so the English word list the other tests
  // use does not match here.
  await page.locator("button").filter({ hasText: /أردّ|أتحقّق|أسأل|أرسل|أرفض|أنقر|أتابع/ }).first().click();

  // And the model is sent the Arabic the student read, so its coaching is
  // about that text rather than about an English one they never saw.
  expect(sentBody).toContain("تم اختيار حسابك عشوائياً");
});

test("the analyzer shows Arabic clues in Arabic mode", async ({ page }) => {
  await page.route("**/functions/v1/analyze-message", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        risk_score: 85,
        risk_level: "Dangerous",
        is_threat: true,
        attack_type: "Phishing",
        attack_type_ar: "التصيّد",
        clue_1: "Lookalike domain",
        clue_2: "Countdown pressure",
        clue_3: "Asks for details",
        clue_1_ar: "نطاق يشبه نطاقاً رسمياً",
        clue_2_ar: "ضغط بالوقت",
        clue_3_ar: "يطلب بيانات شخصية",
        explanation: "This is a phishing attempt.",
        explanation_ar: "هذه محاولة تصيّد.",
      }),
    }),
  );

  await page.goto("/");
  await page.getByRole("button", { name: /العربية|arabic/i }).first().click();
  await page.getByLabel(/رسالة مشبوهة/i).fill("Free gift cards, click now");
  await page.getByRole("button", { name: /حلّل بهاريس/i }).click();

  // The clues are the teaching content. In English mode they were the only
  // part of the analyzer with no Arabic version.
  await expect(page.getByText("نطاق يشبه نطاقاً رسمياً")).toBeVisible();
  await expect(page.getByText("Lookalike domain")).toHaveCount(0);
});

test("an English screen still shows English clues", async ({ page }) => {
  await page.route("**/functions/v1/analyze-message", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        risk_score: 85,
        risk_level: "Dangerous",
        is_threat: true,
        attack_type: "Phishing",
        attack_type_ar: "التصيّد",
        clue_1: "Lookalike domain",
        clue_2: "Countdown pressure",
        clue_3: "Asks for details",
        clue_1_ar: "نطاق يشبه نطاقاً رسمياً",
        clue_2_ar: "ضغط بالوقت",
        clue_3_ar: "يطلب بيانات شخصية",
        explanation: "This is a phishing attempt.",
        explanation_ar: "هذه محاولة تصيّد.",
      }),
    }),
  );

  await page.goto("/");
  await page.getByLabel(/suspicious message/i).fill("Free gift cards, click now");
  await page.getByRole("button", { name: /analyze with haris/i }).click();

  await expect(page.getByText("Lookalike domain")).toBeVisible();
  await expect(page.getByText("نطاق يشبه نطاقاً رسمياً")).toHaveCount(0);
});
