export class SupabaseConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseConfigurationError';
  }
}

export function getSupabaseConfig() {
  // Literal property access is required for Next.js/Vinext browser substitution.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (!url || !publishableKey) {
    throw new SupabaseConfigurationError(
      'Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local or the deployment environment.',
    );
  }
  let parsed: URL;
  try { parsed = new URL(url); } catch {
    throw new SupabaseConfigurationError('NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase project URL.');
  }
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(parsed.hostname);
  if ((parsed.protocol !== 'https:' && !(local && parsed.protocol === 'http:')) ||
      parsed.username || parsed.password || parsed.search || parsed.hash || parsed.pathname !== '/') {
    throw new SupabaseConfigurationError('Use the HTTPS project origin (HTTP is allowed only for local Supabase).');
  }
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(publishableKey)) {
    throw new SupabaseConfigurationError('Use a Supabase publishable key beginning sb_publishable_. Secret and service-role keys are not allowed.');
  }
  return { url: parsed.origin, publishableKey };
}
