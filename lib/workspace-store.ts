import {read, commit, uuid} from '@/lib/backend/repository';
import type { WorkspaceItem } from './workspace-content';
export function itemById<T>(id: string) { return uuid(id) ? read<WorkspaceItem<T> | null>('item', {id}) : Promise.resolve(null); }
export function itemsFor<T>(profile: string, kind: string, limit = 100, offset = 0) {
  if (profile !== 'family' && !uuid(profile)) return Promise.resolve([] as WorkspaceItem<T>[]);
  return read<WorkspaceItem<T>[]>('items', {child: profile === 'family' ? undefined : profile, filter: kind, limit, offset});
}
export async function createItem<T>(profile: string, kind: string, data: T) {
  const item = await commit<WorkspaceItem<T> | null>('create-item', {childId: profile === 'family' ? null : profile, kind, data});
  if (!item) throw new Error('Collection is full or explorer no longer exists.');
  return item;
}
export function updateItem<T>(item: WorkspaceItem, data: T) { return commit<WorkspaceItem<T> | null>('update-item', {id:item.id, revision:item.revision, data}); }
export function deleteItem(id: string, revision: number) { return commit<boolean>('delete-item', {id, revision}); }
