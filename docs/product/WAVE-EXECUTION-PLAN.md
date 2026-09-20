# Wave execution plan

_Written for whoever picks the waves up next, including a future session starting cold.
Audited 2026-09-20 against `main` @ 6745ef5. Baseline before any change: typecheck clean,
87 unit tests passing, lint 0 errors (1 pre-existing `no-img-element` warning)._

## What this document is

`docs/product/COMMERCIAL-UPGRADE.md` states the destination. `WAVE-01` … `WAVE-15`
describe fifteen slices of the route there. Neither says where the codebase currently
stands against them, and two earlier planning documents
(`MODERNIZATION_AUDIT.md`, `ROUTE_SEGMENTS_PLAN.md`) describe overlapping phases under
different names.

This reconciles them: what each wave asks for, what the code already does, and what is
genuinely left. Claims below were checked against files, not against previous
documents' claims.

## Naming

The waves and the audit phases are two vocabularies for the same work:

| Wave | Audit phase | Status |
|---|---|---|
| 01 Foundation | Phase 1 + 3 + parts of 4 | Substantially done, **finished in this pass** |
| 02 Entry experience | — | Partly done, not audited |
| 03 Child home | Phase 1 (home) | Partly done |
| 04 Adaptive learning | Pre-existing core + Phase 2 | Largely done, strongest area |
| 05 Reading | Reading Section 94 slice | Vertical slice only |
| 06 Math | — | Authored content, engines thin |
| 07 Science | Phase 2 (subject added) | Discovery Lab exists, quiz-shaped |
| 08 Logic | Phase 2 (subject added) | Skills exist, few formats |
| 09 Games | Phase 4 | **Largest remaining gap** |
| 10 Creative studio | Phase 1 (immersive) | Done to a good standard |
| 11 Stories / video / discovery | — | Stories done, audio is prototype |
| 12 Rewards | Phase 5 | Done |
| 13 Parent experience | Phase 6 | Done |
| 14 Commercial hardening | Phase 7 | **Partly started in this pass** |
| 15 Content scale / admin | — | Schema ready, tooling absent |

## Wave-by-wave standing

### Wave 01 — Foundation ✅ complete as of this pass

Design tokens (`app/tokens.css`), the responsive shell (`components/shell/AppShell.tsx`,
`app/shell.css`), immersive mode (`components/shell/ImmersiveStage.tsx`), learning bands
(`lib/learning-bands.ts`) and the route split (`app/(explorer)/`) were all delivered
before this pass.

Three items on its completion criteria were open, and are closed here:

1. **No loading states.** Fifteen route segments, zero `loading.tsx`. A slow route
   showed nothing at all. `motion.css` had defined `.cq-skeleton` since the design-system
   commit and **nothing in the app ever used it**.
2. **No error boundaries.** Zero `error.tsx`. One screen throwing took the whole shell
   with it, and the child saw Next's error page.
3. **No 404.** A mistyped or stale URL got the framework default, in a product whose
   every other surface is designed for a six-year-old.

### Wave 02 — Entry experience

Auth routes exist (`app/auth/*`), profile selection exists
(`components/auth/child-chooser.tsx`), the add-explorer dialog is polished. Not audited
against the wave's state list: no evidence the eight authentication states
(idle / submitting / success / invalid / exists / reset / verification / network) are all
handled. **Next step:** enumerate the states, then fix.

### Wave 03 — Child home

`ChildWorldHome` is personalised and band-aware. Today's Adventure exists (`/today`,
`components/experience/DailyAdventure.tsx`) and is data-driven through
`lib/recommendation.ts`. The wave's "no hard-coded demo arrays" criterion appears met.
**Next step:** verify the three age presentations (3–5 / 5–7 / 7–9) actually differ on
screen rather than only in the delivery profile.

### Wave 04 — Adaptive learning ✅ strongest area

`lib/skill-graph.ts` is a validated 74-skill DAG. `lib/mastery.ts` tracks score,
confidence, evidence coverage, format variety, session spread and SM-2 review intervals.
`lib/recommendation.ts` ranks on review-due, prerequisite support, interest and format
fatigue. Six subjects. This is real and does not need rebuilding.

**Gap:** placement covers only reading, math and logic. Science, Our World and
Feelings & Friendship have skills but no placement.

### Waves 05–08 — Curriculum

The honest position, unchanged from `RELEASE_STATUS.md`: Reading has one genuine vertical
slice (Section 94). Math, Science and Logic have authored activities and skill entries but
lean on question-and-choices presentation. Wave 06 explicitly forbids "plain text question
+ four-button design as the default", and that is still the default outside Reading.

**Next step, in order of value:** Wave 06 math manipulatives (ten frames, number lines,
counters) — the widest gap between what the wave asks for and what exists.

### Wave 09 — Games, the largest gap

Eight engine kinds, mostly one-shot question renderers. No shared game loop, no pause,
no restart, no in-game difficulty ramp. Wave 09's whole premise — "a game should not
merely be a quiz with decorative graphics" — is not yet met.

### Waves 10–13

Creative Studio (10), rewards (12) and parent reports (13) are delivered to a good
standard; see the audit. Stories (11) are authored and working; **audio remains the weak
point** — browser speech synthesis is doing work the wave says it should not do alone.

### Wave 14 — Commercial hardening, started here

Error handling was the missing half of this wave and is delivered in this pass. Still
open: bundle audit, analytics event architecture, service worker, and the automated
coverage of critical flows the wave lists.

### Wave 15 — Content scale

The Supabase curriculum tables have the schema. `activityCatalogue()` already merges
authored content with the published catalogue, so the path off TypeScript modules is
open. No import tooling, no admin surface. Untouched.

## This pass

Scope chosen by one rule: **finish Wave 01 before starting Wave 02**, because every later
wave renders inside the shell Wave 01 owns, and because a route split that ships without
loading or error boundaries is a regression in reliability even while it is an improvement
in payload.

Delivered:

- Route-level loading skeletons for all fifteen explorer segments, in four shapes matched
  to what each screen actually renders, using the `.cq-skeleton` classes that already
  existed.
- A child-facing error boundary for the explorer routes, and a separate parent-facing one
  for Parent Corner carrying the error digest.
- A root `global-error` for failures above the shell, and a designed `not-found`.
- Two regressions from the route split, found while reading the segments:
  `app/(explorer)/parent/page.tsx` shadowed the selected `profile` inside
  `profiles.map()`, so **every** explorer in the family list rendered as the active one;
  and a `p.` → `profile.` rename had corrupted child-facing copy in
  `app/(explorer)/worlds/page.tsx` to "Small steps add uprofile."

Not in this pass: any curriculum content, any game engine work, Wave 02 onward.

## Recommended order from here

1. **Wave 09 game loop** — biggest gap between promise and product.
2. **Wave 06 math manipulatives** — second biggest, and the wave is explicit about it.
3. **Wave 02 auth state audit** — small, cheap, and it is the first screen anyone sees.
4. **Wave 14 remainder** — analytics events and flow tests.
5. **Wave 15 import tooling** — only once content volume actually demands it.

## Standing constraints (carried forward, do not relax)

- Do not weaken RLS, the `private` schema boundary, parent gating, or the answer-key split.
- Do not collect a child birth date, email, or location.
- Do not claim COPPA compliance. The architecture follows COPPA-style principles.
- Every pass ends green on typecheck, lint, tests, and production build.
