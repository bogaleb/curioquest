# CurioQuest Interactive World, Animation & Media System Blueprint

## Version
V1.0 — Interactive Experience Layer

## Product
CurioQuest

## Primary Goal
Transform CurioQuest from a primarily screen-and-card-based educational web app into a **media-rich, animated learning universe** where children learn through interactive adventures, character guidance, games, stories, songs, videos, and persistent world progression.

This blueprint should be implemented **on top of the existing CurioQuest curriculum, child profile, mastery, quest, reward, and Reading Adventure systems**. Do not replace working educational logic unless necessary.

The result should feel like a polished children's learning product, not a worksheet website.

---

# 1. CORE PRODUCT VISION

CurioQuest should have two layers:

```text
CURRICULUM / LEARNING ENGINE
        ↓
skills
mastery
prerequisites
adaptive sequencing
review scheduling
progress
        ↓
EXPERIENCE ENGINE
        ↓
animated characters
games
cartoons
stories
songs
interactive videos
world exploration
rewards
creation
```

The educational engine determines **what** the child should learn.

The experience engine determines **how the child experiences it**.

The child should not feel like they are progressing through lessons.

The child should feel like they are progressing through an adventure world.

---

# 2. IMPORTANT PRODUCT RULE

Do not copy any other children's learning app's:

- characters
- artwork
- interface layouts
- stories
- songs
- videos
- proprietary terminology
- visual assets
- activity thumbnails
- specific game designs
- branding

CurioQuest may use general product principles such as:

- animated guides
- daily learning paths
- rich media
- activity carousels
- persistent worlds
- free exploration
- reward-based unlocking
- age-appropriate visual navigation

All CurioQuest characters, scenes, game mechanics, world layouts, episodes, and assets should be original.

---

# 3. PRIMARY CHILD EXPERIENCE

The app should have two main modes.

```text
                 CURIOQUEST HOME
                        │
          ┌─────────────┴─────────────┐
          │                           │
   TODAY'S ADVENTURE             EXPLORE
          │                           │
 adaptive guided path          child-directed play
          │                           │
 Reading                       Theater
 Math                          Games
 Science                       Books
 Logic                         Create
 Life Skills                   Build Lab
                              My World
```

The guided path handles progression.

Explore allows curiosity and replay.

Both should feed the same progress, reward, and learner systems.

---

# 4. REDESIGN THE CHILD HOME

Replace a conventional dashboard with a child-centered world hub.

Suggested composition:

```text
┌───────────────────────────────────────────────────┐
│ Child Avatar       CurioQuest                 🔔   │
│                                                   │
│                 NOVA                              │
│         "Ready for today's adventure?"            │
│                                                   │
│ ┌───────────────────────────────────────────────┐ │
│ │           TODAY'S ADVENTURE                   │ │
│ │                                               │ │
│ │ 🎬  🔤  🧩  🚀  📖  🎁                        │ │
│ │                                               │ │
│ │             [ START ]                         │ │
│ └───────────────────────────────────────────────┘ │
│                                                   │
│  🎬 Theater       🎮 Games       📚 Books         │
│                                                   │
│  🎨 Create        🏗 Build Lab    🌎 My World     │
│                                                   │
└───────────────────────────────────────────────────┘
```

For Pre-K, prioritize:

- imagery
- characters
- audio
- large buttons
- large cards
- minimal reading requirement

For older children, allow more labels and content density.

---

# 5. AGE-ADAPTIVE INTERFACE

Age should influence presentation but should NOT permanently determine academic level.

Example:

```text
Age = 4
↓
large cards
spoken navigation
limited choices
short sessions
simple animation
↓
placement/mastery system
↓
actual curriculum starting point
```

A six-year-old may be:

```text
Reading = advanced
Math = grade-level
Spelling = developing
Logic = advanced
```

UI and curriculum must remain separate.

---

# 6. NOVA AS THE MAIN GUIDE

Nova should become a persistent animated guide rather than static artwork.

Nova must appear across:

- home
- onboarding
- reading
- math
- science
- logic
- life skills
- rewards
- stories
- world exploration
- error recovery
- session completion

Nova should be recognizable but should not block content.

---

# 7. NOVA ANIMATION STATE MACHINE

Create a reusable animation controller.

States:

```text
idle
blink
look_left
look_right
wave
enter
exit
point_left
point_right
point_up
point_down
listen
think
explain
celebrate_small
celebrate_big
surprised
encourage
confused
laugh
dance
sleep
reading
holding_book
holding_map
holding_star
```

State transitions should be event-driven.

Example:

