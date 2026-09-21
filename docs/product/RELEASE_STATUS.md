# CurioQuest expansion release — September 18, 2026

The blueprint remains the source of truth. This is a substantial private-beta expansion, **not completion of every blueprint requirement**. Preserve the existing project and family database.

## Rebuild work packages (blueprint `REBUILD-BLUEPRINT.md`)

Everything below this heading supersedes the expansion notes that follow it where the
two disagree.

- **WP-00 — Clear the ground. Shipped.** The Cloudflare half of the stack (Vinext,
  Wrangler, the D1/Drizzle schema, `vite.config.ts`, `examples/`, the vendored Sites
  vite plugin) is deleted, the package is renamed to `curioquest`, and `README.md`
  describes the app that actually runs. Local D1 family progress was exported first
  (`scripts/export-legacy-d1.mjs`). Still not true: `drizzle/` holds six dead migration
  files that need deleting by hand.
- **WP-01 — The event stream. Shipped.** `public.learning_events` is append-only,
  RLS-protected, and written inside the same transaction as the profile save, so an
  answer cannot be banked without its evidence. Both answer-checking paths — the daily
  quest and the reading slice — record one row per attempt with verb, phase, support
  level, distractor, error kind and response latency. `masteryFromEvents` projects the
  same numbers the JSON blob holds, and a test pins the two together. Still not true:
  the app still *reads* the blob; switching reads over is WP-06.

  Two pre-existing faults were fixed on the way. Answering a question that existed in
  code but not yet in the published catalogue raised `Activity catalog is missing` and
  turned the save into a 503, losing the child's answer — 523 authored questions
  against roughly 390 seeded rows, so it fired intermittently. And the `runtime-classic`
  fallback lesson that the recovery path needed had never been seeded.

- **WP-02 — Tokens and the child component layer. Shipped, with one acceptance
  criterion not met; see below.** `app/tokens.css` now carries a separate child palette
  (six hues, one per world, every ink pair contrast-checked in `tests/tokens.test.mjs`
  rather than eyeballed), a type scale with a 20px floor that the band can raise, touch
  tokens that match `delivery.touchTargetPx`, and motion tokens that collapse under
  `prefers-reduced-motion`. `components/kid/` holds the six primitives the blueprint
  names — `KidButton`, `KidCard`, `SceneLayer`, `SpeechBubble`, `ProgressTrail`,
  `ObjectSlot` — plus the grey `Placeholder` that stands in for art nobody has drawn yet.
  They use tokens only: no raw colour, no px type, no `!important`, no emoji, no Lucide,
  no shadcn. `scripts/check-tokens.mjs` and `scripts/check-child-surfaces.mjs` enforce
  that, run in CI and from `pnpm test`, and carry ratchets on the legacy stylesheets:
  bytes, `!important`, raw colours and px font sizes may go down and never up.

  One real migration went with it, so the attrition path is proven rather than described:
  the speech bubble is now the child-layer component, and `.cq-bubble*` has left
  `app/cast.css`. Verified dead rules and four duplicate copies of the reduced-motion
  reset were deleted; there is now one reduced-motion contract, in `app/motion.css`.

  Numbers: `!important` 42 → 28. Legacy stylesheets 227,589B → 220,457B. **Total CSS went
  up**, because the token ramps and `app/kid.css` are additions (+27KB between them) and
  only ~7KB of old CSS could honestly be deleted — there is no dead CSS left to speak of,
  and rewriting the sixteen sheets in one pass is what WP-02 forbids. The byte count
  falls when screens move, which is WP-03 onwards; the ratchet is what makes that
  irreversible.

  Verification: `/kid-preview` (development only, 404 in production) renders every
  primitive; `scripts/shot-kid-layer.mjs` captures it at iPad landscape, iPad portrait,
  phone portrait and desktop, each with and without reduced motion, and fails on a console
  error or a touch target under the band's floor. Keyboard focus ring and the
  narration-off path were checked on the painted page. Still not true: no child screen has
  been rebuilt on the layer yet, and the drawn assets it is designed around do not exist —
  every picture is a placeholder until WP-11.

## Implemented in this expansion

- Reading Adventure Section 94 vertical slice is now implemented: playful placement, m/s/a/t/p/i/n, Letter Catch, Blend Train, Sound Boxes, a decodable tiny story, saved evidence/review, and parent progress. See [the milestone scope and verification](READING_MILESTONE.md). The broader reading blueprint is not claimed complete.

