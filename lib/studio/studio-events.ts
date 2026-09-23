import type { GradeBand } from "@/lib/skill-graph";
import type { Question } from "@/lib/curriculum";
import type { WritingCharacter, WritingGroup } from "./types";

/**
 * How a traced letter becomes evidence.
 *
 * Handwriting was the one genuinely instructional thing in the old studio and the
 * product learned nothing from it. A child could trace every capital in the alphabet and
 * the parent report would not know — which matters, because letter formation is the first
 * thing a grown-up asks about at this age and the first thing they can see going wrong.
 *
 * Like the Wonder Lab's stations, a writing stroke presents itself to the rest of the
 * codebase as an ordinary `Question`, so it lands in the same mastery record and the same
 * item-health query as everything else rather than in a parallel system nobody reads.
 *
 * The verb is `build`. That is not a flourish: §C1's verb list is ordered by the strength
 * of evidence it produces, `choose` is last, and forming a letter from the right starting
 * point in the right direction is production rather than recognition. It is also, with
 * the lab's `predict` and `sort`, part of how a child accumulates the *two different
 * verbs* the evidence rule (§C2) asks for before a skill counts as mastered.
 */

/**
 * One stroke of one character, as a question.
 *
 * The item id is per *stroke* rather than per letter, because that is the grain the
 * teaching happens at: a child who can draw `b`'s long line and not its bowl has a
 * specific, fixable problem, and an item id of `b` would average the two together and
 * hide it.
 */
export function writingQuestion(
  group: WritingGroup,
  character: WritingCharacter,
  strokeIndex: number,
  grade: GradeBand,
): Question {
  return {
    id: `write-${group.id}-${character.key}-${strokeIndex}`,
    subject: "reading",
    grade,
    level: group.id === "warmups" ? 1 : 2,
    skillId: group.skillId,
    activityType: "word-builder",
    phase: group.id === "warmups" ? "discover" : "guided",
    estimatedMinutes: 1,
    contextTags: ["building"],
    prompt: character.strokes[strokeIndex].cue,
    options: [],
    // There is no answer key here at all: the trail is visible the whole time, by design.
    // Left empty so a `Question` that escapes this module cannot pretend otherwise.
    answer: "",
    hint: "",
    explanation: character.strokes[strokeIndex].cue,
    engine: { kind: "word-builder", letters: [], length: 0 },
    verb: "build",
  };
}
