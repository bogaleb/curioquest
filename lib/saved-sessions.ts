import type { ExplorerProfile } from "./explorers";

/** Keep completed discoveries and the current question when changing games. */
export function parkSession(profile: ExplorerProfile, now = Date.now()) {
  const session = profile.session;
  if (session && session.index < session.questions.length) {
    profile.savedSessions = profile.savedSessions.filter(saved => saved.id !== session.id);
    profile.savedSessions.push({ ...session, suspendedAt: now });
  }
}

export function resumeSession(profile: ExplorerProfile, id: string, now = Date.now()) {
  const saved = profile.savedSessions.find(session => session.id === id);
  if (!saved) return false;
  parkSession(profile, now);
  profile.savedSessions = profile.savedSessions.filter(session => session.id !== id);
  profile.session = { ...saved, started: saved.started + Math.max(0, now - (saved.suspendedAt ?? now)), suspendedAt: undefined };
  return true;
}

/**
 * Throw away a game mission so it can be played again from the first discovery.
 *
 * "Start over" cannot go through `game-start`: that action deliberately *resumes* an
 * in-flight or parked mission, which is right when a child comes back to a game and
 * wrong when they have asked to begin it again. Both the live session and any parked
 * copy have to go, or the restart would immediately resume what it just discarded.
 *
 * Only the session is discarded. Attempts already recorded, skill evidence, and earned
 * stars are not touched — restarting a mission is not a way to erase a child's history,
 * and a child should never be able to undo their own evidence by pressing a button.
 */
export function discardGameSession(profile: ExplorerProfile, gameId: string, level: number) {
  profile.savedSessions = profile.savedSessions.filter(
    (saved) => !(saved.gameId === gameId && saved.gameLevel === level),
  );
  if (profile.session?.gameId === gameId && profile.session.gameLevel === level) {
    profile.session = null;
  }
}
