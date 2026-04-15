import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

mkdirSync(resolve(process.cwd(), 'data'), { recursive: true });

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl =
  process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
const databaseAuthToken =
  process.env.DATABASE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;

if (isProduction && !databaseUrl) {
  throw new Error(
    'DATABASE_URL (or TURSO_DATABASE_URL) is required in production.'
  );
}

if (databaseUrl?.startsWith('libsql://') && !databaseAuthToken) {
  throw new Error(
    'DATABASE_AUTH_TOKEN (or TURSO_AUTH_TOKEN) is required for Turso/libSQL remote database.'
  );
}

const client = createClient({
  url: databaseUrl ?? 'file:data/tagcloud.db',
  authToken: databaseAuthToken,
});

export const db = drizzle(client, { schema });
