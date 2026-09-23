import { say } from "@/lib/science/tier";
import type { LabTier } from "@/lib/science/types";
import { buildLevels, buildWorkshops, levelsFor } from "./levels";
import type { BuildLevel, BuildWorkshopId } from "./types";

/**
 * What the browser is given: the level, in this child's voice, without the words that
 * belong after success. A construction level has no answer key to hide — the rule is the
 * job itself — but the prediction levels do, so their verdict and the explanation only
 * arrive from the server once the child has committed.
 */
export type PublicBuildLevel = Omit<BuildLevel, "goal" | "idea" | "hint" | "success" | "tiers"> & {
  goal: string;
  idea: string;
  hint: string;
  done: boolean;
};

export type PublicWorkshop = {
  id: BuildWorkshopId;
  name: string;
  subject: string;
  blurb: string;
  levels: PublicBuildLevel[];
};

export function publicLevel(level: BuildLevel, tier: LabTier, done: boolean): PublicBuildLevel {
  const { goal, idea, hint, success: _success, tiers: _tiers, ...rest } = level;
  void _success; void _tiers;
  return { ...rest, goal: say(goal, tier), idea: say(idea, tier), hint: say(hint, tier), done } as PublicBuildLevel;
}

export function publicYard(tier: LabTier, done: Set<string>): PublicWorkshop[] {
  return buildWorkshops.map((workshop) => ({
    id: workshop.id,
    name: workshop.name,
    subject: workshop.subject,
    blurb: say(workshop.blurb, tier),
    levels: levelsFor(workshop.id, tier).map((level) => publicLevel(level, tier, done.has(level.id))),
  }));
}

export const buildLevelIds = new Set(buildLevels.map((level) => level.id));
