# CurioQuest modernization audit and plan

_Audited 2026-09-19 against `main` @ 49582e2. Baseline was green: typecheck, 44 tests,
and production build all passed before any change._

## What is already good

The product is further along than "basic prototype" in several places, and this plan
preserves all of it:

- **A real adaptive core.** `lib/skill-graph.ts` is a validated DAG (cycle detection,
  prerequisite integrity) of 50 skills. `lib/mastery.ts` tracks score, confidence,
  evidence coverage, activity-type variety, context variety, session spread, and
  SM-2-style spaced review intervals. `lib/recommendation.ts` ranks candidates on
  review-due, prerequisite support, interest match, and format fatigue. This is not a
  quiz app pretending to be adaptive.
- **Sound data security.** Family tables are RLS-enabled with select-only policies
  scoped by `parent_id`; the `private` schema has RLS on and no policies at all, reached
  only through `cq_read`/`cq_commit` RPCs under the service role. Answer keys live in
  `private.question_answers` and never reach the client — `publicQuestion` strips them.
- **Genuine privacy posture.** No child email, no date of birth, no localStorage, no
  third-party analytics, parent-PIN gating with expiring sessions.
- **A better Creative Studio than expected.** Seven tools, palette, custom colour,
  brush size, undo/redo/clear, templates, handwriting guides, gallery, and keyboard
  operation.

## The ten gaps that kept it from feeling commercial

| # | Gap | Severity |
|---|-----|----------|
| 1 | **Two learning bands, hard-wired.** `GradeBand = "prek" \| "grade1"` across 17 files. Parent controls already offered `kindergarten` and `grade2`, which changed nothing. Age adaptation was a label. | Critical |
| 2 | **Single-URL god component.** `curioquest-app.tsx` switched ~15 screens on a `view` string. No routes, no deep links, no back button, no per-route code splitting. | Critical |
| 3 | **No immersive mode.** Zero uses of the Fullscreen API anywhere. Games and drawing ran inside the sidebar chrome. | Critical |
| 4 | **No design system.** Five CSS variables; every other value hard-coded across ten minified stylesheets. No type, space, radius, or elevation scale. | High |
| 5 | **A tablet-shaped hole.** Breakpoints at 360/400/440/600/700/760/1000/1100/1200/1550 plus height queries. 768–1200px — every iPad in portrait — got a squeezed 214px desktop sidebar. No `env(safe-area-inset-*)`, no `dvh`, no orientation handling. | High |
| 6 | **Thin content.** ~430 lines of content data in total. Science 13 lines, stories 38, reading 20. | High |
| 7 | **Three subjects only.** Reading, math, logic in the skill graph — while Discovery Lab, Story Harbor, and Creative Studio screens existed with no mastery model behind them. | High |
| 8 | **No PWA.** No manifest, no icons, no install path, no `viewport-fit=cover`. | Medium |
| 9 | **Games are not engines.** Eight engine kinds, mostly one-shot question renderers. No shared loop, no pause/restart/exit, no in-game difficulty ramp. | Medium |
| 10 | **Accessibility and performance debt.** No skip link, no viewport config, plain `<p>Opening…</p>` instead of skeletons, canvas without DPR scaling, `window.confirm` used for child-facing decisions. | Medium |

Gap 10 is now largely closed: skip link, viewport config, DPR-scaled canvas and route
skeletons are all in. `window.confirm` for child-facing decisions remains.

## Phases

### Phase 1 — Foundation ✅ delivered

- **Learning bands** (`lib/learning-bands.ts`). Six bands, ages 3–9, each with a
  delivery profile: instruction mode, narration, choice count, prompt length, touch
  target, hint timing, session length, typing and multi-step suitability. Both legacy
  tracks remain valid band IDs, so stored profiles migrate themselves; `grade` is kept
  as the authored-content pool and derived from the band. Age ranges are half-open so a
  child who turns five moves up instead of matching two bands.
