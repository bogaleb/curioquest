"use client";

import type { CastState } from "@/lib/experience/types";

/**
 * The cast, drawn (WP-11 §2.3).
 *
 * Nova and Pip already existed as CSS puppets — a stack of twenty absolutely positioned
 * `<div>`s each, with the fox's ears, tail and scarf built out of border radii. They
 * worked, and they are the reason the product has any character at all, but a div puppet
 * can only ever be built out of rectangles with rounded corners, which is why Nova had no
 * outline and no shadow side and read as a toy assembled from parts.
 *
 * These are one SVG each. That buys three things a puppet cannot have: a real silhouette,
 * a shadow side, and parts that can be animated independently without each one needing its
 * own positioned box.
 *
 * ## The rig contract
 *
 * The whole teaching cast takes the same props and exposes the same animatable
 * parts, so a surface can put *a character* on screen without knowing which one
 * it got:
 *
 *   `.cast-breathe`  the whole body, rising and falling at rest
 *   `.cast-blink`    the eyes
 *   `.cast-mouth`    open while `talking`
 *   `.cast-limb`     an arm or wing, for pointing and celebrating
 *   `.cast-tail`     a tail, where the character has one
 *
 * `app/kid.css` animates those class names and nothing else, which means a fifth character
 * needs no new CSS.
 *
 * ## States
 *
 * `CastState` is reused exactly as `lib/experience/types.ts` already declares it — eight
 * states, unchanged. The plan for this package floated adding `think` and `oops`; they are
 * not added, because `listen` and `encourage` already cover both readings and widening a
 * shared union would reach into every consumer of it for no gain a child can see.
 *
 * One rule about `encourage`, which is the state Bramble and Wren use when something has
 * gone wrong: **nobody in this cast performs disappointment at a child.** Wren gets things
 * wrong first so that being wrong looks survivable, and Bramble is an obstacle, not a
 * judgement. There is no sad face in this file.
 */

export type CastName =
  | "curio"
  | "nova"
  | "luna"
  | "milo"
  | "bea"
  | "tuno"
  | "riff"
  | "atlas"
  | "pip"
  | "wren"
  | "bramble";

export type CastRig = {
  who: CastName;
  state?: CastState;
  talking?: boolean;
  /** Which way the character is turned. Mirrored in CSS, so nothing is drawn twice. */
  facing?: "left" | "right";
  scale?: "small" | "normal" | "large";
};

const LABELS: Record<CastName, string> = {
  curio: "Curio the fox",
  nova: "Nova the explorer",
  luna: "Luna the owl",
  milo: "Milo the robot",
  bea: "Bea the bee",
  tuno: "Tuno the turtle",
  riff: "Riff the rabbit",
  atlas: "Atlas the elephant",
  pip: "Pip the robot",
  wren: "Wren the little bird",
  bramble: "Bramble",
};

/**
 * Put a character on screen.
 *
 * The accessible name is the character's name and nothing else. The old puppets announced
 * "Nova the fox, explain" — a state name is system vocabulary (§C5) and it is read aloud
 * to the one child on the screen who is most dependent on it being a sentence.
 */
export function CastFigure({ who, state = "idle", talking = false, facing = "right", scale = "normal" }: CastRig) {
  const Body = FIGURES[who];
  return (
    <span
      className="kid-cast"
      data-who={who}
      data-state={state}
      data-talking={talking || undefined}
      data-facing={facing}
      data-scale={scale}
      role="img"
      aria-label={LABELS[who]}
    >
      <Body />
    </span>
  );
}

/* ==========================================================================
   CURIO — the guide
   ========================================================================== */

/**
 * A fox. Warm, round, and slightly too big in the head, which is what reads as friendly
 * rather than as clever.
 *
 * He is the only character who is always competent. A guide who fumbles is not reassuring
 * to a child who is about to try something hard.
 */
