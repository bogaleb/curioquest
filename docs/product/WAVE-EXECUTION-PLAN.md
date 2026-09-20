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
| 01 Foundation | Phase 1 + 3 + parts of 4 | ✅ complete |
| 02 Entry experience | — | Screens and states done; onboarding open |
| 03 Child home | Phase 1 (home) | Partly done |
| 04 Adaptive learning | Pre-existing core + Phase 2 | Strongest area; struggle response added |
| 05 Reading | Reading Section 94 slice | Vertical slice only |
| 06 Math | — | Manipulatives landed; band depth open |
| 07 Science | Phase 2 (subject added) | Discovery Lab exists, quiz-shaped |
| 08 Logic | Phase 2 (subject added) | Skills exist, few formats |
| 09 Games | Phase 4 | ✅ engines, controls, metadata and the mission loop |
| 10 Creative studio | Phase 1 (immersive) | Done to a good standard |
| 11 Stories / video / discovery | — | Stories done, audio is prototype |
| 12 Rewards | Phase 5 | Done |
| 13 Parent experience | Phase 6 | Done |
| 14 Commercial hardening | Phase 7 | Error handling and answer-key leak fixed; rest open |
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

### Wave 02 — Entry experience (partial)

The audit found the account screens were a single unstyled panel carrying inline
dimensions — the least finished surface in the product, and the first one anybody sees.

**Delivered 2026-09-20:**

- **States, resolved honestly** (`lib/auth-states.ts`). The form collapsed every failure
  into "Please try again." A parent whose wifi had dropped, a parent who mistyped a
  password, and a parent whose account service was down all read the same sentence, and
  it was useful advice for one of them. Seven states are now told apart: submitting,
  confirm-your-email, reset-sent, invalid credentials, offline or timed out, service
  unavailable, and expired link. Pure functions, covered by `tests/auth-states.test.mjs`.
- **"Account already exists" is deliberately still not distinguished.** Wave 02 lists it,
  and implementing it would confirm to anyone who can type an email address that a
  specific family uses this product. `app/auth/session/route.ts` already refuses to make
  that distinction. The state resolver prefers the server's own wording precisely so
  nobody paraphrases that protection away later.
- **A designed screen.** Brand, two-column layout collapsing to one on a phone with the
  form first, show/hide password, live length feedback, focus moved to any message so a
  screen reader announces it, and a success state that replaces the form rather than
  leaving it open to a second submission that cannot help.
- **What this is, next to the form.** Adventures that fit the child, children never need
  an email address, and Parent Corner behind a PIN — which is the wave's "parents are in
  control" without a marketing page.

**Still open:** the onboarding sequence itself (the wave sketches ten steps) and the
"Who's learning?" profile selection upgrade.

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

**Closed 2026-09-20 — adaptation when a child struggles.** The wave's rule is explicit:
on repeated struggle, increase scaffolding and add worked examples. Nothing did.
`session.misses` was incremented on every wrong answer and never read anywhere, so a
child could answer the same activity wrong five times and receive the identical sentence
each time, while the three-level hint ladder in `lib/nova.ts` stayed unused unless they
knew to press "give me a hint" — which the children who most need it are least likely to
do. `lib/scaffolding.ts` now escalates that ladder automatically, and later for older
bands than younger ones, because productive struggle is a principle and a seven-year-old
shown the reasoning after two tries never gets to find it.

Two integrity properties, both tested: evidence is still captured from the first attempt
only, so volunteered help cannot flatter the mastery model; and level one is left exactly
as it was, silent and uncounted, so no parent's help total jumps for a behaviour that did
not change.

**Gap:** placement covers only reading, math and logic. Science, Our World and
Feelings & Friendship have skills but no placement.

### Waves 05–08 — Curriculum

The honest position, unchanged from `RELEASE_STATUS.md`: Reading has one genuine vertical
slice (Section 94). Math, Science and Logic have authored activities and skill entries but
lean on question-and-choices presentation. Wave 06 explicitly forbids "plain text question
+ four-button design as the default", and that is still the default outside Reading.

**Wave 06 closed 2026-09-20 — math manipulatives.** All 36 math activities in the core
curriculum were `number-choice`: a sentence with three numbers under it. Four engines
replaced that as the default — an open number line the child hops along, a part–part–whole
bond, a place-value mat, and an array builder — plus 39 authored activities in
`lib/content/math-models.ts`. Math is now 145 of 183 activities modelled.

Two design properties worth keeping:

- **The bond and the mat validate themselves.** A bond is correct exactly when its parts
  make its whole, and the mat refuses ten or more loose ones. Neither compares against an
  authored string, so the content cannot drift away from the scoring. A test authors a
  deliberately wrong answer and asserts the engine ignores it.
- **Nothing is hidden that the prompt does not ask for.** `place-value` and
  `array-builder` carry their target in the engine, because the child is asked to *build*
  a stated number or shape rather than guess a hidden one. A test asserts the prompt
  states it, so that stays true.

**Still open for Wave 06:** the wave describes seven age bands from 3–4 through Grade 3,
and the content pools are still only `prek` and `grade1`. Expanding `ContentBand` touches
the skill graph, placement, the arcade and mastery, so it is its own wave rather than a
loose end of this one. Reading (05), Science (07) and Logic (08) remain
question-and-choices outside their own slices.

