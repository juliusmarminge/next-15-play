import 'server-only';
import { GitHub } from 'arctic';
import { headers } from 'next/headers';

export async function getGitHubClient(): Promise<GitHub> {
	const heads = await headers();
	const base = `https://${heads.get('x-forwarded-host') ?? heads.get('host')}`;

	const github = new GitHub(
		process.env.AUTH_GITHUB_ID ?? '',
		process.env.AUTH_GITHUB_SECRET ?? '',
		`${base}/login/github/callback`
	);
	return github;
}
