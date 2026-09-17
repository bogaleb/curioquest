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
