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

- **WP-03 — The world shell. Shipped.** The dashboard is off the child's path. The shell
  is split in two: `KidShell` for children — no rail, no tab bar, no breadcrumb, no star
  counter, no explorer dropdown, one drawn door back to the map — and `GrownUpShell`
  (the old `AppShell`) for Parent Corner and first-run setup, behind the PIN gate.

  Arrival is now a drawn map. Twelve destinations are landmarks at fixed coordinates in
  `lib/navigation.ts`, each with its own silhouette, its own world hue and a spoken child
  name; the trail sits in the middle, is the largest thing on the screen, and is one touch
  to carry on with. Every other place takes two touches: the first says the name aloud and
  holds the place open, the second goes. The name is written under the picture as well as
  spoken, so the narration-off path loses nothing, and the same two presses work on a
  keyboard. Nothing reorders — position is how a child remembers where things are.

  The map is a fixed-size world (68rem x 40rem) that pans rather than reflows. At iPad
  landscape and desktop the whole map is visible; iPad portrait pans about 300px sideways;
  a phone pans and arrives centred on the trail. `scripts/shot-child-map.mjs` measures the
  painted page at four viewports across three bands and fails on any overlap, any touch
  target under the band's floor, or any console error; `tests/child-map.test.mjs` checks the
  data — separation, hue, spoken copy, one drawing per place, no reordering.

  Profile switching moved to the arrival strip as drawn buddies (no emoji on a child
  surface). The one adult control left on the child side is a small word-only "Grown-ups"
  button that opens the PIN gate.

  The map also retired the old child home component, and with it `app/wonder.css`: eighteen
  stylesheets are now sixteen legacy ones plus the token and child layers. Legacy CSS
  227,589B (WP-02 start) → 220,457B → **209,082B**; `!important` 42 → 28 → **25**; raw
  colours 1,031 → 948; px font sizes 566 → 520. The byte count WP-02 could not move on its
  own moves as soon as a screen migrates, which is what "attrition" was supposed to mean.

  Still not true: `/today` still shows a welcome screen with a button rather than resuming
  the episode straight away — that is WP-08. A quest a grown-up assigned, and the discovery
  invitation, still render below the map instead of being places on it. The place drawings
  and the buddies are provisional geometry, not art direction (WP-11). Legacy child screens
  now render inside `KidShell` and lose the old `.cq-main` entrance animation; their own
  layouts are unchanged, but they have not been walked through with a real family session on
  this branch.

- **WP-04 — Error-responsive feedback. Shipped.** Wrong answers now teach. Every wrong
  answer used to produce the same sentence — "Good thinking. Let's try another answer." —
  followed by the same authored hint, while the misconception was recorded on the event
  and then thrown away. It now decides what the child sees and what they are asked next.

  `lib/teaching-response.ts` turns an error kind into a *move*, and
  `components/learning/teaching-move.tsx` puts that move on screen: two shapes side by
  side for a visual confusion, one big button that replays the sound for an aural one,
  the sound written as it is said when a child gave the letter's name, counters to touch
  one at a time for an off-by-one slip, a visible three-second beat for a fast guess, and
  a note that a smaller step is coming when the prerequisite is missing. `not-yet-taught`
  also changes the session: one activity for the missing prerequisite is spliced in as the
  very next thing, and the item that exposed the gap is met again afterwards.

  Copy follows §C5 — every line fits the band's on-screen word budget, uses no system
  vocabulary and never delivers a verdict; a test checks all eight moves against all six
  bands. The scaffolding ladder still escalates on repeated misses, but now replaces the
  words while keeping the move, so a third b/d confusion gets more help *and* the two
  letters still side by side. The reading slice branches on the same taxonomy.

  The evidence rule (§C2) moved into `lib/evidence-rule.ts` and is now the only definition
  of mastery in the codebase: both the event projection and the JSON blob ask it. A child
  who scored 100 on five independent answers in one sitting, in one activity type, was
  previously reported as having mastered the skill — that is now `strong`, and mastery
  needs two representations, a day's spacing and two consecutive unaided answers.

  Still not true: distractor reasons are inferred from the shape of the answer, not
  authored — `lib/distractor-reasons.ts` is a mechanical first pass and every reason it
  produces is a hypothesis until WP-05 puts authored reasons in the catalogue. The
  `restate-rule` and `reorder` moves are words only, with no panel of their own. The
  detour picks the first suitable prerequisite activity rather than the best one.

