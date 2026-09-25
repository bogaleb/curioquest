import "server-only";
import type { LearningBandId } from "@/lib/learning-bands";
import { primaryContentBand } from "@/lib/learning-bands";
import { tierForBand } from "@/lib/science/tier";
import type { ContextTag, Question } from "@/lib/curriculum";
import { discoveryLessons } from "./content";
import type { PublicDiscoveryLesson } from "./types";

export const discoveryById = new Map(discoveryLessons.map((lesson) => [lesson.id, lesson]));
export const discoveryItemId = (id: string, band: LearningBandId) => `discovery:${id}:${tierForBand(band)}`;

export function publicDiscoveries(band: LearningBandId, practiced = new Map<string, string>()): PublicDiscoveryLesson[] {
  return discoveryLessons.map(({ versions, ...lesson }) => {
    const { task, ...version } = versions[tierForBand(band)];
    const { answer: _answer, explanation: _explanation, ...publicTask } = task;
    void _answer; void _explanation;
    return { ...lesson, ...version, task: publicTask, practicedAt: practiced.get(discoveryItemId(lesson.id, band)) ?? null };
  });
}

export function judgeDiscovery(id: string, band: LearningBandId, response: unknown) {
  const lesson = discoveryById.get(id);
  if (!lesson) return null;
  const version = lesson.versions[tierForBand(band)];
  const task = version.task;
  if (!Array.isArray(response) || response.some((n) => !Number.isInteger(n) || n < 0)) return null;
  if (task.kind === "build") {
    if (response.length !== 1 || response[0] > (task.max ?? 20)) return null;
  } else if (task.kind === "choose") {
    if (response.length !== 1 || response[0] >= task.choices.length) return null;
  } else if (response.length !== task.choices.length || new Set(response).size !== response.length || response.some((n) => n >= task.choices.length)) return null;
  const correct = response.length === task.answer.length && response.every((n, i) => n === task.answer[i]);
  return { correct, feedback: correct ? task.explanation : `Let's look again. ${task.hint}` };
}

export function discoveryQuestion(id: string, band: LearningBandId): Question {
  const lesson = discoveryById.get(id)!;
  const version = lesson.versions[tierForBand(band)];
  const context: ContextTag = lesson.domain === "reading" || lesson.domain === "wellbeing" ? "stories" : lesson.domain === "science" ? "nature" : lesson.domain === "world" ? "building" : "puzzles";
  return {
    id: discoveryItemId(id, band), skillId: version.skillId, subject: lesson.domain,
    grade: primaryContentBand(band), level: tierForBand(band) === "explorer" ? 1 : tierForBand(band) === "investigator" ? 2 : 3,
    phase: "guided", verb: version.task.kind === "sequence" ? "sequence" : version.task.kind === "build" ? "build" : "choose",
    activityType: version.task.kind === "sequence" ? "ordering" : version.task.kind === "build" ? "counting" : "reasoning-choice",
    estimatedMinutes: lesson.minutes, contextTags: [context],
    prompt: version.task.prompt, options: version.task.choices, answer: version.task.answer.join(","),
    hint: version.task.hint, explanation: version.task.explanation,
  };
}
