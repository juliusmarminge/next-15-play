import { LogoutButton } from '../auth/components';
import { getCurrentSession } from '../auth/session';

export default async function Page() {
	const { user } = await getCurrentSession({ unauthenticatedUrl: '/login' });

	const image = `https://avatars.githubusercontent.com/u/${user.providerId}`;

	return (
		<>
			<h1>Hi, {user.username}!</h1>
			<img src={image} height="100px" width="100px" alt="profile" />
			<p>Email: {user.email}</p>
			<LogoutButton />
		</>
	);
}
