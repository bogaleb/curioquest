# CurioQuest expansion release — September 18, 2026

The blueprint remains the source of truth. This is a substantial private-beta expansion, **not completion of every blueprint requirement**. Preserve the existing project and family database.

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

Type checking, lint, unit tests, production builds, isolated D1/API integration tests, and targeted Chromium UI checks are recorded in the development log. Browser-emulated responsive checks are not physical tablet testing. No user family data is used for automated destructive tests.
