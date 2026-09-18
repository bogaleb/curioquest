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
export const readingSkills=sqliteTable('reading_skills',{id:text('id').primaryKey(),data:text('data').notNull()});
export const readingWords=sqliteTable('reading_words',{id:text('id').primaryKey(),data:text('data').notNull()});
export const readingStories=sqliteTable('reading_stories',{id:text('id').primaryKey(),data:text('data').notNull()});
export const readingSettings=sqliteTable('reading_settings',{id:text('id').primaryKey(),data:text('data').notNull()});
export const readingProfiles=sqliteTable('reading_profiles',{childId:text('child_id').primaryKey().references(()=>explorers.id,{onDelete:'cascade'}),data:text('data').notNull(),revision:integer('revision').notNull().default(0)});
export const readingAttempts=sqliteTable('reading_attempts',{id:text('id').primaryKey(),childId:text('child_id').notNull().references(()=>readingProfiles.childId,{onDelete:'cascade'}),sessionId:text('session_id').notNull(),data:text('data').notNull(),createdAt:text('created_at').notNull()},table=>[index('reading_attempts_child_date').on(table.childId,table.createdAt)]);
