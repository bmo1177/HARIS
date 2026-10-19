import { expect, test } from "@playwright/test";

/**
 * Router behaviour coverage.
 *
 * `smoke.spec.ts` proves each route *renders*. This file proves the router
 * itself behaves — history, active state, programmatic navigation and SPA
 * transitions — because `react-router-dom` was upgraded 6.30.1 → 7.18.4 and
 * those are the surfaces where a major upgrade breaks silently.
 *
 * The distinction matters: a broken route is obvious (blank page, 404), while a
 * broken *active state* or a `navigate()` that full-reloads looks almost right
 * and survives casual clicking.
 */

test.describe("active nav state", () => {
  test("marks only the current route as active", async ({ page }) => {
    await page.goto("/scenarios");

    const nav = page.getByRole("navigation", { name: "Main" });
    const active = nav.locator('a[aria-current="page"]');

    // Exactly one item is current. `NavLink` sets aria-current="page" itself;
    // the custom className callback adds the visual treatment on top.
    await expect(active).toHaveCount(1);
    await expect(active).toHaveAttribute("href", "/scenarios");
    await expect(active).toHaveText(/Scenario/i);
  });

  test("the root link is not active on a child route", async ({ page }) => {
    // `/` is rendered with `end`, so it must not match `/about`. Without `end`
    // every nested path would light up Home as well.
    await page.goto("/about");
    const nav = page.getByRole("navigation", { name: "Main" });
    const active = nav.locator('a[aria-current="page"]');

    await expect(active).toHaveCount(1);
    await expect(active).toHaveAttribute("href", "/about");
  });

  test("the active state follows client-side navigation", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Main" });

    await nav.getByRole("link", { name: "Sandbox", exact: true }).click();
    await expect(page).toHaveURL("/sandbox");

    const active = nav.locator('a[aria-current="page"]');
    await expect(active).toHaveCount(1);
    await expect(active).toHaveAttribute("href", "/sandbox");
  });
});

test.describe("history", () => {
  test("browser back restores the previous route", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", {
      name: "Scenarios",
      exact: true,
    }).click();
    await expect(page).toHaveURL("/scenarios");

    await page.goBack();
    await expect(page).toHaveURL("/");
    await expect(page.getByRole("heading", { level: 1, name: /HARIS/ })).toBeVisible();
  });

  test("browser forward returns to the route that was left", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("navigation", { name: "Main" }).getByRole("link", {
      name: "About",
      exact: true,
    }).click();
    await expect(page).toHaveURL("/about");

    await page.goBack();
    await expect(page).toHaveURL("/");
    await page.goForward();
    await expect(page).toHaveURL("/about");
    await expect(page.getByRole("heading", { name: "About HARIS" })).toBeVisible();
  });

  test("a programmatic navigate() pushes history rather than replacing it", async ({ page }) => {
    // Scenarios' completion screen calls `navigate("/")`. If that used `replace`,
    // Back from the home page would skip the scenario the student just finished.
    //
    // The backend is intercepted so the state machine can run offline: without
    // it the feedback call fails and the flow takes a different branch.
    await page.route("**/functions/v1/scenario-feedback", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ safe: true, feedback: "Good.", feedback_ar: "جيد.", red_flag: "" }),
      }),
    );

    await page.goto("/scenarios");
    await page.getByRole("button").filter({ hasText: /XP/ }).first().click();

    // Four steps in every shipped scenario. The Next/See-results button is
    // awaited rather than counted: feedback arrives from the (mocked) endpoint,
    // so it does not exist yet on the tick after a choice is clicked. An
    // earlier version polled `count()` here, saw zero, and broke out of the
    // loop mid-scenario — a flake that failed roughly half of repeated runs.
    for (let step = 0; step < 4; step++) {
      const choice = page
        .locator("button")
        .filter({ hasText: /Reply|Check|Ask|Ignore|Block|Send|Stop/ })
        .first();
      await expect(choice).toBeVisible();
      await choice.click();

      const next = page.getByRole("button", { name: /Next step|See results/ });
      await expect(next).toBeVisible();
      await next.click();
    }

    // Asserted rather than skipped: a skipped test is not evidence, and this
    // CTA is reachable offline once the route is mocked.
    const testReal = page.getByRole("button", { name: /Test a real message/ });
    await expect(testReal).toBeVisible();
    await testReal.click();
    await expect(page).toHaveURL("/");

    await page.goBack();
    await expect(page).toHaveURL("/scenarios");
  });
});

test.describe("client-side navigation", () => {
  test("an in-app link does not trigger a full page load", async ({ page }) => {
    // A full reload would reset in-memory state and refetch every bundle. Tagging
    // the window lets us detect it: a document navigation wipes the tag.
    await page.goto("/");
    await page.evaluate(() => {
      (window as unknown as { __spa: boolean }).__spa = true;
    });

    await page.getByRole("navigation", { name: "Main" }).getByRole("link", {
      name: "Voice Lab",
      exact: true,
    }).click();
    await expect(page).toHaveURL("/voice-lab");

    const survived = await page.evaluate(
      () => (window as unknown as { __spa?: boolean }).__spa === true,
    );
    expect(survived, "navigation caused a full document reload").toBe(true);
  });

  test("a query string does not break route matching", async ({ page }) => {
    await page.goto("/about?from=test");
    await expect(page.getByRole("heading", { name: "About HARIS" })).toBeVisible();
  });

  test("a trailing slash still resolves", async ({ page }) => {
    // Vercel's SPA rewrite and the client router both have to agree here; a
    // mismatch is the classic "works in dev, 404s in production" deep link.
    await page.goto("/scenarios/");
    await expect(page.getByRole("heading", { name: "Scenario Simulator" })).toBeVisible();
  });
});
