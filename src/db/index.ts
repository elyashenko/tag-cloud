import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

mkdirSync(resolve(process.cwd(), 'data'), { recursive: true });

const client = createClient({ url: 'file:data/tagcloud.db' });

export const db = drizzle(client, { schema });
