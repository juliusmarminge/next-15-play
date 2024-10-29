import 'server-only';
import * as Crypto from 'node:crypto';
import { eq } from 'drizzle-orm';
import { Encoding } from 'effect';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { db } from '../db/client';
import type { User } from '../db/schema';
import { Session } from '../db/schema';

export async function invalidateSession(sessionId: string): Promise<void> {
	await db.delete(Session).where(eq(Session.id, sessionId));
}

export async function invalidateUserSessions(userId: number): Promise<void> {
	await db.delete(Session).where(eq(Session.userId, userId));
}

export async function setSessionTokenCookie(token: string, expiresAt: Date): Promise<void> {
	(await cookies()).set('session', token, {
		httpOnly: true,
		path: '/',
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		expires: expiresAt
	});
}

export async function deleteSessionTokenCookie(): Promise<void> {
	(await cookies()).set('session', '', {
		httpOnly: true,
		path: '/',
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 0
	});
}

export async function generateSessionToken(): Promise<string> {
	const tokenBytes = new Uint8Array(20);
	crypto.getRandomValues(tokenBytes);
	const token = Encoding.encodeBase64(tokenBytes);
	return token;
}

export async function createSession(token: string, userId: number): Promise<Session> {
	const sessionId = Crypto.createHash('sha256').update(token).digest().toString('hex');

	const session: Session = {
		id: sessionId,
		userId,
		expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
	};
	await db.insert(Session).values(session);
	return session;
}

interface SignedInState {
	session: Session;
	user: User;
}
interface SignedOutState {
	session: null;
	user: null;
}

export async function validateSessionToken(token: string): Promise<SignedInState | SignedOutState> {
	const sessionId = Crypto.createHash('sha256').update(token).digest().toString('hex');

	const row = await db.query.Session.findFirst({
		where: (fields, { eq }) => eq(fields.id, sessionId),
		with: { user: true }
	});

	if (!row) return { session: null, user: null };

	const { user, ...session } = row;

	if (Date.now() >= session.expiresAt.getTime()) {
		await invalidateSession(session.id);
		return { session: null, user: null };
	}
	if (Date.now() >= session.expiresAt.getTime() - 1000 * 60 * 60 * 24 * 15) {
		session.expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
		await db
			.update(Session)
			.set({
				expiresAt: session.expiresAt
			})
			.where(eq(Session.id, session.id));
	}
	return { session, user };
}

export const getCurrentSession = cache(
	async <TUnauthed extends string | false = false, TAuthed extends string | false = false>(opts?: {
		/**
		 * The URL to redirect the user to if they are authenticated.
		 * @default false
		 */
		authenticatedUrl?: TAuthed;
		/**
		 * The URL to redirect the user to if they are not authenticated.
		 * @default false
		 */
		unauthenticatedUrl?: TUnauthed;
	}): Promise<
		[TAuthed, TUnauthed] extends [string, string]
			? never
			: [TAuthed, TUnauthed] extends [string, false]
				? SignedOutState
				: [TAuthed, TUnauthed] extends [false, string]
					? SignedInState
					: SignedInState | SignedOutState
	> => {
		const token = (await cookies()).get('session')?.value ?? null;
		if (token === null) {
			if (opts?.unauthenticatedUrl) {
				redirect(opts.unauthenticatedUrl);
			}
			return { session: null, user: null } as never;
		}

		const result = await validateSessionToken(token);

		if (!result.session && opts?.unauthenticatedUrl) {
			redirect(opts.unauthenticatedUrl);
		}
		if (result.session && opts?.authenticatedUrl) {
			redirect(opts.authenticatedUrl);
		}

		return result as never;
	}
);
