"use client";

import type { CSSProperties, ReactNode } from "react";
import { DEFAULT_BAND, type LearningBandId } from "@/lib/learning-bands";
import { KidSurfaceProvider, type KidWorld } from "../surface";

/**
 * The scene grammar (WP-11 §2.2).
 *
 * `SceneLayer` divides a screen into sky / stage / reach — where the *work* goes. This
 * divides the picture into how far away everything is, which is a different question and
 * the one the old map got wrong: it had two flat colour bands and a CSS ellipse for a sun,
 * so eleven landmarks all floated at the same non-existent distance and the whole thing
 * read as a diagram of a world rather than a world.
 *
 * Five planes, fixed order, fixed meaning. A surface composes them; it never invents a
 * sixth, because "how far away is this" only has so many useful answers and a child
 * learning a place needs the same answer every time.
 *
 *   sky     the gradient, the sun, the clouds. Never moves with the child.
 *   far     the horizon: ridges and distant canopy. Distance desaturates.
 *   mid     the landmarks a child actually touches. This is the plane that matters.
 *   near    the ground the child walks on, and the planting they walk past.
 *   fore    framing foliage at the very front, cropped by the viewport edge.
 *   actors  the cast and their speech. Above the scene, never inside it.
 *
 * `actors` is separate from `fore` on purpose. Nova has to be able to stand anywhere
 * without a leaf drawn in front of her face, and a speech bubble must never end up behind
 * a tree — which is exactly the bug the old map avoided by moving Nova out of the scroller
 * altogether and losing her connection to the place in the process.
 *
 * ## Parallax
 *
 * One custom property, `--scene-pan`, set on the scene by whatever is panning it. Each
 * plane multiplies it by its own depth and by `--scene-parallax`, which the reduced-motion
 * block in `app/tokens.css` resolves to zero. So switching the preference on flattens the
 * whole rig to a still picture in one declaration, with no scroll listener to unsubscribe
 * and no JavaScript that has to remember to check.
 */

/** How far away a plane is. Ordered, and the order is the paint order. */
export const SCENE_PLANES = ["sky", "far", "mid", "near", "fore", "actors"] as const;
export type ScenePlaneName = (typeof SCENE_PLANES)[number];

export function Scene({
  world,
  band = DEFAULT_BAND,
  narration = true,
  /**
   * How far the scene is panned, -1 (fully left) to 1 (fully right). Planes translate by
   * this times their own depth.
   *
   * Left out entirely when something above the scene is driving `--scene-pan` itself —
   * the map sets it on its scroll container once per frame, imperatively, because
   * re-rendering a dozen landmark buttons on every scroll event to move some hills is not
   * a trade worth making. A declared `pan` of 0 here would shadow that inherited value.
   */
  pan,
  /** Time of day. Changes the sky and the light, never the layout or the landmarks. */
  light = "day",
  labelledBy,
  label,
  className,
  children,
}: {
  world: KidWorld;
  band?: LearningBandId;
  narration?: boolean;
  pan?: number | undefined;
  light?: "day" | "dusk";
  labelledBy?: string;
  label?: string;
  className?: string;
  children: ReactNode;
}) {
  // The one value the data owns rather than the stylesheet: how far this particular
  // scene is panned right now. Everything else about depth is in app/kid.css.
  const panning =
    pan === undefined ? undefined : ({ "--scene-pan": String(clamp(pan)) } as CSSProperties);

  return (
    <KidSurfaceProvider value={{ band, narration, world }}>
      <div
        className={className ? `kid-scene-world ${className}` : "kid-scene-world"}
        data-kid-world={world}
        data-band={band}
        data-light={light}
        aria-labelledby={labelledBy}
        aria-label={labelledBy ? undefined : label}
        style={panning}
      >
        {children}
      </div>
    </KidSurfaceProvider>
  );
}

/**
 * One depth plane.
 *
 * Decorative by default: a plane is scenery, and a screen reader reading out "hill, tree,
 * tree, cloud" before reaching the thing a child came for is worse than silence. A plane
 * holding real controls — the `mid` plane on the map — passes `presentational={false}` and
 * takes responsibility for its own children's names.
 */
export function ScenePlane({
  plane,
  presentational = true,
  className,
  children,
}: {
  plane: ScenePlaneName;
  presentational?: boolean;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={className ? `kid-plane ${className}` : "kid-plane"}
      data-plane={plane}
      aria-hidden={presentational || undefined}
    >
      {children}
    </div>
  );
}

function clamp(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(-1, Math.min(1, value));
}
