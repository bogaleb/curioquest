"use client";

import { useEffect, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { drawArtwork } from "@/lib/studio/canvas";
import { colouringPages } from "@/lib/studio/pages";
import { workspaceCollection, workspaceRequest } from "@/lib/workspace-client";
import type { Artwork, WorkspaceItem } from "@/lib/workspace-content";
import { PagePreview } from "@/components/kid/studio/PagePreview";
import { publicPage } from "@/lib/studio/studio";

/**
 * A child's work, on the grown-up surface.
 *
 * Parent Corner used to embed the whole child studio to show a portfolio — the paint box,
 * the canvas, the tools and all — because the gallery lived inside the editor. That put a
 * child surface inside an adult one (§D7) and gave a parent a drawing application when
 * what they wanted was a list of their child's pictures and a way to delete one.
 *
 * This is that list. It reads the same artwork records the Making Place writes, renders
 * each kind as itself, and keeps the delete — which belongs here, behind the parent gate,
 * and nowhere near a four-year-old.
 */
export function ArtworkPortfolio({ profileId, name }: { profileId: string; name: string }) {
  const [items, setItems] = useState<WorkspaceItem<Artwork>[]>([]);
  const [page, setPage] = useState(0);
  const [more, setMore] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    workspaceCollection<WorkspaceItem<Artwork>>(profileId, "art", controller.signal)
      .then((found) => {
        setItems(found);
        setMore(found.length === 12);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [profileId]);

  async function loadMore() {
    setBusy(true);
    setError("");
    try {
      const found = await workspaceCollection<WorkspaceItem<Artwork>>(profileId, "art", undefined, page + 1);
      setItems((current) => [...current, ...found.filter((entry) => !current.some((one) => one.id === entry.id))]);
      setPage((current) => current + 1);
      setMore(found.length === 12);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(item: WorkspaceItem<Artwork>) {
    if (!window.confirm(`Delete “${item.data.title}”? Export your family records first to keep a copy.`)) return;
    setBusy(true);
    try {
      await workspaceRequest({ action: "delete-item", id: item.id, revision: item.revision, confirm: true });
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <p role="status">Opening {name}&rsquo;s gallery…</p>;
  if (error) return <p className="error" role="alert">{error}</p>;
  if (!items.length) {
    return <p>Nothing kept yet. Anything {name} makes in the Making Place appears here.</p>;
  }

  return (
    <>
      <div className="template-grid">
        {items.map((item) => (
          <article key={item.id}>
            <ArtworkThumb art={item.data} />
            <strong>{item.data.title}</strong>
            <small>{new Date(item.updatedAt).toLocaleDateString()}</small>
            <button className="text-button" disabled={busy} onClick={() => remove(item)}>
              <Trash2 size={16} /> Delete artwork
            </button>
          </article>
        ))}
      </div>
      {more && (
        <button className="secondary" disabled={busy} onClick={loadMore}>
          {busy ? "Opening…" : "Show more"}
        </button>
      )}
    </>
  );
}

/** Each kind of work shown as itself: a canvas, a coloured page, or the words. */
function ArtworkThumb({ art }: { art: Artwork }) {
  if (art.mode === "coloring") {
    const source = colouringPages.find((entry) => entry.id === (art.page || art.template));
    if (source) {
      return <PagePreview page={publicPage(source, "investigator")} fills={art.fills} />;
    }
  }
  if (art.mode === "writing") {
    return <p className="art-words">{art.caption || art.guide}</p>;
  }
  return <DrawingThumb art={art} />;
}

function DrawingThumb({ art }: { art: Artwork }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (canvas.current) drawArtwork(canvas.current, art.marks);
  }, [art.marks]);
  return <canvas ref={canvas} className="art-preview" width={300} height={210} role="img" aria-label={art.title} />;
}
