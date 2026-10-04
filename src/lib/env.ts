/**
 * Validated access to build-time configuration.
 *
 * This used to live in the generated `src/integrations/supabase/client.ts`, which
 * called `createClient(undefined, undefined)` at module scope when the variables
 * were absent. That throws during module evaluation — before React mounts — so
 * no error boundary could catch it and the app rendered a blank page.
 * `main.tsx` now checks `missingEnv` and renders a setup screen instead.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim();
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

/** Names of the required-but-absent variables. */
export const missingEnv: string[] = [
  ...(SUPABASE_URL ? [] : ['VITE_SUPABASE_URL']),
  ...(SUPABASE_PUBLISHABLE_KEY ? [] : ['VITE_SUPABASE_PUBLISHABLE_KEY']),
];

export const isConfigured = missingEnv.length === 0;

/** Base URL for Edge Function invocations, without a trailing slash. */
export const functionsBaseUrl = SUPABASE_URL
  ? `${SUPABASE_URL.replace(/\/+$/, "")}/functions/v1`
  : "";

/**
 * The publishable (anon) key.
 *
 * Only ever sent to our own Edge Functions. Supabase's publishable key is
 * designed to be public and the functions run with `verify_jwt = false`, so it
 * grants nothing on its own.
 */
export const supabasePublishableKey = SUPABASE_PUBLISHABLE_KEY ?? "";
