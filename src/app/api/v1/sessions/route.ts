import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions } from '@/db/schema';
import { generateId, generateJoinCode, now } from '@/lib/utils';
import { desc } from 'drizzle-orm';

export async function GET() {
  const all = await db.select().from(sessions).orderBy(desc(sessions.createdAt));
  return NextResponse.json(all);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, maxVotes = 3 } = body;

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const sessionId = generateId();
    const moderatorToken = generateId();
    const joinCode = generateJoinCode();
    const timestamp = now();

    const session = {
      id: sessionId,
      title: title.trim(),
      description: description?.trim() || null,
      status: 'active' as const,
      joinCode,
      moderatorToken,
      maxVotes,
      allowCustom: true,
      createdAt: timestamp,
      closedAt: null,
      pinHash: null,
    };

    await db.insert(sessions).values(session);

    return NextResponse.json({ ...session, moderatorToken }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
