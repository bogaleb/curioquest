/**
 * The places on the child's map, drawn.
 *
 * Every destination needs a silhouette a pre-reader can tell apart at a glance and
 * remember the position of. A Lucide glyph cannot do that — twelve of them at 24px are the
 * same grey stroke in the same square — so these are flat shapes with different outlines:
 * round, pointed, stacked, tall, wide.
 *
 * This is provisional geometry, not the art direction. WP-11 commissions one illustrated
 * style and replaces every shape in this file. Until then these are deliberately simple and
 * clearly hand-made, which is honest about where the product is; what they are *not* is an
 * emoji or an icon-library placeholder that can quietly ship forever (§G).
 *
 * Colour comes from the world hue the marker sets, so a place keeps the same colour on the
 * map, inside its episode and on its reward (§C5). Nothing here carries meaning on its own:
 * every marker has a spoken name and a written label beside it.
 */
type ArtProps = { className?: string };

const base = {
  viewBox: "0 0 64 64",
  "aria-hidden": true as const,
  focusable: "false" as const,
};

/** The trail: stepping stones climbing away into the distance. */
function TrailArt({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <path d="M18 58C18 44 46 44 46 30S26 20 26 10" className="kid-place-trail" />
      <ellipse cx="17" cy="57" rx="13" ry="7" className="kid-place-fill" />
      <ellipse cx="40" cy="45" rx="11" ry="6" className="kid-place-fill" />
      <ellipse cx="44" cy="30" rx="9" ry="5" className="kid-place-fill" />
      <ellipse cx="31" cy="19" rx="7" ry="4" className="kid-place-fill" />
      <ellipse cx="26" cy="9" rx="5" ry="3" className="kid-place-fill" />
    </svg>
  );
}

/** The reading grove: three trees, the middle one taller. */
function GroveArt({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <rect x="30" y="34" width="5" height="26" rx="2" className="kid-place-shade" />
      <rect x="12" y="42" width="4" height="18" rx="2" className="kid-place-shade" />
      <rect x="48" y="42" width="4" height="18" rx="2" className="kid-place-shade" />
      <path d="M32 4 48 34H16z" className="kid-place-fill" />
      <path d="M14 20 26 44H2z" className="kid-place-fill" />
      <path d="M50 20 62 44H38z" className="kid-place-fill" />
    </svg>
  );
}

/** The playing field: a hill with a flag and a ball. */
function FieldArt({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <path d="M2 60c8-18 20-26 30-26s22 8 30 26z" className="kid-place-fill" />
      <rect x="30" y="8" width="3" height="30" rx="1.5" className="kid-place-shade" />
      <path d="M33 10h18l-6 7 6 7H33z" className="kid-place-accent" />
      <circle cx="16" cy="50" r="6" className="kid-place-accent" />
    </svg>
  );
}

/** The making place: a pot with a brush standing in it. */
function MakingArt({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <path d="M14 34h36l-5 26H19z" className="kid-place-fill" />
      <rect x="10" y="26" width="44" height="9" rx="4" className="kid-place-shade" />
      <rect x="40" y="2" width="6" height="26" rx="3" className="kid-place-accent" transform="rotate(14 43 15)" />
      <circle cx="26" cy="48" r="5" className="kid-place-accent" />
    </svg>
  );
}

/** My treehouse: a hut in the branches with a ladder. */
function TreehouseArt({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <rect x="29" y="30" width="6" height="30" rx="3" className="kid-place-shade" />
      <path d="M32 4 56 26H8z" className="kid-place-fill" />
      <rect x="16" y="26" width="32" height="20" rx="4" className="kid-place-fill" />
      <rect x="27" y="32" width="10" height="14" rx="2" className="kid-place-accent" />
      <path d="M18 46v14M26 46v14M18 50h8M18 56h8" className="kid-place-path" />
    </svg>
  );
}

