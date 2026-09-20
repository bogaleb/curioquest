import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig } from './config';
import type { Database } from './database.types';

export const EXPECTED_DATABASE_VERSION = '202609200003';

export async function checkConnectivity() {
  const { url, publishableKey } = getSupabaseConfig();
  // Intentionally anonymous: the probe verifies publishable-key access without family data.
  const supabase = createClient<Database>(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { fetch: (input, init) => fetch(input, {
      ...init, signal: init?.signal
        ? AbortSignal.any([init.signal, AbortSignal.timeout(8000)]) : AbortSignal.timeout(8000),
    }) },
  });
  const { data, error } = await supabase.rpc('backend_version');
  if (error) throw new Error('Supabase database check failed. Check the project URL/key and apply the version-controlled migrations.');
  if (data !== EXPECTED_DATABASE_VERSION) throw new Error('Supabase database schema does not match this application. Apply the required migrations.');
  return { status: 'connected' as const, databaseVersion: data };
}
