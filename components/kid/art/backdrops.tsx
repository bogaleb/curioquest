/**
 * The drawn planes (WP-11 §2.2).
 *
 * Every piece of scenery a child screen is built from. These are the shapes that turn a
 * background into a place, and they are the reason this package exists: the map they
 * replace had one gradient, one ellipse for a sun and one arc for a ridge, and no amount
 * of tuning a flat band makes it read as distance.
 *
 * ## How these are drawn
 *
 * Four rules, applied to everything in this file, because a set of shapes drawn to
 * different rules reads as clip art rather than as one world:
 *
 *   1. **Two tones per object.** A lit face and a shadow side, with the light always
 *      coming from the upper left. One-tone shapes are what made `PlaceArt` read as
 *      icons — a flat triangle is a symbol for a tree, not a tree.
 *   2. **Nothing floats.** Anything sitting on the ground gets a contact shadow. This is
 *      the single cheapest change that makes a landmark belong to the scene.
 *   3. **No true circles, no straight edges on anything organic.** A canopy is three
 *      overlapping lumps of slightly different sizes; grass is not a comb.
 *   4. **Distance desaturates and lightens.** The `far` plane uses `--scene-canopy-far`
 *      and never the near greens, so the horizon recedes instead of competing.
 *
 * ## Why the split between stretchy and fixed
 *
 * Landforms — hills, ground, water — are smooth curves, so they are drawn with
 * `preserveAspectRatio="none"` and stretch to any width without anyone being able to tell.
 * Anything with recognisable proportions — a tree, a rock, a flower — keeps its aspect
 * ratio and is placed by CSS, because a tree stretched to 2.5× width is a bush and a child
 * learning what a grove looks like should not have to relearn it at a different viewport.
 *
 * Colour comes from `--scene-*` in `app/tokens.css`. Deliberately never from
 * `--kid-world-*`: a world recolours its landmarks, never the ground and the trees
 * (`tests/tokens.test.mjs` enforces this). A grove whose trunks turn violet when the
 * child walks into Story Harbour has stopped being a place.
 */

import type { CSSProperties } from "react";

/* ==========================================================================
   SKY
   ========================================================================== */

/**
 * The sky: a gradient, a sun, and three clouds at different depths.
 *
 * The clouds are the only ambient motion most screens get, and they drift over
 * `--kid-dur-ambient-slow` (24s) — slow enough to be noticed only if you look for it.
 * `app/kid.css` stops them under `prefers-reduced-motion`.
 */
export function SkyWash({ sun = true }: { sun?: boolean }) {
  return (
    <div className="kid-sky-wash">
      {sun ? (
        <span className="kid-sky-sun">
          <span className="kid-sky-sun-glow" />
          <span className="kid-sky-sun-core" />
        </span>
      ) : null}
      {/* Three clouds, three depths, three speeds. Different shapes on purpose: a
          repeated silhouette reads as a pattern rather than as weather. */}
      <span className="kid-cloud" data-depth="1"><CloudA /></span>
      <span className="kid-cloud" data-depth="2"><CloudB /></span>
      <span className="kid-cloud" data-depth="3"><CloudC /></span>
    </div>
  );
}

function CloudA() {
  return (
    <svg viewBox="0 0 160 62" aria-hidden="true" focusable="false">
      <path
        className="kid-cloud-body"
        d="M26 58c-13 0-22-8-22-18 0-9 7-16 16-17 2-13 13-22 27-22 11 0 20 5 25 14 4-3 9-5 14-5 12 0 22 9 23 21 10 1 17 8 17 17 0 10-9 18-22 18z"
      />
      {/* The underside. A cloud with no shadow is a white sticker. */}
      <path
        className="kid-cloud-shade"
        d="M26 58c-7 0-13-2-17-6 6 2 12 3 19 3h78c7 0 13-1 18-3-4 4-10 6-17 6z"
      />
    </svg>
  );
}

function CloudB() {
  return (
    <svg viewBox="0 0 120 48" aria-hidden="true" focusable="false">
      <path
        className="kid-cloud-body"
        d="M22 45C10 45 2 38 2 29c0-8 6-14 14-15C18 5 27 0 37 0c9 0 17 5 21 12 3-2 7-3 11-3 10 0 18 7 19 17 7 2 12 8 12 15 0 5-4 4-9 4z"
      />
      <path className="kid-cloud-shade" d="M22 45c-5 0-10-1-13-4 5 1 9 2 14 2h68c4 0 8 0 11-1-2 2-5 3-9 3z" />
    </svg>
  );
}

