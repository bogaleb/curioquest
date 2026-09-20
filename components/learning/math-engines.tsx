"use client";

import { useState } from "react";
import { Check, RotateCcw, Repeat } from "lucide-react";
import type { ActivityEngine, PublicQuestion } from "@/lib/activity-types";

/**
 * Math manipulatives.
 *
 * Wave 06 forbids "plain text question + four-button design" as the default, and until
 * this module every math activity in the core curriculum was exactly that: a sentence
 * with three numbers under it. A child could answer "7 birds stay" by elimination
 * without ever modelling seven, and the mastery record could not tell the difference.
 *
 * Each engine here is concrete → representational → abstract in that order. The child
 * moves something, the model shows what moved, and the number follows from it. None of
 * them will accept an answer the model does not actually show, which is why they are
 * worth more than a fourth button: you cannot guess a number line.
 */

type Props = {
  question: PublicQuestion;
  busy: boolean;
  correct: boolean;
  selected: string;
  onAnswer: (value: string) => void;
  onHint: () => Promise<unknown>;
};

/* ------------------------------------------------------------------ number line */

/**
 * An open number line. The child hops; nothing tells them how far.
 *
 * Overshooting is allowed and reversible on purpose. A line that only accepted the
 * right number of hops would be a button with extra steps; one a child can walk too
 * far along and come back from is a place to think.
 */
export function NumberLine({ engine, busy, correct, onAnswer }: Props & { engine: Extract<ActivityEngine, { kind: "number-line" }> }) {
  const [at, setAt] = useState(engine.start);
  const [hops, setHops] = useState<number[]>([]);
  const span = engine.max - engine.min;
  // A viewBox keeps the line crisp at every width; the wrapper scales it. Everything is
  // drawn deliberately large in viewBox units, because on a phone the whole thing is
  // scaled to about a third and a label sized for a laptop becomes unreadable there.
  const width = 1000, left = 46, right = width - 46, base = 100;
  const x = (value: number) => left + ((value - engine.min) / span) * (right - left);
  const ticks = Array.from({ length: span + 1 }, (_, i) => engine.min + i);

  function hop(step: number) {
    const next = at + step;
    if (next < engine.min || next > engine.max) return;
    setHops((list) => [...list, at]);
    setAt(next);
  }
  function reset() { setAt(engine.start); setHops([]); }

  return <fieldset className="engine-stage number-line-stage" disabled={busy || correct}>
    <legend className="engine-instruction">Hop along the line. You can always hop back.</legend>
    <div className="number-line-frame">
      <svg viewBox={`0 0 ${width} 152`} role="img" aria-label={`A number line from ${engine.min} to ${engine.max}. Your marker is on ${at}.`}>
        {/* Every hop the child has made, drawn as an arc they can count back over. */}
        {hops.map((from, index) => {
          const to = index + 1 < hops.length ? hops[index + 1] : at;
          const midpoint = (x(from) + x(to)) / 2;
          return <path key={index} className="number-line-hop"
            d={`M ${x(from)} ${base} Q ${midpoint} ${base - 64} ${x(to)} ${base}`}/>;
        })}
        <line className="number-line-rule" x1={left} y1={base} x2={right} y2={base}/>
        {ticks.map((value) => {
          const labelled = (value - engine.min) % engine.tickEvery === 0 || value === engine.max;
          return <g key={value}>
            <line className={labelled ? "number-line-tick major" : "number-line-tick"}
              x1={x(value)} y1={base - (labelled ? 15 : 9)} x2={x(value)} y2={base + (labelled ? 15 : 9)}/>
            {labelled && <text className="number-line-label" x={x(value)} y={base + 44} textAnchor="middle">{value}</text>}
          </g>;
        })}
        <g className="number-line-marker" transform={`translate(${x(at)} ${base - 32})`}>
          <circle r="27"/>
          <text y="10" textAnchor="middle">{at}</text>
        </g>
      </svg>
    </div>
    <div className="number-line-controls">
      <button type="button" disabled={at === engine.min} onClick={() => hop(-1)} aria-label="Hop back one">← Hop back</button>
      <output aria-live="polite">{hops.length === 0 ? "Start hopping" : `${hops.length} ${hops.length === 1 ? "hop" : "hops"}`}</output>
      <button type="button" disabled={at === engine.max} onClick={() => hop(1)} aria-label="Hop forward one">Hop on →</button>
    </div>
    <div className="engine-tools">
      <button type="button" className="text-button" onClick={reset}><RotateCcw size={18}/> Back to the start</button>
    </div>
    <button type="button" className="primary" onClick={() => onAnswer(String(at))}>I landed on {at} <Check size={20}/></button>
  </fieldset>;
}

