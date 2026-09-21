"use client";

import type { ReactNode } from "react";
import { DEFAULT_BAND, type LearningBandId } from "@/lib/learning-bands";
import { KidSurfaceProvider, type KidWorld } from "./surface";

/**
 * The Stage: one activity, full bleed, no navigation.
 *
 * A scene has exactly three regions, and the split is a learning decision rather than a
 * layout one:
 *
 *   sky    — the world behind, which never reacts and never competes for attention;
 *   stage  — the one thing happening, centred;
 *   reach  — the controls, pinned to the bottom of the screen where small hands rest on
 *            a tablet held in two hands. `--kid-reach-top` caps how high they may climb.
 *
 * `exit` is the single obvious door out, top-start, deliberately far from the reach zone
 * so the hand that is answering cannot leave by accident.
 *
 * The scene resolves band and world once, as data attributes, and every token below it
 * follows: type size, touch size and hue are chosen here and nowhere else.
 */
export function SceneLayer({
  world,
  band = DEFAULT_BAND,
  narration = true,
  sky,
  exit,
  actions,
  inset = false,
  labelledBy,
  children,
}: {
  world: KidWorld;
  band?: LearningBandId;
  narration?: boolean;
  /** Drawn backdrop for this world. A plain wash of the world's hue until it exists. */
  sky?: ReactNode;
  /** The one way out. Omitted on the arrival scene, which has nowhere to go back to. */
  exit?: ReactNode;
  /** Primary controls. Placed in the lower two-thirds; nothing else goes here. */
  actions?: ReactNode;
  /** True when the scene sits inside an existing page rather than owning the viewport. */
  inset?: boolean;
  labelledBy?: string;
  children: ReactNode;
}) {
  return (
    <KidSurfaceProvider value={{ band, narration, world }}>
      <section
        className="kid-scene"
        data-kid-world={world}
        data-band={band}
        data-inset={inset || undefined}
        aria-labelledby={labelledBy}
      >
        <div className="kid-scene-sky">{sky}</div>
        {exit ? <div className="kid-scene-exit">{exit}</div> : null}
        <div className="kid-scene-stage">{children}</div>
        {actions ? <div className="kid-scene-reach">{actions}</div> : null}
      </section>
    </KidSurfaceProvider>
  );
}
