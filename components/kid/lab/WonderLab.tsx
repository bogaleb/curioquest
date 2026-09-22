"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CastFigure } from "../art/cast";
import { KidButton } from "../KidButton";
import { ProgressTrail } from "../ProgressTrail";
import { SpeechBubble } from "../SpeechBubble";
import { useKidSurface } from "../surface";
import { resolveBand, type LearningBandId } from "@/lib/learning-bands";
import { speak, stopReading } from "@/lib/speech";
import type { LabResult, LabTier, PublicStation, PublicTopic } from "@/lib/science/types";
import { LabObject } from "./objects";
import {
  FairTestEngine,
  LabelEngine,
  PredictEngine,
  SequenceEngine,
  SortEngine,
  type LabAnswer,
} from "./engines";

/**
 * The Wonder Lab.
 *
 * The lab this replaces was one screen: a list of nine experiments, a bench, and a
 * notebook. It worked, and almost none of what it did was science — the answers were in
 * the bundle, the "model" was an emoji with a transform on it, nothing was recorded, and
 * a three-year-old and a nine-year-old were handed exactly the same sentence.
 *
 * What is here instead is a room with shelves in it. Three screens, in the order a child
 * actually moves through them:
 *
 *   **the shelves** — topics, drawn, each one a question rather than a subject heading;
 *   **a shelf** — the stations on it, with the ones already finished marked;
 *   **a station** — the cycle: look, predict, test, observe, explain, write it down.
 *
 * The three rules that shaped it:
 *
 * **Nothing is chosen for the child that the child could choose.** A four-year-old picks
 * a shelf by looking at a picture, not by reading "physical science". But the *stations*
 * on that shelf are already filtered to what their tier is written for, so there is no
 * screen anywhere in here where a child can pick something that will not make sense to
 * them.
 *
 * **The explanation comes last, and only once.** The observation arrives with each run;
 * the idea arrives when the station is finished. Explaining after every single step turns
 * the lab into a lecture with buttons.
 *
 * **Writing it down is the point, not the reward.** The notebook prompt is a
 * metacognition question — say why, say what surprised you, say what your rule cannot
 * explain yet — and it is the last thing in every station because a child who can say why
 * is a child who can use it somewhere else.
 */

type LabData = { tier: LabTier; topics: PublicTopic[]; notes: LabNote[] };
type LabNote = { id: string; data: { station: string; topic: string; text: string } };

