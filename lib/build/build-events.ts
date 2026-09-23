import type { ErrorKind } from "@/lib/error-kinds";
import type { LearningVerb } from "@/lib/learning-events";
import type { ActivityType, Question } from "@/lib/curriculum";
import type { GradeBand } from "@/lib/skill-graph";
import { skillGraph } from "@/lib/skill-graph";
import { say } from "@/lib/science/tier";
import type { LabTier } from "@/lib/science/types";
import type { BuildLevel } from "./types";

/**
 * How a Build Yard attempt becomes evidence — the same arrangement as the Wonder Lab
 * (`lib/science/lab-events.ts`): a level presents itself as an ordinary `Question`, so the
 * mastery record, the recommender and the parent report need no second progress system.
 *
 * The verb is the point. Building a map records `build`; fixing someone else's program
 * records `fix`; saying whether a tower will stand before testing it records `predict`.
 * Those are the verbs a multiple-choice bank can never produce.
 */

export function buildVerb(level: BuildLevel): LearningVerb {
  if (level.workshop === "robot" && level.starter) return "fix";
  if (level.workshop === "tower" && level.rule.kind === "predict") return "predict";
  return "build";
}

function activityType(level: BuildLevel): ActivityType {
  switch (level.workshop) {
    case "robot": return "route";
    case "map": return "route";
    case "tower": return level.rule.kind === "predict" ? "investigation" : "balance";
    case "shapes":
      return level.rule.kind === "pattern" ? "pattern" : level.rule.kind === "count" ? "counting" : "array-builder";
  }
}

/** The engine's own detail, folded into the shared taxonomy where one honestly fits. */
export function buildErrorKind(detail: string | undefined): ErrorKind | null {
  if (detail === "too-many" || detail === "too-few") return "off-by-one";
  if (detail === "opposite-direction") return "sequence-reversed";
  return null;
}

const subjectOf = new Map(skillGraph.map((skill) => [skill.id, skill.subject]));

export function buildQuestion(level: BuildLevel, tier: LabTier, grade: GradeBand): Question {
  return {
    id: level.id,
    subject: subjectOf.get(level.skillId) ?? "logic",
    grade,
    level: tier === "explorer" ? 1 : tier === "investigator" ? 2 : 3,
    skillId: level.skillId,
    activityType: activityType(level),
    phase: level.workshop === "robot" && level.starter ? "transfer" : "independent",
    estimatedMinutes: 3,
    contextTags: ["building"],
    prompt: say(level.goal, tier),
    options: [],
    answer: "",
    hint: say(level.hint, tier),
    explanation: say(level.success, tier),
    verb: buildVerb(level),
  };
}
