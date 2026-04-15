import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

const envCandidates = ['.env.local', '.env.development.local', '.env'];
const processWithEnvLoader = process as NodeJS.Process & {
  loadEnvFile?: (path?: string) => void;
};

for (const envFile of envCandidates) {
  try {
    processWithEnvLoader.loadEnvFile?.(resolve(process.cwd(), envFile));
  } catch {
    // Ignore missing/unreadable env files and continue.
  }
}

const isProduction = process.env.NODE_ENV === 'production';
const databaseUrl =
  process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
const databaseAuthToken =
  process.env.DATABASE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;

const resolvedDatabaseUrl = databaseUrl ?? 'file:data/tagcloud.db';
const isFileDatabase = resolvedDatabaseUrl.startsWith('file:');

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

if (isFileDatabase) {
  mkdirSync(resolve(process.cwd(), 'data'), { recursive: true });
}

const client = createClient({
  url: resolvedDatabaseUrl,
  authToken: databaseAuthToken,
});

export const db = drizzle(client, { schema });
