"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, RotateCcw } from "lucide-react";
import type { ActivityEngine, PublicQuestion } from "@/lib/activity-types";
import { Cast, SpeechBubble, useSpeakingCast } from "@/components/characters/SpeakingCharacter";

type EngineProps = {
  question: PublicQuestion;
  busy: boolean;
  correct: boolean;
  selected: string;
  onAnswer: (value: string) => void;
  onHint: () => Promise<unknown>;
};

/**
 * A guide strip shared by the play engines: the character, what they are saying, and a
 * replay control. The instruction is spoken once on arrival and can always be repeated,
 * which is what a pre-reader needs and a reader can ignore.
 */
function Guide({
  who,
  line,
  autoSpeak,
}: {
  who: "nova" | "pip";
  line: string;
  autoSpeak: boolean;
}) {
  const cast = useSpeakingCast();
  const { say, hush } = cast;
  const spoken = useRef("");

  useEffect(() => {
    if (!autoSpeak || spoken.current === line) return;
    spoken.current = line;
    say(who, line);
  }, [autoSpeak, line, say, who]);

  useEffect(() => () => hush(), [hush]);

  return (
    <div className="cq-guide">
      <Cast who={who} state={cast.state} talking={cast.talking} size="small" />
      <SpeechBubble
        line={cast.line ?? { who, text: line }}
        onReplay={() => say(who, line)}
      />
    </div>
  );
}

/* ==========================================================================
   Bubble Pop
   Pop every bubble that fits the rule. Multi-select, so each bubble is judged
   on its own rather than by elimination against two other choices.
   ========================================================================== */
