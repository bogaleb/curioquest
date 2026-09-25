# CurioQuest Character Director Plan
### Making the cast teach everywhere — the animation spinal cord

**Status:** Proposal · **Date:** 2026-09-24
**Goal:** Turn CurioQuest from "screens with a fox on some of them" into a living cast where
characters teach, comfort, and celebrate across every learning moment — video for hero moments,
live animated characters for everything else.

---

## 1. What is already built (the foundation is real)

Exploration of the repo (2026-09-24) found the spinal cord **in embryo** — not missing:

| Built | Where | What it does |
|---|---|---|
| Event-driven character states | `lib/experience/types.ts` → `NovaState` (8 states) | `idle/wave/explain/listen/point/encourage/celebrate/dance` — no sad/disappointed state by design |
| Character controller hooks | `components/characters/NovaCharacter.tsx` (`useNova`), `SpeakingCharacter.tsx` (`useSpeakingCast`) | `play/speak/point/celebrate`; talking mouth + speech bubble + TTS voice, per-character pitch |
| Shared SVG rig contract | `components/kid/art/cast.tsx` | 4 SVG characters (nova, pip, wren, bramble); `.cast-breathe/.cast-blink/.cast-mouth/.cast-limb/.cast-tail` animated in `app/kid.css` — **a new character needs no new CSS** |
| Single question funnel | `components/learning/quest-player.tsx` | **Every question in every subject flows through `QuestPlayer`**; already derives `celebrate/explain/encourage/idle` from feedback |
| Wrong-answer teaching moves | `components/learning/teaching-move.tsx` + `lib/teaching-response.ts` | 6 visual re-teaching moves (`compare/relisten/sound-not-name/recount/settle/step-back`) with band-appropriate lines |
| Video-ready player | `components/experience/InteractiveMediaPlayer.tsx` | Plays `videoUrl` with per-scene offsets, timed `MediaCue` interaction pauses, captions, graceful fallback — **every `videoUrl` is currently null** |
| Media catalog pipeline | `lib/experience/content.ts` → `/api/experience` → `useExperience` | `MediaAsset`/`MediaScene`/`MediaCue` types; 1 active asset, 4 stubs. DB side ready: `content.assets` has `kind='animation'`; `curriculum-media` bucket allows mp4 |
| Global celebration | `components/learning/celebration-layer.tsx` | Any code fires `curio-celebration`; decorative, never blocks |
| Persistent shell layer | `components/shell/KidShell.tsx` | Backdrop scene on every child route — natural home for a companion character |

**The gap:** everything is Nova-centric and ad hoc. The 8-character cast does not exist in code
(Luna, Milo, Bea, Tuno, Riff, Atlas are missing entirely), there is no central director deciding
*who appears when*, and the 8 generated videos are wired nowhere.

---

## 2. Decision needed before building: the fox question

In code today, `nova` = the fox guide ("Nova the fox"). In your cast bible, **Curio the Fox** = guide
and **Nova** = the child explorer (player stand-in).

**Recommendation:** the fox art migrates `nova` → `curio` (same guide slot, new name and refined
design). Nova is redesigned as the child explorer — closest code relatives are `wren` (peer who tries
first) and `pip` (junior who asks the shy question). `pip/wren/bramble` retire or become background
friends; they were experiments, and Wren/Bramble never shipped in real flows.

This keeps every existing call site working: wherever code says `who="nova"` as *the guide*, it becomes
`who="curio"`.

---

## 3. The spinal cord: `CharacterDirector`

One module that answers **who appears, in what state, saying what, with what media** — driven by
learning events, not by each screen improvising.

```ts
// lib/character/director.ts
direct({ event, subject, engineKind, profile }) => { who, state, line, clip }
```

**Mount points (two integrations cover the whole app):**
1. **`QuestPlayer`** — `.kid-activity-ask` and `.kid-activity-reach` slots. Since every question in
   every subject funnels through here, one director mount teaches the entire curriculum.
2. **`KidShell` backdrop** — persistent companion (Curio) who reacts to global events
   (session start, long idle, celebration) without blocking content.

**The direction table (your flow, mapped to events):**

| Learning event | Who | State / media | Line shape |
|---|---|---|---|
| Session / world entry | Curio (+ Nova) | `wave` · **Curio welcome video** | "Let's see where we are today." |
| Lesson intro (per subject) | Specialist | `explain` · **specialist intro video** | teaches the concept, then interaction pause |
| Question asked | Specialist | `explain` + speech bubble | the prompt, replayable aloud |
| Child stalls (hint timer) | Specialist | `encourage` | "Want a little help with this one?" |
| Wrong → `settle` | **Tuno** | `encourage` · **breathing video**, 3s bar | "No rush. Take a breath." |
| Wrong → `compare` | Nova (peer) | `encourage` | tries first, gets it wrong out loud — failure looks survivable |
| Wrong → `recount` | **Milo** | `point` | "So close. Count again." |
| Wrong → `relisten` / `sound-not-name` | **Luna** | `listen` | letter/sound re-teaching |
| Wrong → `step-back` | Curio | `explain` | "Let's try something first." |
| Correct | Specialist | `celebrate` (small) | quick beat, never blocks |
| Quest / session complete | **Curio + full cast** | `celebrate`/`dance` · **cast reward video** | finale |
| Story mode | Nova + Luna | per-scene | Nova lives it, Luna teaches inside it |

