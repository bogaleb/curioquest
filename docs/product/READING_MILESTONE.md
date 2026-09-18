# Reading Adventure — Section 94 milestone

Implemented September 18, 2026 against the supplied [Reading Module blueprint](READING_BLUEPRINT.md), sections 94–95. The main PRODUCT_BLUEPRINT.md remains the product specification. This is a bounded Pre-K vertical slice, not the entire Reading V1 curriculum.

## Playable flow

Open Reading Adventure from the home invitation or navigation. A brief, forgiving placement chooses a beginning pre-reader or early-blending starting path. A child who chooses “I’m still learning this” twice begins with m, s, a, t. The first quest teaches each sound, catches its letter, joins the Blend Train for mat, builds mat in Sound Boxes, and opens Sam Sat when prerequisites are ready. Subsequent quests introduce p, i, n, vary available words, and prioritize due sound reviews.

- Three reusable activity components and a tiny decodable reader; 7 sound lessons, 11 skill records, 18 words, and 1 two-page book.
- Device read-aloud, clean-sound mouth cues, four scaffold levels, touch targets, keyboard slider/tile controls, reduced motion, modest success feedback, and meaning pictures after decoding.
- Per-child placement, session position, story page, help level, attempts, mastery estimates, review dates, books, and rewards persist in D1. Unsaved tile arrangement and slider position are presentation state; reloading resumes the current activity.
- Parent Corner reading card reports independent-choice versus guided evidence and upcoming reviews. Confirmed reading restart preserves historical attempts and stars; confirmed full learning reset clears reading records. Child deletion cascades to reading records. Parent family export includes reading profiles and attempts.

## Architecture / evidence rules

Retained React/Vinext, Cloudflare D1, family authorization, expiring parent PIN sessions, audio preferences, revision checks, and the existing navigation. No new auth service, Supabase migration, AI subscription, microphone, or browser-only progress database.

Migration 0004 adds reading_skills, reading_words, reading_stories, reading_settings, reading_profiles, and reading_attempts. Catalog defaults seed only when the catalog is absent. Sequence, prerequisites, words, story text, and readiness/mastery/review settings live in editable database records. Editing requires a maintainer and content validation; there is no parent curriculum editor in this milestone.

The server rechecks word/story readiness at each transition. Readiness for practice is not mastery. Only the first answered response per activity changes the estimate. Skips and retries remain in the audit trail without inflating evidence. Guided blending and immediate teaching are supported practice. Page turns are not scored. Mastery requires repeated independent choices across days plus delayed review, and is not a claim about independently spoken reading. No speech assessment is performed.

A unique server mutation nonce ties attempts and completion rewards to the successful revision update in one database batch. Duplicate or racing requests receive a conflict and cannot issue a second reward. Parent pauses, schedules, family boundaries, and reset authorization apply to the reading API.

## Verification

- TypeScript, lint (no errors; two existing image advisories), 33 unit tests, and production build pass.
- Isolated end-to-end API test creates Reading Maya, age 4, Pre-K; completes the Section 95 flow; verifies persisted parent export, private story answers, teaching prerequisites, unsupported tile rejection, concurrent completion, pause, confirmed reset, and profile deletion.
- Unit tests cover the specified sequence, decodable filtering, unknown words, guided versus independent evidence, retry resistance, same-day review stability, delayed review, and phoneme error categories.
- Chromium UI: placement, all first four sounds, keyboard-operated train, tap-to-build mat, both story pages, comprehension, completion stars, and parent reading evidence. Layouts checked at 1280×720, 1280×620, 768×1024, and 390×844; no phone horizontal overflow or page errors observed.

## Deliberately unfinished beyond this milestone

- Human-recorded phonemes and educator listening review. Device TTS quality varies; the parent card explains this, and optional audioSrc fields support later recordings.
- A validated reading assessment, microphone/oral fluency scoring, advanced blending/VC lesson coverage, full Kindergarten/Grade 1/Grade 2 reading curriculum, broad decodable library, detailed parent reports, and cross-domain quest integration.
- Physical touch/stylus testing, Safari, screen-reader review, and child/educator usability testing. Browser viewport testing is not physical-device certification.
- Reading currently has its own adaptive quest alongside the preserved general Daily Quest. Its catalog is intentionally small. The broader product remains a private beta; see RELEASE_STATUS.md.
