"use client";

import { useState } from "react";
import {
  Bloom,
  Bush,
  CastFigure,
  Celebration,
  FarCanopy,
  FarHills,
  ForeLeaves,
  GrassTuft,
  GroundBand,
  Placeholder,
  Rock,
  Scene,
  ScenePlane,
  SkyWash,
  SpeechBubble,
  TrailPath,
  Tree,
  type CastName,
  type KidWorld,
} from "@/components/kid";
import type { LearningBandId } from "@/lib/learning-bands";
import type { NovaState } from "@/lib/experience/types";

/**
 * The WP-11 foundation, assembled, so it can be looked at rather than reasoned about.
 *
 * This is the §6 check for the foundation commit: all five depth planes composed into one
 * picture, every piece of scenery, all four characters in every state, and the celebration
 * sequence on a button. Development only — `page.tsx` 404s this route in production.
 *
 * It is a workbench, not a design. The map (WP-11 §3.1) is the screen that has to be
 * beautiful; this one only has to prove the parts work and can be measured at four
 * viewports with the motion preference on and off.
 */

const STATES: NovaState[] = ["idle", "wave", "explain", "listen", "point", "encourage", "celebrate", "dance"];
const CAST: CastName[] = ["nova", "pip", "wren", "bramble"];

export function ScenePreview({ band, world }: { band: LearningBandId; world: KidWorld }) {
  const [pan, setPan] = useState(0);
  const [state, setState] = useState<NovaState>("idle");
  const [talking, setTalking] = useState(false);
  const [party, setParty] = useState(0);

  return (
    <main className="preview-page">
      <nav className="preview-bar" aria-label="Scene preview settings">
        <label>
          Pan
          <input
            type="range"
            min={-1}
            max={1}
            step={0.05}
            value={pan}
            onChange={(event) => setPan(Number(event.target.value))}
          />
        </label>
        <label>
          State
          <select value={state} onChange={(event) => setState(event.target.value as NovaState)}>
            {STATES.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </label>
        <label>
          <input type="checkbox" checked={talking} onChange={(event) => setTalking(event.target.checked)} /> talking
        </label>
        <button type="button" onClick={() => setParty((count) => count + 1)}>Play celebration</button>
      </nav>

      {/* ---- the five planes, composed ---- */}
      <Scene world={world} band={band} pan={pan} label="Scene grammar preview" className="preview-scene">
        <ScenePlane plane="sky">
          <SkyWash />
        </ScenePlane>

        <ScenePlane plane="far">
          <FarHills />
          <span className="preview-far-canopy"><FarCanopy /></span>
        </ScenePlane>

        <ScenePlane plane="mid">
          <GroundBand />
          {/* Three stones lit, four still ahead: the state a child is actually in
              for most of a session, and the one worth looking at. */}
          <span className="preview-trail"><TrailPath done={3} /></span>
          <span className="preview-tree" data-at="1"><Tree tone="mid" /></span>
          <span className="preview-tree" data-at="2"><Tree /></span>
          <span className="preview-tree" data-at="3"><Tree tone="mid" /></span>
        </ScenePlane>

        <ScenePlane plane="near">
          <span className="preview-bush" data-at="1"><Bush /></span>
          <span className="preview-bush" data-at="2"><Bush /></span>
          <span className="preview-rock"><Rock /></span>
          <span className="preview-grass" data-at="1"><GrassTuft /></span>
          <span className="preview-grass" data-at="2"><GrassTuft /></span>
          <span className="preview-bloom" data-at="1"><Bloom tone="a" /></span>
          <span className="preview-bloom" data-at="2"><Bloom tone="b" /></span>
          <span className="preview-bloom" data-at="3"><Bloom tone="c" /></span>
        </ScenePlane>

        <ScenePlane plane="fore">
          <ForeLeaves />
        </ScenePlane>

        <ScenePlane plane="actors" presentational={false}>
          <span className="preview-actor">
            <CastFigure who="nova" state={state} talking={talking} />
          </span>
          <span className="preview-speech">
            <SpeechBubble line={{ who: "nova", text: "Here we are." }} />
          </span>
        </ScenePlane>
      </Scene>

      {/* ---- the cast, every character, every state ---- */}
      <section className="preview-grid" aria-label="The cast">
        {CAST.map((who) => (
          <figure key={who} className="preview-cell">
            <CastFigure who={who} state={state} talking={talking} />
            <figcaption>{who}</figcaption>
          </figure>
        ))}
      </section>

      {/* ---- the celebration, replayable ---- */}
      <section className="preview-celebrate" aria-label="Celebration">
        <Celebration
          key={party}
          object={<Placeholder label="A reward object" />}
          name="A smooth stone"
          who="nova"
        />
      </section>
    </main>
  );
}
