"use client";

import type { NovaState } from "@/lib/experience/types";

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
 * All four characters take the same props and expose the same animatable parts, so a
 * surface can put *a character* on screen without knowing which one it got:
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
 * `NovaState` is reused exactly as `lib/experience/types.ts` already declares it — eight
 * states, unchanged. The plan for this package floated adding `think` and `oops`; they are
 * not added, because `listen` and `encourage` already cover both readings and widening a
 * shared union would reach into every consumer of it for no gain a child can see.
 *
 * One rule about `encourage`, which is the state Bramble and Wren use when something has
 * gone wrong: **nobody in this cast performs disappointment at a child.** Wren gets things
 * wrong first so that being wrong looks survivable, and Bramble is an obstacle, not a
 * judgement. There is no sad face in this file.
 */

export type CastName = "nova" | "pip" | "wren" | "bramble";

export type CastRig = {
  who: CastName;
  state?: NovaState;
  talking?: boolean;
  /** Which way the character is turned. Mirrored in CSS, so nothing is drawn twice. */
  facing?: "left" | "right";
  scale?: "small" | "normal" | "large";
};

const LABELS: Record<CastName, string> = {
  nova: "Nova the fox",
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
   NOVA — the guide
   ========================================================================== */

/**
 * A fox. Warm, round, and slightly too big in the head, which is what reads as friendly
 * rather than as clever.
 *
 * She is the only character who is always competent. A guide who fumbles is not reassuring
 * to a child who is about to try something hard.
 */
function Nova() {
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

const FIGURES: Record<CastName, () => React.ReactElement> = {
  nova: Nova,
  pip: Pip,
  wren: Wren,
  bramble: Bramble,
};
