"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type PointerEvent } from "react";
import { KidButton } from "../KidButton";
import { useKidSurface } from "../surface";
import { tierForBand } from "@/lib/science/tier";
import { paletteFor } from "@/lib/studio/palette";
import { sizesFor, toolsFor } from "@/lib/studio/studio";
import type { ArtMark } from "@/lib/workspace-content";
import type { PieceShape, StudioColour, StudioTool } from "@/lib/studio/types";
import { drawArtwork, registerStampPaths } from "@/lib/studio/canvas";
import { SHAPE_PATHS, ShapeMark } from "./shapes";

/*
 * The canvas painter needs the stamp outlines, and it must not import the child layer:
 * the gallery renders a drawing on the parent surface too. Handing the catalogue over
 * once, here, keeps one source of truth for what a star looks like.
 */
registerStampPaths(SHAPE_PATHS);
import { PaintBox } from "./PaintBox";

/**
 * The drawing board.
 *
 * The canvas underneath this is the one piece of the old studio worth keeping: it is a
 * real drawing surface with pressure-free strokes, a flood fill, undo, redo and a
 * pointer-captured live preview that does not re-render React on every move. None of
 * that is easy and none of it needed replacing.
 *
 * What changed is everything around it.
 *
 * **The stamps were emoji.** Nine of them, drawn with `ctx.fillText`, in whatever font
 * the device happened to have — so a child's picture contained Apple's butterfly on one
 * device and Google's on another, and neither was this product's artwork (§A). They are
 * now the same shape catalogue the colouring pages are built from, stamped through
 * `Path2D`, so a star in a drawing is the same star as a star on a page.
 *
 * **The tools and the paint box are banded.** A three-year-old gets four tools and eight
 * named colours; an eight-year-old gets seven and twenty-eight. Seven tools on a toolbar
 * is seven decisions before a mark is made, and the difference between a marker and a
 * crayon is not one a three-year-old is asking to make.
 *
 * **The brush size is three named sizes, not a slider.** A range input is a two-handed
 * control that needs a value read off it. "Fat", "Big", "Thin" is the same decision made
 * with one touch.
 */

const WIDTH = 1000;
const HEIGHT = 700;
/** Above this the page stops taking marks. It is generous; it exists so a save cannot fail. */
const MAX_MARKS = 600;

const TOOL_NAMES: Record<StudioTool, string> = {
  pencil: "Pencil",
  crayon: "Crayon",
  marker: "Marker",
  brush: "Brush",
  fill: "Paint pot",
  stamp: "Stamps",
  eraser: "Rubber",
};

/** The stamps offered. Drawn from the same catalogue the colouring pages use. */
const STAMPS: PieceShape[] = [
  "star", "heart", "flame", "cloudPuff", "leaf", "petal", "bubble", "spot", "crescent", "snowCrystal",
];