function CloudC() {
  return (
    <svg viewBox="0 0 96 38" aria-hidden="true" focusable="false">
      <path
        className="kid-cloud-body"
        d="M18 36C8 36 1 30 1 22c0-6 5-12 12-12 2-6 8-10 15-10 7 0 13 4 16 10 2-1 4-2 7-2 8 0 14 6 15 13 6 1 10 5 10 10 0 4-3 5-8 5z"
      />
      <path className="kid-cloud-shade" d="M18 36c-4 0-8-1-11-3 4 1 8 1 12 1h50c3 0 6 0 9-1-2 2-5 3-8 3z" />
    </svg>
  );
}

/* ==========================================================================
   FAR — the horizon
   ========================================================================== */

/**
 * Distant hills. Two ridges, the back one paler, with a haze band where they meet the sky.
 *
 * Stretchy: these are smooth curves and nobody can tell they have been widened.
 */
export function FarHills() {
  return (
    <svg
      className="kid-far-hills"
      viewBox="0 0 1200 260"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      {/* Back ridge. Lowest contrast, highest on the screen. */}
      <path
        className="kid-hill-back"
        d="M0 152c118-46 212-58 300-38 74 17 122 47 196 52 88 6 150-28 244-46 76-15 154-10 230 12 84 24 154 30 230 18v130H0z"
      />
      {/* Front ridge, overlapping it. The overlap is what reads as two distances
          rather than as one lumpy shape. */}
      <path
        className="kid-hill-front"
        d="M0 206c104-34 178-44 258-30 68 12 118 34 188 34 84 0 140-28 230-34 82-6 158 8 232 26 64 16 188 22 292 10v48H0z"
      />
      {/* Haze where the land meets the sky. Atmospheric perspective, one shape. */}
      <path className="kid-hill-haze" d="M0 190c140-30 260-36 380-22 130 15 220 34 350 30 150-5 290-32 470-22v34H0z" />
    </svg>
  );
}

/**
 * A cluster of distant canopy for the far plane — trees as one desaturated mass rather
 * than as individuals, which is how a treeline actually reads at distance.
 */
export function FarCanopy() {
  return (
    <svg
      className="kid-far-canopy"
      viewBox="0 0 400 96"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        className="kid-canopy-far"
        d="M0 96V58c10-12 22-14 32-6 6-16 20-22 32-14 6-18 24-24 38-12 8-16 26-18 38-6 10-14 26-14 36 2 10-10 24-8 32 6 10-6 22-2 28 10 10-4 20 2 24 12 8-6 18 0 22 10 8-2 14 4 18 14V96z"
      />
    </svg>
  );
}

/* ==========================================================================
   MID / NEAR — the ground a child stands on
   ========================================================================== */

/**
 * The ground: one soft crest, a deeper band under it, and a shade line where the light
 * stops. Three shapes instead of one flat fill, which is the difference between a floor
 * and a colour.
 */
export function GroundBand() {
  return (
    <svg
      className="kid-ground-band"
      viewBox="0 0 1200 320"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path className="kid-ground-top" d="M0 44c180-34 360-44 560-30 190 13 330 36 520 28 44-2 84-6 120-12v290H0z" />
      <path className="kid-ground-mid" d="M0 140c200-26 380-32 580-18 180 12 340 30 500 22 44-2 80-6 120-12v188H0z" />
      <path className="kid-ground-low" d="M0 236c220-20 420-22 620-10 170 10 330 22 470 16 42-2 76-4 110-8v86H0z" />
    </svg>
  );
}

/**
 * Water: a body with a deeper base and two glints.
 *
 * The glints are the ambient motion — they travel slowly across the surface. Nothing
 * about the shape moves, because water that changes outline reads as a wobbling jelly.
 */
export function WaterBody() {
  return (
    <div className="kid-water">
      <svg
        className="kid-water-body"
        viewBox="0 0 600 160"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path className="kid-water-fill" d="M0 18c110-16 210-20 320-10 96 9 182 22 280 16v136H0z" />
        <path className="kid-water-deep" d="M0 92c120-12 230-14 350-6 90 6 170 14 250 10v64H0z" />
      </svg>
      <span className="kid-water-glint" data-glint="1" />
      <span className="kid-water-glint" data-glint="2" />
    </div>
  );
}

/* ==========================================================================
   PLANTING — the pieces that keep their proportions
   ========================================================================== */

/**
 * A tree. The building block of every wooded scene in the product.
 *
 * Trunk in two tones, three overlapping canopy lumps of deliberately different sizes,
 * a shadow side on the right, and a contact shadow at the base. `tone` selects how far
 * away it is, so the same component serves the far treeline and the tree a child is
 * standing under.
 */
