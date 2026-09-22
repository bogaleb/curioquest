import type { ReactElement } from "react";
import type { LabObjectArt } from "@/lib/science/types";

/**
 * Everything the Wonder Lab can put on a bench.
 *
 * Seventy-four things, and not seventy-four drawings. Each object is a **silhouette** — a
 * pebble, a creature, a vessel, a growing plant — recoloured and marked by a small table
 * below. That is not a shortcut around the emoji ban (§A); it is the honest way to draw a
 * lab at this size. Seventy-four bespoke illustrations would be seventy-four chances for
 * the set to stop looking like one set, and the thing a four-year-old actually reads at a
 * glance is silhouette and colour, not detail.
 *
 * What the arrangement buys, beyond consistency: a new station can name an object that
 * already exists, and adding a genuinely new one is a row in a table rather than a new
 * file. The test in `tests/wonder-lab.test.mjs` fails if any authored art key is missing
 * from the table, so content can never get ahead of the drawing.
 *
 * Colour is carried by a `data-tone` attribute and resolved in `app/kid.css` from the
 * scene and child ramps in `app/tokens.css`. Nothing here names a colour.
 *
 * Accessibility: every object is decorative. It always appears beside its own name in a
 * control that already has an accessible name, so a second announcement of "cork, image"
 * would be noise. Where an object is the *only* thing in a control, the control carries
 * the label — see `KidButton`'s `showLabel={false}` contract.
 */

/** The drawn silhouettes. Twelve shapes carry the whole lab. */
type Shape =
  | "pebble"    // rounded, water-worn, solid
  | "chip"      // angular, freshly broken, faceted
  | "vessel"    // something held: a liquid, a body of water
  | "creature"  // an animal, varied by its one distinguishing feature
  | "plant"     // a growing thing, at a stage
  | "orb"       // a body in the sky
  | "puff"      // air made visible: cloud, vapour, falling weather
  | "tool"      // made by people: a handle and a working end
  | "sheet"     // flat material, seen face on
  | "organ"     // a soft part of a body
  | "land"      // a whole place, in miniature
  | "grub";     // a life-cycle stage: egg, larva, winged adult

/**
 * The one distinguishing feature added to a silhouette.
 *
 * A squirrel is a creature with a tail, an owl is a creature with a round face, a whale
 * is a creature with a fluke. Children recognise animals by exactly this: one feature and
 * an outline. Adding fur texture would make the drawings prettier and no more legible.
 */
type Accent =
  | "none" | "tail" | "wings" | "fluke" | "hump" | "ears" | "arms" | "round-face"
  | "legs" | "shine" | "rays" | "crater" | "drop" | "flake" | "wave" | "spark"
  | "crack" | "handle" | "coil" | "hole" | "tree" | "dune" | "ripple" | "bloom"
  | "sprout" | "seedcase" | "grain" | "beat" | "branch" | "land";

type ArtSpec = { shape: Shape; tone: string; accent?: Accent };

/**
 * Every object in the lab.
 *
 * Grouped the way a props cupboard would be rather than alphabetically, because that is
 * how an author looks for one: "is there already something like a stone?".
 */
