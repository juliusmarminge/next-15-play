import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as Schema from './schema';

export const db = drizzle({
	client: createClient({ url: process.env.TURSO_URL!, authToken: process.env.TURSO_AUTH_TOKEN }),
	casing: 'snake_case',
	schema: Schema
});