export function Tree({ tone = "near" }: { tone?: "near" | "mid" | "far" }) {
  return (
    <svg className="kid-tree" data-tone={tone} viewBox="0 0 120 170" aria-hidden="true" focusable="false">
      <ellipse className="kid-contact" cx="60" cy="163" rx="34" ry="7" />
      <path className="kid-bark" d="M53 164c-2-22 1-44 4-62 2-12 3-24 2-36h8c-1 13 0 26 2 38 3 18 5 39 3 60z" />
      <path className="kid-bark-deep" d="M62 164c1-21 0-42-3-60-2-13-3-26-2-38h4c-1 13 0 26 2 38 3 18 5 39 4 60z" />
      {/* Canopy: three lumps, none of them the same size, none of them a circle. */}
      <path
        className="kid-leaf"
        d="M60 6c20 0 34 14 34 31 0 4-1 8-2 11 9 5 14 14 14 24 0 16-14 28-32 28H46C28 100 14 88 14 72c0-10 5-19 14-24-1-3-2-7-2-11C26 20 40 6 60 6z"
      />
      {/* Shadow side. The light is upper-left everywhere in this file. */}
      <path
        className="kid-leaf-deep"
        d="M92 48c9 5 14 14 14 24 0 16-14 28-32 28H58c16-2 26-11 30-24 3-11 2-21 4-28z"
      />
      {/* Two lit highlights, so the canopy has a top rather than an edge. */}
      <path className="kid-leaf-lit" d="M44 22c6-7 16-10 24-7-9 1-16 5-20 12-3 5-4 10-3 15-5-6-5-14-1-20z" />
    </svg>
  );
}

/** A rounded shrub. Used to break a ground line and to hide the join between planes. */
export function Bush() {
  return (
    <svg className="kid-bush" viewBox="0 0 96 62" aria-hidden="true" focusable="false">
      <ellipse className="kid-contact" cx="48" cy="57" rx="30" ry="5" />
      <path
        className="kid-leaf"
        d="M20 58C9 58 2 51 2 42c0-8 6-14 13-15 1-9 9-16 19-16 7 0 13 3 17 9 4-4 9-6 15-6 11 0 20 9 20 20 0 1 0 3-1 4 5 2 9 7 9 13 0 8-7 14-16 14z"
      />
      <path className="kid-leaf-deep" d="M84 47c0 8-7 14-16 14H44c14-1 24-6 29-15 3-5 4-11 3-16 5 2 8 7 8 13z" />
    </svg>
  );
}

/**
 * Grass. Six tufts of different heights and lean, because a repeated blade reads as a comb.
 * The sway is ambient and the whole strip is one element, so one animation covers it.
 */
export function GrassTuft() {
  return (
    <svg className="kid-grass" viewBox="0 0 80 34" aria-hidden="true" focusable="false">
      {/* Blades are wedges rather than hairlines: a 1px stroke disappears at the
          sizes these are actually drawn at and reads as a scratch on the screen. */}
      <path
        className="kid-grass-blade"
        d="M4 34c-2-11 1-20 7-27-2 11-1 20 3 27zM17 34c-4-13-2-24 4-32-2 12 0 23 4 32zM31 34c-2-10 1-18 6-25-2 10 0 18 3 25zM45 34c-3-14 0-25 6-33-2 13 0 24 3 33zM59 34c-2-10 1-17 6-23-2 9 0 16 3 23zM71 34c-3-12-1-21 4-28-2 11 0 20 3 28z"
      /></svg>
  );
}

/**
 * A small flower. Three colours exist (`--scene-bloom-a/b/c`) and they are the only thing
 * stopping a green valley reading as one colour. Never the sole way to tell two things
 * apart — §C6 does not accept colour as the only channel.
 */
export function Bloom({ tone = "a" }: { tone?: "a" | "b" | "c" }) {
  return (
    <svg className="kid-bloom" data-tone={tone} viewBox="0 0 28 40" aria-hidden="true" focusable="false">
      <path className="kid-bloom-stem" d="M14 40V20" />
      <path className="kid-bloom-leaf" d="M14 30c-5 0-8-3-8-7 5 0 8 3 8 7zM14 26c5 0 8-3 8-7-5 0-8 3-8 7z" />
      <circle className="kid-bloom-petal" cx="14" cy="9" r="5" />
      <circle className="kid-bloom-petal" cx="7" cy="14" r="4.4" />
      <circle className="kid-bloom-petal" cx="21" cy="14" r="4.4" />
      <circle className="kid-bloom-petal" cx="14" cy="18" r="4" />
      <circle className="kid-bloom-heart" cx="14" cy="13.5" r="3" />
    </svg>
  );
}

