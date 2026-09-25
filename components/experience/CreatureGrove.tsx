"use client";

import { useState } from "react";
import { ArrowRight, Check, Eye, Leaf, Volume2 } from "lucide-react";
import { readAloud, stopReading } from "@/lib/speech";

const creatures = [
  { id: "snail", name: "The slow explorer", label: "Snail", question: "Which part helps protect a snail’s soft body?", options: ["Its shell", "A feather", "A wing"], answer: 0, fact: "A snail carries a hard shell around its soft body. Look closely at the spiral!", notice: "Trace the shell’s spiral in the air. Start in the middle and go around.", care: "Watch from nearby. Leave the snail in the place you found it." },
  { id: "butterfly", name: "The flower visitor", label: "Butterfly", question: "What helps a butterfly fly from flower to flower?", options: ["A shell", "Its wings", "A nest"], answer: 1, fact: "A butterfly has two pairs of wings. The colors and patterns can help us notice how butterflies differ.", notice: "Look at the wings on each side. Which shapes look alike?", care: "Watch without touching its delicate wings. Give it space to land." },
  { id: "bird", name: "The branch lookout", label: "Bird", question: "What covers a bird’s body?", options: ["Fur", "A shell", "Feathers"], answer: 2, fact: "Birds have feathers. Their beaks help them pick up food and other things.", notice: "Look at the beak, wings, and feet. How are they different from yours?", care: "Listen quietly from a distance. Leave nests and eggs alone." },
] as const;

function CreatureDrawing({ kind }: { kind: string }) {
  return <svg viewBox="0 0 400 320" role="img" aria-label={`An illustrated ${kind}`}>
    <ellipse cx="200" cy="281" rx="148" ry="20" fill="#719965" opacity=".2" />
    <path d="M30 281Q90 243 153 279T370 278" fill="none" stroke="#70925d" strokeWidth="8" strokeLinecap="round" />
    {kind === "snail" ? <g className="grove-animal">
      <path d="M89 258Q180 283 309 258Q340 238 320 220Q298 208 277 242H103Z" fill="#91ab66" />
      <circle cx="191" cy="208" r="67" fill="#dba968" stroke="#98653e" strokeWidth="5" />
      <path d="M231 230C179 265 136 212 163 181C195 147 229 190 211 210C196 227 181 209 190 201" fill="none" stroke="#98653e" strokeWidth="8" strokeLinecap="round" />
      <path d="M309 225L304 189M320 226L334 196" stroke="#688650" strokeWidth="7" strokeLinecap="round" />
      <circle cx="304" cy="187" r="6" fill="#294e40" /><circle cx="335" cy="195" r="6" fill="#294e40" />
    </g> : kind === "butterfly" ? <g className="grove-animal grove-wings">
      <path d="M199 183C87 23 55 130 114 192C36 283 145 291 199 208" fill="#edab77" stroke="#b76e50" strokeWidth="5" />
      <path d="M201 183C313 23 345 130 286 192C364 283 255 291 201 208" fill="#edab77" stroke="#b76e50" strokeWidth="5" />
      <ellipse cx="130" cy="145" rx="24" ry="30" fill="#fff0bc" /><ellipse cx="270" cy="145" rx="24" ry="30" fill="#fff0bc" />
      <circle cx="137" cy="229" r="15" fill="#be7181" /><circle cx="263" cy="229" r="15" fill="#be7181" />
      <path d="M200 155V230M198 157L181 131M202 157L220 131" stroke="#615546" strokeWidth="10" strokeLinecap="round" />
    </g> : <g className="grove-animal">
      <path d="M91 202L69 168L145 190" fill="#487b96" />
      <ellipse cx="200" cy="208" rx="74" ry="54" fill="#74a6ba" />
      <circle cx="251" cy="163" r="37" fill="#74a6ba" />
      <path d="M282 155L312 168L283 179" fill="#dda25c" />
      <path d="M147 196Q190 179 229 211Q196 264 147 196" fill="#487b96" />
      <circle cx="263" cy="153" r="5" fill="#263e3d" />
      <path d="M183 256V279H171M217 255V278H231" stroke="#98653e" strokeWidth="5" strokeLinecap="round" />
    </g>}
  </svg>;
}

export function CreatureGrove({ onNavigate, disabled = false, notes, onKeep }: { onNavigate: (id: string) => void; disabled?: boolean; notes: string[]; onKeep: (id: string) => void }) {
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const creature = creatures[index];
  const correct = answer === creature.answer;
  return <section className="grove-fieldbook atlas-enter" data-kid-world="grove">
    <div className="atlas-heading"><div><span className="eyebrow">Creature Grove · A tiny field guide</span><h2>Small neighbors. Big discoveries.</h2></div><span className="atlas-count"><Eye size={18} /> Look gently</span></div>
    <div className="atlas-filters" aria-label="Choose a creature">{creatures.map((item, i) => <button key={item.id} aria-pressed={index === i} onClick={() => { stopReading(); setIndex(i); setAnswer(null); }}>{item.label} {notes.includes(item.id) && <Check size={16} />}</button>)}</div>
    <div className="grove-field-grid">
      <div className="grove-portrait"><span className="eyebrow">Meet your neighbor</span><CreatureDrawing kind={creature.id} /><h3>{creature.name}</h3><p>{creature.notice}</p></div>
      <div className="grove-observation" key={creature.id}>
        <span className="eyebrow">01 · Look closely</span><h3>{creature.question}</h3>
        <div className="grove-answers">{creature.options.map((option, i) => <button key={option} aria-pressed={answer === i} disabled={disabled} onClick={() => setAnswer(i)}>{option}{answer === i && correct && <Check size={18} />}</button>)}</div>
        <p className="grove-feedback" role="status">{answer === null ? "Look at the picture. What do you notice?" : correct ? `You noticed it! ${creature.fact}` : "Take another look at the picture. You can try again."}</p>
        <div className="grove-care"><Leaf size={23} /><div><span className="eyebrow">02 · Care for our neighbors</span><p>{creature.care}</p></div></div>
        <div className="world-hero-actions"><button className="secondary" onClick={() => readAloud(`${creature.label}. ${creature.question} ${creature.notice} ${creature.care}`)}><Volume2 size={18} /> Listen</button><button className="primary" disabled={disabled || !correct || notes.includes(creature.id)} onClick={() => onKeep(creature.id)}>{notes.includes(creature.id) ? "Added to field notes" : "Keep this discovery"}<Check size={18} /></button></div>
      </div>
    </div>
    <aside className="grove-notebook" aria-live="polite"><div><span className="eyebrow">Field notes · This visit</span><h3>{notes.length ? `${notes.length} little ${notes.length === 1 ? "discovery" : "discoveries"}` : "Your noticing starts here"}</h3><p>{notes.length ? creatures.filter((item) => notes.includes(item.id)).map((item) => item.fact).join(" ") : "Meet a creature, look closely, and keep something you discovered."}</p></div><button className="secondary" disabled={disabled} onClick={() => onNavigate("science")}>Explore Wonder Lab <ArrowRight size={18} /></button></aside>
  </section>;
}