```text
activity_loaded
→ nova_enter

instruction_started
→ nova_explain

waiting_for_answer
→ nova_idle

wrong_answer
→ nova_encourage

hint_requested
→ nova_point

correct_answer
→ nova_celebrate_small

quest_completed
→ nova_celebrate_big
```

Create:

```ts
<NovaCharacter state="listen" />
```

and a controller such as:

```ts
useNova()
```

with:

```ts
nova.play("wave")
nova.speak("Let's find the sound!")
nova.point("left")
nova.celebrate()
```

---

# 8. CHARACTER ANIMATION TECHNOLOGY

Preferred implementation:

### Rive
Use for:

- Nova
- reusable character states
- interactive facial expressions
- pointing
- celebrating
- looping idle animation

### Framer Motion
Use for:

- card transitions
- screen changes
- reward movement
- UI feedback
- progress animation

### Lottie
Use for:

- confetti
- sparkles
- treasure effects
- short decorative effects

### Phaser or PixiJS
Use only for richer mini-games where canvas rendering is beneficial.

Do not use a game engine for simple buttons or cards.

---

# 9. AUDIO-FIRST DESIGN

Young learners must be able to navigate without strong reading ability.

Every child-facing screen should support:

```text
spoken instruction
replay button
sound effects
word/phoneme audio
character voice
music where appropriate
```

Create a unified audio manager:

```ts
useAudioEngine()
```

Capabilities:

```text
playVoice()
playSfx()
playMusic()
pauseMusic()
duckMusic()
stopAll()
setVolume()
mute()
```

When Nova speaks, background music should automatically reduce.

---

# 10. CURIOQUEST THEATER

Create a major area:

# CurioQuest Theater

The Theater should contain original media in categories:

```text
Nova Explains
CurioQuest Cartoons
Sing With Nova
Story Time
Fast Discoveries
Movement Breaks
Real-World Missions
```

Filter by:

```text
age
domain
skill
duration
content type
favorites
recently watched
```

---

# 11. MEDIA FORMATS

Use multiple content formats.

| Format | Typical Length | Purpose |
|---|---:|---|
| Nova Explains | 20–45 sec | Direct explanation |
| Learning Song | 45–120 sec | Memory/repetition |
| CurioQuest Cartoon | 2–5 min | Narrative learning |
| Fast Discovery | 20–60 sec | Science/fact content |
| Story Time | 2–7 min | Language/comprehension |
| Movement Break | 30–90 sec | Physical participation |
| Interactive Episode | 2–6 min | Story + child decisions |
| Reward Animation | 5–15 sec | Celebration |
| Mission Intro | 15–30 sec | Off-screen challenge |

---

# 12. INTERACTIVE CARTOON ENGINE

This is a major differentiator.

A video should be able to pause at predefined points and launch an interaction.

Flow:

```text
video plays
↓
cue point reached
↓
video pauses
↓
Nova or character asks question
↓
child performs activity
↓
system records attempt
↓
feedback animation
↓
video continues
```

Supported interactions:

```text
multiple choice
tap object
drag and drop
letter selection
sound selection
word blending
sequence ordering
prediction
movement prompt
real-world prompt
```

---

# 13. INTERACTIVE VIDEO DATA MODEL

Create:

```text
media_assets
interactive_media_events
interactive_media_responses
```

Suggested fields:

## media_assets

```text
id
title
slug
media_type
domain
skill_id
age_min
age_max
duration_seconds
video_url
thumbnail_url
caption_url
transcript
active
created_at
updated_at
```

## interactive_media_events

```text
id
media_id
timestamp_seconds
event_type
prompt
instruction_audio_url
payload_json
skill_id
resume_timestamp
sequence_order
```

Example payload:

```json
{
  "question": "Which word says map?",
  "choices": ["map", "mat", "sat"],
  "correctAnswer": "map"
}
```

---

# 14. VIDEO PLAYER COMPONENT

Create:

```tsx
<InteractiveMediaPlayer />
```

Responsibilities:

- stream media
- captions
- play/pause
- seek permissions based on child mode
- watch-time tracking
- trigger cue events
- overlay interactive prompts
- record responses
- resume playback
- play reward animation
- mark completion

Avoid native browser controls for Pre-K child mode.

Use large custom controls.

---

# 15. FIRST INTERACTIVE CARTOON

Create an original Reading Adventure episode:

# Nova and the Missing Map

Target:

```text
Pre-K / Kindergarten
```

Primary skills:

```text
letter sound m
letter sound a
letter sound p
phoneme blending
CVC decoding
```

Story:

