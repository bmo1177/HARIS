# HARIS

**Human-Aware Risk Intelligence Shield** — cybersecurity awareness training for
master's students in security.

A lecture can explain what phishing is. It cannot train the part that decides
the outcome: reading a live message under time pressure and deciding whether to
trust it. HARIS trains that. Paste a message and get a verdict with its evidence
attached, then make the call yourself in a scenario or on a simulated scam call.

Live: **https://haris-two-xi.vercel.app**

---

## What it does

| Module | Route | What happens |
| --- | --- | --- |
| **Message Analyzer** | `/` | Paste any message (Arabic or English). HARIS returns a band verdict, then reveals the evidence one clue at a time and asks the student to name the attack — with the message they are judging still on screen. |
| **Scenario Simulator** | `/scenarios` | Five branching social-engineering scenarios. Every choice gets AI feedback explaining what it would have cost in the real world. |
| **Voice Lab** | `/voice-lab` | Three simulated scam calls in Arabic and English, read aloud via the Web Speech API. Flag the red flags in real time, then get a debrief on what you missed. |

**Available in English and Arabic**, with the whole interface flipping to RTL —
including the explanations, attack names and red-flag reasons the model returns,
which were previously generated on every request and thrown away.

The exercise content is bilingual too, which it was not for a long time: the
analyzer's clues, the scenario attacker messages and choices, and the voice
call's red-flag reasons all have Arabic versions, and the model is sent
whichever language the student is reading in so its coaching is about the text
they actually saw.

Failures are localized too. The edge functions return a stable error code and a
fixed client-safe sentence; the client renders the code in the active language
instead of echoing the server's English copy, so an Arabic student never gets an
English error above an Arabic screen. The same applies to the screen-reader
announcement on the analysis wait screen, which is a separate localized string
rather than a hardcoded one.

XP and five levels track progress, stored locally in the browser.

---

## Stack

- **Frontend** — React 18, TypeScript (strict), Vite, Tailwind, shadcn/ui, React Router 7
- **Backend** — Supabase Edge Functions (Deno) with Postgres for rate limiting
- **AI** — any OpenAI-compatible provider (OpenRouter by default)
- **Testing** — Vitest, Playwright, Deno test

16 runtime dependencies. The browser talks to the Edge Functions over `fetch`;
`@supabase/supabase-js` is deliberately not a dependency, because the app has no
accounts, database or realtime subscriptions and the client was ~60% of the
bundle for one `functions.invoke` call. See
[`src/lib/api.ts`](src/lib/api.ts).

---

## Quick start

```bash
git clone https://github.com/bmo1177/HARIS.git
cd HARIS
npm install
cp .env.example .env      # then fill in the two VITE_ variables
npm run dev
```

You need a Supabase project. Fill in `.env` with the **publishable** key from
*Project Settings → API*:

```
VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
```

If these are missing the app will tell you exactly which ones and how to fix it,
rather than rendering a blank page.

The production build needs the same two variables. Vercel does not read `.env`
(which is gitignored), so set them in the Vercel dashboard under
*Project → Settings → Environment Variables* for the Production environment,
then redeploy. Without them the live site builds fine, deploys fine — and
renders nothing but the setup screen. That is exactly what happened once;
the `sb_publishable_` key is designed to ship in the browser bundle, so
putting it in Vercel env is safe.

The AI-backed features also need the backend deployed — see
[`supabase/README.md`](supabase/README.md) for the full walkthrough, including
how to point at a different model provider.

---

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Dev server on `:8080` |
| `npm run build` | Typecheck, then build to `dist/` |
| `npm run typecheck` | `tsc -b --noEmit` across app, node and e2e projects |
| `npm run lint` | ESLint over app, config and edge functions |
| `npm run test` | Vitest unit tests, with coverage thresholds enforced |
| `npm run e2e` | Playwright end-to-end tests (starts its own dev server) |
| `npm run check:deno` | Typecheck + lint the Deno edge functions |
| `npm run test:deno` | Run the edge function tests |
| `npm run size` | Bundle size budget against the built `dist/` |
| `npm run eval` | Evaluation harness, mock provider (no API key needed) |
| `npm run eval:live` | Real accuracy numbers. Needs `LLM_API_KEY`. See [`eval/README.md`](eval/README.md). |
| `npm run verify` | typecheck → lint → test → eval → build → size |

