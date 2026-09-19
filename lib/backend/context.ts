import 'server-only';
import { AsyncLocalStorage } from 'node:async_hooks';
import { createClient } from '@/lib/supabase/server';

export const familyContext = new AsyncLocalStorage<{ parentId: string }>();
export function parentId() {
  const context = familyContext.getStore();
  if (!context) throw new Error('An authenticated family context is required.');
  return context.parentId;
}
export async function authenticatedParent() {
  const client = await createClient();
  const { data, error } = await client.auth.getUser();
  return !error && data.user?.email_confirmed_at ? data.user.id : null;
}
export function withFamily(handler: (request: Request) => Promise<Response>) {
  return async (request: Request) => {
    try {
      const id = await authenticatedParent();
      if (!id) return Response.json({ error: 'Sign in to your parent account.', signIn: true }, { status: 401, headers: {'Cache-Control':'no-store'} });
      const response = await familyContext.run({ parentId: id }, () => handler(request));
      response.headers.set('Cache-Control', 'private, no-store');
      return response;
    } catch {
      return Response.json({ error: 'Your family workspace is temporarily unavailable. Please try again.' },
        { status: 503, headers: { 'Cache-Control': 'no-store' } });
    }
  };
}
