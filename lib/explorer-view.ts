import type { ExplorerProfile } from "./explorers";
import type { PublicQuestion } from "./activity-types";
import type { TeachingMove } from "./error-kinds";
export type PublicSession = Omit<NonNullable<ExplorerProfile["session"]>, "questions"> & { total: number; question: PublicQuestion | null };
export type SavedSessionSummary = Pick<NonNullable<ExplorerProfile["session"]>, "id" | "subject" | "index" | "gameId" | "gameLevel" | "chapter" | "teamId"> & { total: number; discovery: boolean };
export type PublicExplorer = Omit<ExplorerProfile, "session" | "savedSessions"> & { session: PublicSession | null; savedSessions: SavedSessionSummary[] };
/** `assisted` marks help Nova volunteered after repeated misses, rather than help the
  * child asked for. The player says so, so being helped never looks like being told. */
/**
 * What the player shows after an answer.
 *
 * Everything from `move` down is the teaching response to a *particular* misconception
 * (§C3, WP-04): which move to make, and what it needs to make it. A correct answer
 * carries none of them.
 */
export type QuestFeedback = {
  correct?: boolean;
  message?: string;
  hint?: string | null;
  assisted?: boolean;
  move?: TeachingMove | null;
  /** `compare`: the child's choice and the answer, to put side by side. */
  compare?: { chosen: string; answer: string };
  /** `relisten` / `sound-not-name`: what to play again. */
  listen?: string;
  /** `recount`: how many to count, slowly. */
  count?: number;
  /** `settle`: a beat before the next try. */
  pause?: boolean;
  /** True when a prerequisite activity was put in front of the child. */
  steppedBack?: boolean;
} | null;
