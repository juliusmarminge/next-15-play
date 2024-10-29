'use client';

import { useActionState } from 'react';
import { logoutAction, signInWithGithub } from '../auth/actions';

export function LogoutButton() {
	const [, action] = useActionState(logoutAction, { message: '' });
	return (
		<form action={action}>
			<button type="submit">Sign out</button>
		</form>
	);
}

export function SignInButton() {
	const [, action] = useActionState(signInWithGithub, null);
	return (
		<form action={action}>
			<button type="submit">Sign in</button>
		</form>
	);
}
