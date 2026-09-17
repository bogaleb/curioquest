import type { ExplorerProfile } from "./explorers";
import type { PublicQuestion } from "./activity-types";
export type PublicSession = Omit<NonNullable<ExplorerProfile["session"]>, "questions"> & { total: number; question: PublicQuestion | null };
export type SavedSessionSummary = Pick<NonNullable<ExplorerProfile["session"]>, "id" | "subject" | "index" | "gameId" | "gameLevel" | "chapter" | "teamId"> & { total: number; discovery: boolean };
export type PublicExplorer = Omit<ExplorerProfile, "session" | "savedSessions"> & { session: PublicSession | null; savedSessions: SavedSessionSummary[] };
export type QuestFeedback = { correct?: boolean; message?: string; hint?: string | null } | null;