const ART: Record<LabObjectArt, ArtSpec> = {
  /* --- solids you can pick up -------------------------------------------- */
  cork: { shape: "pebble", tone: "bark", accent: "hole" },
  stone: { shape: "pebble", tone: "stone" },
  "rock-round": { shape: "pebble", tone: "stone", accent: "shine" },
  "rock-rough": { shape: "chip", tone: "stone", accent: "crack" },
  crystal: { shape: "chip", tone: "water", accent: "spark" },
  coin: { shape: "pebble", tone: "metal", accent: "shine" },
  ball: { shape: "pebble", tone: "coral", accent: "shine" },
  ice: { shape: "chip", tone: "water", accent: "shine" },
  brick: { shape: "sheet", tone: "roof", accent: "crack" },
  seed: { shape: "pebble", tone: "bark", accent: "seedcase" },
  sand: { shape: "pebble", tone: "path", accent: "grain" },
  soil: { shape: "sheet", tone: "bark", accent: "grain" },
  wood: { shape: "sheet", tone: "timber", accent: "grain" },

  /* --- flat materials ----------------------------------------------------- */
  glass: { shape: "sheet", tone: "water", accent: "shine" },
  paper: { shape: "sheet", tone: "paper" },
  card: { shape: "sheet", tone: "timber" },
  curtain: { shape: "sheet", tone: "grape", accent: "ripple" },
  plastic: { shape: "pebble", tone: "coral" },
  foil: { shape: "sheet", tone: "metal", accent: "crack" },

  /* --- made things -------------------------------------------------------- */
  spoon: { shape: "tool", tone: "metal", accent: "round-face" },
  clip: { shape: "tool", tone: "metal", accent: "coil" },
  nail: { shape: "tool", tone: "metal" },
  magnet: { shape: "tool", tone: "coral", accent: "spark" },
  lamp: { shape: "tool", tone: "sun", accent: "rays" },
  bell: { shape: "tool", tone: "sun", accent: "beat" },
  drum: { shape: "vessel", tone: "timber", accent: "beat" },
  lever: { shape: "tool", tone: "timber", accent: "handle" },
  pulley: { shape: "tool", tone: "metal", accent: "hole" },
  wheel: { shape: "orb", tone: "bark", accent: "hole" },
  wedge: { shape: "chip", tone: "metal", accent: "shine" },
  "ramp-art": { shape: "chip", tone: "timber", accent: "handle" },
  windflag: { shape: "tool", tone: "leaf", accent: "ripple" },

  /* --- liquids and what holds them ---------------------------------------- */
  water: { shape: "vessel", tone: "water", accent: "wave" },
  milk: { shape: "vessel", tone: "paper", accent: "wave" },
  honey: { shape: "vessel", tone: "sun", accent: "drop" },
  ocean: { shape: "land", tone: "water", accent: "wave" },
  pond: { shape: "land", tone: "water", accent: "ripple" },

  /* --- the sky ------------------------------------------------------------ */
  sun: { shape: "orb", tone: "sun", accent: "rays" },
  moon: { shape: "orb", tone: "paper", accent: "crater" },
  star: { shape: "orb", tone: "sun", accent: "spark" },
  earth: { shape: "orb", tone: "water", accent: "land" },
  darkness: { shape: "orb", tone: "night" },
  cloud: { shape: "puff", tone: "paper" },
  steam: { shape: "puff", tone: "water", accent: "drop" },
  raindrop: { shape: "puff", tone: "water", accent: "drop" },
  snowflake: { shape: "puff", tone: "water", accent: "flake" },

  /* --- places -------------------------------------------------------------- */
  forest: { shape: "land", tone: "leaf", accent: "tree" },
  desert: { shape: "land", tone: "path", accent: "dune" },

  /* --- plants -------------------------------------------------------------- */
  sprout: { shape: "plant", tone: "leaf", accent: "sprout" },
  stem: { shape: "plant", tone: "leaf", accent: "branch" },
  leaf: { shape: "plant", tone: "leaf" },
  flower: { shape: "plant", tone: "coral", accent: "bloom" },

  /* --- animals ------------------------------------------------------------- */
  cat: { shape: "creature", tone: "bark", accent: "ears" },
  squirrel: { shape: "creature", tone: "bark", accent: "tail" },
  owl: { shape: "creature", tone: "timber", accent: "round-face" },
  bird: { shape: "creature", tone: "sun", accent: "wings" },
  whale: { shape: "creature", tone: "water", accent: "fluke" },
  octopus: { shape: "creature", tone: "grape", accent: "arms" },
  camel: { shape: "creature", tone: "path", accent: "hump" },
  frog: { shape: "creature", tone: "leaf", accent: "legs" },
  beetle: { shape: "creature", tone: "grape", accent: "shine" },

  /* --- life-cycle stages ---------------------------------------------------- */
  egg: { shape: "grub", tone: "paper" },
  spawn: { shape: "grub", tone: "water", accent: "grain" },
  caterpillar: { shape: "grub", tone: "leaf", accent: "legs" },
  chrysalis: { shape: "grub", tone: "sun", accent: "shine" },
  butterfly: { shape: "grub", tone: "coral", accent: "wings" },
  tadpole: { shape: "grub", tone: "night", accent: "tail" },
  froglet: { shape: "grub", tone: "leaf", accent: "legs" },

  /* --- the body ------------------------------------------------------------- */
  heart: { shape: "organ", tone: "coral", accent: "beat" },
  muscle: { shape: "organ", tone: "coral", accent: "arms" },
  eye: { shape: "organ", tone: "paper", accent: "round-face" },
  ear: { shape: "organ", tone: "coral", accent: "coil" },
  nose: { shape: "organ", tone: "coral", accent: "drop" },
  hand: { shape: "organ", tone: "coral", accent: "arms" },

  /* --- nothing in particular ------------------------------------------------ */
  blank: { shape: "sheet", tone: "quiet" },
};

