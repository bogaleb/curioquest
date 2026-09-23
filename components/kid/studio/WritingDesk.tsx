"use client";

import { useCallback, useEffect, useRef, useState, type PointerEvent } from "react";
import { KidButton } from "../KidButton";
import { useKidSurface } from "../surface";
import { speak, stopReading } from "@/lib/speech";
import { writingLines } from "@/lib/studio/writing";
import type { StrokePoint, WritingCharacter } from "@/lib/studio/types";

/**
 * The writing desk.
 *
 * What it replaces was a dotted capital letter with a disclaimer under it. This teaches
 * letter *formation*, which is a different thing from letter shape and the thing that
 * does not fix itself later: a child who forms `b` from the bottom up produces a `b` that
 * looks right on the page and cannot be written at speed.
 *
 * Four things make it a teaching surface rather than a drawing surface with a letter
 * printed underneath:
 *
 * **The four lines are drawn.** Ascender, midline, baseline, descender. A dotted letter
 * floating in space cannot teach a child that `h` is tall and `n` is not, which is most
 * of what makes handwriting legible.
 *
 * **Every stroke has a cue, and the cue is spoken.** "Round like a ball, then straight
 * down." That sentence is the teaching. It is what a grown-up repeats at the table and
 * what a child says under their breath a year later.
 *
 * **You can watch it made.** A pen travels the stroke at writing speed, from the green
 * dot, in the right direction. Reduced motion draws it complete instead of animating,
 * because the information is the path, not the movement.
 *
 * **The trace is checked, and checked for the right three things** — did you start in the
 * right place, did you go the right way, did you stay near the line. Never neatness. The
 * check happens on the server (`/api/making`), which also records the attempt, so the
 * desk contributes to the same learning record as everything else (§A).
 */

const { ascender, midline, baseline, descender } = writingLines;

export type TraceVerdict = { ok: boolean; advice: string; strokeIndex: number };