Nova wants to find a treasure garden but loses her map.

She discovers a sign containing:

```text
m  a  p
```

The child helps decode the word.

Sequence:

### Scene 1
Nova enters the forest.

### Scene 2
Nova discovers three glowing letters.

Interactive pause:

```text
Which letter says /m/?
```

### Scene 3
Nova finds:

```text
m   a   p
```

The child taps each sound.

### Scene 4
Child swipes across the word.

```text
mmmmmaaaaap
```

### Scene 5
Word becomes:

```text
MAP
```

### Scene 6
Map opens and reveals the route.

### Scene 7
Child receives:

```text
Explorer Map
```

for My World.

This episode should connect learning directly to world progression.

---

# 16. NEXT FOUR ORIGINAL EPISODES

## Episode 2 — The Sleeping Moon

Domain:
Science + vocabulary

Skills:

```text
day/night
sun/moon
prediction
vocabulary
```

Interaction:

Child decides what belongs in daytime vs nighttime.

Reward:

```text
Moon Lamp
```

for the child's treehouse.

---

## Episode 3 — The Bridge That Wouldn't Balance

Domain:
Math + engineering

Skills:

```text
counting
comparison
balance
simple problem solving
```

Child selects blocks to stabilize a bridge.

Reward:

```text
Bridge Blueprint
```

for Build Lab.

---

## Episode 4 — Creature Grove Mystery

Domain:
Science

Skills:

```text
animal features
habitats
classification
observation
```

Child identifies clues and matches an animal to a habitat.

Reward:

```text
new Creature Grove animal
```

---

## Episode 5 — The Rhythm Robot

Domain:
Patterns + music + coding

Skills:

```text
AB patterns
AAB patterns
sequencing
cause and effect
```

Child creates a sequence such as:

```text
clap
stomp
clap
stomp
```

Robot performs it.

Reward:

```text
new robot dance
```

---

# 17. MY WORLD

Create a persistent personalized world.

Initial conceptual world:

```text
                    STORY CASTLE
                         │
                         │
 CREATURE GROVE ─── CENTRAL PLAZA ─── SPACE BASE
                         │
                         │
                 MY TREEHOUSE
                         │
          ┌──────────────┴──────────────┐
          │                             │
      BUILD LAB                   CREATION STUDIO
```

Future:

```text
Rhythm Lab
Ocean Station
Dinosaur Valley
Garden Lab
Town Workshop
```

Do not build everything initially.

Start with:

```text
Central Plaza
My Treehouse
Creature Grove
```

---

# 18. CENTRAL PLAZA

Central Plaza acts as the world entry point.

Child can see:

- Nova
- unlocked world areas
- earned decorations
- current mission
- child avatar
- featured discovery

It should feel alive.

Include small ambient animations:

```text
cloud movement
birds
sparkles
flags
water
trees
creatures
```

Use lightweight animation loops.

---

# 19. MY TREEHOUSE

The child's personal home.

Children can place:

```text
earned posters
books
science models
toys
plants
trophies
art
lamps
pets
```

Items come from learning.

Example:

```text
Complete Moon episode
↓
earn Moon Lamp
↓
place Moon Lamp in Treehouse
```

This makes academic progress tangible.

---

# 20. CREATURE GROVE

A persistent animal area.

Children unlock animals by:

```text
science missions
reading stories
real-world missions
habitat challenges
```

Each creature has:

```text
name
habitat
sound
diet
facts
mini animation
care interaction
```

Example:

```text
tap owl
↓
owl hoots
↓
Nova:
"Owls are mostly active at night."
```

Keep animal interactions educational rather than purely decorative.

---

# 21. WORLD ITEM SYSTEM

Create:

```text
world_items
child_world_items
world_item_placements
```

Item fields:

```text
id
name
category
asset_url
thumbnail_url
world_zone
unlock_type
unlock_requirement
rarity
interactive
```

Categories:

```text
decorations
science objects
books
creatures
furniture
plants
toys
machines
trophies
```

---

# 22. REWARD ECONOMY

Do not copy a ticket-based economy.

Create CurioQuest-specific rewards.

Recommended:

```text
Discovery Stars
```

and:

```text
Artifacts
```

Stars:

- lightweight
- common
- gained from completion

Artifacts:

- meaningful
- tied to learning milestones
- placed in My World

Do not require grinding.

Do not create artificial scarcity for young children.

---

# 23. REWARD RULES

Reward:

```text
effort
completion
mastery
curiosity
creative work
real-world missions
```

Avoid:

```text
random loot boxes
paid child rewards
punitive loss of rewards
high-pressure streak mechanics
```

