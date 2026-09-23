import type { CSSProperties, SVGProps } from "react";
import type { Piece, PieceShape } from "@/lib/studio/types";

/**
 * The shape catalogue.
 *
 * Every shape a colouring page can be built from, drawn once in a 0–100 box and placed
 * by the piece that names it. Fifty-two of them cover twenty-four pages and the drawing
 * room's stamps, which is the argument for a grammar rather than fifty-two illustrations:
 * an ear is an ear whether it is on a cat or a rabbit, and a page is a list of parts
 * rather than a picture somebody drew by hand in canvas calls.
 *
 * Two kinds:
 *
 *   **filled** — a closed region. This is what a child taps and colours.
 *   **stroked** — a line drawn on top and never filled: a mouth, a whisker, a wave, the
 *     spokes of a snowflake. Marked `detail` by the piece that uses them.
 *
 * Nothing here names a colour. The piece supplies a tone, the tone resolves to a token in
 * `app/tokens.css`, and the region is painted from a CSS custom property — which is also
 * what lets a fill animate when a child taps it.
 */

/** Shapes drawn as an open line rather than a closed region. */
export const STROKE_SHAPES: PieceShape[] = ["mouth", "whisker", "wave", "snowCrystal", "grass"];

const CIRCLE = "M50 3A47 47 0 1 1 49.9 3Z";

/** Path data for every shape, in a 0–100 box, drawn facing right and upright. */
export const SHAPE_PATHS: Record<PieceShape, string> = {
  /* ---- bodies and blobs --------------------------------------------------- */
  circle: CIRCLE,
  oval: CIRCLE,
  blob: "M50 4c26 0 46 14 46 36 0 26-18 56-46 56S4 66 4 40C4 18 24 4 50 4Z",
  egg: "M50 3c22 0 40 22 40 50S74 97 50 97 10 81 10 53 28 3 50 3Z",
  pear: "M50 4c16 0 26 12 26 26 0 10-4 16-4 24 0 18 12 24 12 34 0 6-14 9-34 9s-34-3-34-9c0-10 12-16 12-34 0-8-4-14-4-24C24 16 34 4 50 4Z",
  teardrop: "M50 2c14 22 32 40 32 58a32 32 0 1 1-64 0C18 42 36 24 50 2Z",

  /* ---- geometry ------------------------------------------------------------ */
  square: "M4 4H96V96H4Z",
  rounded: "M18 4h64a14 14 0 0 1 14 14v64a14 14 0 0 1-14 14H18A14 14 0 0 1 4 82V18A14 14 0 0 1 18 4Z",
  triangle: "M50 3 96 95H4Z",
  diamond: "M50 3 97 50 50 97 3 50Z",
  arch: "M2 97V50a48 48 0 0 1 96 0v47Z",
  stripe: "M10 34h80a16 16 0 0 1 0 32H10a16 16 0 0 1 0-32Z",
  crescent: "M78 8a48 48 0 1 0 0 84 40 40 0 1 1 0-84Z",

  /* ---- growing things ------------------------------------------------------ */
  petal: "M50 2c22 16 34 34 34 52 0 24-15 44-34 44S16 78 16 54C16 36 28 18 50 2Z",
  leaf: "M4 50C4 24 28 6 96 4 94 72 70 96 4 50Z",
  stem: "M40 2h20v96H40Z",
  trunk: "M34 2h32l10 96H24Z",
  bush: "M26 96a24 24 0 0 1-6-46 22 22 0 0 1 20-26 26 26 0 0 1 24-14 26 26 0 0 1 24 16 24 24 0 0 1 6 44 22 22 0 0 1-14 26Z",
  grass: "M8 96c6-22 10-30 14-44M30 96c4-26 8-36 12-52M52 96c3-24 8-34 12-48M74 96c4-22 8-30 12-40",

  /* ---- creature parts ------------------------------------------------------ */
  ear: "M50 2 92 92C72 98 28 98 8 92Z",
  earRound: "M50 4c26 0 44 20 44 46S76 96 50 96 6 76 6 50 24 4 50 4Z",
  eye: CIRCLE,
  pupil: CIRCLE,
  beak: "M96 12 4 50l92 38-14-38Z",
  nose: "M50 8c26 0 44 16 44 34S74 92 50 92 6 60 6 42 24 8 50 8Z",
  mouth: "M8 20q42 62 84 0",
  wing: "M4 52C4 20 30 4 96 6 90 66 62 96 10 88Z",
  fin: "M4 94C10 40 40 8 96 4 78 44 52 76 4 94Z",
  tail: "M4 74C24 62 56 36 96 4c-6 44-32 76-92 92Z",
  tailCurl: "M6 96C0 62 10 26 40 10c30-16 58 6 56 34-2 24-22 36-38 30-14-5-18-22-8-30 8-6 18-2 18 6 0 6-6 9-10 6 6 8 18 6 22-4 5-13-4-26-18-26-20 0-32 18-32 40 0 12 4 24 10 30Z",
  paw: "M50 10c24 0 42 18 42 40s-18 40-42 40S8 72 8 50 26 10 50 10Z",
  horn: "M50 2c14 30 26 58 26 94H24C24 60 36 32 50 2Z",
  spot: CIRCLE,
  shell: "M50 4c30 0 46 22 46 48 0 24-16 44-46 44S4 76 4 52C4 26 20 4 50 4Z",
  spike: "M50 2 88 96H12Z",
  whisker: "M96 14 4 34M96 50H4M96 86 4 66",

  /* ---- built things -------------------------------------------------------- */
  roof: "M50 4 98 62 96 78H4L2 62Z",
  window: "M10 8h80a8 8 0 0 1 8 8v68a8 8 0 0 1-8 8H10a8 8 0 0 1-8-8V16a8 8 0 0 1 8-8Z",
  door: "M50 2c22 0 34 16 34 36v60H16V38C16 18 28 2 50 2Z",
  wheel: CIRCLE,
  flag: "M4 4h92L66 32l30 28H4Z",
  chimney: "M14 18h72v80H14Z M4 4h92v18H4Z",
  sail: "M10 96 84 4c14 38 12 66 4 92Z",
  cloudPuff: "M24 94a22 22 0 0 1-4-43 20 20 0 0 1 18-25 24 24 0 0 1 22-12 24 24 0 0 1 22 14 22 22 0 0 1 2 42 20 20 0 0 1-14 24Z",

  /* ---- sky and water -------------------------------------------------------- */
  star: "M50 2 62 36 98 38 70 60 80 96 50 76 20 96 30 60 2 38 38 36Z",
  heart: "M50 96C14 66 4 48 4 32A26 26 0 0 1 50 14 26 26 0 0 1 96 32c0 16-10 34-46 64Z",
  sun: "M50 4a46 46 0 1 1-.1 0Z",
  ray: "M50 2 76 96H24Z",
  wave: "M2 62q24-34 48 0t48 0",
  bubble: CIRCLE,
  flame: "M50 2c6 26 30 32 30 56a30 30 0 0 1-60 0C20 40 34 34 50 2Z",
  snowCrystal: "M50 4v92M10 27l80 46M90 27 10 73M50 14l-12 12M50 14l12 12M50 86l-12-12M50 86l12-12",
};

