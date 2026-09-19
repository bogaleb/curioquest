import { checkConnectivity } from '@/lib/supabase/connectivity';
import { SupabaseConfigurationError } from '@/lib/supabase/config';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    return Response.json(await checkConnectivity(), { headers: { 'Cache-Control': 'no-store' } });
  } catch (error) {
    const configured = !(error instanceof SupabaseConfigurationError);
    return Response.json({ status: configured ? 'unavailable' : 'not_configured', error: configured
      ? 'Supabase is unavailable or its database migrations are missing.'
      : 'Supabase project configuration is missing or invalid.' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}
