# CurioQuest development log

## Wave 04 struggle response — September 20, 2026

- **Nothing happened when a child kept getting an activity wrong.** `session.misses` was
  incremented on every wrong answer and read nowhere. A child could answer the same
  question wrong five times and get the identical sentence each time, while the
  three-level hint ladder in `lib/nova.ts` went unused unless they pressed "give me a
  hint". The children least likely to press it are the ones who most need it.
- `lib/scaffolding.ts` escalates that ladder automatically on repeated misses: a strategy
  to try, then the worked explanation. Thresholds come from the band, and older bands
  wait longer, because productive struggle is a stated principle and a seven-year-old
  shown the reasoning after two tries never gets to find it. A four-year-old stuck twice
  is not about to have a breakthrough on the third go.
- Two integrity properties, both covered by tests. Skill evidence is still recorded only
  on the first attempt, so nothing volunteered afterwards can flatter the mastery model.
  And level one is deliberately left as it was — the authored hint has always followed a
  wrong answer silently and uncounted, so counting it now would make every parent's help
  total jump for behaviour that did not change. Volunteered escalation starts at level 2,
  where the support is genuinely new, and is recorded as help, because help offered is
  still help used.
- The player labels volunteered help as Nova joining in rather than as the child being
  told, and says "You are still the one who answers." Nova never announces the answer; a
  test asserts her wording contains neither the answer nor a judgement.
- Verification: typecheck, lint 0 errors, 115 unit tests (106 before), production build,
  bundle guard. The nine new tests pin the ladder's shape: it never skips a level, never
  walks help back once taken, always reaches the worked explanation, and always triggers
  within five misses for every band.

## Wave 02 account screens — September 20, 2026

- The account screens were one unstyled panel with inline dimensions (`maxWidth:480`)
  and a single error string. They were the least finished surface in the product and the
  first one anybody sees.
- **States.** `lib/auth-states.ts` resolves a response or a thrown error into one of
  seven states as a pure function: submitting, confirm-your-email, reset-sent, invalid
  credentials, offline or timed out, service unavailable, expired link. Previously all
  failures read "Please try again.", which is correct advice for roughly one of them. An
  offline or timed-out request now also says that nothing was submitted, which is the
  thing a parent actually needs to know before retrying.
- **"Account already exists" is still not distinguished, on purpose.** Wave 02 lists it
  as a state. Implementing it would confirm to anyone who can type an email address that
  a particular family uses this product. The route already refuses to make that
  distinction; the resolver prefers the server's own wording so the protection cannot be
  paraphrased away by a later edit, and a test asserts that.
- **The screen.** Brand, a two-column layout that collapses to one on a phone with the
  form first, show/hide password, live length feedback phrased as progress, focus moved
  to any message so it is announced, and a resolved state that replaces the form instead
  of inviting a second submission. A panel beside the form says what CurioQuest is:
  adventures that fit the child, no child email addresses, Parent Corner behind a PIN.
- Verification: typecheck, lint 0 errors, 106 unit tests (98 before), production build,
  bundle guard. Six screen states rendered against the real stylesheets at 390/768/1440
  with no page errors, no horizontal overflow, and every input and control at or above
  44px. The render caught a duplicated "Back to sign in" on resolved screens.
- Not delivered: the onboarding sequence the wave sketches, and the "Who's learning?"
  profile selection upgrade.

## Wave 09 controls, and an answer-key leak — September 20, 2026

- **Every activity answer was in the browser.** `lib/curriculum.ts` carries each question
  together with its answer. Parent Corner imported `activityCount` from it to print one
  sentence, and because that page is a client component the import bundled all 462
  questions and answers into the route's JavaScript. `publicQuestion` was stripping
  answers from API responses exactly as the audit claims; the bundle went around that
  boundary entirely. Found by grepping the built chunks during a Wave 09 bundle look.
- Fixed with `lib/curriculum-facts.ts` (the number restated as a literal), a test that
  fails on any `"use client"` value-import of the curriculum, and
  `scripts/check-bundle.mjs` as a backstop that inspects a production build. The guard
  was run against the build from before the fix, where it fails and names the chunk, and
  after, where 35 chunks come back clean. Type-only imports are unaffected and were never
  part of this, which is why `lib/explorers` and `lib/mastery` were not implicated.
- **Wave 09 controls.** How to play, take a break, and start over are now available at
  any point in a game mission. Instructions are replayable and narrate themselves for
  audio-first bands. The break screen covers the question deliberately and stops audio; a
  child who asked to stop should not still be looking at the thing they stopped.