---

# 24. DAILY ADVENTURE

Replace a generic lesson list with a visual daily journey.

Example:

```text
TODAY'S ADVENTURE

🎬 Nova Cartoon
      ↓
🔤 Reading Challenge
      ↓
🧩 Logic Puzzle
      ↓
🚀 Fast Discovery
      ↓
📖 Story
      ↓
🎁 Treasure
```

Pre-K target:

```text
4–6 core experiences
8–12 minutes
```

Optional exploration follows.

---

# 25. DAILY ADVENTURE DATA MODEL

Create:

```text
daily_adventures
daily_adventure_steps
child_daily_adventures
child_daily_step_progress
```

Each step:

```text
type
content_id
skill_id
sequence
required
estimated_seconds
reward
```

The adaptive engine should build this dynamically.

---

# 26. ADVENTURE BUILDER

Create:

```ts
buildDailyAdventure(childId)
```

Inputs:

```text
age
mastery
recent mistakes
review schedule
child interests
recent activity types
session duration
unfinished content
```

Output:

```text
1 review activity
1 developing skill
1 new skill
1 rich-media experience
1 optional creative/world interaction
```

Avoid repeating identical formats.

---

# 27. CONTENT VARIETY RULE

Do not show:

```text
tap answer
tap answer
tap answer
tap answer
```

A session should vary modality.

Example:

```text
watch
↓
tap
↓
drag
↓
speak/listen
↓
move
↓
read
↓
build
```

---

# 28. FREE EXPLORE MODE

Create a child-facing Explore screen:

```text
🎬 Theater
🎮 Games
📚 Books
🎨 Create
🏗 Build
🌎 My World
🎵 Music
🧪 Discover
```

Content should still be age-filtered and safe.

---

# 29. CURIOQUEST BOOKSHELF

Create:

# My Books

Sections:

```text
For Me
Read Again
Decodable Books
Story Time
Science Books
Favorites
Completed
```

For Pre-K:

- large covers
- optional narration
- page-turn animation
- highlighted text
- replay sentence

---

# 30. READ-ALOUD PLAYER

Create:

```tsx
<ReadAlongBook />
```

Capabilities:

```text
page turn
narration
word/sentence highlighting
pause
replay
auto-play
manual mode
page count
favorite
```

For decodable books, add word support.

For rich read-aloud books, prioritize vocabulary and comprehension.

---

# 31. STORY INTERACTION

At selected story points:

```text
What do you think will happen next?
```

or:

```text
Why is Nova surprised?
```

Do not interrupt every page.

Use 1–3 meaningful interactions per story.

---

# 32. CURIOQUEST GAMES HUB

Create a reusable game shell.

Game categories:

```text
Reading
Math
Logic
Science
Memory
Patterns
Creative
Movement
```

Each game should receive data from the curriculum engine.

Example:

```tsx
<SpaceCollector
  targetWords={["map", "sat", "mat"]}
  skill="cvc_decoding"
/>
```

The game should not hard-code one lesson.

---

# 33. SIGNATURE GAME — SPACE COLLECTOR

Original mini-game concept.

Child pilots a small explorer craft.

Prompt:

```text
Collect "map"
```

Objects float through space:

```text
map
mat
sat
```

Child navigates toward the correct word.

Variations:

```text
collect uppercase letters
collect words with /m/
collect number 8
collect shapes
collect animals that live in water
```

One game mechanic can support many skills.

---

# 34. SIGNATURE GAME — CREATURE RESCUE

Child helps creatures reach the correct habitat.

Examples:

```text
frog → pond
camel → desert
polar bear → Arctic
```

Can support:

```text
science
categorization
logic
vocabulary
```

---

# 35. SIGNATURE GAME — SOUND PATH

Character moves through stepping stones.

Each stone plays a phoneme or word.

Child selects the correct sequence.

Useful for:

```text
phonemic awareness
blending
rhyming
letter sounds
```

---

# 36. CREATION STUDIO

Create a safe creative area.

Initial tools:

```text
drawing
coloring
stickers
simple shapes
scene builder
```

Later:

```text
story builder
comic creator
music maker
animation maker
```

Store creations in:

```text
child_creations
```

Allow parent viewing.

---

# 37. BUILD LAB

Create problem-solving construction activities.

Initial experiences:

```text
build a bridge
build a tower
complete a pattern
construct a path
design an animal home
```

For older child profiles:

```text
simple machines
circuits
geometry
coding sequences
```

---

# 38. MEDIA STORAGE ARCHITECTURE

IMPORTANT:

