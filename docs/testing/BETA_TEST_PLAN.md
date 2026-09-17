# CurioQuest beta checks

Run `pnpm run typecheck`, `pnpm test`, `pnpm run build`, then `pnpm run test:integration`.

Unit coverage includes stable IDs, graph cycles, first-attempt evidence, delayed recall, repeated-item limits, recommendations, structured-answer validation, adaptive welcome in both tracks, and Nova context matching.

Game Zone tests independently solve every robot map, validate all 48 age-specific missions, reject illegal moves/duplicate matching cards, and verify that solutions stay private. Request tests cover malformed and oversized streamed bodies.

Isolated integration tests complete both story tracks, reject stale answers, check retry evidence, save gardens, confirm real-world missions, record feelings/reflections, finish both Team Quest roles, check idempotent shared rewards, create learners, and complete/resume their welcome adventures.

They also complete all 48 Game Zone missions, reload passport/favorites, verify paused play is rejected, export authorized records, reject another signed-in identity, and exercise parent setup, lock, unlock, retry limiting, and recovery rotation.

Before release, manually test:

- Phone/tablet portrait and landscape: choices fit, touch sorting and garden editing work, dialogs remain reachable.
- Keyboard/screen reader: focus enters/restores, Tab stays in dialogs, feedback is announced, no drag-only action.
- Network loss during answer/save: recovery without false completion or duplicate rewards. Offline application support is not implemented.
- Multiple windows: conflicting changes recover correctly after reload.
- Family authorization: automated coverage rejects another identity after private parent setup; manually validate platform sign-in, account switching, cookie expiry, and recovery-code storage.
- Both learner tracks with children: instructions, effort, use of help, frustration, stop/resume behavior.
- Siblings: clear roles and shared goals without score comparison or pressure.

No browser/device or child-observation results have been recorded for this implementation pass.
