import {sqliteTable,text,integer,index} from 'drizzle-orm/sqlite-core';
export const explorers=sqliteTable('explorers',{id:text('id').primaryKey(),data:text('data').notNull(),revision:integer('revision').notNull().default(0)});
export const parentLock=sqliteTable('parent_lock',{
  id:integer('id').primaryKey(),salt:text('salt').notNull(),pinHash:text('pin_hash').notNull(),recoveryHash:text('recovery_hash').notNull(),ownerIdentity:text('owner_identity'),
  attempts:integer('attempts').notNull().default(0),windowUntil:integer('window_until').notNull().default(0),
});
export const parentSessions=sqliteTable('parent_sessions',{
  tokenHash:text('token_hash').primaryKey(),identity:text('identity').notNull(),expiresAt:integer('expires_at').notNull(),
});
export const workspaceItems=sqliteTable('workspace_items',{
  id:text('id').primaryKey(),profileId:text('profile_id').notNull(),kind:text('kind').notNull(),data:text('data').notNull(),revision:integer('revision').notNull().default(0),updatedAt:text('updated_at').notNull(),
},table=>[index('workspace_profile_kind').on(table.profileId,table.kind)]);
