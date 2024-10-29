'use server';

import { generateState } from 'arctic';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { deleteSessionTokenCookie, getCurrentSession, invalidateSession } from '../auth/session';
import { getGitHubClient } from './oauth';

export async function signInWithGithub() {
	const github = await getGitHubClient();

	const state = generateState();
	const url = github.createAuthorizationURL(state, ['user:email']);
	(await cookies()).set('github_oauth_state', state, {
		path: '/',
		secure: process.env.NODE_ENV === 'production',
		httpOnly: true,
		maxAge: 60 * 10,
		sameSite: 'lax'
	});

	redirect(url.href);
}

export async function logoutAction() {
	const { session } = await getCurrentSession();
	if (session === null) {
		return {
			message: 'Not authenticated'
		};
	}

	await Promise.allSettled([invalidateSession(session.id), deleteSessionTokenCookie()]);

	return redirect('/login');
}
