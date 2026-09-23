import { colourById } from "./palette";
import type { PieceShape } from "./types";
import type { ArtMark } from "@/lib/workspace-content";

/**
 * Painting a drawing onto a canvas.
 *
 * Kept out of the component for two reasons: the gallery renders a thumbnail of the same
 * artwork without a drawing surface around it, and the parent portfolio renders it on a
 * grown-up screen where none of the child layer belongs.
 *
 * ## Colour
 *
 * A mark stores a *colour id* — "sunflower", "deep sea" — not a hex. That is what lets a
 * saved picture follow the palette if the palette is ever corrected, and it is what keeps
 * raw colour out of the child layer. The id is resolved to a real value here, once per
 * draw, by asking the document what the token currently computes to.
 *
 * Artwork saved before this existed stores a `#rrggbb` string. Those are passed through
 * untouched: a family's pictures are their pictures, and migrating them to the nearest
 * named colour would quietly repaint work a child did.
 */

const cache = new Map<string, string>();

/** The painted value of a colour id, or of a legacy hex string. */
export function resolveColour(id: string, fallback = "#000000"): string {
  if (id.startsWith("#")) return id;
  const cached = cache.get(id);
  if (cached) return cached;
  const token = colourById.get(id)?.token;
  if (!token || typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(token).trim();
  const painted = value || fallback;
  cache.set(id, painted);
  return painted;
}

/** Forget the resolved values. Called when the theme or the palette changes. */
export function forgetColours() {
  cache.clear();
}

/**
 * Fill a connected region of the same colour, from one point outwards.
 *
 * Scanline-free and deliberately simple: a stack of pixel indices, a tolerance of 32 per
 * channel so an anti-aliased edge stops it, and a `seen` array so a large flat area does
 * not revisit pixels. It is fast enough for a 1000×700 page and short enough to read.
 */
function floodFill(context: CanvasRenderingContext2D, x: number, y: number, colour: string) {
  const transform = context.getTransform();
  const px = Math.floor(x * transform.a + transform.e);
  const py = Math.floor(y * transform.d + transform.f);
  const { width, height } = context.canvas;
  if (px < 0 || px >= width || py < 0 || py >= height) return;

  const image = context.getImageData(0, 0, width, height);
  const data = image.data;
  const start = (py * width + px) * 4;
  const target = [data[start], data[start + 1], data[start + 2]];
  const rgb = toRgb(colour);
  if (!rgb) return;
  if (target.every((channel, index) => Math.abs(channel - rgb[index]) < 8)) return;

  const stack = [start / 4];
  const seen = new Uint8Array(width * height);
  while (stack.length) {
    const pixel = stack.pop()!;
    if (seen[pixel]) continue;
    seen[pixel] = 1;
    const at = pixel * 4;
    if (!target.every((channel, index) => Math.abs(data[at + index] - channel) < 32)) continue;
    rgb.forEach((channel, index) => {
      data[at + index] = channel;
    });
    data[at + 3] = 255;
    const column = pixel % width;
    if (column > 0) stack.push(pixel - 1);
    if (column < width - 1) stack.push(pixel + 1);
    if (pixel >= width) stack.push(pixel - width);
    if (pixel < (height - 1) * width) stack.push(pixel + width);
  }
  context.putImageData(image, 0, 0);
}

/** A painted colour as three channels. Handles `#rgb`, `#rrggbb` and `rgb(...)`. */
function toRgb(colour: string): [number, number, number] | null {
  const value = colour.trim();
  if (value.startsWith("#")) {
    const hex = value.length === 4
      ? value.slice(1).split("").map((channel) => channel + channel).join("")
      : value.slice(1, 7);
    if (hex.length !== 6) return null;
    return [0, 2, 4].map((index) => parseInt(hex.slice(index, index + 2), 16)) as [number, number, number];
  }
  const parts = value.match(/\d+(\.\d+)?/g);
  if (!parts || parts.length < 3) return null;
  return [Number(parts[0]), Number(parts[1]), Number(parts[2])];
}

/** Path data for the stamps, injected so this module does not import the child layer. */
let stampPaths: Record<string, string> = {};
export function registerStampPaths(paths: Record<string, string>) {
  stampPaths = paths;
}

/** One mark, painted in the canvas's own 1000×700 space. */
export function drawMark(context: CanvasRenderingContext2D, mark: ArtMark) {
  const painted = mark.tool === "eraser" ? "#ffffff" : resolveColour(mark.color);
  context.save();
  context.strokeStyle = painted;
  context.fillStyle = painted;
  context.lineWidth = mark.size;
  context.lineCap = "round";
  context.lineJoin = "round";

  if (mark.tool === "fill") {
    floodFill(context, mark.points[0][0], mark.points[0][1], painted);
    context.restore();
    return;
  }

  if (mark.tool === "stamp") {
    const path = stampPaths[mark.stamp ?? "star"];
    if (path) {
      // The stamp catalogue is drawn in a 0–100 box, so it is scaled to the mark's size
      // and centred on the point the child touched.
      const scale = (mark.size * 4) / 100;
      const [x, y] = mark.points[0];
      context.translate(x, y);
      context.scale(scale, scale);
      context.translate(-50, -50);
      context.fill(new Path2D(path));
    }
    context.restore();
    return;
  }

  // Each tool is the same stroke at a different opacity, which is how a crayon and a
  // marker actually differ on paper: coverage, not shape.
  context.globalAlpha =
    mark.tool === "marker" ? 0.62 : mark.tool === "crayon" ? 0.7 : mark.tool === "brush" ? 0.86 : 1;

  if (mark.points.length === 1) {
    context.beginPath();
    context.arc(mark.points[0][0], mark.points[0][1], mark.size / 2, 0, Math.PI * 2);
    context.fill();
  } else {
    context.beginPath();
    mark.points.forEach(([x, y], index) => (index ? context.lineTo(x, y) : context.moveTo(x, y)));
    context.stroke();
  }

  // A crayon leaves paper showing through. Speckling the stroke is the cheapest honest
  // way to say "waxy" without a texture image.
  if (mark.tool === "crayon") {
    context.globalAlpha = 0.28;
    for (let index = 0; index < mark.points.length; index += 3) {
      const [x, y] = mark.points[index];
      context.clearRect(x - 1, y - 1, 1.5, 1.5);
    }
  }
  context.restore();
}

/**
 * Paint a whole drawing.
 *
 * `over` is an already-painted snapshot to draw on top of — the live-stroke path, where
 * re-walking six hundred marks on every pointer move would be the difference between a
 * smooth line and a stuttering one.
 */
export function drawArtwork(canvas: HTMLCanvasElement, marks: readonly ArtMark[], over?: HTMLCanvasElement) {
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return;
  context.setTransform(1, 0, 0, 1, 0, 0);
  if (over) {
    context.drawImage(over, 0, 0);
  } else {
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.setTransform(canvas.width / 1000, 0, 0, canvas.height / 700, 0, 0);
  for (const mark of marks) drawMark(context, mark);
  context.setTransform(1, 0, 0, 1, 0, 0);
}

/** The stamps a drawing may use. Exported so the tests can check the catalogue covers them. */
export const STAMP_SHAPES: PieceShape[] = [
  "star", "heart", "flame", "cloudPuff", "leaf", "petal", "bubble", "spot", "crescent", "snowCrystal",
];
