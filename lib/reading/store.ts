import { read, commit, commitWithEvents, catalog } from '@/lib/backend/repository';
import type { LearningEvent } from '@/lib/learning-events';
import { newReadingProfile } from './engine';
import {resolveReadingAudio} from '@/lib/backend/media';
import type { ReadingCatalog, ReadingProfile, ReadingAttempt } from './types';
export async function readingCatalog() { return resolveReadingAudio(await catalog<ReadingCatalog>('reading')); }
export async function readingProfile(childId: string) {
  const stored = await read<{data: ReadingProfile; revision: number} | null>('reading', { child: childId });
  return stored ? { profile: stored.data, revision: stored.revision } : { profile: newReadingProfile(), revision: 0 };
}
export function saveReading(
  childId: string, profile: ReadingProfile, revision: number,
  attempt: ReadingAttempt | null, stars = 0, events: readonly LearningEvent[] = [],
) {
  const payload = { childId, profile, revision, attempt, stars };
  // Same transaction as the profile save: the reading slice is where the strongest
  // claims about this product get made, so its evidence has to be exactly as reliable
  // as the progress it justifies.
  return events.length
    ? commitWithEvents<boolean>('save-reading', payload, childId, events)
    : commit<boolean>('save-reading', payload);
}
