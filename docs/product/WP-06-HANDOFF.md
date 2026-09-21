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

**It was desk-checked, not executed.** Docker was not running on this machine and I did
not connect to your local Postgres, so no throwaway database validated it. Three real
faults were found and fixed by reading it — `rows` and `row` used as column aliases where
both are Postgres keywords, and a `days` variable shadowing `make_interval`'s `days`
parameter — but plpgsql only parses the SQL inside a function body when that body first
*runs*, so a `create function` succeeding proves less than it looks like it does. Run the
smoke test below immediately afterwards; it executes every branch.

## Smoke test — run this straight after the migration

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

If any of the three raises a syntax or column error, paste it back and it is a one-line
fix in the migration rather than anything structural.

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
