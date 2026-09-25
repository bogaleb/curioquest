import type { CastState } from "@/lib/experience/types";
import type { QuestFeedback } from "@/lib/explorer-view";
import type { SkillSubject } from "@/lib/skill-graph";
import type { TeachingMove } from "@/lib/error-kinds";

/**
 * The CharacterDirector — the spinal cord of the cast.
 *
 * One module answers: *who appears, in what state, saying what, with what media* —
 * driven by learning events, not by each screen improvising. Mount it wherever a
 * character faces the child (QuestPlayer ask/reach slots, KidShell companion,
 * ReadingAdventure, Theater) and the whole app speaks with one cast.
 *
 * Two media tiers:
 * - `clip: null` → the live SVG puppet (instant, always available, in-lesson).
 * - `clip: "<id>"` → a hero video played through InteractiveMediaPlayer
 *   (welcome, lesson intros, Tuno breathing, cast finale).
 */

export type CastId =
  | "curio" // the fox — overall guide
  | "nova" // the child explorer — peer, player stand-in
  | "luna" // the owl — reading
  | "milo" // the robot — math, coding, logic
  | "bea" // the bee — science
  | "tuno" // the turtle — calm, SEL, focus
  | "riff" // the rabbit — music, movement
  | "atlas"; // the elephant — geography, world

export const CAST: Record<CastId, { name: string; role: string }> = {
  curio: { name: "Curio", role: "your guide" },
  nova: { name: "Nova", role: "fellow explorer" },
  luna: { name: "Luna", role: "reading teacher" },
  milo: { name: "Milo", role: "math teacher" },
  bea: { name: "Bea", role: "science teacher" },
  tuno: { name: "Tuno", role: "calm coach" },
  riff: { name: "Riff", role: "music teacher" },
  atlas: { name: "Atlas", role: "world guide" },
};

/** Which specialist teaches each subject. */
export const SPECIALIST: Record<SkillSubject, CastId> = {
  reading: "luna",
  math: "milo",
  logic: "milo",
  science: "bea",
  world: "atlas",
  wellbeing: "tuno",
};

/**
 * Which character delivers each wrong-answer teaching move.
 * - `settle` → Tuno: the calming moment already exists as UI; he owns it.
 * - `compare` → Nova: the peer tries first and gets it wrong out loud, so
 *   being wrong looks survivable. Nobody performs disappointment at a child.
 */
export const MOVE_CAST: Record<TeachingMove, CastId> = {
  compare: "nova",
  relisten: "luna",
  "sound-not-name": "luna",
  recount: "milo",
  "restate-rule": "curio",
  reorder: "milo",
  settle: "tuno",
  "step-back": "curio",
};

/** Hero video clips (MediaAsset ids in the theater catalog). Null = live puppet. */
export const CLIPS = {
  curioWelcome: "curio-welcome",
  castFinale: "cast-finale",
  tunoBreathing: "tuno-breathing",
  /**
   * Curio's "intro" is the welcome itself — he is the guide, not a subject
   * specialist, so the daily adventure opens with curio-welcome.
   */
  lessonIntro: (who: CastId) => (who === "curio" ? "curio-welcome" : `${who}-intro`),
} as const;

export type Direction = {
  who: CastId;
  state: CastState;
  /** MediaAsset id for a hero video, or null for the live puppet. */
  clip: string | null;
};

export type DirectorInput = {
  /** `daily` is the guided adventure session — Curio leads it. */
  subject: SkillSubject | "daily";
  feedback: QuestFeedback;
  stalled: boolean;
  /** True when the correct answer finished the session. */
  isFinale?: boolean;
};

/** Resolve the on-screen teacher for a subject. The daily adventure is Curio's. */
export function specialistFor(subject: SkillSubject | "daily"): CastId {
  return subject === "daily" ? "curio" : SPECIALIST[subject];
}

/**
 * Direct the character moment for a question in QuestPlayer.
 * Priority: finale → correct → teaching move → wrong → stalled → asking.
 */
export function direct(input: DirectorInput): Direction {
  const { subject, feedback, stalled, isFinale } = input;
  const specialist = specialistFor(subject);

  if (feedback?.correct && isFinale) {
    return { who: "curio", state: "celebrate", clip: CLIPS.castFinale };
  }
  if (feedback?.correct) {
    return { who: specialist, state: "celebrate", clip: null };
  }
  if (feedback?.move) {
    const who = MOVE_CAST[feedback.move];
    return {
      who,
      state: "encourage",
      clip: feedback.move === "settle" ? CLIPS.tunoBreathing : null,
    };
  }
  if (feedback?.message) {
    return { who: specialist, state: "explain", clip: null };
  }
  if (stalled) {
    return { who: specialist, state: "encourage", clip: null };
  }
  return { who: specialist, state: "idle", clip: null };
}

/** Session entry: Curio welcomes the child with the welcome video. */
export function directWelcome(): Direction {
  return { who: "curio", state: "wave", clip: CLIPS.curioWelcome };
}

/** Lesson intro: the specialist teaches before the interaction starts. */
export function directLessonIntro(subject: SkillSubject | "daily"): Direction {
  const who = specialistFor(subject);
  return { who, state: "explain", clip: CLIPS.lessonIntro(who) };
}

/** Celebration for non-finale milestones (engine complete, star earned). */
const CHEER_CLIPS: Partial<Record<CastId, string>> = {
  curio: "curio-celebrate",
  nova: "nova-highfive",
  luna: "luna-praise",
  milo: "milo-dance",
  tuno: "tuno-proud",
};

export function directCheer(who: CastId = "curio"): Direction {
  return { who, state: "celebrate", clip: CHEER_CLIPS[who] ?? null };
}

/**
 * The "show me" teaching clip for a subject — the replayable video the
 * specialist uses when a child asks for help mid-lesson. Always optional,
 * never automatic: the child invites it.
 */
export const TEACHING_CLIPS: Record<SkillSubject, string> = {
  reading: "luna-letter-trace",
  math: "milo-counting",
  logic: "milo-counting",
  science: "bea-growth",
  world: "atlas-continents",
  wellbeing: "tuno-breathing",
};

export function teachingClipFor(subject: SkillSubject): string {
  return TEACHING_CLIPS[subject];
}
