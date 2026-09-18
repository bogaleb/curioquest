# CurioQuest local project

This folder contains the CurioQuest playable prototype source. The complete product specification remains in `PRODUCT_BLUEPRINT.md`; implemented and unfinished features are documented in `IMPLEMENTATION.md` and `docs/product/MVP_BACKLOG.md`.

Included: 324 activity configurations, eight Game Zone collections, Pre-K and Grade 1 tracks, adaptive welcome, Daily Quest, Missing Seeds story, Build Lab, Team Quest, authored hints, four-child profiles, parent PIN/controls, and persistent D1 progress.

Use Node.js 22.13 or newer and the pnpm version in `package.json`. Preserve the pnpm lockfile. For a fresh local setup:

```powershell
pnpm install
pnpm run build
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_left_talisman.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_clammy_annihilus.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0002_fresh_banshee.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0003_silly_vindicator.sql
pnpm start
```

Open the URL printed by the server. Apply each SQL migration once. For an existing pre-Game-Zone database, skip 0000 and apply only 0001 and 0002. If already applied, skip those too. Existing local progress lives in `.wrangler/state`; do not delete it to resolve a build problem.

For an existing Game Zone installation, apply only migration `0003` to add workspace collections (artwork, assignments, activity sets, story progress, prayers, and science observations). It creates a new table and index without changing existing profile records. Stop a running production preview before rebuilding on Windows, because it holds the build files open.

Open Parent Corner to choose your six-digit PIN and save its recovery code. Hosted parent setup binds the private workspace to its signed-in account. Local development uses a separate local-family identity; do not copy the local parent-security tables into the hosted database.

Use `pnpm dev` for development with live updates (default port 5173). The production preview above exercises the built Worker and persisted database directly.

Quality checks: `pnpm run typecheck`, `pnpm test`, `pnpm run build`, and `pnpm run test:integration`. Integration tests use port 4187 and isolated temporary database state, leaving the family database untouched. The test server stops when the test ends; temporary state is retained for debugging.