function Curio() {
  return (
    <svg viewBox="0 0 200 220" aria-hidden="true" focusable="false">
      <ellipse className="kid-contact" cx="100" cy="209" rx="54" ry="9" />

      {/* Tail first, so it sits behind the body. Its own class, its own idle sway. */}
      <g className="cast-tail">
        <path
          className="cast-fur"
          d="M52 178c-26 4-44-10-44-32 0-26 22-44 44-40 14 3 20 14 18 26-2 10-8 16-6 26 1 8 5 14-12 20z"
        />
        <path className="cast-fur-lit" d="M22 122c12-8 26-6 32 4-10-3-20-1-26 6-5 6-6 14-3 21-8-10-9-23-3-31z" />
        <path className="cast-belly" d="M14 158c-4-12 0-24 9-31-2 12 0 22 7 29-6 5-12 6-16 2z" />
      </g>

      <g className="cast-breathe">
        {/* Legs, drawn before the body so the body overlaps them. */}
        <path className="cast-paw" d="M74 196c-8 0-13-4-13-10s5-10 13-10 13 4 13 10-5 10-13 10z" />
        <path className="cast-paw" d="M126 196c-8 0-13-4-13-10s5-10 13-10 13 4 13 10-5 10-13 10z" />

        {/* Body */}
        <path className="cast-fur" d="M100 88c30 0 50 22 50 54 0 30-20 48-50 48s-50-18-50-48c0-32 20-54 50-54z" />
        <path className="cast-fur-deep" d="M128 98c16 10 22 28 22 44 0 30-20 48-50 48 32-2 46-20 46-48 0-18-6-33-18-44z" />
        <path className="cast-belly" d="M100 112c18 0 30 14 30 32 0 17-12 28-30 28s-30-11-30-28c0-18 12-32 30-32z" />

        {/* Arms. `cast-limb` is the shared hook: pointing and celebrating move these. */}
        <path className="cast-limb cast-fur" data-side="left" d="M56 118c-10 4-14 16-10 26 3 8 11 12 17 8 5-4 5-12 2-19-3-6-4-12-9-15z" />
        <path className="cast-limb cast-fur" data-side="right" d="M144 118c10 4 14 16 10 26-3 8-11 12-17 8-5-4-5-12-2-19 3-6 4-12 9-15z" />

        {/* Scarf: the one piece of colour that is hers rather than the world's. */}
        <path className="cast-scarf" d="M68 92c10 7 20 10 32 10s22-3 32-10c3 6 4 13 2 18-10 7-21 10-34 10s-24-3-34-10c-2-5-1-12 2-18z" />
        <path className="cast-scarf-deep" d="M132 92c3 6 4 13 2 18-6 4-12 7-19 8 7-8 12-17 17-26z" />

        {/* Head group: ears behind the face. */}
        <g className="cast-head">
          <path className="cast-fur" d="M54 40c-2-18 2-30 8-32 8-3 20 8 28 22-14 2-27 6-36 10z" />
          <path className="cast-fur" d="M146 40c2-18-2-30-8-32-8-3-20 8-28 22 14 2 27 6 36 10z" />
          <path className="cast-ear-inner" d="M62 34c-1-11 1-19 4-20 5-2 12 5 17 14-8 1-15 3-21 6z" />
          <path className="cast-ear-inner" d="M138 34c1-11-1-19-4-20-5-2-12 5-17 14 8 1 15 3 21 6z" />

          <path className="cast-fur" d="M100 22c32 0 54 22 54 50s-22 48-54 48-54-20-54-48 22-50 54-50z" />
          <path className="cast-fur-deep" d="M128 30c16 9 26 26 26 42 0 28-22 48-54 48 34-2 50-21 50-48 0-16-8-31-22-42z" />

          {/* The muzzle: the shape that makes a fox a fox. */}
          <path className="cast-belly" d="M100 58c22 0 38 12 38 26 0 16-17 26-38 26s-38-10-38-26c0-14 16-26 38-26z" />

          <g className="cast-blink">
            <ellipse className="cast-eye" cx="82" cy="60" rx="7" ry="8" />
            <ellipse className="cast-eye" cx="118" cy="60" rx="7" ry="8" />
            <circle className="cast-eye-shine" cx="84.5" cy="57" r="2.4" />
            <circle className="cast-eye-shine" cx="120.5" cy="57" r="2.4" />
          </g>
          <ellipse className="cast-blush" cx="70" cy="76" rx="8" ry="5" />
          <ellipse className="cast-blush" cx="130" cy="76" rx="8" ry="5" />

          <path className="cast-nose" d="M100 74c6 0 10 3 10 7s-4 7-10 7-10-3-10-7 4-7 10-7z" />
          <path className="cast-mouth" d="M100 88c0 6 5 11 11 11M100 88c0 6-5 11-11 11" />
        </g>
      </g>
      {/* Celebration sparks. Drawn, not an emoji — the old puppet used a ✦ glyph. */}
      <g className="cast-spark">
        <path className="cast-spark-mark" d="M36 60l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" />
        <path className="cast-spark-mark" d="M166 44l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
      </g>
    </svg>
  );
}

/* ==========================================================================
   PIP — the junior
   ========================================================================== */

/**
 * A small robot on a single tread. Boxy where Nova is round, which is the whole point:
 * a child should be able to tell them apart as silhouettes at thumbnail size.
 *
 * Pip asks the question a child might be too shy to ask.
 */
function Pip() {
  return (
    <svg viewBox="0 0 180 210" aria-hidden="true" focusable="false">
      <ellipse className="kid-contact" cx="90" cy="200" rx="46" ry="8" />

      <g className="cast-breathe">
        {/* Antenna. Its bulb glows, slowly, and stops under reduced motion. */}
        <path className="cast-antenna" d="M90 44V22" />
        <circle className="cast-antenna-bulb" cx="90" cy="16" r="9" />

        {/* Head: a rounded box with a screen for a face. */}
        <rect className="cast-shell" x="34" y="42" width="112" height="86" rx="26" />
        <path className="cast-shell-deep" d="M120 42h0a26 26 0 0 1 26 26v34a26 26 0 0 1-26 26h-14c14-6 22-20 22-43s-8-37-22-43z" />
        <rect className="cast-screen" x="50" y="58" width="80" height="54" rx="18" />

        <g className="cast-blink">
          <circle className="cast-glow" cx="72" cy="80" r="7" />
          <circle className="cast-glow" cx="108" cy="80" r="7" />
        </g>
        <path className="cast-mouth cast-glow-line" d="M76 98h28" />

        {/* Body */}
        <rect className="cast-shell" x="46" y="126" width="88" height="56" rx="20" />
        <path className="cast-shell-deep" d="M114 126h0a20 20 0 0 1 20 20v16a20 20 0 0 1-20 20h-10c10-6 16-16 16-28s-6-22-16-28z" />
        <circle className="cast-glow" cx="90" cy="152" r="10" />

        {/* Arms */}
        <path className="cast-limb cast-shell" data-side="left" d="M44 138c-12 2-18 12-16 22 2 8 9 12 14 9 5-3 5-10 3-16-2-6-1-12-1-15z" />
        <path className="cast-limb cast-shell" data-side="right" d="M136 138c12 2 18 12 16 22-2 8-9 12-14 9-5-3-5-10-3-16 2-6 1-12 1-15z" />

        {/* The tread. Pip has no legs, so this is where the weight is. */}
        <rect className="cast-shell-deep" x="52" y="178" width="76" height="22" rx="11" />
        <circle className="cast-shell" cx="68" cy="189" r="6" />
        <circle className="cast-shell" cx="90" cy="189" r="6" />
        <circle className="cast-shell" cx="112" cy="189" r="6" />
      </g>
      <g className="cast-spark">
        <path className="cast-spark-mark" d="M28 54l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
        <path className="cast-spark-mark" d="M150 38l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
      </g>
    </svg>
  );
}