/* ------------------------------------------------------------------ number bond */

/** A cluster of counters, so a number in a bond is never only a numeral. */
function Counters({ count, emoji, max = 20 }: { count: number; emoji: string; max?: number }) {
  if (count > max) return <span className="bond-counters too-many">{count}</span>;
  return <span className="bond-counters" aria-hidden="true">
    {Array.from({ length: Math.max(0, count) }, (_, i) => <i key={i}>{emoji}</i>)}
  </span>;
}

/**
 * Part–part–whole with one cell missing.
 *
 * A missing whole is addition and a missing part is subtraction, drawn as the same
 * picture. Children who meet those as two unrelated procedures spend years not noticing
 * they are one idea.
 */
export function NumberBond({ engine, busy, correct, onAnswer }: Props & { engine: Extract<ActivityEngine, { kind: "number-bond" }> }) {
  const missing: "whole" | "left" | "right" = engine.whole === null ? "whole" : engine.parts[0] === null ? "left" : "right";
  const ceiling = (engine.whole ?? 20) + 1;
  const [value, setValue] = useState(0);
  const whole = engine.whole ?? value;
  const leftPart = engine.parts[0] ?? (missing === "left" ? value : 0);
  const rightPart = engine.parts[1] ?? (missing === "right" ? value : 0);

  const cell = (slot: "whole" | "left" | "right", amount: number) => {
    const active = missing === slot;
    return <div className={`bond-cell ${slot === "whole" ? "whole" : "part"} ${active ? "missing" : ""}`}
      aria-label={`${slot === "whole" ? "The whole" : "A part"}: ${active ? `${amount}, the one you are filling in` : amount}`}>
      <strong>{amount}</strong>
      <Counters count={amount} emoji={engine.emoji}/>
    </div>;
  };

  return <fieldset className="engine-stage bond-stage" disabled={busy || correct}>
    <legend className="engine-instruction">The two parts below make the whole above. Fill in the empty one.</legend>
    <div className="bond-diagram">
      {cell("whole", whole)}
      <svg className="bond-links" viewBox="0 0 200 60" aria-hidden="true">
        <path d="M 100 4 L 34 56"/><path d="M 100 4 L 166 56"/>
      </svg>
      <div className="bond-parts">{cell("left", leftPart)}{cell("right", rightPart)}</div>
    </div>
    <div className="number-controls">
      <button type="button" aria-label="One fewer" disabled={value === 0} onClick={() => setValue((n) => n - 1)}>−</button>
      <output aria-live="polite" aria-label="The number you are placing">{value}</output>
      <button type="button" aria-label="One more" disabled={value >= ceiling} onClick={() => setValue((n) => n + 1)}>+</button>
    </div>
    <button type="button" className="primary" onClick={() => onAnswer(String(value))}>Finish the bond <Check size={20}/></button>
  </fieldset>;
}

/* ------------------------------------------------------------------ place value */

/**
 * Tens rods and ones cubes, with the one rule that makes place value make sense: the
 * mat holds no more than nine loose ones.
 *
 * A child who builds fourteen out of fourteen cubes is offered a trade rather than an
 * error. Ten ones become one ten in front of them, which is the moment the notation
 * stops being arbitrary.
 */
