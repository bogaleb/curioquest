"use client";

import type { ReactElement } from "react";
import type { LabModel, LabMotion, LabObjectArt } from "@/lib/science/types";
import { LabObject } from "./objects";

/**
 * The apparatus.
 *
 * This is the part of the Wonder Lab that has to be *true*, and the part the old lab got
 * furthest from: it drew an emoji, moved it 65 pixels down the page with a CSS transform,
 * and called that sinking. A child watching that learns nothing, because nothing about it
 * corresponds to anything.
 *
 * Three rules hold here.
 *
 * **The model always runs.** Right or wrong, the cork rises and the stone falls. An
 * apparatus that only performs when the child predicted correctly teaches that being
 * wrong means seeing nothing, which is the exact opposite of what a laboratory is for.
 *
 * **The motion is physical, not semantic.** A model is told `rise`, `fall`, `travel`,
 * `wilt` — never "correct". That keeps the drawing honest and keeps the content free of
 * presentation: a new floating investigation adds a setup with `motion: "rise"` and needs
 * no code at all.
 *
 * **Reduced motion is a complete path, not a frozen one.** Every model below has a
 * resting state that shows the *outcome* — the cork already at the surface, the car
 * already at the far end — so a child who has motion switched off sees where things ended
 * up rather than a picture stuck at the beginning. That is handled in `app/kid.css`,
 * which stops the travel animation and applies the end position directly.
 *
 * Everything is one inline SVG per model, painted from the scene ramp in `app/tokens.css`.
 * No images, no emoji, no icon library.
 */

export function LabApparatus({
  model,
  art,
  phase,
  motion,
  /** A second object, where the station is comparing two things side by side. */
  label,
}: {
  model: LabModel;
  art: LabObjectArt;
  /** `rest` before the test is run, `run` once the child has committed to a prediction. */
  phase: "rest" | "run";
  motion: LabMotion;
  /** What is in the apparatus, announced once so a screen reader gets the same scene. */
  label: string;
}) {
  const Stage = STAGES[model];
  return (
    <div className="lab-model" data-model={model} data-phase={phase} data-motion={motion}>
      <svg className="lab-model-scene" viewBox="0 0 200 130" aria-hidden="true" focusable="false">
        <Stage />
      </svg>
      <span className="lab-model-object" data-motion={motion} data-phase={phase}>
        <LabObject art={art} className="lab-object lab-object-large" />
      </span>
      {/* The picture is decorative; this sentence is the picture, for anyone not seeing
          it. It is `polite` rather than `assertive`: the child is watching, not waiting. */}
      <p className="kid-sr-only" aria-live="polite">
        {phase === "rest" ? `On the bench: ${label}.` : `In the model: ${label}.`}
      </p>
    </div>
  );
}

/* ==========================================================================
   THE STAGES
   ========================================================================== */

/** A tank of water, seen from the side. Floating, sinking, dissolving. */
function Tank() {
  return (
    <>
      <rect className="lab-glass" x="34" y="14" width="132" height="104" rx="8" />
      <path className="lab-water" d="M38 48h124v62a6 6 0 0 1-6 6H44a6 6 0 0 1-6-6Z" />
      <path className="lab-water-line" d="M38 48h124" />
      <g className="lab-water-sway">
        <path className="lab-water-glint" d="M48 56c10-6 18 6 28 0s18 6 28 0 18 6 28 0" />
      </g>
      <rect className="lab-bench" x="18" y="118" width="164" height="8" rx="4" />
    </>
  );
}

/** A slope, a floor, and a long run to the right. Friction and speed. */
function Ramp() {
  return (
    <>
      <path className="lab-timber" d="M14 30h16v6L44 100H26Z" />
      <path className="lab-timber-deep" d="M14 30h16v6l-4 12Z" />
      <rect className="lab-bench" x="14" y="100" width="172" height="10" rx="5" />
      <g className="lab-floor-marks">
        <path d="M60 116h6M80 116h6M100 116h6M120 116h6M140 116h6M160 116h6" />
      </g>
    </>
  );
}

/** A magnet at one end of a bench, and something at the other. */
function Magnet() {
  return (
    <>
      <path className="lab-magnet-body" d="M22 40h16v34a12 12 0 0 0 24 0V40h16v34a28 28 0 0 1-56 0Z" />
      <rect className="lab-magnet-pole" x="22" y="40" width="16" height="10" />
      <rect className="lab-magnet-pole" x="62" y="40" width="16" height="10" />
      <g className="lab-field">
        <path d="M84 62c14-10 26-10 40 0" />
        <path d="M84 74c16 10 30 10 46 0" />
      </g>
      <rect className="lab-bench" x="14" y="104" width="172" height="10" rx="5" />
    </>
  );
}

