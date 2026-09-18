# CURIOQUEST READING MODULE BLUEPRINT

## Version

Reading Module V1

## Product

CurioQuest

## Target Learners

Primary:

* Pre-K children, approximately age 4
* Kindergarten learners

Secondary:

* First-grade learners
* Early readers who need foundational reading support

---

# 1. PRODUCT GOAL

Build a comprehensive, interactive, developmentally appropriate reading-learning system inside CurioQuest.

The Reading Module must teach children how to actually read rather than simply memorize letters or identify pictures.

The instructional progression should follow this general model:

```text
Hear sounds
↓
Identify sounds
↓
Connect sounds to letters
↓
Blend sounds
↓
Build words
↓
Read words
↓
Read sentences
↓
Read simple stories
↓
Develop fluency
↓
Build vocabulary
↓
Understand and retell stories
```

The Reading Module should combine:

* phonological awareness
* phonemic awareness
* phonics
* decoding
* encoding/spelling
* fluency
* vocabulary
* oral language
* comprehension
* story retelling
* real-world literacy activities

The child experience should feel like an adventure game.

The instructional system underneath must remain structured, explicit, measurable, and systematic.

---

# 2. CORE DESIGN PRINCIPLE

CurioQuest should separate:

```text
LEARNING ENGINE
from
GAME EXPERIENCE
```

The child should experience:

```text
Nova needs help restoring sounds to the forest.
```

The system should understand:

```text
Skill:
initial_phoneme_identification

Target phoneme:
/m/

Difficulty:
beginner

Mastery:
62%

Previous attempts:
7

Correct:
5
```

The curriculum should drive the game.

The game should never dictate the curriculum.

---

# 3. FEATURE NAME

Create a major CurioQuest world named:

# Nova's Reading Adventure

Navigation example:

```text
CurioQuest Home
│
├── Math Adventure
├── Science Adventure
├── Reading Adventure
├── Creativity
├── Build Lab
└── Real-World Missions
```

Reading Adventure should be visually represented as an expanding fantasy map.

---

# 4. READING WORLD STRUCTURE

Create the following major reading worlds.

```text
READING ADVENTURE
│
├── World 1: Listening Forest
├── World 2: Letter Village
├── World 3: Sound Bridge
├── World 4: Word Workshop
├── World 5: Story Trail
├── World 6: Story Garden
└── World 7: Reading Explorer
```

Each world contains smaller skill paths and missions.

---

# 5. WORLD 1 — LISTENING FOREST

## Purpose

Develop phonological and phonemic awareness before relying heavily on print.

Children should learn to hear the structure of spoken language.

## Skills

### Level 1

* identify environmental sounds
* identify same/different sounds
* recognize rhyme

### Level 2

* produce simple rhymes
* clap syllables
* count syllables

### Level 3

* identify beginning sounds
* match words with same beginning sound

### Level 4

* identify ending sounds
* identify middle sounds where appropriate

### Level 5

* blend spoken syllables
* blend onset and rime

Example:

```text
/s/ + /un/
→ sun
```

### Level 6

* blend individual phonemes

Example:

```text
/m/ /a/ /p/
→ map
```

### Level 7

* segment simple words

Example:

```text
dog
→ /d/ /o/ /g/
```

---

# 6. LISTENING FOREST GAME TYPES

Create reusable game components.

## Sound Match

Nova says:

```text
sun
sock
moon
```

Prompt:

```text
Which two words start with the same sound?
```

---

## Rhyme River

Objects float down a river.

Target:

```text
cat
```

Choices:

```text
hat
sun
dog
```

Child taps:

```text
hat
```

---

## Syllable Drum

Nova says:

```text
banana
```

Child taps a drum:

```text
ba
na
na
```

Three taps.

---

## Sound Detective

Nova asks:

```text
What sound do you hear at the beginning of "moon"?
```

Possible answers should be audio-supported.

---

# 7. WORLD 2 — LETTER VILLAGE

## Purpose

Teach grapheme-phoneme correspondence.

Children should understand that printed letters represent sounds.

Do not teach the alphabet only as letter names.

Every important letter lesson should include:

```text
Letter
+
Letter name
+
Primary sound
+
Example words
+
Recognition practice
+
Writing/tracing
```

---

# 8. INITIAL LETTER SEQUENCE

Do not require the child to learn A–Z alphabetically.

Use a functional sequence that allows early word building.

Initial suggested sequence:

```text
Group 1
m
s
a
t

Group 2
p
i
n

Group 3
c
o
d

Group 4
g
f
e

Group 5
r
h
l

Group 6
u
b
k

Group 7
j
v
w

Group 8
y
x
z
q
```

The sequence must be configurable in the database.

Do not hard-code it permanently.

---

# 9. LETTER SKILL MODEL

Each letter should contain multiple skills.

Example:

```text
letter_m_recognition
letter_m_name
letter_m_sound
letter_m_uppercase
letter_m_lowercase
letter_m_trace
letter_m_initial_sound
```

Example mastery object:

```json
{
  "skillId": "letter_m_sound",
  "mastery": 0.82,
  "attempts": 12,
  "correct": 10,
  "lastReviewed": "timestamp"
}
```

---

# 10. LETTER VILLAGE GAME TYPES

## Letter Catch

Nova says:

```text
Find the letter that says /m/.
```

Choices:

```text
M
S
T
```

---

## Letter Hunt

Different letters appear around a scene.

Child finds:

```text
m
```

---

## Sound-to-Letter Match

Audio:

```text
/m/
```

Choices:

```text
m
p
s
```

---

## Letter-to-Sound Match

Show:

```text
m
```

Play three sounds.

Child selects:

```text
/m/
```

---

## Trace the Letter

Child traces:

```text
M
m
```

Touch path should provide visual guidance.

---

# 11. WORLD 3 — SOUND BRIDGE

## Purpose

Teach actual decoding.

This is one of the most important parts of CurioQuest Reading.

Children must learn to blend sounds represented by letters.

---

# 12. SIGNATURE GAME — BLEND TRAIN

Create a reusable component named:

```text
BlendTrain
```

Example screen:

```text
🚂      🚃      🚃

m       a       p
```

Nova says:

```text
/m/ ... /a/ ... /p/
```

Child drags train cars together.

Animation:

```text
m → a → p

mmmmmaaaaap

MAP
```

Then display:

```text
🗺️
MAP
```

Nova says:

```text
You read MAP!
```

---

# 13. CONTINUOUS BLENDING

The app should favor continuous blending where appropriate.

Instead of:

```text
m
pause
a
pause
p
```

support:

```text
mmmmmaaaaap
```

This helps the child connect sounds into a word.

---

# 14. BLENDING PROGRESSION

Suggested progression:

```text
VC words
↓
CVC words
↓
CVCC
↓
CCVC
↓
CCVCC
↓
digraphs
↓
silent-e
↓
vowel teams
↓
multisyllable words
```

Example early words:

```text
am
at

sat
mat
map
Sam
sit
pin
pan
nap
tap
tip
man
mat
```

---

# 15. WORLD 4 — WORD WORKSHOP

## Purpose

Teach children to construct and spell words.

Reading and spelling should reinforce each other.

---

# 16. SIGNATURE GAME — SOUND BOXES

Create component:

```text
SoundBoxes
```

Audio:

```text
MAP
```

Display:

```text
┌───┐ ┌───┐ ┌───┐
│   │ │   │ │   │
└───┘ └───┘ └───┘
```

Letters:

```text
m
a
p
s
```

Child moves:

```text
m → box 1
a → box 2
p → box 3
```

Result:

```text
┌─m─┐ ┌─a─┐ ┌─p─┐
```

Then child sweeps under letters.

App blends:

```text
map
```

---

# 17. WORD LADDERS

Create an activity where one sound changes at a time.

Example:

```text
sat
↓
mat
↓
map
↓
nap
↓
nip
↓
sit
```

Highlight the changed grapheme.

Example:

```text
sat
mat

s → m
```

---

# 18. ENCODING ACTIVITIES

Include:

* spell the word
* hear and build
* missing sound
* beginning sound
* ending sound
* middle vowel
* word transformation
* sound boxes
* letter tiles

---

# 19. WORLD 5 — STORY TRAIL

## Purpose

Transition from isolated words into connected reading.

Children should read controlled text containing mostly patterns already taught.

---

# 20. DECODABLE STORY RULES

Each story should contain:

```text
Known phonics patterns
+
Known letters
+
Known high-frequency words
+
Very limited new patterns
```

Example beginner story:

```text
Sam sat.

Sam sat on a mat.

A cat sat.

Sam and the cat sat.
```

Do not overwhelm the child with words they cannot decode.

---

# 21. STORY READER UI

Screen:

```text
──────────────────────────────
        STORY TRAIL

            Sam Sat

      [illustration]

        Sam sat.

        Sam sat
        on a mat.

      🔊 Hear Again

      ▶ Next Page
──────────────────────────────
```

Known words may optionally become tappable.

Tapping a word can provide:

```text
sound breakdown
+
blending help
+
audio
```

---

# 22. WORD HELP SYSTEM

If child taps:

```text
map
```

Show:

```text
m      a      p
/m/   /a/   /p/

mmmmmaaaaap

map
```

Do not simply pronounce the whole word immediately unless help level requires it.

Use scaffold levels.

---

# 23. HELP LEVELS

## Help 0

No assistance.

## Help 1

Highlight individual letters.

## Help 2

Play individual phonemes.

## Help 3

Demonstrate blending.

## Help 4