- Parent controls: age/school-grade details, subject priorities, adaptive/gentle/stretch challenge, quest length, allowed days, timezone-aware bedtime, optional faith, offline suggestions, music/narration/success preferences. Existing profile editing, avatars, interests, PIN/recovery, weekly evidence, and export remain.
- Destructive changes require an unlocked parent session and confirmation. Delete a child with their workspace records, keep at least one explorer, reset selected game/Daily Quest/chapter/skill/star/learning progress, and retain creations on a learning-only reset.
- Parent Activity Builder: curated curriculum drafts, addition/subtraction generators, custom questions/choices/hints/explanations, reusable sets, immutable assigned copies, due dates, completion badges, saved child answers, parent replay and removal. Answers are scored privately; custom quizzes do not fabricate curriculum mastery.
- Creative Studio: drawing/coloring/writing, seven tools, palette/custom colors, brush sizes, stamps, bounded flood fill, undo/redo, clear confirmation, save/copy/reopen, parent-managed portfolio, and unsaved-art navigation warnings. Twenty-five coloring templates, eight creative prompts, capital A–Z/0–9/six warm-up tracing examples, numbered starts and replay. Names/lowercase/words/sentences have dotted text guides.
- Gallery previews are smaller than editor canvases, records are paged, and live strokes use a cached base image. Canvas supports mouse/touch pointer capture and a keyboard marking alternative.
- Story Harbor: seven character/science stories, including honesty, kindness, cooperation, patience, responsibility, gratitude, boundaries, and observation. Original authored scenes, choices/consequences, narration, previous/next, replay, saved position, and themed visual environments.
- Faith & Bible: default off, hidden from normal navigation and server-gated per child. Fourteen original Bible retellings (42 scenes), references, reflections, nine original prayer categories, repeat-after-me/read-together/narrated/silent modes, and a saved family-guided prayer journal. No copyrighted translation text or licensed music copied.
- Discovery Lab: nine experiment sets / 31 object scenarios covering floating, magnets, light, plants, habitats, water changes, senses, motion, and weather. Predict → try a simplified model → observe → explain; save observations, and optional safe grown-up activities. Incorrect predictions are welcomed as evidence, not penalized.
- Shared optional sound and completion celebrations. Brief purposeful motion illustrates experiment outcomes, scene changes, and milestones; reduced-motion preferences suppress decorative animation. Original synthesized tones and device speech avoid unlicensed assets.
- Indexed D1 workspace records, capacity/input bounds, parent authorization, profile ownership, conditional revisions, conflict recovery, family export, and profile deletion cleanup. Existing curriculum, mastery, games, garden, quests, rewards, and sibling progress are preserved.

## Not yet complete / release gates

1. **Curriculum:** independent Kindergarten/Grade 2 tracks and the blueprint’s 180–200 reviewed skills are not implemented. School grade is metadata; academic tracks remain Pre-K and Grade 1. Current 324 activity configurations are not 324 distinct skills.
2. **Adaptive composition:** literacy/math/logic mastery and spaced review remain active. Science, creativity, stories, faith, and custom quizzes do not yet participate in one cross-domain adaptive Daily Quest or validated mastery model.
3. **Public product:** this is one owner-private family workspace, not multi-family SaaS onboarding, consent/legal compliance certification, subscriptions, or public registration. Do not widen access before tenancy and consent work.
4. **Content breadth:** more reviewed science domains, games/engines, story arcs, building challenges, sibling missions, rewards/pets/avatar equipment, and memory-verse activities remain. Current stories branch in feedback, not into divergent saved story graphs.
5. **Creative refinement:** detailed lowercase stroke-order teaching, handwriting assessment, pressure-sensitive stylus/zoom, rich parent-authored stories, recorded prayer/audio uploads, and professional scene illustrations/narration remain. Print-form examples are practice aids, not a prescribed school handwriting method.
6. **Controls:** total screen-time budget enforcement, granular story/Bible/prayer permissions, notification preferences, reward-frequency policies, and more comprehensive history management remain. Adventure length is an estimate, not a daily usage timer.
7. **Reliability:** genuine offline application/sync, large media storage, automated cross-browser/device UI coverage, load testing, observability/backup drills, and actual tablet/stylus/screen-reader testing remain. Collections currently cap at 100 items per child/type (and 100 reusable family sets).
8. **Learning safety:** educator/content review, family/child usability sessions, long-term mastery evaluation, and accessibility review are required before public-launch claims. Nova remains controlled authored hints, not a live AI tutor.

## Verification

Type checking, lint, unit tests, production builds, Supabase/PostgreSQL integration tests (migrations, RLS for a second family, and the real route handlers against a disposable cluster), and targeted Chromium UI checks are recorded in the development log. Browser-emulated responsive checks are not physical tablet testing. No user family data is used for automated destructive tests.
