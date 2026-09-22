/**
 * The things a child earns and keeps (WP-11 §3.4, blueprint §D9 / WP-09).
 *
 * These are the most important drawings in the product, and they were eight Lucide icons —
 * a 1.6px grey stroke in a 24px box, the same weight as the icons in a settings menu. The
 * blueprint's whole reward argument is that progress should be *objects placed in the
 * treehouse* rather than a rising number, and an object a child cannot tell from a toolbar
 * glyph does not carry that.
 *
 * Drawn to the same rules as the rest of the art layer: two tones with the light from the
 * upper left, a contact shadow so the thing sits on a shelf rather than floating above it,
 * materials from `--scene-*`, and the sun ramp for the parts that should read as treasure.
 *
 * Each one is a *thing you could pick up*. That is the test: if it reads as a symbol for a
 * category rather than as an object with a back and a weight, it is not finished.
 */
type ArtProps = { className?: string };

const base = {
  viewBox: "0 0 100 100",
  "aria-hidden": true as const,
  focusable: "false" as const,
};

function Rest({ rx = 30 }: { rx?: number }) {
  return <ellipse className="kid-object-rest" cx="50" cy="92" rx={rx} ry="6" />;
}

/** A rolled map, tied with a ribbon. The first thing a child earns. */
function MapObject({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <Rest rx={32} />
      <path className="kid-object-paper" d="M22 20h56v68H22z" />
      <path className="kid-object-paper-deep" d="M62 20h16v68H62z" />
      <ellipse className="kid-object-paper" cx="22" cy="54" rx="9" ry="34" />
      <ellipse className="kid-object-paper" cx="78" cy="54" rx="9" ry="34" />
      <path className="kid-object-ink" d="M34 44c8-6 14 4 22-2M34 62c9-5 16 3 24-3" />
      <path className="kid-object-gold" d="M40 34h20v10H40z" />
      <circle className="kid-object-ink" cx="50" cy="39" r="3" />
    </svg>
  );
}

/** A book, closed, with a ribbon marker. */
function BookObject({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <Rest rx={30} />
      <path className="kid-object-cover" d="M22 14h52a4 4 0 0 1 4 4v66a4 4 0 0 1-4 4H22z" />
      <path className="kid-object-cover-deep" d="M60 14h14a4 4 0 0 1 4 4v66a4 4 0 0 1-4 4H60z" />
      <path className="kid-object-paper" d="M22 20h48v58H22z" transform="translate(-4 4)" />
      <path className="kid-object-paper-deep" d="M18 78h48v4H18z" />
      <path className="kid-object-gold" d="M62 14h10v34l-5-7-5 7z" />
    </svg>
  );
}

/** A seedling in a pot. */
function PlantObject({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <Rest rx={26} />
      <path className="kid-object-leaf" d="M50 62c-2-18 4-30 14-36-6 14-6 26-2 36z" />
      <path className="kid-object-leaf-deep" d="M50 62c-10-10-14-22-12-32 8 8 14 18 16 32z" />
      <path className="kid-object-stem" d="M50 88V56" />
      <path className="kid-object-clay" d="M28 62h44l-6 28H34z" />
      <path className="kid-object-clay-deep" d="M52 62h20l-6 28H52z" />
      <path className="kid-object-clay-deep" d="M26 58h48v8H26z" />
    </svg>
  );
}

/** A globe on a stand. */
function GlobeObject({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <Rest rx={28} />
      <path className="kid-object-wood" d="M34 88h32l-6-10H40zM48 78V64h4v14z" />
      <circle className="kid-object-water" cx="50" cy="44" r="30" />
      <path className="kid-object-water-deep" d="M62 18a30 30 0 0 1 0 52 30 30 0 0 0 0-52z" />
      <path className="kid-object-leaf" d="M30 36c8-4 14 2 20-2 6-4 12 0 18 4-6 2-10 8-18 8s-14-6-20-10zM36 58c6-3 12 2 18-2 4-3 8-1 12 1-4 4-9 8-16 8s-11-4-14-7z" />
      <path className="kid-object-ink" d="M20 44h60M50 14c10 12 10 48 0 60" />
    </svg>
  );
}

