/**
 * The places on the child's map, drawn.
 *
 * This file used to say, in this spot, that it held "provisional geometry, not the art
 * direction", and that WP-11 would replace every shape in it. This is WP-11, and it has.
 *
 * What was here before was thirteen flat 64×64 glyphs, each sitting inside an identical
 * white circle: a triangle for the grove, a rectangle for the chest, an arch for the
 * garden. They were honest placeholders and they did their job — a child could tell them
 * apart and learn where they were — but they were a *legend* for a map rather than a map.
 * Eleven identical rings at eleven positions is a diagram of a world.
 *
 * ## What changed
 *
 * Each place is now a small piece of scenery with a footprint. Four rules, shared with
 * `art/backdrops.tsx` so the landmarks and the landscape read as one drawing:
 *
 *   1. **Two tones**, light from the upper left.
 *   2. **A contact shadow.** Nothing floats. This is what puts a landmark *on* the ground
 *      rather than in front of it, and it is most of the difference between the old map
 *      and this one.
 *   3. **Built out of materials, not hues.** Bark is `--scene-bark`, stone is
 *      `--scene-stone`. The world's colour is reserved for the one or two parts that
 *      identify the place — a sail, a roof, a flag — so the grove and the harbour are made
 *      of the same wood and the same stone and still read as different places.
 *   4. **Distinct silhouettes.** Round, pointed, stacked, tall, wide. A child should be
 *      able to tell two places apart from the shape alone, which is what
 *      `tests/child-map.test.mjs` pins by requiring that no two share a drawing.
 *
 * The viewBox is 120×120 rather than 64×64, with the ground line at y=108, so every
 * landmark stands on the same floor and they can be laid out along a horizon.
 *
 * Nothing here carries meaning on its own: every landmark has a spoken name and a written
 * label beside it, and neither the picture nor the word is the only way in (§C6).
 */
type ArtProps = { className?: string };

const base = {
  viewBox: "0 0 120 120",
  "aria-hidden": true as const,
  focusable: "false" as const,
};

/** The shadow every landmark stands in. Same shape, same place, for all thirteen. */
function Ground({ rx = 40 }: { rx?: number }) {
  return <ellipse className="kid-place-ground" cx="60" cy="110" rx={rx} ry="8" />;
}

/** The trail: stepping stones climbing away between two tufts. */
function TrailArt({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <Ground rx={44} />
      <ellipse className="kid-place-stone" cx="58" cy="100" rx="30" ry="11" />
      <ellipse className="kid-place-stone" cx="44" cy="80" rx="24" ry="9" />
      <ellipse className="kid-place-stone" cx="70" cy="62" rx="19" ry="7" />
      <ellipse className="kid-place-stone" cx="52" cy="47" rx="15" ry="6" />
      <ellipse className="kid-place-stone" cx="66" cy="35" rx="11" ry="4" />
    </svg>
  );
}

/** The reading grove: three trees around a clearing, the middle one with a hollow. */
function GroveArt({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <Ground rx={42} />
      {/* Back trees, paler, so the grove has a depth of its own. */}
      <path className="kid-place-leaf-far" d="M26 74c-12 0-20-9-20-20 0-11 9-20 20-20s20 9 20 20c0 11-8 20-20 20z" />
      <path className="kid-place-leaf-far" d="M96 78c-11 0-19-8-19-18 0-11 8-19 19-19s19 8 19 19c0 10-8 18-19 18z" />
      <path className="kid-place-bark" d="M22 108V68h8v40zM92 108V74h8v34z" />
      {/* The big tree in front, with a dark hollow a child can read as a doorway. */}
      <path className="kid-place-bark" d="M52 108V60h16v48z" />
      <path className="kid-place-bark-deep" d="M62 108V60h6v48z" />
      <path
        className="kid-place-leaf"
        d="M60 8c20 0 34 14 34 31 0 18-15 31-34 31S26 57 26 39C26 22 40 8 60 8z"
      />
      <path className="kid-place-leaf-deep" d="M84 20c7 6 10 13 10 19 0 18-15 31-34 31 20-2 30-14 30-31 0-7-2-13-6-19z" />
      <path className="kid-place-hollow" d="M60 108V88a8 8 0 0 1 16 0v20z" transform="translate(-8 0)" />
    </svg>
  );
}

/** The playing field: a hill, a flag, and a ball left on the grass. */
function FieldArt({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <Ground rx={44} />
      <path className="kid-place-hill" d="M4 108c10-30 28-46 56-46s46 16 56 46z" />
      <path className="kid-place-hill-deep" d="M60 62c28 0 46 16 56 46H74c4-18 0-34-14-46z" />
      <path className="kid-place-post" d="M58 66V16" />
      <path className="kid-place-fill" d="M62 18h34l-10 12 10 12H62z" />
      <circle className="kid-place-ball" cx="28" cy="94" r="10" />
      <path className="kid-place-line" d="M20 90c6 4 10 8 12 14M36 88c-4 5-7 10-8 16" />
    </svg>
  );
}

