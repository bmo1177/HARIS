import { expect, test } from "@playwright/test";

/**
 * Smoke tests for the parts of HARIS that work without the AI backend.
 *
 * The analyzer, scenario feedback and voice debrief all call Supabase edge
 * functions, so they are not covered here: those need a deployed backend and
 * are better exercised by the eval harness than by E2E. What these tests guard
 * is the thing that actually broke in production — routing.
 */

test.describe("navigation", () => {
  test("the home page renders", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByLabel("Paste a suspicious message")).toBeVisible();
  });

  test("deep links resolve instead of 404ing", async ({ page }) => {
    // `vercel.json` was missing, so a direct hit or refresh on any route below
    // returned Vercel's 404. In-app navigation masked it, which is why it
    // survived: the live site 404'd on /about while appearing fine when clicked
    // through.
    for (const [path, heading] of [
      ["/scenarios", "Scenario Simulator"],
      ["/voice-lab", "Voice Lab"],
      ["/about", "About HARIS"],
    ] as const) {
      const response = await page.goto(path);
      expect(response?.status(), `${path} should not 404`).toBeLessThan(400);
      await expect(page.getByRole("heading", { name: heading })).toBeVisible();
    }
  });

  test("a reload on a deep link still works", async ({ page }) => {
    await page.goto("/scenarios");
    await page.reload();
    await expect(page.getByRole("heading", { name: "Scenario Simulator" })).toBeVisible();
  });

  test("an unknown route renders the not-found page", async ({ page }) => {
    await page.goto("/definitely-not-a-route");
    await expect(page.getByText(/not found/i)).toBeVisible();
  });
});

test.describe("analyzer input", () => {
  test("the example chips fill the textarea", async ({ page }) => {
    await page.goto("/");

    const input = page.getByLabel("Paste a suspicious message");
    await page.getByRole("button", { name: "Fake prize" }).click();

    await expect(input).not.toHaveValue("");
  });

  test("the analyze button is disabled until there is a message", async ({ page }) => {
    await page.goto("/");

    const analyze = page.getByRole("button", { name: /Analyze with HARIS/ });
    await expect(analyze).toBeDisabled();

    await page.getByLabel("Paste a suspicious message").fill("hello");
    await expect(analyze).toBeEnabled();
  });

  test("the textarea is labelled for screen readers", async ({ page }) => {
    await page.goto("/");
    // Previously the <label> was a sibling with no htmlFor, so the app's
    // primary input had no accessible name at all.
    await expect(page.getByLabel("Paste a suspicious message")).toBeVisible();
  });
});

test.describe("scenario list", () => {
  test("scenario cards are reachable and actionable by keyboard", async ({ page }) => {
    await page.goto("/scenarios");

    // These were clickable divs with no role, tabIndex or key handler, so the
    // primary navigation of the route was unreachable without a mouse.
    const firstCard = page.getByRole("button").filter({ hasText: /XP/ }).first();
    await firstCard.focus();
    await expect(firstCard).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(page.getByRole("button", { name: /Back/ })).toBeVisible();
  });
});

test.describe("XP persistence", () => {
  test("a stored XP total is reflected in the header", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("haris_xp", "250"));
    await page.reload();

    await expect(page.getByText("250 XP")).toBeVisible();
    await expect(page.getByText("Lv 3")).toBeVisible();
  });

  test("a corrupted XP value does not render as NaN", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("haris_xp", "not-a-number"));
    await page.reload();

    await expect(page.getByText(/NaN/)).toHaveCount(0);
    await expect(page.getByText("0 XP")).toBeVisible();
  });

  test("XP above the final level does not render NaN progress", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.setItem("haris_xp", "99999"));
    await page.reload();

    await expect(page.getByText(/NaN/)).toHaveCount(0);
    await expect(page.getByText("Lv 5")).toBeVisible();
  });
});