Subject → specialist routing: reading→Luna, math/coding→Milo, science→Bea, music→Riff,
geography→Atlas, SEL/calm→Tuno, adventure/meta→Curio, peer modeling→Nova.

---

## 4. Two-tier media: puppets everywhere, video for hero moments

| Tier | What | When | Cost |
|---|---|---|---|
| **Living puppets** | SVG rig + speech bubble + TTS (`useSpeakingCast` widened to 8 voices) | In-lesson teaching, feedback, hints, stalls — *everywhere* | Instant, offline, tiny |
| **Video scenes** | The 8 generated clips + future episodes via `InteractiveMediaPlayer` | Welcome, world entry, lesson intros, Tuno breathing, big celebrations, theater catalog | Loaded on demand, captioned |

Rule of thumb: if the child must wait for it mid-lesson, it's a puppet. If it's a moment they'd
*choose to watch*, it's video. Puppets keep the app fast and calm; video delivers the wow.

**The 8 test videos become the first 8 `MediaAsset` records** (theater catalog):
Curio welcome · Nova forest mystery · Luna letters · Milo coding path · Bea plant growth ·
Tuno breathing · Riff rhythm · Atlas globe. Each gets per-scene `MediaCue` pause points reusing the
existing cue engine (`choice/sequence/blend`).

**Pipeline:** mp4 → `curriculum-media` bucket (private) → `content.assets` row (`kind='animation'`,
licence mandatory) → `MediaAsset.videoUrl` → player. Captions as WebVTT sidecars.

---

## 5. Where exactly — screen by screen

- **`/` (ChildMap):** Curio welcome video on first visit of the day; Nova ambient on the map.
- **`/today` (DailyAdventure):** episode step plays video; step transitions become character handoffs
  (Curio → Nova → specialist → Curio) instead of bare screen changes.
- **`/theater`:** the 8 videos as the first real catalog; per-scene cues turn each into an
  interactive episode.
- **`/read` (ReadingAdventure):** Luna owns the LetterCatch teaching step ("Meet this sound"),
  SoundBoxes, and `sound-not-name`; Riff owns the BlendTrain slide gesture.
- **`/play` (GameZone):** Milo guides all four math engines + RobotRoute (the `blocked` outcome is a
  built-in "plan failed, try again" beat); the PlaceValue trade offer is a signature Milo moment.
- **`/science` (WonderLab):** Bea owns the investigation loop — clue-opening phase and the
  `ready → predict` transition.
- **`/rewards` (TreasureChest):** the Curio + full-cast finale; `Celebration`'s `who` prop already
  accepts any cast member.
- **Wrong answers everywhere:** `TeachingMoveView` moves get their characters (§3 table); the `settle`
  move plays the Tuno breathing video.
- **Onboarding (`discovery-invitation`):** Curio welcome video replaces the Nova text intro.

**Engines with no guide today** (math/arcade/science/core) get the existing `Guide` strip from
`play-engines.tsx` — widen its `who` prop from `"nova"|"pip"` to the full cast.

---

## 6. Build phases

- **Phase 0 — Foundation:** 8 SVG rigs under the `cast.tsx` contract; `NovaState` → `CastState`
  (+ `useCastMember`, 8 TTS voices); `CharacterDirector` + QuestPlayer mounts. *No video yet — puppets
  make every screen alive first.*
- **Phase 1 — Reading + theater:** Luna in ReadingAdventure; 8 videos as theater `MediaAsset`s with cues.
- **Phase 2 — All subjects:** Milo/Bea/Riff/Atlas guides; Tuno recovery; TreasureChest cast finale.
- **Phase 3 — Companion + polish:** KidShell persistent companion; Rive upgrade path only if puppets
  prove insufficient (blueprint §8 stays valid).

**Rules that carry over:** no character performs disappointment (§cast.tsx, keep); answers still
checked server-side; every interaction still writes a `learning_event`; tokens-only styling;
no emoji/Lucide on child surfaces (`pnpm check:child-surfaces`).

---

## 7. Open questions for Bin

1. The fox question (§2) — confirm Curio inherits the guide slot.
2. Nova's new look: child explorer design direction (customizable kid figure?).
3. Video hosting: `public/media/` for v1 (simple, fast) vs `curriculum-media` bucket (private, proper).
4. Voices: 8 distinct TTS voices, or fewer shared across the cast?
