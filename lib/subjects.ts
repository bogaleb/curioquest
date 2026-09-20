import type { SkillSubject } from "./skill-graph";

/**
 * The subject registry.
 *
 * One place that knows what a subject is called, what it looks like, and how it
 * behaves — so adding a seventh subject does not mean editing seventeen files.
 *
 * `core` subjects (reading, math, logic) carry the placement check and form the
 * backbone of the daily rotation. `explore` subjects enrich a day once the core is
 * covered; they are never the reason a child cannot get a quest.
 */
export type SubjectMeta = {
  id: SkillSubject;
  /** The place a child visits. */
  world: string;
  /** Two or three words above the world name. */
  eyebrow: string;
  /** Parent-facing name for reports and settings. */
  label: string;
  /** Colour family from tokens.css. */
  hue: "leaf" | "amber" | "violet" | "teal" | "indigo" | "coral";
  core: boolean;
  /** What the child does there, per band maturity. */
  younger: string;
  older: string;
};

export const subjectRegistry: SubjectMeta[] = [
  {
    id: "reading",
    world: "Word Forest",
    eyebrow: "Listen & read",
    label: "Reading",
    hue: "leaf",
    core: true,
    younger: "Hear sounds. Find letter friends.",
    older: "Build words. Discover their meaning.",
  },
  {
    id: "math",
    world: "Number City",
    eyebrow: "Count & discover",
    label: "Mathematics",
    hue: "amber",
    core: true,
    younger: "Count objects. Explore shapes.",
    older: "Add, subtract, and explain your thinking.",
  },
  {
    id: "logic",
    world: "Logic Mountain",
    eyebrow: "Think & solve",
    label: "Logic & reasoning",
    hue: "violet",
    core: true,
    younger: "Match, sort, and spot patterns.",
    older: "Plan a route. Test a new idea.",
  },
  {
    id: "science",
    world: "Discovery Lab",
    eyebrow: "Wonder & test",
    label: "Science",
    hue: "teal",
    core: false,
    younger: "Watch, sort, and wonder why.",
    older: "Predict, test, and explain what happened.",
  },
  {
    id: "world",
    world: "Wide World",
    eyebrow: "Explore & know",
    label: "Our world",
    hue: "indigo",
    core: false,
    younger: "Meet helpers, places, and machines.",
    older: "Compare places, times, and inventions.",
  },
  {
    id: "wellbeing",
    world: "Kind Cove",
    eyebrow: "Feel & care",
    label: "Feelings & friendship",
    hue: "coral",
    core: false,
    younger: "Name feelings. Practise being kind.",
    older: "Solve problems with others. Make good choices.",
  },
];

export const subjectById = new Map(subjectRegistry.map((subject) => [subject.id, subject]));

/** Every subject, in display order. */
export const allSubjects: SkillSubject[] = subjectRegistry.map((subject) => subject.id);

/** Subjects that carry placement and anchor the daily rotation. */
export const coreSubjects: SkillSubject[] = subjectRegistry
  .filter((subject) => subject.core)
  .map((subject) => subject.id);

export function subjectMeta(id: SkillSubject) {
  return subjectById.get(id)!;
}

export function worldName(id: string) {
  return subjectById.get(id as SkillSubject)?.world ?? "Daily Quest";
}

export function isSubject(value: unknown): value is SkillSubject {
  return typeof value === "string" && subjectById.has(value as SkillSubject);
}

/** A record with an entry for every subject, used for counters and tallies. */
export function bySubject<T>(make: (id: SkillSubject) => T) {
  return Object.fromEntries(allSubjects.map((id) => [id, make(id)])) as Record<SkillSubject, T>;
}
