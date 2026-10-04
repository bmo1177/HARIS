import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

/**
 * Import the supabase client like this:
 * import { supabase } from "@/integrations/supabase/client";
 *
 * `supabase` is `null` when the required environment variables are missing. See
 * `missingSupabaseEnv` below and the setup screen in `main.tsx`.
 */

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

/**
 * Names of the required-but-absent variables.
 *
 * This module used to call `createClient(undefined, undefined)` at import time,
 * which throws `supabaseUrl is required` *during module evaluation* — before
 * React has mounted, so no error boundary can catch it and the app renders a
 * completely blank page with no explanation. Since `.env` is gitignored, that
 * was the first thing anyone cloning the repo would hit.
 */
export const missingSupabaseEnv: string[] = [
  ...(SUPABASE_URL ? [] : ['VITE_SUPABASE_URL']),
  ...(SUPABASE_PUBLISHABLE_KEY ? [] : ['VITE_SUPABASE_PUBLISHABLE_KEY']),
];

export const supabase =
  missingSupabaseEnv.length > 0
    ? null
    : createClient<Database>(SUPABASE_URL as string, SUPABASE_PUBLISHABLE_KEY as string, {
        auth: {
          storage: localStorage,
          persistSession: true,
          autoRefreshToken: true,
        },
      });
