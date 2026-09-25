"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DiscoveryData, DiscoveryDomain, DiscoveryInput, DiscoveryResult, DiscoverySource, PublicDiscoveryLesson } from "@/lib/discover/types";
import { discoveryDomains } from "@/lib/discover/domains";
import { discoverySources } from "@/lib/discover/sources";
import { readAloud, stopReading } from "@/lib/speech";
import { DiscoveryArrow, DiscoveryArt } from "./DiscoveryArt";
import { DiscoveryModel } from "./DiscoveryModel";

export function DiscoveryLibrary({ source, paused, narration = true, initialDomain = "all" }: { source: DiscoverySource; paused: boolean; narration?: boolean; initialDomain?: DiscoveryDomain | "all" }) {
  const [data, setData] = useState<DiscoveryData | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [domain, setDomain] = useState<DiscoveryDomain | "all">(initialDomain);
  const [selected, setSelected] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const root = useRef<HTMLElement>(null);
  const lessonButtons = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    const controller = new AbortController();
    source.load(controller.signal).then((next) => {
      if (!controller.signal.aborted) { setData(next); setError(""); }
    }).catch((cause) => { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Please try again."); });
    return () => { controller.abort(); stopReading(); };
  }, [source, retry]);

  useEffect(() => { if (paused) stopReading(); }, [paused]);
  const markPracticed = useCallback((id: string, at: string) => {
    setData((current) => current && ({ ...current, lessons: current.lessons.map((lesson) => lesson.id === id ? { ...lesson, practicedAt: at } : lesson) }));
  }, []);

  const lesson = data?.lessons.find((item) => item.id === selected);
  const back = () => {
    stopReading(); setSelected(null);
    requestAnimationFrame(() => { if (selected) lessonButtons.current.get(selected)?.focus(); });
  };
  if (lesson) return <section ref={root} className="discovery-library" data-band={data!.band}><DiscoveryPlayer key={lesson.id} lesson={lesson} source={source} paused={paused} narration={narration} onBack={back} onPracticed={markPracticed}/></section>;
  const visible = data?.lessons.filter((item) => (domain === "all" || item.domain === domain) && `${item.title} ${item.subtitle} ${item.vocabulary.word}`.toLowerCase().includes(query.toLowerCase().trim())) ?? [];
  const practiced = data?.lessons.filter((item) => item.practicedAt).length ?? 0;
  return (
    <section ref={root} className="discovery-library" data-band={data?.band}>
      <header className="discovery-library-head">
        <div><span className="discovery-eyebrow">A little wonder, every day</span><h1>Follow your curiosity.</h1><p>Big ideas. Little discoveries. Something new to try.</p></div>
        <div className="discovery-passport"><span aria-hidden="true">✦</span><strong>{practiced}</strong><span>discoveries practised</span></div>
      </header>
      <div className="discovery-library-tools">
        <div className="discovery-filters" role="group" aria-label="Choose a kind of discovery">
          <button type="button" aria-pressed={domain === "all"} onClick={() => setDomain("all")}>Everything</button>
          {discoveryDomains.map((item) => <button type="button" key={item.id} data-domain={item.id} aria-pressed={domain === item.id} onClick={() => setDomain(item.id)}>{item.label}</button>)}
        </div>
        <label className="discovery-search"><span>Find a discovery</span><input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try stories, seeds, patterns…"/></label>
      </div>
      {error ? <div className="discovery-notice" role="alert"><p>{error}</p><button type="button" className="discovery-button" onClick={() => { setError(""); setRetry((n) => n + 1); }}>Try loading again</button></div> : !data ? <div className="discovery-loading" role="status">Opening your book of discoveries…</div> : <>
        <p className="discovery-results" role="status">{visible.length} discoveries to explore · about 3–5 minutes each</p>
        {paused && <p className="discovery-notice" role="status">Time for a rest. Your discoveries will be here when play starts again.</p>}
        <div className="discovery-grid">
          {visible.map((item) => <button type="button" className="discovery-card" data-domain={item.domain} key={item.id} disabled={paused} ref={(element) => { if (element) lessonButtons.current.set(item.id, element); else lessonButtons.current.delete(item.id); }} onClick={() => { stopReading(); setSelected(item.id); }}>
            <div className="discovery-card-picture"><DiscoveryArt domain={item.domain}/><span className="discovery-card-time">{item.minutes} min</span></div>
            <div className="discovery-card-copy"><span className="discovery-card-domain">{discoveryDomains.find((d) => d.id === item.domain)?.label}</span><h2>{item.title}</h2><p>{item.subtitle}</p><span className="discovery-card-bottom"><span>{item.practicedAt ? "Practise again" : "Let's discover"}</span><DiscoveryArrow/></span></div>
          </button>)}
        </div>
        {visible.length === 0 && <div className="discovery-notice"><h2>No discoveries found yet.</h2><p>Try a different word or explore everything.</p><button type="button" className="discovery-button" onClick={() => { setQuery(""); setDomain("all"); }}>Show everything</button></div>}
      </>}
      <details className="discovery-research"><summary>For grown-ups: how these discoveries teach</summary><p>Each discovery connects an explanation and example to guided practice, conversation, and an activity away from the screen. A saved practice response is not proof of independent mastery. The conversation and real-world activity are not automatically assessed.</p><p>The ideas draw on the guidance below. These specific lessons have not been evaluated in an efficacy study. Younger children will benefit from a grown-up reading and playing alongside them.</p>{discoverySources.map((item) => <div key={item.id}><a href={item.url} target="_blank" rel="noreferrer">{item.title}</a><p>{item.organization}. {item.use}</p></div>)}</details>
    </section>
  );
}