export function WonderLab({
  profileId,
  paused,
}: {
  profileId: string;
  /** A grown-up has stopped play. The lab stays readable and stops accepting answers. */
  paused: boolean;
}) {
  const { band, narration } = useKidSurface();
  const [data, setData] = useState<LabData | null>(null);
  const [topicId, setTopicId] = useState("");
  const [stationId, setStationId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/lab?profile=${encodeURIComponent(profileId)}`, { signal: controller.signal })
      .then(async (response) => {
        const body = (await response.json()) as LabData & { error?: string };
        if (!response.ok) throw new Error(body.error || "Please try again.");
        setData(body);
      })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Please try again.");
      });
    return () => {
      controller.abort();
      stopReading();
    };
  }, [profileId]);

  const topic = data?.topics.find((candidate) => candidate.id === topicId) ?? null;
  const station = topic?.stations.find((candidate) => candidate.id === stationId) ?? null;

  /** Mark a station finished locally, so the shelf updates without a second round trip. */
  const markDone = useCallback((id: string) => {
    setData((current) =>
      current
        ? {
            ...current,
            topics: current.topics.map((item) => ({
              ...item,
              stations: item.stations.map((one) => (one.id === id ? { ...one, done: true } : one)),
              progress: {
                total: item.progress.total,
                done: item.stations.filter((one) => one.done || one.id === id).length,
              },
            })),
          }
        : current,
    );
  }, []);

  const addNote = useCallback((note: LabNote) => {
    setData((current) => (current ? { ...current, notes: [note, ...current.notes] } : current));
  }, []);

  if (error) {
    return (
      <section className="lab-room">
        <p className="lab-trouble" role="alert">{error}</p>
      </section>
    );
  }

  if (!data) {
    return (
      <section className="lab-room" aria-busy="true">
        <p className="lab-gate">Opening the lab…</p>
      </section>
    );
  }

  if (station && topic) {
    return (
      <StationPlayer
        key={station.id}
        profileId={profileId}
        topic={topic}
        station={station}
        paused={paused}
        narration={narration}
        onDone={markDone}
        onNote={addNote}
        onLeave={() => setStationId("")}
      />
    );
  }

  if (topic) {
    return <Shelf topic={topic} onOpen={setStationId} onLeave={() => setTopicId("")} notes={data.notes} />;
  }

  return <Shelves topics={data.topics} band={band} onOpen={setTopicId} noteCount={data.notes.length} />;
}

/* ==========================================================================
   THE SHELVES
   ========================================================================== */

/**
 * Every topic this child's tier has something to say about.
 *
 * Fixed order, never sorted by progress or recommendation. The same reason the map's
 * places never move (§WP-03): a child learns "the floating one is at the top left" long
 * before they can read "Floating and sinking", and a shelf that rearranges itself takes
 * that away.
 */
function Shelves({
  topics,
  band,
  onOpen,
  noteCount,
}: {
  topics: PublicTopic[];
  band: LearningBandId;
  onOpen: (id: string) => void;
  noteCount: number;
}) {
  const label = resolveBand(band).childLabel;
  const finished = topics.reduce((total, topic) => total + topic.progress.done, 0);

  return (
    <section className="lab-room" data-view="shelves">
      <header className="lab-welcome">
        <span className="lab-guide">
          <CastFigure who="nova" state="explain" />
        </span>
        <div>
          <h1>The Wonder Lab</h1>
          <SpeechBubble
            line={{
              who: "nova",
              text: finished
                ? `Welcome back. You have finished ${finished} ${finished === 1 ? "investigation" : "investigations"}.`
                : "Pick something to wonder about. We will look first, then find out.",
            }}
          />
        </div>
      </header>

      <p className="kid-sr-only">
        {`The lab as a ${label} sees it: ${topics.length} shelves, ${noteCount} notes in your notebook.`}
      </p>

      <ul className="lab-shelves">
        {topics.map((topic) => (
          <li key={topic.id}>
            <button
              type="button"
              className="lab-shelf"
              data-strand={topic.strand}
              data-complete={topic.progress.done === topic.progress.total || undefined}
              onClick={() => onOpen(topic.id)}
            >
              <span className="lab-shelf-art">
                <LabObject art={topic.art} className="lab-object lab-object-large" />
              </span>
              <span className="lab-shelf-name">{topic.childTitle}</span>
              <span className="lab-shelf-question">{topic.bigQuestion}</span>
              <ProgressTrail
                total={topic.progress.total}
                done={topic.progress.done}
                label={`${topic.childTitle}: ${topic.progress.done} of ${topic.progress.total} done`}
              />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The stations on one shelf, with the finished ones marked. */
function Shelf({
  topic,
  notes,
  onOpen,
  onLeave,
}: {
  topic: PublicTopic;
  notes: LabNote[];
  onOpen: (id: string) => void;
  onLeave: () => void;
}) {
  const mine = notes.filter((note) => note.data.topic === topic.id);

  return (
    <section className="lab-room" data-view="shelf" data-strand={topic.strand}>
      <KidButton label="Back to the shelves" tone="quiet" onPress={onLeave} />

      <header className="lab-shelf-head">
        <span className="lab-shelf-art">
          <LabObject art={topic.art} className="lab-object lab-object-large" />
        </span>
        <div>
          <h1>{topic.childTitle}</h1>
          <p className="lab-question">{topic.bigQuestion}</p>
        </div>
      </header>

      <ul className="lab-stations">
        {topic.stations.map((station) => (
          <li key={station.id}>
            <button
              type="button"
              className="lab-station"
              data-done={station.done || undefined}
              onClick={() => onOpen(station.id)}
            >
              <span className="lab-station-name">{station.title}</span>
              <span className="lab-station-kind">{KIND_WORDS[station.activity.kind]}</span>
              {station.done && <span className="lab-station-done">Done. You can do it again.</span>}
            </button>
          </li>
        ))}
      </ul>

      {mine.length > 0 && (
        <section className="lab-notes">
          <h2>What you wrote here</h2>
          <ul>
            {mine.map((note) => (
              <li key={note.id}>{note.data.text}</li>
            ))}
          </ul>
        </section>
      )}
    </section>
  );
}

/**
 * What a station asks a child to do, in child words.
 *
 * Never the engine's name. "Sort" is a thing a five-year-old does; `sort` is a system
 * word, and §C5 keeps system vocabulary off a child surface.
 */
const KIND_WORDS: Record<PublicStation["activity"]["kind"], string> = {
  predict: "Look, then guess what happens",
  sort: "Put things where they belong",
  sequence: "Put it in the right order",
  label: "Find the part that does the job",
  "fair-test": "Work out what to change",
};

/* ==========================================================================
   THE STATION
   ========================================================================== */

function StationPlayer({
  profileId,
  topic,
  station,
  paused,
  narration,
  onDone,
  onNote,
  onLeave,
}: {
  profileId: string;
  topic: PublicTopic;
  station: PublicStation;
  paused: boolean;
  narration: boolean;
  onDone: (id: string) => void;
  onNote: (note: LabNote) => void;
  onLeave: () => void;
}) {
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<LabResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  /*
   * A `label` station accumulates: each part found stays named on the diagram, and the
   * next question only arrives with the answer to the last one. That state belongs to the
   * station rather than to the engine, so it survives across attempts and so the engine
   * itself stays a pure function of its props.
   */
  const [labels, setLabels] = useState<{ found: Record<string, string>; ask: { id: string; label: string } | null; missed: boolean }>(
    { found: {}, ask: null, missed: false },
  );
  /* Bumped on every retry, so a re-try re-mounts the engine and clears what it was
     holding — a wrong order has to be re-thought, not nudged one tile at a time. */
  const [attempt, setAttempt] = useState(0);

  // One session id for this visit to this station, so every attempt in it lands in the
  // same session on the event stream. Session coverage is part of the mastery confidence
  // score, and a new id per answer would inflate it. Created on first use rather than
  // during render: `crypto.randomUUID` and `Date.now` are both impure.
  const session = useRef("");
  const startedAt = useRef(0);
  const openedAt = () => {
    if (!startedAt.current) startedAt.current = Date.now();
    return startedAt.current;
  };
  const sessionId = () => {
    if (!session.current) {
      session.current =
        typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `lab-${Date.now()}`;
    }
    return session.current;
  };

  // Narration follows the child's own setting, and stops the moment the screen changes.
  // A voice still reading the last clue while the model runs is two teachers at once.
  const line = result ? result.response : null;
  useEffect(() => {
    if (narration && line) speak(line);
    return () => stopReading();
  }, [narration, line]);

  const answer = useCallback(
    async (payload: LabAnswer) => {
      if (busy || paused) return;
      setBusy(true);
      setError("");
      try {
        const response = await fetch("/api/lab", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "attempt",
            profile: profileId,
            station: station.id,
            session: sessionId(),
            step,
            startedAt: openedAt(),
            ...payload,
          }),
        });
        const body = (await response.json()) as { result?: LabResult; error?: string };
        if (!response.ok || !body.result) throw new Error(body.error || "Please try again.");
        setResult(body.result);
        if (station.activity.kind === "label") {
          const outcome = body.result;
          setLabels((current) => ({
            found: outcome.reveal ? { ...current.found, [outcome.reveal.spot]: outcome.reveal.name } : current.found,
            ask: outcome.nextAsk ?? current.ask,
            missed: !outcome.correct,
          }));
        }
        if (body.result.finished) onDone(station.id);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "Please try again.");
      } finally {
        setBusy(false);
      }
    },
    [busy, onDone, paused, profileId, station.activity.kind, station.id, step],
  );

  const goOn = useCallback(() => {
    setResult(null);
    setStep((current) => current + 1);
    startedAt.current = Date.now();
  }, []);

  const retry = useCallback(() => {
    setResult(null);
    setAttempt((current) => current + 1);
    startedAt.current = Date.now();
  }, []);

  async function saveNote() {
    if (busy || saved || !note.trim()) return;
    setBusy(true);
    try {
      const response = await fetch("/api/lab", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "note", profile: profileId, station: station.id, text: note }),
      });
      const body = (await response.json()) as { item?: LabNote; error?: string };
      if (!response.ok || !body.item) throw new Error(body.error || "Please try again.");
      onNote(body.item);
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const engine = { step, result, busy: busy || paused, onAnswer: answer };
  const activity = station.activity;
  /* A new step, or a new try at the same one, is a fresh piece of thinking: re-mounting
     is how the clues close again and the trail empties, without an effect that reaches
     into the engine's own state from outside. */
  const run = `${step}:${attempt}`;

  return (
    <section className="lab-room" data-view="station" data-strand={topic.strand}>
      <KidButton label="Leave this station" tone="quiet" onPress={onLeave} />

      <h1 className="lab-station-title">{station.title}</h1>

      {error && <p className="lab-trouble" role="alert">{error}</p>}

      {activity.kind === "predict" && <PredictEngine key={run} {...engine} activity={activity} />}
      {activity.kind === "sort" && <SortEngine key={run} {...engine} activity={activity} />}
      {activity.kind === "sequence" && <SequenceEngine key={run} {...engine} activity={activity} />}
      {activity.kind === "label" && (
        <LabelEngine
          {...engine}
          activity={activity}
          found={labels.found}
          ask={labels.ask ?? activity.askFor}
          missed={labels.missed}
        />
      )}
      {activity.kind === "fair-test" && <FairTestEngine key={run} {...engine} activity={activity} />}

      {result && (
        <div className="lab-findings" data-correct={result.correct || undefined}>
          {/*
            Nova says the same thing whether the prediction matched or not. She is not
            grading; she is reporting what the apparatus did. That is what keeps a wrong
            prediction feeling like evidence rather than like a mark.
          */}
          <span className="lab-guide">
            <CastFigure who="nova" state={result.correct ? "celebrate" : "explain"} talking />
          </span>
          <div>
            <SpeechBubble line={{ who: "nova", text: result.response }} onReplay={() => speak(result.response)} />
            <p className="lab-observation">{result.observation}</p>
            {result.because && <p className="lab-observation">{result.because}</p>}
          </div>
        </div>
      )}

      {result && !result.finished && (
        <div className="lab-commit">
          {result.correct || activity.kind === "predict" || activity.kind === "sort" ? (
            <KidButton label="Next" size="primary" onPress={goOn} />
          ) : (
            <KidButton label="Try again" size="primary" onPress={retry} />
          )}
        </div>
      )}

      {result?.finished && (
        <section className="lab-conclusion">
          <h2>What we found out</h2>
          <p className="lab-explain">{result.explain}</p>

          {station.vocabulary.length > 0 && (
            <dl className="lab-words">
              {station.vocabulary.map((entry) => (
                <div key={entry.word}>
                  <dt>{entry.word}</dt>
                  <dd>{entry.meaning}</dd>
                </div>
              ))}
            </dl>
          )}

          <label className="lab-notebook">
            <span>{result.notebook}</span>
            <textarea
              value={note}
              maxLength={600}
              disabled={busy || saved || paused}
              onChange={(event) => setNote(event.target.value)}
            />
          </label>
          <div className="lab-commit">
            <KidButton
              label={saved ? "Saved in your notebook" : "Save it in my notebook"}
              tone="sun"
              state={saved ? "right" : "idle"}
              disabled={busy || saved || paused || !note.trim()}
              onPress={saveNote}
            />
          </div>

          {/*
            The off-screen invitation is the last thing on the screen, and it is written
            for the grown-up as much as for the child. It is the one part of the lab that
            asks them to put the tablet down, which is why it is not a reward for
            finishing — it is where finishing leads.
          */}
          <aside className="lab-offscreen">
            <h3>Try it for real</h3>
            <p>{result.offscreen}</p>
          </aside>

          <div className="lab-commit">
            <KidButton label="Back to the shelf" size="primary" onPress={onLeave} />
          </div>
        </section>
      )}
    </section>
  );
}
