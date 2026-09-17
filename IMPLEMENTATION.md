# CurioQuest first playable edition

Based on retrieved September 17 CurioQuest blueprint excerpts: mission-first learning, two profiles, Word Forest, Number City, Logic Mountain, Daily Quest, adaptive practice and a parent dashboard. This implements the first V1 slice, not the full V1–V5 roadmap.

- 108 authored/template activities, 54 per track; three subjects with three trails and six activities per trail.
- Five-question sessions. Correct answers advance. Wrong answers allow retries. Hints and retry history affect the independent-answer measure.
- Subject trail adjusts at each five completed activities using cumulative independent accuracy: advance at >=80%; step back below 50%. This is a simple practice heuristic, not validated adaptive assessment or demonstrated mastery.
- D1 stores each profile, session, progress, stars, and the last 100 completed sessions. Conditional revision updates reject conflicting writes. Repeated stale answers cannot award extra stars.
- Profiles default to Maya / Grade 1 and Lydia / Pre-K; names and tracks editable. Track changes preserve rewards/history and reset current learning progress.
- Private owner-only site is the security boundary. Do not make public/shared without family authentication and owner-scoped data access. Parent arithmetic gate is convenience only.
- Nova provides authored hints and browser speech synthesis, not generative AI. Voice availability depends on the device.
- Next blueprint phases: broader activity formats, explicitly sequenced literacy curriculum, curriculum review, richer mastery model, science, Creator Mode, offline missions, sibling Team Quest, bounded AI integration, and family accounts before public sharing.

Verification: TypeScript check and production build; 108 unique question IDs and valid distinct answer choices; browser end-to-end Daily Quest including incorrect answer, retry, completion, reward, reload persistence, and separate pre-K profile. WebMCP registry unavailable in testing browser; optional registration is feature-detected.