- **WP-05 — Content out of the bundle. Shipped.** A lesson no longer needs a developer.
  The 78 skills and the generated item bank now live in a `content` schema in Postgres —
  523 items, 144 lessons, 428 wrong answers — and the app serves an immutable published
  *snapshot* of them rather than a TypeScript literal. `activityCatalogue()` prefers that
  snapshot, falls back to the pre-WP-05 `private.catalogs` blob, and falls back again to
  the bundle, so a database missing the new migrations still teaches. Every learning event
  now records the real catalogue version, which is what makes WP-06's item-health query
  able to compare like with like.

  Serving is gated on `reviewStatus = 'published'` twice: once when the snapshot is
  assembled in `content.cq_snapshot`, and again in `questionsFromSnapshot`, so the gate
  holds even for a snapshot loaded from a fixture or a rolled-back version. Authoring is
  an explicit grant (`content.authors`), empty on arrival — the catalogue is global, so
  being a parent is not being an author. RLS is on with no policies; everything goes
  through `public.cq_catalogue`, `cq_content_read` and `cq_content_write`, granted to
  `service_role` only, the same posture as the rest of the schema.

  The studio is at `/studio`, in a new `(grownup)` route group rather than inside the
  child shell. It browses skills → lessons → items with the filtering done in Postgres,
  edits an item beside a **live preview that renders through the real
  `ActivityEngineView`** at any of the six bands — the same component the quest player
  mounts, so an engine that gains a behaviour gains it in the preview too — and states
  what the chosen band does to that item: words against the §C5 budget, choices against
  the band's ceiling, whether Nova narrates unasked. Answering in the preview records no
  event; an author tapping through their own item is not evidence of a child learning.

  Publishing validates the **whole catalogue**, not the edited row, because an item can
  be locally valid and globally broken. `lib/catalogue/model.ts` is the single rulebook —
  Zod shapes plus graph rules for dangling skills, prerequisite cycles, published items
  inside unpublished lessons, an answer that is also a distractor, §C5 word budgets per
  band, and product vocabulary on a child surface. Errors refuse the publish and come
  back as sentences naming the row, the field and the reason; warnings do not block, and
  are stored with the version so the backlog stays countable. The seed generator runs the
  same module, so a seed that could not be published is never produced.

  The migration measured two things the bundle had only implied. **The pre-K pool is not
  written for three-year-olds** — 151 of its 256 prompts exceed the eight words §C5 allows
  on an early-preschool screen, and item reach is now a number: early-preschool 105,
  pre-K 167, kindergarten 252, grade 1 and up 267. And four prompts no band in their pool
  can hold are seeded `draft` and are no longer served until somebody rewrites them.

  Still not true: `lib/skill-graph.ts` is still a bundled literal rather than a loader
  over the same snapshot, so a *new skill* — as opposed to a new lesson or item — still
  needs a deploy. The studio has no asset upload, no episode editor and no per-field edit
  history; assets are referenced by id and must already exist. Distractor reasons are
  authored where somebody wrote one (82 of 428) and left null elsewhere rather than
  filled in with a guess, so most wrong answers still fall through to the WP-04
  inference. Publishing is not yet audited beyond `published_by` and the version notes.

