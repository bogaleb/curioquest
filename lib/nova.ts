import type { Question } from "./curriculum";

export type TutorContext = {
  activityId: string;
  skillId: string;
  track: "prek" | "grade1";
  hintLevel: number;
};
export type TutorReply = { source: "authored"; text: string; level: number };

// This is the only tutor boundary. A future provider must keep the same
// approved-activity contract; it must never receive free-form child prompts.
export function authoredHint(question: Question, context: TutorContext): TutorReply {
  if(context.activityId!==question.id||context.skillId!==question.skillId||context.track!==question.grade) {
    throw new Error("Tutor context must match the approved activity.");
  }
  const level=Math.max(1,Math.min(3,context.hintLevel));
  const strategy=question.engine?.kind==="sorting"?"Look at one object at a time. What is it used for?"
    :question.engine?.kind==="counting"?"Point to each object once. Say one number for each object."
    :question.engine?.kind==="memory"?"Say the items in order. You can ask to see them again."
    :question.subject==="reading"?"Listen again slowly. What sound or story clue do you notice?"
    :"Look for a part you already understand. Let's work from there.";
  return {source:"authored",level,text:level===1?question.hint:level===2?strategy:question.explanation};
}
