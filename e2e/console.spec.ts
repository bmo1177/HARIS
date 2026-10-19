import { expect, test } from "@playwright/test";

/**
 * Console cleanliness.
 *
 * A major router upgrade is exactly when deprecation warnings appear, and they
 * are invisible to every other test: the page still renders, the route still
 * resolves, and the warning scrolls past in a console nobody opens. React
 * Router v7 also warns on patterns v6 tolerated, so this is the check that
 * would have caught the upgrade silently asking for work later.
 *
 * Only console errors and warnings are collected — `log` and `info` are
 * excluded, because Vite's dev server and React's development build both emit
 * informational noise that is not a defect.
 */

const NOISE_ALLOWLIST = [
  // React's dev-only DevTools advert, and Vite's HMR chatter.
  /Download the React DevTools/,
  /\[vite\]/,
];

// Deliberately not allowlisted: "React Router Future Flag Warning". v7 warns
// about patterns it will remove in the next major, and that warning is the whole
// point of this file. Filtering it out would make the suite green while the
// codebase drifts toward a breaking release.
function isRelevant(text: string): boolean {
  return !NOISE_ALLOWLIST.some((re) => re.test(text));
}

for (const path of ["/", "/scenarios", "/voice-lab", "/sandbox", "/about"]) {
  test(`${path} logs no errors or warnings`, async ({ page }) => {
    const messages: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() !== "error" && msg.type() !== "warning") return;
      const text = msg.text();
      if (isRelevant(text)) messages.push(`[${msg.type()}] ${text}`);
    });
    page.on("pageerror", (error) => messages.push(`[pageerror] ${error.message}`));

    await page.goto(path);
    // Let lazy routes resolve and effects settle; warnings often fire late.
    await page.waitForLoadState("networkidle");

    expect(messages, `console output on ${path}:\n${messages.join("\n")}`).toEqual([]);
  });
}

test("navigating the whole app logs nothing", async ({ page }) => {
  const messages: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      const text = msg.text();
      if (isRelevant(text)) messages.push(`[${msg.type()}] ${text}`);
    }
  });
  page.on("pageerror", (error) => messages.push(`[pageerror] ${error.message}`));

  // Client-side traversal, which is where router warnings surface — a cold load
  // of each route would miss anything tied to a transition.
  await page.goto("/");
  const nav = page.getByRole("navigation", { name: "Main" });
  for (const label of ["Scenarios", "Voice Lab", "Sandbox", "About", "Home"]) {
    await nav.getByRole("link", { name: label, exact: true }).click();
    await page.waitForLoadState("networkidle");
  }

  expect(messages, `console output while navigating:\n${messages.join("\n")}`).toEqual([]);
});
