import { read, commit, catalog } from '@/lib/backend/repository';
import { newReadingProfile } from './engine';
import {resolveReadingAudio} from '@/lib/backend/media';
import type { ReadingCatalog, ReadingProfile, ReadingAttempt } from './types';
export async function readingCatalog() { return resolveReadingAudio(await catalog<ReadingCatalog>('reading')); }
export async function readingProfile(childId: string) {
  const stored = await read<{data: ReadingProfile; revision: number} | null>('reading', { child: childId });
  return stored ? { profile: stored.data, revision: stored.revision } : { profile: newReadingProfile(), revision: 0 };
}
export function saveReading(childId: string, profile: ReadingProfile, revision: number, attempt: ReadingAttempt | null, stars = 0) {
  return commit<boolean>('save-reading', { childId, profile, revision, attempt, stars });
}
