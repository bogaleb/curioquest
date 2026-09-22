/**
 * The five stations along the path through the Reading Grove (WP-11 §3.3).
 *
 * They were 👂 🏡 🚂 🧩 📖 — five emoji, at whatever size the platform font felt like,
 * in five different drawing styles by five different artists, none of them this product's.
 * §A bans emoji as artwork on a child surface and §G names it specifically as the
 * placeholder that quietly ships forever. It had.
 *
 * Drawn to the same rules as `backdrops.tsx` and `PlaceArt.tsx`, so a child walking from
 * the map into the grove stays in one world: two tones with the light from the upper left,
 * a contact shadow on anything standing on the ground, materials from `--scene-*` and the
 * world's hue spent only on the part that identifies the station.
 *
 * The viewBox is 120×120 with the ground at y=108, the same floor as the map's landmarks,
 * so the five of them line up along a path without being nudged individually.
 *
 * Each one is a *place to go*, not an icon for an activity — a hollow you can sit in, a
 * village you can walk into, a bridge you cross. That is the difference the whole package
 * is about, and it matters most here, because reading is the spine (§D2) and this is the
 * screen a child on the reading trail sees every single day.
 */
type ArtProps = { className?: string };

const base = {
  viewBox: "0 0 120 120",
  "aria-hidden": true as const,
  focusable: "false" as const,
};

function Ground({ rx = 38 }: { rx?: number }) {
  return <ellipse className="kid-place-ground" cx="60" cy="110" rx={rx} ry="7" />;
}

/**
 * Listen — a hollow log with sound rings coming out of it.
 *
 * Not an ear. An ear is a body part, and a child is being invited to go and listen to
 * something, which is a place rather than an organ.
 */
export function ListenStation({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <Ground rx={42} />
      <path className="kid-place-bark" d="M18 106a26 26 0 0 1 0-52h58a26 26 0 0 1 0 52z" />
      <path className="kid-place-bark-deep" d="M62 54h14a26 26 0 0 1 0 52H62a26 26 0 0 0 0-52z" />
      {/* The hollow: dark, round, and the thing you would put your head into. */}
      <ellipse className="kid-place-hollow" cx="26" cy="80" rx="15" ry="20" />
      <ellipse className="kid-place-ground" cx="26" cy="80" rx="8" ry="11" />
      {/* Sound, coming out. Three rings, widening. */}
      <path className="kid-place-ring" d="M52 66a20 20 0 0 1 0 28M66 58a34 34 0 0 1 0 44M80 50a48 48 0 0 1 0 60" />
      <path className="kid-place-leaf" d="M96 54c-2-12 2-21 8-27-3 12-1 21 3 27z" />
    </svg>
  );
}

/** Letter Village — three little houses, the middle one with a letter over the door. */
export function VillageStation({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <Ground rx={44} />
      {/* Side houses, smaller and set back. */}
      <rect className="kid-place-timber" x="6" y="72" width="30" height="34" rx="3" />
      <path className="kid-place-roof" d="M21 52 42 74H0z" />
      <rect className="kid-place-timber" x="84" y="72" width="30" height="34" rx="3" />
      <path className="kid-place-roof" d="M99 52 120 74H78z" />
      {/* The middle house, in front and larger. */}
      <rect className="kid-place-timber" x="36" y="60" width="48" height="46" rx="4" />
      <path className="kid-place-timber-deep" d="M66 60h18v46H66z" />
      <path className="kid-place-fill" d="M60 34 96 62H24z" />
      <path className="kid-place-accent" d="M60 34 96 62H72z" />
      <path className="kid-place-doorway" d="M50 106V86a10 10 0 0 1 20 0v20z" />
      <rect className="kid-place-window" x="42" y="68" width="10" height="10" rx="2" />
      <rect className="kid-place-window" x="70" y="68" width="10" height="10" rx="2" />
    </svg>
  );
}

