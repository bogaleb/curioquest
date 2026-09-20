import type { ActivityType, Subject } from "@/lib/curriculum";
import { defaultControls, normalizeControls, type LearningControls } from './learning-controls';
import type { DiscoveryProgress } from "./discovery";
import { normalizeArcade, type ArcadeProgress } from "./arcade";
import { normalizeMastery, type SkillMasteryMap } from "@/lib/mastery";
import { emptyAdventure, normalizeAdventure, type AdventureProgress } from "./adventure";
import { DEFAULT_BAND, isLearningBandId, primaryContentBand, type LearningBandId } from "./learning-bands";

export const AVATARS = [
  { id: "fox", emoji: "🦊", label: "Clever fox" },
  { id: "rabbit", emoji: "🐰", label: "Bright rabbit" },
  { id: "bear", emoji: "🐻", label: "Brave bear" },
  { id: "owl", emoji: "🦉", label: "Curious owl" },
  { id: "panda", emoji: "🐼", label: "Playful panda" },
  { id: "lion", emoji: "🦁", label: "Bold lion" },
] as const;

export const INTERESTS = [
  { id: "animals", label: "Animals", emoji: "🐾" },
  { id: "stories", label: "Stories", emoji: "📖" },
  { id: "building", label: "Building", emoji: "🧱" },
  { id: "space", label: "Space", emoji: "🚀" },
  { id: "nature", label: "Nature", emoji: "🌿" },
  { id: "puzzles", label: "Puzzles", emoji: "🧩" },
] as const;

export type AvatarId = (typeof AVATARS)[number]["id"];
export type InterestId = (typeof INTERESTS)[number]["id"];
export type GradeTrack = "prek" | "grade1";

export type SkillTrail = {
  seen: number;
  first: number;
  level: number;
};

export type ExplorerProfile = {
  id: string;
  name: string;
  /**
   * Authored-content pool. Derived from `band`; retained as its own field so every
   * profile written before learning bands existed keeps resolving to real content.
   */
  grade: GradeTrack;
  /** Developmental band that drives delivery, difficulty, and content selection. */
  band: LearningBandId;
  avatar: AvatarId;
  interests: InterestId[];
  dailyGoal: number;
  controls: LearningControls;
  discovery?: DiscoveryProgress;
  arcade: ArcadeProgress;
  favorites: string[];
  preferences: { autoRead: boolean; reducedMotion: boolean; paused: boolean };
  createdAt: string;
  stars: number;
  completed: number;
  history: Array<{
    date: string;
    subject: Subject | "daily";
    first: number;
    total: number;
    grade: GradeTrack;
    skillIds?: string[];
    durationSeconds?: number;
    sessionId?: string;
    chapter?: number;
    teamId?: string;
    discovery?: boolean;
    gameId?: string;
    gameLevel?: number;
  }>;
  skills: Record<Subject, SkillTrail>;
  skillMastery: SkillMasteryMap;
  recentActivityTypes: ActivityType[];
  recentQuestionIds: string[];
  adventure: AdventureProgress;
  events: { type: string; at: string; skillId?: string; questionId?: string }[];
  reflections: {sessionId:string;questionId:string;strategy:string;at:string}[];
  team?: { id: string; partnerId: string; completedAt?: string };
  seen: string[];
  savedSessions: NonNullable<ExplorerProfile["session"]>[];
  session: null | {
    id: string;
    subject: Subject | "daily";
    questions: string[];
    index: number;
    misses: number;
    hinted: boolean;
    hintLevel?: number;
    discovery?: { independent: Record<Subject, number> };
    gameId?: string;
    gameLevel?: number;
    first: number;
    started: number;
    suspendedAt?: number;
    estimatedMinutes?: number;
    chapter?: number;
    teamId?: string;
    plan?: Array<{
      questionId: string;
      skillId: string;
      reason: string;
    }>;
  };
};

const subjects: Subject[] = ["reading", "math", "logic"];

