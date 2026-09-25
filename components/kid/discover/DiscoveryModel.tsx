"use client";
import { useState } from "react";
import type { PublicDiscoveryLesson } from "@/lib/discover/types";

/** Explorations provide a model, not assessed evidence. No score is sent for playing. */
export function DiscoveryModel({ lesson, paused }: { lesson: PublicDiscoveryLesson; paused: boolean }) {
  if (lesson.id === "picnic-count") return <CountingModel paused={paused}/>;
  if (lesson.id === "shadow-play") return <ShadowModel paused={paused}/>;
  if (lesson.id === "seed-secret") return <SeedModel paused={paused}/>;
  if (lesson.id === "little-map") return <MapModel paused={paused}/>;
  return null;
}

function CountingModel({ paused }: { paused: boolean }) {
  const [counted, setCounted] = useState<number[]>([]);
  const [spread, setSpread] = useState(false);
  return <section className="discovery-model" aria-label="Explore counting">
    <span className="discovery-eyebrow">Touch each one, just once</span>
    <div className="discovery-counting-model" data-spread={spread || undefined}>{[0, 1, 2].map((id) => <button type="button" key={id} aria-label={`Count object ${id + 1}`} aria-pressed={counted.includes(id)} disabled={paused || counted.includes(id)} onClick={() => setCounted((items) => [...items, id])}><svg viewBox="0 0 60 60" aria-hidden="true"><path d="M31 18C3 0 1 51 25 53L32 51C58 63 63 6 31 18" fill="var(--kid-coral-300)" stroke="var(--kid-coral-ink)" strokeWidth="2"/><path d="M31 18Q29 7 37 4" fill="none" stroke="var(--kid-leaf-ink)" strokeWidth="3"/><path d="M33 11Q42 0 50 7Q45 17 33 11" fill="var(--kid-leaf-500)"/></svg><span>{counted.includes(id) ? counted.indexOf(id) + 1 : "Tap"}</span></button>)}</div>
    <p role="status">{counted.length === 3 ? "Three altogether. Spread them out: still three!" : `${counted.length} counted. Touch an apple you have not counted yet.`}</p>
    <div className="discovery-model-controls"><button type="button" disabled={paused} onClick={() => setSpread((value) => !value)}>{spread ? "Move closer" : "Spread them out"}</button><button type="button" disabled={paused} onClick={() => setCounted([])}>Count again</button></div>
  </section>;
}

function ShadowModel({ paused }: { paused: boolean }) {
  const [near, setNear] = useState(false);
  const [opaque, setOpaque] = useState(true);
  const objectX = near ? 125 : 228;
  const halfShadow = 19 * (338 - 60) / (objectX - 60);
  return <section className="discovery-model" aria-label="Explore a shadow">
    <span className="discovery-eyebrow">Change one thing. What do you notice?</span>
    <svg className="discovery-model-diagram" viewBox="0 0 400 205" role="img" aria-label={`${opaque ? "Cardboard" : "Clear glass"} ${near ? "near the torch" : "near the wall"}. ${opaque ? `A ${near ? "large" : "small"} dark shadow on the wall.` : "Most light passes through the glass."}`}>
      <path d="M60 100L338 13V187Z" fill="var(--sun-200)"/>
      {opaque && <path d={`M${objectX} 81L${objectX} 119L338 ${100 + halfShadow}V${100 - halfShadow}Z`} fill="var(--kid-ink-soft)" opacity=".3"/>}
      <path d="M338 8V193" stroke="var(--sand-400)" strokeWidth="10"/>
      {opaque && <path d={`M338 ${100 - halfShadow}V${100 + halfShadow}`} stroke="var(--kid-ink)" strokeWidth="10"/>}
      <rect x="17" y="85" width="45" height="30" rx="6" fill="var(--kid-sky-500)"/><path d="M55 79V121" stroke="var(--kid-sky-ink)" strokeWidth="8"/>
      <rect x={objectX - 5} y="81" width="10" height="38" rx="2" fill={opaque ? "var(--kid-coral-500)" : "var(--kid-sky-100)"} stroke={opaque ? "var(--kid-coral-ink)" : "var(--kid-sky-500)"} strokeWidth="2"/>
      <path d="M18 195H356" stroke="var(--sand-300)" strokeWidth="2"/>
    </svg>
    <div className="discovery-model-controls" role="group" aria-label="Change the shadow model"><button type="button" aria-pressed={near} disabled={paused} onClick={() => setNear((value) => !value)}>{near ? "Move toward the wall" : "Move toward the torch"}</button><button type="button" aria-pressed={!opaque} disabled={paused} onClick={() => setOpaque((value) => !value)}>{opaque ? "Try clear glass" : "Try cardboard"}</button></div>
    <p role="status">{opaque ? near ? "Closer to the torch: a larger shadow on the same wall." : "Closer to the wall: a smaller shadow." : "Clear glass lets most light through. Real glass can also reflect and bend some light."}</p>
    <small>Simplified side view. The torch and wall stay still.</small>
  </section>;
}

