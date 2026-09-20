# CurioQuest Commercial-Grade Product Vision

## Mission

Transform the existing CurioQuest application into a polished, scientifically informed, age-adaptive, content-rich, commercial-grade children's learning platform.

The target is a substantial product-wide improvement across the entire application. "80% better" is not a literal score; it means the improvement should be obvious to parents and children in visual quality, usability, learning depth, content volume, responsiveness, personalization, reliability, and commercial polish.

## Non-Negotiable Scope

The transformation covers the whole application:

- Welcome
- Login
- Signup
- Password reset
- Parent onboarding
- Child profile creation
- Profile selection
- Child home
- Today's Adventure
- Navigation
- Reading
- Math
- Science
- Logic
- Brain training
- General knowledge
- Games
- Drawing
- Creative Studio
- Stories
- Videos
- Discovery
- Rewards
- Achievements
- Progress
- Parent dashboard
- Parent controls
- Settings
- Loading states
- Empty states
- Error states
- Responsive behavior
- Accessibility
- Performance
- Supabase integration
- Security
- PWA readiness

Do not leave prototype-quality screens deeper in the application.

## Product Experience

CurioQuest should not feel like a collection of cards, quizzes, or disconnected mini-games.

It should feel like a connected learning world where the child:

- reads
- listens
- speaks
- solves
- explores
- creates
- draws
- predicts
- experiments
- remembers
- compares
- reasons
- builds
- discovers

The parent should experience:

- trust
- visibility
- control
- understandable progress
- meaningful recommendations
- strong product quality

## Science-Informed Learning

Use established learning principles where appropriate:

- active learning
- retrieval practice
- spaced practice
- cumulative review
- interleaving
- mastery learning
- scaffolding
- worked examples
- gradual release of responsibility
- manageable cognitive load
- immediate meaningful feedback
- dual coding
- multimodal instruction
- prior-knowledge activation
- metacognition
- productive struggle
- transfer of learning

Do not surface these as jargon to children. Implement them in the activity design.

## Age Adaptation

The selected child profile must fundamentally change the experience.

### Ages 3–4

Use:

- very large touch targets
- audio-first instructions
- minimal reading
- short activities
- visual matching
- colors
- shapes
- basic counting
- object identification
- simple patterns
- simple memory
- picture stories
- movement and drawing

### Ages 4–5 / Pre-K

Use:

- alphabet recognition
- phonological awareness
- letter sounds
- rhyming
- syllables
- counting
- number recognition
- quantities
- comparisons
- shapes
- patterns
- sequencing
- vocabulary
- listening comprehension
- tracing
- drawing
- classification

### Kindergarten

Introduce:

- systematic phonics
- blending
- segmenting
- CVC words
- sight/high-frequency words where appropriate
- early sentences
- early comprehension
- addition/subtraction foundations
- measurement concepts
- geometry
- science observation
- reasoning
- storytelling

### Grade 1

Increase:

- decoding
- fluency
- vocabulary
- spelling
- sentence structure
- reading comprehension
- main idea/details
- addition/subtraction
- place value
- word problems
- time
- money introduction
- science reasoning
- writing
- logic

### Grade 2

Increase:

- longer passages
- vocabulary in context
- grammar
- inference
- summarization
- expanded arithmetic
- place value
- measurement
- time
- money
- multiplication foundations
- fraction foundations
- science investigation
- geography
- writing

### Grade 3

Introduce:

- deeper comprehension
- informational text
- paragraph writing
- multiplication
- division
- fractions
- multi-step word problems
- geometry
- ecosystems
- matter
- forces
- Earth and space
- geography
- history/general knowledge
- coding-style reasoning

Older-child experiences should look and feel more mature, not like preschool screens with harder questions.

## Curriculum Areas

### Reading

Support a progression from:

phonological awareness → phonemic awareness → alphabet knowledge → phonics → decoding → word recognition → vocabulary → fluency → sentence comprehension → passage comprehension → inference → informational reading → writing connection

### Math

Use concrete → representational → abstract progression where appropriate.

Support:

- number sense
- counting
- quantities
- arithmetic
- place value
- number lines
- geometry
- measurement
- time
- money
- fractions
- multiplication
- division
- reasoning
- word problems

### Science

Prioritize:

observe → predict → test → compare → classify → manipulate → discover → explain

Cover topics such as:

- animals
- habitats
- plants
- life cycles
- weather
- seasons
- human body
- Earth
- oceans
- ecosystems
- space
- forces
- motion
- magnets
- light
- sound
- matter
- simple machines

### Logic and Executive Function

Include:

- patterns
- sequences
- classification
- analogies
- mazes
- spatial reasoning
- working memory
- visual discrimination
- auditory memory
- planning
- sequencing
- inhibitory control
- flexible thinking

### Creativity

Support:

- drawing
- tracing
- coloring
- story illustration
- design challenges
- symmetry
- pattern creation
- invention challenges
- open-ended storytelling

### General Knowledge

Include age-appropriate:

- geography
- animals
- cultures
- transportation
- inventions
- community
- occupations
- environment
- history foundations
- technology

### Social-Emotional Learning

Include appropriate concepts such as:

- identifying emotions
- empathy
- cooperation
- friendship
- persistence
- healthy habits
- responsible decision-making

## Adaptive Learning

Track skill-level performance, not only lesson completion.

Potential signals:

- accuracy
- attempts
- hints used
- response time
- difficulty
- completion
- review history

Support mastery states such as:

- new
- learning
- practicing
- proficient
- mastered
- review

If a child struggles:

- reduce difficulty
- increase scaffolding
- revisit prerequisites
- add examples
- use guided practice

If a child succeeds:

- increase challenge
- reduce unnecessary scaffolding
- introduce transfer tasks

Use spaced review so previously learned skills return periodically.

## Content Architecture

Content should be data-driven and scalable.

Recommended hierarchy:

Subject
→ Domain
→ Skill
→ Unit
→ Lesson
→ Activity
→ Interaction

Metadata should support:

- age range
- grade
- subject
- skill
- difficulty
- prerequisites
- learning objective
- duration
- activity type
- media requirements

Avoid giant hard-coded React components containing curriculum.

## Interaction Variety

Support multiple formats:

- multiple choice
- picture choice
- drag and drop
- matching
- sorting
- sequencing
- fill in the blank
- typing
- tracing
- drawing
- counting
- number lines
- manipulatives
- puzzles
- memory games
- word building
- sentence building
- listening
- interactive diagrams
- simple simulations
- creative challenges
- off-screen real-world prompts

## Commercial UX

CurioQuest must feel designed specifically for children and parents.

Child-facing design should emphasize:

- clarity
- touchability
- visual guidance
- age-appropriate language
- safe navigation
- limited cognitive overload
- immersive activities

Parent-facing design should emphasize:

- progress clarity
- settings
- goals
- activity history
- useful recommendations
- trust

## Full-Screen Experiences

Games, Drawing, Stories, Videos, Puzzles, and interactive activities should support immersive full-screen mode where appropriate.

Use browser Fullscreen API where supported with graceful fallback.

## Responsive Design

Support:

- small phones
- large phones
- iPad Mini
- standard iPad
- iPad Air
- iPad Pro
- Android tablets
- Chromebooks
- small laptops
- desktop
- large desktop

Support portrait and landscape.

Avoid:

- horizontal overflow
- clipped UI
- overlapping controls
- tiny touch targets
- broken canvases
- excessive empty space
- desktop-only layout assumptions

## Rewards

Rewards may include:

- XP
- stars
- badges
- achievements
- collectibles
- world unlocks
- avatar items
- streaks

Reward meaningful learning, persistence, review, creativity, and mastery.

Do not reward meaningless clicking or excessive screen time.

## Parent Dashboard

Show meaningful information such as:

- child profiles
- learning time
- activities completed
- subject progress
- current skills
- mastered skills
- developing skills
- recent activity
- achievements
- trends
- recommended focus
- reading progression
- math progression

Do not show fake or arbitrary percentages.

## Privacy and Safety

Design conservatively for children's software:

- parent-owned account
- child subprofiles
- minimal child data
- no unnecessary child email
- no public profile
- no public messaging
- no behavioral advertising
- no unsafe external links in Child Mode
- no unmoderated social features
- secure parent-only areas
- correct Supabase RLS

Do not claim legal compliance unless formally reviewed.

## Performance

Audit and optimize:

- bundle size
- large images
- video loading
- animations
- rerenders
- database requests
- waterfalls
- unused code

Use appropriate:

- lazy loading
- optimized images
- caching
- code splitting
- skeletons
- deferred content

## Acceptance Standard

For each major screen or system compare before vs after:

- Visual: does it look clearly more professional?
- Function: can the child or parent accomplish more?
- Learning: is there deeper educational value?
- Age: does the experience meaningfully adapt?
- Interaction: is the child doing something meaningful?
- Responsive: does it work across devices?
- Feedback: does feedback help learning?
- Content: is there enough depth?
- Polish: does it feel commercially intentional?

If the improvement is small, continue improving it.