export function newExplorer(
  id: string,
  name: string,
  grade: GradeTrack,
  avatar: AvatarId,
  interests: InterestId[] = [],
  dailyGoal = 10,
  band: LearningBandId = grade,
): ExplorerProfile {
  return {
    id,
    name,
    grade,
    band,
    avatar,
    interests,
    dailyGoal,
    controls: defaultControls(grade),
    arcade: {},
    favorites: [],
    preferences: { autoRead: false, reducedMotion: false, paused: false },
    createdAt: new Date().toISOString(),
    stars: 0,
    completed: 0,
    history: [],
    skills: Object.fromEntries(
      subjects.map((subject) => [subject, { seen: 0, first: 0, level: 1 }]),
    ) as Record<Subject, SkillTrail>,
    skillMastery: {},
    recentActivityTypes: [],
    recentQuestionIds: [],
    adventure: emptyAdventure(),
    events: [],
    reflections: [],
    seen: [],
    savedSessions: [],
    session: null,
  };
}

export function normalizeExplorer(value: unknown): ExplorerProfile {
  const profile = value as Partial<ExplorerProfile> & { id?: string };
  const fallbackAvatar: AvatarId = profile.id === "lydia" ? "rabbit" : "fox";
  // A profile written before bands existed carries only `grade`, and both legacy
  // values are themselves valid band IDs, so it resolves without a migration.
  const band: LearningBandId = isLearningBandId(profile.band)
    ? profile.band
    : isLearningBandId(profile.grade)
      ? profile.grade
      : DEFAULT_BAND;
  const grade: GradeTrack = primaryContentBand(band);
  const fallback = newExplorer(
    String(profile.id ?? "explorer"),
    String(profile.name ?? "Explorer"),
    grade,
    fallbackAvatar,
    [],
    10,
    band,
  );

  return {
    ...fallback,
    ...profile,
    grade,
    band,
    avatar: AVATARS.some((avatar) => avatar.id === profile.avatar)
      ? (profile.avatar as AvatarId)
      : fallbackAvatar,
    controls: normalizeControls(profile.controls,grade),
    arcade: normalizeArcade(profile.arcade),
    favorites: Array.isArray(profile.favorites) ? profile.favorites.filter(id=>typeof id==="string").slice(0,8) : [],
    preferences: { autoRead: profile.preferences?.autoRead === true, reducedMotion: profile.preferences?.reducedMotion === true, paused: profile.preferences?.paused === true },
    interests: Array.isArray(profile.interests)
      ? profile.interests.filter((interest): interest is InterestId =>
          INTERESTS.some((option) => option.id === interest),
        )
      : [],
    dailyGoal: [8, 10, 15, 20].includes(Number(profile.dailyGoal))
      ? Number(profile.dailyGoal)
      : 10,
    createdAt:
      typeof profile.createdAt === "string" ? profile.createdAt : fallback.createdAt,
    history: Array.isArray(profile.history) ? profile.history : [],
    skillMastery: normalizeMastery(profile.skillMastery),
    adventure: normalizeAdventure(profile.adventure),
    events: Array.isArray(profile.events) ? profile.events.slice(-100) : [],
    reflections: Array.isArray(profile.reflections) ? profile.reflections.slice(-100) : [],
    recentQuestionIds: Array.isArray(profile.recentQuestionIds) ? profile.recentQuestionIds.slice(-20) : [],
    recentActivityTypes: Array.isArray(profile.recentActivityTypes)
      ? profile.recentActivityTypes.slice(-8)
      : [],
    seen: Array.isArray(profile.seen) ? profile.seen : [],
    savedSessions: Array.isArray(profile.savedSessions) ? profile.savedSessions.filter(s => s && typeof s.id === "string" && Array.isArray(s.questions) && s.index < s.questions.length) : [],
    skills: Object.fromEntries(
      subjects.map((subject) => [
        subject,
        {
          ...fallback.skills[subject],
          ...(profile.skills?.[subject] ?? {}),
        },
      ]),
    ) as Record<Subject, SkillTrail>,
    session: profile.session ?? null,
  };
}

export function avatarEmoji(id: string | undefined) {
  return AVATARS.find((avatar) => avatar.id === id)?.emoji ?? "🦊";
}
