/**
 * Route-level loading skeletons.
 *
 * Each explorer segment has a `loading.tsx` that renders one of these shapes while its
 * page streams in. The shape is chosen to match what that screen actually draws, so the
 * skeleton reads as "this is arriving" rather than as a generic spinner that could mean
 * anything — the difference between a slow route feeling slow and feeling broken.
 *
 * A server component: it ships no JavaScript, which matters because it is the first
 * thing sent on a cold navigation.
 *
 * Accessibility: the blocks are decoration and are hidden from assistive technology.
 * One polite live region carries the actual message, so a screen reader announces the
 * wait once instead of reading a wall of empty boxes.
 */

type Shape = "hero" | "grid" | "panels" | "canvas";

const shapes: Record<Shape, () => React.ReactElement> = {
  /* Home, Today's Adventure, My World, Theater: a wide opening card, then cards. */
  hero: () => (
    <>
      <div className="cq-skeleton cq-skeleton-hero" />
      <div className="cq-skeleton-row">
        <div className="cq-skeleton cq-skeleton-card" />
        <div className="cq-skeleton cq-skeleton-card" />
        <div className="cq-skeleton cq-skeleton-card" />
      </div>
    </>
  ),

  /* Game Zone, learning worlds, Treasure Chest, stories, Discovery Lab: a heading
     above a card grid. Six cards is the median across those screens. */
  grid: () => (
    <>
      <div className="cq-skeleton-heading">
        <div className="cq-skeleton cq-skeleton-text" style={{ width: "34%" }} />
        <div className="cq-skeleton cq-skeleton-text" style={{ width: "56%" }} />
      </div>
      <div className="cq-skeleton-grid">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index} className="cq-skeleton cq-skeleton-card" />
        ))}
      </div>
    </>
  ),

  /* Parent Corner, Reading Adventure, Team Quest: stacked full-width panels. */
  panels: () => (
    <>
      <div className="cq-skeleton-heading">
        <div className="cq-skeleton cq-skeleton-text" style={{ width: "28%" }} />
        <div className="cq-skeleton cq-skeleton-text" style={{ width: "48%" }} />
      </div>
      {[0, 1, 2].map((index) => (
        <div key={index} className="cq-skeleton cq-skeleton-panel" />
      ))}
    </>
  ),

  /* Creative Studio and Build Lab: a tool rail beside a working surface. */
  canvas: () => (
    <div className="cq-skeleton-canvas">
      <div className="cq-skeleton cq-skeleton-rail" />
      <div className="cq-skeleton cq-skeleton-surface" />
    </div>
  ),
};

export function RouteSkeleton({ shape, label }: { shape: Shape; label: string }) {
  const Blocks = shapes[shape];
  return (
    <div className="cq-route-skeleton">
      <p role="status" aria-live="polite" className="cq-sr-only">{label}</p>
      <div aria-hidden="true" className={`cq-skeleton-shape cq-skeleton-${shape}-shape`}>
        <Blocks />
      </div>
    </div>
  );
}
