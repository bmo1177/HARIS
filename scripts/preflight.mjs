#!/usr/bin/env node
/**
 * Pre-flight check.
 *
 * Every "did that work?" question this project accumulates, answered in one
 * command, because the failure modes are quiet:
 *
 *   - a missing VITE_ variable white-screens the app with no console error
 *   - a secret key in `dist/` looks like a working build right up until it leaks
 *   - a missing SPA rewrite 404s every deep link while in-app nav looks fine
 *   - a missing migration makes the rate limiter fail closed, so every AI call
 *     returns `rate_limited` and reads as a quota problem
 *   - a deploy that flipped verify_jwt on 401s at the gateway and reads as CORS
 *
 * Run before pushing and after deploying:
 *
 *   node scripts/preflight.mjs            # local checks only
 *   node scripts/preflight.mjs --live     # also probe the deployed functions
 *
 * Exit code is 0 when everything passed, 1 otherwise.
 */

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { promises as dnsPromises } from "node:dns";
import { join } from "node:path";

const LIVE = process.argv.includes("--live");

let failures = 0;
let warnings = 0;
/** True once the live probe has actually established something. */
let liveProbed = false;

const C = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

const pass = (m) => console.log(`  ${C.green("ok")}   ${m}`);
const fail = (m) => { failures++; console.log(`  ${C.red("FAIL")} ${m}`); };
const warn = (m) => { warnings++; console.log(`  ${C.yellow("warn")} ${m}`); };
const info = (m) => console.log(`  ${C.dim("·")}    ${m}`);

// ---------------------------------------------------------------- environment

console.log(C.bold("\nEnvironment"));
const envPath = ".env";

if (!existsSync(envPath)) {
  fail(`.env is missing — the app renders a blank setup screen without it`);
  info(`fix: cp .env.example .env`);
} else {
  const env = Object.fromEntries(
    readFileSync(envPath, "utf8")
      .split("\n")
      .filter((l) => l.trim() && !l.trim().startsWith("#") && l.includes("="))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      }),
  );

  for (const key of ["VITE_SUPABASE_URL", "VITE_SUPABASE_PUBLISHABLE_KEY"]) {
    env[key] ? pass(`${key} is set`) : fail(`${key} is not set`);
  }

  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
  if (key) {
    if (key.startsWith("sb_publishable_")) {
      pass("publishable key uses the current sb_publishable_ format");
    } else if (key.startsWith("eyJ")) {
      warn("publishable key is a legacy JWT (eyJ…) — works, but deprecated by end of 2026");
      info("fix: replace with the sb_publishable_… key from Settings -> API Keys");
    } else {
      fail("publishable key is neither sb_publishable_… nor a legacy eyJ… JWT");
    }

    // A secret key here would be a real problem: it bypasses RLS.
    if (key.startsWith("sb_secret_")) {
      fail("this is a SECRET key in the client env — it bypasses RLS. Move it to edge function secrets.");
    }
  }

  const url = env.VITE_SUPABASE_URL ?? "";
  const ref = /^https:\/\/([a-z]{20})\.supabase\.co$/.exec(url)?.[1];
  if (ref) {
    pass(`project ref: ${ref}`);
    if (env.VITE_SUPABASE_PROJECT_ID && env.VITE_SUPABASE_PROJECT_ID !== ref) {
      fail(`VITE_SUPABASE_PROJECT_ID (${env.VITE_SUPABASE_PROJECT_ID}) does not match the URL ref (${ref})`);
    }
  } else if (url) {
    warn(`VITE_SUPABASE_URL is not the expected https://<ref>.supabase.co shape: ${url}`);
  }
}

// ---------------------------------------------------------------------- build

console.log(C.bold("\nBuild artifacts"));
const dist = "dist";

if (!existsSync(dist)) {
  fail("dist/ is missing — run `npm run build`");
} else {
  const files = readdirSync(join(dist, "assets")).map((f) => join(dist, "assets", f));
  const size = (suffix) =>
    files.filter((f) => f.endsWith(suffix)).reduce((sum, f) => sum + statSync(f).size, 0);

  const js = size(".js");
  const css = size(".css");
  const fonts = size(".woff2");

  if (js === 0) fail("no JavaScript in dist/assets");
  else {
    pass(`JS ${(js / 1024).toFixed(0)} kB`);
    if (js > 600 * 1024) warn("initial JS over 600 kB — check for a dependency that crept back in");
  }
  if (css === 0) fail("no CSS in dist/assets");
  else pass(`CSS ${(css / 1024).toFixed(0)} kB`);

  if (fonts > 0) pass(`fonts ${(fonts / 1024).toFixed(0)} kB self-hosted (no third-party request)`);

  // The check that matters most.
  const secretHit = files
    .filter((f) => !f.endsWith(".woff2"))
    .find((f) => readFileSync(f, "utf8").includes("sb_secret_"));
  if (secretHit) {
    fail(`sb_secret_ found in ${secretHit} — treat as compromised and rotate immediately`);
  } else {
    pass("no sb_secret_ in the bundle");

    const publishable = files.some((f) => readFileSync(f, "utf8").includes("sb_publishable_"));
    publishable
      ? pass("publishable key present (expected — it is designed to ship)")
      : info("no publishable key in the bundle; fine if the app is not built yet");
  }

  if (existsSync(join(dist, "favicon.ico"))) pass("favicon present");
  if (existsSync(join(dist, "site.webmanifest"))) pass("web manifest present");
}