Say word.

Track which help level was required.

Example:

```json
{
  "word": "map",
  "correct": true,
  "helpLevel": 2
}
```

A correct answer after heavy assistance should not count exactly the same as independent reading.

---

# 24. WORLD 6 — STORY GARDEN

## Purpose

Develop oral language, vocabulary, knowledge, comprehension, and storytelling.

These books do NOT need to be limited to the child's decoding level.

CurioQuest or a parent may read the story aloud.

---

# 25. SHARED READING EXPERIENCE

Nova reads:

```text
The tiny fox wandered into the enormous forest.
```

Pause.

Ask:

```text
What do you think enormous means?
```

Use image choices.

Then:

```text
Why do you think the fox went into the forest?
```

Then later:

```text
What happened first?
```

And:

```text
Can you tell Nova what happened in the story?
```

---

# 26. VOCABULARY SYSTEM

Store vocabulary separately from decoding skills.

Example:

```json
{
  "word": "enormous",
  "meaning": "very big",
  "examples": [
    "an enormous elephant",
    "an enormous building"
  ],
  "difficulty": "pre-k",
  "domain": "general"
}
```

Vocabulary activities:

* picture match
* opposite match
* word in context
* choose meaning
* act it out
* describe it
* use it in a sentence

---

# 27. COMPREHENSION SKILLS

Track separately:

```text
literal understanding
sequencing
prediction
cause and effect
character understanding
main idea
detail recall
retelling
inference
connection to prior knowledge
```

---

# 28. WORLD 7 — READING EXPLORER

## Purpose

Move literacy beyond the screen.

Every few sessions, give the child an offline mission.

Examples:

```text
Find something in your house beginning with /m/.
```

```text
Find the letter S on a food package.
```

```text
Find three words that rhyme with cat.
```

```text
Ask someone to read you a book.
Tell Nova what happened.
```

```text
Find five letters while riding in the car.
```

---

# 29. PARENT MISSIONS

Parents should receive short instructions.

Example:

```text
TODAY'S READING MISSION

Skill:
/m/ sound

Ask your child:

"Can you find something in the house
that starts with /m/?"

If needed, stretch the sound:

mmmmilk
mmmmom
mmmmug

Avoid telling the answer immediately.
```

Target parent interaction:

```text
2–5 minutes
```

---

# 30. DAILY READING QUEST

For Pre-K, default core lesson should remain short.

Recommended structure:

```text
10-MINUTE READING QUEST

1 minute
Review mastered skill

2 minutes
Sound awareness activity

2 minutes
Letter/sound instruction

2 minutes
Blend/build words

2 minutes
Tiny story or vocabulary

1 minute
Offline mission
```

Do not force the child to remain for a long session.

Optional activities may continue afterward.

---

# 31. READING PLACEMENT ADVENTURE

When a learner first enters Reading Adventure, run a playful assessment.

Do not label it:

```text
Assessment
Test
Exam
```

Call it:

```text
Nova's Reading Map Adventure
```

---

# 32. PLACEMENT SKILLS

Sample sequence:

```text
recognize rhyme
↓
identify syllables
↓
identify beginning sounds
↓
recognize letters
↓
produce letter sounds
↓
blend two sounds
↓
blend CVC words
↓
read simple CVC words
↓
read simple sentence
↓
basic comprehension
```

Stop testing upward when the child reaches repeated difficulty.

Do not frustrate the child.

---

# 33. PLACEMENT RESULT

Example:

```text
READING MAP

Sound Awareness
█████████░

Letter Recognition
████████░░

Letter Sounds
██████░░░░

Blending
████░░░░░░

Word Reading
██░░░░░░░░

Story Understanding
███████░░░
```

Do NOT show deficiency-oriented scores to young children.

For children, show:

```text
Nova discovered where your next adventure begins!
```

---

# 34. MASTERY MODEL

Every skill should have a mastery estimate.

Suggested range:

```text
0.00 – 1.00
```

Example:

```json
{
  "skill": "phoneme_blending_cvc",
  "mastery": 0.72
}
```

---

# 35. MASTERY STATES

Use:

```text
Not Started
Emerging
Developing
Strong
Mastered
Needs Review
```

Example thresholds may initially be:

```text
0–0.19
Not Started

0.20–0.39
Emerging

0.40–0.64
Developing

0.65–0.84
Strong

0.85+
Mastered
```

These values must be configurable.

Do not treat them as permanent scientifically validated thresholds.

---

# 36. MASTERY SHOULD USE MORE THAN CORRECT/INCORRECT

Consider:

```text
accuracy
response time
help used
repeated success
spacing across days
error patterns
retention
difficulty
```

Example scoring concept:

```text
Independent correct answer:
+ strong evidence

Correct after sound hint:
+ moderate evidence

Correct after full word provided:
+ minimal evidence

Incorrect:
negative evidence
```