- **WP-06 — Mastery from events. Shipped.** The JSON blob is no longer what the product
  believes. `profile.skillMastery` is folded out of `learning_events` on every read, so
  the recommender (which selects on it) and the parent surface (which reports it) both
  read the projection — one seam in `readAll`, plus one at the moment a quest is
  selected, rather than a change per caller. The blob is a cache:
  `node scripts/rebuild-mastery.mjs` reproduces it from the stream and writes it back,
  and `--report` compares without writing.

  One judgement, and it is not mechanical. `learning_events` began at WP-01, so a family
  who played before that holds mastery no event can reproduce. A bare projection would
  erase it from their parent report, and the product silently forgetting what a child did
  is a worse fault than the blob being unauditable. So the projection wins for every skill
  the stream reaches and the blob survives for skills it has never seen;
  `unexplainedSkills` counts the residue, the rebuild script prints it, and when it
  reaches zero the merge can go and the blob can be dropped outright.

  **Item health** (`/studio` → Item health) answers the question no score can: an item
  where wrong answers spread across the choices means children did not know, and an item
  where one distractor takes more than 60% of them means the item is teaching something
  nobody intended. `lib/insights.ts` makes three distinctions the raw percentage cannot —
  a dominant distractor *with* an authored reason is a teaching gap, one *without* is an
  authoring gap, and an item almost nobody gets right is a prompt problem rather than a
  distractor problem, so an author is not sent to fix the wrong half. Every flagged row
  opens the real editor. It aggregates across families, so it is gated on catalogue
  authorship, not on being a parent.

  **Retention** (Parent Corner → “What stayed”) reports the proportion of skills still
  correct 7, 14 or 30 days after they were first got right. Never as a bare percentage:
  §D5 forbids dressing a practice signal as an assessment, and a number with no
  denominator reads as a grade. A skill that has not come round again yet is reported as
  waiting rather than folded into either column, the slipped ones are named, and the copy
  says plainly that forgetting is how spaced practice is meant to work.

  Still not true: `learning_events` has no column for the engine an item used or its
  context tags, so the projection's *confidence* counts representation variety from a
  default rather than the real engine kind — it reads slightly low, never high, and the
  `practising`/`mastered` judgement is unaffected because all three evidence legs are
  columns. Retention is computed per child on demand rather than cached, so a family with
  a long history pays for it on the panel opening. Item health has no per-band or
  per-version breakdown, so an item rewritten in a later catalogue version still shows its
  old wrong answers mixed in.

- **WP-07 — Authored audio. Partly shipped; the recordings are outstanding.** The
  package's step 1 is "record or licence the phase-one phoneme set", which is a studio
  session rather than a code change. Steps 2 and 3 are built, and the acceptance — *no
  phoneme is ever produced by `speechSynthesis`* — is enforced today, before a single
  clip exists.

  The reason it is enforced early: a synthesiser cannot say an isolated consonant. Ask
  one for /m/ and it says "muh". That added schwa is the most common reason a child
  cannot blend — they have been taught three sounds that do not join, and "muh-a-tuh"
  never becomes "mat". The product's own parent notes already admitted this and
  synthesised anyway.

  `lib/audio-policy.ts` decides how anything is said, and a missing recording degrades to
  *teaching* rather than to a worse sound: play the clip, speak the word or sentence, or —
  for a phoneme with no recording — say nothing and show the mouth cue so a grown-up can
  make the sound. Prose with notation embedded in it is spoken with the notation removed
  rather than read out as "slash em slash". Audio is addressed by asset id and locale
  (`phoneme.sound-m.en`), so the same activity serves a second language without knowing.

  `scripts/check-audio.mjs` is what keeps it true: no phoneme may reach a speech API, only
  four files may construct an utterance, and an `AudioButton` carrying a phoneme must
  declare it. Verified by deliberately breaking each rule.

  `npm run audio:coverage` prints the recording worklist — currently 0 of 164, of which 19
  are phonemes. Those nineteen are sounds children cannot hear today; they see the mouth
  cue instead, which is the honest outcome and a better one than a wrong sound delivered
  confidently.

  Two faults were found while building it. The phoneme pattern was a hand-written list of
  IPA characters and missed every short vowel the catalogue actually uses — `/ă/`, `/ĭ/`,
  `/ŏ/`, `/ĕ/`, `/ŭ/` are written with a breve, so five of the nineteen sounds were
  invisible to both the policy and the guard. And the guard carried its own copy of that
  pattern, which is how the two drifted; there is now one definition, exported from the
  policy.

  Still not true: nothing is recorded, so phonics is currently taught by mouth cue and
  example word rather than by voice. Nova's scripted lines and the decodable word list are
  still synthesised — legitimately, since those are words and sentences — but they are on
  the same worklist and will prefer a recording the moment one exists. Preloading a
  lesson's clips is not built, because there are no clips to preload.

