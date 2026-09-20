# Route segments

_Written for whoever implements or reviews this, including a future session picking it
up cold._

## Why

Every screen currently lives in one client component, `curioquest-app.tsx`, switching on
a `view` string. The view is already mirrored into the URL with `pushState`, so links
and the Back button work — but the **code** is still one bundle. A child who only ever
opens the Creative Studio still downloads the Parent Corner, the Treasure Chest, the
Game Zone, and every screen's imports on first load.

Measured on `main` before the split: **~1.0 MB of client JS** across the chunk set, with
the four largest chunks at 224 KB, 164 KB, 160 KB and 112 KB. Seven screens are already
`React.lazy`, so the win is not uniform; the concentrated wins are the parent surfaces
(never loaded by a child) and the Game Zone.

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

## What the first attempt ran into

A partial implementation is parked on `wip/route-segments`. It does not compile. The
obstacles, so they are not rediscovered:

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

## Sequence

Each step ends green on typecheck, lint, tests, and a production build, and is its own
commit.

1. **Lift state into the provider.** `curioquest-app.tsx` keeps rendering every screen
   but reads from `useExplorer()`. No routes yet, no behaviour change. This is the step
   that carries all the risk; everything after it is mechanical.
2. **Introduce the shell and the group** with a single `page.tsx` that renders the same
   screen switch. Delete `app/page.tsx`. Verify the whole app still works at `/`.
3. **Move screens out one at a time**, cheapest first: `rewards`, `build`, `team`,
   `stories`, `faith`, `theater`, `science`, `read`, `create`, `world`, `today`, `play`.
   After each, the corresponding branch disappears from the switch.
4. **Move Parent Corner last.** It is the largest surface and the one with a gate.
5. **Add `loading.tsx` and `error.tsx`** per segment, replacing the `<p>Opening…</p>`
   fallbacks with the skeletons already defined in `motion.css`.
6. **Re-measure** the chunk set and record the before/after in this document.

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