- **Responsive shell** (`components/shell/AppShell.tsx`, `app/shell.css`). Navigation is
  data (`lib/navigation.ts`); one model renders a bottom tab bar plus More sheet under
  768px, an icon rail at tablet width, and a labelled sidebar from 1181px. Safe-area
  insets, `dvh`, skip link, landscape handling, band-driven touch targets. Thirteen
  destinations grouped into five primary plus a second level.
- **Immersive mode** (`components/shell/ImmersiveStage.tsx`, `hooks/use-immersive.ts`).
  Fullscreen API with a viewport-covering fallback for browsers without it (Safari on
  iPhone has no element fullscreen), one `active` flag for callers, always-visible
  child-sized exit. Adopted by the Creative Studio, whose canvas now scales by device
  pixel ratio.
- **Design tokens** (`app/tokens.css`). Type, space, radius, elevation, motion, touch,
  and device metrics, with child touch targets keyed to the band.
- **Adaptive delivery, end to end.** Choice count narrows server-side per band (answer
  always retained, order preserved, scoring untouched); narration defaults from the
  band; Nova offers help after a band-sized pause without taking the hint for the child,
  which would understate independence.
- **PWA manifest** (`app/manifest.ts`) — installable, standalone, deliberately no
  service worker yet.

Verification: typecheck, lint, tests, production build, and zero console errors
across seven captured viewports (`pnpm ui:shots`).

### Phase 2 — Subjects and adaptive delivery ✅ delivered

- **Subject registry** (`lib/subjects.ts`). One place knowing each subject's world
  name, label, colour family, and maturity-specific copy. Home worlds, world cards,
  quest headers, parent priorities, and report tallies all read from it.
- **Six subjects, not three.** Science, Our World, and Feelings & Friendship added as
  first-class subjects: 24 new skills (50 → 74) and 45 authored activities across both
  content pools and all three levels.
- **Core vs explore.** Reading, math, and logic carry placement and anchor every day;
  explore subjects fill remaining slots, so a longer session widens coverage rather
  than repeating. Placement deliberately still covers only the core three.
- **Delivery reaches the activity.** Choice count narrows server-side per band,
  narration defaults from the band, and Nova offers help after a band-sized pause.

### Phase 3 — Routing ✅ delivered

- The current screen lives in the URL, so views are linkable and the Back button works.
  Parent Corner is excluded — it sits behind a PIN.
- Real route segments landed under `app/(explorer)/`: fifteen of them, a server layout
  doing the auth check once, and a client provider holding the shared explorer state so
  navigation never tears down a running quest. Home dropped from 215 KB to 55 KB.
- Loading and error boundaries per segment completed the wave on 2026-09-20. Until then
  a slow route showed nothing at all and one throwing screen took the whole shell with
  it — the route split had traded reliability for payload, and that debt is now paid.
- **Still to do:** moving content from TypeScript modules into the Supabase curriculum
  tables, which already have the schema for it.

### Phase 4 — Experience (partial)

- Immersive mode adopted by the Creative Studio and the activity player, so games,
  quests, and stories can take the whole display.
- **Still to do:** shared game-loop engines with pause, restart, and in-game difficulty
  ramp. The current engines are still largely one-shot question renderers.

### Phase 5 — Motivation ✅ delivered

- 17 achievements in five categories (`lib/achievements.ts`), every one a pure measure
  over recorded evidence. Nothing is earned by attendance; persistence is measured by
  recovery rather than by being right first time.

### Phase 6 — Parent experience ✅ delivered

- Today / this week / this month reports (`lib/reports.ts`), counted from real
  activity, windowed to the family's local midnight, reporting emptiness honestly and
  withholding focus advice unless an imbalance is real.

### Phase 5–7

Motivation, parent reporting, and commercial readiness as scoped in the brief.

## Standing constraints

- Do not weaken RLS, the `private` schema boundary, parent gating, or the answer-key
  split to make development easier.
- Do not collect a child birth date, email, or location. Band is chosen by the parent;
  `ageFromDateOfBirth` exists for families who opt in to supplying an age, nothing more.
- Do not claim COPPA compliance. The architecture follows COPPA-style principles; that
  is a different statement and the only one we make.
- Every phase ends green on typecheck, lint, tests, and production build.