---

## Design

The visual system is an **instrument**, not a consumer security app — see
[`PRODUCT.md`](PRODUCT.md) for the reasoning and the audience it is tuned for.

- **Dark-first, both themes first-class.** Near-black blue surfaces, a single
  cyan accent, and hairline borders instead of floating shadows.
- **Colour means status, never decoration.** Green / amber / red only ever mean
  safe / suspicious / dangerous. Every value was solved numerically against the
  surface it sits on, the status pairs used as text clear 4.5:1 in both themes,
  and a result-wide axe scan in both palettes keeps that true.
- **IBM Plex across Latin, Arabic and mono**, self-hosted via `@fontsource`.
  One superfamily is what makes the bilingual case work — Plex Sans Arabic is
  designed to sit beside Plex Sans rather than being an unrelated face. No
  third-party font request, which matters for both campus networks and privacy.
  Only 2 files load for an English visitor; Arabic weights load on demand.
- **Monospace means data** — measurements, counts, scores, identifiers. Never as
  decoration. That line is the difference between an instrument and a hacker
  aesthetic.
- **A verdict is a band, not a measurement.** The model answers with one of
  three outcomes and the server derives a representative score from it, so a
  percentage gauge would claim a precision the system does not have. The result
  states the band in words, draws the three bands at their true widths
  (25 / 40 / 35) and marks only the current one — no count-up, no segment that
  implies a value it cannot produce.
- **The result is an evidence workspace, not a score card.** The exact message
  being judged never leaves the screen: it is pinned beside the evidence on
  desktop and sits above it on mobile. Clues arrive one at a time, then the
  attack-type guess, the explanation and the next steps. The previous version
  unmounted the form — and the message with it — so a student was asked to match
  three clues against text they had to remember.
- **The reading language is a real control.** A per-result EN / AR switch
  re-renders the clues, the attack name and the explanation. The quoted message
  stays verbatim in whatever language it arrived in.
- **Difficulty is rank, not risk.** Three neutral bars and a word. Green / amber
  / red stay reserved for the verdict, and nothing depends on colour alone.
- **Accessibility is part of the instrument.** One `h1` per route, a skip link,
  44px navigation targets, focus moved to the verdict when the form is replaced,
  and the result screen itself scanned by axe in both languages and both
  palettes. Async regions use `role="status"` with `aria-live`; the visible
  elapsed timer is `aria-hidden` and paired with a localized screen-reader
  announcement; the nav row fits at 320px in both languages. These properties
  are pinned by unit and E2E tests rather than left to review.

## Architecture

```
Browser (React SPA)
  │
  │  fetch + `apikey` header — every response validated with zod
  ▼
Supabase Edge Functions  ── analyze-message   pasted message   → risk verdict
  (Deno, TypeScript)      ── scenario-feedback  a reply          → coaching
                          ── voice-debrief      a finished call  → debrief
  │
  ├── OpenAI-compatible LLM   (LLM_API_KEY / LLM_BASE_URL / LLM_MODEL)
  │                            tried in order, with LLM_FALLBACK_MODELS
  └── Postgres                rate limit counters  (service role, RLS-locked)
```

Shared edge-function code lives in `supabase/functions/_shared/`:

| Module | Responsibility |
| --- | --- |
| `env.ts` | Validated environment access. A missing variable fails loudly on the server and never reaches a client. |
| `http.ts` | Body limits, JSON helpers, safe error envelope with request ids. |
| `cors.ts` | Origin allowlist. |
| `llm.ts` | Structured-output client with timeouts, token caps and one retry. |
| `prompt.ts` | Nonce fencing for untrusted content. |
| `rateLimit.ts` | Per-client fixed-window quotas, minute and daily. |
| `schemas.ts` | Request schemas with length caps and cross-field validation. |
| `analysis.ts` | The message analysis itself — prompt, output schema, verification. Imported by both the HTTP handler and the eval harness, so what gets measured is what gets served. |

---

## Testing

Four layers, each guarding a failure mode the others cannot see:

