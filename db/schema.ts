import { relations } from 'drizzle-orm';
import { sqliteTable, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const User = sqliteTable(
	'users',
	(d) => ({
		id: d.integer().primaryKey(),
		provider: d.text().notNull(),
		providerId: d.text().notNull(),
		email: d.text().notNull(),
		username: d.text().notNull()
	}),
	(table) => ({
		providerIdx: uniqueIndex('providerIdx').on(table.provider, table.providerId)
	})
);
export type User = typeof User.$inferSelect;

export const Session = sqliteTable('sessions', (d) => ({
	id: d.text().primaryKey(),
	userId: d
		.integer()
		.notNull()
		.references(() => User.id),
	expiresAt: d.integer({ mode: 'timestamp' }).notNull()
}));
export type Session = typeof Session.$inferSelect;

export const UserRelations = relations(User, ({ many }) => ({
	sessions: many(Session)
}));

export const SessionRelations = relations(Session, ({ one }) => ({
	user: one(User, { fields: [Session.userId], references: [User.id] })
}));
