#!/usr/bin/env node
/**
 * Bundle size budget.
 *
 * The audience is a student on a school phone or a weak connection, and the
 * first thing that costs them is JavaScript. The bundle has been defended
 * deliberately — `@supabase/supabase-js` was removed because it was 60% of the
 * payload for one `functions.invoke` call — which means the current size is a
 * decision, not an accident. This turns it into a rule.
 *
 * Without a budget, the bundle only ever grows. A dependency added for a
 * one-line convenience, an import that pulls a barrel file, a locale dictionary
 * that nobody notices is duplicated: none of these announce themselves, and
 * the cost lands on every visitor rather than on the person who made the
 * change.
 *
 *   node scripts/check-bundle-size.mjs
 *
 * Exit code is 0 when the build is within budget, 1 otherwise.
 */

import { existsSync, readFileSync, readdirSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { join } from "node:path";

/**
 * Budgets in kilobytes, gzipped.
 *
 * The entry chunk is what every visitor downloads before the app can render,
 * so it is the number that matters most. The total is the other half: the
 * lazy chunks are only fetched when a route is opened, but a student who opens
 * all of them still pays for all of them.
 *
 * The headroom is deliberate and small. A budget with room to spare is not a
 * budget; if a change needs more than this, the change is wrong, or this
 * number should be raised deliberately in a commit that says why.
 */
const BUDGET_KB = {
  entry: 120,
  // 152 -> 158: the local analyzer and its bilingual copy ship in the entry so
  // the exercise survives a dead backend even when a lazy chunk cannot be
  // fetched. That is the one moment the fallback is needed.
  totalJs: 158,
  css: 8,
};

const ASSETS = "dist/assets";

let failures = 0;

const C = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

const pass = (m) => console.log(`  ${C.green("ok")}   ${m}`);
const fail = (m) => { failures++; console.log(`  ${C.red("FAIL")} ${m}`); };
const info = (m) => console.log(`  ${C.dim("·")}    ${m}`);

const kb = (bytes) => bytes / 1024;

const gzipOf = (file) => gzipSync(readFileSync(file)).length;

console.log(C.bold("\nBundle size"));

if (!existsSync(ASSETS)) {
  fail(`${ASSETS} is missing — run \`npm run build\` first`);
  process.exit(1);
}

const files = readdirSync(ASSETS);
const js = files.filter((f) => f.endsWith(".js"));
const css = files.filter((f) => f.endsWith(".css"));

if (js.length === 0) {
  fail("no JavaScript in dist/assets — the build did not produce a bundle");
  process.exit(1);
}

// The entry chunk is the one named after the app's entry module.
const entry = js.find((f) => f.startsWith("index-"));
if (!entry) {
  fail("could not find the entry chunk (expected a file named index-*.js)");
  process.exit(1);
}

const entryKb = kb(gzipOf(join(ASSETS, entry)));
const totalJsKb = kb(js.reduce((sum, f) => sum + gzipOf(join(ASSETS, f)), 0));
const totalCssKb = kb(css.reduce((sum, f) => sum + gzipOf(join(ASSETS, f)), 0));

const check = (label, actualKb, budgetKb) => {
  if (actualKb <= budgetKb) {
    pass(`${label}: ${actualKb.toFixed(1)} kB gzip (budget ${budgetKb} kB)`);
  } else {
    fail(
      `${label}: ${actualKb.toFixed(1)} kB gzip is over the ${budgetKb} kB budget ` +
        `by ${(actualKb - budgetKb).toFixed(1)} kB`,
    );
  }
};

check("entry chunk", entryKb, BUDGET_KB.entry);
check("all JavaScript", totalJsKb, BUDGET_KB.totalJs);
check("CSS", totalCssKb, BUDGET_KB.css);

info(`${js.length} JS chunks, ${css.length} CSS files`);
info(`a student on a slow connection downloads the ${entryKb.toFixed(0)} kB entry chunk first`);

if (failures > 0) {
  console.log(
    C.red(
      `\n${failures} budget(s) exceeded. If the growth is intentional, raise the ` +
        `number in scripts/check-bundle-size.mjs and say why in the commit.`,
    ),
  );
  process.exit(1);
}

console.log(C.green("\nWithin budget"));
