"use client";

import { useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Compass, Volume2 } from "lucide-react";
import { PlaceArt } from "@/components/kid/PlaceArt";
import { readAloud, stopReading } from "@/lib/speech";
import { worldGuide, type WorldGuide } from "@/lib/world-guide";

export function WorldDestinations({ onNavigate, disabled = false }: { onNavigate: (id: string) => void; disabled?: boolean }) {
  const returnTo = useRef<string | null>(null);
  const [category, setCategory] = useState("All places");
  const [selected, setSelected] = useState<WorldGuide | null>(null);
  const places = worldGuide.filter((place) => category === "All places" || place.category === category);

  if (selected) return (
    <section className="atlas-detail atlas-enter" data-kid-world={selected.world} aria-label={selected.title}>
      <button className="atlas-back" onClick={() => { stopReading(); returnTo.current = selected.id; setSelected(null); }}><ArrowLeft size={18} /> All places</button>
      <div className="atlas-detail-grid">
        <div className="atlas-detail-art" aria-hidden="true"><PlaceArt id={selected.id} /><span>A little curiosity goes a long way</span></div>
        <div className="atlas-detail-copy">
          <span className="eyebrow">Your next little adventure</span>
          <h2 tabIndex={-1} ref={(node) => { node?.focus({ preventScroll: true }); }}>{selected.title}</h2>
          <p className="atlas-question">{selected.question}</p>
          <ol className="atlas-steps">{selected.steps.map((step, i) => <li key={step}><span>{i + 1}</span>{step}</li>)}</ol>
          <div className="atlas-pocket"><Compass size={24} /><p>{selected.takeaway}</p></div>
          <div className="world-hero-actions">
            <button className="primary" disabled={disabled} onClick={() => { stopReading(); onNavigate(selected.id); }}>Enter {selected.title} <ArrowRight size={18} /></button>
            <button className="secondary" onClick={() => readAloud(`${selected.title}. ${selected.question} ${selected.steps.join(" ")} ${selected.takeaway}`)}><Volume2 size={18} /> Listen</button>
          </div>
        </div>
      </div>
    </section>
  );

  return (
    <section className="atlas" aria-labelledby="atlas-title">
      <div className="atlas-heading"><div><span className="eyebrow">Pick a place. Find your wonder.</span><h2 id="atlas-title">Where shall we go?</h2></div><span className="atlas-count">{worldGuide.length} places to discover</span></div>
      <div className="atlas-filters" aria-label="Kinds of adventure">{["All places", "Explore", "Make", "Together"].map((filter) => <button key={filter} aria-pressed={filter === category} onClick={() => setCategory(filter)}>{filter}</button>)}</div>
      <div className="atlas-grid">{places.map((place, index) => (
        <button key={place.id} ref={(node) => { if (node && returnTo.current === place.id) { node.focus({ preventScroll: true }); returnTo.current = null; } }} className="atlas-card atlas-enter" data-kid-world={place.world} style={{ animationDelay: `${index * 35}ms` }} onClick={() => setSelected(place)}>
          <span className="atlas-card-scene" aria-hidden="true"><span className="atlas-orbit" /><PlaceArt id={place.id} /></span>
          <span className="atlas-card-copy"><small>{place.category}</small><strong>{place.title}</strong><span>{place.invitation}</span><b>Take a peek <ArrowRight size={17} /></b></span>
        </button>
      ))}</div>
    </section>
  );
}
