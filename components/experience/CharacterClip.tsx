"use client";

import Image from "next/image";
import { createContext, useContext, useEffect, useId, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Volume2 } from "lucide-react";
import { characterClip, clipPoster, clipSource } from "@/lib/character-clips";
import { duckMusic } from "@/lib/audio";
import { speak, stopReading, type SpeechHandle } from "@/lib/speech";

export const ClipComfortContext = createContext({ paused: false, offline: false, narration: true });

/** Tap-to-play silent animation. Narration describes the reviewed visuals. */
export function CharacterClip({ id, disabled = false }: { id: string; disabled?: boolean }) {
  const comfort = useContext(ClipComfortContext);
  const blocked = disabled || comfort.paused;
  const clip = characterClip(id);
  const instance = useId();
  const player = useRef<HTMLVideoElement>(null);
  const root = useRef<HTMLDivElement>(null);
  const speech = useRef<SpeechHandle | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [finished, setFinished] = useState(false);
  const [reading, setReading] = useState(false);

  useEffect(() => {
    const pause = () => player.current?.pause();
    const visibility = () => { if (document.hidden) { pause(); speech.current?.cancel(); } };
    const another = (event: Event) => { if ((event as CustomEvent<string>).detail !== instance) { pause(); speech.current?.cancel(); } };
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) pause(); });
    if (root.current) observer.observe(root.current);
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('curio-clip-play', another);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('curio-clip-play', another);
      speech.current?.cancel();
      duckMusic(false, instance);
    };
  }, [instance]);

  useEffect(() => {
    if (blocked || comfort.offline) player.current?.pause();
    if (blocked || !comfort.narration) speech.current?.cancel();
  }, [blocked, comfort.offline, comfort.narration]);

  function play() {
    if (blocked || comfort.offline) return;
    speech.current?.cancel();
    stopReading();
    setReading(false);
    window.dispatchEvent(new CustomEvent('curio-clip-play', { detail: instance }));
    setLoaded(true);
    setFailed(false);
    const video = player.current;
    if (!video) return;
    if (!video.getAttribute('src')) video.src = clipSource(id);
    if (failed) video.load();
    if (video.ended) video.currentTime = 0;
    void video.play().catch((error: unknown) => {
      if (!(error instanceof DOMException && error.name === 'AbortError')) setFailed(true);
    });
  }

  return <div ref={root} className="character-clip" data-clip={id}>
    <div className="character-frame">
      {(!loaded || failed) && <Image className="character-poster" src={clipPoster(id)} alt={clip.description} width={960} height={540} loading="eager" unoptimized />}
      <video ref={player} hidden={!loaded || failed} poster={clipPoster(id)} preload="none" playsInline muted aria-label={clip.title}
        onPlay={() => { if (blocked || comfort.offline) { player.current?.pause(); return; } setPlaying(true); setFinished(false); }} onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setFinished(true); }}
        onError={() => { setFailed(true); setPlaying(false); }} />
      {!playing && !blocked && !comfort.offline && <button className="character-watch" onClick={play} aria-label={`${finished ? 'Replay' : 'Watch'} ${clip.title}`}><Play size={23} fill="currentColor" /> {finished ? 'Watch again' : 'Watch · 10 sec'}</button>}
      <span className="character-friend">{clip.friend}</span>
    </div>
    <div className="character-controls">
      <button disabled={blocked || comfort.offline} onClick={() => playing ? player.current?.pause() : play()}>{playing ? <Pause size={18} /> : finished ? <RotateCcw size={18} /> : <Play size={18} />}{playing ? 'Pause' : finished ? 'Replay' : 'Play'}</button>
      {comfort.narration && <button disabled={blocked} aria-pressed={reading} onClick={() => {
        if (reading) { speech.current?.cancel(); return; }
        player.current?.pause();
        window.dispatchEvent(new CustomEvent('curio-clip-play', { detail: instance }));
        duckMusic(true, instance);
        setReading(true);
        speech.current = speak(clip.description, { onEnd: () => { speech.current = null; setReading(false); duckMusic(false, instance); } });
      }}><Volume2 size={18} />{reading ? 'Stop listening' : 'Listen to description'}</button>}
    </div>
    {(failed || comfort.offline) && <p role="status" className="character-status">{comfort.offline ? 'The picture and activity are ready. Video is off in offline mode.' : 'The movie could not play. You can still use the picture and activity, or try Play again.'}</p>}
    <p className="character-description">{clip.description}</p>
  </div>;
}
