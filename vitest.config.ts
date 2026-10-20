import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      // Only the browser app. The edge functions are Deno, tested by
      // `deno test`, and including them here reported them as 0% covered —
      // which reads as a catastrophic gap when it is actually a different
      // runner's job.
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/test/**",
        "src/main.tsx",
        // Static data. The scenarios and the dataset are content, and they are
        // checked by the locale suite instead: every Arabic field must be
        // present and actually Arabic.
        "src/data/**",
        "src/locales/**",
      ],
      reporter: ["text", "json-summary"],
      thresholds: {
        // Ratcheted, not aspirational. These are the numbers as they stand, so
        // the gate fails when coverage *drops* — when a file is added without
        // tests, or a branch is quietly rewritten. Raise them as the suite
        // grows; never lower them to make a run pass.
        //
        // The global numbers are low because most of the file count is UI that
        // Playwright exercises end to end rather than unit tests. The `src/lib`
        // numbers below are the ones that matter: that is where the logic
        // lives, and it is the part a unit test can actually cover.
        lines: 36,
        statements: 36,
        branches: 72,
        functions: 51,
        "src/lib/**": {
          lines: 82,
          statements: 82,
          branches: 79,
          functions: 81,
        },
      },
    },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
