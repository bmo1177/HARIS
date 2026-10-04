# HARIS

**Human-Aware Risk Intelligence Shield** — cybersecurity awareness training for
high school students (K11–K12).

Teenagers meet phishing, smishing, vishing and social engineering every day,
mostly with no adult in the loop. HARIS does not lecture them about it. It makes
them work through it: paste a real message and hunt for the warning signs one
clue at a time, then make the call yourself in a scenario or on a simulated
scam call.

Live: **https://haris-two-xi.vercel.app**

---

## What it does

| Module | Route | What happens |
| --- | --- | --- |
| **Message Analyzer** | `/` | Paste any message (Arabic or English). HARIS returns a risk score, then reveals one clue at a time so the student forms their own verdict before seeing the answer — then names the attack type to guess. |
| **Scenario Simulator** | `/scenarios` | Five branching social-engineering scenarios. Every choice gets AI feedback explaining what it would have cost in the real world. |
| **Voice Lab** | `/voice-lab` | Three simulated scam calls in Arabic and English, read aloud via the Web Speech API. Flag the red flags in real time, then get a debrief on what you missed. |

XP and five levels track progress, stored locally in the browser.

---

## Stack

- **Frontend** — React 18, TypeScript (strict), Vite, Tailwind, shadcn/ui, React Router
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
| `npm run test` | Vitest unit tests |
| `npm run e2e` | Playwright end-to-end tests (starts its own dev server) |
| `npm run check:deno` | Typecheck + lint the Deno edge functions |
| `npm run test:deno` | Run the edge function tests |
| `npm run verify` | typecheck → lint → test → build |
| `npm run eval` | Evaluation harness, mock provider (no API key needed) |
| `npm run eval:live` | Real accuracy numbers. Needs `LLM_API_KEY`. See [`eval/README.md`](eval/README.md). |

---

## Architecture

```
Browser (React SPA)
  │
  │  supabase.functions.invoke — every response validated with zod
  ▼
Supabase Edge Functions  ── analyze-message   pasted message   → risk verdict
  (Deno, TypeScript)      ── scenario-feedback  a reply          → coaching
                          ── voice-debrief      a finished call  → debrief
  │
  ├── OpenAI-compatible LLM   (LLM_API_KEY / LLM_BASE_URL / LLM_MODEL)
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
- **Disclosure.** Errors return a fixed client-safe message plus a request id.
  Internal causes are logged server-side only.
- **No authentication, on purpose.** The audience is students and a sign-up wall
  in front of the lesson is the wrong trade. That means rate limiting is a cost
  control, not an identity system — stated plainly rather than glossed over.
- **Nothing is persisted.** Pasted messages are not stored or logged.
- **Measured, not asserted.** [`eval/`](eval/) holds a labelled set and a harness
  reporting false-positive rate on benign messages, recall on hostile ones, and
  robustness to prompt injection. The false-positive number is the one that
  matters: a tool that flags ordinary messages teaches students to ignore it.

---

## Contributing

Issues and pull requests are welcome. Please run `npm run verify` before
opening a PR; CI runs the same checks plus the Deno and Playwright suites.

If you touch the edge functions, also run:

```bash
npm run check:deno && npm run test:deno
```

---

## License

[MIT](LICENSE)