---

# 37. SPACED REVIEW

A mastered skill should return later.

Example:

```text
Day 1
learn /m/

Day 2
review /m/

Day 4
review /m/

Day 8
review /m/

Day 15
review /m/
```

If the child struggles:

```text
mastery decreases
↓
skill returns more frequently
```

---

# 38. ADAPTIVE LESSON ENGINE

Create function concept:

```text
getNextReadingActivity(childId)
```

It should consider:

```text
current mastery
prerequisite skills
skills due for review
recent mistakes
difficulty
recent activity types
child engagement
session duration
```

Pseudo logic:

```text
1. Select one review skill.
2. Select one developing skill.
3. Select one new skill if prerequisites are met.
4. Avoid repeating the same game excessively.
5. Create session.
```

---

# 39. SKILL GRAPH

Reading skills should use prerequisite relationships.

Example:

```text
recognize_rhyme
        ↓
initial_sound_identification
        ↓
phoneme_blending
        ↓
letter_sound_m
        ↓
letter_sound_a
        ↓
letter_sound_t
        ↓
decode_cvc
        ↓
read_cvc_sentence
```

Use a flexible graph rather than a single hard-coded level ladder.

---

# 40. ERROR ANALYSIS

Do not only store:

```text
wrong
```

Store the error pattern.

Example:

Target:

```text
map
```

Child selects:

```text
mat
```

Possible classification:

```text
final_phoneme_confusion
```

Other classifications:

```text
initial_sound_confusion
vowel_confusion
letter_reversal
blending_failure
guessing_behavior
unknown_letter_sound
```

These classifications help the adaptive engine.

---

# 41. DO NOT TEACH GUESSING

CurioQuest should not teach the child to guess an unknown word based on:

* picture
* first letter
* sentence context alone

Pictures may support meaning.

They should not replace decoding.

Bad:

```text
Picture of bus

Which word?

bus
cat
dog
```

Preferred:

```text
b
u
s

/b/
/u/
/s/

bus

🚌
```

---

# 42. HIGH-FREQUENCY WORDS

Do not build the system around memorizing hundreds of sight words.

Words should be decoded wherever possible.

For irregular high-frequency words, teach:

```text
known sound-spelling parts
+
unusual part
```

Example:

```text
said
```

Highlight the unexpected spelling.

Store:

```json
{
  "word": "said",
  "type": "irregular_high_frequency",
  "decodableParts": ["s", "d"],
  "irregularPart": "ai"
}
```

---

# 43. READING SKILL TREE

Create a scalable skill tree.

```text
READING
│
├── Phonological Awareness
│   ├── environmental_sounds
│   ├── rhyme_recognition
│   ├── rhyme_generation
│   ├── syllable_counting
│   ├── syllable_blending
│   └── onset_rime
│
├── Phonemic Awareness
│   ├── initial_phoneme
│   ├── final_phoneme
│   ├── phoneme_blending
│   ├── phoneme_segmentation
│   ├── phoneme_addition
│   ├── phoneme_deletion
│   └── phoneme_substitution
│
├── Alphabet Knowledge
│   ├── uppercase_letters
│   ├── lowercase_letters
│   └── letter_names
│
├── Letter-Sound
│   ├── consonant_sounds
│   └── short_vowels
│
├── Decoding
│   ├── VC
│   ├── CVC
│   ├── CCVC
│   ├── CVCC
│   ├── digraphs
│   ├── blends
│   ├── silent_e
│   ├── vowel_teams
│   ├── r_controlled_vowels
│   └── multisyllable
│
├── Encoding
│   ├── phoneme_to_grapheme
│   ├── cvc_spelling
│   ├── digraph_spelling
│   └── spelling_patterns
│
├── Fluency
│   ├── word_accuracy
│   ├── sentence_accuracy
│   ├── phrasing
│   └── reading_rate
│
├── Vocabulary
│   ├── everyday_words
│   ├── academic_words
│   └── domain_words
│
└── Comprehension
    ├── sequence
    ├── details
    ├── prediction
    ├── cause_effect
    ├── inference
    ├── main_idea
    └── retelling
```

---

# 44. FIRST-GRADE EXTENSION

The same Reading Module must support a first-grade learner.

Do not create a separate app.

A first grader may begin farther along.

Example:

```text
CVC decoding
Mastered

Digraphs
Mastered

Blends
Strong

Silent-E
Developing

Vowel Teams
Emerging

Fluency
Developing

Comprehension
Strong
```

Then CurioQuest starts at the appropriate level.

---

# 45. FIRST-GRADE PHONICS EXPANSION

Include:

