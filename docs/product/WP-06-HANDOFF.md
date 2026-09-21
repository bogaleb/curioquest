# WP-06 — mastery from events: operator notes

What the package does is in `RELEASE_STATUS.md`. This is the part somebody has to run.

## The SQL to run

One migration, in the Supabase SQL editor. It is idempotent — every routine is
`create or replace`, and re-running it changes nothing.

1. `supabase/migrations/20260921000100_mastery_and_insights.sql`

It adds three routines and no tables:

| Routine | Who may call it | What it does |
| --- | --- | --- |
| `public.cq_family_events` | `service_role` | Every child's events in one round trip, so projecting on read is one query rather than one per child. |
| `public.cq_mastery_cache` | `service_role` | Writes a rebuilt projection into the blob. Deliberately does **not** bump `revision` — a cache refresh may never fail a family's save. |
| `public.cq_insights` | `service_role` | `item-health` (gated on catalogue authorship, aggregates across families) and `retention` (gated on the parent, scoped to their children). |

**It is verified.** `npm run supabase:verify` applies all eleven migrations to a throwaway
`postgres:17` container and then *executes* every routine branch — because `create
function` proves almost nothing for plpgsql: the SQL inside a body is parsed when that
body first runs, not when it is created. Three real faults were found this way that
reading had missed and that `create function` accepted without complaint: `rows` and
`row` used as column aliases where both are Postgres keywords, and a `days` variable
shadowing `make_interval`'s parameter.

The container is disposable, and nothing in that command touches Supabase or any local
database. It skips cleanly when Docker is not running.

```
npm run supabase:verify
```

The fixtures live in `supabase/verify/`: a minimal Supabase-shaped shim, a seeded family,
and `02-exercise.sql`, which runs every branch and prints `BUG` on any that misbehaves.
**A new branch in a routine belongs in that file the same day**, or the guard quietly
stops covering it.

## Smoke test against the real database

`supabase:verify` proves the SQL runs. These three confirm it landed in *your* project.

```sql
-- 1. Every child's events come back grouped by child. '{}' is fine on a young account.
select jsonb_object_keys(public.cq_family_events(
  (select id from public.parents limit 1), 100));

-- 2. Retention executes and returns its full shape.
select public.cq_insights(
  (select id from public.parents limit 1), 'retention', null, 14, 5, 100);

-- 3. Item health. Raises 'Not a catalogue author' until you have granted yourself
--    authorship (see WP-05-HANDOFF.md) — that refusal is the function working.
select public.cq_insights(
  (select id from public.parents limit 1), 'item-health', null, 14, 5, 20);
```

If any of the three raises an error here after `supabase:verify` passed, the difference
is something production has that the shim does not — worth knowing, and worth adding to
`supabase/verify/00-supabase-shim.sql` so the guard catches it next time.

## Then check the projection against the cache

```
npm run mastery:report      # compare only, writes nothing
npm run mastery:rebuild     # compare, then refresh the cache from the stream
```

`mastery:report` is the acceptance criterion for this package made runnable: if a rebuild
reproduces the cache, the blob really is derived data. Where it does not, the difference
is printed per skill rather than silently overwritten.

Expect some skills to be reported as *in the cache, but no event explains it*. That is
not a fault. The event stream began at WP-01, and anything a child practised before then
exists only in the blob. Those skills are kept, never deleted. The number is the one that
says when this is finished: at zero, the merge in `withProjectedMastery` can be deleted
and the blob dropped.

## Where the two new surfaces are

- **Item health** — `/studio` → *Item health*. Needs the catalogue-author grant from
  `WP-05-HANDOFF.md`. Shows nothing until items have accumulated at least five wrong
  answers each, which is deliberate: two children picking the same wrong answer is a
  coincidence, not a signal.
- **Retention** — Parent Corner, under *What stayed*. Shows "nothing has come round yet"
  until a child has met a skill again 7 or more days after first getting it right, which
  on a fresh account is the honest answer rather than an empty chart.

## The thresholds, and where to change them

Both live in `lib/insights.ts`, not in SQL, so they are tested without a database and
there is one place to change them:

- `DOMINANT_DISTRACTOR_SHARE = 0.6` — the §WP-06 line for flagging an item.
- `MIN_WRONG_ANSWERS = 5` — how much evidence an item needs before its shape means
  anything. The database applies the same floor as a query parameter.
