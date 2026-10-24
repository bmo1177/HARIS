/**
 * Validated access to build-time configuration.
 *
 * This used to live in the generated `src/integrations/supabase/client.ts`, which
 * called `createClient(undefined, undefined)` at module scope when the variables
 * were absent. That throws during module evaluation — before React mounts — so
 * no error boundary could catch it and the app rendered a blank page.
 * `main.tsx` now checks `missingEnv` and renders a setup screen instead.
 *
 * ## Two ways to reach the backend
 *
 * `VITE_HARIS_API_URL` points at a standalone deployment of the same handlers
 * (`server/main.ts`, documented in the README). It exists because Supabase
 * became a single point of failure: the frontend has no Supabase client and
 * only ever needed three HTTPS endpoints, so the host should be replaceable
 * without rebuilding the app around a different SDK.
 *
 * When it is set it wins, and the Supabase variables are not required. When it
 * is absent the old Supabase Edge Function URL is derived exactly as before, so
 * an existing deployment keeps working unchanged.
 */

const STANDALONE_API_URL = import.meta.env.VITE_HARIS_API_URL?.trim();
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim();
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

/** True when the app talks to the standalone backend instead of Supabase. */
export const usingStandaloneApi = Boolean(STANDALONE_API_URL);

/**
 * Names of the required-but-absent variables.
 *
 * A standalone API URL replaces the Supabase pair entirely — requiring both
 * would make the Supabase-free deployment impossible to configure.
 */
export const missingEnv: string[] = usingStandaloneApi
  ? []
  : [
    ...(SUPABASE_URL ? [] : ["VITE_SUPABASE_URL"]),
    ...(SUPABASE_PUBLISHABLE_KEY ? [] : ["VITE_SUPABASE_PUBLISHABLE_KEY"]),
  ];

export const isConfigured = missingEnv.length === 0;

/** Base URL for backend invocations, without a trailing slash. */
export const functionsBaseUrl = STANDALONE_API_URL
  ? STANDALONE_API_URL.replace(/\/+$/, "")
  : SUPABASE_URL
  ? `${SUPABASE_URL.replace(/\/+$/, "")}/functions/v1`
  : "";

/**
 * The publishable (anon) key.
 *
 * Only ever sent to our own Edge Functions. Supabase's publishable key is
 * designed to be public and the functions run with `verify_jwt = false`, so it
 * grants nothing on its own. Empty for a standalone backend, which has no
 * Supabase gateway in front of it; `api.ts` omits the header rather than
 * sending an empty one.
 */
export const supabasePublishableKey = usingStandaloneApi
  ? ""
  : SUPABASE_PUBLISHABLE_KEY ?? "";
