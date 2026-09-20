# CurioQuest Rebuild Blueprint

**Status:** active implementation contract. **Created:** 2026-09-20.
**Companion documents:** `PRODUCT_BLUEPRINT.md` (long-form vision), `docs/product/COMMERCIAL-UPGRADE.md` (scope), `docs/product/RELEASE_STATUS.md` (what actually ships).

---

## How to read this file

This is the file an agent reads **before planning any work** on CurioQuest. It converts the product rethink into work packages with acceptance criteria.

**Precedence, highest first:**

1. A direct instruction from the user in the current session.
2. `CLAUDE.md` / `AGENTS.md` core rules (security, RLS, do-not-rebuild).
3. **This file.**
4. `docs/product/WAVE-*.md` and `COMMERCIAL-UPGRADE.md`.

Where the wave documents and this file disagree, **this file wins**, because the waves were written against the old product shape. Do not delete the wave documents; treat them as a scope inventory, not a sequence.

**Working rules for the agent:**

- Read only the work package you are assigned, plus §A–§E (contracts). Do not load every wave document.
- One work package per branch. Do not start the next one without being told.
- If a work package's acceptance criteria cannot be met without breaking a non-negotiable, stop and say so. Do not negotiate with yourself.
- Never claim a package is complete because the code compiles. See §D "Definition of done".

---

## §0 The product law

> **A child opens CurioQuest, and the app already knows where they are in a story — it takes them there, and something happens.**

Every change is measured against that sentence. A change that adds a decision for a five-year-old to make before learning starts is a regression, however good it looks.

Three corollaries that settle most design arguments:

- **The map replaces the menu.** Children navigate space, not labels.
- **Producing beats choosing.** A tap on the right picture is the weakest evidence of learning available.
- **Depth in one subject beats breadth across six.** Reading is the spine; everything else is enrichment.

---

## §A Non-negotiables

Carried forward from `CLAUDE.md` and still absolute:

- Preserve working features unless replacing them with something demonstrably better.
- Do not rebuild the application from scratch.
- Do not weaken Supabase RLS or authentication. Never expose service-role credentials.
- Use version-controlled Supabase migrations.
- Answers, scoring and reward grants are decided on the server. Never ship the answer key to the browser.
- Child data collection stays minimal. Preserve production stability and existing family data.
- No copying of competitor artwork, characters, audio, story text or copyrighted content.

Added by this blueprint:

- **No new destinations, subjects or game types** until the reading spine is finished (§F Freeze list).
- **No emoji as artwork** on any child-facing surface. Emoji in code comments and parent-facing copy is fine.
- **No raw hex colours, px font sizes or magic spacing in new CSS.** Use the tokens in `app/tokens.css`.
- **No new `!important`.** The current count is 42; it may only go down.
- **No third-party analytics, advertising or experimentation SDK inside a child session.**
- **No live generative model output shown to a child.** Nova stays authored (`docs/ai/NOVA_SPEC.md`).
- **No engagement-pressure mechanics:** no loss-bearing streaks, no daily-login rewards, no variable-ratio surprise drops, no "don't go" interstitials.
- **Every new learning interaction writes a `learning_event`** (§B). An interaction that records nothing did not happen.

---

## §B Locked decisions

Do not re-litigate these inside a work package. If one must change, raise it with the user first.

| # | Decision | Consequence |
| --- | --- | --- |
| D1 | Audience is **ages 4–7**, three authored content bands inside that range | Bands 3–4 and 8–9 are removed from the public promise; `learning-bands.ts` keeps its delivery profiles |
| D2 | **Reading is the wedge.** Math is a supporting track; science, logic, creativity, stories, building, faith are enrichment | Enrichment keeps working, receives no new investment during Phases 0–1 |
| D3 | Stack is **Next 16 + Vercel + Supabase (Postgres)** | Vinext, Wrangler, Cloudflare D1, `vite.config.ts`, `db/schema.ts`, `examples/` are deleted |
| D4 | Content lives in **Supabase**, published as a versioned catalogue | `lib/curriculum.ts` becomes a loader, not a content file |
| D5 | Learning evidence lives in an **append-only `learning_events` table**; mastery is a projection | The JSON mastery blob stays as a cache, never as the source of truth |
| D6 | **Authored audio** for phonemes, decodable words and Nova lines | `speechSynthesis` is a fallback for incidental text only |
| D7 | Child surfaces use a **dedicated component layer**; shadcn/Radix is for parent surfaces | Do not put a shadcn `Card` on the child map |
| D8 | **iPad landscape is the primary design target**, phone portrait the second | Desktop is a supported afterthought, not the reference layout |
| D9 | Rewards are **objects placed in My Treehouse**, not a rising star count | Stars survive as a minor currency, not as the progress story |
| D10 | Voice input, when added, is **on-device, never retained** | Voice recordings are biometric data under the amended COPPA Rule |

