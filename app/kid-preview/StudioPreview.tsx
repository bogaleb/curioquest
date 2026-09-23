"use client";

import { useMemo, useState } from "react";
import { KidSurfaceProvider } from "@/components/kid";
import { ColouringBook } from "@/components/kid/studio/ColouringBook";
import { DrawingBoard } from "@/components/kid/studio/DrawingBoard";
import { PagePreview } from "@/components/kid/studio/PagePreview";
import { ShapeMark } from "@/components/kid/studio/shapes";
import { WritingDesk } from "@/components/kid/studio/WritingDesk";
import {
  checkTrace,
  groupsForTier,
  publicPages,
  toolsFor,
  traceAdvice,
} from "@/lib/studio/studio";
import { labTiers } from "@/lib/science/types";
import type { LearningBandId } from "@/lib/learning-bands";
import type { PageFills, StrokePoint, StudioTier } from "@/lib/studio/types";
import type { ArtMark } from "@/lib/workspace-content";

/**
 * Every room of the Making Place, on one page, in development only.
 *
 * Same reason as the lab's preview: the studio's own screens need a signed-in family and
 * a live Supabase, which makes the thing that most needs looking at — twenty-four
 * colouring pages, sixty-eight letters, a canvas and three paint boxes — the hardest
 * thing in the product to actually see.
 *
 * It judges a trace in the browser by calling `checkTrace` directly. That is allowed here
 * and nowhere else: this route 404s in production (see `page.tsx`), carries no child data
 * and writes no events. `MakingPlace` always asks the server.
 */
export function StudioPreview({ band }: { band: LearningBandId }) {
  const [tier, setTier] = useState<StudioTier>("investigator");
  const [room, setRoom] = useState<"colour" | "draw" | "write" | "shelf">("colour");
  const [pageIndex, setPageIndex] = useState(0);
  const [fills, setFills] = useState<PageFills>({});
  const [history, setHistory] = useState<PageFills[]>([]);
  const [marks, setMarks] = useState<ArtMark[]>([]);
  const [setIndex, setSetIndex] = useState(1);
  const [charIndex, setCharIndex] = useState(0);
  const [strokeIndex, setStrokeIndex] = useState(0);
  const [verdict, setVerdict] = useState<{ ok: boolean; advice: string; strokeIndex: number } | null>(null);

  const pages = useMemo(() => publicPages(tier), [tier]);
  const sets = useMemo(() => groupsForTier(tier), [tier]);
  const page = pages[Math.min(pageIndex, pages.length - 1)];
  const set = sets[Math.min(setIndex, sets.length - 1)];
  const character = set.characters[Math.min(charIndex, set.characters.length - 1)];

  function trace(points: StrokePoint[]) {
    const stroke = character.strokes[Math.min(strokeIndex, character.strokes.length - 1)];
    const result = checkTrace(stroke, points, tier);
    setVerdict({ ok: result.ok, advice: traceAdvice(result, stroke), strokeIndex });
    if (result.ok && strokeIndex < character.strokes.length - 1) {
      window.setTimeout(() => {
        setVerdict(null);
        setStrokeIndex((current) => current + 1);
      }, 700);
    }
  }

  return (
    <KidSurfaceProvider value={{ band, narration: false, world: "workshop" }}>
      <div className="preview-page" data-band={band} data-kid-world="workshop">
        <header className="preview-bar">
          <label>
            Tier
            <select
              value={tier}
              onChange={(event) => {
                setTier(event.target.value as StudioTier);
                setFills({});
                setStrokeIndex(0);
                setVerdict(null);
              }}
            >
              {labTiers.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <label>
            Room
            <select value={room} onChange={(event) => setRoom(event.target.value as typeof room)}>
              <option value="colour">colouring</option>
              <option value="shelf">the shelf</option>
              <option value="draw">drawing</option>
              <option value="write">writing</option>
            </select>
          </label>
          {room === "colour" && (
            <label>
              Page
              <select
                value={page.id}
                onChange={(event) => {
                  setPageIndex(pages.findIndex((entry) => entry.id === event.target.value));
                  setFills({});
                  setHistory([]);
                }}
              >
                {pages.map((entry) => (
                  <option key={entry.id} value={entry.id}>{entry.id}</option>
                ))}
              </select>
            </label>
          )}
          {room === "write" && (
            <>
              <label>
                Set
                <select value={set.id} onChange={(event) => { setSetIndex(sets.findIndex((entry) => entry.id === event.target.value)); setCharIndex(0); setStrokeIndex(0); setVerdict(null); }}>
                  {sets.map((entry) => (
                    <option key={entry.id} value={entry.id}>{entry.id}</option>
                  ))}
                </select>
              </label>
              <label>
                Letter
                <select value={character.key} onChange={(event) => { setCharIndex(set.characters.findIndex((entry) => entry.key === event.target.value)); setStrokeIndex(0); setVerdict(null); }}>
                  {set.characters.map((entry) => (
                    <option key={entry.key} value={entry.key}>{entry.key}</option>
                  ))}
                </select>
              </label>
            </>
          )}
          <span>{`${pages.length} pages · ${toolsFor(tier).length} tools`}</span>
        </header>

        <section className="studio-room">
          {room === "shelf" && (
            <ul className="studio-shelf">
              {pages.map((entry) => (
                <li key={entry.id}>
                  <button type="button" className="studio-page-card" onClick={() => { setPageIndex(pages.indexOf(entry)); setRoom("colour"); }}>
                    <PagePreview page={entry} />
                    <span className="studio-page-name">{entry.childTitle}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          {room === "colour" && (
            <>
              <h1>{page.childTitle}</h1>
              <ColouringBook
                page={page}
                fills={fills}
                busy={false}
                canUndo={history.length > 0}
                onFill={(pieceId, colourId) => {
                  setHistory((past) => [...past.slice(-30), fills]);
                  setFills((current) => ({ ...current, [pieceId]: colourId }));
                }}
                onUndo={() => {
                  setFills(history.at(-1) ?? {});
                  setHistory((past) => past.slice(0, -1));
                }}
                onSurprise={() => setFills({})}
              />
            </>
          )}

          {room === "draw" && (
            <DrawingBoard
              marks={marks}
              busy={false}
              canUndo={marks.length > 0}
              canRedo={false}
              onAdd={(mark) => setMarks((current) => [...current, mark])}
              onUndo={() => setMarks((current) => current.slice(0, -1))}
              onRedo={() => {}}
              onClear={() => setMarks([])}
            />
          )}

          {room === "write" && (
            <WritingDesk
              key={`${character.key}:${strokeIndex}`}
              note={set.note[tier]}
              character={character}
              strokeIndex={strokeIndex}
              verdict={verdict}
              busy={false}
              onTrace={trace}
              onSkip={() => { setStrokeIndex(0); setVerdict(null); setCharIndex((current) => (current + 1) % set.characters.length); }}
            />
          )}
        </section>

        <p className="studio-note">
          <ShapeMark shape="star" className="studio-mark" /> Development preview. Traces are judged in the
          browser here; the real studio always asks the server.
        </p>
      </div>
    </KidSurfaceProvider>
  );
}
