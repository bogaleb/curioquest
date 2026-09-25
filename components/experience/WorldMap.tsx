"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { CastFigure } from "@/components/kid/art/cast";
import { PlaceArt } from "@/components/kid/PlaceArt";
import { stopReading } from "@/lib/speech";
import { useExperience, ExperienceError } from "./use-experience";
import { ItemArt } from "./ItemArt";
import { CreatureGrove } from "./CreatureGrove";
import { WorldDestinations } from "./WorldDestinations";
import { Treehouse } from "./Treehouse";
import type { ExperienceView } from "@/lib/experience/types";

type Zone = "plaza" | "treehouse" | "grove";

const zones: { id: Zone; label: string; short: string }[] = [
  { id: "plaza", label: "World Map", short: "Map" },
  { id: "treehouse", label: "My Treehouse", short: "Room" },
  { id: "grove", label: "Creature Grove", short: "Grove" },
];

export function WorldMap({
  profileId,
  name,
  onAdventure,
  onNavigate,
  onStars,
  paused = false,
}: {
  paused?: boolean;
  profileId: string;
  name: string;
  onAdventure: () => void;
  onNavigate: (view: string) => void;
  onStars: (stars: number) => void;
}) {
  const { data, busy, error, act, refresh } = useExperience(profileId);
  return (
    <WorldHub
      name={name}
      data={data}
      busy={busy}
      error={error}
      refresh={refresh}
      act={act}
      onAdventure={onAdventure}
      onNavigate={onNavigate}
      onStars={onStars}
      paused={paused}
    />
  );
}

export function WorldHub({
  name,
  data,
  busy,
  error,
  refresh,
  act,
  onAdventure,
  onNavigate,
  onStars,
  paused = false,
}: {
  paused?: boolean;
  name: string;
  data: ExperienceView | null;
  busy: boolean;
  error: string;
  refresh: () => void;
  act: (action: string, extra?: Record<string, unknown>) => Promise<ExperienceView | null>;
  onAdventure: () => void;
  onNavigate: (view: string) => void;
  onStars: (stars: number) => void;
}) {
  const [notes, setNotes] = useState<string[]>([]);
  const [zone, setZone] = useState<Zone>("plaza");

  useEffect(() => () => stopReading(), []);

  const earned = useMemo(() => {
    if (!data) return [];
    return data.items.filter((item) => data.inventory.some((entry) => entry.item_id === item.id));
  }, [data]);

  return (
    <section className="my-world cq-world-hub" data-zone={zone} data-kid-world="treehouse">
      <ExperienceError error={error} refresh={refresh} busy={busy} />

      <header className="world-hero">
        <div>
          <span className="eyebrow">My world</span>
          <h1>{name}&apos;s CurioQuest world</h1>
          <p>A story in the trees. A question in the lab. Something wonderful made by you. Where will your curiosity take you?</p>
          <div className="world-hero-actions">
            <button type="button" className="primary" disabled={busy || paused} onClick={onAdventure}>
              Start today&apos;s trail <ArrowRight size={18} />
            </button>
            <button type="button" className="secondary" onClick={() => setZone("treehouse")}>
              Open my treehouse
            </button>
          </div>
        </div>
        <div className="world-hero-scene" aria-hidden="true">
          <span className="world-sun" />
          <span className="world-cloud" data-at="1" />
          <span className="world-cloud" data-at="2" />
          <span className="world-place" data-place="reading"><PlaceArt id="reading" /></span>
          <span className="world-place" data-place="science"><PlaceArt id="science" /></span>
          <span className="world-place" data-place="studio"><PlaceArt id="studio" /></span>
          <span className="world-place" data-place="myworld"><PlaceArt id="myworld" /></span>
          <span className="world-nova"><CastFigure who="nova" state="point" facing="left" /></span>
        </div>
      </header>

      <nav className="world-tabs" aria-label="World areas">
        {zones.map((item) => (
          <button
            key={item.id}
            type="button"
            className={zone === item.id ? "active" : ""}
            aria-pressed={zone === item.id}
            onClick={() => { stopReading(); setZone(item.id); }}
          >
            <span>{item.label}</span>
            <small>{item.short}</small>
          </button>
        ))}
      </nav>

      {paused && <p role="status" className="world-loading">Time for a rest. Your world will be here when you return.</p>}

      {zone === "treehouse" && !data ? (
        <p role="status" className="world-loading">Opening your world...</p>
      ) : zone === "treehouse" && data ? (
        <Treehouse
          data={data}
          busy={busy || paused}
          onPlace={(slot, item) => {
            void act("place", { slot, item }).then((next) => {
              if (next) onStars(next.stars);
            });
          }}
        />
      ) : zone === "grove" ? (
        <CreatureGrove onNavigate={onNavigate} disabled={busy || paused} notes={notes} onKeep={(id) => setNotes((current) => current.includes(id) ? current : [...current, id])} />
      ) : (
        <section className="world-plaza-v2">
          <WorldDestinations onNavigate={onNavigate} disabled={busy || paused} />

          <aside className="world-bag-preview" aria-label="Things in your bag">
            <div>
              <span className="eyebrow">My bag</span>
              <h2>{!data ? "Opening your bag?" : earned.length ? `${earned.length} things earned` : "Your first thing is waiting"}</h2>
              <p>Bring a little piece of your adventure home. Choose something from your bag, then give it a place in your treehouse.</p>
            </div>
            <button className="secondary" onClick={() => setZone("treehouse")}>Decorate my treehouse <ArrowRight size={18} /></button>
            <div className="world-bag-items">
              {earned.slice(0, 4).map((item) => (
                <span key={item.id} title={item.name}>
                  <ItemArt art={item.art} />
                </span>
              ))}
              {!earned.length && (
                <button type="button" disabled={busy || paused} onClick={onAdventure}>
                  Follow the trail <ArrowRight size={18} />
                </button>
              )}
            </div>
          </aside>
        </section>
      )}
    </section>
  );
}
