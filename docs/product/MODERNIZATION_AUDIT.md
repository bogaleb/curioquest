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

Verification: typecheck, lint, 58 tests, production build.

### Phase 2 — Adaptive learning, deepened

1. Extend the skill graph beyond three subjects: science, creativity, general
   knowledge, memory/attention, social-emotional. The mastery model already generalises;
   it needs nodes.
2. Author native content per band rather than mapping new bands onto the two legacy
   pools. `contentBands` is the seam — a band stops borrowing once it has its own.
3. Use `maxPromptWords` to select between authored prompt variants, not just to measure.
4. Surface mastery to parents in plain language, never labelling a child.

### Phase 3 — Routing and content scale

1. Move the `view` string onto real routes (`/play/[world]`, `/studio`, `/stories/[id]`).
   This is the prerequisite for deep links, back-button behaviour, per-route code
   splitting, and content that does not ship in the initial bundle.
2. Move content from TypeScript modules into the existing Supabase curriculum tables,
   which already have the schema for it. Keep code-defined content as the seed path.
3. Add the admin authoring surface behind a role check — the schema anticipates it.

### Phase 4 — Experience

Game engines with a shared loop (pause, restart, exit, difficulty ramp, progress save);
immersive mode extended to games, stories, and simulations; story library as data.

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