| Layer | Command | What it pins |
| --- | --- | --- |
| **Unit** (Vitest) | `npm run test` | XP and level arithmetic, the sandbox engine, the analysis wait timer, and the locale dictionaries. The locale suite also scans JSX for hardcoded English prose — including text that follows a JSX expression, which is how a screen-reader-only string once stayed English. Coverage thresholds run with the suite and fail the build if coverage drops. |
| **End-to-end** (Playwright) | `npm run e2e` | `smoke.spec.ts` covers routing, theming, RTL, XP persistence and the AI flows with intercepted responses. `router.spec.ts` covers active nav state, browser history and SPA transitions. `console.spec.ts` fails on any console error or warning, including React Router deprecations. `i18n.spec.ts` checks that the exercise content — clues, scenario steps, sandbox copy — is actually Arabic in Arabic mode. |
| **Edge functions** (Deno) | `npm run test:deno` | Request validation, rate limiting, prompt fencing and the analysis reconciliation. |
| **Evaluation** (Deno) | `npm run eval` | The harness itself: dataset parsing, metric arithmetic and the injection gate. `npm run eval:live` produces real accuracy numbers; see [`eval/README.md`](eval/README.md). |
| **Accessibility** (axe) | `npm run e2e` | `accessibility.spec.ts` scans every route in both languages, plus the analysis result in both palettes, and fails on serious or critical violations. |
| **Bundle size** | `npm run size` | The gzipped entry chunk, total JavaScript and CSS against a budget. The audience is a master's student on a laptop and a phone, so the payload is a product decision, not an accident. |

AI calls made by the suite are intercepted with `page.route`, so it runs
offline and never spends API credit.

Playwright's bundled Chromium needs system libraries that some distributions
(NixOS, for example) do not provide. Point it at an installed browser instead:

```bash
CHROME_PATH=/run/current-system/sw/bin/google-chrome npm run e2e
```

---

## Security

HARIS is a security tool, so its own posture is documented rather than implied.
The full threat model — what is defended, what is deliberately *not*, and why —
is in [`supabase/README.md`](supabase/README.md). In short:

- **Prompt injection.** The verdict is the product, so a user must not be able to
  dictate it. `risk_level` and `is_threat` are derived server-side from a single
  score rather than model-authored; untrusted text is fenced with a per-request
  nonce it cannot forge; and every model response is re-validated before it
  reaches a user.
- **Cost exhaustion.** The functions are public and billable. Per-client rate
  limits (minute + daily), request body caps, per-field length caps and
  `LLM_MAX_TOKENS` bound what one request can cost.
- **Disclosure.** Errors return a fixed client-safe message, a stable code and a
  request id. Internal causes are logged server-side only. The client renders the
  code in the reader's language rather than echoing the English sentence, so the
  error copy follows the interface.
- **No authentication, on purpose.** The audience is students and a sign-up wall
  in front of the lesson is the wrong trade. That means rate limiting is a cost
  control, not an identity system — stated plainly rather than glossed over.
- **Nothing is persisted.** Pasted messages are not stored or logged.
- **A model is a dependency, so it fails over.** The backend tries
  `LLM_MODEL` and then each model in `LLM_FALLBACK_MODELS`, skipping any that
  is unavailable to the account, rejects the strict schema, times out, or
  answers with something that is not JSON. A rejected credential is *not*
  retried on another model — the key is the problem — and the whole list shares
  one time budget, so a slow model cannot make the fallback impossible. The
  ranking of models is measured, not assumed; see
  [`supabase/README.md`](supabase/README.md).
- **Measured, not asserted.** [`eval/`](eval/) holds a labelled set and a harness
  reporting false-positive rate on benign messages, recall on hostile ones, and
  robustness to prompt injection. The false-positive number is the one that
  matters: a tool that flags ordinary messages teaches students to ignore it.

---

## Known gaps

Written down rather than implied, because a tool that hides its limits is not
trustworthy about the parts it claims work.

- **An Arabic translation is best-effort, and always falls back to English.** The
  model's Arabic fields can come back empty, and the functions and the client
  are deployed separately, so a client can briefly be newer than the functions
  that produce them. When that happens the English text is shown rather than a
  blank card — an English clue is useful, an empty one is not.
- **The analyzer's example messages are English only.** They are samples of
  incoming phishing, which is what a student will actually receive, so the
  *content* is intentionally English even in Arabic mode. The chip labels around
  them are translated.
- **The scenario dataset still carries school-age framing.** The About page, the
  analyzer examples and the school IT call were retargeted to a master's
  audience; two of the five scenarios (a games-console giveaway and a V-Bucks
  download) have not been rewritten yet. The mechanics are sound — the copy is
  the work that remains.
