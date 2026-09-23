"use client";

import { useEffect, useRef } from "react";
import { drawArtwork } from "@/lib/studio/canvas";
import type { Artwork, WorkspaceItem } from "@/lib/workspace-content";
import type { PublicPage } from "@/lib/studio/types";
import { PagePreview } from "./PagePreview";

/**
 * Everything a child has kept.
 *
 * Three kinds of work in one shelf, because that is what "the things I made" means to
 * the child who made them and to the grown-up they show it to. Splitting drawings from
 * colouring from writing would be a filing decision imposed on somebody who does not
 * file.
 *
 * Each kind is shown as itself: a drawing is its canvas, a coloured page is the page with
 * the child's colours in it, and a piece of writing is the words, large, in the reading
 * face — because the words *are* the artwork and a thumbnail of a text box is nothing.
 *
 * Read-only on purpose. Deleting a child's work is a grown-up action behind the parent
 * gate; a delete button next to a four-year-old's only picture is a trap, not a feature.
 */
export function GalleryShelf({
  items,
  pages,
}: {
  items: WorkspaceItem<Artwork>[];
  /** The pages this child is offered, so a coloured one can be redrawn from its id. */
  pages: PublicPage[];
}) {
  if (!items.length) {
    return (
      <p className="studio-note">
        Nothing here yet. Colour something or draw something, then press <strong>Keep it</strong>.
      </p>
    );
  }

  return (
    <ul className="studio-keeps">
      {items.map((item) => {
        const page = item.data.mode === "coloring"
          ? pages.find((entry) => entry.id === (item.data.page || item.data.template))
          : undefined;
        return (
          <li key={item.id}>
            <article className="studio-keep">
              <div className="studio-keep-art">
                {item.data.mode === "coloring" && page && (
                  <PagePreview page={page} fills={item.data.fills} />
                )}
                {item.data.mode === "drawing" && <DrawingThumb marks={item.data.marks} />}
                {item.data.mode === "writing" && (
                  <p className="studio-keep-words">{item.data.caption || item.data.guide}</p>
                )}
                {item.data.mode === "coloring" && !page && (
                  <p className="studio-keep-words">{item.data.title}</p>
                )}
              </div>
              <h3>{item.data.title}</h3>
            </article>
          </li>
        );
      })}
    </ul>
  );
}

/** A drawing, painted small. The same painter the board uses, so it cannot disagree. */
function DrawingThumb({ marks }: { marks: Artwork["marks"] }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvas.current) drawArtwork(canvas.current, marks);
  }, [marks]);
  return <canvas ref={canvas} className="studio-keep-canvas" width={500} height={350} aria-hidden="true" />;
}