/** Every art key the lab knows how to draw. Used by the content tests. */
export const LAB_ART_KEYS = Object.keys(ART) as LabObjectArt[];

/**
 * Put an object on screen.
 *
 * `state` lets a model move the same drawing without redrawing it: a cork rising and a
 * cork sitting on a bench are one picture in two positions, animated in CSS.
 */
export function LabObject({
  art,
  state,
  className = "lab-object",
}: {
  art: LabObjectArt;
  /** Passed through to CSS as `data-state`. The models use it to animate. */
  state?: string;
  className?: string;
}) {
  const spec = ART[art] ?? ART.blank;
  const Silhouette = SHAPES[spec.shape];
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      data-art={art}
      data-tone={spec.tone}
      data-shape={spec.shape}
      data-accent={spec.accent}
      data-state={state}
      aria-hidden="true"
      focusable="false"
    >
      <Silhouette accent={spec.accent ?? "none"} />
    </svg>
  );
}

/* ==========================================================================
   THE SILHOUETTES

   Two painted classes throughout: `lab-fill` for the body and `lab-shade` for the
   shadow side, both resolved from `data-tone`. A third, `lab-mark`, draws the one
   distinguishing feature. Keeping it to three means a new tone is three declarations
   rather than a new drawing.
   ========================================================================== */

type Silhouette = (props: { accent: Accent }) => ReactElement;

const Pebble: Silhouette = ({ accent }) => (
  <>
    <path className="lab-fill" d="M32 10c12 0 20 9 20 20s-9 22-20 22-20-10-20-22 8-20 20-20Z" />
    <path className="lab-shade" d="M32 10c12 0 20 9 20 20s-9 22-20 22c8-6 11-13 11-22S40 15 32 10Z" />
    {accent === "hole" && <g className="lab-mark"><circle cx="26" cy="28" r="2.6" /><circle cx="35" cy="36" r="2.2" /><circle cx="30" cy="42" r="1.8" /></g>}
    {accent === "shine" && <path className="lab-mark" d="M21 24c3-5 8-7 12-7" />}
    {accent === "seedcase" && <path className="lab-mark" d="M32 14v36M24 24c4 4 4 12 0 16" />}
    {accent === "grain" && <g className="lab-mark"><circle cx="24" cy="30" r="1.4" /><circle cx="32" cy="26" r="1.4" /><circle cx="39" cy="33" r="1.4" /><circle cx="29" cy="40" r="1.4" /><circle cx="37" cy="43" r="1.4" /></g>}
  </>
);

const Chip: Silhouette = ({ accent }) => (
  <>
    <path className="lab-fill" d="m32 8 20 13-6 30-27 3L9 26Z" />
    <path className="lab-shade" d="m32 8 20 13-6 30-14 2 8-28Z" />
    {accent === "crack" && <path className="lab-mark" d="m20 20 8 12-5 14" />}
    {accent === "shine" && <path className="lab-mark" d="m18 22 10-8" />}
    {accent === "spark" && <g className="lab-mark"><path d="m32 8 4 14-4 12-5-12Z" /></g>}
    {accent === "handle" && <path className="lab-mark" d="M9 50h46" />}
  </>
);