/** A rock. Two tones and a contact shadow; the cheapest way to give a ground line weight. */
export function Rock() {
  return (
    <svg className="kid-rock" viewBox="0 0 72 44" aria-hidden="true" focusable="false">
      <ellipse className="kid-contact" cx="36" cy="40" rx="26" ry="4" />
      <path className="kid-stone" d="M8 41c-4-8-3-17 4-24 6-6 15-9 24-8 10 1 19 6 24 15 3 5 4 11 2 17z" />
      <path className="kid-stone-deep" d="M40 9c10 1 19 6 24 15 3 5 4 11 2 17H38c7-9 9-20 2-32z" />
    </svg>
  );
}

/* ==========================================================================
   FORE — the framing edge
   ========================================================================== */

/**
 * Foreground leaves, cropped by the viewport edge.
 *
 * This is the oldest trick in scene illustration and it does more for a sense of depth
 * than anything else here: something between the viewer and the world means the viewer is
 * standing somewhere rather than looking at a picture. Mirrored by CSS for the other side.
 */
export function ForeLeaves() {
  return (
    <svg className="kid-fore-leaves" viewBox="0 0 220 260" aria-hidden="true" focusable="false">
      <path
        className="kid-fore-leaf"
        d="M-10 20c56-6 102 14 132 56 22 31 28 66 20 100-34-2-66-18-90-46C26 98 8 58-10 20z"
      />
      <path className="kid-fore-vein" d="M-4 28c44 20 78 54 96 96" />
      <path
        className="kid-fore-leaf"
        d="M-10 148c44 4 80 26 102 60 14 22 18 44 16 62-28-4-54-20-72-44-18-24-32-50-46-78z"
      />
      <path className="kid-fore-vein" d="M-2 156c36 20 64 48 80 82" />
    </svg>
  );
}

/**
 * The trail: stepping stones receding into the distance.
 *
 * Drawn as discrete stones rather than as a continuous ribbon, for three reasons.
 *
 * A stroked path cannot taper, so a ribbon drawn this way is the same width at the horizon
 * as it is at the child's feet — which reads as a ribbon standing upright in the sky rather
 * than as ground going away. Stones get smaller, and that is all perspective needs.
 *
 * Stones can be counted. "Three more stones" is a thing a four-year-old understands about
 * how much is left; a percentage along a path is not.
 *
 * And each stone can light independently, which is what `done` is for: the trail is lit
 * exactly as far as the child has actually travelled and no further. That is the progress
 * display for the reading path (§3.3), and it needs no number and no reading.
 *
 * The travelling highlight runs up the unlit stones toward the next one. It is the only
 * motion in the product that points somewhere — everything else that moves is life rather
 * than direction (§4), which is what keeps this one meaningful.
 */
const TRAIL_STONES = [
  { cx: 200, cy: 398, rx: 76, ry: 27 },
  { cx: 146, cy: 332, rx: 63, ry: 22 },
  { cx: 216, cy: 274, rx: 52, ry: 18 },
  { cx: 166, cy: 224, rx: 43, ry: 15 },
  { cx: 222, cy: 181, rx: 35, ry: 12 },
  { cx: 182, cy: 145, rx: 28, ry: 10 },
  { cx: 216, cy: 114, rx: 22, ry: 8 },
];

export function TrailPath({
  /** How many stones the child has actually reached. Lit from the bottom up. */
  done = 0,
}: {
  done?: number;
}) {
  return (
    <svg className="kid-trail-path" viewBox="0 0 400 420" aria-hidden="true" focusable="false">
      {TRAIL_STONES.map((stone, index) => (
        <g
          key={stone.cy}
          className="kid-trail-stone"
          data-lit={index < done || undefined}
          // The stagger belongs to the data — which stone this is — rather than to the
          // stylesheet, which cannot know how many there are.
          style={{ "--stone-index": String(index) } as CSSProperties}
        >
          {/* The stone's own shadow on the ground, offset down and left of the light. */}
          <ellipse className="kid-trail-shadow" cx={stone.cx - 3} cy={stone.cy + 5} rx={stone.rx} ry={stone.ry} />
          <ellipse className="kid-trail-bed" cx={stone.cx} cy={stone.cy + 3} rx={stone.rx} ry={stone.ry} />
          <ellipse className="kid-trail-surface" cx={stone.cx} cy={stone.cy} rx={stone.rx} ry={stone.ry} />
        </g>
      ))}
    </svg>
  );
}
