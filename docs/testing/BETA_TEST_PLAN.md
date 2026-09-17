# CurioQuest beta checks

Run `pnpm run typecheck`, `pnpm test`, `pnpm run build`, then `pnpm run test:integration`.

Unit coverage includes stable IDs, graph cycles, first-attempt evidence, delayed recall, repeated-item limits, recommendations, structured-answer validation, adaptive welcome in both tracks, and Nova context matching.

Isolated integration tests complete both story tracks, reject stale answers, check retry evidence, save gardens, confirm real-world missions, record feelings/reflections, finish both Team Quest roles, check idempotent shared rewards, create learners, and complete/resume their welcome adventures.

Before release, manually test:

- Phone/tablet portrait and landscape: choices fit, touch sorting and garden editing work, dialogs remain reachable.
- Keyboard/screen reader: focus enters/restores, Tab stays in dialogs, feedback is announced, no drag-only action.
- Network loss during answer/save: recovery without false completion or duplicate rewards. Offline application support is not implemented.
- Multiple windows: conflicting changes recover correctly after reload.
- Family authorization: cross-family access and unauthorized parent mutations are rejected after ownership is implemented.
- Both learner tracks with children: instructions, effort, use of help, frustration, stop/resume behavior.
- Siblings: clear roles and shared goals without score comparison or pressure.

No browser/device or child-observation results have been recorded for this implementation pass.