/**
 * One shape, placed.
 *
 * The transform is applied here rather than in every page so the shape data stays a
 * plain box: a piece says where it is and how big, and mirroring is a scale rather than a
 * second drawing.
 */
export function ShapePath({
  shape,
  x,
  y,
  w,
  h,
  rot = 0,
  flip = false,
  className,
  style,
  ...rest
}: {
  shape: PieceShape;
  x: number;
  y: number;
  w: number;
  h: number;
  rot?: number;
  flip?: boolean;
  className?: string;
  style?: CSSProperties;
} & SVGProps<SVGPathElement>) {
  const transform = [
    `translate(${x} ${y})`,
    rot ? `rotate(${rot})` : "",
    `scale(${(flip ? -w : w) / 100} ${h / 100})`,
    `translate(-50 -50)`,
  ]
    .filter(Boolean)
    .join(" ");

  return <path d={SHAPE_PATHS[shape]} transform={transform} className={className} style={style} {...rest} />;
}

/**
 * One piece of a colouring page, placed and painted.
 *
 * Shared by the book, the shelf preview and the gallery so that a picture a child
 * coloured looks the same at every size it is shown at — which is not a detail: a
 * thumbnail that differs from the page is a thumbnail a child does not recognise as
 * their own work.
 */
export function PiecePath({
  piece,
  fill,
  interactive = false,
  justFilled = false,
  fallback,
}: {
  piece: Piece;
  /** The token to paint with, e.g. `--kid-sun-300`. Falls back to the piece's own tone. */
  fill?: string;
  /** True in the book, where a region can be touched. False in a preview. */
  interactive?: boolean;
  justFilled?: boolean;
  /** Which region a detail line belongs to, so a tap on a whisker fills the cheek. */
  fallback?: string;
}) {
  const stroked = STROKE_SHAPES.includes(piece.shape);
  const transform = [
    `translate(${piece.x} ${piece.y})`,
    piece.rot ? `rotate(${piece.rot})` : "",
    `scale(${(piece.flip ? -piece.w : piece.w) / 100} ${piece.h / 100})`,
    "translate(-50 -50)",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <path
      d={SHAPE_PATHS[piece.shape]}
      transform={transform}
      className="studio-region"
      data-piece={interactive && !piece.detail ? piece.id : undefined}
      data-fills={interactive && piece.detail ? fallback : undefined}
      data-stroked={stroked || undefined}
      data-detail={piece.detail || undefined}
      data-just-filled={justFilled || undefined}
      style={{ "--studio-fill": `var(${fill ?? ""})` } as CSSProperties}
    />
  );
}

/**
 * A shape on its own, sized to fit a box — for a prompt card, a stamp button, or a
 * writing task's little picture.
 */
export function ShapeMark({ shape, className = "studio-mark" }: { shape: PieceShape; className?: string }) {
  const stroked = STROKE_SHAPES.includes(shape);
  return (
    <svg
      className={className}
      viewBox="0 0 100 100"
      data-shape={shape}
      data-stroked={stroked || undefined}
      aria-hidden="true"
      focusable="false"
    >
      <path d={SHAPE_PATHS[shape]} />
    </svg>
  );
}
