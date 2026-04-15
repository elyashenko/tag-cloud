import { sqliteTable, text, integer, index, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const sessions = sqliteTable('sessions', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  description: text('description'),
  status: text('status', { enum: ['active', 'closed'] }).notNull().default('active'),
  joinCode: text('join_code').notNull().unique(),
  pinHash: text('pin_hash'),
  moderatorToken: text('moderator_token').notNull(),
  maxVotes: integer('max_votes').notNull().default(3),
  allowCustom: integer('allow_custom', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull(),
  closedAt: text('closed_at'),
});

export const tags = sqliteTable('tags', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  label: text('label').notNull(),
  color: text('color'),
  isCustom: integer('is_custom', { mode: 'boolean' }).notNull().default(false),
  approved: integer('approved', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull(),
}, (t) => [
  index('idx_tags_session').on(t.sessionId),
]);

export const votes = sqliteTable('votes', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  viewerId: text('viewer_id').notNull(),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
  createdAt: text('created_at').notNull(),
}, (t) => [
  uniqueIndex('idx_vote_unique').on(t.sessionId, t.viewerId, t.tagId),
  index('idx_votes_session').on(t.sessionId),
  index('idx_votes_tag').on(t.tagId),
]);

export const viewerSessions = sqliteTable('viewer_sessions', {
  id: text('id').primaryKey(),
  sessionId: text('session_id').notNull().references(() => sessions.id, { onDelete: 'cascade' }),
  viewerId: text('viewer_id').notNull(),
  ipHash: text('ip_hash'),
  userAgent: text('user_agent'),
  voteCount: integer('vote_count').notNull().default(0),
  lastSeen: text('last_seen').notNull(),
  createdAt: text('created_at').notNull(),
}, (t) => [
  uniqueIndex('idx_viewer_session').on(t.sessionId, t.viewerId),
]);
