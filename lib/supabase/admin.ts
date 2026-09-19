import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './config';
import type { Database } from './database.types';

// Only guarded server repositories import this module. Never import it into a component.
export function createAdminClient() {
  const { url } = getSupabaseConfig();
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key?.startsWith('sb_secret_')) throw new Error('The server-only Supabase key is not configured.');
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: init?.signal
      ? AbortSignal.any([init.signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000) }) },
  });
}
