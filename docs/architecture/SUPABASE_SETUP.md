# CurioQuest Supabase setup

The active app uses native Next.js 16 and Supabase. Existing learning components, scoring engines, stars, parent controls and API response contracts are retained. Historical D1 files/data are preserved for explicit transfer; active routes no longer write to D1.

## Development

Use Node >=22.13 and the pnpm version in package.json. Copy `.env.example` to ignored `.env.local` and set:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_KEY
SUPABASE_SECRET_KEY=sb_secret_YOUR_SERVER_ONLY_KEY
```

Use the project origin without `/rest/v1/`. The secret client is protected by `server-only` and used only by verified parent-scoped server routes. Never prefix the secret with `NEXT_PUBLIC_`. Do not commit actual credentials.

Run `pnpm install --frozen-lockfile`, `pnpm supabase:check`, then `pnpm dev`. Open http://localhost:5173. Create and confirm a parent account, set the existing Parent Corner PIN and create/select a child. New accounts start empty. Children need no emails; the existing four-child limit is preserved. `pnpm build` and `pnpm start` run the production build.

## Migrations

With a CLI account that has access to the chosen project:

```powershell
pnpm dlx supabase login
pnpm dlx supabase link --project-ref YOUR_PROJECT_REF
pnpm dlx supabase db push --dry-run
pnpm dlx supabase db push
pnpm supabase:check
```

Inspect the dry run and reconcile existing objects instead of dropping them. The configured project already has foundation migration `20260918000100`, applied through SQL Editor and verified. CLI administrative access is unavailable. Run `pnpm supabase:bundle` and execute the exact contents of `work/supabase-upgrade.sql` in SQL Editor to apply migrations 002?005 atomically. Do not run the bundle twice. Fresh projects must apply all five migrations in order instead.

Expected health version is **202609180005**. The hosted upgrade was applied and verified on 2026-09-19. Do not run the upgrade bundle again on this project. There is no silent D1 fallback.

After SQL Editor execution succeeds and CLI access is available, record only successfully applied files:

```powershell
pnpm dlx supabase migration repair 20260918000100 20260918000200 20260918000300 20260918000400 20260918000500 --status applied --linked
```

This records history; it does not apply SQL. Subsequent changes require new forward migrations.

## Implemented phases

1. Typed browser/SSR clients, cookie refresh, health probe and versioned migrations.
2. Parent signup, confirmation callback, sign-in/out and password recovery. Protected routes verify current identity with `getUser()`; proxy refresh does not authorize requests.
3. Owned parent/child profiles, child selection, and parent-scoped PIN/recovery/rate limits.
4. Seeded subjects, units, lessons, activities and questions; answer keys and full engine catalogs remain private.
5. Persistent attempts, sessions, progress and engine compatibility snapshots, with transactions and revision checks.
6. Existing stars, achievements, inventory and placements, with a reconciled reward ledger. No new visible XP currency.
7. Existing Parent Corner evidence, controls, saved collections and exports backed by owned Supabase records.
8. Private Storage buckets, PIN-gated `/account/media`, signed URLs, MIME/signature validation and 10 MB uploads. Existing procedural animation and speech fallbacks remain.

RLS protects exposed tables. Browser roles cannot execute `cq_read`, `cq_commit` or `cq_import`, or write trusted progress. Server repositories derive parent IDs from verified request context, never client payloads. Restricted RPCs enforce ownership and composite foreign keys prevent cross-family references. The selected child is not an independent security principal; the browser holds its parent's session. Realtime remains future work.

Compatibility JSON snapshots remain authoritative for existing engines. Relational attempt/session/progress/reward projections update transactionally with them. This preserves scoring logic without duplicating it in SQL; not every engine field is fully normalized.

## Existing family transfer

Back up D1 and retain `.wrangler/state`. Obtain the old Parent Corner schemaVersion 4 export, then explicitly choose its correct email-confirmed parent account:

```powershell
pnpm supabase:import -- --parent-id VERIFIED_PARENT_UUID --file PATH_TO_LEGACY_EXPORT.json
```

The destination must be empty. The importer remaps IDs, preserves profiles, collections, reading/experience state and existing evidence, and records opening star balances. Exact-file replays are idempotent. It does not fabricate missing historic attempts or import PIN secrets. Set a new PIN and reconcile balances, saved work and resumed sessions before retiring the legacy writer. No existing family has been imported automatically.

## Verification

```powershell
pnpm test
pnpm typecheck
pnpm build
$env:PG_BIN = 'C:/Program Files/PostgreSQL/17/bin'
pnpm supabase:test-db
pnpm test:integration
```

The runner creates a disposable PostgreSQL 17 cluster on loopback port 55439, applies all migrations, checks RLS/private answers/constraints/import idempotency and compares generated types. Set `SUPABASE_TEST_PORT` if needed. On other platforms place binaries on PATH or set `PG_BIN`; run as a non-root OS user. Its own server is stopped afterward; temporary files remain for troubleshooting. Existing databases are untouched.

The integration suite passed 1,975 real PostgreSQL RPC calls covering all 48 games, reading, interactive experience, saved sessions, teams, PIN controls, collections, assignments, stories, export, reset and deletion. It checks two-family isolation and star ledger reconciliation. Only Auth verification and HTTP transport are replaced in this isolated suite. This does not prove hosted email delivery, browser rendering or the Storage service.

The native Next.js production build also passed. A live Auth smoke test against the configured hosted project verified rendered auth pages, anonymous route denial, CSRF rejection, actual password sign-in, SSR session cookies and sign-out. Its temporary account was deleted afterward. The server secret was absent from all 25 browser build assets. No interactive browser QA was performed.

After the hosted upgrade, the full live suite passed against the built Next.js server and real Supabase: child creation, saved sessions, a completed quest, persisted correct attempts, duplicate-answer rejection, stars reconciled to the ledger, parent export, two-family route/REST isolation, restricted RPC denial, media upload/signed download/deletion, and denial of another parent's Storage objects. Temporary accounts and objects were cleaned up. No existing family data was changed.

With the local server running, use `pnpm supabase:test-live -- --auth-only` for that Auth smoke test. After the hosted upgrade, run `pnpm supabase:test-live` for real profile/session persistence, two-parent REST/RPC isolation, signed media upload/read/delete and private Storage isolation. It creates only temporary test users, cleans them up afterward, and stops immediately if health does not match. `CURIOQUEST_TEST_URL` can override the default local URL; select the intended environment before running.

Run `pnpm supabase:types` after SQL changes. `node scripts/test-supabase-db.mjs --bundle` verifies the exact combined SQL Editor upgrade. After deployment, curriculum changes must use new forward migrations instead of rewriting the applied seed migration.

## Vercel release

Use the Next.js framework preset, `pnpm install --frozen-lockfile`, `pnpm build`, and the default Next.js output directory. Set all three environment variables separately in Vercel. Use separate staging/production Supabase projects; previews must not mutate production families. Retained Sites/Cloudflare metadata is historical, not the active deployment path.

`vercel.json` declares the native Next.js framework and commands. `.github/workflows/verify.yml` runs type checking, unit tests, a production build with placeholder public configuration, and PostgreSQL 17 migration/RLS/type/integration checks without hosted credentials. PostgreSQL installation follows the [official Ubuntu repository instructions](https://www.postgresql.org/download/linux/ubuntu/). Both GitHub jobs passed on commit `488aec9`. Require both jobs in branch protection before releases; deployment credentials are not needed for these checks.

Configure Supabase email/password authentication, email confirmation, production Site URL and exact local/staging/production `/auth/callback` redirect URLs, including the reset callback query. Configure production SMTP and verify signup confirmation and password recovery delivery.

The user deployed to https://curioquest-iota.vercel.app/ and the full live integration suite passed there on 2026-09-19, including account cookies, completed learning, rewards, exports, family isolation and private media. Browser QA, real signup/recovery email delivery and any legacy transfer remain release checks. Apply migrations before future matching releases. After Supabase accepts new writes, rollback requires reconciling those writes with the backup, not merely reverting code.

References: [Supabase SSR](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [migrations](https://supabase.com/docs/guides/local-development/database-migrations), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security).
