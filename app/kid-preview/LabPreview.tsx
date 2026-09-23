"use client";

import { useMemo, useState } from "react";
import { KidSurfaceProvider } from "@/components/kid";
import {
  FairTestEngine,
  LabelEngine,
  PredictEngine,
  SequenceEngine,
  SortEngine,
  type LabAnswer,
} from "@/components/kid/lab/engines";
import { LabObject } from "@/components/kid/lab/objects";
import { LabShelf, LabShelves } from "@/components/kid/lab/WonderLab";
import { allLabStations, judgeLabAttempt, labStationById, publicLab, publicStation, stationSteps } from "@/lib/science/lab";
import { labTiers, type LabResult, type LabTier } from "@/lib/science/types";
import type { LearningBandId } from "@/lib/learning-bands";

/**
 * Every Wonder Lab station, on one page, in development only.
 *
 * The lab's own screens need a signed-in family and a live Supabase, which makes the
 * thing that most needs looking at — the apparatus, the objects, the engines and how all
 * of it lays out at four viewports — the hardest thing in the product to actually see.
 * This is the same check `KidPreview` already gives the primitives.
 *
 * It judges answers in the browser by calling `judgeLabAttempt` directly, which is the
 * one place in the codebase that is allowed to: this route 404s in production (see
 * `page.tsx`), carries no child data, writes no events and needs no session. Nothing here
 * is a shortcut the real lab takes — `WonderLab` always asks the server (§A).
 */
export function LabPreview({ band }: { band: LearningBandId }) {
  const [tier, setTier] = useState<LabTier>("investigator");
  const [stationId, setStationId] = useState(allLabStations[0].id);
  const [step, setStep] = useState(0);
  const [result, setResult] = useState<LabResult | null>(null);
  const [labels, setLabels] = useState<{ found: Record<string, string>; ask: { id: string; label: string } | null }>(
    { found: {}, ask: null },
  );
  const [run, setRun] = useState(0);
  /* "shelves" and "shelf" are the two screens a child actually arrives on, and neither
     can be reached in a browser without a family. `station` is the default because it is
     what most changes while the lab is being built. */
  const [view, setView] = useState<"station" | "shelves" | "shelf">("station");
  const topics = useMemo(() => publicLab(tier, new Set<string>()), [tier]);

  const found = labStationById(stationId)!;
  const offered = allLabStations.filter((station) => station.tiers.includes(tier));
  const station = useMemo(
    () => publicStation(found.topic, found.station, tier, new Set<string>()),
    [found.topic, found.station, tier],
  );

  function reset(next = stationId) {
    setStationId(next);
    setStep(0);
    setResult(null);
    setLabels({ found: {}, ask: null });
    setRun((value) => value + 1);
  }

  function answer(payload: LabAnswer) {
    const judged = judgeLabAttempt(found.station, tier, { step, ...payload });
    if (!judged) return;
    setResult(judged.result);
    if (judged.result.reveal || judged.result.nextAsk) {
      setLabels((current) => ({
        found: judged.result.reveal
          ? { ...current.found, [judged.result.reveal.spot]: judged.result.reveal.name }
          : current.found,
        ask: judged.result.nextAsk ?? current.ask,
      }));
    }
  }

  const engine = { step, result, busy: false, onAnswer: answer };
  const activity = station.activity;

  return (
    <KidSurfaceProvider value={{ band, narration: false, world: "lab" }}>
      <div className="preview-page" data-band={band} data-kid-world="lab">
        <header className="preview-bar">
          <label>
            Tier
            <select value={tier} onChange={(event) => { setTier(event.target.value as LabTier); reset(); }}>
              {labTiers.map((name) => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </label>
          <label>
            Station
            <select value={stationId} onChange={(event) => reset(event.target.value)}>
              {offered.map((one) => (
                <option key={one.id} value={one.id}>{one.id}</option>
              ))}
            </select>
          </label>
          <button type="button" onClick={() => { setStep((value) => Math.min(value + 1, stationSteps(found.station) - 1)); setResult(null); setRun((v) => v + 1); }}>
            Next step
          </button>
          <button type="button" onClick={() => reset()}>Restart</button>
          <label>
            Screen
            <select value={view} onChange={(event) => setView(event.target.value as typeof view)}>
              <option value="station">station</option>
              <option value="shelf">shelf</option>
              <option value="shelves">shelves</option>
            </select>
          </label>
          <span>{`step ${step + 1} of ${stationSteps(found.station)} · ${activity.kind}`}</span>
        </header>

        {view === "shelves" && (
          <LabShelves topics={topics} band={band} onOpen={() => setView("shelf")} noteCount={0} />
        )}
        {view === "shelf" && (
          <LabShelf
            topic={topics.find((one) => one.id === found.topic.id) ?? topics[0]}
            notes={[]}
            onOpen={(id) => { reset(id); setView("station"); }}
            onLeave={() => setView("shelves")}
          />
        )}
        {view === "station" && (
        <section className="lab-room" data-view="station" data-strand={found.topic.strand}>
          <h1 className="lab-station-title">{station.title}</h1>

          {activity.kind === "predict" && <PredictEngine key={run} {...engine} activity={activity} />}
          {activity.kind === "sort" && <SortEngine key={run} {...engine} activity={activity} />}
          {activity.kind === "sequence" && <SequenceEngine key={run} {...engine} activity={activity} />}
          {activity.kind === "label" && (
            <LabelEngine
              {...engine}
              activity={activity}
              found={labels.found}
              ask={labels.ask ?? activity.askFor}
              missed={Boolean(result && !result.correct)}
            />
          )}
          {activity.kind === "fair-test" && <FairTestEngine key={run} {...engine} activity={activity} />}

          {result && (
            <div className="lab-findings" data-correct={result.correct || undefined}>
              <span className="lab-shelf-art">
                <LabObject art={found.topic.art} className="lab-object lab-object-large" />
              </span>
              <div>
                <p className="lab-observation">{result.response}</p>
                <p className="lab-observation">{result.observation}</p>
                {result.because && <p className="lab-observation">{result.because}</p>}
              </div>
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
              <p className="lab-notebook"><span>{result.notebook}</span></p>
              <aside className="lab-offscreen">
                <h3>Try it for real</h3>
                <p>{result.offscreen}</p>
              </aside>
            </section>
          )}
        </section>
        )}
      </div>
    </KidSurfaceProvider>
  );
}