### Wave 09 — Games (partial)

Eleven games run on eleven interaction engines — ten frame, route, matching, ordering,
counting, sorting, memory, word builder, bubble pop, balance, constellation. The engines
themselves are better than the earlier audit gave them credit for: they are real
manipulatives, not four buttons with pictures.

What was missing was everything *around* them.

**Delivered 2026-09-20:**

- **The controls the wave lists.** How to play, take a break, and start over, reachable
  at any point in a mission (`components/learning/game-controls.tsx`). Instructions are
  replayable, narrate themselves for audio-first bands, and describe the real mechanic
  rather than the theme. Exit and full screen already existed in the player header.
- **Start over is a real server action.** `game-start` deliberately *resumes* a parked
  mission, so restart could not reuse it; `game-restart` discards the live session and
  any parked copy first. Recorded attempts, skill evidence and stars are untouched — a
  child cannot erase their own history by pressing a button.
- **Educational integrity metadata** (`lib/game-design.ts`). Every game now declares a
  learning objective, a child-facing goal, how-to-play steps, its skill graph ids, and a
  difficulty. Skills and difficulty are *derived from the questions each game actually
  serves* and re-checked by `tests/game-design.test.mjs`, so the Game Zone cannot
  describe a game it no longer is. This replaced a prose line — "Letter knowledge ·
  blending · spelling" — that read well and could not be checked.
- **Band-aware ordering.** Games a child can meet today sort first. Nothing is hidden
  and nothing is locked by fit: a warm-up is spaced practice, not a demotion.

**Closed 2026-09-20 — the shared mission loop** (`lib/game-loop.ts`). The mechanic was
"answer four questions, one at a time", in authored order, for a flat
`questions.length * 2` stars regardless of how it went. Three things replaced that, all
pure functions over data the session already carried:

- **A difficulty ramp.** Missions open with their gentlest question and build. Weighted
  by skill difficulty first, then by what the engine spec says is hard — a whole Robot
  Commander mission is one skill, so only the engine can tell a two-move delivery from a
  six-move one through rocks. 17 of 66 missions genuinely reorder. The other 49 are
  genuinely flat and are left alone; a stable sort means equal weights keep their
  authored order rather than being shuffled for the appearance of adaptivity.
- **Rounds.** Round length comes from the band, so the youngest four bands get a breather
  at the halfway mark of a four-question mission and the oldest two play straight
  through. `roundSizes` evens rounds out rather than packing them, because a final round
  of one question is a straggler, not a round.
- **A scoring arc.** Every solved question scores: most for first-try and unaided, less
  for helped, least but never zero for getting there after wrong answers. Points and a
  live streak are visible while playing; a rank lands on the completion screen.

**The star floor is deliberate and tested.** The base award is still `total * 2`, so the
arc can only ever add. Tying the existing reward to performance would have made every
hard-won mission pay less than it used to, in a product whose premise is that trying
again is the point. A test pins that floor at every mission length, and another asserts
no rank reads as a verdict.

**Still open:** the engines themselves are eleven good manipulatives, but the wave's
engine list is longer than eleven. Adding more is content work, not framework work — the
framework criterion is met.

### Waves 10–13

Creative Studio (10), rewards (12) and parent reports (13) are delivered to a good
standard; see the audit. Stories (11) are authored and working; **audio remains the weak
point** — browser speech synthesis is doing work the wave says it should not do alone.

### Wave 14 — Commercial hardening (partial)

Error handling was delivered with Wave 01. A bundle audit then found something worse
than a performance problem: **every question and its answer was in the client bundle**,
because Parent Corner imported `activityCount` from `lib/curriculum.ts` to print one
sentence. Fixed 2026-09-20 with `lib/curriculum-facts.ts`, a test that fails on any
`"use client"` value-import of the curriculum, and `scripts/check-bundle.mjs` as a
backstop against a production build.

Still open: analytics event architecture, service worker, and the automated coverage of
critical flows the wave lists.

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

1. **Content bands** — the largest remaining gap in the whole plan. Waves 05–08 each
   describe seven age bands; the content pools are two. The engines now exist to carry
   more granular content, so this is authoring plus a `ContentBand` widening, and it
   unlocks the age-adaptation criterion across four waves at once.
2. **Waves 07 and 08 engines** — Science and Logic are still question-and-choices. The
   math engines are the model to follow; several are subject-neutral already.
3. **Wave 02 onboarding** — the account screens are done; the add-child sequence and
   profile selection are not.
4. **Wave 14 remainder** — analytics events and flow tests.
5. **Wave 15 import tooling** — only once content volume actually demands it.

Done and no longer on this list: Wave 09's mission loop and Wave 06's math
manipulatives (both 2026-09-20).

## Standing constraints (carried forward, do not relax)

- Do not weaken RLS, the `private` schema boundary, parent gating, or the answer-key split.
- Do not collect a child birth date, email, or location.
- Do not claim COPPA compliance. The architecture follows COPPA-style principles.
- Every pass ends green on typecheck, lint, tests, and production build.