export function WritingDesk({
  note,
  character,
  strokeIndex,
  verdict,
  busy,
  onTrace,
  onSkip,
}: {
  /** The set's own line, already resolved to this child's tier. */
  note: string;
  character: WritingCharacter;
  /** Which stroke the child is on. Strokes are done in order; that is the point. */
  strokeIndex: number;
  verdict: TraceVerdict | null;
  busy: boolean;
  /** Sends the drawn path, in the letter's own 100×100 box, to be judged. */
  onTrace: (points: StrokePoint[]) => void;
  onSkip: () => void;
}) {
  const { narration } = useKidSurface();
  const stroke = character.strokes[Math.min(strokeIndex, character.strokes.length - 1)];
  const surface = useRef<SVGSVGElement>(null);
  const drawing = useRef<StrokePoint[]>([]);
  const [live, setLive] = useState<StrokePoint[]>([]);
  const [playing, setPlaying] = useState(false);
  const [penAt, setPenAt] = useState(0);

  // The cue is spoken when the stroke changes, not on every render, and it stops the
  // moment the child moves on — two voices at once is worse than none.
  useEffect(() => {
    if (narration) speak(stroke.cue);
    return () => stopReading();
  }, [narration, stroke.cue]);

  /** Watch it made. A timer rather than a CSS animation, because the pen has to stop. */
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const started = performance.now();
    const step = (now: number) => {
      const index = Math.floor((now - started) / 34);
      setPenAt(Math.min(index, stroke.points.length - 1));
      if (index < stroke.points.length - 1) raf = requestAnimationFrame(step);
      else setPlaying(false);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, stroke.points.length]);

  /** Pointer position in the letter's own box, so the checker never sees a pixel. */
  const at = useCallback((event: PointerEvent<SVGSVGElement>): StrokePoint => {
    const box = surface.current!.getBoundingClientRect();
    return [
      Math.round(((event.clientX - box.left) / box.width) * 100 * 10) / 10,
      Math.round(((event.clientY - box.top) / box.height) * 100 * 10) / 10,
    ];
  }, []);

  function begin(event: PointerEvent<SVGSVGElement>) {
    if (busy) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drawing.current = [at(event)];
    setLive(drawing.current);
  }

  function move(event: PointerEvent<SVGSVGElement>) {
    if (!drawing.current.length || busy) return;
    if (drawing.current.length < 400) drawing.current.push(at(event));
    setLive([...drawing.current]);
  }

  function finish(event: PointerEvent<SVGSVGElement>) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    const points = drawing.current;
    drawing.current = [];
    // One point is a legitimate answer: the dot on an i is a tap, and the checker knows
    // the difference between a dot-shaped target and a stroke-shaped one.
    if (points.length) onTrace(points);
  }

  const start = stroke.points[0];
  const pen = stroke.points[Math.min(penAt, stroke.points.length - 1)];

  return (
    <div className="studio-desk">
      <div className="studio-desk-head">
        <p className="studio-letter-name">{character.spoken}</p>
        <p className="studio-cue" aria-live="polite">{stroke.cue}</p>
        <p className="studio-stroke-count">
          {character.strokes.length > 1
            ? `Stroke ${Math.min(strokeIndex + 1, character.strokes.length)} of ${character.strokes.length}`
            : "One stroke."}
        </p>
      </div>

      <svg
        ref={surface}
        className="studio-paper"
        viewBox="0 0 100 100"
        data-playing={playing || undefined}
        data-verdict={verdict ? (verdict.ok ? "yes" : "not-yet") : undefined}
        role="application"
        aria-label={`Write ${character.spoken}. ${stroke.cue}`}
        onPointerDown={begin}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
      >
        {/* The four lines a writing book prints. The baseline is the solid one. */}
        <line className="studio-rule" x1="2" y1={ascender} x2="98" y2={ascender} />
        <line className="studio-rule" data-middle="yes" x1="2" y1={midline} x2="98" y2={midline} />
        <line className="studio-rule" data-base="yes" x1="2" y1={baseline} x2="98" y2={baseline} />
        <line className="studio-rule" x1="2" y1={descender} x2="98" y2={descender} />

        {/* Strokes already done stay on the page, solid. The one in hand is dotted. */}
        {character.strokes.slice(0, strokeIndex).map((done, index) => (
          <polyline key={index} className="studio-done-stroke" points={done.points.map((p) => p.join(",")).join(" ")} />
        ))}
        <polyline className="studio-trail" points={stroke.points.map((p) => p.join(",")).join(" ")} />

        {penAt > 0 && (
          <polyline
            className="studio-pen-trail"
            points={stroke.points.slice(0, penAt + 1).map((p) => p.join(",")).join(" ")}
          />
        )}

        {/* Where this stroke begins. Green, and it is the only green thing on the page. */}
        <circle className="studio-start" cx={start[0]} cy={start[1]} r="4.4" />
        <text className="studio-start-number" x={start[0]} y={start[1] + 1.6} fontSize="5">
          {strokeIndex + 1}
        </text>
        {playing && <circle className="studio-pen" cx={pen[0]} cy={pen[1]} r="3.4" />}

        {live.length > 1 && (
          <polyline className="studio-ink" points={live.map((p) => p.join(",")).join(" ")} />
        )}
      </svg>

      {verdict && (
        <p className="studio-verdict" data-ok={verdict.ok || undefined} role="status">
          {verdict.advice}
        </p>
      )}

      <div className="studio-room-actions">
        <KidButton
          label={playing ? "Watching…" : "Watch it made"}
          tone="world"
          disabled={busy || playing}
          onPress={() => {
            // Reduced motion gets the finished stroke rather than a compressed one: the
            // information here is the path and its direction, not the movement, and a
            // pen crossing the page in a millisecond communicates neither (§C6).
            if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
              setPenAt(stroke.points.length - 1);
              return;
            }
            setPenAt(0);
            setPlaying(true);
          }}
        />
        <KidButton
          label="Say it again"
          tone="quiet"
          disabled={busy}
          onPress={() => speak(`${character.spoken}. ${stroke.cue}`)}
        />
        <KidButton label="Next letter" tone="quiet" disabled={busy} onPress={onSkip} />
      </div>

      <p className="studio-note">{note}</p>
    </div>
  );
}