// ----------------------------------------------------------------- deployment

console.log(C.bold("\nDeployment config"));
if (existsSync("vercel.json")) {
  const v = JSON.parse(readFileSync("vercel.json", "utf8"));
  const rewrites = v.rewrites ?? [];
  const spa = rewrites.some((r) => r.destination === "/index.html");
  spa
    ? pass("SPA rewrite present — deep links will not 404")
    : fail("vercel.json has no rewrite to /index.html — every deep link 404s");
} else {
  fail("vercel.json missing — deep links 404 on refresh and on shared URLs");
}

if (existsSync("supabase/migrations")) {
  const migrations = readdirSync("supabase/migrations").filter((f) => f.endsWith(".sql"));
  migrations.length > 0
    ? pass(`${migrations.length} migration(s): ${migrations.join(", ")}`)
    : warn("no migrations found — the rate limiter will fail closed");
} else {
  fail("supabase/migrations missing");
}

// ---------------------------------------------------------------------- live

if (!LIVE) {
  console.log(C.bold("\nLive probe"));
  info("skipped (pass --live to probe the deployed functions)");
} else {
  console.log(C.bold("\nLive probe"));

  const env = Object.fromEntries(
    existsSync(".env")
      ? readFileSync(".env", "utf8")
          .split("\n")
          .filter((l) => l.trim() && !l.startsWith("#") && l.includes("="))
          .map((l) => {
            const i = l.indexOf("=");
            return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
          })
      : [],
  );

  const base = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!base || !key) {
    fail("cannot probe: VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY missing");
  } else {
    try {
      // Distinguishes "wrong project ref" from "no network here", which are
      // very different problems and look identical if you only report fetch failed.
      // Two bugs lived here, both of which reported the same innocent-looking
      // "host does not resolve" and so read as a network problem:
      //   1. `require("node:dns")` inline, which is not defined in an ES module.
      //   2. `let dns = null` shadowing the imported `dns`, so `dns.lookupSync`
      //      was `null.lookupSync` and threw a TypeError.
      // Both were swallowed by the catch. Verified by pointing the URL at a host
      // known to resolve and confirming it is now found.
      const host = base.replace("https://", "").split("/")[0];
      let address = null;
      try {
        address = (await dnsPromises.lookup(host)).address;
      } catch {
        address = null;
      }

      if (!address) {
        // Deliberately inconclusive. Exit 0 here, because a fork on CI or a
        // sandbox without egress would otherwise always fail — but the summary
        // below says so, rather than letting "passed" imply the deploy is fine.
        warn(`${new URL(base).host} does not resolve from here — live check INCONCLUSIVE`);
        info("if this is your machine, the project may be paused — reactivate it in the dashboard");
        info("if this is CI or a sandbox, it is likely an egress restriction, not a project fault");
      } else {
        info(`resolved ${new URL(base).host} -> ${address}`);
        liveProbed = true;

        const res = await fetch(`${base.replace(/\/+$/, "")}/functions/v1/analyze-message`, {
          method: "POST",
          headers: { "Content-Type": "application/json", apikey: key },
          body: JSON.stringify({ message: "Free prize! Claim now: example.com" }),
          signal: AbortSignal.timeout(25_000),
        });

        const text = await res.text();

        if (res.ok) {
          let verdict = null;
          try {
            verdict = JSON.parse(text);
          } catch {}
          if (verdict && typeof verdict.risk_score === "number") {
            pass(`function live — verdict ${verdict.risk_score}% / ${verdict.risk_level}`);
          } else {
            warn(`function returned 200 but the body is not a verdict: ${text.slice(0, 120)}`);
          }
        } else if (res.status === 401 || res.status === 403) {
          fail(`${res.status} from the gateway — the publishable key is not accepted`);
          info("check the key format, and that verify_jwt was disabled at deploy (--no-verify-jwt)");
        } else if (text.includes("rate_limited")) {
          fail("rate_limited — the rate-limit migration has not been pushed");
          info("fix: supabase db push");
        } else if (text.includes("service_unavailable")) {
          fail("service_unavailable — a function secret is missing or unconfigured");
          info("fix: supabase secrets set --env-file supabase/functions/.env.local");
        } else {
          fail(`${res.status} from the function: ${text.slice(0, 160)}`);
          if (res.status === 404) info("the function is probably not deployed yet");
        }
      }
    } catch (error) {
      fail(`probe failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

// --------------------------------------------------------------------- verdict

console.log();
if (failures === 0) {
  const note = warnings ? C.dim(`  (${warnings} warning${warnings === 1 ? "" : "s"})`) : "";
  if (LIVE && !liveProbed) {
    console.log(C.yellow(`${C.bold("Pre-flight passed, but the live check was inconclusive")}`) + note);
    console.log(C.dim("  The local checks are green. The deployed functions were not reached, so this says"));
    console.log(C.dim("  nothing about whether the backend is actually live."));
    process.exit(0);
  }
  console.log(C.green(`${C.bold("Pre-flight passed")}`) + note);
  process.exit(0);
} else {
  console.log(C.red(`${C.bold(`${failures} check${failures === 1 ? "" : "s"} failed`)}`) + C.dim(`  (${warnings} warning${warnings === 1 ? "" : "s"})`));
  process.exit(1);
}