"use client";

import type { ReactNode } from "react";
import { DoorMark } from "@/components/kid/Placeholder";
import { KidSurfaceProvider } from "@/components/kid/surface";
import type { KidWorld } from "@/lib/kid-worlds";
import type { LearningBandId } from "@/lib/learning-bands";

/**
 * The child's frame. There is almost nothing in it, and that is the feature.
 *
 * Everything the old shell put around a child — sidebar, icon rail, tab bar, breadcrumb,
 * star counter, explorer dropdown, "More" sheet — has moved to `GrownUpShell`, behind the
 * parent gate. Each of those was a decision a four-year-old had to make, or a label they
 * had to read, before any learning started (blueprint §0: *the map replaces the menu*).
 *
 * What is left is one door back to the map, drawn rather than labelled, placed at the start
 * edge and away from the reach zone so the hand that is answering cannot leave by accident.
 * The map itself is the navigation: `ChildMap`, at `/`.
 *
 * The shell also resolves band, world and narration once, so every child component below it
 * sizes itself for the child actually holding the tablet.
 */
export function KidShell({
  band,
  world = "grove",
  narration = true,
  reducedMotion = false,
  /** True on the map itself, where a door back to the map would be a door to nowhere. */
  atMap = false,
  /** Suppressed while a full-screen activity or dialog owns the display. */
  inert = false,
  onHome,
  children,
}: {
  band: LearningBandId;
  world?: KidWorld;
  narration?: boolean;
  reducedMotion?: boolean;
  atMap?: boolean;
  inert?: boolean;
  onHome: () => void;
  children: ReactNode;
}) {
  return (
    <KidSurfaceProvider value={{ band, narration, world }}>
      <div
        className="kid-shell"
        data-band={band}
        data-kid-world={world}
        data-reduced-motion={reducedMotion || undefined}
      >
        {/* Kept for keyboard and screen-reader users. It is the only text link a child
            surface carries, and it is invisible until focused. */}
        <a className="cq-skip" href="#kid-main">
          Skip to the adventure
        </a>

        <main id="kid-main" className="kid-shell-main" inert={inert}>
          {children}
        </main>

        {!atMap && (
          <button
            type="button"
            className="kid-shell-door"
            aria-label="Back to the map"
            inert={inert}
            onClick={onHome}
          >
            <DoorMark />
          </button>
        )}
      </div>
    </KidSurfaceProvider>
  );
}
