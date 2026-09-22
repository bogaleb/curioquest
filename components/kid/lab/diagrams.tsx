import type { ReactElement } from "react";
import type { LabDiagram } from "@/lib/science/types";

/**
 * The four diagrams a `label` station can put a child in front of.
 *
 * A diagram is not a picture with words on it. It is drawn so that the *shape* of each
 * part carries its job: roots branch because branching is how you reach water, the lungs
 * are drawn as a pair of soft sacs rather than as two labelled blobs, and the ear is
 * drawn as a funnel narrowing to a stretched skin because that is the whole mechanism.
 *
 * Each one is deliberately unlabelled. The hotspots are placed over it by
 * `LabelEngine`, and a part's name only appears once the child has found it — which is
 * what makes it a question rather than a reading exercise. A diagram that arrives with
 * "ROOTS" printed under the roots has already been answered.
 *
 * Text inside an illustration also makes localisation expensive (§WP-11.3), so there is
 * none here. Every word on these screens is HTML.
 */
export function LabDiagramArt({ diagram }: { diagram: LabDiagram }) {
  const Drawing = DIAGRAMS[diagram];
  return (
    <svg
      className="lab-diagram-art"
      viewBox="0 0 200 200"
      data-diagram={diagram}
      aria-hidden="true"
      focusable="false"
    >
      <Drawing />
    </svg>
  );
}

/** A flowering plant in a pot, cut away so the roots are visible. */
function Plant() {
  return (
    <>
      <rect className="lab-dia-ground" x="14" y="140" width="172" height="52" rx="10" />
      <g className="lab-dia-root">
        <path d="M100 142v34" />
        <path d="M100 152c-14 6-20 14-24 26M100 152c14 6 20 14 24 26" />
        <path d="M100 164c-9 5-12 12-13 20M100 164c9 5 12 12 13 20" />
      </g>
      <path className="lab-dia-stem" d="M100 142V56" />
      <path className="lab-dia-leaf" d="M100 104c-24 0-38-10-40-28 24-6 38 8 40 28Z" />
      <path className="lab-dia-leaf" d="M100 120c24 0 38-10 40-28-24-6-38 8-40 28Z" />
      <g className="lab-dia-bloom">
        <circle cx="100" cy="38" r="12" />
        <circle cx="80" cy="46" r="11" />
        <circle cx="120" cy="46" r="11" />
        <circle cx="88" cy="24" r="11" />
        <circle cx="112" cy="24" r="11" />
      </g>
      <circle className="lab-dia-bloom-core" cx="100" cy="36" r="9" />
    </>
  );
}

/**
 * A child-shaped outline with the parts inside it.
 *
 * Drawn as a simple, unsexed, unmarked silhouette: no clothes, no face, no hair. A body
 * diagram that looks like one particular child tells every other child it is not about
 * them, and this one has to work for all of them.
 */
function Body() {
  return (
    <>
      <path
        className="lab-dia-body"
        d="M100 12a17 17 0 0 1 0 34 17 17 0 0 1 0-34Zm-34 54c0-12 15-18 34-18s34 6 34 18v46c0 8-4 12-10 12v40a8 8 0 0 1-16 0v-34h-16v34a8 8 0 0 1-16 0v-40c-6 0-10-4-10-12Z"
      />
      <path className="lab-dia-brain" d="M100 16c9 0 15 6 15 13s-6 13-15 13-15-6-15-13 6-13 15-13Z" />
      <g className="lab-dia-brain-fold"><path d="M92 22c4 4 4 8 0 12M108 22c-4 4-4 8 0 12M100 20v22" /></g>
      <path className="lab-dia-heart" d="M88 72c-7-7 1-17 8-11 7-6 15 4 8 11l-8 9Z" />
      <path className="lab-dia-lung" d="M112 62c8 0 13 8 13 18s-4 16-11 16-8-6-8-14 0-20 6-20Z" />
      <path className="lab-dia-lung" d="M84 62c-8 0-13 8-13 18s4 16 11 16 8-6 8-14 0-20-6-20Z" />
      <g className="lab-dia-bone">
        <path d="M66 112h68" />
        <path d="M74 126h52" />
        <path d="M82 140h36" />
      </g>
      <g className="lab-dia-muscle">
        <path d="M128 128c8 6 10 14 8 24" />
        <path d="M72 128c-8 6-10 14-8 24" />
      </g>
    </>
  );
}

/** A pond in cross-section: reeds, warm shallows, open surface, and the mud beneath. */
function PondHabitat() {
  return (
    <>
      <rect className="lab-dia-sky" x="0" y="0" width="200" height="86" rx="10" />
      <path className="lab-dia-bank" d="M0 86c24-14 42-6 60 2h80c18-8 36-16 60-2v106H0Z" />
      <path className="lab-dia-pondwater" d="M18 92c26-8 44 2 66 0h52c22 2 34-6 46 0v52c0 10-8 18-18 18H36c-10 0-18-8-18-18Z" />
      <path className="lab-dia-surface" d="M18 96c26-8 44 2 66 0h52c22 2 34-6 46 0" />
      <path className="lab-dia-mud" d="M24 140c30 14 122 14 152 0v18c0 10-8 18-18 18H42c-10 0-18-8-18-18Z" />
      <g className="lab-dia-reed">
        <path d="M30 96V54M40 96V62M50 96V58" />
        <path d="M30 54c6-2 8 4 4 8M40 62c6-2 8 4 4 8M50 58c6-2 8 4 4 8" />
      </g>
      <g className="lab-dia-ripple">
        <path d="M108 106h44M120 116h28" />
      </g>
    </>
  );
}

/** The ear as a mechanism: a funnel, a canal, a stretched skin, and a nerve away. */
function SoundEar() {
  return (
    <>
      <path className="lab-dia-body" d="M10 60c26-24 52-24 62 0l10 40-10 40c-10 24-36 24-62 0Z" />
      <path className="lab-dia-funnel" d="M22 72c18-16 36-16 44 0l6 28-6 28c-8 16-26 16-44 0Z" />
      <path className="lab-dia-canal" d="M72 88h52v24H72Z" />
      <path className="lab-dia-canal-line" d="M72 88h52M72 112h52" />
      <ellipse className="lab-dia-drum" cx="128" cy="100" rx="6" ry="20" />
      <g className="lab-dia-drum-shake">
        <path d="M138 88c4 4 4 20 0 24M146 82c7 6 7 30 0 36" />
      </g>
      <path className="lab-dia-nerve" d="M134 112c14 8 22 16 44 18" />
      <g className="lab-dia-nerve-branch"><path d="M170 126c4 6 4 10 2 16M178 130c6 2 10 2 14 0" /></g>
    </>
  );
}

const DIAGRAMS: Record<LabDiagram, () => ReactElement> = {
  plant: Plant,
  body: Body,
  "pond-habitat": PondHabitat,
  "sound-ear": SoundEar,
};