/** The making place: an easel with a half-finished picture and two paint pots. */
function MakingArt({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <Ground rx={40} />
      <path className="kid-place-timber" d="M30 108 46 30h6L38 108zM90 108 74 30h-6l14 78z" />
      <path className="kid-place-timber" d="M38 72h44v7H38z" />
      <rect className="kid-place-canvas" x="30" y="14" width="60" height="52" rx="4" />
      <path className="kid-place-fill" d="M38 58c6-16 12-24 18-24s12 8 18 24z" />
      <circle className="kid-place-accent" cx="72" cy="28" r="7" />
      {/* Pots on the ground, so the easel is somewhere rather than nowhere. */}
      <path className="kid-place-pot" d="M12 108 8 88h18l-4 20zM108 108l-4-20H86l4 20z" transform="translate(0 -2)" />
    </svg>
  );
}

/** My treehouse: a hut in the branches, with a ladder and a lit window. */
function TreehouseArt({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <Ground rx={38} />
      <path className="kid-place-leaf" d="M60 4c22 0 36 14 36 30 0 8-4 15-10 19H34c-6-4-10-11-10-19C24 18 38 4 60 4z" />
      <path className="kid-place-leaf-deep" d="M84 12c8 6 12 14 12 22 0 8-4 15-10 19H64c12-4 20-13 20-24 0-6-2-12-6-17z" />
      <path className="kid-place-bark" d="M52 108V44h16v64z" />
      <path className="kid-place-bark-deep" d="M62 108V44h6v64z" />
      {/* The hut, sitting across the trunk on a platform. */}
      <path className="kid-place-timber" d="M22 62h76v6H22z" />
      <rect className="kid-place-timber" x="30" y="68" width="60" height="30" rx="4" />
      <path className="kid-place-roof" d="M60 44 100 68H20z" />
      <rect className="kid-place-window" x="52" y="76" width="16" height="16" rx="3" />
      <path className="kid-place-line" d="M36 98V68M46 98V68M36 78h10M36 88h10" />
    </svg>
  );
}

/** The wonder lab: a domed hut with a flask bubbling in the doorway. */
function LabArt({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <Ground rx={40} />
      <path className="kid-place-stone-wall" d="M16 108V66a44 44 0 0 1 88 0v42z" />
      <path className="kid-place-stone-deep" d="M78 28a44 44 0 0 1 26 38v42H76V66a44 44 0 0 0-14-32z" />
      {/* The dome, in the world's colour: the one part that says which place this is. */}
      <path className="kid-place-fill" d="M16 66a44 44 0 0 1 88 0z" />
      <path className="kid-place-accent" d="M104 66H74a44 44 0 0 0-16-34 44 44 0 0 1 46 34z" />
      <path className="kid-place-doorway" d="M44 108V86a16 16 0 0 1 32 0v22z" />
      <path className="kid-place-flask" d="M52 104V92l-6-10h-4l8-14h20l8 14h-4l-6 10v12z" transform="translate(0 2) scale(1)" />
      <circle className="kid-place-bubble" cx="54" cy="74" r="4" />
      <circle className="kid-place-bubble" cx="66" cy="68" r="3" />
    </svg>
  );
}

/** Story harbour: a jetty, water, and a little boat with a full sail. */
function HarbourArt({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <Ground rx={46} />
      <path className="kid-place-water" d="M2 94h116v14H2z" />
      <path className="kid-place-water-deep" d="M2 104h116v4H2z" />
      {/* The jetty, which is what makes this a harbour rather than a boat. */}
      <path className="kid-place-timber" d="M2 86h44v7H2z" />
      <path className="kid-place-timber-deep" d="M10 93h5v13h-5zM32 93h5v13h-5z" />
      <path className="kid-place-hull" d="M46 94h56l-9 12H55z" />
      <path className="kid-place-post" d="M72 92V26" />
      <path className="kid-place-fill" d="M76 30c18 8 26 22 26 38H76z" />
      <path className="kid-place-accent" d="M68 44c-12 6-18 15-18 24h18z" />
    </svg>
  );
}

