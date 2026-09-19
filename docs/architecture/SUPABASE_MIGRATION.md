# CurioQuest Supabase migration architecture

Audit date: 2026-09-18. This document records the pre-migration architecture, including existing uncommitted experience features. Phases 1?8 now have local implementations; see [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for implemented clients, migrations, verification, and hosted setup. The original audit itself made no application changes.

## Migration decision

Preserve the current components, CSS, navigation, animations, learning engines, and API response contracts. Replace persistence behind those contracts incrementally. This is a migration from an existing single-family Cloudflare D1 backend, not simply a replacement of browser-local mock data.

The destination is native Next.js App Router on Vercel, with Supabase Auth, PostgreSQL, RLS, and Storage. Keep the working Sites/Vinext deployment available during migration. Do not deploy the current code to Vercel unchanged: its database modules import `cloudflare:workers`.

## Architecture audit

| Area | Existing implementation and migration implication |
| --- | --- |
| Framework | `package.json`: Next.js **16.3.4**, React/React DOM **19.2.6**, TypeScript **5.9.3**, Tailwind **4.2.1**. App Router files, but `scripts/run-framework.mjs` actually runs **Vinext 1.0.0-beta.5**, Vite **8.0.13**, and Cloudflare tooling. pnpm **11.25.0** is the declared package manager; Node >=22.13.0. |
| Hosting | `.openai/hosting.json` declares D1 binding `DB`, no R2 bucket. `vite.config.ts` configures Sites and Cloudflare; `start` runs Wrangler. Native `next dev/build/start` is not the current execution path. |
| Frontend | `app/page.tsx` is the client application controller. Existing learning, reading, and experience components call `/api/*`; `app/layout.tsx` loads the existing styles and creates metadata. Child selection already exists. Preserve this interface and the response DTOs. |
| Authentication | `lib/parent-security.ts` relies on a trusted Sites identity header, a localhost `local-family` identity, and one `parent_lock` row (`id=1`). A six-digit PIN, PBKDF2 hash, recovery hash, rate limit, and 15-minute HttpOnly parent cookie protect adult operations. This assumes one private family per Site; it is not multi-tenant email authentication. `app/chatgpt-auth.ts` contains separate header-based auth helpers, with no external call sites found in app/lib/db. |
| Browser persistence | No application references to `localStorage`, `sessionStorage`, or IndexedDB found. UI selection/loading state is React state; durable records are in D1. There is no browser lesson store to migrate. |
| Database | `db/schema.ts` defines SQLite tables through Drizzle; active routes/stores mainly use raw prepared D1 SQL via `db/raw.ts`. Existing migrations are `drizzle/0000` through `0005`. JSON text payloads and optimistic `revision` checks are pervasive. |
| Mock/default data | `/api/quest` creates Maya and Lydia when the global explorer table is empty. Profile IDs include `maya`, `lydia`, and `explorer_<uuid>`; they are not uniformly UUIDs. Reading/experience stores seed authored catalogs on demand. Seeded curriculum is real application content, not disposable placeholder data. |
| Lesson JSON | No standalone lesson `.json` files found. `lib/curriculum.ts`, `skill-graph.ts`, `garden-content.ts`, `arcade-content.ts`, `campaign.ts`, `story-library.ts`, `science-lab.ts`, `reading/content.ts`, and `experience/content.ts` contain authored/generated TypeScript content. Several catalogs are then serialized into D1 JSON text fields. Drizzle snapshot JSON files describe schemas, not lessons. |
| Parent/child structures | There is no parent profile entity or `parent_id` on explorers. `ExplorerProfile` in `lib/explorers.ts` combines identity, pre-K/grade-1 track, avatar, interests, daily goal, controls, accessibility/audio preferences, favorites, progress, stars, history, and sessions. Current creation caps a family at four children. |
| Progress | `lib/mastery.ts`, `recommendation.ts`, `discovery.ts`, and `saved-sessions.ts` track evidence, independence, hints, review dates, skill confidence, paused/resumable sessions, and histories. Reading has its own mastery/profile/attempt records. Experience state tracks daily runs, media cues, collector progress, and offline missions. Preserve these distinctions. |
| XP/rewards | The existing currency is **stars**, not a separate XP ledger. Quest/reading/experience completion grants stars; garden and arcade progression, assignment badges, world inventory, and placements also exist. Do not change earning rules or introduce a second visible currency during migration. |
| Activities | `Question` and `ActivityEngine` model choice, counting, sorting, matching, ordering, routing, memory, and other activities. Reading has dynamically constructed sessions and activities. Existing public serializers omit answers/solutions; retain this boundary when database reads become possible. |
| Media | `public/` contains bundled images/SVGs. Audio uses Web Audio/device speech. Experience assets contain scene metadata; inspected seed video/caption URLs are null. No active object-storage binding or upload API found. Keep procedural animation and speech fallbacks. |
| Concurrency | D1 batches and revision/nonce checks make progress, reading attempts, rewards, and linked experience updates conditional on a winning mutation. Replacing these with independent REST writes would lose transactional guarantees. |

### Existing server interface

Route Handlers, not Server Actions, provide the current backend. No `use server` directives were found in application sources.

| Route | Responsibilities to retain |
| --- | --- |
| `/api/quest` GET/POST | Profiles, child selection data, quests, answers/hints, recommendations, controls, team play, saved sessions, resets/deletion, stars and progression. |
| `/api/parent` GET/POST | Parent gate status, setup, unlock, lock, and recovery. |
| `/api/parent/export` GET | Family export, including reading/experience records and collections. Currently uses whole-database queries under the single-family assumption. |
| `/api/workspace` GET/POST | Parent question sets/assignments, artwork, observations, prayers and other saved collections. Family-owned records currently use a `family` sentinel. |
| `/api/stories` GET/POST | Bookshelf, story scene progress, faith controls. |
| `/api/reading` GET/POST | Placement, reading sessions, responses/help, evidence and reset. |
| `/api/experience` GET/POST | World/media/daily adventures, collector, rewards and placements. |

### Baseline verification

- `npm run typecheck`: passed.
- `npm test`: passed, 36 tests, including reading/mastery, session preservation, curriculum, arcade, and experience coverage.
- Full build, browser checks, and D1 integration suite were not run for this documentation-only change. Existing `scripts/test-integration.mjs` needs a built Cloudflare worker and applies migrations to temporary D1 state; it cannot directly validate Supabase.
- Live D1 contents, deployed configuration, and Supabase credentials/connectivity were not inspected. Code inspection is not proof of the production data inventory.

## Target boundaries

```text
Existing React UI and component DTOs
                |
Existing Next.js Route Handlers + new parent auth routes
                |
Verified parent identity / child ownership / adult gate
                |
Existing learning engines + feature repositories + DTO adapters
                |
Supabase PostgreSQL (RLS + transactional mutations) / Storage
```

Keep pure learning/evaluation functions shared. Extract SQL from routes only as the relevant feature migrates; avoid a generic D1 SQL translator or a second learning engine. Database types do not replace stable public DTOs. Adapters retain existing catalog slugs while UUIDs identify database rows.

### Supabase configuration and authentication design

- Install `@supabase/supabase-js` and `@supabase/ssr` using pnpm in Phase 1 and commit the lockfile update.
- `lib/supabase/client.ts`: typed browser client using `createBrowserClient`.
- `lib/supabase/server.ts`: request-scoped `createServerClient`, `await cookies()`, and documented `getAll`/`setAll` cookie handling. Never share a server auth client across requests.
- `lib/supabase/proxy.ts` and root `proxy.ts`: native Next.js 16 token refresh, propagating refreshed cookies to both the request and response. Preserve cookies when returning redirects. Validate Vinext compatibility separately before enabling this path there.
- Use `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Commit only a placeholder `.env.example` with a narrow gitignore exception. Local values belong in ignored `.env.local`; Vercel development/preview/production have separate configuration.
- Validate configuration when the feature is enabled; return a clear configuration error. Do not silently fall back to another datastore after a write failure.
- Verify JWT claims using `auth.getClaims()` for normal authenticated requests; use `getUser()` where current server-side revocation/account status must be checked. Do not authorize from `getSession()` alone. Proxy refresh does not replace authorization inside routes or RLS.
- Parent email/password signup, confirmation, sign-in, sign-out, password recovery and session expiry are Phase 2. Auth callback routes must validate same-origin return paths and preserve the app's styling. Configure allowed redirects separately per environment; document SMTP/confirmation settings.
- `parents.id = auth.users.id`. Provision idempotently through a reviewed migration function/trigger. Children have no auth accounts or email requirement.
- After authentication, reuse the current explorer chooser. A new parent starts with onboarding, not global Maya/Lydia seeds. The selected child is convenience state; every request still checks ownership.
- Retain the parent PIN gate as an adult/child interaction boundary, scoped to the authenticated parent. It is not a replacement for Supabase Auth. Store PIN/session secrets in a private schema with no browser grants, and require verified adult sessions for sensitive mutations.
- No secret/service-role key in browser code. Implementation decision: verified parent-scoped server repositories use a `server-only` secret client for restricted transactional RPCs after TypeScript engines compute outcomes. Browser roles cannot execute these RPCs or write progress directly. This preserves scoring authority without duplicating engines in SQL. Credentials come exclusively from the environment.

## Initial PostgreSQL model

All application tables use UUID primary keys (normally `gen_random_uuid()`), UTC `timestamptz`, appropriate indexes and explicit foreign keys. Join entities get UUID primary keys plus natural unique constraints. Mutable records use `revision bigint` and timestamps. JSONB retains validated engine-specific payloads; ownership and relationships must be relational, not hidden inside JSON.

| Table | Principal columns, relationships and constraints |
| --- | --- |
| `parents` | `id` FK to `auth.users`, display name, timezone, timestamps. Do not duplicate password storage. |
| `child_profiles` | `id`, `parent_id -> parents`, name, grade, avatar, interests, daily goal, controls/preferences JSONB, revision. Index parent; immutable ownership through normal APIs. Optional scoped legacy ID for import. |
| `subjects` | `id`, unique stable slug (`reading`, `math`, `logic`), title, display order, publication state. |
| `units` | `id`, `subject_id`, slug, grade, title, ordering; unique subject/slug/version. Map existing campaigns and sequences without changing UI. |
| `lessons` | `id`, `unit_id`, slug, version, title, publication state, learning metadata. Published versions immutable while referenced by sessions. |
| `activities` | `id`, `lesson_id`, slug/version, engine kind, validated public configuration, ordering. Dynamic activities are materialized/versioned or captured as immutable session items. |
| `questions` | `id`, `activity_id`, public prompt/options/hints, stable legacy slug/version. Answers/solutions belong in an unexposed private answer-key table, not readable question columns. |
| `learning_sessions` | `id`, `child_id`, kind, status, current index, server-generated plan/snapshot, started/completed/suspended times, active duration, revision. Resume current and parked sessions; support daily/reading/arcade/experience modes. |
| `activity_attempts` | `id`, `child_id`, `session_id`, `activity_id`, optional `question_id`, immutable response/evidence, correctness, hints, attempt number, timing, server timestamp, mutation id. Unique idempotency key per child. Composite session/child FK prevents cross-child session references. |
| `child_progress` | `id`, `child_id`, `skill_id`, domain, mastery/evidence JSONB, counters, last practice/review timestamps, revision; unique child/skill/domain. Session state remains in sessions. |
| `achievements` | `id`, unique slug/version, title, public presentation and trusted rule identifier. |
| `child_achievements` | `id`, `child_id`, `achievement_id`, earned timestamp/source; unique child/achievement for one-time awards. |
| `rewards` | `id`, unique slug/version, type, presentation, trusted earning rule; includes current world/garden rewards. |
| `media_assets` | `id`, optional owning parent, bucket/object path or bundled asset reference, media type, captions/scene metadata, publication state and version. Store paths, not expiring signed URLs. |

Additional tables are necessary to preserve existing features rather than force all data into these core entities:

- `skills` and `skill_prerequisites` for the existing graph; lesson/activity skill joins for multi-skill work.
- `session_items` with frozen content/version references for resumable dynamically assembled sessions.
- `workspace_items` with explicit `parent_id` and optional `child_id`, kind, JSONB and revision; replace the global `family` sentinel and enforce parent/child consistency.
- `reading_profiles` and `experience_profiles` as versioned compatibility snapshots during incremental normalization. Keep one authoritative owner for each field; remove duplicated mutable fields only after parity tests.
- Reading word/story/settings catalogs and interactive media cues to preserve existing authored sequencing and evidence. Private answer keys also cover stories/cues and custom quizzes.
- `reward_events` for an append-only stars ledger, `child_rewards` for owned inventory, and `world_item_placements` for slots. Unique source event prevents double awards; placement must reference an owned inventory item.
- Private parent-gate credentials/sessions, import ID mappings, and migration bookkeeping.

Child-owned rows cascade on approved child deletion. Content with historical references uses restricted deletion or soft retirement. Parent account deletion must explicitly handle database records, Storage objects and Auth identity. Index every ownership FK and common `(child_id, created_at)` query; use bounded pagination for histories/exports.

## Authorization and write integrity

Enable RLS on every exposed table in the same migration that creates it; explicitly grant only needed operations. Anonymous users cannot read family records. Realtime stays disabled until separately needed and tested.

| Data | Policy boundary |
| --- | --- |
| Parent | `id = (select auth.uid())`; only permitted profile fields can be updated. |
| Child | `parent_id = (select auth.uid())`; apply both `USING` and `WITH CHECK` where writes are allowed. Adult-only create/edit/delete goes through guarded operations, without a direct table-write bypass. |
| Progress/sessions/attempts/awards | Ownership via `EXISTS` on `child_profiles` for the row's child. Read own family only. No direct client writes to derived correctness, progress, balance, or awards. |
| Published curriculum | Authenticated read of published safe content; no learner writes. Private answer keys are outside exposed schemas. Parent-authored material is parent-scoped. |
| Family collections | Parent ownership plus a composite FK ensuring any child belongs to the same parent. |
| Media/Storage | Published curriculum objects may be public only when deliberately designated. Family uploads remain private; Storage RLS validates parent and child path ownership. |

Use transactional database functions for attempt + progress + session + award updates. A callable function must validate the authenticated owner, expected revision, current session item, response and idempotency key; it must never accept a client-computed score or arbitrary replacement progress as authoritative. For operations evaluated in TypeScript, use a server-only execution capability whose credentials cannot be obtained by the browser, or move the trusted validation into the RPC. Do not expose a security-definer "save computed state" RPC to authenticated clients.

Default to invoker rights. Where definer functions are necessary for restricted writes or private answer evaluation, use a fixed safe search path, schema-qualified references, minimal grants, explicit ownership checks and carefully restricted execution. Views must respect caller RLS (`security_invoker`) or remain private. Preserve PIN enforcement without allowing direct Supabase calls to bypass it. Child selection does not establish an independent security principal: the browser still has the parent's session.

## Incremental execution plan and gates

| Phase | Change | Required gate before proceeding |
| --- | --- | --- |
| **1. Configuration/connectivity** | Add the two packages, environment template, typed clients, migrations directory and local Supabase configuration. Establish runtime compatibility before enabling auth. Keep D1 as the working source. | Existing typecheck/tests/build pass; local migration reset succeeds; a real publishable-key read against a migrated probe/catalog table succeeds; missing configuration has a clear failure; native Next runtime spike identifies every Cloudflare import. No claim of connectivity based only on client construction. |
| **2. Parent authentication** | Implement account lifecycle, session refresh and a scoped parent identity boundary; preserve PIN UI. | Signup/confirmation/sign-in/out/recovery/expiry and tampered cookies tested. No header/localhost fallback on Supabase paths. During transition only the explicitly mapped legacy owner can use D1 routes; a newly registered parent must never inherit access to the singleton database. |
| **3. Parent/child profiles** | Add ownership/RLS, reuse chooser and profile forms, import legacy IDs, preserve preferences and controls. | Two unrelated parents cannot read/change each other's children through routes, REST, or RPC; adult controls remain gated; profile switching, limits, creation and deletion work. Until legacy records are migrated, linked child IDs need an explicit owner-checked compatibility mapping. |
| **4. Curriculum** | Seed subjects/units/lessons/activities/questions/skills from current catalogs; retain slugs, ordering and payload shapes. | All existing IDs and engines resolve; no answers leak through direct database reads; parked sessions still reference their original content versions; published/parent-authored access tests pass. |
| **5. Attempts/progress** | Replace persistence per learning flow, preserving current evaluation and conservative mastery rules; transactional session/evidence updates. | Resume/reload, duplicate requests, two-tab conflicts, wrong-child session IDs, hints, delayed reviews, team play and offline confirmation pass. No loss of reading/media evidence. Existing star side effects must remain atomic through a minimal compatibility award path until Phase 6. |
| **6. XP/rewards/achievements** | Move stars and existing rewards to trusted ledger/award functions; import balances as explicit opening events. | Retry cannot double-award, balances reconcile, resets retain their existing semantics, inventory/placements stay consistent. Do not invent historical attempt events or new earning rules. |
| **7. Parent dashboard** | Replace existing Parent Corner/evidence/reading/experience queries and export with owned, paginated Supabase data. | Dashboard matches source totals, maintains evidence explanations and controls, handles empty/loading/error states, and cannot export another family. |
| **8. Storage/media** | Add versioned buckets/policies and migrate only appropriate hosted assets/uploads. Keep static art and animation fallbacks. | Private object isolation, upload MIME/size rules, expiring URLs, playback/captions/fallbacks and deletion tested. No native iOS/iPad work. |

Each phase preserves current HTTP error behavior (including revision conflicts), retry controls and loading states, regenerates database types, and passes relevant unit/integration checks before the next phase. Add security/transaction tests for the new boundaries rather than duplicating pure engine tests. Run browser regression checks on affected learning flows before cutover.

## Data transfer, reproducibility, and deployment

1. Take a complete D1 backup and a family export. The current export is useful but is not a full database backup: preserve catalogs, custom content, ordering, and all existing records separately. Keep PIN/recovery secrets out of user exports and require new parent-gate setup after account migration.
2. Map the authenticated legacy Site owner explicitly to a verified Supabase parent. Never infer ownership from child names or assign data to the first signup. Use an idempotent import mapping from each legacy entity ID to UUID, scoped to its source/family.
3. Import catalogs and frozen content references before dependent state. Preserve existing aggregate mastery/history as imported snapshots where raw attempts were never stored; do not fabricate evidence. Check counts, stars, sessions, artwork, family collections and referential integrity.
4. Keep timestamped SQL in `supabase/migrations/`, seed content in reviewed versioned files, and local configuration in `supabase/config.toml`. Leave historical D1 migrations intact. Record Auth/SMTP/redirect configuration in the deployment runbook; no undocumented dashboard schema changes.
5. Generate `lib/supabase/database.types.ts` from a freshly migrated local database with Supabase CLI and verify generated output in CI. Validate JSONB using existing Zod/domain schemas; generated `Json` types alone do not validate engine payloads.
6. Migrate behind explicit server-side feature boundaries. Use one authoritative store per feature and family; no silent fallback or uncontrolled dual writes. Related transactional features must move together. Cross-store compatibility periods are restricted staging/legacy-owner paths, not a general multi-tenant release.
7. Before switching writers, briefly pause affected mutations, import the final delta and reconcile records. Record the cutover point and rollback snapshot. After Supabase accepts new writes, rollback requires reconciling those writes; reverting an environment flag alone would lose data.
8. CI runs typecheck, learning tests, migrations from zero, RLS/transaction tests and native `next build`. Vercel cutover requires all active routes to be free of D1/Cloudflare imports and Sites header trust. Switch production scripts to native Next only at that gate; keep existing tooling until its replacement passes.
9. Use separate Supabase staging/production projects and Vercel preview/production variables; previews must not mutate production. Apply reviewed forward migrations before compatible app releases. Browser bundles contain only the publishable key; privileged CLI credentials stay in protected deployment secrets.

The resulting workflow is VS Code → GitHub/CI → Vercel → Supabase. Runtime migration is a gated part of backend adoption, not a UI rewrite. Project URL/key, a chosen Supabase environment, and authorized legacy-owner mapping will be needed for live verification/import; they are not prerequisites for this audit.

## Official implementation references

- [Supabase SSR clients and Next.js cookie refresh](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [Supabase Next.js setup and publishable key](https://supabase.com/docs/guides/getting-started/quickstarts/nextjs)
- [Supabase SSR token verification and revocation considerations](https://supabase.com/docs/guides/auth/server-side/advanced-guide)
- [Next.js 16 Proxy convention](https://nextjs.org/docs/app/api-reference/file-conventions/proxy)
- [Next.js asynchronous cookies API](https://nextjs.org/docs/app/api-reference/functions/cookies)

These references were checked during the audit. Recheck package versions and runtime behavior when implementing Phase 1; declaring Next.js in package.json does not establish Vinext support for its full auth lifecycle.
