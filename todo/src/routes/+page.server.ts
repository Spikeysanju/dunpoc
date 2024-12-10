import * as auth from '$lib/server/auth';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { todos } from '$lib/server/db/schema';
import { eq } from 'drizzle-orm';
import { db } from '$lib/server/db';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		return redirect(302, '/login');
	}

	const result = await db.select().from(todos).where(eq(todos.userId, event.locals.user.id));
	const sessionToken = event.cookies.get(auth.sessionCookieName);

	return {
		user: event.locals.user,
		todos: result,
		sessionToken
	};
};

export const actions: Actions = {
	logout: async (event) => {
		if (!event.locals.session) {
			return fail(401);
		}
		await auth.invalidateSession(event.locals.session.id);
		auth.deleteSessionTokenCookie(event);

		return redirect(302, '/login');
	}
};
