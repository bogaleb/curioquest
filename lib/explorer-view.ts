import type { ExplorerProfile } from "./explorers";
import type { PublicQuestion } from "./activity-types";
export type PublicSession = Omit<NonNullable<ExplorerProfile["session"]>, "questions"> & { total: number; question: PublicQuestion | null };
export type PublicExplorer = Omit<ExplorerProfile, "session"> & { session: PublicSession | null };
export type QuestFeedback = { correct?: boolean; message?: string; hint?: string | null } | null;
