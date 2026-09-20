# Route segments

_Written for whoever implements or reviews this, including a future session picking it
up cold._

## Why

Every screen currently lives in one client component, `curioquest-app.tsx`, switching on
a `view` string. The view is already mirrored into the URL with `pushState`, so links
and the Back button work — but the **code** is still one bundle. A child who only ever
opens the Creative Studio still downloads the Parent Corner, the Treasure Chest, the
Game Zone, and every screen's imports on first load.

### Result

Measured on production builds (`next start`), summing transferred JavaScript on a cold
context per route:

| Route | Before | After |
|---|---|---|
| `/` (My adventure) | **215 KB** | **55 KB** |
| `/create`, `/play`, `/rewards` | 215 KB | 65 KB |
| `/parent` | 215 KB | 100 KB |

A **74% reduction** on the home route. Before the split there was literally one route,
so every screen paid the same cost — a child opening the Creative Studio downloaded the
Parent Corner. Now they do not.

Note that *total* bundle size rose (~1.0 MB to ~1.2 MB across 30 chunks). That is the
expected shape of a route split and is the wrong thing to optimise: what matters is what
one route needs, not what the whole app weighs.

Secondary benefits, in order of real value:

1. **Per-route code splitting** — the point of the exercise.
2. **Server components for static shells** — headings and copy stop shipping as JS.
3. **Real `loading.tsx` boundaries** — replaces the bare `<p>Opening…</p>` fallbacks.
4. **`error.tsx` per segment** — a broken screen stops taking the whole app down.

## Design

A route group holding a client shell, with the auth check on the server:

```
app/(explorer)/
  layout.tsx        server: parent auth check, then <ExplorerShell>
  page.tsx          /            My adventure
  read/             /read        Reading Adventure
  play/             /play        Game Zone
  create/           /create      Creative Studio
  world/            /world       My World
  today/            /today       Today's Adventure
  science/ stories/ theater/ worlds/ build/ team/ rewards/ faith/
  parent/           /parent      Parent Corner
```

Three pieces:

- **`app/(explorer)/layout.tsx`** — a server component. Does the `authenticatedParent()`
  check once for every route, then renders the client shell. Keeps auth off the client
  and out of each page.
- **`components/app/explorer-context.tsx`** — a client provider holding what every route
  shares: the profile list, the selected explorer, the in-flight quest, busy/error
  state, and the parent unlock. Without this, moving between routes would remount the
  state and tear down a running quest.
- **`components/app/ExplorerShell.tsx`** — the persistent frame: `AppShell`, the quest
  player overlay, the parent gate, and the add-explorer dialog. Navigation becomes
  `router.push(destinationHref(id))`.

`lib/navigation.ts` already carries `href` per destination plus `destinationHref()` and
`destinationForPath()`, so the active nav item comes from `usePathname()` rather than
from state.

## What it ran into

Recorded so they are not rediscovered:

1. **The god component owns everything.** `curioquest-app.tsx` holds ~20 pieces of state
   and passes them down. They cannot be split per route; they have to be lifted into the
   provider *first*, as one reviewable change, before any route exists.
2. **Overlays are cross-cutting.** The quest player, parent gate, and add-explorer
   dialog are opened from several screens and must outlive navigation, so they belong to
   the shell, not to any page.
3. **`onStars` threading.** Several screens push a new star count upward through
   `setProfiles`. In the provider this becomes a context method; leaving it as a prop
   drilled through routes recreates the coupling the split is meant to remove.
4. **Deleting `app/page.tsx` breaks the build until `(explorer)/page.tsx` exists**, and
   Next's generated `.next/types/validator.ts` keeps a stale reference until `.next` is
   cleared. Expect one confusing failure there; `rm -rf .next` resolves it.
5. **Team Quest switches the active explorer** as part of its flow, so `selectProfile`
   has to be a context action rather than local state.

## Two faults the split surfaced

- `ChildWorldHome` and `ParentQuests` are siblings and both carried
  `key={profile.id}`, which React rejects as a duplicate key. The original code
  distinguished them with the assignment version; that was lost in the move and is
  restored.
- The parent unlock lived only in client state, so refreshing the page silently locked
  the Corner again even though the server's PIN session was still valid. It now reads
  the expiring gate cookie on mount, which is where that session actually lives.

## Still to do

- ~~**`loading.tsx` and `error.tsx` per segment**~~ — delivered 2026-09-20. Fifteen
  segments have a `loading.tsx` rendering one of four skeleton shapes
  (`components/shell/RouteSkeleton.tsx`), and `(explorer)/error.tsx` keeps a thrown
  screen from taking the shell with it. See the note below on when a skeleton is
  actually visible.
- **Server components for the static parts** of each screen. Every page is currently
  `"use client"` because it reads the shared context; headings and copy could be split
  out and rendered on the server.

### When the skeletons are visible

Worth knowing before someone reports them as broken. `(explorer)/layout.tsx` awaits
`authenticatedParent()`, which reads cookies, so on a **cold page load** Next blocks on
the layout and the fallback never paints. The skeletons are for **client-side navigation
between segments**, which is where the route split put the cost: moving to `/parent`
fetches that segment's RSC payload and its 100 KB chunk, and that is the wait they cover.
On a fast connection they will flash briefly or not at all, which is correct.

## Risks

- **Regression surface is the whole app.** Mitigated by moving one screen at a time and
  by `scripts/ui-shots.mjs`, which captures seven viewports and reports console errors;
  run it after each step, not only at the end.
- **A quest must survive navigation.** Covered by the provider. Worth an explicit check:
  start a quest, navigate away, navigate back, confirm the session is intact.
- **Parent Corner must not become link-shareable.** `/parent` renders nothing until the
  gate has been passed in this session; the route existing is not the same as the route
  being open.

## Not in scope

Moving content out of TypeScript modules into the Supabase curriculum tables. That is a
separate change and no longer urgent: `activityCatalogue()` now merges authored content
with the published catalogue, so code-defined activities are served whether or not the
database has caught up.