/** A little arched bridge. */
function BridgeObject({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <Rest rx={34} />
      <path className="kid-object-stone" d="M8 88V66c0-22 18-38 42-38s42 16 42 38v22H74V66c0-14-10-24-24-24s-24 10-24 24v22z" />
      <path className="kid-object-stone-deep" d="M62 30c18 6 30 20 30 36v22H74V66c0-14-5-27-12-36z" />
      <path className="kid-object-ink" d="M8 62h18M74 62h18M26 52c14-8 34-8 48 0" />
    </svg>
  );
}

/** A small round creature with big eyes. A friend, not a pet. */
function CreatureObject({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <Rest rx={26} />
      <path className="kid-object-fur" d="M50 16c20 0 34 14 34 34 0 22-14 38-34 38S16 72 16 50c0-20 14-34 34-34z" />
      <path className="kid-object-fur-deep" d="M68 24c10 7 16 16 16 26 0 22-14 38-34 38 20-2 30-17 30-38 0-10-4-19-12-26z" />
      <path className="kid-object-fur" d="M26 22c-4-8-2-14 2-15 5-1 10 5 12 12zM74 22c4-8 2-14-2-15-5-1-10 5-12 12z" />
      <ellipse className="kid-object-belly" cx="50" cy="62" rx="20" ry="18" />
      <ellipse className="kid-object-eye" cx="40" cy="46" rx="6" ry="7" />
      <ellipse className="kid-object-eye" cx="60" cy="46" rx="6" ry="7" />
      <circle className="kid-object-shine" cx="42" cy="43" r="2.2" />
      <circle className="kid-object-shine" cx="62" cy="43" r="2.2" />
      <path className="kid-object-ink" d="M46 58c2 3 6 3 8 0" />
    </svg>
  );
}

/** A crescent moon with a star beside it. */
function MoonObject({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <Rest rx={24} />
      <path className="kid-object-gold" d="M62 12a38 38 0 1 0 0 72 30 30 0 0 1 0-72z" />
      <path className="kid-object-gold-deep" d="M34 20a30 30 0 0 0 0 56 38 38 0 0 1-12-28c0-11 5-21 12-28z" />
      <path className="kid-object-gold" d="M76 20l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" />
    </svg>
  );
}

/** A small robot. Pip's cousin, not Pip. */
function RobotObject({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <Rest rx={26} />
      <path className="kid-object-metal" d="M50 10v10" />
      <circle className="kid-object-glow" cx="50" cy="8" r="6" />
      <rect className="kid-object-metal" x="22" y="20" width="56" height="42" rx="14" />
      <path className="kid-object-metal-deep" d="M64 20h0a14 14 0 0 1 14 14v14a14 14 0 0 1-14 14h-6c8-4 12-11 12-21s-4-17-12-21z" />
      <rect className="kid-object-screen" x="32" y="30" width="36" height="22" rx="8" />
      <circle className="kid-object-glow" cx="42" cy="41" r="4.5" />
      <circle className="kid-object-glow" cx="58" cy="41" r="4.5" />
      <rect className="kid-object-metal" x="30" y="64" width="40" height="24" rx="8" />
      <path className="kid-object-metal-deep" d="M58 64h12a8 8 0 0 1 8 8v8a8 8 0 0 1-8 8H58c6-4 10-10 10-16s-4-12-10-16z" />
      <circle className="kid-object-glow" cx="50" cy="76" r="5" />
    </svg>
  );
}

const objects: Record<string, (props: ArtProps) => React.ReactElement> = {
  map: MapObject,
  book: BookObject,
  plant: PlantObject,
  globe: GlobeObject,
  bridge: BridgeObject,
  creature: CreatureObject,
  moon: MoonObject,
  robot: RobotObject,
};

/**
 * The drawing for a reward object.
 *
 * Falls back to the map rather than to nothing, so an object added without art is still
 * visible — and visibly wrong to whoever added it.
 */
export function RewardObject({ art, className = "kid-object-art" }: { art: string; className?: string }) {
  const Art = objects[art] ?? MapObject;
  return <Art className={className} />;
}

/** Every object kind that has a drawing. Used by the tests and by the treehouse. */
export const REWARD_OBJECTS = Object.keys(objects);
