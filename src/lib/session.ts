import { cookies } from 'next/headers';
import { generateId } from './utils';

const VIEWER_COOKIE = 'viewer_id';
const COOKIE_MAX_AGE = 86400;

export async function getOrCreateViewerId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(VIEWER_COOKIE);
  if (existing?.value) return existing.value;

  const viewerId = generateId();
  store.set(VIEWER_COOKIE, viewerId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: COOKIE_MAX_AGE,
    path: '/',
  });
  return viewerId;
}

export async function getViewerId(): Promise<string | null> {
  const store = await cookies();
  return store.get(VIEWER_COOKIE)?.value ?? null;
}