/** Sound Bridge — a plank bridge over water, with two posts and a rope rail. */
export function BridgeStation({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <Ground rx={46} />
      <path className="kid-place-water" d="M0 92h120v18H0z" />
      <path className="kid-place-water-deep" d="M0 104h120v6H0z" />
      {/* The deck, arched, so it reads as crossing rather than as a shelf. */}
      <path className="kid-place-timber" d="M4 84C4 58 28 44 60 44s56 14 56 40v8C116 68 92 56 60 56S4 68 4 92z" />
      <path className="kid-place-timber-deep" d="M60 44c32 0 56 14 56 40v8C116 68 92 56 60 56z" />
      {/* Posts and a rope. The rope is what makes it safe to walk over. */}
      <path className="kid-place-post" d="M18 88V58M102 88V58" />
      <path className="kid-place-rope" d="M18 60c14-12 28-18 42-18s28 6 42 18" />
      <path className="kid-place-line" d="M32 70v14M48 64v16M72 64v16M88 70v14" />
    </svg>
  );
}

/** Word Workshop — a bench with letter blocks on it and a lamp over the work. */
export function WorkshopStation({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <Ground rx={42} />
      {/* The bench. */}
      <rect className="kid-place-timber" x="10" y="80" width="100" height="10" rx="3" />
      <path className="kid-place-timber-deep" d="M20 90h8v18h-8zM92 90h8v18h-8z" />
      {/* Blocks, three of them, one tipped — a workshop is mid-job, not tidy. */}
      <rect className="kid-place-block" x="26" y="54" width="24" height="26" rx="4" />
      <rect className="kid-place-fill" x="52" y="54" width="24" height="26" rx="4" />
      <rect className="kid-place-block-deep" x="76" y="50" width="24" height="30" rx="4" transform="rotate(-9 88 65)" />
      {/* A lamp on a bent arm, pointing at the work. */}
      <path className="kid-place-post" d="M14 80V34c0-8 8-14 18-14" />
      <path className="kid-place-fill" d="M22 18h24l-8 16H30z" />
      <circle className="kid-place-lamp" cx="34" cy="36" r="5" />
    </svg>
  );
}

/** Story Trail — an open book resting on a tree stump in a clearing. */
export function StoryStation({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <Ground rx={40} />
      {/* The stump: a place to sit and read. Its cut top is pale wood, not stone — a
          grey disc on a brown cylinder reads as a rock balanced on a log. */}
      <path className="kid-place-bark" d="M28 106V80h64v26z" />
      <ellipse className="kid-place-bark-deep" cx="60" cy="80" rx="32" ry="9" />
      <ellipse className="kid-place-timber" cx="60" cy="79" rx="25" ry="6.5" />
      {/*
        The book, open, resting on the stump.

        Drawn as the classic V: two pages curving down to a centre valley, with the
        outer edges lifting. Two flat quadrilaterals meeting at a line read as a
        signpost at this size — and this is the smallest, furthest station on the
        path, so the silhouette has to survive being about 60px wide.
      */}
      <path className="kid-place-canvas" d="M60 72C48 64 34 60 22 58c0-12 0-22 2-30 12 2 26 8 36 16z" />
      <path className="kid-place-canvas" d="M60 72c12-8 26-12 38-14 0-12 0-22-2-30-12 2-26 8-36 16z" />
      {/* The cover, just showing under the pages. */}
      <path className="kid-place-accent" d="M60 78C46 70 32 66 18 64v-6c14 2 28 6 42 14 14-8 28-12 42-14v6c-14 2-28 6-42 14z" />
      <path className="kid-place-line" d="M32 42c8 2 16 6 22 10M32 52c8 2 16 6 22 10M88 42c-8 2-16 6-22 10M88 52c-8 2-16 6-22 10" />
    </svg>
  );
}

/** In the order a child walks them. The path through the grove is this list. */
export const READING_STATIONS = [
  { id: "listen", art: ListenStation },
  { id: "village", art: VillageStation },
  { id: "bridge", art: BridgeStation },
  { id: "workshop", art: WorkshopStation },
  { id: "story", art: StoryStation },
] as const;
