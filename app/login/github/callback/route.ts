import type { OAuth2Tokens } from 'arctic';
import { Array, Option, Predicate } from 'effect';
import { cookies } from 'next/headers';
import { getGitHubClient } from '../../../../auth/oauth';
import {
	createSession,
	generateSessionToken,
	setSessionTokenCookie
} from '../../../../auth/session';
import { db } from '../../../../db/client';
import { User } from '../../../../db/schema';

export async function GET(request: Request): Promise<Response> {
	const url = new URL(request.url);
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	const storedState = (await cookies()).get('github_oauth_state')?.value ?? null;
	if (code === null || state === null || storedState === null || storedState !== state) {
		return new Response('Please restart the process.', {
			status: 400
		});
	}

	const github = await getGitHubClient();

	let tokens: OAuth2Tokens;
	try {
		tokens = await github.validateAuthorizationCode(code);
	} catch {
		// Invalid code or client credentials
		return new Response('Please restart the process.', {
			status: 400
		});
	}
	const githubAccessToken = tokens.accessToken();

	const userRequest = new Request('https://api.github.com/user');
	userRequest.headers.set('Authorization', `Bearer ${githubAccessToken}`);
	const userResponse = await fetch(userRequest);
	const userResult: unknown = await userResponse.json();
	if (
		!Predicate.isRecord(userResult) ||
		!Predicate.isNumber(userResult.id) ||
		!Predicate.isString(userResult.login)
	) {
		return new Response('Invalid response');
	}

	const existingUser = await db.query.User.findFirst({
		where: (fields, { and, eq }) =>
			and(eq(fields.provider, 'github'), eq(fields.providerId, String(userResult.id)))
	});

	if (existingUser != null) {
		const sessionToken = await generateSessionToken();
		const session = await createSession(sessionToken, existingUser.id);
		await setSessionTokenCookie(sessionToken, session.expiresAt);
		return new Response(null, {
			status: 302,
			headers: {
				Location: '/'
			}
		});
	}

	const emailListRequest = new Request('https://api.github.com/user/emails');
	emailListRequest.headers.set('Authorization', `Bearer ${githubAccessToken}`);
	const emailListResponse = await fetch(emailListRequest);
	const emailListResult: unknown = await emailListResponse.json();
	if (!Array.isArray(emailListResult) || emailListResult.length < 1) {
		return new Response('Please restart the process.', {
			status: 400
		});
	}
	let email: string | null = null;
	for (const emailRecord of emailListResult) {
		if (
			Predicate.isRecord(emailRecord) &&
			Predicate.isBoolean(emailRecord.primary) &&
			Predicate.isBoolean(emailRecord.verified) &&
			Predicate.isString(emailRecord.email)
		) {
			email = emailRecord.email;
		}
	}
	if (email === null) {
		return new Response('Please verify your GitHub email address.', {
			status: 400
		});
	}

	const user = await db
		.insert(User)
		.values({
			email,
			provider: 'github',
			providerId: String(userResult.id),
			username: userResult.login
		})
		.returning({ id: User.id })
		.then((rows) => Option.getOrThrow(Array.head(rows)));

	const sessionToken = await generateSessionToken();
	const session = await createSession(sessionToken, user.id);
	await setSessionTokenCookie(sessionToken, session.expiresAt);
	return new Response(null, {
		status: 302,
		headers: {
			Location: '/'
		}
	});
}
