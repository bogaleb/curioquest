# WP-11 — Art direction and motion

**Status:** active. **Created:** 2026-09-21.
**Authority:** a direct user instruction in session (blueprint precedence #1) brought WP-11
forward ahead of WP-08–WP-10. Everything in `REBUILD-BLUEPRINT.md` §A (non-negotiables),
§B (locked decisions) and §C (contracts) still binds this package without exception.

This file is the plan for one thing: **what a child sees, and how it moves.** It does not
change what is taught, what is recorded, or what the server decides.

---

## §0 The measurement

Not opinion. This is what the running app does today, captured at iPad landscape
(1180×820) by driving a real browser through sign-in and into each route.

| Measured | Value |
| --- | --- |
| Image assets in `public/` | **7** — and 4 of those are unmodified Next.js starter files (`file.svg`, `globe.svg`, `window.svg`, `favicon.svg`) |
| Actual illustrations | **1** (`game-zone.png`), used once, as a marketing hero, behind text |
| Child destinations on the arrival map | **11**, all drawn as the same circle, at the same size, in the same weight |
| Ambient/idle animation on any child screen | **0** |
| Screens where the activity player is styled by minified legacy CSS with raw hex and 12–15px type | **all of them** (`globals.css` `.activity`, `.answers`, `.celebration`) |

Six specific failures, each traceable to a screenshot:

1. **There is no artwork.** `components/kid/PlaceArt.tsx` says so in its own header: *"This
   is provisional geometry, not the art direction."* Eleven 64×64 flat shapes in eleven
   identical rings. A child learns position, but nothing on the screen is a *place*.

2. **The map is a diagram, not a world.** Two flat colour bands, one CSS ellipse for a sun,
   one arc for a ridge. No horizon, no depth planes, no parallax, nothing alive. Compare
   the one real illustration the product already owns (`game-zone.png`): that is the
   register this app is supposed to be in, and it appears on exactly one screen.

3. **Child surfaces still carry emoji and icon-library glyphs as artwork.** `/read` ships
   👂 🏠 🚂 🧩 📖 as its five stage cards; `/play` ships 🎮; `parent-quests.tsx` ships 🎒 🌟 🏅.
   `/rewards` is eight white cards with grey Lucide strokes. Both are explicitly banned
   (§A, §G) and both have quietly shipped.

4. **Copy written for a parent, on screens built for a four-year-old.** ALL-CAPS kickers
   on every route (`TODAY'S ADVENTURE`, `NOVA'S READING ADVENTURE`, `THE CURIOSITY
   PLAYGROUND`, `LOOK HOW FAR YOU HAVE COME`), product taglines, and metrics like
   "11 game collections · 33 short missions". §C5 bans all of it and caps band 4–5 at
   12 words on screen; `/play`'s hero alone runs past 30.

5. **My World — the screen that is meant to *be* the child's progress — is empty.** Two
   colour bands, one white ellipse, Nova standing in a void, three text cards. A child
   cannot see a single thing they have earned.

6. **Motion is reaction only.** Press states and entrance fades exist and are good. There
   is no ambient life, no travel between places, no choreographed celebration, and no
   character performance. The app never moves unless it is answering a tap.

One thing that looked like a bug and is not: the dark badge overlapping content in the
bottom-left corner of every captured screen is the Next.js dev-tools portal
(`<nextjs-portal>`, confirmed by hit-testing that point), not a product element. It does
not exist in a production build. No work is owed on it.

### Why the last attempt failed, and why this one is shaped differently

Commit `4d5dbc8` (Aurora) repainted the app dark, glassy and neon, and was reverted
wholesale in `0da0700`: *"the warm forest-and-cream identity the app already had was not
the thing holding it back."* That was the correct call, and it is the premise here.

**The identity is not the problem. The absence of illustration and life is.** This package
adds a world inside the palette the product already has. It changes no brand colour, no
type family, and no layout grammar on the grown-up side.

---

## §1 The direction

> **Every child surface is a place with depth, weather and inhabitants — drawn, not
> decorated.**

Three rules that settle the arguments this package will produce:

- **Scenes, not cards.** A child screen is a landscape with layered depth. A card is what
  a grown-up reads. Where a card survives on a child surface, it is an object sitting *in*
  the scene, not a panel floating above a background.
- **Motion is life, arrival and reaction — never decoration, and never a wait.** Something
  on screen may breathe. Nothing a child has to read may animate into place.
- **Art carries the meaning; the label is the redundant channel.** A place is
  recognisable as a silhouette at thumbnail size, with the text removed. If it is not, the
  drawing is not finished.

### Produced how

Hand-authored **flat-vector scenes as SVG components** under `components/kid/art/`.
Decided in session over painted rasters, because vector:

- is themeable — a world's hue resolves from `--kid-world-*`, so one scene component
  serves six worlds without six files;
- is animatable per part — a canopy sways while the trunk does not;
- costs kilobytes, which keeps the arrival budget (§C-below, 300 KB) reachable;
- carries no baked-in text, so localisation stays cheap (§WP-11.3).

`game-zone.png` stays as the one painted establishing image it already is. No new rasters.

### The one film, and why it is the only one

`public/media/welcome-nova.mp4` is nine seconds of 3D animation on the sign-in page: an
empty stone path under floating books, planets and numbers, then Nova walks in, waves, and
stands. It is cut from a thirty-second clip the product owner generated with Gemini and
added to the repository, trimmed to 21.0s–30.0s and re-encoded from 13 MB to 1.7 MB.

**It is the only moving image in the product, and it is on a parent-facing surface only.**
Two reasons, and both are rules this package has been applying everywhere else:

- **Register.** The clip is rendered in 3D; everything else here is flat vector. Those can
  share a *marketing* surface — a poster has never had to look like the thing it
  advertises — but not a child's screen.
- **Cast.** The source clip's first twenty seconds feature a yellow robot and a purple
  monster who are not Pip and not Bramble. Putting them in front of a four-year-old would
  teach a second cast alongside the authored four (§2.3), which is the confusion the
  one-cast rule exists to prevent. The cut contains neither of them — only Nova.

The second clip the owner supplied (`gemini_generated_video_89DDDAB4.mp4`, ten seconds) is
**not used**: apart from about a second and a half of character-free rainbow arches, it is
the robot and the monster throughout, and rainbow arches are not in this product's visual
world either. Using it as decoration would break §4's first rule.

Provenance is worth recording rather than hiding: the asset is generative-model output,
it carries the generator's visible watermark in the lower-right corner, and the watermark
is deliberately left in place. Note that blueprint §A bans **live** generative output shown
to a child — this is neither live nor shown to a child, but it is close enough to the line
that it should be a decision someone made on purpose rather than one that drifted in.

---

## §2 Foundation

Built first, in one commit, because every surface in §3 depends on it. Nothing in §3
starts until this passes §5.

### 2.1 The scene palette (`app/tokens.css`)

The child ramp is six world hues and a surface. A landscape needs material colours those
ramps do not contain: bark, stone, water, path, three depths of canopy, cloud, blossom.
These are added as a **scene ramp** — `--scene-*` — kept separate from the world hues, so
a world can recolour without turning the trees blue.

Rules carried from §A: no raw hex outside `tokens.css`, contrast verified against the
actually-painted background, and every value added is checked by `tests/tokens.test.mjs`.

### 2.2 Scene grammar (`components/kid/art/Scene.tsx`, `app/kid.css`)

Five depth planes, fixed order, fixed meaning. A surface composes them; it never invents
a sixth.

| Plane | Holds | Parallax | Ambient |
| --- | --- | --- | --- |
| `sky` | gradient, sun/moon, cloud drift | 0.0 | clouds drift, very slow |
| `far` | horizon ridges, distant canopy | 0.15 | none |
| `mid` | the landmarks a child touches | 0.4 | per-landmark idle |
| `near` | ground, path, foliage the child walks past | 0.7 | grass sway |
| `fore` | framing leaves, depth-of-field edge | 1.0 | slow sway |
| `actors` | cast and speech — above the scene, never inside it | — | breathe, blink, talk |

`SceneLayer` already exists and is kept; it gains the plane contract and the parallax
custom property. Parallax is driven by one CSS custom property set on the scroll
container, not by a scroll listener per layer.

### 2.3 The cast (`components/kid/art/cast/`)

§WP-11.1 asks for four. Nova (fox, guide) and Pip (robot, small) exist as CSS puppets and
are re-drawn as SVG rigs. Added: **Wren**, a peer who gets things wrong first so the child
is not the only one who does, and **Bramble**, the friction character — an obstacle with a
face, never a villain and never disappointed in the child.

One rig contract for all four, so a surface animates a character without knowing which:

```ts
type CastRig = { who: CastMember; state: NovaState; talking: boolean; facing: "left" | "right"; scale: "small" | "normal" | "large" };
```

States: `idle | explain | point | think | celebrate | dance | oops`. `oops` is new and is
Bramble's and Wren's; Nova never performs disappointment at a child.

The existing `useSpeakingCast` / `speak` / `onStart` / `onEnd` lifecycle is unchanged —
mouths keep working, and WP-07's authored audio keeps driving them.

### 2.4 The motion layer (`app/kid-motion.css`, `lib/kid-motion.ts`)

Dependency-free. Three mechanisms, in order of preference:

1. **CSS** for everything ambient and reactive.
2. **React `ViewTransition`** (React 19 / Next 16 App Router, no config, no dependency) for
   travel between places — the shared-element morph of a map landmark into the room it
   opens. `router.push` is already a transition, so this activates without rewriting
   navigation.
3. **Web Animations API**, only for celebration choreography, where a sequence needs
   timing a stylesheet cannot express.

Durations and curves come from the existing `--kid-dur-*` / `--kid-ease-*` tokens. New:
`--kid-dur-ambient` (slow loops) and `--scene-parallax` (the plane multiplier).

**Reduced motion is a complete path, not a disabled one** (§C6.4). Ambient loops stop.
Parallax resolves to zero. Travel becomes an instant cut. Celebration becomes a single
held state — the reward object simply *is* in the treehouse, drawn, with its name spoken.
The screens must read as finished, not frozen.

### 2.5 Celebration (`components/kid/art/Celebration.tsx`)

Replaces `.celebration` — a 135px CSS circle in minified legacy CSS. One choreographed
sequence, four beats, ~1.6s total, skippable by any tap:

1. **Land** (0–200ms) — the answer settles, the world holds still.
2. **Grant** (200–700ms) — the reward object is drawn *into* the scene, travelling from
   where the work happened.
3. **Perform** (400–1100ms) — the cast reacts; Nova's is a nod and a tail flick, not a
   fireworks display.
4. **Rest** (1100–1600ms) — everything stops. Nothing loops behind the next question.

Carried from `4d5dbc8`, which got this right: *"a right answer pulses once and stops — a
child who got it right is about to move on, and something still moving behind the next
question competes with it."*

---

## §3 Surface by surface

Every child route, plus the adult surfaces that are visibly unfinished. Each entry is:
what it is now → what it becomes → what moves.

### 3.1 Arrival — the map (`/`) · `ChildMap.tsx`

**Now:** two colour bands, a CSS-ellipse sun, an arc ridge, eleven identical circles.

**Becomes** a drawn valley across all five planes. Each place is a landmark with its own
silhouette and footprint, sitting *on* the ground with contact shadow — a grove of layered
canopy, a harbour with a jetty and water, a treehouse in a real tree. The trail is a
drawn path through the scene, and it is the largest thing on screen.

The eleven drop to **five primary landmarks plus the trail** in the foreground band, as
§WP-03.2 already specifies. The six secondary places move to the far plane as small
distant silhouettes — visibly there, reachable, not competing. Position is unchanged:
every `place.x` / `place.y` in `lib/navigation.ts` stays exactly as it is. Position is
memory (§WP-03 "Do not").

**Moves:** clouds drift; canopy and grass sway; water glints; the trail's stepping stones
carry a slow travelling highlight toward the trailhead, which is the only motion on the
screen that points anywhere. Touching a place: the landmark lifts and its name is spoken
(first touch, unchanged), then morphs into the room via `ViewTransition` (second touch).
Nova breathes and blinks on the actors plane.

### 3.2 The activity (`quest-player.tsx`, `activity-engine.tsx`)

The most important screen in the product and the least designed. **Now:** legacy
`globals.css` — `.activity`, `.answers button` with raw hex, 12–13px labels, an ALL-CAPS
`.activity-category`, and a `.activity-visual` that is letter-spaced text on a grey slab.

**Becomes** a child-layer screen inside the world's own scene, dimmed and blurred behind
the work so contrast is never traded for atmosphere. The prompt sits in Nova's bubble; the
answer options become physical objects on the near plane at `--kid-touch` sizing; the
grapheme under practice is drawn at `--kid-text-grapheme` in the reading face, not
letter-spaced body text. The progress trail replaces `.activity-progress`'s 8px bars.

The ALL-CAPS kicker, the `skill-purpose` line ("We are practising:") and the round counter
are removed from the child's view. They are system vocabulary (§C5) and they belong on the
parent weekly.

**Moves:** options arrive staggered (40ms apart, from the plane they will be answered on).
Press gives — travel `--kid-press`, border collapses, already tokenised and working. A
right answer pulses once and stops. A wrong answer does **not** shake: the chosen object
settles back and the error-responsive move from WP-04 plays — the letter comparison for
`confusable-visual`, the re-listen for `confusable-sound`. Nothing red, nothing buzzing,
no loss framing (§A).

### 3.3 Reading Grove (`/read`) · `ReadingAdventure.tsx`

**Now:** a marketing landing page — hero, tagline, five emoji cards, a shelf.

**Becomes** the grove itself. The five stages become five drawn stations along a path
through the trees: the listening hollow, letter village, the sound bridge, the word
workshop, the story clearing. The five emoji are deleted; each station gets a drawn
landmark and a spoken name.

The hero and the tagline go. A child arriving here resumes; they do not read a pitch.

**Moves:** the path lights only as far as the child has travelled. Canopy sway. `BlendTrain`,
`SoundBoxes` and `LetterCatch` — the strongest existing work in the repo — keep their
mechanics exactly and gain the scene behind them and the cast on the actors plane.

### 3.4 My World / treehouse (`/world`) · `Treehouse.tsx`

**Now:** two colour bands, one white ellipse, Nova in a void, three text cards. Zero
earned objects visible.

**Becomes** the interior of the treehouse, drawn: floor, window onto the valley, and
**shelves, hooks and a rug that are `ObjectSlot`s**. Every reward object a child has earned
is drawn in place. Empty slots are visible as empty — a grey `Placeholder` silhouette, so a
child can see there is more to come without a number telling them.

This is the progress screen. It is legible without reading (§WP-09), and the star counter
stays off it.

**Moves:** a newly granted object arrives on the child's next visit, travelling to its slot
and settling, once. Dust motes in the window light. Nothing loops after the object lands.

### 3.5 Treasure chest (`/rewards`)

**Now:** eight white cards, grey Lucide icons, "0 of 20", sentences a pre-reader cannot read.

**Becomes** a drawn chest whose lid opens. Earned objects sit inside, drawn, and are
lifted out to be looked at. Unearned ones are silhouettes. Achievement *sentences* move to
the parent weekly; the child sees objects.

Per §D9 the star counter demotes here and leaves every other child surface.

### 3.6 The rooms — `/play`, `/create`, `/science`, `/stories`, `/theater`, `/build`, `/team`, `/faith`, `/worlds`

Under §F these are frozen for investment. This package touches them **only** where they
break a §A non-negotiable or the visual system, which is deliberately narrow:

- delete every emoji used as artwork (`/play`'s 🎮, `/read`'s five, `parent-quests.tsx`'s three);
- delete the ALL-CAPS kickers, taglines and metric chips (§C5);
- give each room its world hue, a scene backdrop from §2.2, and the room's landmark
  drawn from §3.1 so arriving from the map lands somewhere continuous.

No new mechanics, no new game types, no new content. Bug fixes and the visual floor only.

### 3.7 Today's trail (`/today`) · `DailyAdventure.tsx`

**Now:** a start screen — Nova on a beige card, an ALL-CAPS kicker, a 25-word parent-facing
paragraph, and a "Start my trail" button.

**Becomes** the child-layer frame: the drawn door, the world behind it, the step trail at
the band's type size, and no shouting. The kicker and the parent-facing paragraph go.

**Scope corrected during implementation.** This section originally said the screen should
*become nothing* — that arrival should resume into the first item, because §0 of the
blueprint says the app already knows where the child is and a decision placed in front of a
five-year-old before learning starts is a regression. That is still true, and it is still
the right end state. But it is a change to **when a session begins**, not to how it looks,
and §7 of this file says this package does not change flow. Resume-on-arrival is WP-08's
first acceptance criterion (*"Arrival resumes the current episode automatically — no menu,
no 'start my daily quest' button as the primary path"*), and doing it here would be a flow
decision smuggled in under a paint job. `/today` gets the visual floor and keeps its button.

### 3.8 Grown-up surfaces — `/parent`, `/account/*`, `/studio`

The calm application stays a calm application (§D7). shadcn/Radix keeps these. The work
here is finishing, not repainting: the warm elevation ramp from `81af645` applied
consistently, the emoji in `parent-quests.tsx` replaced with drawn marks, and the parent
weekly left alone — it is WP-10's screen and it is not this package's to design.

### 3.9 Auth and first run (`/auth/*`)

The only surface a parent judges before they have an account, and the one place a product
tagline is correct. Kept, tidied: the welcome composition fixed in `81af645` holds, and
the hero gains one scene from §2.2 so the first impression shows the world rather than
describing it.

---

## §4 Motion doctrine

Binding on every animation this package adds.

**Permitted**
- *Life* — ambient loops with no information in them: cloud drift, canopy sway, water
  glint, a character breathing or blinking. Slow (≥ 4s), low amplitude, never near text.
- *Arrival* — content entering, once, on mount.
- *Reaction* — press, lift, settle, the single pulse of a right answer.
- *Travel* — a landmark morphing into its room; a reward object moving to its slot.
- *Celebration* — §2.5, four beats, then silence.

**Forbidden**
- Anything a child must read that animates into position.
- Anything that loops behind a question.
- Motion as a progress indicator, or motion a child has to wait out.
- Shake, buzz, red flash, or any performance of failure.
- Motion that changes a touch target's size or position mid-reach — carried from
  `4d5dbc8`: *"it never changes a size or a touch target: those come from the band, and
  trading a four-year-old's accuracy for a better-looking card is not a trade to make."*
- Any loop that survives `prefers-reduced-motion: reduce`.

---

## §5 Sequence

One commit each, in order, each independently reviewable and revertable. Chosen in session
over a single pass, specifically so a wrong direction costs one commit and not the package.

| # | Commit | Contents |
| --- | --- | --- |
| 1 | **Foundation** | §2 entire: scene ramp, scene grammar, four cast rigs, motion layer, celebration. Exercised by `/kid-preview`; no route changes yet. |
| 2 | **The map** | §3.1. The first screen anyone sees, and the proof of the direction. |
| 3 | **The activity** | §3.2. Where every session is actually spent. Retires the `globals.css` activity rules. |
| 4 | **Reading Grove** | §3.3. The spine (§D2). |
| 5 | **Treehouse and chest** | §3.4, §3.5. Progress a child can see. |
| 6 | **The rooms** | §3.6, §3.7. The narrow §F-respecting pass. |
| 7 | **Adult surfaces** | §3.8, §3.9. |

`RELEASE_STATUS.md` is updated by each commit with what shipped and what is still not true.

---

## §6 Definition of done — per commit

§D of the blueprint applies in full and is not restated. Added by this package, and
checked before any commit is called finished:

1. **`pnpm run check:tokens` passes with no raised budget.** Legacy CSS bytes, `!important`,
   raw hex and px font sizes may only go down. New work lives in `kid.css`, `kid-motion.css`
   and `tokens.css`, which are outside the legacy budget by design.
2. **`pnpm run check:child-surfaces` passes.** No emoji, no Lucide, no shadcn, no clickable
   `div`, no hover-only affordance, no inline style but a data-carrying custom property,
   no raw colour — anywhere under `components/kid/`.
3. **`pnpm run check:images` passes.** No raster over 500 KB. Arrival screen image budget
   under 300 KB (§WP-11.4).
4. **Reduced motion exercised by hand**, and the screen judged *finished* in that state,
   not merely still.
5. **Narration off exercised by hand.** Every spoken instruction still legible or
   demonstrated.
6. **Keyboard-only path walked**, focus ring visible on the actual painted scene.
7. **Contrast re-measured against the scene**, not against white. A landmark label sits on
   a drawn background now; the number that mattered before is the wrong number.
8. **Four viewports captured to `outputs/`** — iPad landscape 1180×820, iPad portrait,
   iPhone 390×844, desktop 1440.
9. **No learning behaviour changed.** Every interaction still writes its `learning_event`
   with the same `verb`, `support` and `error_kind`. This package moves pixels; if a test
   about mastery, scoring or selection changes, something is wrong.

---

## §7 Out of scope

Stated so it is not quietly absorbed:

- New subjects, destinations, game types or content (§F, and §A's freeze).
- The parent weekly — that is WP-10.
- Episodes — WP-08. The map is built so an episode can resume into it, and no further.
- Voice input — WP-13.
- Authored audio beyond keeping WP-07's lifecycle intact.
- Any change to scoring, mastery, the evidence rule or the recommender.