const Vessel: Silhouette = ({ accent }) => (
  <>
    <path className="lab-fill" d="M16 16h32l-4 34a6 6 0 0 1-6 6H26a6 6 0 0 1-6-6Z" />
    <path className="lab-shade" d="M48 16l-4 34a6 6 0 0 1-6 6h-6c6-2 8-6 9-13l4-27Z" />
    <path className="lab-mark" d="M16 16h32" />
    {accent === "wave" && <path className="lab-mark" d="M19 30c4-3 8 3 12 0s9 3 13 0" />}
    {accent === "drop" && <path className="lab-mark" d="M32 28c4 5 6 8 6 11a6 6 0 0 1-12 0c0-3 2-6 6-11Z" />}
    {accent === "ripple" && <g className="lab-mark"><path d="M20 32h24" /><path d="M23 40h18" /></g>}
    {accent === "beat" && <g className="lab-mark"><path d="M20 26h24" /><circle cx="32" cy="38" r="5" /></g>}
  </>
);

const Creature: Silhouette = ({ accent }) => (
  <>
    {accent === "tail" && <path className="lab-shade" d="M46 44c10-2 12-14 4-20-2 8-6 12-10 13Z" />}
    {accent === "fluke" && <path className="lab-shade" d="M50 36c6-6 10-6 12-10-1 8 0 14-8 18Z" />}
    {accent === "wings" && <path className="lab-shade" d="M38 26c10-8 18-6 22 0-8 2-14 6-18 12Z" />}
    <path className="lab-fill" d="M22 24c12-4 24 0 26 12 1 9-7 16-17 16s-19-6-19-15c0-5 3-10 10-13Z" />
    <path className="lab-shade" d="M48 36c1 9-7 16-17 16 10-4 13-10 13-17 0-6-3-10-8-13 7 2 11 7 12 14Z" />
    {accent === "ears" && <g className="lab-fill"><path d="m18 24 2-11 9 6Z" /><path d="m36 19 9-6 1 11Z" /></g>}
    {accent === "hump" && <path className="lab-fill" d="M24 24c4-11 14-11 18 0Z" />}
    {accent === "round-face" && <g className="lab-mark"><circle cx="26" cy="32" r="4" /><circle cx="38" cy="32" r="4" /></g>}
    {accent === "legs" && <g className="lab-mark"><path d="M20 50 14 58" /><path d="m44 50 6 8" /></g>}
    {accent === "arms" && <g className="lab-mark"><path d="M18 40c-4 6-4 12-1 16" /><path d="M32 46c0 6-1 10-3 13" /><path d="M46 40c4 6 4 12 1 16" /></g>}
    {accent === "shine" && <path className="lab-mark" d="M32 22v28" />}
  </>
);

const Plant: Silhouette = ({ accent }) => (
  <>
    <path className="lab-mark" d="M32 58V26" />
    <path className="lab-fill" d="M32 34c-10 0-16-5-17-13 10-2 16 3 17 13Z" />
    <path className="lab-fill" d="M32 40c10 0 16-5 17-13-10-2-16 3-17 13Z" />
    {accent === "bloom" && <g className="lab-fill"><circle cx="32" cy="18" r="9" /></g>}
    {accent === "bloom" && <circle className="lab-shade" cx="32" cy="18" r="4" />}
    {accent === "sprout" && <path className="lab-shade" d="M24 58h16c0-4-4-6-8-6s-8 2-8 6Z" />}
    {accent === "branch" && <g className="lab-mark"><path d="M32 40 20 30" /><path d="m32 46 13-9" /></g>}
  </>
);

const Orb: Silhouette = ({ accent }) => (
  <>
    {accent === "rays" && (
      <g className="lab-mark lab-rays">
        <path d="M32 2v8M32 54v8M2 32h8M54 32h8M11 11l6 6M47 47l6 6M53 11l-6 6M17 47l-6 6" />
      </g>
    )}
    <circle className="lab-fill" cx="32" cy="32" r="18" />
    <path className="lab-shade" d="M32 14a18 18 0 0 1 0 36c7-5 11-11 11-18s-4-13-11-18Z" />
    {accent === "crater" && <g className="lab-mark"><circle cx="26" cy="26" r="3.4" /><circle cx="35" cy="38" r="2.6" /><circle cx="24" cy="38" r="2" /></g>}
    {accent === "spark" && <path className="lab-mark" d="M32 12l4 14 14 4-14 4-4 14-4-14-14-4 14-4Z" />}
    {accent === "hole" && <g className="lab-mark"><circle cx="32" cy="32" r="6" /><path d="M32 14v36M14 32h36" /></g>}
    {accent === "land" && <path className="lab-mark" d="M20 26c6 2 8-2 14 0s8 6 12 4M18 38c8-2 12 4 20 2" />}
  </>
);

