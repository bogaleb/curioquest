# CurioQuest Game Zone

Eight collections each have three missions of four activities. Both learning tracks have their own mission configurations. This adds 192 template configurations, not 192 distinct skills or 192 distinct games.

- Robot Commander: plan, run, revise a route around obstacles. Maps are independently checked with a breadth-first solver.
- Number Kitchen: build quantities and model arithmetic using interactive ten-frames.
- Word Workshop: Pre-K matches letter cases; Grade 1 builds spoken CVC picture words.
- Memory Train: untimed reveal/hide/recall; replaying the sequence counts as support.
- Pattern Carnival: complete AB, AAB, and ABB repeating units.
- Shape Safari: match shapes, notice their properties, and identify flat outlines in familiar objects.
- Story Steps: order familiar routines with touch or keyboard controls.
- Story Cove: six original stories, read-aloud, explicit-detail questions, and Grade 1 cause/effect questions.

Content is authored/template-based and needs educator and child review before broad release. Activities are not proof of developmental readiness or validated mastery. No timer, leaderboard, ads, or chance-based purchase mechanic is used.

Source contracts: catalogue in `lib/arcade.ts`, private content in `lib/arcade-content.ts`, controls in `components/learning/arcade-engines.tsx`, shared player in `components/learning/quest-player.tsx`. Existing Daily Quests may select the new activities; game missions save their own passport progress without duplicating mastery records.

## Playing and switching

Each collection has a prominent Play or Continue button. An unfinished quest no longer disables all game missions. Switching games saves the previous session on the explorer profile, including completed discoveries, attempts, and hint use. Returning restores the same session without awarding duplicate stars. The saved-adventures shelf can also restore a Daily Quest, story, welcome discovery, or Team Quest interrupted by a game. Unsubmitted work on the current question is not saved. Later missions still unlock in sequence, with an explicit explanation.

Navigation uses a full vertical menu on desktop and a two-row tile grid on phones; neither requires scrolling inside the menu. The player keeps a labeled Back to games button visible on small screens.

Regression coverage includes switching after an answer and hint, reloading, returning to the same question, stale-answer rejection, per-explorer isolation, parent pause enforcement, and Team Quest restoration. Device-level visual testing remains outstanding when no browser is connected.

## Illustration

Saved asset: `public/game-zone.png`, generated with the built-in image tool and inspected before integration.

Final prompt: Create a premium storybook illustration for the CurioQuest educational GAME ZONE hero banner. Landscape panoramic 1536x1024. No text, no letters, no numbers, no logos. Warm cream and sage green palette, sunshine gold and touches of dusty lavender and sky blue. A lovable orange fox child explorer with small backpack and a friendly rounded toy robot stand together on a winding golden path in a tiny fantastical garden carnival. Include a whimsical little wooden toy train carrying fruit and flowers, oversized wooden alphabet-like blocks without letters, a butterfly, and faraway gentle purple hills. Tactile hand-painted gouache with delicate paper grain, lush detailed plants, editorial children's picture book quality, cozy, calm and richly inviting. Main characters and carnival concentrated in CENTER and RIGHT two-thirds; LEFT third has quiet pale warm cream sky, gently blending to scenery, useful for UI overlay. Soft sunny lighting, dimensional storybook world, beautiful landscape full of discovery. Not a UI mockup, not an infographic, no interface elements or buttons. Project asset for existing illustrated learning app.