- **WP-11 — Art direction and motion. Foundation shipped; no child screen wears it yet.**
  Brought forward ahead of WP-08–WP-10 by a direct instruction in session. The plan is
  `docs/product/WP-11-ART-AND-MOTION.md`, written against a measurement of the running app
  rather than an opinion of it: seven image files in `public/` of which four are unmodified
  Next.js starter assets, one real illustration used once as a marketing hero, eleven map
  destinations drawn as eleven identical circles, and zero ambient motion anywhere.

  What exists now is the layer every screen will be built from, and nothing else.
  `app/tokens.css` gains two ramps it did not have: `--scene-*` for the materials a
  landscape needs (bark, stone, water, path, four depths of canopy, cloud, blossom) and
  `--cast-*` for the four characters. Both are deliberately unreachable from
  `--kid-world-*`, and a test enforces it — a grove whose trunks turn violet when the child
  walks into Story Harbour has stopped being a place. `components/kid/art/` holds the scene
  grammar (five depth planes plus a separate actors plane, parallaxed by one custom
  property), the scenery, the four cast rigs, and the celebration. `app/kid.css` animates
  them.

  Two things are worth naming because they are the parts most likely to rot. The cast share
  one rig — `cast-breathe`, `cast-blink`, `cast-mouth`, `cast-limb` — so a fifth character
  needs no new CSS. And every ambient loop is switched off by name under
  `prefers-reduced-motion` rather than by a blanket reset, because the `--kid-dur-*` tokens
  collapse to 1ms and a 24-second cloud drift at 1ms is a strobe.
  `tests/scene-layer.test.mjs` fails the build if a loop is added without being added to
  that block, which is the one defect in this package that cannot be caught by looking at
  the screen.

  Verified at iPad landscape, iPad portrait, phone portrait and desktop, with the motion
  preference on and off; screenshots in `outputs/wp11-foundation-*`. 283 tests pass.
  Ratchets unmoved: the new CSS is in `kid.css` and `tokens.css`, which sit outside the
  legacy attrition budget by design, and the sixteen legacy sheets did not gain a byte.

  One claim in an early draft of the plan was wrong and is corrected there: the dark badge
  overlapping content in the bottom-left of every screenshot is the Next.js dev-tools
  portal, not a product element, and no work is owed on it.

  Still not true — and this is most of the package: **no child-facing screen uses any of
  this yet.** The map, the activity player, Reading Grove, the treehouse, the chest and the
  rooms are exactly as they were. The emoji on `/read` and `/play`, the ALL-CAPS kickers,
  the parent-facing copy on child screens and the empty treehouse are all still there.
  `components/kid/PlaceArt.tsx` still holds the provisional geometry it describes itself as.
  The foundation is a means, and on its own it changes nothing a child sees.

- **WP-11 §3.1 — The map. Shipped.** The arrival screen is the first thing anyone sees and
  it was two flat colour bands, a CSS-ellipse sun, an arc for a ridge, and eleven
  destinations drawn as eleven identical white circles. It is now a valley across the five
  depth planes: hills and a treeline on the far plane, the ground and the five near
  landmarks on the mid plane, planting on the near plane, framing leaves at the edge, and
  Nova on the actors plane — in the picture rather than exiled to the strip below it.

  `components/kid/PlaceArt.tsx` no longer describes itself as provisional geometry. All
  thirteen places are drawn as scenery with a footprint: a grove with a hollow in the big
  tree, a harbour with a jetty, a treehouse with a lit window, a camp with a fire. They are
  built out of the scene materials — the same bark and stone as the landscape — and spend
  the world's hue only on the part that identifies the place, which is what stopped the map
  reading as thirteen coloured swatches. No rings, no white discs: each landmark sits on
  the ground with its own contact shadow.

  WP-03's behaviour is untouched, deliberately. The trail is still the biggest thing on the
  screen and still one touch; every coordinate in `lib/navigation.ts` is unchanged, because
  position is memory; the two-touch rule still says the name before it commits. Touch
  targets come from the band exactly as before.

  Parallax is driven by one custom property written from the scroll container at most once
  a frame, not by React state — re-rendering a dozen landmark buttons to move some hills is
  not a trade worth making — and `--scene-parallax` resolving to 0 switches it off without
  that code knowing.

  Four collisions were found by looking at the rendered screen rather than the markup, and
  all four were the kind only a screenshot catches: the foreground leaf drew straight across
  the Reading Grove's name, the near-plane planting covered two landmarks, the treehouse
  roof had no fill defined and rendered black, and Nova sat on top of the trail's label
  because a character sizes itself from `--cast-size` and ignores a percentage on its
  wrapper. Scenery now lives in the four channels between the landmark coordinates, and the
  control planes sit above the scenery — a bush drawn in front of a landmark is correct
  perspective and an unreachable button.

  Verified at four viewports, with reduced motion on and off, and by walking the two-touch
  path. 283 tests pass. Ratchets unmoved.

  Still not true: every other child screen. The activity player is next.

