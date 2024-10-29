import { SignInButton } from '../../auth/components';
import { getCurrentSession } from '../../auth/session';

export default async function Page() {
	await getCurrentSession({ authenticatedUrl: '/' });

	return (
		<>
			<h1>Sign in</h1>
			<SignInButton />
		</>
	);
}
