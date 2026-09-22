import type { GradeBand } from "@/lib/skill-graph";
import type { ActivityEngine } from "@/lib/activity-types";
import type { ActivityType, Question } from "@/lib/curriculum";
import { verbForLabActivity, type LabStation } from "./types";
import { say } from "./tier";
import type { LabTier } from "./types";

/**
 * How a Wonder Lab attempt becomes evidence.
 *
 * §A is unambiguous: *every new learning interaction writes a `learning_event`. An
 * interaction that records nothing did not happen.* The old lab recorded nothing at all —
 * a child could predict, test and explain nine experiments and the product would know
 * exactly as much about them afterwards as before.
 *
 * Rather than inventing a second progress system for science, a lab station presents
 * itself to the rest of the codebase as an ordinary `Question`. The mastery record, the
 * recommender and the parent report then treat lab evidence and quest evidence as the
 * same thing, which is the honest arrangement: a child who can predict which material a
 * magnet attracts has demonstrated that skill, and it should not matter which room they
 * were standing in.
 *
 * The verb is where the lab earns its keep. Almost everything in the quest bank records
 * `choose`; a lab session records `predict`, `sort`, `sequence` and `explain`, which is
 * exactly the representation variety the evidence rule (§C2) asks for and the one thing a
 * multiple-choice bank can never supply on its own.
 */

const activityTypeFor: Record<ReturnType<typeof kindOf>, ActivityType> = {
  predict: "investigation",
  sort: "sorting",
  sequence: "ordering",
  label: "matching",
  "fair-test": "reasoning-choice",
};

function kindOf(station: LabStation) {
  return station.activity.kind;
}

/**
 * A stub engine, so the mastery cache's variety count can tell a sorting attempt from a
 * sequencing one.
 *
 * It carries no content: the real activity was rendered by the child layer from the lab's
 * own types, and duplicating it into a quest engine would be two sources of truth for one
 * screen. `fair-test` has no counterpart in the quest engines and gets none — inventing a
 * fake engine kind to make a number look better is worse than the number being flat, and
 * the `explain` verb on the event records it properly either way.
 */
function stubEngine(station: LabStation): ActivityEngine | undefined {
  switch (station.activity.kind) {
    case "predict":
      return { kind: "investigation", scene: "", clues: [], outcomes: [] };
    case "sort":
      return { kind: "sorting", items: [], bins: [] };
    case "sequence":
      return { kind: "ordering", items: [] };
    case "label":
      return { kind: "matching", items: [], targets: [] };
    case "fair-test":
      return undefined;
  }
}

/**
 * The station, dressed as a question.
 *
 * `id` is the station id, unprefixed, so item health (WP-06) can flag a lab station whose
 * distractor is swallowing the wrong answers in exactly the same query that flags a quest
 * item. A separate namespace would have meant a separate report nobody reads.
 */
export function labQuestion(station: LabStation, tier: LabTier, grade: GradeBand): Question {
  return {
    id: station.id,
    subject: "science",
    grade,
    level: station.tiers.includes("scientist") && !station.tiers.includes("explorer") ? 3 : 2,
    skillId: station.skillId,
    activityType: activityTypeFor[kindOf(station)],
    phase: station.phase,
    estimatedMinutes: station.minutes,
    contextTags: ["nature"],
    prompt: say(station.title, tier),
    options: [],
    // The answer never leaves the server, and this shim is server-side only — but it is
    // left empty regardless, so that a future accident which serialises a `Question`
    // cannot leak one.
    answer: "",
    hint: "",
    explanation: say(station.explain, tier),
    engine: stubEngine(station),
    verb: verbForLabActivity[kindOf(station)],
  };
}