---

## §C Contracts

These shapes are shared across work packages. Implement them once, exactly as written, and import them everywhere.

### C1 — `learning_events` (the single most important addition)

Append-only. One row per attempt. Never updated, never deleted except by retention policy.

```sql
create table public.learning_events (
  id            uuid primary key default gen_random_uuid(),
  child_id      uuid not null references public.explorers(id) on delete cascade,
  session_id    text not null,
  occurred_at   timestamptz not null default now(),

  skill_id      text not null,
  item_id       text not null,
  lesson_id     text,
  episode_id    text,

  verb          text not null,           -- say | build | sequence | sort | predict | fix | explain | make | choose
  phase         text not null,           -- discover | guided | independent | transfer
  correct       boolean not null,
  support       text not null,           -- none | hint | model | scaffold | adult
  distractor    text,                    -- the option chosen when wrong
  error_kind    text,                    -- see C3
  latency_ms    integer,
  catalogue_ver text not null
);

create index learning_events_child_time on public.learning_events (child_id, occurred_at desc);
create index learning_events_skill      on public.learning_events (skill_id, occurred_at desc);
create index learning_events_item       on public.learning_events (item_id);
```

RLS: a parent may read only their own family's rows; the child client may insert only through the server route that already authorises the session. No client-side insert with an anon key.

**Mastery becomes a projection over this table.** Keep `lib/mastery.ts` types; change where the numbers come from.

### C2 — Evidence rule (replaces "score goes up")

A skill is **mastered** only when all three hold:

1. **Representation** — correct in at least **two different verbs** (`activityTypes` already records this; make it a gate).
2. **Spacing** — at least one correct attempt **24h or more** after the first correct attempt.
3. **Independence** — at least **two consecutive** correct attempts with `support = 'none'`.

Anything short of that is `practising`, and must be reported to parents as practice, never as mastery.

### C3 — Distractor reasons (the feedback engine)

Every wrong option an author writes carries a reason. Feedback, hint selection and the next item all branch on it.

```ts
export type ErrorKind =
  | "confusable-visual"      // b/d, p/q, 6/9
  | "confusable-sound"       // m/n, f/th
  | "letter-name-for-sound"  // says "em" where /m/ is meant
  | "off-by-one"             // counting slip
  | "wrong-attribute"        // sorted by colour when asked for shape
  | "sequence-reversed"      // right parts, wrong order
  | "guess"                  // fast, low-confidence tap
  | "not-yet-taught";        // prerequisite gap — route backwards, never penalise
```

Rule: `not-yet-taught` and `guess` never decrease a mastery score. `not-yet-taught` triggers a prerequisite detour.

### C4 — Content object model

```ts
type Skill   = { id; subject; strand; name; childName; prerequisites: string[]; band: BandId[]; evidenceTarget };
type Lesson  = { id; skillId; title; model: Step; guided: Item[]; independent: Item[]; review: Item[] };
type Item    = { id; lessonId; skillId; verb: Verb; band: BandId; prompt: Localised;
                 assets: AssetRef[]; answer: Answer; distractors: { value; errorKind: ErrorKind }[];
                 hint: Localised; explanation: Localised; reviewStatus: ReviewStatus };
type Episode = { id; title; synopsis; order: LessonRef[]; scenes: Scene[]; rewardObjectId };
type Asset   = { id; kind: "audio" | "art" | "animation"; locale; uri; licence; durationMs? };
```

`ReviewStatus` is `draft | reviewed | published`. **Only `published` content is ever served to a child.** This is how unreviewed material stays gated.

### C5 — Copy rules for child surfaces

- Address the child, never the parent. No product taglines inside the app.
- Max **12 words** on screen at once for band 4–5; max 25 for 6–7.
- Every instruction has audio. Text is the redundant channel, not the primary one.
- No ALL-CAPS kickers, no marketing eyebrows ("THREE PATHS TO GROW"), no breadcrumbs.
- Name the child. Nova speaks in first person and never uses system vocabulary ("activity", "session", "skill", "quest length").

### C6 — Accessibility floor (every child screen)

- Touch targets: **64px** minimum for bands 4–5, 56px for 6–7.
- Contrast: WCAG AA against the actual painted background, verified, not assumed.
- Full keyboard path with a visible focus ring; no hover-only affordance.
- `prefers-reduced-motion` path is complete, not degraded.
- Audio-off path: every narrated instruction is also legible or demonstrated.

