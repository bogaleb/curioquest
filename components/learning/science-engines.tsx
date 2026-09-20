"use client";

import { useState } from "react";
import { Check, Eye, Search } from "lucide-react";
import type { ActivityEngine, PublicQuestion } from "@/lib/activity-types";

/**
 * Science that is investigated rather than answered.
 *
 * Science was the thinnest subject in the product: nineteen activities, every one of
 * them a question with three sentences under it, and not a single engine. Wave 07 names
 * the cycle it should be instead — observe, predict, test, compare, explain — and the
 * Discovery Lab already runs that cycle beautifully on its own screen. What the quest
 * path had was the quiz.
 *
 * This brings the first two steps into the activity player, where the mastery record
 * actually watches. The structural rule is that the outcomes stay locked until every
 * clue has been opened: a prediction made before looking is not a prediction, and an
 * activity that lets a child skip the observing has quietly become multiple choice
 * again no matter what it is called.
 */

type Props = {
  question: PublicQuestion;
  busy: boolean;
  correct: boolean;
  selected: string;
  onAnswer: (value: string) => void;
  onHint: () => Promise<unknown>;
};

export function Investigation({ engine, busy, correct, selected, onAnswer }: Props & { engine: Extract<ActivityEngine, { kind: "investigation" }> }) {
  const [opened, setOpened] = useState<string[]>([]);
  const examined = opened.length;
  const ready = examined === engine.clues.length;

  return <fieldset className="engine-stage investigation-stage" disabled={busy || correct}>
    <legend className="engine-instruction">
      {ready ? "You have looked at everything. What do you predict?" : "Look closely first. Open every clue."}
    </legend>

    <div className="investigation-scene" aria-hidden="true">{engine.scene}</div>

    <ol className="clue-list">
      {engine.clues.map((clue) => {
        const open = opened.includes(clue.id);
        return <li key={clue.id} className={open ? "open" : ""}>
          <button type="button" aria-expanded={open}
            onClick={() => setOpened((list) => list.includes(clue.id) ? list : [...list, clue.id])}>
            {open ? <Eye size={18}/> : <Search size={18}/>}
            <strong>{clue.label}</strong>
          </button>
          {open && <p>{clue.detail}</p>}
        </li>;
      })}
    </ol>

    {/* Locked, and it says why. A disabled control with no explanation reads as broken. */}
    <p className="investigation-gate" aria-live="polite">
      {ready
        ? "Now make your prediction."
        : `${examined} of ${engine.clues.length} clues examined. Open them all to predict.`}
    </p>

    <div className="investigation-outcomes">
      {engine.outcomes.map((outcome) => <button type="button" key={outcome.id} disabled={!ready}
        className={selected === outcome.id ? (correct ? "correct" : "chosen") : ""}
        onClick={() => onAnswer(outcome.id)}>
        <span aria-hidden="true">{outcome.emoji}</span>
        {outcome.label}
        {selected === outcome.id && correct && <Check size={20}/>}
      </button>)}
    </div>
  </fieldset>;
}
