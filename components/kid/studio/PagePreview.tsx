"use client";

import { colourById } from "@/lib/studio/palette";
import type { PageFills, PublicPage } from "@/lib/studio/types";
import { PiecePath } from "./shapes";

/**
 * A small, still version of a colouring page.
 *
 * The same renderer the book uses, so a thumbnail is never a second drawing that could
 * drift from the page. That is not tidiness: a child has to recognise their own work on
 * the shelf, and a thumbnail that is almost-but-not-quite the picture they coloured is
 * worse than no thumbnail at all.
 */
export function PagePreview({ page, fills }: { page: PublicPage; fills?: PageFills }) {
  return (
    <svg className="studio-preview" viewBox="0 0 200 200" aria-hidden="true" focusable="false">
      {page.pieces.map((piece) => (
        <PiecePath key={piece.id} piece={piece} fill={tokenFor(fills?.[piece.id] ?? piece.tone)} />
      ))}
    </svg>
  );
}

/** The CSS token a colour id paints with. Falls back to paper for anything unknown. */
export function tokenFor(colourId: string | undefined): string {
  return colourById.get(colourId ?? "")?.token ?? "--kid-surface";
}
