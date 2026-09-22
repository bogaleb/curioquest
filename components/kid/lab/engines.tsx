"use client";

import { useState, type CSSProperties } from "react";
import { KidButton } from "../KidButton";
import type { LabResult, PublicActivity } from "@/lib/science/types";
import { LabApparatus } from "./models";
import { LabDiagramArt } from "./diagrams";
import { LabObject } from "./objects";

/**
 * The five ways a child can think in the Wonder Lab.
 *
 * Wave 07 names a cycle — observe, predict, test, compare, classify, explain — and these
 * are the interactions that cycle needs. Between them they cover every station in the
 * lab, which is the point: adding a topic is content, not components.
 *
 *   PredictEngine   look at every clue, commit to a prediction, watch the model run
 *   SortEngine      classify one thing at a time, and be told where it belonged either way
 *   SequenceEngine  build an order, and see that reversed is a different mistake from scattered
 *   LabelEngine     find the part that does a job, on an unlabelled diagram
 *   FairTestEngine  choose the one thing to change, and say what stays still
 *
 * Every one of them shares three properties, and each is a rule from §C6 rather than a
 * style preference:
 *
 *   - a control is a real `<button>` sized by the band, never a div with a handler;
 *   - nothing is carried by colour alone — a chosen answer is also drawn and named;
 *   - the instruction is on screen as words as well as spoken, so narration-off is a
 *     complete path rather than a degraded one.
 *
 * None of them knows whether an answer is right. They call `onAnswer`, and the server
 * decides (§A).
 */

export type LabAnswer = { choice?: string; item?: string; order?: string[] };

type Common = {
  step: number;
  result: LabResult | null;
  busy: boolean;
  onAnswer: (answer: LabAnswer) => void;
};

/* ==========================================================================
   PREDICT
   ========================================================================== */

/**
 * The spine of the lab: look, predict, test, observe.
 *
 * The gate is the whole design. Outcomes are disabled until every clue has been opened,
 * and the screen says so in words rather than leaving a dead button — a disabled control
 * with no explanation reads as broken to an adult and as "this app is ignoring me" to a
 * child.
 *
 * Running the model is a separate, deliberate press. Judging the prediction the instant
 * it is tapped would collapse predict and test into one action and lose the beat where a
 * child is committed but does not yet know — which is the only moment in the whole cycle
 * where they are actually doing science.
 */
export function PredictEngine({
  activity,
  step,
  result,
  busy,
  onAnswer,
}: Common & { activity: Extract<PublicActivity, { kind: "predict" }> }) {
  const setup = activity.setups[Math.min(step, activity.setups.length - 1)];
  const [opened, setOpened] = useState<string[]>([]);
  const [choice, setChoice] = useState("");
  const ready = opened.length === setup.clues.length;

  return (
    <div className="lab-engine" data-engine="predict">
      <LabApparatus
        model={activity.model}
        art={setup.art}
        phase={result ? "run" : "rest"}
        motion={result?.motion ?? "still"}
        label={setup.name}
      />

      <h3 className="lab-step-heading">{setup.name}</h3>

      {!result && (
        <>
          <p className="lab-instruction">
            {ready ? activity.question : "Look closely first. Open every clue."}
          </p>

          <ul className="lab-clues">
            {setup.clues.map((clue) => {
              const open = opened.includes(clue.id);
              return (
                <li key={clue.id} data-open={open || undefined}>
                  <button
                    type="button"
                    className="lab-clue"
                    aria-expanded={open}
                    disabled={busy}
                    onClick={() => setOpened((list) => (list.includes(clue.id) ? list : [...list, clue.id]))}
                  >
                    <MagnifierMark found={open} />
                    <span>{clue.label}</span>
                  </button>
                  {open && <p className="lab-clue-detail">{clue.detail}</p>}
                </li>
              );
            })}
          </ul>

          <p className="lab-gate" aria-live="polite">
            {ready
              ? "Now make your prediction."
              : `${opened.length} of ${setup.clues.length} looked at. Open them all to predict.`}
          </p>

          <div className="lab-choices">
            {activity.outcomes.map((outcome) => (
              <KidButton
                key={outcome.id}
                label={outcome.label}
                tone={choice === outcome.id ? "sun" : "world"}
                pressed={choice === outcome.id}
                disabled={!ready || busy}
                onPress={() => setChoice(outcome.id)}
              />
            ))}
          </div>

          <div className="lab-commit">
            <KidButton
              label="Try it in the model"
              size="primary"
              tone="world"
              disabled={!choice || busy}
              onPress={() => onAnswer({ choice })}
            />
          </div>
        </>
      )}
    </div>
  );
}