- **WP-11 §3.2 — The activity screen. Shipped, with the engines' interiors still to do.**
  The screen every session is spent on, and the last one in the product still styled by
  `app/globals.css`: one minified line, raw hex, 12 and 13px labels, an ALL-CAPS category
  kicker, and a grey slab behind the letter a child was trying to read.

  The work now happens inside the world it belongs to — the same scene planes as the map,
  behind a veil of one known opacity so the contrast of everything in front of it is a
  single measurable number rather than thirteen hand-paled guesses. The prompt moved into
  Nova's speech bubble and she is on screen saying it; she celebrates a right answer,
  leans in to explain a wrong one, and offers help when a child has stalled. The progress
  dots became the trail, and the drawn door replaced the back arrow.

  Three things were removed from the child's view rather than restyled, because they were
  written for an adult (§C5): the ALL-CAPS world kicker, `We are practising: <skill name>`,
  and the round counter and star pill. Stars are stated once at the end of a run and appear
  on no other child surface (§D9). All of it still exists for grown-ups on the parent side,
  which is where a sentence about what a child is practising is actually useful.

  The sixteen engines keep their mechanics untouched — they are the strongest existing work
  in the repo. What they gained is weight: every tappable thing in the player now has a lip
  that gives under a press, one focus ring that is visible on the scene as well as on paper,
  and a shared chosen state in the world's colour instead of three near-misses of it. Their
  small print — labels at 9, 11 and 12px in `app/games.css`, on the text that says what a
  control does — is lifted to the band's floor.

  A right answer pulses once and stops. A wrong answer does not shake, flash red or buzz:
  the chosen option settles and WP-04's teaching move plays.

  The legacy `.activity` and `.answers` rules are deliberately **not** deleted.
  `components/studio/live-preview.tsx` and `components/learning/parent-quests.tsx` still
  render them, and the studio's whole job is to show an item exactly as the child sees it —
  those move together or not at all. `app/kid.css` loads last, so the child's player wins
  without an `!important`.

  Verified by playing: a matching mission and a multiple-choice mission from the Game Zone,
  including the wrong-answer path. Screenshots in `outputs/wp11-activity-*`. 283 tests pass.

  One test of this package's own was wrong and is fixed here: the reduced-motion check
  sliced `app/kid.css` at the *last* occurrence of the media query, which worked until this
  screen added a second one, after which it silently asked whether the scene's loops were
  mentioned inside the activity's block. It matches braces now.

  Still not true: the engines' interiors. The robot grid, the sorting trays and the pattern
  strips still draw their objects as emoji, because the emoji are in the content rows rather
  than in the components — replacing them needs a drawn object per item, which is a content
  job and not a styling one. The reading slice does not use this player at all and is
  unchanged.