function DiscoveryPlayer({ lesson, source, paused, narration, onBack, onPracticed }: { lesson: PublicDiscoveryLesson; source: DiscoverySource; paused: boolean; narration: boolean; onBack: () => void; onPracticed: (id: string, at: string) => void }) {
  const [stage, setStage] = useState<"learn" | "try" | "takeaway">("learn");
  const [response, setResponse] = useState<number[]>([]);
  const [count, setCount] = useState(0);
  const [result, setResult] = useState<DiscoveryResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [hint, setHint] = useState(false);
  const pending = useRef<DiscoveryInput | null>(null);
  const lock = useRef(false);
  const session = useRef("");
  const started = useRef(0);
  const active = useRef(true);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => { active.current = true; session.current = crypto.randomUUID(); started.current = Date.now(); return () => { active.current = false; stopReading(); }; }, []);
  useEffect(() => { heading.current?.focus(); heading.current?.scrollIntoView({ block: "start", behavior: "instant" }); }, [stage]);
  const task = lesson.task;
  const frozen = paused || busy || !!result?.correct;
  const ready = task.kind === "build" || response.length === (task.kind === "sequence" ? task.choices.length : 1);
  const edit = () => { pending.current = null; setResult(null); setError(""); };
  const listen = (text: string) => { if (!paused && narration) readAloud(text); };
  async function check() {
    if (lock.current || paused || !ready || result?.correct) return;
    lock.current = true; setBusy(true); setError(""); stopReading();
    pending.current ??= { lesson: lesson.id, response: task.kind === "build" ? [count] : response, attempt: crypto.randomUUID(), session: session.current, startedAt: started.current };
    try {
      const answer = await source.attempt(pending.current);
      if (!active.current) return;
      setResult(answer); pending.current = null;
      if (answer.correct && answer.practicedAt) onPracticed(lesson.id, answer.practicedAt);
    } catch (cause) { if (active.current) setError(cause instanceof Error ? cause.message : "Keep your answer here and try again."); }
    finally { lock.current = false; if (active.current) setBusy(false); }
  }
  return <article className="discovery-player" data-domain={lesson.domain}>
    <div className="discovery-player-top"><button type="button" className="discovery-back" onClick={onBack}>← All discoveries</button><ol className="discovery-steps" aria-label="Discovery steps">{["learn", "try", "takeaway"].map((step, i) => <li key={step} aria-current={stage === step ? "step" : undefined}><span>{i + 1}</span>{["Notice", "Try it", "Take it with you"][i]}</li>)}</ol></div>
    {paused && <p className="discovery-notice" role="status">Play is paused. Your answer stays here.</p>}
    <div className="discovery-player-layout">
      <aside className="discovery-field-note"><DiscoveryArt domain={lesson.domain}/><span className="discovery-eyebrow">A word to keep</span><h2>{lesson.vocabulary.word}</h2><p>{lesson.vocabulary.meaning}</p><span className="discovery-note-line" aria-hidden="true"/></aside>
      <div className="discovery-lesson-content">
        <span className="discovery-eyebrow">{discoveryDomains.find((d) => d.id === lesson.domain)?.label} · {lesson.minutes} minutes</span>
        <h1 ref={heading} tabIndex={-1}>{stage === "takeaway" ? "An idea to take with you." : lesson.title}</h1>
        {stage === "learn" && <>
          <p className="discovery-big-idea">{lesson.idea}</p>
          <div className="discovery-example"><span className="discovery-eyebrow">Let’s look together</span><p>{lesson.example}</p></div>
          <DiscoveryModel lesson={lesson} paused={paused}/>
          <p className="discovery-notice-question">{lesson.notice}</p>
          <div className="discovery-actions"><button type="button" className="discovery-button" disabled={paused} onClick={() => { stopReading(); started.current = Date.now(); setStage("try"); }}>Let me try <DiscoveryArrow/></button>{narration && <button type="button" className="discovery-quiet" disabled={paused} onClick={() => listen(`${lesson.idea} ${lesson.example} ${lesson.notice}`)}>Read it to me</button>}</div>
        </>}
        {stage === "try" && <>
          <h2 className="discovery-task-prompt">{task.prompt}</h2>
          {narration && <button type="button" className="discovery-quiet" disabled={paused || busy} onClick={() => listen(`${task.prompt} ${task.choices.join(". ")}`)}>Hear the challenge</button>}
          {task.kind === "build" ? <div className="discovery-counter">
            <div className="discovery-counter-tray" aria-label={`${count} counters`}>{Array.from({ length: task.max ?? 20 }, (_, i) => <span key={i} data-filled={i < count || undefined} aria-hidden="true"/>)}</div>
            <div className="discovery-counter-controls"><button type="button" aria-label="Remove one counter" disabled={frozen || count === 0} onClick={() => { edit(); setCount((n) => n - 1); }}>−</button><output aria-live="polite">{count}</output><button type="button" aria-label="Add one counter" disabled={frozen || count === task.max} onClick={() => { edit(); setCount((n) => n + 1); }}>+</button></div>
          </div> : <>
            {task.kind === "sequence" && <><p className="discovery-instruction">Tap the steps in order. Tap a chosen step to take it back.</p><ol className="discovery-sequence" aria-label="Your order">{response.map((index, position) => <li key={index}><span>{position + 1}</span><button type="button" disabled={frozen} onClick={() => { edit(); setResponse((items) => items.filter((item) => item !== index)); }}>{task.choices[index]} <span aria-hidden="true">×</span></button></li>)}</ol></>}
            <div className="discovery-options" role="group" aria-label={task.kind === "sequence" ? "Available steps" : "Choose your answer"}>{task.choices.map((choice, index) => <button key={choice} type="button" aria-pressed={response.includes(index)} disabled={frozen || (task.kind === "sequence" && response.includes(index))} onClick={() => { edit(); setResponse((items) => task.kind === "sequence" ? [...items, index] : [index]); }}><span className="discovery-option-dot" aria-hidden="true">{response.includes(index) ? "✓" : ""}</span>{choice}</button>)}</div>
          </>}
          {result && <div className="discovery-feedback" data-correct={result.correct} role="status"><strong>{result.correct ? "You worked it out." : "Keep exploring."}</strong><p>{result.feedback}</p>{narration && <button type="button" className="discovery-quiet" disabled={paused} onClick={() => listen(result.feedback)}>Hear why</button>}</div>}
          {error && <p className="discovery-notice" role="alert">{error}</p>}
          {hint && !result?.correct && <p className="discovery-hint" role="status">{task.hint}</p>}
          <div className="discovery-actions">{result?.correct ? <button type="button" className="discovery-button" disabled={paused} onClick={() => { stopReading(); setStage("takeaway"); }}>Take it with me <DiscoveryArrow/></button> : <><button type="button" className="discovery-button" disabled={paused || busy || !ready} onClick={() => void check()}>{busy ? "Saving your practice…" : error ? "Try saving again" : "Check my thinking"}</button><button type="button" className="discovery-quiet" disabled={paused || busy} onClick={() => setHint(true)}>A little clue</button><button type="button" className="discovery-quiet" disabled={paused || busy} onClick={() => { stopReading(); setStage("learn"); }}>See the example</button></>}</div>
        </>}
        {stage === "takeaway" && <>
          <p className="discovery-big-idea">You practised {lesson.title.toLowerCase()}. Now make the idea your own.</p>
          <div className="discovery-example"><span className="discovery-eyebrow">Tell someone your thinking</span><p>{lesson.talk}</p></div>
          <div className="discovery-away"><span className="discovery-eyebrow">Beyond the screen</span><p>{lesson.away}</p></div>
          <p className="discovery-save-note">Your guided practice is saved. Come back another day and see what you remember.</p>
          <div className="discovery-actions"><button type="button" className="discovery-button" onClick={onBack}>Back to discoveries <DiscoveryArrow/></button>{!paused && <Link className="discovery-quiet" href={lesson.next.href} onClick={stopReading}>{lesson.next.label}</Link>}{narration && <button type="button" className="discovery-quiet" disabled={paused} onClick={() => listen(`${lesson.talk} ${lesson.away}`)}>Read it to me</button>}</div>
        </>}
      </div>
    </div>
  </article>;
}