/** The wondering lab: a round flask with bubbles. */
function LabArt({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <path d="M26 6h12v16l12 22a8 8 0 0 1-7 12H21a8 8 0 0 1-7-12l12-22z" className="kid-place-fill" />
      <circle cx="28" cy="44" r="5" className="kid-place-accent" />
      <circle cx="40" cy="38" r="3" className="kid-place-accent" />
      <path d="M24 6h16" className="kid-place-path" />
    </svg>
  );
}

/** Story harbour: a boat with a full sail. */
function HarbourArt({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 44h52l-8 14H14z" className="kid-place-fill" />
      <rect x="30" y="6" width="4" height="38" rx="2" className="kid-place-shade" />
      <path d="M34 10c12 4 18 12 18 22H34z" className="kid-place-accent" />
      <path d="M2 60h60" className="kid-place-path" />
    </svg>
  );
}

/** The little theatre: a curtained stage. */
function TheatreArt({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <rect x="6" y="14" width="52" height="42" rx="5" className="kid-place-fill" />
      <path d="M10 16c8 8 8 26 4 38h-8V16z" className="kid-place-accent" />
      <path d="M54 16c-8 8-8 26-4 38h8V16z" className="kid-place-accent" />
      <path d="M4 12h56" className="kid-place-path" />
    </svg>
  );
}

/** The far hills: three ridges and a sun. */
function HillsArt({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="48" cy="18" r="8" className="kid-place-accent" />
      <path d="M2 56c10-16 18-22 24-22s16 8 22 22z" className="kid-place-fill" />
      <path d="M26 56c8-12 14-16 18-16s12 6 18 16z" className="kid-place-shade" />
    </svg>
  );
}

/** The building yard: stacked blocks, one balanced on top. */
function BuildArt({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <rect x="8" y="38" width="22" height="20" rx="3" className="kid-place-fill" />
      <rect x="34" y="38" width="22" height="20" rx="3" className="kid-place-fill" />
      <rect x="20" y="16" width="24" height="20" rx="3" className="kid-place-accent" />
      <path d="M4 60h56" className="kid-place-path" />
    </svg>
  );
}

/** The meeting camp: a tent with two small figures beside it. */
function CampArt({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <path d="M22 12 44 54H0z" className="kid-place-fill" transform="translate(6 0)" />
      <path d="M28 12v42" className="kid-place-path" />
      <circle cx="54" cy="34" r="6" className="kid-place-accent" />
      <path d="M48 54c0-6 3-10 6-10s6 4 6 10z" className="kid-place-accent" />
    </svg>
  );
}

/** The keeping chest: a lidded box with a clasp. */
function ChestArt({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <rect x="8" y="30" width="48" height="26" rx="4" className="kid-place-fill" />
      <path d="M8 30a24 24 0 0 1 48 0z" className="kid-place-accent" />
      <rect x="28" y="28" width="8" height="14" rx="3" className="kid-place-shade" />
    </svg>
  );
}

/** The quiet garden: an arch over a path. Used only when a family opts in. */
function QuietArt({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <path d="M14 58V32a18 18 0 0 1 36 0v26h-8V32a10 10 0 0 0-20 0v26z" className="kid-place-fill" />
      <path d="M26 58c0-10 3-14 6-14s6 4 6 14z" className="kid-place-accent" />
      <path d="M4 60h56" className="kid-place-path" />
    </svg>
  );
}

const art: Record<string, (props: ArtProps) => React.ReactElement> = {
  adventure: TrailArt,
  reading: GroveArt,
  games: FieldArt,
  studio: MakingArt,
  myworld: TreehouseArt,
  science: LabArt,
  stories: HarbourArt,
  theater: TheatreArt,
  worlds: HillsArt,
  garden: BuildArt,
  team: CampArt,
  rewards: ChestArt,
  faith: QuietArt,
};

/**
 * The drawing for a destination. Falls back to the trail rather than to nothing, so a
 * destination added without art is still reachable — and visibly wrong to whoever added it.
 */
export function PlaceArt({ id, className = "kid-place-art" }: { id: string; className?: string }) {
  const Art = art[id] ?? TrailArt;
  return <Art className={className} />;
}

export function hasPlaceArt(id: string) {
  return id in art;
}
