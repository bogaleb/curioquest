"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import type { PublicBuildLevel, PublicWorkshop } from "@/lib/build/public";
import type { BuildSubmission, BuildWorkshopId, MapLevel, RobotLevel, ShapesLevel, TowerLevel } from "@/lib/build/types";
import type { LabTier } from "@/lib/science/types";
import { stopReading } from "@/lib/speech";
import { AudioButton } from "@/components/reading/AudioButton";
import { CastFigure } from "@/components/kid/art/cast";
import { ProgressTrail } from "@/components/kid/ProgressTrail";
import { SpeechBubble } from "@/components/kid/SpeechBubble";
import { BuildIcon, WorkshopArt } from "./art";
import { MapMaker, RobotGarage, ShapeWorkshop, TowerLab, type BuildResult } from "./workshops";

/**
 * The Build Yard.
 *
 * Four workshops — coding, geography, science and maths — where every job is to make
 * something and then test it. What replaced it was a six-by-six grid of emoji with a
 * checklist beside it, which asked nothing, checked nothing and taught nothing.
 *
 * Each build walks the same loop, because it is the loop the learning is in:
 *
 *   1. the big idea      prior knowledge or a worked example, before the child starts
 *   2. build             the construction itself — active, and theirs
 *   3. test              the server judges it; the robot drives, the tower stands or falls
 *   4. hint, if needed   only after a miss, and the attempt after it is recorded as helped
 *   5. why it worked     the explanation, and where else the idea turns up (transfer)
 *
 * Data comes through `source`, so the development preview can drive the same screens
 * without a family session; the real one talks to `/api/build`.
 */

export type YardData = { tier: LabTier; workshops: PublicWorkshop[] };
export type YardSource = {
  load: (signal: AbortSignal) => Promise<YardData>;
  attempt: (input: { level: string; build: BuildSubmission; session: string; startedAt: number; hinted: boolean }) => Promise<BuildResult & { stars?: number }>;
};

export function apiSource(profileId: string): YardSource {
  return {
    async load(signal) {
      const response = await fetch(`/api/build?profile=${encodeURIComponent(profileId)}`, { signal });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Please try again.");
      return body as YardData;
    },
    async attempt(input) {
      const response = await fetch("/api/build", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "attempt", profile: profileId, ...input }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Please try again.");
      return body;
    },
  };
}

const newSession = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `s-${Date.now()}-${Math.round(Math.random() * 1e6)}`);

