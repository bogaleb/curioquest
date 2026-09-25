import type { LearningBandId } from "@/lib/learning-bands";
import type { SkillSubject } from "@/lib/skill-graph";
import type { LabTier } from "@/lib/science/types";

export type DiscoveryDomain = SkillSubject;
export type DiscoveryTask = {
  kind: "choose" | "sequence" | "build";
  prompt: string;
  choices: string[];
  /** Server-only answer: option indices, an ordered list, or a counter total. */
  answer: number[];
  max?: number;
  unit?: string;
  hint: string;
  explanation: string;
};
export type DiscoveryVersion = {
  skillId: string;
  idea: string;
  example: string;
  notice: string;
  task: DiscoveryTask;
  talk: string;
  away: string;
};
export type DiscoveryLesson = {
  id: string;
  domain: DiscoveryDomain;
  title: string;
  subtitle: string;
  minutes: number;
  vocabulary: { word: string; meaning: string };
  sourceIds: string[];
  next: { label: string; href: string };
  versions: Record<LabTier, DiscoveryVersion>;
};
export type PublicDiscoveryLesson = Omit<DiscoveryLesson, "versions"> & Omit<DiscoveryVersion, "task"> & {
  task: Omit<DiscoveryTask, "answer" | "explanation">;
  practicedAt: string | null;
};
export type DiscoveryData = { band: LearningBandId; lessons: PublicDiscoveryLesson[] };
export type DiscoveryInput = { lesson: string; response: number[]; attempt: string; session: string; startedAt: number };
export type DiscoveryResult = { correct: boolean; feedback: string; practicedAt: string | null };
export type DiscoverySource = {
  load: (signal: AbortSignal) => Promise<DiscoveryData>;
  attempt: (input: DiscoveryInput) => Promise<DiscoveryResult>;
};
