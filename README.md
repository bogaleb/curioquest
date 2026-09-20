# CurioQuest

An early-reading app for children aged 4–7, built with Next.js 16, React 19, TypeScript, Tailwind v4
and Supabase (PostgreSQL), deployed on Vercel.

> **A child opens CurioQuest, and the app already knows where they are in a story — it takes them
> there, and something happens.**

That sentence is the product law. Every change is measured against it, and a change that adds a
navigation decision for a five-year-old before learning starts is a regression, however good it looks.

## What ships today

- An adaptive learning engine: a prerequisite skill graph, a mastery record that separates supported
  from independent success, spaced review, and a recommender that can explain each choice.
- A phonics slice — placement, Letter Catch, Blend Train, Sound Boxes, decodable text — which is the
  strongest work in the repository and the spine the rest hangs from.
- Manipulative engines for maths (ten-frame, number bond, number line, place value, array builder)
  and an investigation loop for science (predict → test → explain).
- A parent area behind a PIN gate: progress evidence, controls, a learning-record export, and
  off-screen activity suggestions.
- An append-only `learning_events` stream, from which mastery is projected.

It is **owner-private**. There is no tenancy, public registration, subscription, or verifiable
parental consent yet, so it is not a commercial product and must not be described as one.
`docs/product/RELEASE_STATUS.md` records exactly what is and is not true.

## Documentation map

| Read this | For |
| --- | --- |
| `docs/product/REBUILD-BLUEPRINT.md` | **The active implementation contract.** Read before planning any work. |
| `docs/product/CurioQuest A Rethink.md` | The diagnosis and strategy the blueprint converts into work packages. |
| `docs/product/RELEASE_STATUS.md` | What actually ships, and what is still not true. |
| `docs/architecture/SUPABASE_SETUP.md` | Migrations, keys, RLS, and the deployment runbook. |
| `README_LOCAL.md` | Local setup in five steps. |
| `PRODUCT_BLUEPRINT.md`, `docs/product/WAVE-*.md` | Long-form history. A scope inventory, not a sequence — the blueprint supersedes them. |

## Local development

```sh
pnpm install --frozen-lockfile
cp .env.example .env.local     # then fill in the three Supabase values
pnpm dev                       # http://localhost:5173
```

Full steps, including applying migrations and creating the first parent account, are in
`README_LOCAL.md`.

## Architecture

```
app/(explorer)/     Child routes, rendered inside KidShell — no sidebar, no breadcrumb
app/(grownup)/      Parent routes, behind the PIN gate, where shadcn/Radix belongs
app/api/            Route handlers; every answer is checked here, never in the browser
components/kid/     The child component layer (tokens only, no shadcn)
components/learning/  Activity engines — the good part; extend rather than replace
components/reading/   The phonics slice
components/ui/      shadcn primitives, for parent surfaces only
lib/                Skill graph, mastery, bands, recommender, catalogue loaders
supabase/migrations/  The real schema. Version-controlled, idempotent, RLS-checked
```

Two rules about data flow are absolute:

1. **Answers, scoring and reward grants are decided on the server.** The answer key never reaches the
   browser. `pnpm check:bundle` fails the build if it does.
2. **Every learning interaction writes a `learning_event`.** An interaction that records nothing did
   not happen. Mastery is a projection over that table; the JSON blob is only a cache.

## Verification

```sh
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm test:integration     # migrations + RLS in a disposable PostgreSQL cluster
pnpm check:bundle         # no answer key in client chunks
pnpm check:tokens         # no raw hex, px font sizes, or new !important
pnpm check:child-surfaces # no emoji or Lucide icons on child screens
pnpm check:images         # no raster over 500 KB
pnpm ui:shots             # screenshots into outputs/
```

`pnpm test:integration` needs PostgreSQL 17 binaries on `PG_BIN`; the runbook explains why and how.

Before calling any work done, check it by hand at iPad landscape (1180×820), iPad portrait, phone
portrait (390×844) and desktop 1440, with narration off, reduced motion on, keyboard only, and as a
second family for RLS.

## Design constraints

- **iPad landscape is the primary target**, phone portrait second. Desktop is a supported afterthought.
- **Tokens only.** Colour, type, spacing, radius and motion are defined in `app/tokens.css` and
  nowhere else. No raw hex, no px font sizes, no new `!important`.
- **No emoji or Lucide icons on child surfaces.** Where art is missing, use a visible grey placeholder
  so the gap stays obvious.
- **Touch targets** are 64px for ages 4–5 and 56px for 6–7; contrast meets WCAG AA against the actually
  painted background.
- **No engagement-pressure mechanics:** no loss-bearing streaks, no daily-login rewards, no
  variable-ratio surprise drops.
- **No third-party analytics, advertising or experimentation SDK inside a child session.**

## Privacy

CurioQuest stores a child's nickname, avatar and learning band. It does not collect a birth date,
surname, photograph, email address or location. Voice input, where enabled, runs on-device and stores
a pass/fail judgement — never a recording, which the amended COPPA Rule treats as biometric data.
See `docs/legal/PRIVACY.md` and `docs/legal/RETENTION.md`.
