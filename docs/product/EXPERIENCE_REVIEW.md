# CurioQuest experience review — 2026-09-19

## Current evidence

The deployed app reports database version 202609180005. Parent accounts, family isolation, saved learning, stars and media have passed hosted integration checks. GitHub application and PostgreSQL integration jobs passed after fixing the Linux test socket directory. These establish functionality, not educational effectiveness.

The review found that the child home emphasized one fixed story above the adaptive reading/math/logic quest, hid subject entry points, silently ignored experience-loading failures, and did not explain the skill behind an activity. Existing content has Pre-K and Grade 1 tracks, prerequisite/review logic, 48 game missions, reading practice, stories and creativity. Curriculum breadth and evidence variety still fall short of the full product blueprint.

## This implementation

- Reuse the original island artwork in a brighter, responsive home with distinct forest/number/mountain colours, restrained motion, visible keyboard focus and reduced-motion support.
- Prioritize the saved quest or existing adaptive daily quest. Subject portals use the existing server recommendation/scoring engine; the home does not invent a second recommendation algorithm.
- Show recorded stars, completed quests and counts of skills actually practised. Practice counts are not mastery claims.
- Adapt descriptive copy and optional real-world activities to the selected learning track. An age alone does not advance a child to harder content.
- Preserve the interactive story, games, reading, creativity, building, world inventory, parent controls and all learning data.
- Give story-loading failures a visible retry path and explain which skill the current quest activity practices. Completion summaries use the recorded session's skill IDs.

## Next priorities

1. **Observe real use:** connect a browser for desktop/tablet/phone, keyboard and reduced-motion review; run moderated sessions with Pre-K and Grade 1 families. Inspect reading burden, navigation, frustration, help use and audio reliability. No visual/browser validation is claimed for this pass because no browser is connected.
2. **Strengthen instruction:** audit every active skill for prerequisite readiness, an explicit model, guided practice, independent variants, useful feedback and later review. Add content in reviewed strands, not arbitrary volume. Review currently inactive skill nodes before expanding availability.
3. **Improve reading evidence:** verify phoneme audio, blending instruction, decodable-text alignment and comprehension opportunities with a qualified early-literacy reviewer. Device speech is a fallback, not verified phoneme instruction.
4. **Improve math evidence:** review manipulatives, count-to-quantity correspondence, parts/wholes, progression and transfer examples. Gather evidence across different representations rather than counting repeated correct clicks as mastery.
5. **Improve parent insight:** make the next helpful action clearer, distinguishing supported success, independent success and retained learning. Pilot concise reports with families before adding notification volume.
6. **Complete release checks:** email confirmation/recovery delivery, browser accessibility, production environment checks, and any explicit legacy import. Keep unreviewed content gated. PWA/offline/native packaging remains later work.

## Instructional references

The IES [early-math practice guide](https://ies.ed.gov/ncee/wwc/practiceguide/18) recommends developmental progressions and monitoring what children know. The [foundational-reading guide](https://ies.ed.gov/ncee/wwc/Docs/practiceGuide/wwc_foundationalreading_040717.pdf) addresses sound-letter relationships, decoding and connected text. These inform review priorities; they do not validate CurioQuest or establish that the app improves learning outcomes.