---

## §D Definition of done

A work package is complete only when **all** of these are true. "It builds" is not on the list.

1. `pnpm run typecheck`, `pnpm run lint`, `pnpm test`, `pnpm run build` all pass.
2. Supabase migration written, applied locally, and idempotent; RLS verified for a second family.
3. Screens verified at **iPad landscape (1180×820), iPad portrait, iPhone portrait (390×844), desktop 1440**.
4. Accessibility floor (§C6) checked on every new or changed screen.
5. Reduced-motion and narration-off paths exercised by hand.
6. Every new interaction writes a `learning_event` with correct `verb`, `support` and `error_kind`.
7. No new `!important`, no raw hex, no px font sizes outside `app/tokens.css`.
8. `docs/product/RELEASE_STATUS.md` updated: what shipped, what is still not true.
9. A screenshot of the changed screen saved to `outputs/` via `pnpm run ui:shots`.

---

## §E Work packages

Ordered. Each one is a branch and a session. **Do not skip ahead**; later packages assume earlier contracts exist.

### WP-00 — Clear the ground

**Goal:** one stack, one schema, one README.
**Files:** `package.json`, `vite.config.ts`, `db/`, `examples/`, `README.md`, `.github/workflows/verify.yml`, `cloudflare-env.d.ts`, `proxy.ts`.

1. Delete Vinext, Wrangler, `@cloudflare/*`, `drizzle-kit`/D1 schema, `vite.config.ts`, `examples/`, `cloudflare-env.d.ts`.
2. Rename the package from `site-creator-vinext-starter` to `curioquest`.
3. Rewrite `README.md` to describe the Next + Vercel + Supabase app only; move the Sites starter text out of the repository.
4. Confirm CI still passes.

**Acceptance:** `grep -ri "vinext\|wrangler\|d1" --include="*.ts*" --include="*.json" .` returns nothing outside lockfiles. Build and deploy unchanged in behaviour.
**Do not:** touch `.wrangler/state` if it still holds local family progress — export first.

---

### WP-01 — The event stream

**Goal:** start recording evidence before anything else changes.
**Files:** new migration, `lib/learning-events.ts`, `app/api/quest/route.ts`, `app/api/reading/route.ts`, `lib/mastery.ts`.

1. Create `learning_events` exactly as §C1, with RLS.
2. Write a server-side `recordLearningEvent()` and call it from every existing answer-checking path.
3. Keep the JSON mastery blob writing exactly as it does today — dual-write, no behaviour change.
4. Add a read-only projection `masteryFromEvents(childId)` and a test that it reproduces the blob for a seeded child.

**Acceptance:** a full daily quest produces one row per attempt with correct `verb`, `support`, `correct`, `latency_ms`. Projection matches the blob within rounding for the seeded fixture.
**Do not:** switch the app over to the projection yet. That is WP-06.

---

### WP-02 — Tokens and the child component layer

**Goal:** make the redesign affordable before drawing it.
**Files:** `app/tokens.css`, new `components/kid/*`, `app/*.css` (by attrition).

1. Extend `app/tokens.css` with the missing ramps: child-surface palette (brighter, saturated), type scale with a 20px floor for band 4–5, touch-target tokens, motion durations.
2. Build the child primitives — `KidButton`, `KidCard`, `SceneLayer`, `SpeechBubble`, `ProgressTrail`, `ObjectSlot` — using tokens only.
3. Add a lint rule or CI grep that fails on raw hex / px font-size in `app/*.css` and `components/kid/*`.
4. Delete any stylesheet rule that a migrated screen no longer uses.

**Acceptance:** the CSS byte count and `!important` count both go down. New components render identically light/dark and at all four viewports.
**Do not:** rewrite all eighteen stylesheets in one pass. Attrition only.

---

### WP-03 — The world shell

**Goal:** remove the dashboard from the child's path.
**Files:** `components/app/ExplorerShell.tsx`, `app/(explorer)/layout.tsx`, `lib/navigation.ts`, `components/shell/*`.