Do NOT store large media files directly in the Vercel application repository.

Avoid:

```text
/public/videos
/public/full-cartoon-library
```

Use:

```text
Vercel
→ app code

Supabase
→ database
→ authentication
→ learner data

Object storage / CDN
→ video
→ audio
→ thumbnails
→ story images
→ animation assets
```

For the current architecture, Supabase Storage is acceptable for V1.

Design so assets could later migrate to a dedicated CDN.

---

# 39. SUPABASE STORAGE BUCKETS

Suggested:

```text
media-video
media-audio
media-images
media-thumbnails
media-stories
media-animation
child-creations
```

Use sensible file naming.

Example:

```text
reading/episodes/nova-missing-map/v1/episode.webm
reading/episodes/nova-missing-map/v1/thumb.webp
```

---

# 40. MEDIA OPTIMIZATION

Images:

```text
WebP
AVIF where supported
```

Video:

```text
WebM
MP4 fallback
```

Audio:

```text
AAC
MP3 fallback
```

Do not ship original production files to browsers.

Create optimized derivatives.

---

# 41. LAZY LOADING

Never load all media on the home screen.

Load:

```text
visible thumbnails
current Nova animation
current quest metadata
```

Then lazy-load:

```text
video
game assets
story assets
world scenes
```

as needed.

---

# 42. DOWNLOAD / CACHE STRATEGY

Future mobile/PWA support should allow:

```text
cache today's adventure
cache recent stories
cache frequently used audio
```

Do not implement uncontrolled permanent caching in V1.

---

# 43. CONTENT DATABASE

Expand the content engine.

Create or extend:

```text
content_items
content_skill_mappings
content_prerequisites
media_assets
stories
story_pages
games
songs
interactive_media_events
world_items
rewards
```

---

# 44. CONTENT ITEM MODEL

Common model:

```text
id
slug
title
description
content_type
domain
age_min
age_max
difficulty
duration_seconds
thumbnail_url
active
published_at
```

Content types:

```text
activity
game
video
interactive_video
song
story
book
world_mission
creative_activity
offline_mission
```

---

# 45. SKILL MAPPING

Every educational content item should map to skills.

Example:

```text
Nova and the Missing Map
↓
letter_sound_m
letter_sound_a
letter_sound_p
phoneme_blending
decode_cvc
```

Create:

```text
content_skill_mappings
```

Fields:

```text
content_id
skill_id
role
weight
```

Roles:

```text
teach
practice
assess
review
enrich
```

---

# 46. ORIGINAL THUMBNAIL SYSTEM

Every activity should have an illustrated "mini movie poster."

Avoid generic icons.

Thumbnail should communicate:

```text
character
setting
action
emotion
learning theme
```

Example:

```text
Nova riding a glowing train
letters m-a-p on train cars
forest in background
```

Title:

```text
The Missing Map
```

Curriculum metadata remains hidden from the child.

---

# 47. THUMBNAIL CARD COMPONENT

Create:

```tsx
<AdventureCard />
```

Props:

```text
title
thumbnail
contentType
progress
locked
new
favorite
duration
```

Variants:

```text
hero
carousel
grid
compact
```

---

# 48. CAROUSEL SYSTEM

Use horizontal browsing for child discovery.

Create:

```tsx
<ContentCarousel />
```

Use for:

```text
Today's Adventure
Continue Playing
New Discoveries
Favorite Stories
Games For You
Recently Unlocked
```

Avoid tiny cards.

---

# 49. CHARACTER SPEECH SYSTEM

Nova dialogue should be data-driven.

Create:

```text
character_lines
```

Fields:

```text
id
character
event
age_group
text
audio_url
animation_state
```

Example:

```text
event:
reading_correct

text:
"You found /m/!"

animation:
celebrate_small
```

This prevents dialogue from being hard-coded across dozens of components.

---

# 50. DYNAMIC VOICE WITHOUT PAID AI

V1 options:

1. prerecorded key lines
2. browser/device TTS for prototypes
3. locally generated audio assets prepared during content creation

Runtime learning should not depend on paid AI.

For phonics, use curated audio.

Do not rely on generic TTS for critical phoneme pronunciation if quality is poor.

---

# 51. MUSIC SYSTEM

Use light background music.

Rules:

```text
no constant high-energy audio
speech always takes priority
music should duck under narration
parent can disable music
sound effects remain separate
```

Different world zones may have different themes.

---

# 52. FEEDBACK SYSTEM

Correct:

```text
short animation
positive sound
specific feedback
continue
```

Example:

```text
"You blended MAP!"
```

Incorrect:

```text
brief neutral reaction
replay
scaffold
retry
```

Avoid:

```text
harsh buzzers
red failure screens
shaming
```

---

# 53. SESSION COMPLETION

End with:

```text
Adventure Complete!
```

Show:

```text
skills practiced
one meaningful reward
world unlock
optional off-screen mission
```

For child:

```text
"You helped Nova find the map!"
```

For parent:

```text
Practiced:
CVC blending
Letter sounds m/a/p
```

---

# 54. REAL-WORLD MISSIONS

The media system should frequently lead away from the screen.

Examples:

```text
Find something beginning with /m/.
Build a bridge with blocks.
Count five red objects.
Find a leaf outside.
Tell someone the story in your own words.
```

Store completion.

---

# 55. PARENT DASHBOARD MEDIA INSIGHTS

Parents should see:

```text
time spent
skills practiced
stories completed
videos watched
games played
world items earned
creative work
```

Do not emphasize raw screen time as a success metric.

Focus on learning and creation.

---

# 56. CHILD PROFILE INTERESTS

Store lightweight interests:

```text
space
animals
dinosaurs
vehicles
music
building
art
stories
```

Use them for presentation.

Example:

If a child likes space:

```text
CVC practice
```

may use Space Collector.

The learning target remains the same.

---

# 57. CONTENT PERSONALIZATION

Create:

```ts
selectExperienceForSkill(skillId, childProfile)
```

Inputs:

```text
mastery
age
recent activity formats
interest
difficulty
recent failures
```

Output may choose:

```text
game
story
video
interactive episode
practice
```

This adds personalization without generative AI.

---

# 58. APP ROUTES

Suggested:

```text
app/
├── child/
│   ├── home/
│   ├── adventure/
│   ├── explore/
│   ├── theater/
│   ├── games/
│   ├── books/
│   ├── create/
│   ├── build/
│   └── world/
│
├── reading/
├── math/
├── science/
└── parent/
```

Preserve current routes where practical.

Do not refactor solely to match this structure if existing routing is already clean.

---

# 59. COMPONENT ARCHITECTURE

Suggested additions:

```text
components/
├── characters/
│   ├── NovaCharacter.tsx
│   └── CharacterSpeechBubble.tsx
│
├── media/
│   ├── InteractiveMediaPlayer.tsx
│   ├── VideoPlayer.tsx
│   ├── AudioPlayer.tsx
│   ├── ReadAlongBook.tsx
│   └── CaptionLayer.tsx
│
├── adventure/
│   ├── DailyAdventure.tsx
│   ├── AdventureStep.tsx
│   ├── AdventurePath.tsx
│   └── AdventureComplete.tsx
│
├── content/
│   ├── AdventureCard.tsx
│   ├── ContentCarousel.tsx
│   ├── ContentGrid.tsx
│   └── ContentFilter.tsx
│
├── world/
│   ├── WorldMap.tsx
│   ├── WorldZone.tsx
│   ├── Treehouse.tsx
│   ├── CreatureGrove.tsx
│   └── WorldInventory.tsx
│
└── effects/
    ├── Confetti.tsx
    ├── Sparkles.tsx
    └── RewardBurst.tsx
```

---

# 60. SERVICE ARCHITECTURE

Add:

```text
lib/
├── adventure/
│   ├── builder.ts
│   ├── selector.ts
│   └── completion.ts
│
├── media/
│   ├── player.ts
│   ├── events.ts
│   └── tracking.ts
│
├── world/
│   ├── inventory.ts
│   ├── unlocks.ts
│   └── placement.ts
│
├── personalization/
│   ├── interests.ts
│   └── experienceSelector.ts
│
└── characters/
    └── novaController.ts
```

---

# 61. STATE MANAGEMENT

Use current project conventions.

If no suitable solution exists, use lightweight client state for:

```text
current adventure
current content item
Nova state
audio state
world interaction state
```

Do not introduce heavy global state unnecessarily.

---

# 62. PERFORMANCE TARGETS

Target:

```text
home interactive < 3 sec on normal broadband
button feedback < 100 ms
Nova interaction immediate
thumbnail lazy loading
video streaming rather than full preloading
```

Do not load entire world assets at startup.

---

# 63. RESPONSIVE DESIGN

Priority:

```text
tablet
desktop/laptop
mobile landscape
mobile portrait
```

Child activities should work especially well in tablet landscape.

Pre-K touch targets should be generous.

---

# 64. FULLSCREEN ACTIVITY MODE

Games, stories, and videos should have an optional distraction-free mode.

Include:

```text
large exit button
audio replay
minimal navigation
```

Parent-lock sensitive settings.

---

# 65. ACCESSIBILITY

Support:

```text
reduced motion
captions
high contrast
audio replay
touch + keyboard where reasonable
visible focus in parent interfaces
```

Do not remove necessary motion cues; provide alternate presentation when reduced motion is enabled.

---

# 66. CHILD SAFETY

No:

```text
open chat
public profiles
user-to-user messaging
advertising
external browsing
unmoderated uploads
```

Child creations remain private to the family unless a future parent-controlled sharing feature is explicitly built.

---

# 67. ANALYTICS

Track:

```text
adventure_started
adventure_completed
content_opened
content_completed
video_started
video_completed
video_interaction_answered
game_started
game_completed
book_opened
book_completed
world_item_unlocked
world_item_placed
creation_saved
reward_earned
nova_hint_used
```

Tie educational events to skills where appropriate.

---

# 68. DO NOT CONFUSE ENGAGEMENT WITH LEARNING

Do not optimize solely for:

```text
longer sessions
more clicks
more video watching
```

Optimize for:

```text
skill growth
returning willingly
independent reading
problem solving
creative output
real-world transfer
```

---

# 69. FIRST IMPLEMENTATION MILESTONE

Do NOT attempt the entire blueprint at once.

Build a vertical slice.

V1 milestone:

```text
1. Redesigned child home
2. Animated Nova
3. Today's Adventure
4. CurioQuest Theater shell
5. Interactive media player
6. One interactive episode
7. One reusable mini-game
8. My World shell
9. My Treehouse
10. Reward unlock → world placement
```

---

# 70. V1 SAMPLE DAILY ADVENTURE

For a 4-year-old:

```text
Step 1
🎬 Nova and the Missing Map
Interactive cartoon

Step 2
🔤 Blend Train
mat / map / sat

Step 3
🚀 Space Collector
collect "map"

Step 4
📖 Tiny decodable story
Sam Sat

Step 5
🎁 Reward
Explorer Map

Step 6
🌎 My Treehouse
place the Explorer Map

Step 7
🏠 Real-world mission
find something beginning with /m/
```

This should be the first complete demonstration of CurioQuest's new experience model.

---

# 71. FIRST V1 WORLD ITEMS

Create:

```text
Explorer Map
Moon Lamp
Creature Poster
Robot Toy
Bridge Blueprint
Nova Storybook
Discovery Plant
Star Globe
```

Each item should have:

```text
thumbnail
world asset
unlock rule
placement zone
```

---

# 72. FIRST THEATER CONTENT

Create placeholders/content structure for:

```text
Nova and the Missing Map
The Sleeping Moon
The Bridge That Wouldn't Balance
Creature Grove Mystery
The Rhythm Robot
```

Only the first episode must be fully implemented initially.

Others may initially use mock media metadata.

---

# 73. FIRST GAME CONTENT

Implement:

# Space Collector

Requirements:

```text
keyboard + touch controls
one target at a time
3–5 distractors
large word/letter cards
audio instruction
correct/incorrect feedback
attempt tracking
skill mapping
```

Use reusable content input so the same engine can teach:

```text
letters
words
numbers
shapes
categories
```

---

# 74. FIRST NOVA STATES

Implement only:

```text
idle
wave
explain
listen
point
encourage
celebrate
dance
```

Add advanced states later.

---

# 75. FIRST TREEHOUSE IMPLEMENTATION

Start simple.

Room contains:

```text
wall
floor
shelf
desk
window
3 placement slots
```

Child can place:

```text
Explorer Map
Moon Lamp
Robot Toy
```

Do not build freeform physics placement in V1.

Use predefined slots.

---

# 76. ASTRA REPOSITORY INSPECTION INSTRUCTION

Before modifying code, Astra must inspect the current repository.

Identify:

```text
framework
Next.js version
routing model
package manager
existing design system
child profile model
auth
database
current quest system
current rewards
current Reading Adventure work
existing components
storage implementation
deployment assumptions
```

Astra should reuse working systems.

Do not rewrite unrelated code.

---

# 77. ASTRA IMPLEMENTATION STRATEGY

Astra should:

1. Audit current codebase.
2. Write a short implementation plan.
3. Identify reusable components.
4. Identify migrations required.
5. Create migrations.
6. Implement the smallest vertical slice.
7. Run tests.
8. Run local build.
9. Fix type/lint/build errors.
10. Provide a concise change summary.

Do not create placeholder-only UI and call it finished.

The complete user flow must work.

---

# 78. DEVELOPMENT COMMAND