```text
sh
ch
th
wh
ck
ng

bl
cl
fl
gl
pl
sl

br
cr
dr
fr
gr
pr
tr

st
sp
sk
sm
sn
sw

silent e

a_e
i_e
o_e
u_e

vowel teams

ai
ay
ee
ea
oa
ow

r-controlled

ar
er
ir
or
ur

diphthongs

oi
oy
ou
ow

multisyllable words
```

---

# 46. CONTENT DATA MODEL

Content must be stored as data.

Do not hard-code all lessons directly into React components.

Create tables such as:

```text
reading_skills
reading_skill_prerequisites
reading_lessons
reading_activities
reading_words
reading_word_skills
reading_sentences
reading_stories
reading_story_pages
reading_vocabulary
reading_audio
```

---

# 47. LEARNER DATA MODEL

Suggested tables:

```text
child_reading_profile

child_reading_mastery

reading_attempts

reading_sessions

reading_word_attempts

reading_story_progress

reading_vocabulary_mastery

reading_offline_missions

reading_parent_observations
```

---

# 48. READING_SKILLS TABLE

Example:

```sql
id
code
domain
strand
name
description
difficulty
age_min
age_max
grade_min
grade_max
sequence_order
active
created_at
updated_at
```

---

# 49. READING_SKILL_PREREQUISITES

```sql
id
skill_id
prerequisite_skill_id
required_mastery
```

---

# 50. READING_WORDS TABLE

```sql
id
word
phonemes
graphemes
syllables
word_type
difficulty
is_decodable
is_high_frequency
image_url
audio_url
```

Example:

```json
{
  "word": "map",
  "phonemes": ["/m/", "/a/", "/p/"],
  "graphemes": ["m", "a", "p"],
  "syllables": 1,
  "wordType": "CVC",
  "isDecodable": true
}
```

---

# 51. READING_ATTEMPTS

Store:

```sql
id
child_id
skill_id
activity_id
stimulus
response
correct
response_time_ms
help_level
error_type
attempt_number
created_at
```

---

# 52. AUDIO REQUIREMENTS

Reading requires high-quality audio.

Support:

```text
phoneme audio
letter names
word pronunciation
sentence narration
story narration
instructions
positive feedback
```

Audio playback component:

```text
<AudioButton />
```

Support:

```text
replay
slow playback where useful
volume
mute
```

Do not depend on paid AI voice APIs for V1.

Use:

* prerecorded human audio
  or
* browser/device text-to-speech for prototypes

Architecture must allow prerecorded audio later.

---

# 53. CHILD UI PRINCIPLES

Use:

* very large touch targets
* minimal text for pre-readers
* audio instructions
* strong visual hierarchy
* one clear task at a time
* limited answer choices
* visual feedback
* short animations
* calm interactions
* no visual overload

Avoid:

* dense menus
* long written instructions
* flashing effects
* excessive rewards
* tiny controls
* worksheet-style screens

---

# 54. GAME FEEDBACK

Correct response:

```text
✓ animation
short sound
brief Nova praise
continue quickly
```

Example:

```text
"You found /m/!"
```

Avoid excessive generic praise after every tap.

Incorrect response:

Do not display:

```text
WRONG!
```

Instead:

```text
"Listen again."

/mmmm/

Which letter says /m/?
```

Then provide scaffold.

---

# 55. CHILD HOME READING CARD

Add to CurioQuest home.

Example:

```text
┌──────────────────────────────┐
│ 📚 READING ADVENTURE         │
│                              │
│ 🌲 Listening Forest          │
│                              │
│ Today's Mission              │
│ Blend /m/ /a/ /t/            │
│                              │
│ ⭐ 3 new stars               │
│                              │
│       START QUEST            │
└──────────────────────────────┘
```

---

# 56. READING WORLD MAP

Visual concept:

```text
          🏰 STORY GARDEN
               │
        📖 STORY TRAIL
               │
        🛠 WORD WORKSHOP
               │
         🌉 SOUND BRIDGE
               │
        🏘 LETTER VILLAGE
               │
        🌲 LISTENING FOREST
```

Map locations unlock gradually.

However:

Unlocked areas should reflect learning readiness, not just game points.

---

# 57. REWARD SYSTEM

Reading rewards may include:

```text
stars
Nova energy
books
character outfits
world decorations
pets
badges
story items
```

Do NOT tie mastery directly to rewards in a way that allows children to bypass learning.

Rewards should motivate exploration.

---

# 58. READING COLLECTION

Create:

```text
My Reading Shelf
```

Store:

```text
completed stories
favorite stories
mastered books
new vocabulary
reading badges
```

---

# 59. PARENT DASHBOARD

Create detailed but readable information.

Example:

```text
READING PROGRESS

Maya

Sound Awareness
Strong

Letter Sounds
Developing

Blending
Developing

Word Reading
Emerging

Vocabulary
Strong

Comprehension
Strong
```

---

# 60. PARENT INSIGHTS

Generate deterministic messages.

Examples:

```text
Maya knows 11 letter sounds confidently.
```

```text
She is beginning to blend three-sound words.
```

```text
She currently confuses /b/ and /d/.
```

```text
Practice recommendation:
3 minutes of Blend Train with CVC words.
```

Do not require AI for these summaries.

Use rules.

---

# 61. WEEKLY PARENT REPORT

Example:

```text
THIS WEEK IN READING

Sessions:
5

Minutes:
42

Skills strengthened:
6

New letters:
m
s
a

Words read independently:
12

Favorite activity:
Blend Train

Current focus:
CVC blending
```

---

# 62. CONTENT GENERATION RULE

For V1:

Do not use uncontrolled generative AI to create phonics lessons dynamically.

Use:

```text
curated word lists
curated sentences
curated stories
validated skill mappings
controlled lesson templates
```

AI may be added later for:

```text
parent explanations
optional conversation
story variation
personalization
```

But the learning sequence must remain deterministic.

---

# 63. WORD FILTERING ENGINE

Create:

```text
getDecodableWords(childId)
```

The function should examine known skills.

Example:

Child knows:

```text
m
s
a
t
p
i
n
```

Allowed words might include:

```text
am
at
sat
mat
Sam
sit
pin
pan
tap
nap
map
```

Do not return:

```text
ship
cake
train
```

until required patterns are known.

---

# 64. DECODABLE SENTENCE ENGINE

Create:

```text
getDecodableSentences(childId)
```

Filter sentences by:

```text
known phonics patterns
known irregular words
difficulty
sentence length
```

Example:

```text
Sam sat.
```

is allowed.

```text
The beautiful ship sailed away.
```

is not appropriate for an early decoder.

---

# 65. STORY CONTENT FORMAT

Example:

```json
{
  "id": "story_001",
  "title": "Sam and the Cat",
  "level": "CVC_1",
  "requiredSkills": [
    "sound_s",
    "sound_a",
    "sound_m",
    "sound_t",
    "decode_cvc"
  ],
  "pages": [
    {
      "text": "Sam sat.",
      "image": "/stories/sam-cat/1.webp"
    },
    {
      "text": "A cat sat.",
      "image": "/stories/sam-cat/2.webp"
    }
  ]
}
```

---

# 66. GAME COMPONENT ARCHITECTURE

Create reusable activity components.

Suggested:

```text
components/reading/
│
├── SoundMatch.tsx
├── RhymeRiver.tsx
├── SyllableDrum.tsx
├── LetterCatch.tsx
├── LetterHunt.tsx
├── LetterTrace.tsx
├── BlendTrain.tsx
├── SoundBoxes.tsx
├── WordBuilder.tsx
├── WordLadder.tsx
├── DecodableReader.tsx
├── VocabularyMatch.tsx
├── StoryQuestions.tsx
├── ParentMission.tsx
└── AudioButton.tsx
```

---

# 67. PAGE STRUCTURE

Suggested route structure:

```text
app/
│
├── reading/
│   ├── page.tsx
│   │
│   ├── placement/
│   │   └── page.tsx
│   │
│   ├── world/
│   │   └── page.tsx
│   │
│   ├── quest/
│   │   └── [questId]/
│   │       └── page.tsx
│   │
│   ├── story/
│   │   └── [storyId]/
│   │       └── page.tsx
│   │
│   └── shelf/
│       └── page.tsx
```

---

# 68. SERVICE STRUCTURE

Suggested:

```text
lib/reading/
│
├── mastery.ts
├── placement.ts
├── adaptiveEngine.ts
├── skillGraph.ts
├── decodability.ts
├── wordSelector.ts
├── sentenceSelector.ts
├── storySelector.ts
├── errorAnalysis.ts
├── spacedReview.ts
└── sessionBuilder.ts
```

---

# 69. CORE FUNCTIONS

Implement:

```ts
getReadingProfile(childId)

getReadingMastery(childId)

getNextReadingQuest(childId)

getSkillsDueForReview(childId)

getNextSkill(childId)

getDecodableWords(childId)

getDecodableSentences(childId)

recordReadingAttempt()

updateReadingMastery()

classifyReadingError()

buildReadingSession()

completeReadingQuest()
```

---

# 70. SESSION BUILDER

Example result:

```json
{
  "sessionId": "session123",
  "estimatedMinutes": 10,
  "activities": [
    {
      "type": "review",
      "skill": "sound_m"
    },
    {
      "type": "phonemic_awareness",
      "skill": "initial_sound"
    },
    {
      "type": "new_instruction",
      "skill": "sound_t"
    },
    {
      "type": "blend_train",
      "words": ["mat", "sat"]
    },
    {
      "type": "story",
      "storyId": "story001"
    },
    {
      "type": "offline_mission",
      "skill": "sound_m"
    }
  ]
}
```

---

# 71. SESSION TIME MANAGEMENT