/** The little theatre: a curtained booth on two legs. */
function TheatreArt({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <Ground rx={38} />
      <path className="kid-place-timber" d="M26 108V84h7v24zM87 108V84h7v24z" />
      <rect className="kid-place-timber" x="16" y="24" width="88" height="62" rx="6" />
      <rect className="kid-place-stage" x="26" y="38" width="68" height="40" rx="4" />
      {/* Curtains, swagged, in the world's colour. */}
      <path className="kid-place-fill" d="M26 38h18c-5 13-5 27-2 40H26z" />
      <path className="kid-place-fill" d="M94 38H76c5 13 5 27 2 40h16z" />
      <path className="kid-place-accent" d="M16 24h88v12c-15 6-30 9-44 9s-29-3-44-9z" />
      <circle className="kid-place-lamp" cx="60" cy="58" r="8" />
    </svg>
  );
}

/** The far hills: three ridges with a signpost, because they are somewhere to go. */
function HillsArt({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <Ground rx={44} />
      <path className="kid-place-hill-far" d="M0 108c14-34 30-52 46-52s32 18 46 52z" transform="translate(14 -6)" />
      <path className="kid-place-hill" d="M0 108c12-28 26-42 40-42s28 14 40 42z" />
      <path className="kid-place-hill-deep" d="M40 108c14-30 28-46 42-46s30 16 38 46z" />
      <path className="kid-place-post" d="M58 108V50" />
      <path className="kid-place-fill" d="M58 54h34l-8 8 8 8H58z" />
      <path className="kid-place-accent" d="M58 76H26l-8 8 8 8h32z" />
    </svg>
  );
}

/** The build yard: stacked blocks with one balanced on top, and a plank ramp. */
function BuildArt({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <Ground rx={42} />
      <rect className="kid-place-block" x="14" y="76" width="30" height="30" rx="4" />
      <rect className="kid-place-block-deep" x="48" y="76" width="30" height="30" rx="4" />
      <rect className="kid-place-fill" x="82" y="76" width="26" height="30" rx="4" />
      <rect className="kid-place-accent" x="30" y="46" width="30" height="28" rx="4" />
      <rect className="kid-place-block" x="64" y="46" width="24" height="28" rx="4" />
      {/* The one balanced on top: the thing a child in a build yard is actually doing. */}
      <rect className="kid-place-fill" x="44" y="18" width="28" height="26" rx="4" transform="rotate(-8 58 31)" />
    </svg>
  );
}

/** The team camp: a tent, a fire, and two logs to sit on. */
function CampArt({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <Ground rx={44} />
      <path className="kid-place-fill" d="M40 22 76 104H4z" />
      <path className="kid-place-accent" d="M40 22 76 104H46z" />
      <path className="kid-place-doorway" d="M40 104V66c8 8 12 22 12 38z" />
      {/* The fire, which is what turns a tent into a camp. */}
      <path className="kid-place-flame" d="M96 100c-8 0-13-5-13-12 0-6 5-9 6-15 3 4 4 7 4 11 2-3 3-6 3-10 5 5 9 10 9 16 0 7-5 10-9 10z" />
      <path className="kid-place-log" d="M82 106h32v5H82zM86 100h6v8h-6z" transform="translate(0 -1)" />
    </svg>
  );
}

/** The keeping chest: a lidded box, banded, with the lid just open. */
function ChestArt({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <Ground rx={40} />
      <rect className="kid-place-timber" x="16" y="56" width="88" height="50" rx="6" />
      <path className="kid-place-timber-deep" d="M76 56h28v50H76z" />
      {/* The lid, tipped back, so the chest is open rather than shut. */}
      <path className="kid-place-fill" d="M14 54a46 24 0 0 1 92 0z" transform="rotate(-6 60 44)" />
      <path className="kid-place-accent" d="M52 54h16v22H52z" />
      <circle className="kid-place-lamp" cx="60" cy="68" r="5" />
      <path className="kid-place-line" d="M16 84h88" />
    </svg>
  );
}

/** The quiet garden: an arch with vines over a path. Only when a family opts in. */
function QuietArt({ className }: ArtProps) {
  return (
    <svg {...base} className={className}>
      <Ground rx={38} />
      <path className="kid-place-path-fill" d="M46 108V92h28v16z" />
      <path
        className="kid-place-stone-wall"
        d="M22 108V62a38 38 0 0 1 76 0v46H82V62a22 22 0 0 0-44 0v46z"
      />
      <path className="kid-place-stone-deep" d="M82 108V62a38 38 0 0 0-16-31 38 38 0 0 1 32 31v46z" />
      {/* Vines: the thing that makes it a garden rather than a gate. */}
      <path className="kid-place-vine" d="M30 100c8-6 8-16 2-22M90 96c-8-6-8-15-2-21M60 26c-6 4-10 9-10 14" />
      <circle className="kid-place-bloom" cx="30" cy="74" r="5" />
      <circle className="kid-place-bloom" cx="90" cy="70" r="5" />
      <circle className="kid-place-bloom" cx="50" cy="42" r="4" />
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
