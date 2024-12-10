import { relations } from 'drizzle-orm';
import { pgTable, serial, text, integer, timestamp, varchar, boolean } from 'drizzle-orm/pg-core';

export const user = pgTable('user', {
	id: text('id').primaryKey(),
	age: integer('age'),
	username: text('username').notNull().unique(),
	passwordHash: text('password_hash').notNull()
});

export const usersRelations = relations(user, ({ many }) => ({
	todos: many(todos)
}));

export const session = pgTable('session', {
	id: text('id').primaryKey(),
	userId: text('user_id')
		.notNull()
		.references(() => user.id),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

export const todos = pgTable('todos', {
	id: serial('id').primaryKey(),
	title: varchar('title', { length: 255 }),
	completed: boolean('completed').default(false),
	userId: varchar('user_id', { length: 255 })
});

export const todosRelations = relations(todos, ({ one }) => ({
	user: one(user, { fields: [todos.userId], references: [user.id] })
}));

// jwt token
export const jwtToken = pgTable('jwt_token', {
	id: text('id').primaryKey(),
	userId: text('user_id').notNull().references(() => user.id),
	expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull()
});

export type Session = typeof session.$inferSelect;
export type User = typeof user.$inferSelect;
export type Todos = typeof todos.$inferSelect;
