'use client';
import { useRef, useState } from "react";
import { clipMeta, clipUrl } from "@/lib/media/clips";
import { CastFigure } from "@/components/kid/art/cast";
import type { CastId } from "@/lib/character/director";

/**
 * HeroClipPlayer — the big character-video moment.
 *
 * Plays a hero clip (welcome, lesson intro, Tuno breathing, cast finale).
 * Always skippable, never blocking: if the video cannot load, the live SVG
 * puppet covers with the clip's caption. Reduced-motion users get the puppet
 * with a play button instead of autoplay.
 */
export function HeroClipPlayer({
  clip,
  who,
  onDone,
  autoPlay = true,
}: {
  clip: string;
  who: CastId;
  onDone: () => void;
  autoPlay?: boolean;
}) {
  const meta = clipMeta(clip);
  const url = clipUrl(clip);
  const video = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);
  const [started, setStarted] = useState(false);

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // Unknown clip, missing file, or load error → the puppet covers.
  if (!meta || !url || failed) {
    return (
      <div className="hero-clip hero-clip-fallback" role="status">
        <CastFigure who={who} state="explain" />
        <p className="hero-clip-caption">{meta?.caption ?? "Let's keep going together."}</p>
        {meta && <p className="hero-clip-cue">{meta.cue}</p>}
        <button type="button" className="primary" onClick={onDone}>
          Let&apos;s go
        </button>
      </div>
    );
  }

  // Reduced motion: puppet first, video only on explicit play.
  if (reduceMotion && !started) {
    return (
      <div className="hero-clip hero-clip-fallback" role="status">
        <CastFigure who={who} state="wave" />
        <p className="hero-clip-caption">{meta.caption}</p>
        <p className="hero-clip-cue">{meta.cue}</p>
        <div className="hero-clip-actions">
          <button type="button" className="primary" onClick={() => setStarted(true)}>
            Play video
          </button>
          <button type="button" className="text-button" onClick={onDone}>
            Skip
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="hero-clip">
      <video
        ref={video}
        src={url}
        className="hero-clip-video"
        playsInline
        autoPlay={autoPlay}
        onEnded={onDone}
        onError={() => setFailed(true)}
        aria-label={meta.title}
      />
      <p className="hero-clip-cue" aria-live="polite">
        {meta.cue}
      </p>
      <div className="hero-clip-actions">
        <button
          type="button"
          className="secondary"
          onClick={() => {
            video.current?.pause();
            onDone();
          }}
        >
          Skip
        </button>
      </div>
    </div>
  );
}