export function BubblePop({
  engine,
  busy,
  correct,
  onAnswer,
}: EngineProps & { engine: Extract<ActivityEngine, { kind: "bubble-pop" }> }) {
  const [popped, setPopped] = useState<string[]>([]);

  // Drift values are fixed per bubble so they do not reshuffle on every render,
  // which would make the bubbles jitter each time the child taps one.
  const drift = useMemo(
    () =>
      engine.bubbles.map((bubble, index) => ({
        id: bubble.id,
        delay: (index % 5) * 0.45,
        duration: 3.6 + (index % 4) * 0.7,
        offset: ((index * 37) % 60) - 30,
        rise: ((index * 53) % 70) - 35,
      })),
    [engine.bubbles],
  );

  function toggle(id: string) {
    if (busy || correct) return;
    setPopped((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }

  return (
    <div className="cq-play cq-bubbles">
      <Guide who="pip" line="Tap every bubble that fits. Tap it again to put it back." autoSpeak />
      <div className="cq-bubble-field" role="group" aria-label={engine.rule}>
        {engine.bubbles.map((bubble, index) => {
          const isPopped = popped.includes(bubble.id);
          const style = drift[index];
          return (
            <button
              key={bubble.id}
              type="button"
              className={`cq-bubble-ball${isPopped ? " is-popped" : ""}`}
              style={{
                animationDelay: `${style.delay}s`,
                animationDuration: `${style.duration}s`,
                marginTop: `${style.rise}px`,
                ["--drift" as string]: `${style.offset}px`,
              }}
              aria-pressed={isPopped}
              disabled={busy || correct}
              onClick={() => toggle(bubble.id)}
            >
              <span>{bubble.label}</span>
            </button>
          );
        })}
      </div>
      <div className="cq-play-actions">
        <button
          type="button"
          className="text-button"
          disabled={!popped.length || busy || correct}
          onClick={() => setPopped([])}
        >
          <RotateCcw size={18} aria-hidden="true" /> Start again
        </button>
        <button
          type="button"
          className="primary"
          disabled={!popped.length || busy || correct}
          onClick={() => onAnswer(JSON.stringify(popped))}
        >
          Pop them! <Check size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/* ==========================================================================
   Balance Scale
   Comparison made physical. The child predicts, then the scale settles and
   shows them whether they were right.
   ========================================================================== */
export function BalanceScale({
  engine,
  busy,
  correct,
  selected,
  onAnswer,
}: EngineProps & { engine: Extract<ActivityEngine, { kind: "balance" }> }) {
  const settled = correct || !!selected;
  // Before an answer the scale hangs level, so it never gives the answer away.
  const tilt = settled
    ? Math.max(-12, Math.min(12, (engine.right.count - engine.left.count) * 4))
    : 0;

  const pan = (side: "left" | "right", contents: { emoji: string; count: number }) => (
    <div className="cq-pan" data-side={side} style={{ rotate: `${-tilt}deg` }}>
      <div className="cq-pan-items">
        {Array.from({ length: contents.count }, (_, index) => (
          <span key={index} aria-hidden="true">
            {contents.emoji}
          </span>
        ))}
      </div>
      <div className="cq-pan-dish" />
    </div>
  );

  const choice = (value: "left" | "right" | "equal", label: string) => (
    <button
      type="button"
      className={`cq-balance-choice${selected === value ? " is-chosen" : ""}`}
      disabled={busy || correct}
      onClick={() => onAnswer(value)}
    >
      {label}
    </button>
  );

  return (
    <div className="cq-play cq-balance">
      <Guide who="nova" line="Count one side, then the other. Then choose." autoSpeak />
      <div
        className="cq-scale"
        data-settled={settled || undefined}
        aria-label={`A balance scale. Left side: ${engine.left.count}. Right side: ${engine.right.count}.`}
      >
        <div className="cq-scale-beam" style={{ rotate: `${tilt}deg` }}>
          {pan("left", engine.left)}
          {pan("right", engine.right)}
        </div>
        <div className="cq-scale-post" />
        <div className="cq-scale-base" />
      </div>
      <div className="cq-balance-choices">
        {choice("left", "This side")}
        {choice("equal", "They are the same")}
        {choice("right", "That side")}
      </div>
    </div>
  );
}

/* ==========================================================================
   Constellation
   Sequencing with a payoff the child can see: the picture only appears when
   the order is right.
   ========================================================================== */
export function Constellation({
  engine,
  busy,
  correct,
  onAnswer,
}: EngineProps & { engine: Extract<ActivityEngine, { kind: "constellation" }> }) {
  const [path, setPath] = useState<string[]>([]);
  const byId = useMemo(
    () => new Map(engine.stars.map((star) => [star.id, star])),
    [engine.stars],
  );
  const complete = path.length === engine.stars.length;

  function tap(id: string) {
    if (busy || correct || path.includes(id)) return;
    setPath((current) => [...current, id]);
  }

  const points = path.map((id) => byId.get(id)!);

  return (
    <div className="cq-play cq-constellation">
      <Guide who="nova" line="Start with the smallest, then find the next one each time." autoSpeak />
      <div className="cq-sky" data-complete={correct || undefined}>
        <svg viewBox="0 0 100 62" className="cq-sky-lines" aria-hidden="true">
          {points.length > 1 && (
            <polyline
              points={points.map((star) => `${star.x},${star.y}`).join(" ")}
              fill="none"
              stroke="currentColor"
              strokeWidth="0.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}
        </svg>
        {engine.stars.map((star) => {
          const order = path.indexOf(star.id);
          return (
            <button
              key={star.id}
              type="button"
              className={`cq-star${order > -1 ? " is-joined" : ""}`}
              style={{ left: `${star.x}%`, top: `${(star.y / 62) * 100}%` }}
              disabled={busy || correct || order > -1}
              aria-label={`Star ${star.label}${order > -1 ? `, joined, position ${order + 1}` : ""}`}
              onClick={() => tap(star.id)}
            >
              <span className="cq-star-label">{star.label}</span>
            </button>
          );
        })}
        {correct && <span className="cq-sky-name">{engine.name}</span>}
      </div>
      <div className="cq-play-actions">
        <button
          type="button"
          className="text-button"
          disabled={!path.length || busy || correct}
          onClick={() => setPath([])}
        >
          <RotateCcw size={18} aria-hidden="true" /> Start again
        </button>
        <button
          type="button"
          className="primary"
          disabled={!complete || busy || correct}
          onClick={() => onAnswer(JSON.stringify(path))}
        >
          Light it up! <Check size={20} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