For Pre-K:

Default target:

```text
8–12 minutes
```

After approximately 10 minutes:

Nova may say:

```text
"Great adventure! Let's save the next challenge for later."
```

Allow parent-configurable session limits later.

---

# 72. SCREEN-TIME PHILOSOPHY

Reading Module should intentionally support stopping.

Example:

```text
Adventure complete!

Now find something outside the screen
that begins with /s/.
```

Do not maximize engagement purely for screen time.

---

# 73. ACCESSIBILITY

Support:

```text
large buttons
high contrast
clear audio
replay instructions
limited motion option
captions where appropriate
screen reader compatibility for parent screens
keyboard navigation for adult interfaces
```

---

# 74. CHILD SAFETY

Do not include:

```text
open chat
unmoderated content
external links in child mode
advertising
public profile
social messaging
```

---

# 75. NO PAID AI REQUIRED

Reading Module V1 should work without paid AI.

Use:

```text
Supabase/PostgreSQL
curated curriculum data
predefined adaptive rules
browser speech
stored audio
React components
deterministic lesson generation
```

AI integrations can remain optional.

---

# 76. SUPABASE RECOMMENDATION

Use Supabase for:

```text
child profiles
reading mastery
sessions
attempts
content
rewards
parent dashboard
authentication
```

Keep curriculum content editable.

---

# 77. INITIAL CONTENT TARGET

For Reading V1, create enough content for a functional Pre-K prototype.

Minimum:

```text
15–20 phonological awareness activities

10 initial letter sounds

30–50 decodable words

20 decodable sentences

5 tiny decodable books

20 vocabulary words

5 rich read-aloud stories

10 offline missions
```

Do not attempt the entire K–1 curriculum in the first implementation.

---

# 78. INITIAL LETTERS FOR V1

Start with:

```text
m
s
a
t
p
i
n
```

These allow useful word combinations.

---

# 79. INITIAL WORD BANK

Possible starting words:

```text
am
at
Sam
sat
mat
map
tap
pat
nap
pan
pin
sit
sip
tip
tin
man
tan
ant
```

Every word must be mapped to required phonics skills.

---

# 80. INITIAL DECODABLE SENTENCES

Examples:

```text
Sam sat.

Sam sat on a mat.

A man sat.

Pat sat.

Sam can tap.

A cat is not initially allowed
unless c is taught.
```

The system must automatically validate whether a sentence is currently decodable.

---

# 81. READING V1 IMPLEMENTATION ORDER

Build in this order.

## Phase 1

Create database schema.

## Phase 2

Create reading skill graph.

## Phase 3

Create Reading Adventure home.

## Phase 4

Create initial placement adventure.

## Phase 5

Create Letter Catch.

## Phase 6

Create Blend Train.

## Phase 7

Create Sound Boxes.

## Phase 8

Create basic mastery tracking.

## Phase 9

Create adaptive session builder.

## Phase 10

Create Decodable Reader.

## Phase 11

Create parent reading dashboard.

## Phase 12

Add offline missions.

---

# 82. MVP USER FLOW

```text
Parent creates child
↓
Child enters Reading Adventure
↓
Nova launches Reading Map
↓
Placement activities
↓
Initial reading profile generated
↓
Today's Reading Quest generated
↓
Child completes sound activity
↓
Child learns letter
↓
Child blends word
↓
Child reads tiny sentence/story
↓
Reward
↓
Offline mission
↓
Mastery updated
↓
Parent dashboard updated
```

---

# 83. FIRST SCREEN

Reading Adventure screen:

```text
────────────────────────────────

        📚 READING ADVENTURE

             Nova

      "Let's discover words!"

         TODAY'S QUEST

        🌲 Listening Forest

      Learn the /m/ sound

         ⭐ ⭐ ⭐

        [ START QUEST ]

────────────────────────────────

Reading Map

My Books

My Words

────────────────────────────────
```

---

# 84. QUEST SCREEN

Use a progress trail.

```text
Today's Quest

● Sound Game
│
● Letter Mission
│
● Blend Train
│
● Tiny Story
│
○ Treasure
```

Avoid traditional school progress bars where possible.

---

# 85. CHILD PERFORMANCE STORAGE

Every activity should generate an event.

Example:

```json
{
  "event": "reading_attempt",
  "childId": "123",
  "skillId": "decode_cvc",
  "activity": "blend_train",
  "stimulus": "map",
  "response": "map",
  "correct": true,
  "helpLevel": 0,
  "responseTime": 4200
}
```

---

# 86. ANALYTICS EVENTS

Track:

```text
reading_session_started
reading_session_completed
reading_activity_started
reading_activity_completed
reading_attempt
reading_hint_used
reading_story_opened
reading_story_completed
offline_mission_assigned
offline_mission_completed
reading_skill_mastered
reading_skill_regressed
```

