import { withFamily } from '@/lib/backend/context';
import { ContentError, contentRead, contentWrite, itemHealth } from '@/lib/backend/repository';
import { requestJson, RequestBodyError } from '@/lib/request-json';
import { catalogueErrors, describeProblem, validateCatalogue, type CatalogueProblem } from '@/lib/catalogue/model';

/**
 * The studio's one endpoint (WP-05 §3).
 *
 * `withFamily` establishes the parent, and every branch below goes through
 * `cq_content_read` / `cq_content_write`, which check authorship in the database. That
 * check is not repeated here on purpose: a second copy of an authorisation rule is a
 * second place for it to be wrong, and the first copy people forget to update.
 *
 * Validation is the opposite case. It runs *here*, in the route, before the write —
 * because the rulebook is TypeScript (`lib/catalogue/model.ts`), the same module the
 * seed generator runs, and because `publish` must be refused with sentences an author
 * can act on rather than a constraint violation.
 */

/** Reads the studio is allowed to make, and how many rows each may return. */
const READS = new Set(['overview', 'skills', 'lessons', 'items', 'item', 'draft-catalogue', 'snapshot']);

function failure(error: unknown) {
  if (error instanceof ContentError) {
    return error.authorised
      ? Response.json({ error: error.message }, { status: 400 })
      // Deliberately the same sentence a signed-in parent with no grant would see. The
      // catalogue is global, so "you are not an author" must not double as confirmation
      // that a particular skill or item exists.
      : Response.json({ error: 'This account is not a catalogue author.', author: false }, { status: 403 });
  }
  if (error instanceof RequestBodyError) return Response.json({ error: error.message }, { status: error.status });
  return Response.json({ error: 'The studio could not reach the catalogue. Try again shortly.' }, { status: 503 });
}

async function get(request: Request) {
  const url = new URL(request.url);
  const kind = url.searchParams.get('kind') ?? 'overview';

  /*
   * Item health (WP-06) is the one read that does not come from the working set. It
   * aggregates `learning_events` across every family, because how an item behaves is a
   * property of the item rather than of one child — and it is gated on catalogue
   * authorship for exactly that reason, by the same `content.cq_is_author` check.
   */
  if (kind === 'item-health') {
    try {
      return Response.json({ data: await itemHealth({
        minWrong: Math.min(Math.max(Number(url.searchParams.get('minWrong')) || 5, 1), 100),
        limit: 120,
      }) });
    } catch (error) {
      return failure(error);
    }
  }

  if (!READS.has(kind)) return Response.json({ error: 'Unknown catalogue read.' }, { status: 400 });
  // Only the filters `cq_content_read` understands are forwarded. An unknown key would
  // be ignored by the function, which is worse than refused: an author would see a
  // filtered list that had silently not been filtered.
  const filter: Record<string, unknown> = {};
  for (const key of ['skillId', 'lessonId', 'status', 'subject', 'verb', 'search']) {
    const value = url.searchParams.get(key);
    if (value) filter[key] = value;
  }
  if (url.searchParams.get('unreviewedReasons') === 'true') filter.unreviewedReasons = true;
  try {
    const data = await contentRead(kind, {
      id: url.searchParams.get('id') ?? undefined,
      filter: Object.keys(filter).length ? filter : undefined,
      limit: Math.min(Math.max(Number(url.searchParams.get('limit')) || 60, 1), 500),
      offset: Math.max(Number(url.searchParams.get('offset')) || 0, 0),
    });
    return Response.json({ data });
  } catch (error) {
    return failure(error);
  }
}

/** Errors first, then warnings — an author reads the top of the list and stops. */
function ranked(problems: CatalogueProblem[]) {
  const order = { error: 0, warning: 1 } as const;
  return [...problems]
    .sort((a, b) => order[a.severity] - order[b.severity])
    .slice(0, 200)
    .map((problem) => ({ ...problem, sentence: describeProblem(problem) }));
}

/** What `publish` and the preflight both do: read the working set, judge it whole. */
async function preflight() {
  const draft = await contentRead<unknown>('draft-catalogue');
  const problems = validateCatalogue(draft);
  return { problems, errors: catalogueErrors(problems) };
}

const WRITES = new Set(['save-item', 'save-skill', 'save-lesson', 'set-status', 'review-reasons', 'import', 'rollback']);

async function post(request: Request) {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) {
    return Response.json({ error: 'Request not allowed.' }, { status: 403 });
  }
  try {
    // Two megabytes, because bulk import is one of the four things this surface exists
    // for. `cq_content_write` caps the same import at 2000 rows, so the byte limit is a
    // guard on the transport rather than the policy.
    const body = await requestJson(request, 2_000_000);
    const action = String(body.action ?? '');

    if (action === 'validate') {
      const { problems, errors } = await preflight();
      return Response.json({ data: { problems: ranked(problems), errorCount: errors.length, publishable: !errors.length } });
    }

    if (action === 'publish') {
      const { problems, errors } = await preflight();
      if (errors.length) {
        // 422: the request was understood and refused by the rulebook. The sentences go
        // back whole, because "publish failed" is exactly the message this package was
        // written to stop somebody receiving.
        return Response.json({
          error: `${errors.length} ${errors.length === 1 ? 'problem blocks' : 'problems block'} this publish.`,
          problems: ranked(problems), errorCount: errors.length, publishable: false,
        }, { status: 422 });
      }
      const warnings = problems.filter((problem) => problem.severity === 'warning');
      const data = await contentWrite('publish', {
        label: typeof body.label === 'string' ? body.label.slice(0, 120) : null,
        notes: typeof body.notes === 'string' ? body.notes.slice(0, 2000) : null,
        // Warnings ride with the version, so "what did we knowingly ship" is answerable
        // later without re-running a validator against content that has since changed.
        warnings: warnings.map(describeProblem),
      });
      return Response.json({ data, problems: ranked(problems), publishable: true });
    }

    if (!WRITES.has(action)) return Response.json({ error: 'Unknown catalogue action.' }, { status: 400 });
    // `action` names the branch; everything else is the branch's payload.
    const payload = Object.fromEntries(Object.entries(body).filter(([key]) => key !== 'action'));
    return Response.json({ data: await contentWrite(action, payload) });
  } catch (error) {
    return failure(error);
  }
}

export const GET = withFamily(get);
export const POST = withFamily(post);