/* ==========================================================================
   SORT
   ========================================================================== */

/**
 * Classify, one thing at a time.
 *
 * Deliberately not drag-and-drop. Dragging is a fine motor task that has nothing to do
 * with classifying, and on a tablet held in two hands by a four-year-old it is the
 * difference between a child who can do the science and a child who cannot work the
 * interface. Tap the thing, tap where it goes.
 *
 * One item is on the bench at a time, so the child judges each one against the rule
 * rather than sorting the easy ones first and distributing the leftovers.
 */
export function SortEngine({
  activity,
  step,
  result,
  busy,
  onAnswer,
}: Common & { activity: Extract<PublicActivity, { kind: "sort" }> }) {
  const item = activity.items[Math.min(step, activity.items.length - 1)];

  return (
    <div className="lab-engine" data-engine="sort">
      <p className="lab-instruction">{activity.question}</p>

      <div className="lab-bench-item" data-settled={result ? "yes" : undefined}>
        <LabObject art={item.art} className="lab-object lab-object-large" />
        <strong>{item.label}</strong>
      </div>

      <p className="lab-gate" aria-live="polite">
        {`Thing ${step + 1} of ${activity.items.length}.`}
      </p>

      <div className="lab-bins">
        {activity.bins.map((bin) => (
          <button
            key={bin.id}
            type="button"
            className="lab-bin"
            data-chosen={result && result.outcome === bin.id ? "yes" : undefined}
            disabled={busy || Boolean(result)}
            onClick={() => onAnswer({ item: item.id, choice: bin.id })}
          >
            <LabObject art={bin.art} />
            <span>{bin.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ==========================================================================
   SEQUENCE
   ========================================================================== */

/**
 * Put it in order.
 *
 * Tap to add to the trail, tap again to take the last one back. A child who has three of
 * four in place can change their mind without starting again, which is what makes an
 * ordering task feel like thinking rather than like a lock with a combination.
 *
 * The cyclical stations draw the trail as a loop, because "and then it starts again" is
 * the actual content of a life cycle and a row of four pictures quietly denies it.
 */
export function SequenceEngine({
  activity,
  result,
  busy,
  onAnswer,
}: Common & { activity: Extract<PublicActivity, { kind: "sequence" }> }) {
  const [order, setOrder] = useState<string[]>([]);
  const remaining = activity.stages.filter((stage) => !order.includes(stage.id));
  const complete = order.length === activity.stages.length;

  return (
    <div className="lab-engine" data-engine="sequence">
      <p className="lab-instruction">{activity.question}</p>

      <ol className="lab-trail" data-cyclical={activity.cyclical || undefined}>
        {order.map((id, index) => {
          const stage = activity.stages.find((candidate) => candidate.id === id)!;
          return (
            <li key={id}>
              <span className="lab-trail-number" aria-hidden="true">{index + 1}</span>
              <LabObject art={stage.art} />
              <span className="lab-trail-label">{stage.label}</span>
            </li>
          );
        })}
        {!order.length && <li className="lab-trail-empty">Start with the one that comes first.</li>}
      </ol>

      <div className="lab-stages">
        {remaining.map((stage) => (
          <button
            key={stage.id}
            type="button"
            className="lab-stage"
            disabled={busy || Boolean(result?.correct)}
            onClick={() => setOrder((list) => [...list, stage.id])}
          >
            <LabObject art={stage.art} />
            <span>{stage.label}</span>
          </button>
        ))}
      </div>

      <div className="lab-commit">
        <KidButton
          label="Take the last one back"
          tone="quiet"
          disabled={!order.length || busy || Boolean(result?.correct)}
          onPress={() => setOrder((list) => list.slice(0, -1))}
        />
        <KidButton
          label="Check my order"
          size="primary"
          disabled={!complete || busy || Boolean(result?.correct)}
          onPress={() => onAnswer({ order })}
        />
      </div>
    </div>
  );
}

/* ==========================================================================
   LABEL
   ========================================================================== */

/**
 * Find the part that does the job.
 *
 * The diagram arrives with no words on it at all. The child is given a job — "this does
 * the drinking, down in the soil" — and taps where they think it happens; the name is
 * written on only once they have found it, and stays for the rest of the station.
 *
 * That ordering is the difference between learning a plant and reading a label. It also
 * means the question cannot be answered by matching word shapes, which is the usual way
 * a labelling exercise gets solved by a child who cannot yet read.
 *
 * The hotspots are HTML buttons over the drawing rather than SVG shapes, so each one
 * takes the band's touch size, gets the standard focus ring, and reaches the keyboard
 * path for free.
 */
export function LabelEngine({
  activity,
  found,
  ask,
  missed,
  busy,
  onAnswer,
}: Common & {
  activity: Extract<PublicActivity, { kind: "label" }>;
  /** Hotspot id to the name written on it, once the child has found it. */
  found: Record<string, string>;
  /** The job being asked about right now. */
  ask: { id: string; label: string };
  missed: boolean;
}) {
  return (
    <div className="lab-engine" data-engine="label">
      <p className="lab-instruction">{activity.question}</p>
      <p className="lab-ask" aria-live="polite">{ask.label}</p>

      <div className="lab-diagram" data-missed={missed || undefined}>
        <LabDiagramArt diagram={activity.diagram} />
        {activity.parts.map((part) => {
          const name = found[part.id];
          return (
            <button
              key={part.id}
              type="button"
              className="lab-hotspot"
              data-found={name ? "yes" : undefined}
              // The one value the data owns rather than the stylesheet: where this part
              // is on this drawing. Everything else about a hotspot is in app/kid.css.
              style={{ "--lab-x": `${part.x}%`, "--lab-y": `${part.y}%` } as CSSProperties}
              disabled={busy || Boolean(name)}
              aria-label={name ?? "An unnamed part of the picture"}
              onClick={() => onAnswer({ choice: part.id })}
            >
              <span className="lab-hotspot-dot" aria-hidden="true" />
              {name && <span className="lab-hotspot-name">{name}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ==========================================================================
   FAIR TEST
   ========================================================================== */

/**
 * Change one thing.
 *
 * The oldest children's own format, and the only one here that cannot be solved by
 * looking. Everything on the bench is something that *could* be changed; exactly one of
 * them is the thing the question is about, and the rest have to be held still.
 *
 * The reason the others stay put arrives with the result rather than on the screen,
 * because it is the answer.
 */
export function FairTestEngine({
  activity,
  result,
  busy,
  onAnswer,
}: Common & { activity: Extract<PublicActivity, { kind: "fair-test" }> }) {
  return (
    <div className="lab-engine" data-engine="fair-test">
      <p className="lab-instruction">{activity.question}</p>
      <p className="lab-gate">Everything here could be changed. Only one of them should be.</p>

      <div className="lab-variables">
        {activity.variables.map((variable) => (
          <button
            key={variable.id}
            type="button"
            className="lab-variable"
            data-chosen={result && result.outcome === variable.id ? "yes" : undefined}
            disabled={busy || Boolean(result?.correct)}
            onClick={() => onAnswer({ choice: variable.id })}
          >
            <LabObject art={variable.art} />
            <span>{variable.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ==========================================================================
   MARKS
   ========================================================================== */

/**
 * A magnifier, open or used.
 *
 * Drawn rather than borrowed from an icon set: at 20px a Lucide 1.5px stroke disappears
 * on a saturated fill, and a four-year-old reads a fat round lens long before they read
 * a thin one. The tick inside a used lens is the same mark `RightMark` draws, so "looked
 * at" and "correct" stay visually related without being the same colour.
 */
function MagnifierMark({ found }: { found: boolean }) {
  return (
    <svg className="lab-clue-mark" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <circle cx="10.5" cy="10.5" r="7" fill="none" stroke="currentColor" strokeWidth="2.4" />
      <path d="m16 16 5 5" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
      {found && (
        <path
          d="m7.4 10.8 2.4 2.6 4.3-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}