/* ==========================================================================
   WREN — the peer
   ========================================================================== */

/**
 * A small brown bird, and the character this cast most needed.
 *
 * Wren is the child's age, not the guide's. She tries first and gets it wrong first, out
 * loud, so that a four-year-old sitting with a word they cannot read has already watched
 * someone survive exactly that. She is never corrected unkindly and she is never the one
 * who knows the answer — that is Nova's job, and giving it to a peer would make the peer a
 * teacher and take the point away.
 */
function Wren() {
  return (
    <svg viewBox="0 0 170 180" aria-hidden="true" focusable="false">
      <ellipse className="kid-contact" cx="85" cy="170" rx="40" ry="7" />

      <g className="cast-breathe">
        {/* Feet */}
        <path className="cast-foot" d="M70 168v-10M70 168h-7M70 168h7M100 168v-10M100 168h-7M100 168h7" />

        {/* Tail, up and behind — a wren's tail is its signature. */}
        <g className="cast-tail">
          <path className="cast-feather-deep" d="M124 112c14-10 24-26 24-40 6 12 4 30-6 42-6 8-14 12-20 10z" />
        </g>

        {/* Body: one egg shape, which is most of what makes a small bird read as small. */}
        <path className="cast-feather" d="M85 44c28 0 46 24 46 56 0 34-20 56-46 56s-46-22-46-56c0-32 18-56 46-56z" />
        <path className="cast-feather-deep" d="M110 56c14 11 21 30 21 44 0 34-20 56-46 56 30-2 42-22 42-56 0-16-6-32-17-44z" />
        <path className="cast-belly" d="M85 82c17 0 28 14 28 32 0 19-11 32-28 32s-28-13-28-32c0-18 11-32 28-32z" />

        {/* Wings. The shared `cast-limb` hook, so pointing works the same as Nova's arm. */}
        <path className="cast-limb cast-feather-deep" data-side="left" d="M44 92c-9 6-11 20-6 30 4 8 12 10 16 5 4-5 2-13-2-19-4-6-6-12-8-16z" />
        <path className="cast-limb cast-feather-deep" data-side="right" d="M126 92c9 6 11 20 6 30-4 8-12 10-16 5-4-5-2-13 2-19 4-6 6-12 8-16z" />

        <g className="cast-head">
          {/* A small crest, so she has a top and reads younger than Nova. */}
          <path className="cast-feather-deep" d="M78 18c2-8 8-13 14-12-4 4-6 9-5 15-3-2-6-3-9-3z" />
          <path className="cast-feather" d="M85 16c24 0 40 17 40 38s-16 36-40 36-40-15-40-36 16-38 40-38z" />
          <path className="cast-feather-deep" d="M104 24c13 7 21 19 21 30 0 21-16 36-40 36 25-2 36-16 36-36 0-11-6-22-17-30z" />

          <g className="cast-blink">
            <ellipse className="cast-eye" cx="70" cy="48" rx="6.5" ry="7.5" />
            <ellipse className="cast-eye" cx="100" cy="48" rx="6.5" ry="7.5" />
            <circle className="cast-eye-shine" cx="72" cy="45" r="2.2" />
            <circle className="cast-eye-shine" cx="102" cy="45" r="2.2" />
          </g>
          <ellipse className="cast-blush" cx="58" cy="62" rx="7" ry="4.5" />
          <ellipse className="cast-blush" cx="112" cy="62" rx="7" ry="4.5" />

          {/* The beak is the mouth: it opens while she talks. */}
          <path className="cast-mouth cast-beak" d="M85 58l11 9-11 9-11-9z" />
        </g>
      </g>
      <g className="cast-spark">
        <path className="cast-spark-mark" d="M26 46l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
        <path className="cast-spark-mark" d="M144 34l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
      </g>
    </svg>
  );
}

/* ==========================================================================
   BRAMBLE — friction with a face
   ========================================================================== */

/**
 * A round purple thicket with eyes, and the character this package is most careful about.
 *
 * Bramble is the obstacle: the tangle across the path, the knot in the puzzle, the thing
 * that has to be worked through. He is emphatically **not** a villain and never an enemy,
 * because the thing standing between a five-year-old and a hard word should not also be
 * something to be afraid of. He is drawn round rather than spiky-sharp, his thorns are
 * pale, and his default expression is interested.
 *
 * When the child gets through, he is pleased. That is the entire performance — there is no
 * defeat animation, because productive struggle is the learning principle here and
 * humiliating the obstacle teaches the wrong thing about difficulty.
 */
function Bramble() {
  return (
    <svg viewBox="0 0 180 170" aria-hidden="true" focusable="false">
      <ellipse className="kid-contact" cx="90" cy="160" rx="48" ry="8" />

      <g className="cast-breathe">
        {/* Thorns, behind the body: pale, blunt, and pointing outward rather than at
            the viewer. A silhouette of spikes aimed forward reads as a threat. */}
        <g className="cast-thorns">
          <path className="cast-thorn" d="M90 14l7 20H83zM36 40l18 12-10 10zM144 40l-18 12 10 10zM14 96l20 5-5 13zM166 96l-20 5 5 13z" />
        </g>

        <path className="cast-bramble" d="M90 26c36 0 60 26 60 60 0 38-24 62-60 62s-60-24-60-62c0-34 24-60 60-60z" />
        <path className="cast-bramble-deep" d="M118 38c20 11 32 30 32 48 0 38-24 62-60 62 40-2 54-26 54-62 0-18-8-36-26-48z" />

        {/* A few lighter tangles across the body, so he reads as woven rather than solid. */}
        <path className="cast-thorn-line" d="M46 74c18 10 40 12 62 6M40 100c22 12 50 12 76-2M56 124c18 8 40 8 60-2" />

        <g className="cast-head">
          <g className="cast-blink">
            <ellipse className="cast-eye" cx="72" cy="78" rx="8" ry="9" />
            <ellipse className="cast-eye" cx="108" cy="78" rx="8" ry="9" />
            <circle className="cast-eye-shine" cx="74.5" cy="74.5" r="2.8" />
            <circle className="cast-eye-shine" cx="110.5" cy="74.5" r="2.8" />
          </g>
          {/* Eyebrows: raised, which is curiosity. Never lowered — lowered is a scowl. */}
          <path className="cast-thorn-line" d="M62 62c6-4 13-4 19 0M99 62c6-4 13-4 19 0" />
          <path className="cast-mouth" d="M78 104c4 5 8 7 12 7s8-2 12-7" />
        </g>

        {/* Stubby limbs, so he can be surprised and pleased with his whole body. */}
        <path className="cast-limb cast-bramble-deep" data-side="left" d="M32 96c-10 4-14 16-10 25 3 7 10 9 14 5 4-5 3-13 0-19-3-5-4-9-4-11z" />
        <path className="cast-limb cast-bramble-deep" data-side="right" d="M148 96c10 4 14 16 10 25-3 7-10 9-14 5-4-5-3-13 0-19 3-5 4-9 4-11z" />
      </g>
      <g className="cast-spark">
        <path className="cast-spark-mark" d="M24 58l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
        <path className="cast-spark-mark" d="M154 46l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
      </g>
    </svg>
  );
}