/** A lamp, a material in the middle, and the screen that catches the shadow. */
function Beam() {
  return (
    <>
      <path className="lab-lamp" d="M16 44h22l10-14v50l-10-14H16Z" />
      <g className="lab-beam-cone">
        <path d="M48 36 176 16v96L48 92Z" />
      </g>
      <rect className="lab-screen" x="172" y="10" width="10" height="106" rx="4" />
      <rect className="lab-shadow-patch" x="172" y="44" width="10" height="38" rx="4" />
      <rect className="lab-bench" x="10" y="116" width="180" height="8" rx="4" />
    </>
  );
}

/** A pot of soil with a seedling, and whatever the plant is being given. */
function Pot() {
  return (
    <>
      <path className="lab-pot" d="M70 84h60l-7 32a6 6 0 0 1-6 5H83a6 6 0 0 1-6-5Z" />
      <rect className="lab-soil" x="70" y="78" width="60" height="10" rx="4" />
      <g className="lab-plant-growth">
        <path className="lab-stalk" d="M100 80V46" />
        <path className="lab-foliage" d="M100 58c-14 0-22-6-23-17 14-3 22 4 23 17Z" />
        <path className="lab-foliage" d="M100 66c14 0 22-6 23-17-14-3-22 4-23 17Z" />
      </g>
      <rect className="lab-bench" x="18" y="120" width="164" height="8" rx="4" />
    </>
  );
}

/** A plate in a room, with warmth rising off it. Melting, freezing, evaporating. */
function Warmth() {
  return (
    <>
      <g className="lab-heat">
        <path d="M78 58c0-10 8-10 8-20s-8-10-8-20" />
        <path d="M100 58c0-10 8-10 8-20s-8-10-8-20" />
        <path d="M122 58c0-10 8-10 8-20s-8-10-8-20" />
      </g>
      <ellipse className="lab-plate" cx="100" cy="104" rx="60" ry="12" />
      <ellipse className="lab-plate-well" cx="100" cy="102" rx="44" ry="8" />
      <path className="lab-puddle" d="M64 104c10-6 62-6 72 0-10 6-62 6-72 0Z" />
      <rect className="lab-bench" x="18" y="114" width="164" height="8" rx="4" />
    </>
  );
}

/** Sky over a hill. Weather, day and night, seasons. */
function Sky() {
  return (
    <>
      <rect className="lab-sky-wash" x="0" y="0" width="200" height="104" rx="10" />
      <path className="lab-hill-far" d="M0 76c40-26 62 8 96-10s70 4 104-6v44H0Z" />
      <path className="lab-hill-near" d="M0 92c48-18 76 10 114-4s58 0 86-6v22H0Z" />
      <g className="lab-drift">
        <path className="lab-cloud-far" d="M28 34a9 9 0 0 1 2-17 12 12 0 0 1 22-2 9 9 0 0 1 2 19Z" />
      </g>
      <rect className="lab-bench" x="0" y="104" width="200" height="8" rx="4" />
    </>
  );
}

/** A stretched skin with grains resting on it. Sound made visible. */
function Drum() {
  return (
    <>
      <path className="lab-timber" d="M54 56h92v46a14 14 0 0 1-14 14H68a14 14 0 0 1-14-14Z" />
      <ellipse className="lab-skin" cx="100" cy="56" rx="46" ry="14" />
      <ellipse className="lab-skin-rim" cx="100" cy="56" rx="46" ry="14" />
      <g className="lab-grains">
        <circle cx="82" cy="52" r="3" />
        <circle cx="100" cy="48" r="3" />
        <circle cx="116" cy="54" r="3" />
        <circle cx="92" cy="58" r="3" />
        <circle cx="110" cy="60" r="3" />
      </g>
    </>
  );
}

/** A plain workbench, for a station whose thinking happens off the apparatus. */
function Bench() {
  return (
    <>
      <rect className="lab-bench-top" x="14" y="86" width="172" height="14" rx="7" />
      <rect className="lab-bench-leg" x="30" y="100" width="12" height="22" rx="4" />
      <rect className="lab-bench-leg" x="158" y="100" width="12" height="22" rx="4" />
      <g className="lab-floor-marks">
        <path d="M14 126h172" />
      </g>
    </>
  );
}

const STAGES: Record<LabModel, () => ReactElement> = {
  tank: Tank,
  ramp: Ramp,
  magnet: Magnet,
  beam: Beam,
  pot: Pot,
  warmth: Warmth,
  sky: Sky,
  drum: Drum,
  bench: Bench,
};