const Puff: Silhouette = ({ accent }) => (
  <>
    <path
      className="lab-fill"
      d="M18 40a9 9 0 0 1 1-18 12 12 0 0 1 23-3 9 9 0 0 1 3 21Z"
    />
    <path className="lab-shade" d="M45 40a9 9 0 0 0-3-21c4 4 5 9 3 14 5 1 6 5 4 7Z" />
    {accent === "drop" && <g className="lab-mark"><path d="M24 46c3 4 4 6 4 8a4 4 0 0 1-8 0c0-2 1-4 4-8Z" /><path d="M40 48c3 4 4 6 4 8a4 4 0 0 1-8 0c0-2 1-4 4-8Z" /></g>}
    {accent === "flake" && <g className="lab-mark"><path d="M32 44v16M25 48l14 8M39 48l-14 8" /></g>}
  </>
);

const Tool: Silhouette = ({ accent }) => (
  <>
    <rect className="lab-fill" x="28" y="24" width="8" height="34" rx="4" />
    <path className="lab-shade" d="M36 24v34a4 4 0 0 1-4 4c2-2 2-4 2-8V24Z" />
    {accent === "round-face" ? (
      <ellipse className="lab-fill" cx="32" cy="16" rx="12" ry="10" />
    ) : accent === "rays" ? (
      <>
        <path className="lab-fill" d="M20 22 32 4l12 18Z" />
        <g className="lab-mark lab-rays"><path d="M8 34h8M48 34h8M14 46l6-5M50 46l-6-5" /></g>
      </>
    ) : accent === "coil" ? (
      <path className="lab-mark" d="M24 18a8 8 0 1 1 16 0v22a5 5 0 0 1-10 0V22" />
    ) : accent === "spark" ? (
      <>
        <path className="lab-fill" d="M16 10h12v20H16Zm20 0h12v20H36Z" />
        <g className="lab-mark"><path d="M16 30h12M36 30h12" /></g>
      </>
    ) : accent === "ripple" ? (
      <path className="lab-fill" d="M36 10c10 2 16 6 22 4-4 6-4 10 0 16-8-2-14 2-22 4Z" />
    ) : accent === "handle" ? (
      <g className="lab-mark"><path d="M10 52h44" /><circle cx="22" cy="52" r="4" /></g>
    ) : accent === "hole" ? (
      <>
        <circle className="lab-fill" cx="32" cy="16" r="11" />
        <circle className="lab-mark" cx="32" cy="16" r="4" />
      </>
    ) : accent === "beat" ? (
      <>
        <path className="lab-fill" d="M18 34c0-12 6-20 14-20s14 8 14 20Z" />
        <path className="lab-mark" d="M14 34h36" />
        <circle className="lab-fill" cx="32" cy="42" r="4" />
      </>
    ) : (
      <path className="lab-fill" d="M26 6h12v18H26Z" />
    )}
  </>
);

const Sheet: Silhouette = ({ accent }) => (
  <>
    <rect className="lab-fill" x="12" y="12" width="40" height="40" rx="4" />
    <path className="lab-shade" d="M52 12v40a4 4 0 0 1-4 4h-8c6-4 8-10 8-22s-2-18-8-22h8a4 4 0 0 1 4 4Z" />
    {accent === "grain" && <g className="lab-mark"><path d="M18 22h28M18 32h28M18 42h28" /></g>}
    {accent === "crack" && <path className="lab-mark" d="m20 16 8 16-6 20" />}
    {accent === "shine" && <path className="lab-mark" d="m18 46 22-30" />}
    {accent === "ripple" && <g className="lab-mark"><path d="M18 16c4 8-4 16 0 24s-4 8 0 12" /><path d="M32 16c4 8-4 16 0 24s-4 8 0 12" /><path d="M46 16c4 8-4 16 0 24s-4 8 0 12" /></g>}
  </>
);

