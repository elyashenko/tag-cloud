import { defineConfig } from 'drizzle-kit';
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

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'turso',
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      process.env.TURSO_DATABASE_URL ??
      'file:data/tagcloud.db',
    authToken: process.env.DATABASE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN,
  },
});