- **`game-restart` is a new server action.** `game-start` resumes a parked mission by
  design, so it could not serve "start over"; the new action discards the live session
  and any parked copy first. Recorded attempts, skill evidence and stars are untouched,
  so restarting is not a way for a child to erase their own history.
- **Educational integrity metadata** (`lib/game-design.ts`): a learning objective, a
  child-facing goal, how-to-play steps, skill graph ids, and a difficulty for all eleven
  games. Skills and difficulty are derived from the questions each game actually serves
  and re-verified by `tests/game-design.test.mjs`, replacing a prose skills line that
  read well and could not be checked. The Game Zone now shows fit and difficulty, and
  orders games a child can meet today first. Nothing is hidden or locked by fit.
- Verification: typecheck clean, lint 0 errors (one pre-existing `no-img-element`
  warning), 98 unit tests pass (87 before this pass), production build succeeds, and the
  bundle guard passes. The new game surfaces were rendered against the real stylesheets
  at 390/768/1440 with no page errors, no horizontal overflow, and every control at or
  above a 44px target. That check caught a `--space-7` token that does not exist, which
  was silently dropping the padding on both sheet dialogs.
- Not delivered, and this is the honest remainder of Wave 09: a shared game loop. A
  mission is still four questions answered one at a time, with no round structure, no
  in-game difficulty ramp, and no scoring arc. The controls and the metadata around the
  games are commercial quality; the loop inside them is not yet.

## Wave 01 closed — September 20, 2026

- Read the fifteen wave briefs and `COMMERCIAL-UPGRADE.md`, then reconciled them against
  the code in `docs/product/WAVE-EXECUTION-PLAN.md`. Two earlier planning documents
  described overlapping work under different names; that document is now the single map
  of where each wave stands, checked against files rather than against prior claims.
- Chose to finish Wave 01 before starting Wave 02, because every later wave renders
  inside the shell Wave 01 owns, and because the route split had shipped without loading
  or error boundaries — an improvement in payload that was a regression in reliability.
- Added route-level loading skeletons to all fifteen explorer segments
  (`components/shell/RouteSkeleton.tsx`), in four shapes matched to what each screen
  draws. The `.cq-skeleton` classes had existed in `motion.css` since the design-system
  commit and nothing had ever used them. The skeletons cover client-side navigation
  between segments; a cold load still blocks on the layout's cookie-backed auth check,
  which is recorded in the route plan so it is not reported as a fault.
- Added error boundaries: a child-facing one for the explorer routes with no technical
  vocabulary, a parent-facing one for Parent Corner carrying the error digest, a
  `global-error` for failures above the shell, and a designed `not-found` replacing the
  framework default. These use Next 16.3's `retry` prop, not the older `reset`.
- Fixed two regressions introduced by the route split in 5f44b00, both from a `p.` →
  `profile.` rename that went too far: `app/(explorer)/parent/page.tsx` shadowed the
  selected explorer inside `profiles.map()`, so every child in the family list rendered
  as the active one with a check mark; and child-facing copy in
  `app/(explorer)/worlds/page.tsx` read "Small steps add uprofile."
- Verification: typecheck clean, lint 0 errors (one pre-existing `no-img-element`
  warning), 87 unit tests pass, production build succeeds across all 34 routes. The new
  surfaces were rendered against the real stylesheets and screenshotted at 390, 768 and
  1440 px: no page errors and no horizontal overflow. That harness does not touch
  Supabase, so no family data was involved. It is a rendering check, not a check that
  the boundaries catch a real thrown error in production, and not a physical device test.
- Not touched in this pass: curriculum content, game engines, and Waves 02 onward. The
  recommended order from here is in the execution plan, and Wave 09 (games are still
  question renderers, not engines) remains the largest gap between promise and product.

## Reading Section 94 — September 18, 2026

