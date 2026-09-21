"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, RotateCcw, Volume2 } from "lucide-react";
import { ActivityEngineView } from "@/components/learning/activity-engine";
import { toQuestion } from "@/lib/catalogue/catalogue";
import { countWords, systemWordsIn, wordBudget } from "@/lib/kid-copy";
import { learningBands, resolveBand, type LearningBandId } from "@/lib/learning-bands";
import type { ContentItem } from "@/lib/catalogue/model";
import type { PublicQuestion } from "@/lib/activity-types";

/**
 * The item, as the child gets it.
 *
 * The blueprint asks for a preview that "renders the item exactly as the child sees it",
 * and the only way to keep that promise as the engines change is to render through the
 * engines. `ActivityEngineView` is the same component the quest player mounts; the
 * markup around it is the same `.activity` block from `quest-player.tsx`. Nothing here
 * re-implements a stage, so an engine that gains a behaviour gains it here too.
 *
 * Answering is local. The preview never posts an event, because an author tapping
 * through their own item is not evidence of a child learning anything, and a studio
 * that polluted the event stream would corrupt the very mastery signal WP-06 reads.
 */
export function LivePreview({ item, band, onBand }: {
  item: ContentItem;
  band: LearningBandId;
  onBand: (band: LearningBandId) => void;
}) {
  const [selected, setSelected] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [hinting, setHinting] = useState(false);

  const delivery = resolveBand(band).delivery;
  const question = useMemo(() => {
    const full = toQuestion(item);
    const view: PublicQuestion = {
      id: full.id, subject: full.subject, grade: full.grade, skillId: full.skillId,
      prompt: full.prompt, visual: full.visual, options: full.options,
      engine: full.engine, hint: full.hint, passage: full.passage, audioLabel: full.audioLabel,
    };
    return view;
  }, [item]);

  const correct = !!selected && selected === item.answer;
  const chosenReason = item.distractors.find((distractor) => distractor.value === selected)?.errorKind ?? null;

  function answer(value: string) {
    setSelected(value);
    setAttempts((count) => count + 1);
  }
  function reset() {
    setSelected("");
    setAttempts(0);
    setHinting(false);
  }

  const prompt = item.prompt.en ?? "";
  const budget = wordBudget(band);
  const length = countWords(prompt);
  const systemWords = systemWordsIn(prompt);
  const offered = item.bands.includes(band);
  // The engines carry their own answer surface, so the choice ceiling only means
  // something for a tap-one-of-these item.
  const tooManyChoices = !item.delivery.engine && question.options.length > delivery.maxChoices;

  return (
    <div className="preview">
      <div className="preview-bands" role="group" aria-label="Preview as a child in this band">
        {learningBands.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`preview-band${option.id === band ? " is-current" : ""}${item.bands.includes(option.id) ? "" : " is-unoffered"}`}
            aria-pressed={option.id === band}
            onClick={() => { onBand(option.id); reset(); }}
          >
            <strong>{option.ageLabel}</strong>
            <small>{option.label}</small>
          </button>
        ))}
      </div>

      {!offered && (
        <p className="preview-note" role="status">
          <AlertTriangle size={16}/>
          This item is not offered to {resolveBand(band).label}. You are seeing what it
          <em> would </em> look like there.
        </p>
      )}

      {/*
        The child's stage. `.play-overlay` and `.activity` are the quest player's own
        classes, scoped inside `.preview-stage` so the studio's chrome keeps its own type
        scale while the stage keeps the child's.
      */}
      <div className="preview-stage" data-band={band}>
        <div className="play-overlay preview-overlay">
          <div className="activity">
            <div className="activity-category">{item.delivery.subject}</div>
            <h1>{prompt || "This item has no prompt yet."}</h1>
            <button type="button" className="read-button" disabled>
              <Volume2 size={20}/>{delivery.autoNarrate ? "Nova reads this aloud automatically" : "Read it to me"}
            </button>
            <ActivityEngineView
              key={`${item.id}:${band}:${attempts === 0 ? "fresh" : "used"}`}
              question={question}
              busy={false}
              correct={correct}
              selected={selected}
              onAnswer={answer}
              onHint={async () => setHinting(true)}
            />
            {(selected || hinting) && (
              <div className={`feedback ${correct ? "positive" : ""}`} aria-live="polite">
                <span className="fox" aria-hidden="true">🦊</span>
                <div>
                  <strong>{correct ? "You figured it out!" : "Nova is here to help"}</strong>
                  <p>{correct ? item.explanation.en || "Nice thinking." : item.hint.en || "This item has no hint written yet."}</p>
                  {!correct && selected && (
                    <small className="preview-reason">
                      {chosenReason
                        ? `Authored reason: ${chosenReason} — the teaching move branches on this.`
                        : "No reason authored for this wrong answer, so the runtime inference decides the teaching move."}
                    </small>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="preview-actions">
        <button type="button" className="studio-button subtle" onClick={reset}>
          <RotateCcw size={15}/>Start over
        </button>
        <span className="preview-attempts">{attempts} {attempts === 1 ? "tap" : "taps"} in this preview</span>
      </div>

      {/*
        What the band does to this item, stated rather than implied. An author changing
        the band picker should be able to see *why* the same words are fine at six and
        too many at three.
      */}
      <dl className="preview-facts">
        <div className={length > budget ? "is-over" : ""}>
          <dt>Prompt length</dt>
          <dd>{length} of {budget} words{length > budget ? ` — ${length - budget} too many for this band` : ""}</dd>
        </div>
        <div className={tooManyChoices ? "is-over" : ""}>
          <dt>Choices on screen</dt>
          <dd>{item.delivery.engine ? "Set by the engine" : `${question.options.length} of ${delivery.maxChoices} allowed`}</dd>
        </div>
        <div>
          <dt>Reading expectation</dt>
          <dd>{delivery.instruction.replace(/-/g, " ")}</dd>
        </div>
        <div>
          <dt>Nova offers help after</dt>
          <dd>{delivery.hintAfterSeconds ? `${delivery.hintAfterSeconds} seconds` : "only when asked"}</dd>
        </div>
        <div>
          <dt>Touch targets</dt>
          <dd>at least {delivery.touchTargetPx}px</dd>
        </div>
        {systemWords.length > 0 && (
          <div className="is-over">
            <dt>Product words</dt>
            <dd>{systemWords.join(", ")} — §C5 keeps these off a child&apos;s screen</dd>
          </div>
        )}
      </dl>

      {correct && (
        <p className="preview-passed" role="status"><Check size={16}/>That is the authored answer.</p>
      )}
    </div>
  );
}