/**
 * Nova, redesigned: the child explorer and the player's stand-in.
 * Round-headed kid with short dark hair, big eyes, backpack bumps behind the
 * shoulders and a tiny compass badge. The existing fox figure becomes Curio.
 */
function Nova() {
  return (
    <svg viewBox="0 0 200 220" aria-hidden="true" focusable="false">
      <ellipse className="kid-contact" cx="100" cy="209" rx="52" ry="9" />

      <g className="cast-breathe">
        {/* Backpack bumps peeking from behind the shoulders. */}
        <circle className="cast-fur-lit" cx="50" cy="142" r="20" />
        <circle className="cast-fur-lit" cx="150" cy="142" r="20" />

        {/* Legs and shoes. */}
        <rect className="cast-belly" x="68" y="174" width="16" height="26" rx="8" />
        <rect className="cast-belly" x="116" y="174" width="16" height="26" rx="8" />
        <ellipse className="cast-fur-deep" cx="76" cy="199" rx="14" ry="9" />
        <ellipse className="cast-fur-deep" cx="124" cy="199" rx="14" ry="9" />

        {/* Explorer shirt. */}
        <path className="cast-fur" d="M100 112c27 0 44 17 44 40 0 21-17 36-44 36s-44-15-44-36c0-23 17-40 44-40z" />

        {/* Backpack straps over the shoulders. */}
        <rect className="cast-fur-deep" x="73" y="108" width="10" height="28" rx="5" />
        <rect className="cast-fur-deep" x="117" y="108" width="10" height="28" rx="5" />

        {/* Compass badge on the chest. */}
        <circle className="cast-eye-shine" cx="100" cy="150" r="9" />
        <path className="cast-fur-deep" d="M100 143l4 7-4 7-4-7z" />

        {/* Arms. */}
        <path className="cast-limb cast-fur" data-side="left" d="M60 134c-10 4-14 15-10 25 3 8 11 11 16 7 5-4 5-11 2-18-2-6-4-11-8-14z" />
        <path className="cast-limb cast-fur" data-side="right" d="M140 134c10 4 14 15 10 25-3 8-11 11-16 7-5-4-5-11-2-18 2-6 4-11 8-14z" />

        <g className="cast-head">
          <path className="cast-belly" d="M56 80c-9 1-13 8-11 14 2 5 8 6 12 4z" />
          <path className="cast-belly" d="M144 80c9 1 13 8 11 14-2 5-8 6-12 4z" />
          <path className="cast-belly" d="M100 28c30 0 50 20 50 46s-20 44-50 44-50-18-50-44 20-46 50-46z" />
          {/* Short dark hair with a wavy fringe. */}
          <path className="cast-fur-deep" d="M52 74c-2-28 20-48 48-48s50 20 48 48c-5-8-10-11-14-9-3-8-10-12-17-10-4-7-12-8-17-4-6-5-13-4-16 1-6-2-12 1-14 6-4-1-8 2-10 6-3-1-6 1-8 4z" />

          <g className="cast-blink">
            <ellipse className="cast-eye" cx="82" cy="92" rx="9" ry="10.5" />
            <ellipse className="cast-eye" cx="118" cy="92" rx="9" ry="10.5" />
            <circle className="cast-eye-shine" cx="85" cy="88.5" r="3" />
            <circle className="cast-eye-shine" cx="121" cy="88.5" r="3" />
          </g>
          <ellipse className="cast-blush" cx="66" cy="108" rx="8" ry="5" />
          <ellipse className="cast-blush" cx="134" cy="108" rx="8" ry="5" />
          <path className="cast-mouth" d="M88 114c4 5 8 7 12 7s8-2 12-7" />
        </g>
      </g>
      <g className="cast-spark">
        <path className="cast-spark-mark" d="M34 52l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" />
        <path className="cast-spark-mark" d="M168 40l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
      </g>
    </svg>
  );
}

/**
 * Luna the owl. Round and lavender, with huge facial discs and a tiny beak —
 * the two shapes that make an owl read as an owl at 48px. Gentle, bookish,
 * never stern.
 */