function SeedModel({ paused }: { paused: boolean }) {
  const [step, setStep] = useState(0);
  const stages = ["A bean seed", "A root begins to grow", "A young plant with leaves"];
  return <section className="discovery-model" aria-label="Explore how a bean grows">
    <span className="discovery-eyebrow">Look closely, over time</span>
    <svg className="discovery-model-diagram" viewBox="0 0 400 205" role="img" aria-label={stages[step]}>
      <path d="M38 130Q107 118 189 130T362 130V192H38Z" fill="var(--sand-300)"/>
      <path d="M38 130Q107 118 189 130T362 130" stroke="var(--kid-leaf-500)" fill="none" strokeWidth="4"/>
      <ellipse cx="194" cy="140" rx="16" ry="11" transform="rotate(-30 194 140)" fill="var(--sun-500)"/>
      {step > 0 && <path d="M190 146Q180 165 195 185M188 162L171 172M191 175L211 182" fill="none" stroke="var(--surface)" strokeWidth="4" strokeLinecap="round"/>}
      {step > 1 && <g><path d="M200 136Q190 108 205 61" stroke="var(--kid-leaf-600)" fill="none" strokeWidth="5"/><path d="M201 102Q152 109 154 73Q187 67 201 102M202 88Q247 91 259 56Q217 47 202 88" fill="var(--kid-leaf-500)"/><circle cx="305" cy="39" r="20" fill="var(--sun-400)"/></g>}
    </svg>
    <p role="status">{stages[step]}</p>
    <div className="discovery-model-controls"><button type="button" disabled={paused || step === 0} onClick={() => setStep((n) => n - 1)}>Earlier</button><button type="button" disabled={paused || step === 2} onClick={() => setStep((n) => n + 1)}>Later</button></div>
    <small>These are drawings of stages. Real growth takes days, not taps. Different plants grow at different rates.</small>
  </section>;
}

function MapModel({ paused }: { paused: boolean }) {
  const [place, setPlace] = useState<"park" | "library" | "pond">("park");
  const lines = { park: "The park is our starting point. The library is east of the park. The pond is west.", library: "The library is east of the park. To return to the park, go west.", pond: "The pond is west of the park. To return to the park, go east." };
  return <section className="discovery-model" aria-label="Explore a north-up map">
    <span className="discovery-eyebrow">A tiny town, seen from above</span>
    <div className="discovery-map-model"><span className="discovery-north">↑ North</span><div className="discovery-map-places">{(["pond", "park", "library"] as const).map((id) => <button type="button" key={id} data-place={id} disabled={paused} aria-pressed={place === id} onClick={() => setPlace(id)}>
      <svg viewBox="0 0 70 70" aria-hidden="true">{id === "pond" ? <><ellipse cx="35" cy="41" rx="28" ry="19" fill="var(--kid-sky-300)"/><path d="M18 40Q26 33 34 40T52 40" fill="none" stroke="var(--surface)" strokeWidth="3"/></> : id === "park" ? <><path d="M35 35V62" stroke="var(--sun-600)" strokeWidth="8"/><circle cx="35" cy="25" r="23" fill="var(--kid-leaf-500)"/></> : <><path d="M8 26L35 8 62 26Z" fill="var(--kid-coral-400)"/><rect x="14" y="26" width="43" height="35" rx="2" fill="var(--sun-200)"/><path d="M25 34V52M35 34V52M45 34V52" stroke="var(--surface)" strokeWidth="5"/></>}</svg><span>{id === "pond" ? "Pond" : id === "park" ? "Park" : "Library"}</span>
    </button>)}</div><span className="discovery-map-key">West ← &nbsp; &nbsp; → East</span></div>
    <p role="status">{lines[place]}</p><small>The pictures are symbols. This model keeps north at the top.</small>
  </section>;
}
