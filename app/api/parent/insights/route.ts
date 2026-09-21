import { withFamily } from '@/lib/backend/context';
import { retention } from '@/lib/backend/repository';
import { familyAuthorized } from '@/lib/parent-security';

/**
 * What stayed learnt (blueprint §WP-06.3).
 *
 * Separate from `/api/parent` because it answers a different question with a different
 * cost: the gate status is read on every parent page load, and folding a family's whole
 * event history to answer it would make the cheap call expensive. A parent opens the
 * retention panel deliberately, and this endpoint is what that costs.
 *
 * Scoped to one child by default. A family average across a five-year-old and an
 * eight-year-old is a number about neither of them.
 */
async function get(request: Request) {
  if (!(await familyAuthorized(request))) {
    return Response.json({ error: "Sign in with this family's account to see learning records." }, { status: 403 });
  }
  const url = new URL(request.url);
  const child = url.searchParams.get('profile') ?? undefined;
  // 14 days is the §WP-06 window. The others are offered because "still there after a
  // month" is the claim a parent actually cares about, and the query costs the same.
  const days = [7, 14, 30].includes(Number(url.searchParams.get('days'))) ? Number(url.searchParams.get('days')) : 14;
  try {
    return Response.json({ retention: await retention(child, days) }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return Response.json({ error: 'Learning records could not be read just now. Try again shortly.' }, { status: 503 });
  }
}

export const GET = withFamily(get);