export function BuildYard({ source, paused, onStars }: { source: YardSource; paused: boolean; onStars?: (stars: number) => void }) {
  const [data, setData] = useState<YardData | null>(null);
  const [error, setError] = useState("");
  const [workshopId, setWorkshopId] = useState<BuildWorkshopId | null>(null);
  const [levelId, setLevelId] = useState<string | null>(null);
  const top = useRef<HTMLElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    source.load(controller.signal).then(setData).catch((cause) => {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Please try again.");
    });
    return () => { controller.abort(); stopReading(); };
  }, [source]);

  const go = useCallback((workshop: BuildWorkshopId | null, level: string | null) => {
    stopReading();
    setWorkshopId(workshop);
    setLevelId(level);
    requestAnimationFrame(() => top.current?.scrollIntoView({ block: "start", behavior: "instant" as ScrollBehavior }));
  }, []);

  const markDone = useCallback((id: string) => {
    setData((current) => current && {
      ...current,
      workshops: current.workshops.map((w) => ({ ...w, levels: w.levels.map((l) => (l.id === id ? { ...l, done: true } : l)) })),
    });
  }, []);

  if (error) return <section data-kid-world="workshop" className="build-yard" ref={top}><p className="build-trouble" role="alert">{error}</p></section>;
  if (!data) return <section data-kid-world="workshop" className="build-yard" ref={top} aria-busy="true"><p className="build-gate">Opening the Build Yard…</p></section>;

  const workshop = data.workshops.find((w) => w.id === workshopId) ?? null;
  const level = workshop?.levels.find((l) => l.id === levelId) ?? null;

  if (workshop && level) {
    const index = workshop.levels.indexOf(level);
    const next = workshop.levels[index + 1] ?? null;
    return (
      <section data-kid-world="workshop" className="build-yard" data-view="build" data-workshop={workshop.id} ref={top}>
        <LevelPlayer
          key={level.id}
          level={level}
          workshop={workshop}
          number={index + 1}
          paused={paused}
          source={source}
          onDone={() => markDone(level.id)}
          onStars={onStars}
          onBack={() => go(workshop.id, null)}
          onNext={next ? () => go(workshop.id, next.id) : null}
        />
      </section>
    );
  }

  if (workshop) {
    const done = workshop.levels.filter((l) => l.done).length;
    const suggested = workshop.levels.find((l) => !l.done) ?? null;
    return (
      <section data-kid-world="workshop" className="build-yard" data-view="workshop" data-workshop={workshop.id} ref={top}>
        <button type="button" className="build-back" onClick={() => go(null, null)}><BuildIcon name="back" size={20} />The yard</button>
        <header className="build-workshop-head">
          <span className="build-sign-art"><WorkshopArt workshop={workshop.id} /></span>
          <div>
            <span className="build-subject">{workshop.subject}</span>
            <h1>{workshop.name}</h1>
            <p>{workshop.blurb}</p>
            <ProgressTrail total={workshop.levels.length} done={done} label={`${done} of ${workshop.levels.length} built`} />
          </div>
        </header>
        <ol className="build-jobs">
          {workshop.levels.map((l, i) => (
            <li key={l.id}>
              <button type="button" className="build-job" data-done={l.done || undefined} data-next={l === suggested || undefined} onClick={() => go(workshop.id, l.id)}>
                <span className="build-job-number" aria-hidden="true">{l.done ? <BuildIcon name="done" size={22} /> : i + 1}</span>
                <span className="build-job-name">{l.title}</span>
                <span className="build-job-goal">{l.goal}</span>
                {l === suggested && <span className="build-job-tag">Next</span>}
              </button>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  const total = data.workshops.reduce((sum, w) => sum + w.levels.length, 0);
  const built = data.workshops.reduce((sum, w) => sum + w.levels.filter((l) => l.done).length, 0);
  return (
    <section data-kid-world="workshop" className="build-yard" data-view="yard" ref={top}>
      <header className="build-welcome">
        <span className="build-guide"><CastFigure who="nova" state="point" /></span>
        <div>
          <h1>The Build Yard</h1>
          <SpeechBubble line={{ who: "nova", text: built ? `You have built ${built} things! What next?` : "Pick a workshop. Build it, then test it!" }} />
        </div>
      </header>
      <p className="kid-sr-only">{`${built} of ${total} builds finished.`}</p>
      <ul className="build-workshops">
        {data.workshops.map((w) => {
          const done = w.levels.filter((l) => l.done).length;
          return (
            <li key={w.id}>
              <button type="button" className="build-sign" data-workshop={w.id} data-complete={done === w.levels.length || undefined} onClick={() => go(w.id, null)}>
                <span className="build-sign-art"><WorkshopArt workshop={w.id} /></span>
                <span className="build-subject">{w.subject}</span>
                <span className="build-sign-name">{w.name}</span>
                <span className="build-sign-blurb">{w.blurb}</span>
                <span className="build-sign-meter" style={{ "--done": done / w.levels.length } as CSSProperties} aria-hidden="true"><span /></span>
                <span className="build-sign-count">{done} of {w.levels.length} built</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/* --------------------------------------------------------------- player -- */

function LevelPlayer({
  level, workshop, number, paused, source, onDone, onStars, onBack, onNext,
}: {
  level: PublicBuildLevel;
  workshop: PublicWorkshop;
  number: number;
  paused: boolean;
  source: YardSource;
  onDone: () => void;
  onStars?: (stars: number) => void;
  onBack: () => void;
  onNext: (() => void) | null;
}) {
  const [stage, setStage] = useState<"idea" | "build">("idea");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [misses, setMisses] = useState(0);
  const [hintOpen, setHintOpen] = useState(false);
  const [result, setResult] = useState<BuildResult | null>(null);
  const [attempt, setAttempt] = useState(0);
  // Both are set when building starts, not during render: a render must stay pure.
  const session = useRef("");
  const startedAt = useRef(0);

  const predictOnly = level.workshop === "tower" && (level as unknown as TowerLevel).rule.kind === "predict";
  const solved = !!result?.correct;
  // A prediction is a one-shot: once the tower has been tested the answer is known, so a
  // wrong guess still ends the job — with the explanation, and nothing recorded as done.
  const finished = solved || (predictOnly && !!result);

  const submit = useCallback(async (build: BuildSubmission) => {
    if (paused) { setMessage("A grown-up has paused play for now."); return null; }
    setBusy(true);
    try {
      session.current ||= newSession();
      const answer = await source.attempt({ level: level.id, build, session: session.current, startedAt: startedAt.current || Date.now(), hinted: hintOpen });
      setResult(answer);
      setMessage(answer.message);
      if (answer.correct) onDone();
      else setMisses((m) => m + 1);
      if (typeof answer.stars === "number") onStars?.(answer.stars);
      startedAt.current = Date.now();
      return answer;
    } catch (cause) {
      setMessage(cause instanceof Error ? cause.message : "Please try again.");
      return null;
    } finally {
      setBusy(false);
    }
  }, [paused, source, level.id, hintOpen, onDone, onStars]);

  const onMessage = useCallback((text: string) => {
    setMessage(text);
    if (text) setResult((current) => (current?.correct ? current : null));
  }, []);

  const props = { busy: busy || paused, solved: finished, submit, onMessage };
  return (
    <>
      <div className="build-player-top">
        <button type="button" className="build-back" onClick={onBack}><BuildIcon name="back" size={20} />{workshop.name}</button>
        <span className="build-player-count">{number} of {workshop.levels.length}</span>
      </div>
      <h1 className="build-title">{level.title}</h1>

      <div className="build-ask">
        <span className="build-guide"><CastFigure who="nova" state={solved ? "celebrate" : misses ? "encourage" : "explain"} /></span>
        <SpeechBubble line={{ who: "nova", text: level.goal }} />
        <AudioButton text={level.goal} label="Hear the job" />
      </div>

      {stage === "idea" ? (
        <div className="build-idea">
          <span className="build-idea-mark"><BuildIcon name="idea" size={28} /></span>
          <div>
            <h2>Big idea</h2>
            <p>{level.idea}</p>
            <AudioButton text={level.idea} label="Hear the big idea" />
          </div>
          <button type="button" className="build-primary" onClick={() => { setStage("build"); startedAt.current = Date.now(); }}>
            Let&rsquo;s build<BuildIcon name="next" size={20} />
          </button>
        </div>
      ) : (
        <>
          <details className="build-idea-mini">
            <summary><BuildIcon name="idea" size={18} />Big idea</summary>
            <p>{level.idea}</p>
          </details>
          {level.workshop === "robot" && <RobotGarage key={attempt} level={level as PublicBuildLevel & RobotLevel} {...props} />}
          {level.workshop === "map" && <MapMaker key={attempt} level={level as PublicBuildLevel & MapLevel} {...props} />}
          {level.workshop === "tower" && <TowerLab key={attempt} level={level as PublicBuildLevel & TowerLevel} {...props} />}
          {level.workshop === "shapes" && <ShapeWorkshop key={attempt} level={level as PublicBuildLevel & ShapesLevel} {...props} />}

          {message && !solved && <p className="build-feedback" role="status" data-kind={result && !result.correct ? "miss" : "note"}>{message}</p>}

          {misses > 0 && !finished && (
            hintOpen
              ? <p className="build-hint"><BuildIcon name="idea" size={20} /> {level.hint}</p>
              : <button type="button" className="build-secondary build-hint-button" onClick={() => setHintOpen(true)}><BuildIcon name="idea" size={18} />I&rsquo;d like a hint</button>
          )}

          {finished && (
            <div className="build-done" data-correct={solved || undefined} role="status">
              <span className="build-guide"><CastFigure who="nova" state={solved ? "celebrate" : "explain"} /></span>
              <div>
                <h2>{solved ? "It works!" : "Now you know!"}</h2>
                <p className="build-done-message">{result?.message}</p>
                {result?.success && <p className="build-why">{result.success}</p>}
                {solved && result?.firstTime && <span className="build-star"><BuildIcon name="star" size={20} />+1 star</span>}
              </div>
              <div className="build-actions">
                <button type="button" className="build-secondary" onClick={() => { setResult(null); setMessage(""); setAttempt((a) => a + 1); session.current = newSession(); }}>
                  <BuildIcon name="again" size={18} />Build it again
                </button>
                {onNext
                  ? <button type="button" className="build-primary" onClick={onNext}>Next build<BuildIcon name="next" size={20} /></button>
                  : <button type="button" className="build-primary" onClick={onBack}>Back to the workshop<BuildIcon name="next" size={20} /></button>}
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
}