1. Split the shell in two: `KidShell` (no sidebar, no breadcrumb, no top bar) and `GrownUpShell` (keep today's layout, move it behind the parent gate).
2. Child navigation becomes the **map**: five drawn places, positions fixed, `destinations` with `group: "primary"` only. Secondary destinations are reached from inside the map, not from a rail.
3. Touching a place speaks its name before committing. Second touch enters.
4. Remove the star pill, the explorer `<select>` and the breadcrumb from child surfaces. Profile switching moves to the arrival screen.

**Acceptance:** a child who cannot read can reach a learning activity in two touches, verified by watching one. No text label is the only affordance for any child control.
**Do not:** reorder places by recency or recommendation. Position is memory.

---

### WP-04 — The item model and error-responsive feedback

**Goal:** make wrong answers teach.
**Files:** `lib/activity-types.ts`, `lib/activity-evaluation.ts`, `lib/scaffolding.ts`, `components/learning/activity-engine.tsx`, migration.

1. Add `errorKind` to every distractor in the existing bank (§C3). Mechanical first pass is acceptable; mark each `reviewStatus: draft`.
2. Branch feedback on `errorKind`: a visual confusion gets a letter-comparison move, a sound confusion gets a re-listen, `not-yet-taught` routes to the prerequisite.
3. Implement the evidence rule (§C2) in `lib/mastery.ts` and expose `practising` vs `mastered` as distinct states.
4. Record `error_kind` on every event.

**Acceptance:** two children giving different wrong answers on the same item receive different next steps, demonstrated in a test.

---

### WP-05 — Content out of the bundle

**Goal:** someone other than a developer can add a lesson.
**Files:** migrations, `lib/curriculum.ts` → loader, `lib/skill-graph.ts` → loader, new `app/(grownup)/studio/*`.

1. Model §C4 in Postgres. Migrate the existing 78 skills and the generated item bank into it.
2. `lib/curriculum.ts` becomes a cached loader over a **published catalogue version**; the recommender keeps selecting from the served pool.
3. Build the minimum authoring surface: bulk import, per-item editor, **live preview that renders the item exactly as the child sees it**, and a publish step that validates the whole catalogue with Zod.
4. Gate serving on `reviewStatus = 'published'`.

**Acceptance:** adding a lesson requires no deploy. A deliberately broken item fails publish validation with a readable error.
**Do not:** adopt a third-party CMS. The content types are too specific and the auth is already here.

---

### WP-06 — Mastery from events

**Goal:** retire the blob as source of truth.

1. Switch reads to `masteryFromEvents`, keeping the blob as a cache with a rebuild command.
2. Add the item-health query: any item where one distractor takes over 60% of wrong answers is flagged for rewrite.
3. Add the retention query: proportion of reviewed skills still correct after 14 days.

**Acceptance:** the parent surface and the recommender both read the projection. Blob rebuild reproduces it.

---

### WP-07 — Authored audio

**Goal:** stop teaching phonics with a synthesiser.
**Files:** `lib/speech.ts`, `lib/audio.ts`, asset pipeline, Supabase storage.

1. Record or licence: the phase-one phoneme set, the decodable word list, Nova's scripted lines.
2. Address audio by asset id and locale; preload the current lesson's clips; fall back to `speechSynthesis` only for incidental text.
3. Keep the existing ducking and the `onStart`/`onEnd` lifecycle so Nova's mouth still works.

**Acceptance:** no phoneme is ever produced by `speechSynthesis`. Narration-off path unchanged.

---

### WP-08 — Episodes

**Goal:** give the child a reason to come back.
**Files:** new `lib/episodes/*`, `components/experience/*`, migration.

1. Model `Episode` (§C4) as an ordered run of lessons with scenes between them.
2. Arrival resumes the current episode automatically — no menu, no "start my daily quest" button as the primary path.
3. Finishing an episode grants a **reward object**, not a number.
4. Three complete episodes of 8–12 lessons, built on the existing phonics slice.

**Acceptance:** a child returning after two days lands mid-story with no navigation. The adaptive recommender still chooses items inside the lesson slot.

---

### WP-09 — Treehouse as the reward system

**Goal:** progress a five-year-old can see.
**Files:** `components/experience/Treehouse.tsx`, `lib/achievements.ts`, `world_items` tables.

1. Reward objects are drawn, named, and placed by the child in the treehouse.
2. The treehouse visibly fills over weeks; it is the child's progress screen.
3. Stars demote to a minor currency; remove the top-bar counter from child surfaces.

**Acceptance:** progress is legible without reading a number. No streak, no login reward.

---

### WP-10 — The parent weekly

**Goal:** the screen that renews the subscription.
**Files:** `components/learning/parent-reports.tsx`, `lib/reports.ts`, `app/api/parent/route.ts`.

Rebuild around four answers, in this order: **what is new this week** (one specific sentence), **what she is working on**, **what is stuck and why** (from `error_kind`), **what to do in five minutes off-screen** (promote `offscreenInvitation`).

Rules: never a percentage without a sentence explaining it; never conflate practice with mastery; everything else moves one level down.

**Acceptance:** a parent unfamiliar with the product can read it in 90 seconds and say one true thing about their child's week.

---

### WP-11 — Art direction pass

**Goal:** one visual world.

1. Commission one flat-vector style, ~12-colour palette, cast of four (Nova, Pip, a peer, a friction character).
2. Replace every emoji and every Lucide icon on child surfaces with drawn assets.
3. Keep text out of illustrations so localisation stays cheap.
4. Convert all rasters to AVIF/WebP with responsive sizes; arrival screen image budget **under 300 KB**.

**Acceptance:** `public/*.png` over 500 KB: zero. No emoji or Lucide import under `components/kid/` or any child route.

---

### WP-12 — Offline and tablet

**Goal:** the car, the aeroplane, the weak connection.

1. Service worker caching the current episode's assets; queue `learning_events` and replay on reconnect.
2. Extend `app/manifest.ts` to a full installable PWA.
3. Playwright device matrix with automated accessibility checks and screenshot comparison on the five core screens.

**Acceptance:** a full episode completes offline; events arrive once connectivity returns, with no duplicates.

---

### WP-13 — Say (voice input)

**Goal:** the highest-value reading interaction — built safely.

1. On-device recognition only. **Never store raw audio.** Persist a pass/fail judgement and a confidence band.
2. Parent opt-in, with plain-language explanation at the point of enabling.
3. Update the privacy notice before the feature is reachable.

**Acceptance:** no audio blob exists anywhere in storage or logs. Feature is unreachable without parent opt-in.
**Do not:** start this package before the privacy notice and retention policy are written.

---

### WP-14 — Commercial

Multi-family tenancy, verifiable parental consent, written retention policy with real deletion, third-party-disclosure consent separated from collection consent, subscription billing, app-store wrapper. Pricing frame: $8–12/month or $60–80/year, sold on the parent weekly as much as on the child experience.

**Do not** widen access beyond the owner family until tenancy and consent are done and tested with a second family.

---

## §F Freeze list

Untouched until WP-08 ships: Faith & Bible, Build Lab, Theater, Story Harbor, parent activity builder, Team Quest (rebuild comes later, as a headline feature), new game types, new subjects, new wave documents.

They keep working. They receive no new investment. Bug fixes only.

---

## §G Anti-patterns

If you catch yourself doing any of these, stop:

- Adding a screen with a text-labelled menu for a child.
- Writing another multiple-choice generator loop in `lib/curriculum.ts`.
- Counting activity configurations as skills in any status document.
- Using an emoji because the illustration is not ready. Use a grey placeholder shape instead — it keeps the gap visible.
- Appending an override block to the bottom of `globals.css`.
- Marking a work package complete with a note that the tests were not run.
- Describing the product as commercial-grade while it is a single-family workspace.
- Adding a feature listed in §F because it is quick.

---

## §H Verification

```bash
pnpm run typecheck
pnpm run lint
pnpm test
pnpm run build
pnpm run test:integration      # Supabase / D1 isolation checks
pnpm run ui:shots              # screenshots into outputs/
pnpm run supabase:check
```

Manual pass before calling anything done: iPad landscape, iPad portrait, phone portrait, desktop; narration off; reduced motion on; keyboard-only; second family for RLS.

---

## §I Metrics that define success

| Metric | Target |
| --- | --- |
| Unassisted starts (child begins without an adult) | > 80% of sessions |
| Return days per week | 3+ for an engaged family |
| Independent mastery per week (evidence rule §C2) | 2–3 skills |
| 14-day retention of reviewed skills | > 70% |
| Parent weekly open rate | > 50% of active families |
| Item health: items where one distractor takes > 60% | trending to zero |

Deliberately **not** tracked or reported to parents: total time in app, activities completed, stars earned.

---

## §J Path glossary

| Path | What lives there |
| --- | --- |
| `app/(explorer)/` | Child routes; becomes `KidShell` in WP-03 |
| `components/app/ExplorerShell.tsx` | The shell to split |
| `components/kid/` | New child component layer (WP-02) |
| `components/learning/` | Activity engines — the good part; extend, don't replace |
| `components/reading/` | Phonics slice — the strongest existing work |
| `lib/skill-graph.ts` | 78 skills; becomes a loader in WP-05 |
| `lib/curriculum.ts` | Item bank; becomes a loader in WP-05 |
| `lib/mastery.ts` | Evidence rule lands here (WP-04, WP-06) |
| `lib/learning-bands.ts` | Delivery profiles — keep, narrow to 4–7 |
| `lib/recommendation.ts` | Selection engine — keep, feed it better content |
| `app/tokens.css` | The only place colour, type and spacing are defined |
| `supabase/migrations/` | The real schema |
| `outputs/` | QA screenshots |
