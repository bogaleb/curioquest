import type { ExplorerProfile } from "./explorers";
import type { PublicQuestion } from "./activity-types";
export type PublicSession = Omit<NonNullable<ExplorerProfile["session"]>, "questions"> & { total: number; question: PublicQuestion | null };
export type SavedSessionSummary = Pick<NonNullable<ExplorerProfile["session"]>, "id" | "subject" | "index" | "gameId" | "gameLevel" | "chapter" | "teamId"> & { total: number; discovery: boolean };
export type PublicExplorer = Omit<ExplorerProfile, "session" | "savedSessions"> & { session: PublicSession | null; savedSessions: SavedSessionSummary[] };
/** `assisted` marks help Nova volunteered after repeated misses, rather than help the
  * child asked for. The player says so, so being helped never looks like being told. */
export type QuestFeedback = { correct?: boolean; message?: string; hint?: string | null; assisted?: boolean } | null;