function Luna() {
  return (
    <svg viewBox="0 0 200 220" aria-hidden="true" focusable="false">
      <ellipse className="kid-contact" cx="100" cy="209" rx="54" ry="9" />

      <g className="cast-breathe">
        {/* Perched feet. */}
        <rect className="cast-feather-deep" x="70" y="192" width="22" height="12" rx="6" />
        <rect className="cast-feather-deep" x="108" y="192" width="22" height="12" rx="6" />

        {/* Round body. */}
        <path className="cast-feather" d="M100 66c34 0 56 26 56 62 0 34-22 58-56 58s-56-24-56-58c0-36 22-62 56-62z" />
        <path className="cast-feather-deep" d="M128 78c16 11 28 30 28 50 0 34-22 58-56 58 34-2 50-24 50-58 0-18-8-36-22-50z" />
        <path className="cast-belly" d="M100 118c19 0 32 15 32 34 0 18-13 30-32 30s-32-12-32-30c0-19 13-34 32-34z" />

        {/* Wings on the shared limb hook. */}
        <path className="cast-limb cast-feather-deep" data-side="left" d="M48 108c-11 5-15 20-10 31 4 9 13 12 18 7 5-5 3-15-1-22-4-7-5-12-7-16z" />
        <path className="cast-limb cast-feather-deep" data-side="right" d="M152 108c11 5 15 20 10 31-4 9-13 12-18 7-5-5-3-15 1-22 4-7 5-12 7-16z" />

        <g className="cast-head">
          {/* Feather ear-tufts. */}
          <path className="cast-feather" d="M64 42c-9-9-12-22-9-32 8 5 13 17 14 29z" />
          <path className="cast-feather" d="M136 42c9-9 12-22 9-32-8 5-13 17-14 29z" />
          {/* Big round head. */}
          <path className="cast-feather" d="M100 26c30 0 50 20 50 44s-20 42-50 42-50-18-50-44 20-42 50-42z" />
          <path className="cast-feather-deep" d="M126 34c14 8 24 22 24 36 0 24-20 42-50 42 32-2 46-20 46-42 0-14-7-27-20-36z" />
          {/* Facial discs: the shape that makes an owl an owl. */}
          <circle className="cast-belly" cx="78" cy="72" r="21" />
          <circle className="cast-belly" cx="122" cy="72" r="21" />

          <g className="cast-blink">
            <ellipse className="cast-eye" cx="78" cy="72" rx="11" ry="13" />
            <ellipse className="cast-eye" cx="122" cy="72" rx="11" ry="13" />
            <circle className="cast-eye-shine" cx="81.5" cy="67" r="3.4" />
            <circle className="cast-eye-shine" cx="125.5" cy="67" r="3.4" />
          </g>
          <ellipse className="cast-blush" cx="60" cy="96" rx="7" ry="4.5" />
          <ellipse className="cast-blush" cx="140" cy="96" rx="7" ry="4.5" />
          {/* Small beak; it opens while she talks, like Wren's. */}
          <path className="cast-mouth cast-beak" d="M100 94l10 8-10 8-10-8z" />
        </g>
      </g>
      <g className="cast-spark">
        <path className="cast-spark-mark" d="M30 48l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" />
        <path className="cast-spark-mark" d="M170 36l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
      </g>
    </svg>
  );
}

/**
 * Milo the robot. Deliberately the opposite of the boxy, tread-based Pip:
 * round everywhere — dome head, pebble body, stubby arms, ball feet — with
 * real dark eyes instead of a screen face, and blue light accents.
 */
function Milo() {
  return (
    <svg viewBox="0 0 200 220" aria-hidden="true" focusable="false">
      <ellipse className="kid-contact" cx="100" cy="209" rx="50" ry="9" />

      <g className="cast-breathe">
        {/* Round feet. */}
        <path className="cast-shell-deep" d="M70 196c-9 0-15-4-15-10 0-7 7-12 15-12s15 5 15 12c0 6-6 10-15 10z" />
        <path className="cast-shell-deep" d="M130 196c-9 0-15-4-15-10 0-7 7-12 15-12s15 5 15 12c0 6-6 10-15 10z" />

        {/* Round pebble body. */}
        <path className="cast-shell" d="M100 104c28 0 46 18 46 42 0 23-18 39-46 39s-46-16-46-39c0-24 18-42 46-42z" />
        <path className="cast-shell-deep" d="M126 114c14 9 20 22 20 32 0 23-18 39-46 39 30-2 42-18 42-39 0-11-5-23-16-32z" />
        {/* Chest light. */}
        <circle className="cast-glow" cx="100" cy="146" r="10" />
        <circle className="cast-eye-shine" cx="100" cy="146" r="4" />

        {/* Stubby arms. */}
        <path className="cast-limb cast-shell" data-side="left" d="M58 130c-9 3-13 12-10 20 2 7 9 10 14 7 4-3 4-10 2-15-2-5-3-9-6-12z" />
        <path className="cast-limb cast-shell" data-side="right" d="M142 130c9 3 13 12 10 20-2 7-9 10-14 7-4-3-4-10-2-15 2-5 3-9 6-12z" />

        <g className="cast-head">
          {/* Headphone-style side bolts. */}
          <circle className="cast-shell-deep" cx="54" cy="66" r="8" />
          <circle className="cast-shell-deep" cx="146" cy="66" r="8" />
          {/* Springy antenna with a glowing bulb. */}
          <path className="cast-antenna" d="M100 32c-3-9 5-11 3-20" />
          <circle className="cast-antenna-bulb" cx="103" cy="10" r="8" />
          {/* Dome head. */}
          <path className="cast-shell" d="M100 28c27 0 45 18 45 41 0 22-18 39-45 39s-45-17-45-39c0-23 18-41 45-41z" />
          <path className="cast-shell-deep" d="M126 36c12 8 19 21 19 33 0 22-18 39-45 39 29-2 41-19 41-39 0-12-5-24-15-33z" />
          {/* Blue brow band. */}
          <path className="cast-glow" d="M64 52c11-8 23-12 36-12s25 4 36 12c-1 5-5 7-9 5-10-6-19-9-27-9s-17 3-27 9c-4 2-8 0-9-5z" />

          {/* Real eyes, not a screen — the thing that sets him apart from Pip. */}
          <g className="cast-blink">
            <ellipse className="cast-eye" cx="84" cy="72" rx="7" ry="8.5" />
            <ellipse className="cast-eye" cx="116" cy="72" rx="7" ry="8.5" />
            <circle className="cast-eye-shine" cx="86.5" cy="69" r="2.6" />
            <circle className="cast-eye-shine" cx="118.5" cy="69" r="2.6" />
          </g>
          <circle className="cast-glow" cx="70" cy="86" r="4" />
          <circle className="cast-glow" cx="130" cy="86" r="4" />
          <path className="cast-mouth" d="M88 90c4 5 8 7 12 7s8-2 12-7" />
        </g>
      </g>
      <g className="cast-spark">
        <path className="cast-spark-mark" d="M32 50l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" />
        <path className="cast-spark-mark" d="M168 38l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
      </g>
    </svg>
  );
}