export function PlaceValue({ engine, busy, correct, onAnswer }: Props & { engine: Extract<ActivityEngine, { kind: "place-value" }> }) {
  const [tens, setTens] = useState(0);
  const [ones, setOnes] = useState(0);
  const total = tens * 10 + ones;
  const canTrade = ones >= 10 && tens < engine.maxTens;

  return <fieldset className="engine-stage place-value-stage" disabled={busy || correct}>
    <legend className="engine-instruction">Build the number with tens and ones.</legend>
    <div className="place-mat">
      <section className="place-column" aria-label={`Tens: ${tens}`}>
        <h3>Tens</h3>
        <div className="place-rods">{Array.from({ length: tens }, (_, i) =>
          <span className="place-rod" key={i} aria-hidden="true">{Array.from({ length: 10 }, (_, j) => <i key={j}/>)}</span>)}</div>
        <div className="number-controls small">
          <button type="button" aria-label="Remove a ten" disabled={tens === 0} onClick={() => setTens((n) => n - 1)}>−</button>
          <output aria-live="polite">{tens}</output>
          <button type="button" aria-label="Add a ten" disabled={tens >= engine.maxTens} onClick={() => setTens((n) => n + 1)}>+</button>
        </div>
      </section>
      <section className="place-column" aria-label={`Ones: ${ones}`}>
        <h3>Ones</h3>
        <div className={`place-cubes ${ones > 9 ? "crowded" : ""}`}>{Array.from({ length: ones }, (_, i) =>
          <span className="place-cube" key={i} aria-hidden="true"/>)}</div>
        <div className="number-controls small">
          <button type="button" aria-label="Remove a one" disabled={ones === 0} onClick={() => setOnes((n) => n - 1)}>−</button>
          <output aria-live="polite">{ones}</output>
          <button type="button" aria-label="Add a one" disabled={ones >= 14} onClick={() => setOnes((n) => n + 1)}>+</button>
        </div>
      </section>
    </div>
    {/* Offered, not enforced. The child performs the regrouping and sees it happen. */}
    {canTrade && <button type="button" className="secondary trade-offer"
      onClick={() => { setOnes((n) => n - 10); setTens((n) => n + 1); }}>
      <Repeat size={18}/> Ten ones make one ten — trade them
    </button>}
    <p className="place-total" aria-live="polite">
      <strong>{total}</strong>
      <span>{tens} {tens === 1 ? "ten" : "tens"} and {ones} {ones === 1 ? "one" : "ones"}</span>
    </p>
    <button type="button" className="primary" onClick={() => onAnswer(`${tens},${ones}`)}>Check my number <Check size={20}/></button>
  </fieldset>;
}

/* ----------------------------------------------------------------- array builder */

/**
 * Rows and columns, with the total counting up as the array grows.
 *
 * Skip counting is not taught here as a rule; it is what a child notices when the
 * readout goes 4, 8, 12 as they add rows of four. The repeated-addition line underneath
 * is the same fact written the way they will meet it next year.
 */
export function ArrayBuilder({ engine, busy, correct, onAnswer }: Props & { engine: Extract<ActivityEngine, { kind: "array-builder" }> }) {
  const [rows, setRows] = useState(1);
  const [columns, setColumns] = useState(1);
  const total = rows * columns;

  return <fieldset className="engine-stage array-stage" disabled={busy || correct}>
    <legend className="engine-instruction">Add rows and columns until the garden matches.</legend>
    <div className="array-grid" role="img" aria-label={`${rows} rows of ${columns}, which is ${total} altogether`}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {Array.from({ length: total }, (_, i) => <span key={i} aria-hidden="true">{engine.emoji}</span>)}
    </div>
    <div className="array-controls">
      <div className="number-controls small" aria-label={`Rows: ${rows}`}>
        <button type="button" aria-label="One fewer row" disabled={rows === 1} onClick={() => setRows((n) => n - 1)}>−</button>
        <output aria-live="polite">{rows} {rows === 1 ? "row" : "rows"}</output>
        <button type="button" aria-label="One more row" disabled={rows >= engine.maxRows} onClick={() => setRows((n) => n + 1)}>+</button>
      </div>
      <div className="number-controls small" aria-label={`In each row: ${columns}`}>
        <button type="button" aria-label="One fewer in each row" disabled={columns === 1} onClick={() => setColumns((n) => n - 1)}>−</button>
        <output aria-live="polite">{columns} in each</output>
        <button type="button" aria-label="One more in each row" disabled={columns >= engine.maxColumns} onClick={() => setColumns((n) => n + 1)}>+</button>
      </div>
    </div>
    <p className="array-total" aria-live="polite">
      <span>{Array.from({ length: rows }, () => columns).join(" + ")} = </span><strong>{total}</strong>
    </p>
    <button type="button" className="primary" onClick={() => onAnswer(`${rows},${columns}`)}>Plant my garden <Check size={20}/></button>
  </fieldset>;
}
