import { read, commit, catalog } from '@/lib/backend/repository';
import { newExperience } from './engine';
import { resolveMedia } from '@/lib/backend/media';
import type { ExperienceState, MediaAsset, MediaCue, WorldItem } from './types';
import type { ReadingAttempt, ReadingProfile } from '@/lib/reading/types';
export async function experienceCatalog() {
  const content = await catalog<{media: MediaAsset[]; cues: MediaCue[]; items: WorldItem[]}>('experience');
  return { ...content, media: await resolveMedia(content.media) };
}
export async function experienceProfile(childId: string) {
  const stored = await read<{data: ExperienceState; revision: number} | null>('experience', { child: childId });
  return stored ? {state: stored.data, revision: stored.revision} : {state: newExperience(), revision: 0};
}
export function worldInventory(childId: string) {
  return read<{inventory: {item_id: string; earned_at: string}[]; placements: {slot: string; item_id: string}[]}>('inventory', {child: childId});
}
export function saveExperience(childId: string, state: ExperienceState, revision: number, reading: ReadingProfile,
  readingRevision: number, attempt: ReadingAttempt | null, rewards: string[], placement?: {slot: string; item: string | null}) {
  return commit<boolean>('save-experience', {childId, state, revision, reading, readingRevision, attempt, rewards, placement});
}
