import { defineConfig, devices } from "@playwright/test";

/**
 * Self-contained Playwright config.
 *
 * This previously delegated to a config factory from a UI-scaffolding package
 * that was in neither `package.json` nor any lockfile, so `npx playwright test`
 * failed immediately with a module resolution error. There were also zero spec
 * files. Depending on an unrelated vendor's test config also meant the suite
 * silently inherited settings nobody on this project chose.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? "github" : "list",

  // Lets CHROME_PATH point at a locally installed Chrome/Chromium. Needed on
  // NixOS and similar, where Playwright's bundled Chromium is missing glib.
  ...(process.env.CHROME_PATH
    ? { use: { channel: "chromium" } }
    : {}),

  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:8080",
    trace: "on-first-retry",
    ...(process.env.CHROME_PATH ? { launchOptions: { executablePath: process.env.CHROME_PATH } } : {}),
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run dev",
        url: "http://localhost:8080",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