- **WP-11 §3.3 — The Reading Grove. Shipped.** Reading is the spine (§D2), so this is the
  screen a child on the reading trail sees every day, and it was a marketing landing page:
  an ALL-CAPS kicker, a three-line headline — "A sound. A word. A whole new world." — a
  subhead, a call to action, and five stage cards illustrated with 👂 🏡 🚂 🧩 📖. A
  four-year-old who cannot read arrived at a pitch written for their parent.

  It is now the grove. Five drawn stations stand along a path through the trees in the
  order a child walks them — a hollow log with sound coming out of it, a village of little
  houses, a plank bridge, a workbench with letter blocks, an open book on a stump — and the
  path is lit exactly as far as the child has been. Nova waves and says one short line.
  There is one thing to touch.

  Stations a child has not reached are not hidden, greyed or padlocked: they are simply
  further away, which is the same language the `far` plane already speaks. A grove missing
  two of its five places is a shorter grove, and a padlock is a promise that something is
  being withheld.

  The session view reuses the activity frame from §3.2 — the drawn door, the progress
  trail, Nova asking in her bubble, the scene behind a veil — so walking from the grove into
  a lesson stays in one place. `LetterCatch` lost its `LETTER VILLAGE` kicker, its 👂 (now
  the drawn listening hollow), and the heading that repeated in different words what Nova
  had just asked, which put two instructions in front of a child at once and went over the
  band's on-screen word budget.

  Every line of the data flow is unchanged: `fetchReading`, `act`, revision handling, the
  four-step help ladder, the skip path, placement. `LetterCatch`, `BlendTrain`, `SoundBoxes`
  and `DecodableReader` keep their mechanics exactly; their controls gained the same
  physical press as the other engines.

  The path zig-zags on a phone rather than climbing one diagonal. At 390px the stations are
  about 55px apart and their names are wider than the stations they label, so five names up
  one diagonal overlap into a pile. Alternating sides gives every name a half of the picture.
  The alternative was shrinking the type below the band's floor, which is the one thing on a
  child surface that is not available.

  **The ratchet moved for the first time since WP-03.** `.reading-hero*` and `.reading-map*`
  left `app/reading.css` with the screen that used them: legacy stylesheets 209,082B →
  **206,664B**, raw colours 948 → 932, px font sizes 520 → 509. Budgets lowered in the same
  commit, as the check requires.

  Verified by playing the grove and a letter-catch session at four viewports.
  Screenshots in `outputs/wp11-grove-*` and `outputs/wp11-reading-session.png`. 283 tests
  pass, build clean.

  Still not true: the word shelf still shows the content's own emoji beside each word,
  because those live in the catalogue rows rather than in a component — replacing them needs
  a drawn picture per word, which is content work. ALL-CAPS kickers survive on the Creative
  Studio, the Game Zone's help panels, the story passages and the discovery invitation; they
  go with the rooms pass.

- **WP-11 §3.4 — My Treehouse, and the reward objects. Shipped.** This was the biggest
  emotional miss in the product. The screen that is meant to *be* a child's progress (§D9,
  WP-09) was two flat colour bands, one white ellipse for a cloud, Nova standing in a void
  and three text cards: a child who had earned nothing and a child who had earned everything
  saw very nearly the same screen.

  It is a room now — plank walls, roof beams, floorboards, a rug, a shelf, a desk, and a
  window onto the same valley the map is set in, drawn with the same hills and canopy
  colours so a child can see their room is *in* the world they have been walking around.
  The three places something can go are places in that room rather than cards under it, and
  an empty one reads as empty: a drawn outline of the shape that would sit there, with no
  padlock and no number.

  **The eight reward objects are drawn.** They were Lucide icons — a 1.6px grey stroke in a
  24px box, the same weight as the glyphs in a settings menu — inside a gold frame that
  existed to help them read as treasure. A rolled map tied with a ribbon, a book with a
  ribbon marker, a seedling in a pot, a globe on a stand, a stone bridge, a small creature,
  a crescent moon, a little robot. The frame is gone with them: a box around a child's own
  possession is just a box.

  There are still three slots — wall, shelf, desk — because that is what the server accepts
  and what every existing family's saved placements refer to. Whether a treehouse should
  fill with more than three things is WP-09's decision; adding slots here would be a data
  change wearing a paint job.

  A real bug fell out of the migration. The legacy `.spot-desk` rule set `right: 13%` while
  the new rule set `inset-inline-start`, so the desk's slot was positioned by both at once
  and landed off the desk entirely. Deleting the dead rules fixed it — which is the argument
  for attrition rather than for layering new CSS on top of old.

  **Ratchet:** legacy stylesheets 206,664B → **202,512B**, raw colours 932 → 878, px font
  sizes 509 → 498. `app/experience.css` lost 51 rules with the screens that used them.

  Verified at iPad landscape; `outputs/wp11-treehouse.png`. 283 tests pass, build clean.

  Still not true: the filled state is verified only by reading the code, because the
  verification account has no earned objects and seeding one is a content change. The
  Treasure Chest (§3.5) is untouched — still eight white cards with grey Lucide icons and
  "0 of 20" — and the Central Plaza tab above the treehouse is still the old card layout.
  Both go with the rooms.

