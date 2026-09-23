"use client";

import { useMemo } from "react";
import { KidSurfaceProvider } from "@/components/kid";
import { BuildYard, type YardSource } from "@/components/kid/build/BuildYard";
import { judgeBuild, towerFalls } from "@/lib/build/engine";
import { buildLevelById } from "@/lib/build/levels";
import { publicYard } from "@/lib/build/public";
import { say, tierForBand } from "@/lib/science/tier";
import type { LearningBandId } from "@/lib/learning-bands";

/**
 * The Build Yard, in development only, with no family session.
 *
 * It judges in the browser by calling `judgeBuild` directly — the one place allowed to,
 * because this route 404s in production (see `page.tsx`), carries no child data and
 * records nothing. The real yard always asks `/api/build`.
 */
export function BuildPreview({ band }: { band: LearningBandId }) {
  const source = useMemo<YardSource>(() => {
    const tier = tierForBand(band);
    const done = new Set<string>();
    return {
      load: async () => ({ tier, workshops: publicYard(tier, done) }),
      attempt: async ({ level: id, build }) => {
        const level = buildLevelById.get(id)!;
        const verdict = judgeBuild(level, build);
        if (!verdict) throw new Error("That is not something this workshop can build.");
        const firstTime = verdict.correct && !done.has(id);
        if (verdict.correct) done.add(id);
        const predict = level.workshop === "tower" && level.rule.kind === "predict";
        return {
          ...verdict,
          success: verdict.correct || predict ? say(level.success, tier) : undefined,
          falls: build.workshop === "tower" && level.workshop === "tower" ? [...towerFalls(level, build.blocks)] : undefined,
          firstTime,
        };
      },
    };
  }, [band]);
  return (
    <KidSurfaceProvider value={{ band, narration: true, world: "workshop" }}>
      <main className="kid-preview-build">
        <BuildYard source={source} paused={false} />
      </main>
    </KidSurfaceProvider>
  );
}