- Read the supplied reading blueprint completely and retained it in `docs/product/READING_BLUEPRINT.md`. Implemented only the requested first vertical slice; unrelated learning areas are preserved.
- Added Reading Adventure home/navigation, playful placement, seven initial sound lessons, Letter Catch, Blend Train, Sound Boxes, Sam Sat, saved mastery/review, adaptive reading quests, and a parent reading evidence card.
- Added six additive D1 tables in migration 0004, editable content/settings records, revision-safe attempts/rewards, parent-only restart, reading-inclusive export, full-reset coherence, and cascade deletion.
- React quality review kept activity code lazy-loaded, fixed asynchronous loading behavior, and added parent loading retry. Browser testing caught and fixed Parent Corner scroll/focus restoration.
- Verification: 33 unit tests; complete isolated API suite including Section 95 Maya flow and racing completion; browser child-to-parent flow at desktop/tablet/phone viewport sizes. Type checking/build pass; no lint errors, two existing image advisories.
- Reading estimates are not validated oral-reading assessments. Device phoneme audio is prototype quality; human recordings and educator/physical-device review remain necessary. Full reading V1 and broader product gaps remain tracked in `docs/product/READING_MILESTONE.md` and `docs/product/RELEASE_STATUS.md`.

## Expansion pass — September 17, 2026

- Read the product blueprint and audited the existing React/Vinext application, D1 profile storage, ten engines, curriculum graph, recommendations, parent PIN, Team Quest, saved sessions, and test suite.
- Preserving the existing project, artwork, curriculum IDs, profiles, progress, and owner-private hosting.
- Baseline: type checking and 21 tests pass. Lint revealed existing typing/hooks errors. The Windows production preview holds build output open; stop it before rebuilding, then restart it.
- Implementation order: stability; Parent Center and assignments; Creative Studio and portfolio; audio; content/story and optional faith experiences; adaptive controls; validation.
- Architecture: retain D1 and profile revision checks. New substantial authored content and creations belong in separately indexed records, not ever-growing profile JSON. Child APIs must not expose custom quiz answers.
- Browser testing requires a connected browser. The previous session had none; reconnect and test if one becomes available. Automated checks do not replace child or educator review.

## Expansion completed — September 18, 2026

- Added the Parent Center controls, confirmed reset/deletion, curriculum/custom activity builder, immutable assignments, replay, removal, and family exports.
- Added persisted Creative Studio drawing/coloring/writing and portfolio, 25 coloring templates, 42 capital/number/warm-up tracing examples, animated demonstrations, seven tools, undo/redo, and conflict-safe saves.
- Added 21 original three-scene stories, nine science experiments (31 scenarios), nine prayer categories and saved custom prayers. Faith defaults off and is gated on the server as well as in navigation.
- Added shared optional sound/music/narration, brief completion celebrations, themed scene motion, and experiment-outcome animation. Parent reduced-motion settings remain authoritative for decoration.
- Preserved all existing games, quests, mastery, sibling missions, artwork, and profile progress. New additive migration 0003 creates indexed workspace records rather than growing profile JSON.
- Improved canvas performance with cached in-progress strokes and 300px gallery previews; artwork loads in pages of 12. Added timeout and stale-assignment recovery, capacity limits, profile ownership checks, and a story-save deletion-race guard.
- Desktop short-height navigation uses a two-column tile layout; all ten enabled destinations and Parent Corner fit at 1280×620. Phone layout verified at 390×844 without horizontal overflow. Navigation returns to the top of the new area.
- React review reduced unnecessary effect instability and preserved lazy loading of creative/story/science areas. Sites workflow retains owner-private hosting and the existing database.

### Verification evidence

- Type checking and production builds pass. Unit suite: 27 tests pass.
- Isolated integration suite passes: all 48 game missions; saved sessions; Team Quest; private answer scoring; PIN/recovery/rate limits; curated drafts; assignments; artwork revisions/pagination; every authored story scene; faith on/off; prayers; science records; schedules; resets; deletion; export.
- Chromium UI checks on an isolated test database: home/navigation, Number Kitchen correct answer, switch to Word Workshop, create/save/reload/reopen artwork, story choice and next scene, unlock Parent Corner, enable Faith & Bible and open its shelf, predict/test/explain/save a science observation. No browser page errors reported during these checks.
- In-app browser unavailable; the browser-verification skill used an isolated standalone Chromium session. No real family progress was modified by the destructive/API/browser tests. Screenshots are local ignored QA artifacts, not hosted thumbnails.
- Physical tablet/stylus, Safari, screen-reader, audio listening quality, and actual child/educator review are not yet verified. Two framework lint advisories remain for existing image elements; no lint errors.

### Remaining work / known limits

See `docs/product/RELEASE_STATUS.md` for the current acceptance checklist. Especially: full Kindergarten/Grade 2 curriculum, cross-domain adaptive quests, more sibling/world/reward content, live controlled Nova integration, screen-time budget enforcement, real offline synchronization, and multi-family onboarding/consent remain unfinished. This is an expanded private beta, not the full blueprint completed or a public production-readiness certification.
