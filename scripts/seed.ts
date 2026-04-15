import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { mkdirSync } from 'fs';
import { nanoid } from 'nanoid';
import * as schema from '../src/db/schema';

async function main() {
  mkdirSync('data', { recursive: true });

  const client = createClient({ url: 'file:data/tagcloud.db' });
  const db = drizzle(client, { schema });

  const ts = new Date().toISOString();
  const sessionId = nanoid();
  const modToken = nanoid();
  const joinCode = 'DEMO42';

  await db.insert(schema.sessions).values({
    id: sessionId,
    title: 'Tech Trends 2026',
    description: 'Какие технологии будут определять разработку в 2026 году?',
    status: 'active',
    joinCode,
    moderatorToken: modToken,
    maxVotes: 3,
    allowCustom: true,
    createdAt: ts,
  });

  console.log('');
  console.log('  ✓ Seed complete!');
  console.log('');
  console.log(`  Session:   ${sessionId}`);
  console.log(`  Title:     Tech Trends 2026`);
  console.log(`  Join Code: ${joinCode}`);
  console.log(`  Mod Token: ${modToken}`);
  console.log('');
  console.log(`  Open http://localhost:3000/vote/${joinCode} to vote`);
  console.log(`  Open http://localhost:3000/admin to manage`);
  console.log('');

  process.exit(0);
}

main();