/**
 * Bea the bee. One round fuzzy body with wrapped stripes, translucent wings,
 * and dot antennae. No stinger — nothing sharp anywhere on her.
 */
function Bea() {
  return (
    <svg viewBox="0 0 200 220" aria-hidden="true" focusable="false">
      <ellipse className="kid-contact" cx="100" cy="209" rx="50" ry="9" />

      <g className="cast-breathe">
        {/* Wings, tucked behind the body. */}
        <ellipse className="cast-wing" cx="52" cy="92" rx="27" ry="14" transform="rotate(-28 52 92)" />
        <ellipse className="cast-wing" cx="148" cy="92" rx="27" ry="14" transform="rotate(28 148 92)" />

        {/* Little feet. */}
        <ellipse className="cast-fur-deep" cx="80" cy="198" rx="10" ry="7" />
        <ellipse className="cast-fur-deep" cx="120" cy="198" rx="10" ry="7" />

        {/* Round fuzzy body. */}
        <path className="cast-fur" d="M100 92c30 0 50 20 50 50 0 29-20 48-50 48s-50-19-50-48c0-30 20-50 50-50z" />
        {/* Stripes, wrapped and curved with the body. Kept below the face. */}
        <path className="cast-fur-deep" d="M56 132c14-7 29-11 44-11s30 4 44 11c1 6 2 12 2 18-13-6-28-10-46-10s-33 4-46 10c0-6 1-12 2-18z" />
        <path className="cast-fur-deep" d="M60 158c13-6 26-9 40-9s27 3 40 9c-1 5-2 10-4 14-12-4-24-7-36-7s-24 3-36 7c-2-4-3-9-4-14z" />

        {/* Tiny arms. */}
        <path className="cast-limb cast-fur" data-side="left" d="M58 132c-8 3-12 11-9 18 2 6 8 9 12 6 4-3 4-9 2-14-2-5-3-8-5-10z" />
        <path className="cast-limb cast-fur" data-side="right" d="M142 132c8 3 12 11 9 18-2 6-8 9-12 6-4-3-4-9-2-14 2-5 3-8 5-10z" />

        <g className="cast-head">
          {/* Dot antennae. */}
          <path className="cast-antenna" d="M88 96c-4-10-10-15-18-19" />
          <circle className="cast-antenna-bulb" cx="68" cy="75" r="6.5" />
          <path className="cast-antenna" d="M112 96c4-10 10-15 18-19" />
          <circle className="cast-antenna-bulb" cx="132" cy="75" r="6.5" />

          <g className="cast-blink">
            <ellipse className="cast-eye" cx="80" cy="104" rx="8.5" ry="10" />
            <ellipse className="cast-eye" cx="120" cy="104" rx="8.5" ry="10" />
            <circle className="cast-eye-shine" cx="83" cy="100.5" r="3" />
            <circle className="cast-eye-shine" cx="123" cy="100.5" r="3" />
          </g>
          <ellipse className="cast-blush" cx="62" cy="116" rx="7.5" ry="5" />
          <ellipse className="cast-blush" cx="138" cy="116" rx="7.5" ry="5" />
          <path className="cast-mouth" d="M88 128c4 5 8 7 12 7s8-2 12-7" />
        </g>
      </g>
      <g className="cast-spark">
        <path className="cast-spark-mark" d="M30 56l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" />
        <path className="cast-spark-mark" d="M170 44l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
      </g>
    </svg>
  );
}

/* ==========================================================================
   TUNO — the calm one
   ========================================================================== */

/**
 * A small green turtle, low and round. Tuno teaches the pause: breathing,
 * looking again, taking time. The shell is a dome with soft patches rather
 * than hard plates, the head is small and unhurried, and the default
 * expression is quiet contentment. Tuno never hurries and never startles —
 * a slow blink is the biggest event on this face.
 */