const Organ: Silhouette = ({ accent }) => (
  <>
    <path className="lab-fill" d="M32 54C16 42 10 34 10 26a12 12 0 0 1 22-7 12 12 0 0 1 22 7c0 8-6 16-22 28Z" />
    <path className="lab-shade" d="M54 26c0 8-6 16-22 28 12-13 16-20 16-27a12 12 0 0 0-6-10 12 12 0 0 1 12 9Z" />
    {accent === "beat" && <path className="lab-mark" d="M14 32h8l4-8 5 16 4-8h15" />}
    {accent === "round-face" && <><circle className="lab-mark" cx="32" cy="30" r="8" /><circle className="lab-fill" cx="32" cy="30" r="3" /></>}
    {accent === "coil" && <path className="lab-mark" d="M38 22a10 10 0 1 0-4 18c5 0 6-6 2-8" />}
    {accent === "arms" && <g className="lab-mark"><path d="M22 30v-14M32 28V12M42 30V16" /></g>}
    {accent === "drop" && <path className="lab-mark" d="M26 34c4 2 8 2 12 0" />}
  </>
);

const Land: Silhouette = ({ accent }) => (
  <>
    <rect className="lab-fill" x="6" y="30" width="52" height="26" rx="6" />
    <path className="lab-shade" d="M58 36v14a6 6 0 0 1-6 6H36c12-4 18-11 22-20Z" />
    {accent === "wave" && <g className="lab-mark"><path d="M12 38c5-4 9 4 14 0s9 4 14 0 9 4 12 0" /><path d="M12 48c5-4 9 4 14 0s9 4 14 0 9 4 12 0" /></g>}
    {accent === "ripple" && <g className="lab-mark"><path d="M16 42h32" /><path d="M22 50h20" /></g>}
    {accent === "tree" && (
      <g className="lab-mark">
        <path d="M20 30V16" /><path d="M20 16c-7 0-10-4-10-9 7-1 10 3 10 9Z" />
        <path d="M44 30V20" /><path d="M44 20c7 0 10-4 10-9-7-1-10 3-10 9Z" />
      </g>
    )}
    {accent === "dune" && <path className="lab-mark" d="M8 34c10-8 18 6 26 0s14-8 22-2" />}
  </>
);

const Grub: Silhouette = ({ accent }) => (
  <>
    {accent === "wings" && (
      <g className="lab-shade">
        <path d="M30 32C20 18 8 18 6 26c-2 9 10 16 24 12Z" />
        <path d="M34 32c10-14 22-14 24-6 2 9-10 16-24 12Z" />
      </g>
    )}
    {accent === "tail" && <path className="lab-shade" d="M44 32c8-6 12-10 16-10-4 8-4 14 0 22-6-2-10-6-16-12Z" />}
    <rect className="lab-fill" x="14" y="24" width="34" height="18" rx="9" />
    <circle className="lab-fill" cx="20" cy="33" r="10" />
    <path className="lab-shade" d="M48 33a9 9 0 0 1-9 9h-6c7-2 10-5 10-9s-3-7-10-9h6a9 9 0 0 1 9 9Z" />
    {accent === "legs" && <g className="lab-mark"><path d="M22 42v6M30 42v6M38 42v6" /></g>}
    {accent === "grain" && <g className="lab-mark"><circle cx="22" cy="33" r="2" /><circle cx="31" cy="33" r="2" /><circle cx="40" cy="33" r="2" /></g>}
    {accent === "shine" && <path className="lab-mark" d="M20 26c8-2 16-2 24 0" />}
  </>
);

const SHAPES: Record<Shape, Silhouette> = {
  pebble: Pebble,
  chip: Chip,
  vessel: Vessel,
  creature: Creature,
  plant: Plant,
  orb: Orb,
  puff: Puff,
  tool: Tool,
  sheet: Sheet,
  organ: Organ,
  land: Land,
  grub: Grub,
};
