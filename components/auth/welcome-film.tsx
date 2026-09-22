"use client";

import { useState, type ReactNode } from "react";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * The film on the sign-in page.
 *
 * Nine seconds: an empty stone path under floating books, planets and numbers, then Nova
 * walks in, waves, and stands looking at you. It replaces a tagline — this is the one
 * surface a parent judges before they have an account, and it was making its case in
 * three text blocks.
 *
 * ## Why this is the only place a film goes
 *
 * The clip is rendered in 3D, and the rest of the product is flat vector with an authored
 * cast of four. Those two registers can share a *marketing* surface — a poster has never
 * had to look like the thing it advertises — but they cannot share a child's screen
 * without teaching a four-year-old two different Novas. No child route uses this.
 *
 * ## Behaviour
 *
 * Muted, looping and decorative, so it is `aria-hidden` and carries nothing the text does
 * not already say. It never autoplays for someone who asked for less movement, and it
 * never blocks: if the file is missing, slow or refused, the drawn scene passed as
 * `fallback` is what was always going to be there.
 */
export function WelcomeFilm({ fallback }: { fallback: ReactNode }) {
  const reduced = usePrefersReducedMotion();
  const [failed, setFailed] = useState(false);

  // Autoplay is a behaviour rather than an animation, so the preference has to be read in
  // JavaScript: a stylesheet can stop a loop, but it cannot stop a video from starting.
  if (reduced || failed) return <>{fallback}</>;

  return (
    <div className="auth-film" aria-hidden="true">
      <video
        src="/media/welcome-nova.mp4"
        poster="/media/welcome-nova.jpg"
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        onError={() => setFailed(true)}
      />
    </div>
  );
}