function Tuno() {
  return (
    <svg viewBox="0 0 200 220" aria-hidden="true" focusable="false">
      <ellipse className="kid-contact" cx="100" cy="209" rx="58" ry="9" />

      <g className="cast-breathe">
        {/* Back flippers, drawn before the shell so it overlaps them. */}
        <path className="cast-paw" d="M36 184 c0-7 8-12 18-12 s18 5 18 12-8 12-18 12-18-5-18-12z" />
        <path className="cast-paw" d="M128 184 c0-7 8-12 18-12 s18 5 18 12-8 12-18 12-18-5-18-12z" />

        {/* The shell: one low dome. */}
        <path className="cast-fur" d="M100 74 c40 0 68 24 68 56 0 30-28 52-68 52 s-68-22-68-52 c0-32 28-56 68-56z" />
        <path className="cast-fur-deep" d="M128 82 c20 10 40 26 40 48 0 30-28 52-68 52 40-2 54-22 54-52 0-18-8-34-26-48z" />
        {/* Soft shell patches — rounded, never hard-edged. */}
        <path className="cast-fur-deep" d="M78 98l9 5v10l-9 5-9-5v-10z" />
        <path className="cast-fur-deep" d="M112 92l9 5v10l-9 5-9-5v-10z" />
        <path className="cast-fur-deep" d="M95 124l9 5v10l-9 5-9-5v-10z" />
        <path className="cast-fur-deep" d="M64 128l7 4v8l-7 4-7-4v-8z" />
        {/* The rim: the lighter band a real shell has along its edge. */}
        <path className="cast-belly" d="M40 158 c22 14 98 14 120 0 c2 8-2 16-10 20 c-30 10-70 10-100 0 c-8-4-12-12-10-20z" />

        {/* Front flippers. `cast-limb` is the shared hook: pointing and celebrating move these. */}
        <path className="cast-limb cast-fur" data-side="left" d="M46 138 c-13 5-18 19-12 30 4 8 12 10 16 5 4-6 3-14-1-20-3-6-3-11-3-15z" />
        <path className="cast-limb cast-fur" data-side="right" d="M154 138 c13 5 18 19 12 30-4 8-12 10-16 5-4-6-3-14 1-20 3-6 3-11 3-15z" />

        <g className="cast-head">
          <path className="cast-fur" d="M100 40 c17 0 29 12 29 27 s-12 27-29 27-29-12-29-27 12-27 29-27z" />
          <path className="cast-fur-deep" d="M114 46 c10 6 15 14 15 21 0 15-12 27-29 27 17-3 26-13 26-27 0-8-4-15-12-21z" />

          <g className="cast-blink">
            <ellipse className="cast-eye" cx="86" cy="64" rx="7" ry="8" />
            <ellipse className="cast-eye" cx="114" cy="64" rx="7" ry="8" />
            <circle className="cast-eye-shine" cx="88.5" cy="61" r="2.4" />
            <circle className="cast-eye-shine" cx="116.5" cy="61" r="2.4" />
          </g>
          <ellipse className="cast-blush" cx="74" cy="78" rx="7" ry="4.5" />
          <ellipse className="cast-blush" cx="126" cy="78" rx="7" ry="4.5" />

          <path className="cast-mouth" d="M90 84 c3 4 6 6 10 6 s7-2 10-6" />
        </g>
      </g>
      <g className="cast-spark">
        <path className="cast-spark-mark" d="M30 56l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" />
        <path className="cast-spark-mark" d="M168 40l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
      </g>
    </svg>
  );
}

/* ==========================================================================
   RIFF — the music one
   ========================================================================== */

/**
 * A rabbit, and the tallest silhouette in the cast. The long upright ears do
 * all the identification work at thumbnail size, so the body can stay a
 * simple joyful round. Riff feels rhythm in the whole body: big hind feet
 * planted, tail bouncing behind, mouth always a beat away from a song.
 */
function Riff() {
  return (
    <svg viewBox="0 0 200 220" aria-hidden="true" focusable="false">
      <ellipse className="kid-contact" cx="100" cy="209" rx="50" ry="9" />

      {/* Fluffy round tail, behind the body. Its own class, its own idle sway. */}
      <g className="cast-tail">
        <path className="cast-fur" d="M44 150 c12 0 22 10 22 22 s-10 22-22 22-22-10-22-22 10-22 22-22z" />
        <path className="cast-fur-lit" d="M34 160 c5-5 13-7 19-4-6 2-10 6-11 12-4-2-7-5-8-8z" />
      </g>

      <g className="cast-breathe">
        {/* Big hind feet: a rabbit sits in its feet. */}
        <path className="cast-paw" d="M47 192 c0-7 8-12 17-12 s17 5 17 12-8 12-17 12-17-5-17-12z" />
        <path className="cast-paw" d="M119 192 c0-7 8-12 17-12 s17 5 17 12-8 12-17 12-17-5-17-12z" />

        {/* Body */}
        <path className="cast-fur" d="M100 98 c27 0 45 20 45 49 0 28-18 47-45 47 s-45-19-45-47 c0-29 18-49 45-49z" />
        <path className="cast-fur-deep" d="M122 106 c14 9 23 24 23 41 0 28-18 47-45 47 29-2 41-19 41-47 0-15-7-30-19-41z" />
        <path className="cast-belly" d="M100 124 c15 0 25 11 25 26 0 14-10 25-25 25 s-25-11-25-25 c0-15 10-26 25-26z" />

        {/* Arms. `cast-limb` is the shared hook: pointing and celebrating move these. */}
        <path className="cast-limb cast-fur" data-side="left" d="M58 128 c-9 4-13 14-10 23 3 7 10 10 15 6 4-4 4-11 1-17-2-5-3-9-6-12z" />
        <path className="cast-limb cast-fur" data-side="right" d="M142 128 c9 4 13 14 10 23-3 7-10 10-15 6-4-4-4-11-1-17 2-5 3-9 6-12z" />

        <g className="cast-head">
          {/* The ears: long, upright, plain paths like the fox's — the silhouette. */}
          <path className="cast-fur" d="M72 46 C58 32 53 14 61 6 C69 0 79 10 83 26 C86 39 84 50 72 46 Z" />
          <path className="cast-fur" d="M128 46 C142 32 147 14 139 6 C131 0 121 10 117 26 C114 39 116 50 128 46 Z" />
          <path className="cast-ear-inner" d="M69 38 C61 28 59 16 64 11 C69 7 75 14 77 24 C79 32 77 41 69 38 Z" />
          <path className="cast-ear-inner" d="M131 38 C139 28 141 16 136 11 C131 7 125 14 123 24 C121 32 123 41 131 38 Z" />

          {/* A little cowlick between the ears — Riff's one abstract flourish. */}
          <path className="cast-fur-deep" d="M96 26 c-2-8 2-15 10-16 c-3 5-3 11 1 15 c-4 1-8 1-11 1z" />

          <path className="cast-fur" d="M100 26 c29 0 51 20 51 45 s-22 43-51 43-51-18-51-43 22-45 51-45z" />
          <path className="cast-fur-deep" d="M122 34 c14 8 29 12 29 37 0 25-22 43-51 43 31-2 45-19 45-43 0-15-9-28-23-37z" />

          <g className="cast-blink">
            <ellipse className="cast-eye" cx="84" cy="68" rx="7.5" ry="8.5" />
            <ellipse className="cast-eye" cx="116" cy="68" rx="7.5" ry="8.5" />
            <circle className="cast-eye-shine" cx="86.5" cy="65" r="2.6" />
            <circle className="cast-eye-shine" cx="118.5" cy="65" r="2.6" />
          </g>
          <ellipse className="cast-blush" cx="71" cy="82" rx="8" ry="5" />
          <ellipse className="cast-blush" cx="129" cy="82" rx="8" ry="5" />

          {/* Joyful and open — the widest smile in the cast. */}
          <path className="cast-mouth" d="M80 88 c7 9 13 13 20 13 s13-4 20-13" />
        </g>
      </g>
      <g className="cast-spark">
        <path className="cast-spark-mark" d="M28 116l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
        <path className="cast-spark-mark" d="M172 92l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
      </g>
    </svg>
  );
}