Preserve local development:

```bash
pnpm dev
```

Production build must pass:

```bash
pnpm build
```

---

# 79. MEDIA DEVELOPMENT FALLBACK

If final media files do not exist yet:

Use original temporary placeholders such as:

```text
gradient scene
simple vector illustration
temporary character sprite
generated neutral sound
```

Do NOT use copyrighted screenshots or assets from reference products.

Structure the system so production assets can be replaced later without code changes.

---

# 80. DATABASE MIGRATIONS

Astra must create migrations for new tables rather than relying on ad hoc manual database edits.

Seed V1 demo content:

```text
5 media items
1 interactive episode
1 mini-game
8 world items
1 sample daily adventure
```

---

# 81. ERROR HANDLING

If media fails:

```text
show friendly fallback
allow retry
do not break adventure
```

If network is slow:

```text
show animated loading state
preload next lightweight asset
```

If progress save fails:

```text
retain local result
retry save
avoid losing child progress
```

---

# 82. OFFLINE / RESILIENCE FUTURE DESIGN

Not required for initial V1, but architecture should support:

```text
cached adventure metadata
cached audio
cached books
queued progress writes
```

---

# 83. PARENT CONTROLS

Future-compatible settings:

```text
music on/off
sound effects
narration
session length
autoplay
reduced motion
daily activity limit
```

Do not expose these controls in child mode.

---

# 84. SUCCESS CRITERIA

The V1 is successful when a child can:

```text
open CurioQuest
↓
see animated Nova
↓
start Today's Adventure
↓
watch an interactive cartoon
↓
answer inside the story
↓
play a mini-game
↓
complete a reading activity
↓
earn an item
↓
enter My Treehouse
↓
place the item
↓
return later and see it still there
```

Meanwhile the system must:

```text
store attempts
update mastery
store adventure progress
store rewards
store world placement
update parent view
```

---

# 85. VISUAL QUALITY STANDARD

Do not ship the child experience with generic enterprise UI.

Avoid:

```text
gray cards
thin buttons
small text
dashboard tables
generic form layouts
plain text links
```

Child screens should use:

```text
large illustrated cards
rounded forms
depth
soft shadows
expressive animation
large character art
visual progress
clear focal points
```

Parent screens may remain more conventional.

---

# 86. MOTION QUALITY STANDARD

Motion should feel:

```text
playful
responsive
short
intentional
```

Avoid:

```text
constant bouncing
flashing
long unskippable transitions
excessive confetti
motion unrelated to learning
```

---

# 87. PRODUCT DIFFERENTIATOR

CurioQuest should ultimately combine:

```text
adaptive learning
+
high-quality phonics/reading instruction
+
animated storytelling
+
interactive cartoons
+
games
+
creative building
+
persistent world
+
real-world missions
+
parent intelligence
```

The world and media layer should support the curriculum rather than hide weak curriculum.

---

# 88. FINAL EXPERIENCE PRINCIPLE

The product should feel like:

> A children's animated universe where learning changes the world.

Not:

> A collection of educational worksheets with colorful buttons.

A correct learning action should often produce a visible consequence:

```text
read word
→ unlock map

solve problem
→ repair bridge

learn habitat
→ rescue animal

complete story
→ add book to castle

finish mission
→ decorate treehouse
```

That connection between **learning and world consequence** is central to the new CurioQuest experience.

---

# 89. INITIAL ASTRA COMMAND

Use this instruction after providing this blueprint:

> Inspect the current CurioQuest repository first. Do not rebuild the app from scratch. Implement the Interactive Experience V1 vertical slice defined in Sections 69–75. Preserve the existing Reading Adventure, child profiles, mastery logic, and working navigation. Use original temporary assets where production animation/video assets are unavailable. Do not copy any assets or UI from reference products. Keep all large media outside the Vercel source bundle. The implementation must run with `pnpm dev` and pass `pnpm build`.

---

# 90. DEFINITION OF DONE

Do not mark the milestone complete until all of the following work:

- Animated Nova renders and changes state.
- Today's Adventure is generated/rendered.
- InteractiveMediaPlayer pauses at a cue.
- Child can respond to an in-video activity.
- Response is stored.
- One reusable mini-game works.
- Reward is granted.
- Reward appears in inventory.
- Reward can be placed in My Treehouse.
- Placement persists after refresh.
- Reading mastery can update from the adventure.
- Parent progress reflects the activity.
- Responsive layout works.
- No copyrighted reference assets are shipped.
- Large media files are not bundled into Vercel source.
- `pnpm dev` works.
- `pnpm build` passes.
