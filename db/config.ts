import { fileURLToPath } from 'node:url';
import type { Config } from 'drizzle-kit';

if (!process.env.TURSO_URL || !process.env.TURSO_AUTH_TOKEN) {
	throw new Error('TURSO_URL and TURSO_AUTH_TOKEN must be set');
}

export default {
	dialect: 'turso',
	casing: 'snake_case',
	schema: fileURLToPath(new URL('schema.ts', import.meta.url)),
	dbCredentials: {
		url: process.env.TURSO_URL,
		authToken: process.env.TURSO_AUTH_TOKEN
	}
} satisfies Config;
