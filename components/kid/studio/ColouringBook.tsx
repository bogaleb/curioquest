"use client";

import { useCallback, useMemo, useState, type CSSProperties, type PointerEvent } from "react";
import { KidButton } from "../KidButton";
import { useKidSurface } from "../surface";
import { colourById, paletteFor } from "@/lib/studio/palette";
import { tierForBand } from "@/lib/science/tier";
import type { PageFills, Piece, PublicPage, StudioColour } from "@/lib/studio/types";
import { PiecePath } from "./shapes";
import { PaintBox } from "./PaintBox";

/**
 * The colouring book.
 *
 * The thing it replaces could not colour anything in. Its pages were canvas outlines, so
 * "colouring" meant dragging a brush and trying to stay inside a line — a fine motor
 * exercise that a three-year-old cannot do and an eight-year-old finds tedious, and the
 * exact task a real colouring book removes by printing the lines in the first place.
 *
 * Here every part of the picture is its own region. Touch the cat's ear and the ear
 * fills, named out loud, with the colour the child chose. That is the whole interaction,
 * and it is the right one at every age in the band.
 *
 * ## Two ways in, both complete
 *
 * Touching the picture is the way nearly every child will do it. But an SVG region is not
 * a control a keyboard can reach and not a thing a screen reader can describe, so there
 * is a second, equal path: a row of named parts — "an ear", "the tail", "the fluffy tail"
 * — each a real button that fills the same region. It is not a fallback bolted on. It is
 * also how a grown-up sitting alongside says *colour the tail next*, and it turns a
 * colouring page into a vocabulary walk.
 *
 * ## What it does not do
 *
 * No score, no stars, no timer, no "you missed a bit". A page is finished when the child
 * says it is. The only thing the product notices is that every region has a colour, and
 * all that earns is Nova saying so.
 */
export function ColouringBook({
  page,
  fills,
  onFill,
  onUndo,
  onSurprise,
  busy,
  canUndo,
}: {
  page: PublicPage;
  fills: PageFills;
  onFill: (pieceId: string, colourId: string, name: string) => void;
  onUndo: () => void;
  onSurprise: () => void;
  busy: boolean;
  canUndo: boolean;
}) {
  const { band } = useKidSurface();
  const tier = useTier();
  const palette = useMemo(() => paletteFor(tier), [tier]);
  const [chosen, setChosen] = useState<StudioColour>(() => palette[1] ?? palette[0]);
  const [lastFilled, setLastFilled] = useState("");

  const regions = page.pieces.filter((piece) => !piece.detail);
  const done = regions.filter((piece) => fills[piece.id]).length;

  const fill = useCallback(
    (piece: Piece) => {
      if (busy) return;
      setLastFilled(piece.id);
      onFill(piece.id, chosen.id, piece.name);
    },
    [busy, chosen.id, onFill],
  );

  /**
   * Which region was touched.
   *
   * Read off the path under the pointer rather than hit-tested by hand, because the
   * browser already knows and its answer is the correct one for an arbitrary shape.
   * A tap on a detail line — a whisker, a pupil — carries the id of the region
   * underneath it, so aiming at a face never does nothing.
   */
  function touch(event: PointerEvent<SVGSVGElement>) {
    const target = event.target as SVGElement;
    const id = target.dataset?.fills || target.dataset?.piece;
    const piece = id ? page.pieces.find((entry) => entry.id === id) : null;
    if (piece) fill(piece);
  }

  return (
    <div className="studio-colouring" data-band={band}>
      <div className="studio-page-frame">
        <svg
          className="studio-page"
          viewBox="0 0 200 200"
          role="img"
          aria-label={`${page.childTitle}. ${done} of ${regions.length} parts coloured.`}
          onPointerDown={touch}
        >
          {page.pieces.map((piece) => {
            const colour = colourById.get(fills[piece.id] ?? piece.tone) ?? colourById.get("paper")!;
            return (
              <PiecePath
                key={piece.id}
                piece={piece}
                fill={colour.token}
                interactive
                justFilled={lastFilled === piece.id}
                fallback={piece.detail ? nearestRegion(page, piece) : undefined}
              />
            );
          })}
        </svg>

        {/* The picture is decorative to assistive technology; this is the picture. */}
        <p className="kid-sr-only" aria-live="polite">
          {lastFilled
            ? `${page.pieces.find((piece) => piece.id === lastFilled)?.name} is now ${chosen.name.toLowerCase()}.`
            : page.invitation}
        </p>
      </div>

      <PaintBox palette={palette} chosen={chosen} onChoose={setChosen} disabled={busy} />

      <div className="studio-parts">
        <h3>Parts to colour</h3>
        <ul>
          {regions.map((piece) => (
            <li key={piece.id}>
              <button
                type="button"
                className="studio-part"
                data-done={fills[piece.id] ? "yes" : undefined}
                disabled={busy}
                onClick={() => fill(piece)}
              >
                <span
                  className="studio-part-swatch"
                  style={
                    {
                      "--studio-fill": `var(${(colourById.get(fills[piece.id] ?? piece.tone) ?? palette[0]).token})`,
                    } as CSSProperties
                  }
                  aria-hidden="true"
                />
                <span>{piece.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="studio-room-actions">
        <KidButton label="Undo" tone="quiet" disabled={!canUndo || busy} onPress={onUndo} />
        <KidButton label="Surprise me" tone="sun" disabled={busy} onPress={onSurprise} />
      </div>
    </div>
  );
}

/**
 * The region a detail line sits on top of: the nearest fillable piece by centre.
 *
 * Crude on purpose. It only has to be right enough that tapping a whisker colours the
 * cheek rather than nothing, and "nearest by centre" is right for every page here.
 */
function nearestRegion(page: PublicPage, detail: Piece): string | undefined {
  let best: string | undefined;
  let bestGap = Infinity;
  for (const piece of page.pieces) {
    if (piece.detail) continue;
    const gap = Math.hypot(piece.x - detail.x, piece.y - detail.y);
    if (gap < bestGap) {
      bestGap = gap;
      best = piece.id;
    }
  }
  return best;
}

/** The tier this surface is written for, from the band the scene resolved. */
function useTier() {
  const { band } = useKidSurface();
  return useMemo(() => tierForBand(band), [band]);
}