/* ==========================================================================
   ATLAS — the far-travelled one
   ========================================================================== */

/**
 * A baby elephant. Atlas has been everywhere and remembers all of it, which
 * is why the ears are big (for listening) and the expression is kind rather
 * than grand. The trunk hangs short and curls a little, the legs are sturdy
 * columns, and the single brow line is raised — curiosity, never a scowl.
 * Atlas never looms: the head is oversized and the whole animal is round.
 */
function Atlas() {
  return (
    <svg viewBox="0 0 200 220" aria-hidden="true" focusable="false">
      <ellipse className="kid-contact" cx="100" cy="209" rx="56" ry="9" />

      <g className="cast-breathe">
        {/* Back column-legs, drawn before the body so it overlaps them. */}
        <path className="cast-fur-deep" d="M62 150 h26 v36 c0 9-6 14-13 14 s-13-5-13-14z" />
        <path className="cast-fur-deep" d="M112 150 h26 v36 c0 9-6 14-13 14 s-13-5-13-14z" />

        {/* Body */}
        <path className="cast-fur" d="M100 84 c33 0 54 22 54 52 0 28-21 46-54 46 s-54-18-54-46 c0-30 21-52 54-52z" />
        <path className="cast-fur-deep" d="M124 92 c16 10 30 22 30 44 0 28-21 46-54 46 33-2 47-20 47-46 0-17-8-31-23-44z" />

        {/* Front column-legs. `cast-limb` is the shared hook: pointing and celebrating move these. */}
        <path className="cast-limb cast-fur" data-side="left" d="M70 152 h24 v34 c0 8-5 13-12 13 s-12-5-12-13z" />
        <path className="cast-limb cast-fur" data-side="right" d="M106 152 h24 v34 c0 8-5 13-12 13 s-12-5-12-13z" />

        <g className="cast-head">
          {/* Big floppy ears, behind the head. Plain rounded paths — floppy, never pointed. */}
          <path className="cast-fur" d="M60 52 c-24-8-40 4-38 24 c2 18 18 30 36 26 c6-12 8-32 2-50z" />
          <path className="cast-fur" d="M140 52 c24-8 40 4 38 24 c-2 18-18 30-36 26 c-6-12-8-32-2-50z" />
          <path className="cast-fur-deep" d="M52 60 c-14-3-24 5-23 17 c1 11 11 18 22 16 c4-8 5-21 1-33z" />
          <path className="cast-fur-deep" d="M148 60 c14-3 24 5 23 17 c-1 11-11 18-22 16 c-4-8-5-21-1-33z" />

          <path className="cast-fur" d="M100 20 c27 0 46 19 46 41 s-19 39-46 39-46-17-46-39 19-41 46-41z" />
          <path className="cast-fur-deep" d="M120 28 c12 7 26 12 26 33 0 22-19 39-46 39 29-2 42-18 42-39 0-14-8-25-22-33z" />

          {/* The brow: one soft raised arc. Raised is curiosity; lowered would be a scowl. */}
          <path className="cast-thorn-line" d="M70 46 c9-6 19-8 30-8 s21 2 30 8" />

          <g className="cast-blink">
            <ellipse className="cast-eye" cx="82" cy="62" rx="7" ry="8" />
            <ellipse className="cast-eye" cx="118" cy="62" rx="7" ry="8" />
            <circle className="cast-eye-shine" cx="84.5" cy="59" r="2.4" />
            <circle className="cast-eye-shine" cx="120.5" cy="59" r="2.4" />
          </g>
          <ellipse className="cast-blush" cx="68" cy="78" rx="7" ry="4.5" />
          <ellipse className="cast-blush" cx="132" cy="78" rx="7" ry="4.5" />

          {/* The trunk: short, hanging center, tip curling gently. It sways with the breathe group. */}
          <path className="cast-fur" d="M91 74 C89 90 90 102 95 112 C97 118 103 121 108 118 C113 116 114 110 110 106 C105 100 104 90 105 82 C106 76 102 72 91 74 Z" />
          <path className="cast-fur-deep" d="M94 78 c-2 13-1 27 3 38 c-5-11-6-25-5-38z" />

          <path className="cast-mouth" d="M88 128 c4 5 8 7 12 7 s8-2 12-7" />
        </g>
      </g>
      <g className="cast-spark">
        <path className="cast-spark-mark" d="M28 60l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
        <path className="cast-spark-mark" d="M172 44l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" />
      </g>
    </svg>
  );
}

const FIGURES: Record<CastName, () => React.ReactElement> = {
  curio: Curio,
  nova: Nova,
  luna: Luna,
  milo: Milo,
  bea: Bea,
  tuno: Tuno,
  riff: Riff,
  atlas: Atlas,
  pip: Pip,
  wren: Wren,
  bramble: Bramble,
};
