"use client";

import { useRef, useState, type PointerEvent } from "react";
import type { ClipActivity } from "@/lib/character-clips";

export function CharacterActivity({ kind, prompt, disabled, onComplete }: { kind: ClipActivity; prompt: string; disabled: boolean; onComplete: () => void }) {
  const [apples, setApples] = useState<number[]>([]);
  const [steps, setSteps] = useState(0);
  const [message, setMessage] = useState('');
  const [breath, setBreath] = useState(false);
  const tracing = useRef(false);
  const progress = useRef(0);
  const [ink, setInk] = useState(0);
  const strokes = [
    { label: 'Left sloping line', from: [140, 40], to: [60, 240], d: 'M140 40L60 240' },
    { label: 'Right sloping line', from: [140, 40], to: [220, 240], d: 'M140 40L220 240' },
    { label: 'Line across the middle', from: [96, 150], to: [184, 150], d: 'M96 150L184 150' },
  ];

  function advance(expected: string, actual: string, total: number) {
    if (disabled) return;
    if (actual !== expected) { setMessage('Look again. You can try another one.'); return; }
    const next = steps + 1;
    setSteps(next);
    setMessage(next === total ? 'You did it! You can try again whenever you like.' : 'Yes! What comes next?');
    if (next === total) onComplete();
  }

  function point(event: PointerEvent<SVGSVGElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    return [(event.clientX - box.left) / box.width * 280, (event.clientY - box.top) / box.height * 280];
  }

  return <div className="character-activity" data-activity={kind}>
    <span className="eyebrow">Your turn</span><h3>{prompt}</h3>
    {kind === 'count' && <>
      <div className="character-apples">{[0, 1, 2].map((apple) => <button key={apple} disabled={disabled || apples.includes(apple)} aria-label={`Count apple ${apple + 1}`} onClick={() => { const next = [...apples, apple]; setApples(next); setMessage(`${next.length} ${next.length === 1 ? 'apple' : 'apples'} counted. Now choose the total.`); }}>
        <svg viewBox="0 0 100 110" aria-hidden="true"><path d="M50 27Q35 7 56 4" fill="none" stroke="#685031" strokeWidth="7"/><path d="M54 24Q64 4 86 12Q77 33 54 24" fill="#679653"/><path d="M50 34C1 9 0 77 31 100Q50 107 50 98Q63 108 78 97C110 71 96 7 50 34" fill={apples.includes(apple) ? '#c9886c' : '#db6352'}/><path d="M29 42Q15 52 22 67" stroke="#fff6df" strokeWidth="7" fill="none" strokeLinecap="round"/></svg>
        <span>{apples.includes(apple) ? apples.indexOf(apple) + 1 : 'Tap me'}</span>
      </button>)}</div>
      <div className="character-choices" aria-label="How many apples?">{[2, 3, 4].map(n => <button key={n} disabled={disabled} onClick={() => { if (n === 3 && apples.length === 3) { setMessage('Three apples! You counted each one once.'); onComplete(); } else setMessage(apples.length < 3 ? 'Touch each apple first, then choose the total.' : 'Use your last counting number. Try again.'); }}>{n}</button>)}</div>
      <button className="character-reset" disabled={disabled} onClick={() => { setApples([]); setMessage('Ready to count again.'); }}>Count again</button>
    </>}
    {kind === 'growth' && <>
      <div className="growth-slots" aria-label="Your plant sequence">{['Seed', 'Sprout', 'Flower'].map((label, i) => <span key={label}>{steps > i ? label : `${i + 1} · ?`}</span>)}</div>
      <div className="character-choices growth-choices">{['Flower', 'Seed', 'Sprout'].map(label => <button key={label} disabled={disabled || steps === 3} onClick={() => advance(['Seed', 'Sprout', 'Flower'][steps], label, 3)}>
        <svg viewBox="0 0 100 100" aria-hidden="true"><path d="M9 83H91" stroke="#927858" strokeWidth="8" strokeLinecap="round"/>{label === 'Seed' ? <ellipse cx="50" cy="75" rx="13" ry="8" fill="#986442"/> : <><path d="M50 80V35" stroke="#54804a" strokeWidth="6"/><path d="M50 62Q15 66 25 41Q47 39 50 62M50 56Q78 59 78 34Q54 34 50 56" fill="#87af63"/>{label === 'Flower' && <><path d="M50 35C13 26 29 1 50 17C74-7 88 28 50 35" fill="#d591ad"/><circle cx="50" cy="27" r="9" fill="#efd56b"/></>}</>}</svg>{label}
      </button>)}</div>
      <p className="character-hint">Real plants grow over days and weeks. Our movie shows a sped-up version.</p>
    </>}
    {kind === 'letter' && <>
      <svg className="character-letter" viewBox="0 0 280 280" role="img" aria-label="Uppercase A with three strokes. You can draw on the letter or use the stroke buttons below."
        onPointerDown={event => {
          if (disabled || steps >= 3) return;
          const [x, y] = point(event), [sx, sy] = strokes[steps].from;
          if (Math.hypot(x - sx, y - sy) > 32) { setMessage('Start at the gold dot.'); return; }
          tracing.current = true; progress.current = 0; setInk(0); event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={event => {
          if (!tracing.current || disabled || steps >= 3) return;
          const [x, y] = point(event), { from: [sx, sy], to: [ex, ey] } = strokes[steps];
          const dx = ex - sx, dy = ey - sy, length = Math.hypot(dx, dy);
          const along = ((x - sx) * dx + (y - sy) * dy) / (length * length);
          const distance = Math.abs((x - sx) * dy - (y - sy) * dx) / length;
          if (distance > 30 || along > progress.current + .3) return;
          progress.current = Math.max(progress.current, Math.min(1, along)); setInk(progress.current);
          if (progress.current > .94) { tracing.current = false; setInk(0); advance('stroke', 'stroke', 3); }
        }}
        onPointerUp={() => { tracing.current = false; setInk(0); }} onPointerCancel={() => { tracing.current = false; setInk(0); }}>
        {strokes.map((stroke, i) => <g key={stroke.label}><path d={stroke.d} stroke={i < steps ? '#7655a4' : '#e1d9ea'} strokeWidth="18" strokeLinecap="round" fill="none"/>{i === steps && <path d={stroke.d} pathLength="1" strokeDasharray={`${ink} 1`} stroke="#7655a4" strokeWidth="18" strokeLinecap="round" fill="none"/>}</g>)}
        {steps < 3 && <circle cx={strokes[steps].from[0]} cy={strokes[steps].from[1]} r="11" fill="#dda842"/>}
      </svg>
      <p className="character-hint">Trace from the gold dot, or use a button to draw each stroke.</p>
      <div className="character-strokes">{strokes.map((stroke, i) => <button key={stroke.label} disabled={disabled || i !== steps} onClick={() => advance('stroke', 'stroke', 3)}>{i < steps ? '✓ ' : `${i + 1}. `}{stroke.label}</button>)}</div>
    </>}
    {kind === 'rhythm' && <>
      <div className="rhythm-pattern" aria-label="Drum, clap, drum">{['Drum', 'Clap', 'Drum'].map((beat, i) => <span key={i} data-done={i < steps}>{i < steps ? '✓ ' : ''}{beat}</span>)}</div>
      <div className="character-choices rhythm-pads">{['Drum', 'Clap'].map(beat => <button key={beat} disabled={disabled || steps === 3} onClick={() => advance(['Drum', 'Clap', 'Drum'][steps], beat, 3)}><svg viewBox="0 0 100 100" aria-hidden="true">{beat === 'Drum' ? <><path d="M15 30V70Q50 100 85 70V30" fill="#d49564"/><ellipse cx="50" cy="30" rx="35" ry="15" fill="#fff2c8" stroke="#956448" strokeWidth="5"/><path d="M20 43L37 76L52 45L68 77L82 43" fill="none" stroke="#f8e0a9" strokeWidth="4"/></> : <><path d="M24 68L24 40Q28 29 34 42L36 53V20Q43 10 48 22V48L54 16Q64 11 66 23L62 51L73 34Q85 31 81 46L69 77Q39 96 24 68" fill="#dfa47e"/><path d="M10 16L20 24M78 9L72 20" stroke="#c39249" strokeWidth="5" strokeLinecap="round"/></>}</svg>{beat}</button>)}</div>
      <p className="character-hint">Tap the pattern here, or clap it with a grown-up. These pads are quiet.</p>
    </>}
    {kind === 'breathe' && <>
      <div className="breathing-space"><span className="breathing-orb" data-expanded={breath}>{breath ? 'Breathe in' : 'Breathe out'}</span></div>
      <div className="character-choices"><button disabled={disabled} onClick={() => setBreath(value => !value)}>{breath ? 'Ready to breathe out' : 'Ready to breathe in'}</button><button disabled={disabled} onClick={() => { setMessage('Thank you for taking a quiet moment.'); onComplete(); }}>I am ready</button></div>
    </>}
    {kind === 'notice' && <div className="character-notice"><svg viewBox="0 0 120 100" aria-hidden="true"><path d="M60 8L74 34L104 39L82 61L88 92L60 78L32 92L38 61L16 39L46 34Z" fill="#e8ba63"/><circle cx="50" cy="51" r="3" fill="#6f5733"/><circle cx="70" cy="51" r="3" fill="#6f5733"/><path d="M48 62Q60 73 72 62" fill="none" stroke="#6f5733" strokeWidth="3"/></svg><p>Look closely, say your idea out loud, or share it with someone beside you.</p><button disabled={disabled} onClick={() => setMessage('Your idea is worth sharing. There is more than one way to wonder!')}>I have an idea</button></div>}
    <p className="character-feedback" role="status">{message || 'Take your time. You can watch the movie or start here.'}</p>
    {['letter', 'growth', 'rhythm'].includes(kind) && steps > 0 && <button className="character-reset" disabled={disabled} onClick={() => { setSteps(0); setMessage('Let’s try again.'); setInk(0); tracing.current = false; }}>Start again</button>}
  </div>;
}
