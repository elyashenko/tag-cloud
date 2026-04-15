import { nanoid } from 'nanoid';

export function generateId(): string {
  return nanoid();
}

export function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function now(): string {
  return new Date().toISOString();
}