- **WP-11 §3.5–§3.6 — The rooms and the Treasure Chest. Shipped, with a named tail.**
  The eight secondary rooms are on the freeze list (§F) and receive no new investment;
  what they get here is the visual floor.

  **One change covers all of them.** `KidShell` now paints the world behind every child
  route — sky, hills and ground in the destination's own hue, behind a veil of one known
  opacity. A child who touches the harbour on the map and lands on a white page with cards
  on it has not gone anywhere; landing in the harbour's own light is the colour telling a
  pre-reader where they are before they can read where they are. Surfaces that compose the
  full five planes themselves — the map, the Reading Grove, the activity player — skip it.

  **Twenty-five ALL-CAPS kickers are gone** from sixteen child components, along with the
  marketing lines above them: `THE CURIOSITY PLAYGROUND`, `MIRA'S CREATIVE STUDIO`,
  `NOVA'S STORY ADVENTURE`, `CURIOQUEST ORIGINAL · INTERACTIVE STORY`, `HOW TO PLAY`,
  `SOUND BRIDGE`, `WORD WORKSHOP` and the rest. The ones that survive are real labels on
  rooms that have not been redesigned, and `.eyebrow` inside `KidShell` is now quietened
  rather than shouted: sentence case, no tracking, and at the band's type floor instead of
  12px. `app/motion.css` was uppercasing all of them in CSS, which is why several looked
  like shouting that was not in the source.

  **The Treasure Chest is a chest.** It was eight white cards with grey Lucide strokes,
  two dashboard stat tiles and "0 of 20". The head of the screen is now a drawn chest,
  open, with its own light coming out of it — which does the job the kicker, the heading
  and the sentence were doing between them. The seventeen achievement icons are six drawn
  award marks (a medal, a wreath, a key, a gem, a feather, a summit flag) mapped by what
  each achievement is about. That is a deliberate trade: every card already carries its own
  name and sentence, and six good marks beat seventeen thin ones until there is an
  illustrator. Unearned ones are the same drawing drained of colour — never a padlock,
  which says "withheld" rather than "not yet".

  Verified: `/play`, `/create`, `/science`, `/stories` and `/rewards` at iPad landscape.
  `outputs/wp11-chest.png`, `outputs/wp11-room-create.png`. 283 tests pass, build clean.

  **Still not true, counted rather than hand-waved.** Roughly 650 emoji remain in the
  *content* files — `lib/reading/content.ts` alone has 143, `lib/content/science-investigations.ts`
  127, `lib/story-library.ts` 93 — and about 30 remain in components where they are
  functional rather than decorative: the Creative Studio's stamp palette, the robot grid's
  pieces, the per-game icons the Game Zone reads from `lib/arcade.ts`. Replacing those
  needs a drawn asset per content row, which is a content project and not a styling one.
  §A's ban on emoji as artwork is therefore **not yet met**, and saying otherwise because
  the obvious ones are gone would be the kind of claim §G exists to prevent.

- **WP-11 §3.7–§3.9 — Today's trail and the adult surfaces. Shipped; the package is
  complete.** `/today` keeps its start button and gets the visual floor: the drawn
  door in place of a text back-link, the world behind it, sentence case where three
  ALL-CAPS strings were hard-coded in the markup, and the step trail's labels lifted from
  11px to the band's size — they are the text that says where a child is.

  **One scope correction, recorded in the plan.** §3.7 originally said this screen should
  *become nothing*: that arrival should resume into the first item, because a decision
  placed in front of a five-year-old before learning starts is a regression (§0). That is
  still right, and it is still not this package's to do — it changes *when a session
  begins*, not how it looks, and it is WP-08's first acceptance criterion. Doing it here
  would have been a flow decision smuggled in under a paint job.

  The sign-in screen is the only surface a parent judges before they have an account, and
  the one place in the product where a tagline would be correct. It had one anyway, in
  capitals, above three text blocks explaining that CurioQuest is a learning world. The
  tagline is replaced by the world: one scene with Nova and Pip in it, the same valley and
  the same drawing rules as everything behind the sign-in. Parent Corner, the account
  screens and the studio are untouched — they are meant to read as a calm, familiar
  application (§D7), and this package has no business repainting them.

  283 tests pass, build clean. `outputs/wp11-auth.png`, `outputs/wp11-today.png`.

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
