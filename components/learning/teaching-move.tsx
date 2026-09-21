"use client";

import { useEffect, useState } from "react";
import { SpeakerMark } from "@/components/kid/Placeholder";
import { audioSettings } from "@/lib/audio";
import { readAloud } from "@/lib/speech";
import type { QuestFeedback } from "@/lib/explorer-view";

/**
 * The move a wrong answer earns, on screen.
 *
 * `lib/teaching-response.ts` decides *which* move; this is the move itself. Each one is a
 * different thing to look at or do, because that is the point of WP-04: two children who
 * answer the same item wrong in two different ways should not be looking at the same
 * screen afterwards.
 *
 *   compare        the two shapes side by side, the child's own choice first
 *   relisten       one big button that says the sound again, and nothing else to read
 *   sound-not-name the same button, with the sound written the way it is said
 *   recount        a row of counters to touch, one at a time
 *   settle         a beat, visibly passing, before the child may answer again
 *   step-back      a note that an easier one is coming first
 *
 * `restate-rule` and `reorder` have no picture of their own: the activity is already on
 * screen and the words are the whole move, so adding a panel would only cover the thing
 * the child is meant to look at again.
 *
 * Built from the child component layer, so it obeys the touch floor and the type floor
 * the band sets, and none of it depends on colour or on hover.
 */
export function TeachingMoveView({ feedback }: { feedback: QuestFeedback }) {
  const move = feedback?.move;
  if (!feedback || feedback.correct || !move) return null;

  if (move === "compare" && feedback.compare) {
    return <CompareMove chosen={feedback.compare.chosen} answer={feedback.compare.answer} />;
  }
  if ((move === "relisten" || move === "sound-not-name") && feedback.listen) {
    return <ListenMove text={feedback.listen} sound={move === "sound-not-name"} />;
  }
  if (move === "recount" && feedback.count) return <CountMove total={feedback.count} />;
  if (move === "settle") return <SettleMove />;
  if (move === "step-back" && feedback.steppedBack) return <StepBackMove />;
  return null;
}

/**
 * Two letters, side by side, large.
 *
 * A child who writes `b` for `d` has not failed to learn `d`; they have learned one shape
 * and two names for it. Seeing both at once, in the reading face, is the move — and the
 * child's own choice is shown first because it is the one they were sure of.
 */
function CompareMove({ chosen, answer }: { chosen: string; answer: string }) {
  return (
    <div className="kid-move" data-move="compare">
      <div className="kid-compare">
        <span className="kid-compare-one" data-side="chosen">
          <b>{chosen}</b>
          <small>you picked</small>
        </span>
        <span className="kid-compare-one" data-side="answer">
          <b>{answer}</b>
          <small>we want</small>
        </span>
      </div>
    </div>
  );
}

/** One button. It says the sound again, and there is nothing else on the panel to read. */
function ListenMove({ text, sound }: { text: string; sound: boolean }) {
  const narration = audioSettings().narration;
  return (
    <div className="kid-move" data-move="listen">
      <button
        type="button"
        className="kid-listen"
        aria-label={sound ? `Listen to the sound ${text}` : `Listen again to ${text}`}
        onClick={() => readAloud(sound ? `${text}. ${text}. ${text}.` : text)}
      >
        <SpeakerMark />
        <span>{sound ? `${text}${text}${text}` : text}</span>
      </button>
      {/* With the voice off the button cannot help, so the thing it would have said is
          written out instead. The audio-off path is complete, not degraded (§C6). */}
      {!narration && <p className="kid-move-note">Say it out loud together.</p>}
    </div>
  );
}

/** Counters to touch, one at a time, so counting is done with a finger and not in the head. */
function CountMove({ total }: { total: number }) {
  const [touched, setTouched] = useState(0);
  const counters = Math.min(Math.max(total, 1), 20);
  return (
    <div className="kid-move" data-move="count">
      <div className="kid-counters" role="group" aria-label="Count them again">
        {Array.from({ length: counters }, (_, index) => (
          <button
            key={index}
            type="button"
            className="kid-counter"
            data-counted={index < touched || undefined}
            aria-label={`Counter ${index + 1}`}
            onClick={() => setTouched(index + 1)}
          >
            <span aria-hidden="true" />
          </button>
        ))}
      </div>
      <p className="kid-move-note" aria-live="polite">
        {touched ? `${touched}` : "Touch each one."}
      </p>
    </div>
  );
}

/**
 * A beat.
 *
 * The answer arrived too fast to have been a decision, so the move is time rather than
 * words. The bar fills for three seconds; nothing is disabled, because stopping a child
 * from answering would be a punishment rather than a pause.
 */
function SettleMove() {
  const [done, setDone] = useState(false);
  useEffect(() => {
    const handle = setTimeout(() => setDone(true), 3000);
    return () => clearTimeout(handle);
  }, []);
  return (
    <div className="kid-move" data-move="settle">
      <span className="kid-settle" data-done={done || undefined} aria-hidden="true" />
      <p className="kid-move-note">{done ? "Now have a good look." : "Take a breath."}</p>
    </div>
  );
}

/** Says out loud that the next thing is deliberately easier, and that this one comes back. */
function StepBackMove() {
  return (
    <div className="kid-move" data-move="step-back">
      <p className="kid-move-note">Here is a smaller step first. We come back to this one.</p>
    </div>
  );
}