---

# 87. DEFINITION OF DONE — EACH ACTIVITY

An activity is complete only when:

```text
child UI works
audio works
success state works
error state works
attempt is stored
mastery updates
analytics fires
parent data updates
mobile layout works
tablet layout works
accessibility checked
```

---

# 88. TESTING

Add unit tests for:

```text
mastery calculation
skill prerequisites
decodable-word filtering
sentence filtering
session generation
spaced review
error classification
```

Integration tests:

```text
child completes activity
↓
attempt saved
↓
mastery updates
↓
next activity changes
```

---

# 89. IMPORTANT DEVELOPMENT RULE

Do NOT redesign the entire CurioQuest application.

Integrate Reading Adventure into the existing CurioQuest architecture, navigation, visual identity, child profile system, progress engine, and reward system where possible.

Reuse existing components when appropriate.

Create reusable reading components rather than placing all logic inside individual pages.

---

# 90. IMPORTANT UX RULE

Do not create generic educational cards containing large blocks of text.

This is a Pre-K child experience.

Prefer:

```text
audio
characters
movement
pictures
large letters
large buttons
simple choices
interactive manipulation
```

Parent screens may contain more information.

---

# 91. IMPORTANT INSTRUCTIONAL RULE

For reading instruction, follow this principle:

# HEAR IT → SAY IT → MAP IT → BUILD IT → BLEND IT → READ IT → WRITE IT → UNDERSTAND IT → USE IT

Every major foundational skill should move the child toward actual independent reading.

---

# 92. LONG-TERM READING VISION

The future Reading Module should eventually support:

```text
Pre-K
Kindergarten
Grade 1
Grade 2
possibly Grade 3
```

Future capabilities:

```text
speech recognition
oral reading fluency
pronunciation feedback
advanced spelling
morphology
prefixes
suffixes
word roots
chapter stories
reading comprehension passages
writing integration
reading portfolio
personalized book recommendations
```

The V1 architecture should not block these future additions.

---

# 93. IMPLEMENTATION REQUEST FOR ASTRA

Inspect the existing CurioQuest repository before modifying anything.

Determine:

```text
current framework
existing routes
current database layer
child profile structure
existing quest engine
existing mastery/progress logic
existing components
design tokens
navigation
reward system
```

Then implement Reading Adventure using the existing architecture wherever practical.

Do not replace working systems unnecessarily.

Before implementation:

1. Inspect repository structure.
2. Identify reusable components.
3. Identify existing database schema.
4. Identify current child-profile model.
5. Identify current quest/progression model.
6. Propose the minimum necessary additions.
7. Then begin implementation.

---

# 94. ASTRA FIRST IMPLEMENTATION MILESTONE

Implement a functional Reading V1 vertical slice containing:

```text
Reading Adventure home
+
Pre-K child reading profile
+
skills database
+
m/s/a/t/p/i/n skill sequence
+
Letter Catch
+
Blend Train
+
Sound Boxes
+
mastery tracking
+
adaptive daily quest
+
one tiny decodable story
+
parent reading progress card
```

The result must be runnable locally.

Target development command should remain:

```bash
pnpm dev
```

The reading experience should work in:

```text
desktop browser
tablet layout
mobile browser
```

---

# 95. INITIAL ACCEPTANCE TEST

Create a test learner:

```text
Name:
Maya

Age:
4

Reading Level:
Beginning Pre-Reader
```

Test sequence:

```text
1. Enter Reading Adventure.

2. Complete simple placement.

3. App identifies beginner starting point.

4. Nova teaches /m/.

5. Child identifies letter m.

6. Child practices /s/, /a/, /t/.

7. Child enters Blend Train.

8. Child blends:
m-a-t

9. Child builds:
mat

10. Child reads:
"Sam sat."

11. System records attempts.

12. Mastery updates.

13. Parent dashboard reflects progress.

14. Next session contains spaced review.
```

If this full path works, the first Reading Module vertical slice is successful.

---

# 96. PRODUCT STANDARD

The Reading Module should never feel like:

```text
a worksheet website
```

It should feel like:

```text
a world in which reading ability unlocks adventure.
```

The educational engine beneath that world must remain:

```text
systematic
explicit
adaptive
measurable
developmentally appropriate
curriculum-driven
```

---

# 97. FINAL PRODUCT VISION

CurioQuest Reading Adventure should help a child progress from:

```text
"I know some letters."
```

to:

```text
"I can hear sounds."
```

then:

```text
"I know what sounds letters make."
```

then:

```text
"I can put the sounds together."
```

then:

```text
"I can read words."
```

then:

```text
"I can read a sentence."
```

then:

```text
"I can read a book."
```

and finally:

```text
"I understand what I read,
and I want to keep reading."
```

That is the goal of CurioQuest Reading Adventure.
