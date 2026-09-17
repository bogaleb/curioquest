import { questions, type ActivityType, type Question, type Subject } from "@/lib/curriculum";
import type { ExplorerProfile } from "@/lib/explorers";
import { skillById } from "@/lib/skill-graph";
import { questSizeForGoal } from "./quest-settings";
export { questSizeForGoal } from "./quest-settings";

export type RecommendationReason =
  | "review-due"
  | "prerequisite-support"
  | "next-step"
  | "confidence-builder"
  | "fresh-discovery"
  | "interest-match";

export type QuestRecommendation = {
  questionIds: string[];
  plan: Array<{
    questionId: string;
    skillId: string;
    reason: RecommendationReason;
  }>;
  estimatedMinutes: number;
};

export function recommendQuest(
  profile: ExplorerProfile,
  requestedSubject: Subject | "daily",
  now = new Date(),
): QuestRecommendation {
  const count = questSizeForGoal(profile.dailyGoal);
  const chosen: Question[] = [];
  const plan: QuestRecommendation["plan"] = [];
  const subjects = subjectSequence(profile, requestedSubject, count);

  for (const subject of subjects) {
    const candidates = questions.filter(
      (question) =>
        (question.grade === profile.grade || isWeakPrerequisite(profile, question.skillId)) &&
        !question.campaignOnly &&
        question.subject === subject &&
        !chosen.some((item) => item.id === question.id),
    );
    const ranked = candidates
      .map((question) => rankQuestion(profile, question, chosen, now))
      .sort((left, right) => right.score - left.score || left.question.id.localeCompare(right.question.id));
    const selected = ranked[0];
    if (!selected) continue;
    chosen.push(selected.question);
    plan.push({
      questionId: selected.question.id,
      skillId: selected.question.skillId,
      reason: selected.reason,
    });
  }

  return {
    questionIds: chosen.map((question) => question.id),
    plan,
    estimatedMinutes: chosen.reduce((total, question) => total + question.estimatedMinutes, 0),
  };
}

function subjectSequence(
  profile: ExplorerProfile,
  requestedSubject: Subject | "daily",
  count: number,
): Subject[] {
  if (requestedSubject !== "daily") return Array.from({ length: count }, () => requestedSubject);
  const base: Subject[] = ["reading", "math", "logic"];
  const weakest = [...base].sort((left, right) => subjectStrength(profile, left) - subjectStrength(profile, right));
  const sequence = [...base];
  while (sequence.length < count) sequence.push(weakest[(sequence.length - base.length) % weakest.length]);
  return rotate(sequence, profile.completed % sequence.length);
}

function subjectStrength(profile: ExplorerProfile, subject: Subject) {
  const records = Object.entries(profile.skillMastery)
    .filter(([skillId]) => skillById.get(skillId)?.subject === subject)
    .map(([, mastery]) => mastery.score);
  if (!records.length) return profile.skills[subject].level * 20;
  return records.reduce((sum, score) => sum + score, 0) / records.length;
}

function rankQuestion(
  profile: ExplorerProfile,
  question: Question,
  chosen: Question[],
  now: Date,
) {
  const mastery = profile.skillMastery[question.skillId];
  const skill = skillById.get(question.skillId)!;
  const seen = profile.seen.includes(question.id);
  const due = mastery?.nextReviewAt ? new Date(mastery.nextReviewAt) <= now : false;
  const interestMatch = question.contextTags.some((tag) => profile.interests.includes(tag));
  const recentFormat = profile.recentActivityTypes.slice(-3).includes(question.activityType);
  const repeatedSkill = chosen.filter((item) => item.skillId === question.skillId).length;
  const expectedLevel = profile.skills[question.subject].level;
  const prerequisiteWeak = skill.prerequisites.some((id) => {
    const prerequisite = profile.skillMastery[id];
    return prerequisite && prerequisite.attemptCount >= 2 && prerequisite.score < 55;
  });

  let score = deterministicJitter(profile.id, question.id, profile.completed);
  let reason: RecommendationReason = "next-step";
  if (isWeakPrerequisite(profile, question.skillId)) {
    score += 90;
    reason = "prerequisite-support";
  }

  if (!seen) {
    score += 32;
    if (reason !== "prerequisite-support") reason = "fresh-discovery";
  }
  if (due) {
    score += 45;
    reason = "review-due";
  }
  if (prerequisiteWeak) {
    score -= 100;
  } else if (skill.prerequisites.some((id) => (profile.skillMastery[id]?.score ?? 0) < 50)) {
    const activePrerequisiteAvailable = questions.some(
      (item) => item.grade === profile.grade && skill.prerequisites.includes(item.skillId),
    );
    if (activePrerequisiteAvailable) score -= 14;
  }
  if (mastery && mastery.attemptCount >= 2 && mastery.score < 60) {
    score += 30;
    if (!due && reason !== "prerequisite-support") reason = "next-step";
  }
  if (mastery && mastery.score >= 80 && mastery.confidence >= 50 && !due) {
    score -= 18;
  }
  if (mastery && mastery.score >= 70 && mastery.score < 90 && chosen.length === 0) {
    score += 10;
    reason = "confidence-builder";
  }
  score += Math.max(0, 14 - Math.abs(question.level - expectedLevel) * 9);
  if (interestMatch) {
    score += 8;
    if (reason === "next-step" || reason === "fresh-discovery") reason = "interest-match";
  }
  if (recentFormat) score -= 5;
  score -= repeatedSkill * 45;
  if (profile.recentQuestionIds?.includes(question.id)) score -= 55;

  return { question, score, reason };
}

function deterministicJitter(profileId: string, questionId: string, completed: number) {
  const value = `${profileId}:${questionId}:${completed}`;
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) | 0;
  return Math.abs(hash % 11);
}

function rotate<T>(values: T[], by: number) {
  return [...values.slice(by), ...values.slice(0, by)];
}

export function rememberActivityType(types: ActivityType[], activityType: ActivityType) {
  return [...types, activityType].slice(-8);
}

function isWeakPrerequisite(profile: ExplorerProfile, skillId: string) {
  const record = profile.skillMastery[skillId];
  if (!record || record.attemptCount < 2 || record.score >= 55) return false;
  return [...skillById.values()].some(node => node.gradeBands.includes(profile.grade) && node.prerequisites.includes(skillId));
}
