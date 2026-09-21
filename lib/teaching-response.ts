import type { Question } from "@/lib/curriculum";
import type { SkillMasteryMap } from "@/lib/mastery";
import { skillById } from "@/lib/skill-graph";
import { resolveBand, type LearningBandId } from "@/lib/learning-bands";
import { wordBudget, countWords } from "@/lib/kid-copy";
import { teachingMove, type ErrorKind, type TeachingMove } from "@/lib/error-kinds";

/**
 * What happens next, when a child gets something wrong (blueprint §C3, WP-04).
 *
 * Before this, every wrong answer in the product produced the same sentence — "Good
 * thinking. Let's try another answer." — followed by the same authored hint, whether the
 * child had confused two letter shapes, mis-heard a sound, said a letter's name instead
 * of its sound, slipped by one while counting, or been asked something they had never
 * been taught. The misconception was already being *recorded* on the event, and then
 * thrown away.
 *
 * This turns it into a move. Not a nicer sentence: a different thing to do. Two children
 * who answer the same item wrong in two different ways now get two different next steps,
 * which is the whole acceptance criterion of WP-04 and the reason the error taxonomy
 * exists at all.
 *
 * The copy obeys §C5. Every line is addressed to the child, uses no system vocabulary,
 * and fits inside the band's on-screen word budget — the youngest band gets six words,
 * not a paragraph, and the hint is dropped rather than squeezed when there is no room
 * for both. `tests/teaching-response.test.mjs` checks every line of it.
 */

export type TeachingResponse = {
  errorKind: ErrorKind | null;
  move: TeachingMove | null;
  /** Nova's line. Always present, always within the band's budget. */
  message: string;
  /** One more line, only when the band has room for it. */
  hint: string | null;
  /** `compare`: the two things to put side by side. The child's choice comes first. */
  compare?: { chosen: string; answer: string };
  /** `relisten` / `sound-not-name`: what to play again. */
  listen?: string;
  /** `recount`: how many there are to count, slowly, touching each one. */
  count?: number;
  /** `settle`: a beat before trying again, because the answer was fast, not wrong-headed. */
  pause?: boolean;
  /** `step-back`: the prerequisite to visit before coming back to this. */
  stepBackSkillId?: string;
};

/** Nova's line for each move, in two registers. Shorter is for the younger bands. */
const lines: Record<TeachingMove, { younger: string; older: string; hint: string }> = {
  compare: {
    younger: "Look at these two.",
    older: "These two look alike. Look again.",
    hint: "Trace each one with your finger.",
  },
  relisten: {
    younger: "Listen again.",
    older: "Those sounds are close. Listen again.",
    hint: "Say it with me, slowly.",
  },
  "sound-not-name": {
    younger: "That is its name.",
    older: "That is its name. We want its sound.",
    hint: "The letter m says mmm.",
  },
  recount: {
    younger: "So close. Count again.",
    older: "So close — one out. Count it again.",
    hint: "Touch each one as you count.",
  },
  "restate-rule": {
    younger: "Check what we are sorting.",
    older: "You sorted them. Check what we asked for.",
    hint: "Look at the shape, not the colour.",
  },
  reorder: {
    younger: "Right pieces. New order.",
    older: "All the right pieces — try a new order.",
    hint: "Which one comes first?",
  },
  settle: {
    younger: "No rush. Look again.",
    older: "No rush. Take a good look first.",
    hint: "Look at every answer before you touch one.",
  },
  "step-back": {
    younger: "Let's try something first.",
    older: "This one is new. Let's try something first.",
    hint: "We will come back to this.",
  },
};

/** The line for a wrong answer nobody could classify. Warm, and not a verdict. */
const unclassified = {
  younger: "Not that one. Try again.",
  older: "Not that one. Have another try.",
};

/**
 * The first prerequisite this child has never attempted.
 *
 * "Never attempted" rather than "not mastered": a child practising a prerequisite is
 * allowed to meet what builds on it, and sending them backwards every time would make
 * progress impossible. This is the gap the recommender should never have left.
 */
export function unmetPrerequisite(skillId: string, mastery: SkillMasteryMap): string | null {
  const skill = skillById.get(skillId);
  if (!skill?.prerequisites.length) return null;
  for (const id of skill.prerequisites) {
    const record = mastery[id];
    if (!record || record.attemptCount === 0) return id;
  }
  return null;
}

export function teachingResponse(input: {
  question: Pick<Question, "answer" | "hint" | "engine" | "skillId" | "activityType">;
  response: string;
  errorKind: ErrorKind | null;
  band: LearningBandId;
  /** The child's mastery, used only to name the prerequisite for a step-back. */
  mastery?: SkillMasteryMap;
}): TeachingResponse {
  const { question, response, errorKind, band } = input;
  const move = teachingMove(errorKind);
  const younger = resolveBand(band).stage <= 1;
  const budget = wordBudget(band);

  const copy = move ? lines[move] : null;
  const message = copy ? (younger ? copy.younger : copy.older) : younger ? unclassified.younger : unclassified.older;

  // Message and hint share the screen, so they share the budget. When both will not fit,
  // the hint goes: a child who cannot read all of it reads none of it.
  const hintText = copy?.hint ?? question.hint ?? null;
  const hint = hintText && countWords(message) + countWords(hintText) <= budget ? hintText : null;

  const result: TeachingResponse = { errorKind, move, message, hint };

  switch (move) {
    case "compare":
      // Both shapes, side by side, the child's own choice first — the comparison only
      // teaches if the child can see what they picked next to what was wanted.
      result.compare = { chosen: response, answer: String(question.answer) };
      break;
    case "relisten":
      result.listen = String(question.answer);
      break;
    case "sound-not-name":
      result.listen = String(question.answer);
      break;
    case "recount": {
      const target = Number(question.answer);
      if (Number.isFinite(target)) result.count = target;
      break;
    }
    case "settle":
      result.pause = true;
      break;
    case "step-back": {
      const prerequisite = input.mastery
        ? unmetPrerequisite(question.skillId, input.mastery)
        : null;
      if (prerequisite) result.stepBackSkillId = prerequisite;
      break;
    }
    default:
      break;
  }

  return result;
}

/**
 * The same decision for the reading slice, which has its own attempt shape and its own
 * route, but must not have its own idea of what a wrong answer means.
 */
export function readingTeachingLine(errorKind: ErrorKind | null, band: LearningBandId): string {
  const move = teachingMove(errorKind);
  const younger = resolveBand(band).stage <= 1;
  if (!move) return younger ? unclassified.younger : unclassified.older;
  return younger ? lines[move].younger : lines[move].older;
}