- **E2E does not exercise a deployed backend.** Every edge-function call is
  mocked, so the suite proves the UI contract, not the model or the database.
  `npm run preflight:live` and `npm run eval:live` cover that, and need
  credentials.
- **Accuracy numbers are not in CI unless `LLM_API_KEY` is configured.** The mock
  run verifies the harness, not the model.

---

## Pre-flight

The failure modes in this project are quiet, so they are checked explicitly:

```bash
npm run preflight          # before pushing
npm run preflight:live     # after deploying the functions
```

It verifies `.env` exists and holds a **publishable** key in the current
`sb_publishable_` format, that no `sb_secret_` string reached the bundle, that
`vercel.json` carries the SPA rewrite, that migrations exist, and — with
`--live` — that a deployed function returns a real verdict.

The live probe distinguishes its failure modes rather than reporting "fetch
failed" for all of them: a rejected key, a missing migration (`rate_limited`,
because the limiter fails closed by design), an unconfigured secret
(`service_unavailable`), and DNS that does not resolve. Each prints the command
that fixes it.

If DNS fails it reports the live check as **inconclusive** rather than passing,
so a green run never implies more than it checked.

## When the AI features stop working

The backend is a separate deployment with its own secrets, so it fails on its
own schedule: a free-tier project pauses after a week of inactivity, a secret
is never set, a key is blanked. Each failure looks like "the app is broken"
from the browser, and the browser cannot tell you which one it is.

`npm run preflight:live` answers it, and each of these has its own fix:

| What you see | What it means | Fix |
| --- | --- | --- |
| `LLM_API_KEY is present but EMPTY` | The key was blanked in `.env`. Every AI call returns `service_unavailable`. | Put the key in `.env`, then `supabase secrets set LLM_API_KEY=…` |
| `LLM_API_KEY is not set` | Same fault, from a template. | As above |
| `…supabase.co does not exist — the project is paused or deleted` | The project host stopped resolving. The functions and the database are both gone, so the key is beside the point until the project is back. | Reactivate the project in the Supabase dashboard |
| `service_unavailable` from the live probe | The functions are running but a secret is missing. | `supabase secrets set --env-file supabase/functions/.env.local` |
| `the AI provider rejected our key (401/403)` | The functions reached the provider and it refused the key — wrong, expired, or for another account. | `supabase secrets list`, then `supabase secrets set LLM_API_KEY=…` |
| `rate_limited` from the live probe | The rate-limit migration is missing. | `supabase db push` |
| `401` / `403` from the gateway | The publishable key is not accepted, or `verify_jwt` is on. | Redeploy with `--no-verify-jwt` |

A **paused** Supabase project stops resolving entirely — the host is removed
from the edge — so it looks exactly like a network problem. The preflight
checks a control host to tell the two apart: if DNS works and the project host
does not exist, the project is the problem.

To check the provider itself, separately from the deployment:

```bash
LLM_API_KEY=… LLM_BASE_URL=… LLM_MODEL=… npm run probe:provider
```

It reads the app's real analysis schema out of the edge function source, so it
cannot drift from what the app sends, and it refuses to report success when it
measured nothing.

## Contributing

Issues and pull requests are welcome. Please run `npm run verify` before
opening a PR; CI runs the same checks plus the Deno and Playwright suites.

CI runs with least-privilege `contents: read` permissions and per-job timeouts.
Every step only reads the repository; artifact upload does not use the workflow
token, so no write scope is granted.

Three of the gates are thresholds rather than tests, and all three are
ratcheted: they fail when a number *drops*, and are raised in the same commit
that improves them.

| Gate | What it protects |
| --- | --- |
| Unit coverage | A file added without tests, or a branch quietly rewritten. `src/lib/**` — where the logic lives — is held to a much higher bar than the UI, which Playwright covers instead. |
| Bundle size | A dependency that pulls in more than it gives. The budgets are in [`scripts/check-bundle-size.mjs`](scripts/check-bundle-size.mjs) and raising one is allowed; raising it silently is not. |
| Accessibility | The mechanical faults a review misses: an unlabelled control, a name that omits visible text, a heading that is not a heading. |

If you touch the edge functions, also run:

```bash
npm run check:deno && npm run test:deno
```

---

## License

[MIT](LICENSE)
