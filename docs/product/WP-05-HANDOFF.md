# WP-05 — content out of the bundle: operator notes

The package is complete. What it does and what is still not true is recorded in
`RELEASE_STATUS.md`; this file is the part somebody has to *do* by hand, plus the
judgements the migration made that are worth knowing before you edit anything.

## The one step left

The schema and the content are already in the database — `cq_catalogue` returns
version 1, "migrated from the bundle", 519 published items. What does not exist yet is
an author. The studio refuses everyone until this row exists, because the catalogue is
global and being a parent is not being an author:

```sql
insert into content.authors (parent_id, role, note)
select id, 'editor', 'founder' from public.parents
where id = (select id from auth.users where email = 'YOUR-EMAIL-HERE');
```

Then open `/studio`. Until that row is there the route renders "This account is not a
catalogue author" rather than failing, and children are unaffected either way.

Check it landed:

```sql
select version, label, item_count, skill_count, lesson_count, is_current
from content.catalogue_versions order by version desc;

select count(*) filter (where error_kind is null) as no_reason_yet,
       count(*) filter (where error_kind is not null and not reviewed) as machine_guessed,
       count(*) filter (where reviewed) as person_chose
from content.item_distractors;
```

## If you are applying this to a fresh database

Paste into the Supabase SQL Editor, in this order, one at a time. Both are idempotent.

1. `supabase/migrations/20260920000400_content_catalogue.sql` — the schema.
2. `supabase/migrations/20260920000500_content_seed.sql` — the content and the first
   published version. 826 KB; paste it whole.

Running these before anybody is an author is safe: the app switches to the database
catalogue immediately, and falls back to the bundle if the read fails.

## The studio is deliberately unlinked

There is no navigation to `/studio` from Parent Corner. A link there would be visible to
every parent, and a door most people cannot open is worse than no door. Authors navigate
to the URL. When authoring becomes a role more than one person holds, that is the moment
to add a link — gated on `isCatalogueAuthor()`, not on being signed in.

## Four judgements the seed generator made

Each is stated in the generated file's header too, so they travel with the SQL:

- **existing items seed `published`**, because they are what children are served today;
- **distractor reasons come from the WP-04 inference where it has an opinion** (82 of
  428) and stay **null** where it does not. Writing `guess` over the other 346 would have
  been a lie the product acts on — `guess` never counts against mastery, so mislabelling
  would have quietly stopped recording real misconceptions;
- **one lesson per (skill, difficulty rung)**, which is the only grouping the bank
  actually encodes;
- **an item's bands are the bands whose word budget its prompt fits.**

## What the migration found

- **The pre-K pool is not written for three-year-olds.** 151 of its 256 prompts are
  longer than the eight words §C5 allows on an early-preschool screen. Item reach is now
  measurable: early-preschool 105 items, pre-K 167, kindergarten 252, grade 1 and up 267.
  Serving is unchanged — the recommender still selects by the legacy grade pool, as WP-05
  requires — but the gap is recorded rather than implied. The studio's band picker is
  where you see it per item.
- **Four prompts no band in their pool can hold** (`garden-prek-clue`,
  `garden-prek-ending`, `model-prek-math-1`, `model-prek-math-2`, 19 words each) are
  seeded `draft` and are not served until somebody rewrites them. They are the obvious
  first job in the studio.

## Regenerating the seed

`node scripts/build-content-catalogue.mjs` rewrites
`supabase/migrations/20260920000500_content_seed.sql` from the bundled bank. It runs
`validateCatalogue` before writing, so a seed that could not be published is never
produced. Only useful for rebuilding a fresh database — it does not know about anything
authored in the studio since.
