"use client";

import { createContext, useContext, useEffect } from "react";
import { DEFAULT_BAND, type LearningBandId } from "@/lib/learning-bands";
import { warnAboutCopy } from "@/lib/kid-copy";

/**
 * What every child component needs to know about the child in front of it.
 *
 * Band is not a style variant. It changes the size of a target, the amount of text
 * allowed on screen and how much is read aloud, so it is resolved once on the scene and
 * read from context rather than threaded through every component as a prop — a primitive
 * five levels deep still has to obey the floor.
 *
 * `narration` says whether the voice is on. Components must render the same words either
 * way (§C6: the audio-off path is complete, not degraded); the flag only decides whether
 * a "say it again" control is worth showing.
 */
export type KidSurface = {
  band: LearningBandId;
  narration: boolean;
  /** The world whose hue this part of the screen belongs to. */
  world: KidWorld;
};

/** One hue per world, held across the map, the episode and the reward (§C5 art rules). */
export type KidWorld =
  | "grove"
  | "city"
  | "harbor"
  | "workshop"
  | "treehouse"
  | "lab";

const fallback: KidSurface = { band: DEFAULT_BAND, narration: true, world: "grove" };

const KidSurfaceContext = createContext<KidSurface>(fallback);

export const KidSurfaceProvider = KidSurfaceContext.Provider;

/**
 * Child components call this instead of taking a `band` prop. The fallback is the
 * default band rather than the smallest sizes, because a primitive rendered outside a
 * scene — in a test, in a preview — must still be usable by a four-year-old.
 */
export function useKidSurface(): KidSurface {
  return useContext(KidSurfaceContext);
}

/**
 * Checks a line against the copy rules for the band actually in front of the child, in
 * development only. It runs in an effect rather than during render so the components stay
 * pure, and it warns rather than throws: a line that is two words too long is an
 * authoring bug, not a reason to take the screen away from a child mid-lesson.
 */
export function useCopyWarning(where: string, text: string | undefined): void {
  const { band } = useKidSurface();
  useEffect(() => {
    if (text) warnAboutCopy(where, text, band);
  }, [where, text, band]);
}