export function DrawingBoard({
  marks,
  onAdd,
  onUndo,
  onRedo,
  onClear,
  canUndo,
  canRedo,
  busy,
}: {
  marks: ArtMark[];
  onAdd: (mark: ArtMark) => void;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  canUndo: boolean;
  canRedo: boolean;
  busy: boolean;
}) {
  const { band } = useKidSurface();
  const tier = useMemo(() => tierForBand(band), [band]);
  const palette = useMemo(() => paletteFor(tier), [tier]);
  const tools = useMemo(() => toolsFor(tier), [tier]);
  const sizes = useMemo(() => sizesFor(tier), [tier]);

  const [tool, setTool] = useState<StudioTool>(tools[0]);
  const [colour, setColour] = useState<StudioColour>(() => palette[1] ?? palette[0]);
  const [size, setSize] = useState(sizes[0].size);
  const [stamp, setStamp] = useState<PieceShape>("star");
  const [full, setFull] = useState(false);

  const canvas = useRef<HTMLCanvasElement>(null);
  const base = useRef<HTMLCanvasElement | null>(null);
  const live = useRef<ArtMark | null>(null);
  const frame = useRef<number | null>(null);

  // The committed picture. The stroke in hand is painted over a snapshot of this, so a
  // long scribble never re-walks six hundred marks on every pointer move.
  useEffect(() => {
    if (canvas.current) drawArtwork(canvas.current, marks);
  }, [marks]);

  useEffect(() => () => {
    if (frame.current !== null) cancelAnimationFrame(frame.current);
  }, []);

  const at = useCallback((event: PointerEvent<HTMLCanvasElement>): [number, number] => {
    const box = event.currentTarget.getBoundingClientRect();
    return [
      Math.max(0, Math.min(WIDTH - 1, ((event.clientX - box.left) * WIDTH) / box.width)),
      Math.max(0, Math.min(HEIGHT - 1, ((event.clientY - box.top) * HEIGHT) / box.height)),
    ];
  }, []);

  function begin(event: PointerEvent<HTMLCanvasElement>) {
    if (busy || live.current) return;
    if (marks.length >= MAX_MARKS) {
      setFull(true);
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    const mark: ArtMark = { tool, color: colour.id, size, stamp, points: [at(event)] };
    if (tool === "fill" || tool === "stamp") {
      onAdd(mark);
      return;
    }
    base.current ??= document.createElement("canvas");
    base.current.width = event.currentTarget.width;
    base.current.height = event.currentTarget.height;
    base.current.getContext("2d")?.drawImage(event.currentTarget, 0, 0);
    live.current = mark;
  }

  function move(event: PointerEvent<HTMLCanvasElement>) {
    const mark = live.current;
    if (!mark) return;
    if (mark.points.length < 3000) mark.points.push(at(event));
    if (frame.current !== null) return;
    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      const node = canvas.current;
      const snapshot = base.current;
      if (!node || !snapshot || !live.current) return;
      drawArtwork(node, [live.current], snapshot);
    });
  }

  function end(event: PointerEvent<HTMLCanvasElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    if (live.current) {
      onAdd(live.current);
      live.current = null;
    }
  }

  return (
    <div className="studio-drawing">
      <canvas
        ref={canvas}
        className="studio-canvas"
        width={WIDTH}
        height={HEIGHT}
        role="application"
        aria-label="Drawing paper. Draw with a finger, a pen or a mouse."
        onPointerDown={begin}
        onPointerMove={move}
        onPointerUp={end}
        onPointerCancel={end}
      />

      {full && (
        <p className="studio-verdict" role="status">
          This page is full of ideas. Keep it, then start a new one.
        </p>
      )}

      <div className="studio-tools" role="group" aria-label="What to draw with">
        {tools.map((entry) => (
          <button
            key={entry}
            type="button"
            className="studio-tool"
            data-tool={entry}
            data-chosen={tool === entry ? "yes" : undefined}
            aria-pressed={tool === entry}
            disabled={busy}
            onClick={() => setTool(entry)}
          >
            <ToolMark tool={entry} />
            <span>{TOOL_NAMES[entry]}</span>
          </button>
        ))}
      </div>

      {tool === "stamp" && (
        <div className="studio-stamps" role="group" aria-label="Choose a stamp">
          {STAMPS.map((shape) => (
            <button
              key={shape}
              type="button"
              className="studio-stamp"
              data-chosen={stamp === shape ? "yes" : undefined}
              aria-pressed={stamp === shape}
              aria-label={`The ${shape.replace(/([A-Z])/g, " $1").toLowerCase()} stamp`}
              disabled={busy}
              onClick={() => setStamp(shape)}
              style={{ "--studio-fill": `var(${colour.token})` } as CSSProperties}
            >
              <ShapeMark shape={shape} className="studio-stamp-art" />
            </button>
          ))}
        </div>
      )}

      {tool !== "fill" && tool !== "stamp" && (
        <div className="studio-sizes" role="group" aria-label="How thick">
          {sizes.map((entry) => (
            <button
              key={entry.id}
              type="button"
              className="studio-size"
              data-chosen={size === entry.size ? "yes" : undefined}
              aria-pressed={size === entry.size}
              disabled={busy}
              onClick={() => setSize(entry.size)}
            >
              <span className="studio-size-dot" data-size={entry.id} aria-hidden="true" />
              <span>{entry.label}</span>
            </button>
          ))}
        </div>
      )}

      <PaintBox palette={palette} chosen={colour} onChoose={setColour} disabled={busy} />

      <div className="studio-room-actions">
        <KidButton label="Undo" tone="quiet" disabled={!canUndo || busy} onPress={onUndo} />
        <KidButton label="Redo" tone="quiet" disabled={!canRedo || busy} onPress={onRedo} />
        <KidButton label="Start again" tone="quiet" disabled={!marks.length || busy} onPress={onClear} />
      </div>
    </div>
  );
}

/**
 * A drawn mark for each tool.
 *
 * Not icons from a library: a 1.5px Lucide stroke disappears on a saturated fill, and a
 * four-year-old reads a fat crayon shape long before they read a thin outline of one.
 */
function ToolMark({ tool }: { tool: StudioTool }) {
  return (
    <svg className="studio-tool-art" viewBox="0 0 48 48" aria-hidden="true" focusable="false">
      {tool === "pencil" && (
        <>
          <path className="studio-tool-body" d="M16 8h16v26l-8 10-8-10Z" />
          <path className="studio-tool-tip" d="M16 34h16l-8 10Z" />
        </>
      )}
      {tool === "crayon" && (
        <>
          <path className="studio-tool-body" d="M14 14h20v28H14Z" />
          <path className="studio-tool-tip" d="M14 14 24 2l10 12Z" />
          <path className="studio-tool-band" d="M14 24h20v6H14Z" />
        </>
      )}
      {tool === "marker" && (
        <>
          <path className="studio-tool-body" d="M15 16h18v26H15Z" />
          <path className="studio-tool-tip" d="M18 16V6h12v10Z" />
        </>
      )}
      {tool === "brush" && (
        <>
          <path className="studio-tool-body" d="M20 4h8v22h-8Z" />
          <path className="studio-tool-band" d="M18 26h12v6H18Z" />
          <path className="studio-tool-tip" d="M18 32h12l-6 14Z" />
        </>
      )}
      {tool === "fill" && (
        <>
          <path className="studio-tool-body" d="M10 24 24 10l14 14-14 14Z" />
          <path className="studio-tool-tip" d="M38 28c4 6 6 9 6 12a6 6 0 0 1-12 0c0-3 2-6 6-12Z" />
        </>
      )}
      {tool === "stamp" && (
        <>
          <path className="studio-tool-body" d="M14 30h20v8H14Z" />
          <path className="studio-tool-band" d="M10 38h28v6H10Z" />
          <path className="studio-tool-tip" d="M24 6 28 18h12l-10 8 4 12-10-8-10 8 4-12-10-8h12Z" />
        </>
      )}
      {tool === "eraser" && (
        <>
          <path className="studio-tool-body" d="M12 28 28 12l10 10-16 16H12Z" />
          <path className="studio-tool-band" d="M12 38h26v6H12Z" />
        </>
      )}
    </svg>
  );
}
