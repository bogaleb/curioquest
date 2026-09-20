import type { ExplorerProfile } from "./explorers";

/**
 * Achievements read only recorded evidence, never session internals. Typing the
 * input structurally lets the same evaluation run on the server profile and on the
 * trimmed profile the client receives.
 */
export type AchievementInput = Pick<
  ExplorerProfile,
  "completed" | "stars" | "skillMastery" | "reflections" | "events"
>;
import { progressionState } from "./mastery";
import { skillById } from "./skill-graph";
import { allSubjects, subjectMeta } from "./subjects";

/**
 * Achievements.
 *
 * Every achievement here is earned by learning, not by attendance. There are no
 * rewards for opening the app, for playing at a particular time, or for keeping a
 * streak alive — a child who takes a week off must never come back to a loss. The
 * categories deliberately reward the behaviours that actually build a learner:
 * finishing, mastering, persisting through difficulty, returning to a weak skill,
 * exploring widely, reading, and making things.
 */

export type AchievementCategory =
  | "journey"
  | "mastery"
  | "persistence"
  | "curiosity"
  | "craft";

export type AchievementTier = "seed" | "sprout" | "bloom";

export type Achievement = {
  id: string;
  name: string;
  /** Shown once earned. Written to the child. */
  earnedText: string;
  /** Shown while locked. Describes the path, never a deficit. */
  questText: string;
  category: AchievementCategory;
  tier: AchievementTier;
  icon: string;
  /** Current progress toward the achievement, 0..target. */
  measure: (profile: AchievementInput) => number;
  target: number;
};

/** Distinct skills that have reached a given progression state. */
function skillsAt(profile: AchievementInput, states: string[]) {
  return Object.values(profile.skillMastery).filter((record) =>
    states.includes(progressionState(record)),
  ).length;
}

function subjectsPractised(profile: AchievementInput) {
  const seen = new Set<string>();
  for (const [skillId, record] of Object.entries(profile.skillMastery)) {
    if (record.attemptCount > 0) {
      const subject = skillById.get(skillId)?.subject;
      if (subject) seen.add(subject);
    }
  }
  return seen.size;
}

/** Activities answered correctly on a later attempt — evidence of sticking with it. */
function recoveries(profile: AchievementInput) {
  return Object.values(profile.skillMastery).reduce(
    (total, record) => total + Math.max(0, record.correctCount - record.independentCorrect),
    0,
  );
}

/** Skills that were weak and later reached a confident state. */
function comebacks(profile: AchievementInput) {
  return Object.values(profile.skillMastery).filter(
    (record) => record.hintCount > 0 && ["strong", "mastered"].includes(progressionState(record)),
  ).length;
}

function reviewsRetained(profile: AchievementInput) {
  return Object.values(profile.skillMastery).reduce(
    (total, record) => total + (record.retainedReviews ?? 0),
    0,
  );
}

