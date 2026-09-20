# CurioQuest local development

The active app uses native Next.js 16 and Supabase, preserving the existing learning interface and engines.

1. Use Node >=22.13 and the pnpm version in package.json.
2. Run `pnpm install --frozen-lockfile`.
3. Copy `.env.example` to `.env.local` and configure the URL, publishable key and server-only secret key.
4. Follow [the Supabase runbook](docs/architecture/SUPABASE_SETUP.md) to apply migrations, then run `pnpm supabase:check`.
5. Run `pnpm dev` and open http://localhost:5173. Create/confirm a parent account, set the parent PIN and create a child.

Use `pnpm build` and `pnpm start` for the production server. Checks: `pnpm typecheck`, `pnpm test`, `pnpm test:integration` (requires PostgreSQL binaries; see the runbook).

The Cloudflare/D1 half of the stack was removed in WP-00. If this checkout still has a `.wrangler/`
directory, it holds legacy local family progress: export it with `node scripts/export-legacy-d1.mjs`
and replay it into Supabase with `pnpm supabase:import -- --parent-id <uuid> --file work/d1-export.json`
before deleting the directory. The runbook documents imports, Vercel configuration and remaining
hosted verification gates.
