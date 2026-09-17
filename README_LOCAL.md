# CurioQuest local project

This folder contains the CurioQuest playable prototype source. The complete product specification remains in `PRODUCT_BLUEPRINT.md`; implemented and unfinished features are documented in `IMPLEMENTATION.md` and `docs/product/MVP_BACKLOG.md`.

Included: 132 activities, Pre-K and Grade 1 tracks, adaptive welcome, Daily Quest, Missing Seeds story, garden Build Lab, Team Quest, authored Nova hints, rewards, four-child profiles, parent evidence, and persistent D1 progress.

Use Node.js 22.13 or newer and the pnpm version in `package.json`. Preserve the pnpm lockfile. For a fresh local setup:

```powershell
pnpm install
pnpm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_left_talisman.sql
pnpm start
```

Open the URL printed by the server. Run the initial SQL only for a fresh database; skip it if the explorers table already exists. Existing local progress lives in `.wrangler/state`; do not delete it to resolve a build problem.

Use `pnpm dev` for development with live updates (default port 5173). The production preview above exercises the built Worker and persisted database directly.

Quality checks: `pnpm run typecheck`, `pnpm test`, `pnpm run build`, and `pnpm run test:integration`. Integration tests use port 4187 and isolated temporary database state, leaving the family database untouched. The test server stops when the test ends; temporary state is retained for debugging.