export const achievements: Achievement[] = [
  // ---- Journey: finishing what you start ---------------------------------
  {
    id: "first-discovery", name: "First discovery", category: "journey", tier: "seed", icon: "compass",
    earnedText: "You finished your very first quest.",
    questText: "Finish one quest.",
    measure: (profile) => profile.completed, target: 1,
  },
  {
    id: "trail-finder", name: "Trail finder", category: "journey", tier: "seed", icon: "map",
    earnedText: "Five quests complete. You know your way around.",
    questText: "Finish five quests.",
    measure: (profile) => profile.completed, target: 5,
  },
  {
    id: "long-walker", name: "Long walker", category: "journey", tier: "sprout", icon: "footprints",
    earnedText: "Twenty quests. That is real dedication.",
    questText: "Finish twenty quests.",
    measure: (profile) => profile.completed, target: 20,
  },
  {
    id: "expedition", name: "Great expedition", category: "journey", tier: "bloom", icon: "mountain",
    earnedText: "Fifty quests complete. What an explorer you have become.",
    questText: "Finish fifty quests.",
    measure: (profile) => profile.completed, target: 50,
  },

  // ---- Mastery: knowing something for keeps -------------------------------
  {
    id: "first-skill", name: "It clicked", category: "mastery", tier: "seed", icon: "sparkles",
    earnedText: "A skill became strong. You really understand it.",
    questText: "Make one skill strong.",
    measure: (profile) => skillsAt(profile, ["strong", "mastered"]), target: 1,
  },
  {
    id: "five-strong", name: "Five strong", category: "mastery", tier: "sprout", icon: "award",
    earnedText: "Five skills are strong. Your toolkit is growing.",
    questText: "Make five skills strong.",
    measure: (profile) => skillsAt(profile, ["strong", "mastered"]), target: 5,
  },
  {
    id: "true-mastery", name: "Knows it by heart", category: "mastery", tier: "bloom", icon: "trophy",
    earnedText: "You mastered a skill — shown in different ways, on different days.",
    questText: "Master a skill by showing it in different ways, on different days.",
    measure: (profile) => skillsAt(profile, ["mastered"]), target: 1,
  },
  {
    id: "remembered", name: "Still remembered", category: "mastery", tier: "sprout", icon: "brain",
    earnedText: "You came back to something later and still knew it.",
    questText: "Return to a skill after a few days and get it right.",
    measure: reviewsRetained, target: 3,
  },

  // ---- Persistence: the most important one --------------------------------
  {
    id: "tried-again", name: "Tried again", category: "persistence", tier: "seed", icon: "rotate",
    earnedText: "Something was tricky and you kept going. That is how learning works.",
    questText: "Get something right after a tricky start.",
    measure: recoveries, target: 1,
  },
  {
    id: "not-yet", name: "Not yet, then yes", category: "persistence", tier: "sprout", icon: "flag",
    earnedText: "Ten times you turned a tricky moment into a right answer.",
    questText: "Turn ten tricky moments into right answers.",
    measure: recoveries, target: 10,
  },
  {
    id: "comeback", name: "Great comeback", category: "persistence", tier: "bloom", icon: "heart",
    earnedText: "A skill you needed help with is now one of your strong ones.",
    questText: "Turn a skill you needed help with into a strong one.",
    measure: comebacks, target: 1,
  },
  {
    id: "asked-for-help", name: "Good thinking", category: "persistence", tier: "seed", icon: "lightbulb",
    earnedText: "You used a hint to work something out. Asking for help is smart.",
    questText: "Use a hint to work something out.",
    measure: (profile) =>
      Object.values(profile.skillMastery).reduce((total, record) => total + record.hintCount, 0),
    target: 1,
  },

  // ---- Curiosity: going wide ----------------------------------------------
  {
    id: "two-worlds", name: "Two worlds", category: "curiosity", tier: "seed", icon: "globe",
    earnedText: "You have explored two different worlds.",
    questText: "Practise in two different worlds.",
    measure: subjectsPractised, target: 2,
  },
  {
    id: "every-world", name: "Everywhere explorer", category: "curiosity", tier: "bloom", icon: "star",
    earnedText: "You have explored every world in CurioQuest.",
    questText: "Practise in every world.",
    measure: subjectsPractised, target: allSubjects.length,
  },
  {
    id: "reflective", name: "Thinks about thinking", category: "curiosity", tier: "sprout", icon: "message",
    earnedText: "You explained how you worked something out, five times.",
    questText: "Tell Nova how you worked something out, five times.",
    measure: (profile) => profile.reflections.length, target: 5,
  },

  // ---- Craft: making things -----------------------------------------------
  {
    id: "first-artwork", name: "Made something", category: "craft", tier: "seed", icon: "palette",
    earnedText: "You made something and kept it in your gallery.",
    questText: "Save one piece of artwork.",
    measure: (profile) => profile.events.filter((event) => event.type === "artwork-saved").length,
    target: 1,
  },
  {
    id: "storyteller", name: "Storyteller", category: "craft", tier: "sprout", icon: "book",
    earnedText: "You finished five stories.",
    questText: "Finish five stories.",
    measure: (profile) => profile.events.filter((event) => event.type === "story-completed").length,
    target: 5,
  },
];

export const achievementById = new Map(achievements.map((item) => [item.id, item]));

export type AchievementState = {
  achievement: Achievement;
  earned: boolean;
  progress: number;
  /** 0..1, for the progress ring on a locked achievement. */
  fraction: number;
};

/** Evaluates every achievement against a profile. Pure; never mutates. */
export function evaluateAchievements(profile: AchievementInput): AchievementState[] {
  return achievements.map((achievement) => {
    const progress = Math.max(0, achievement.measure(profile));
    return {
      achievement,
      progress: Math.min(progress, achievement.target),
      earned: progress >= achievement.target,
      fraction: Math.min(1, progress / achievement.target),
    };
  });
}

export function earnedCount(profile: AchievementInput) {
  return evaluateAchievements(profile).filter((state) => state.earned).length;
}

/**
 * The two or three achievements a child is closest to earning, for a gentle nudge on
 * the home screen. Never-started achievements are excluded so the nudge is always a
 * real next step rather than an advert for everything at once.
 */
export function nearlyThere(profile: AchievementInput, limit = 3) {
  return evaluateAchievements(profile)
    .filter((state) => !state.earned && state.progress > 0)
    .sort((left, right) => right.fraction - left.fraction)
    .slice(0, limit);
}

/** Grouped for the Treasure Chest, in a stable display order. */
export const categoryOrder: AchievementCategory[] = [
  "journey",
  "mastery",
  "persistence",
  "curiosity",
  "craft",
];

export const categoryLabels: Record<AchievementCategory, { title: string; blurb: string }> = {
  journey: { title: "Your journey", blurb: "Quests you have finished." },
  mastery: { title: "Things you know", blurb: "Skills that became yours." },
  persistence: { title: "Keeping going", blurb: "The tricky moments you pushed through." },
  curiosity: { title: "Exploring", blurb: "Worlds you have visited." },
  craft: { title: "Making", blurb: "Things you created." },
};

/** Parent-facing summary of what a child's achievements actually evidence. */
export function achievementSummary(profile: AchievementInput) {
  const states = evaluateAchievements(profile);
  const byCategory = categoryOrder.map((category) => ({
    category,
    label: categoryLabels[category].title,
    earned: states.filter((state) => state.earned && state.achievement.category === category).length,
    total: states.filter((state) => state.achievement.category === category).length,
  }));
  return {
    earned: states.filter((state) => state.earned).length,
    total: states.length,
    byCategory,
    subjectsPractised: subjectsPractised(profile),
    subjectNames: allSubjects
      .filter((subject) =>
        Object.entries(profile.skillMastery).some(
          ([skillId, record]) => record.attemptCount > 0 && skillById.get(skillId)?.subject === subject,
        ),
      )
      .map((subject) => subjectMeta(subject).label),
  };
}
