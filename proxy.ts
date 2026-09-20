import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';
import { SupabaseConfigurationError } from '@/lib/supabase/config';

export async function proxy(request: NextRequest) {
  try {
    return await updateSession(request);
  } catch (error) {
    return NextResponse.json({ error: error instanceof SupabaseConfigurationError
      ? 'Parent accounts are not configured yet.' : 'Parent accounts are temporarily unavailable. Please try again.' },
    { status: 503, headers: { 'Cache-Control': 'no-store' } });
  }
}

// Every route that reads a parent session refreshes it here. Expand as routes are added.
export const config = { matcher: ['/', '/auth/:path*', '/account/:path*', '/api/quest', '/api/parent/:path*', '/api/reading', '/api/experience', '/api/stories', '/api/workspace', '/api/media'] };
