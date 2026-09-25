"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { CastFigure, type CastName } from "./cast";

/**
 * The celebration (WP-11 §2.5).
 *
 * Replaces `.celebration` in `app/globals.css`: a 135px circle with a border, in minified
 * legacy CSS, with a raw hex fill. It is the moment the whole session has been building
 * towards and it was the least designed thing on the screen.
 *
 * ## Four beats, then silence
 *
 * | beat | at | what |
 * | --- | --- | --- |
 * | `land` | 0ms | the work settles. Nothing moves. |
 * | `grant` | 200ms | the reward object is drawn *into* the scene, travelling from where the work happened |
 * | `perform` | 400ms | the character reacts — a nod and a tail flick, not a firework display |
 * | `rest` | 1100ms | everything stops |
 *
 * The `rest` beat is the important one, and it is the thing the reverted Aurora pass got
 * right: *"a right answer pulses once and stops — a child who got it right is about to
 * move on, and something still moving behind the next question competes with it."*
 * Nothing in this component loops.
 *
 * ## Why it is skippable
 *
 * A child who already knows they were right should never have to watch an animation to
 * find out. Any pointer or key press jumps straight to `rest`, with the object present and
 * the words still on screen. Celebration is a reward, and a reward you cannot leave is a
 * toll.
 *
 * ## Reduced motion
 *
 * There is no sequence. The component mounts at `rest`: the object simply *is* there,
 * drawn, with its name said. §C6 asks for a complete path, not a degraded one — and
 * "you earned this thing, here it is" survives losing the animation entirely.
 */

/** The beats, in order. Exported so a test can assert the sequence rather than the timing. */
export const CELEBRATION_BEATS = ["land", "grant", "perform", "rest"] as const;
export type CelebrationBeat = (typeof CELEBRATION_BEATS)[number];

const SCHEDULE: { beat: CelebrationBeat; at: number }[] = [
  { beat: "grant", at: 200 },
  { beat: "perform", at: 400 },
  { beat: "rest", at: 1100 },
];

export function Celebration({
  /** The drawn thing the child has earned. Never a number, never a star count (§D9). */
  object,
  /** What it is called, in the child's words. Said aloud by the caller, shown here. */
  name,
  who = "curio",
  onDone,
}: {
  object: ReactNode;
  name: string;
  who?: CastName;
  onDone?: () => void;
}) {
  const reduced = usePrefersReducedMotion();
  const [scheduled, setBeat] = useState<CelebrationBeat>("land");
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const finished = useRef(false);

  // Under the preference there is no sequence, so the beat is derived rather than set:
  // the component simply renders at rest from its very first frame. Deriving it also
  // keeps the effect below free of a synchronous setState, which would cost a cascading
  // render on every celebration for a child who asked for less movement, not more work.
  const beat: CelebrationBeat = reduced ? "rest" : scheduled;

  const clear = useCallback(() => {
    for (const timer of timers.current) clearTimeout(timer);
    timers.current = [];
  }, []);

  /** Jump to the end. Used by the schedule's last beat and by any press. */
  const settle = useCallback(() => {
    clear();
    setBeat("rest");
    if (!finished.current) {
      finished.current = true;
      onDone?.();
    }
  }, [clear, onDone]);

  useEffect(() => {
    if (reduced) {
      // Nothing to schedule: the beat is already derived as "rest". The caller is still
      // told the celebration is over, because whatever comes next is waiting on it.
      if (!finished.current) {
        finished.current = true;
        onDone?.();
      }
      return;
    }
    for (const step of SCHEDULE) {
      timers.current.push(
        setTimeout(() => (step.beat === "rest" ? settle() : setBeat(step.beat)), step.at),
      );
    }
    return clear;
  }, [clear, onDone, reduced, settle]);

  // Any press ends it. Listening on the window rather than on an overlay, so the child can
  // carry on tapping whatever they were already reaching for instead of having to dismiss
  // something first.
  useEffect(() => {
    if (beat === "rest") return;
    const skip = () => settle();
    window.addEventListener("pointerdown", skip, { once: true });
    window.addEventListener("keydown", skip, { once: true });
    return () => {
      window.removeEventListener("pointerdown", skip);
      window.removeEventListener("keydown", skip);
    };
  }, [beat, settle]);

  return (
    <div className="kid-celebrate" data-beat={beat} role="status">
      <span className="kid-celebrate-object">{object}</span>
      <span className="kid-celebrate-cast">
        <CastFigure who={who} state={beat === "perform" ? "celebrate" : "idle"} />
      </span>
      <span className="kid-celebrate-name">{name}</span>
    </div>
  );
}

