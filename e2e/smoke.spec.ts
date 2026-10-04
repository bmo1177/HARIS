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

    // Previously the 404 was a bare flex box with no header and no <main>, and
    // its only link was a raw <a href="/"> that discarded client-side routing.
    await expect(page.getByRole("heading", { name: "This page does not exist" })).toBeVisible();
    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByRole("navigation", { name: "Main" })).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("link", { name: "Analyse a message" })).toHaveAttribute(
      "href",
      "/",
    );
  });

  test("no route scrolls horizontally on a narrow phone", async ({ page }) => {
    // The header put brand + four nav links + the XP bar on one flex row at
    // every width, producing a 533px header inside a 390px viewport: the whole
    // page scrolled sideways and "0 XP" was clipped off the right edge.
    for (const width of [320, 360, 390, 414]) {
      await page.setViewportSize({ width, height: 800 });
      for (const path of ["/", "/scenarios", "/voice-lab", "/about", "/nope"]) {
        await page.goto(path);
        const { scrollWidth, innerWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }));
        expect(scrollWidth, `${path} overflows at ${width}px`).toBeLessThanOrEqual(
          innerWidth + 1,
        );
      }
    }
  });

  test("the brand wordmark is visible on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await page.goto("/");
    // Was `hidden sm:block`, so mobile had no wordmark and no <h1> anywhere.
    await expect(page.getByRole("heading", { level: 1, name: /HARIS/ })).toBeVisible();
  });
});

test.describe("theming", () => {
  test("the toggle switches between light and dark", async ({ page }) => {
    await page.goto("/");

    const html = page.locator("html");
    const initial = await html.getAttribute("class");

    await page.getByRole("button", { name: /Switch to (light|dark) theme/ }).click();
    await expect(html).not.toHaveClass(initial ?? "");

    await page.getByRole("button", { name: /Switch to (light|dark) theme/ }).click();
    await expect(html).toHaveClass(initial ?? "");
  });

  test("the dark theme actually repaints the page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Switch to dark theme/ }).click();

    // `next-themes` was installed and the whole `.dark` palette was written, but
    // no ThemeProvider was ever rendered, so the class was never applied.
    const background = await page.evaluate(
      () => getComputedStyle(document.body).backgroundColor,
    );
    const [r, g, b] = (background.match(/\d+/g) ?? []).map(Number);
    expect(r + g + b).toBeLessThan(200);
  });

  test("the theme-color meta tag follows the theme", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: /Switch to dark theme/ }).click();
    // Matches `--background` in the dark token block. The test caught this value
    // drifting when the palette was redesigned, which is the point of asserting
    // it rather than trusting the two to stay in sync.
    await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
      "content",
      "#0c1018",
    );
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

test.describe("bilingual support", () => {
  test("switches the whole document to Arabic and back", async ({ page }) => {
    await page.goto("/");

    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("heading", { name: "Got a suspicious message?" })).toBeVisible();

    await page.getByRole("button", { name: "Switch to Arabic" }).click();

    // `lang` and `dir` have to be on <html> for screen readers to pick the right
    // voice and the browser to apply the correct default alignment.
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
    await expect(
      page.getByRole("heading", { name: "وصلتك رسالة مشبوهة؟" }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /حلّل بهاريس/ })).toBeVisible();

    await page.getByRole("button", { name: "التبديل إلى الإنجليزية" }).click();
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
    await expect(page.getByRole("heading", { name: "Got a suspicious message?" })).toBeVisible();
  });

  test("remembers the language across a reload", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Switch to Arabic" }).click();
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  });

  test("localizes navigation, not just the page body", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Switch to Arabic" }).click();
    const nav = page.getByRole("navigation", { name: "القائمة الرئيسية" });
    await expect(nav.getByRole("link", { name: "السيناريوهات" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "المكالمات" })).toBeVisible();
  });

  test("renders the character counter left-to-right inside an RTL page", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Switch to Arabic" }).click();
    // "0 / 2,000" is numbers and a slash, so an unpinned RTL paragraph renders it
    // visually reversed as "2,000 / 0".
    const counter = page.locator("#message-input-hint");
    await expect(counter).toHaveAttribute("dir", "ltr");
    await expect(counter).toHaveText("0 / 2,000");
  });

  test("shows Arabic example chips", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Switch to Arabic" }).click();
    // These were English-only labels sitting inside an otherwise Arabic page.
    await expect(page.getByRole("button", { name: /جائزة وهمية/ })).toBeVisible();
    await expect(page.getByRole("button", { name: /رابط تصيّد/ })).toBeVisible();
  });

  test("does not overflow horizontally in Arabic", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("button", { name: "Switch to Arabic" }).click();
    for (const width of [320, 390, 768]) {
      await page.setViewportSize({ width, height: 800 });
      for (const path of ["/", "/scenarios", "/voice-lab", "/about", "/nope"]) {
        await page.goto(path);
        const { scrollWidth, innerWidth } = await page.evaluate(() => ({
          scrollWidth: document.documentElement.scrollWidth,
          innerWidth: window.innerWidth,
        }));
        expect(scrollWidth, `${path} overflows in Arabic at ${width}px`).toBeLessThanOrEqual(
          innerWidth + 1,
        );
      }
    }
  });
});
