import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';

type Params = { params: Promise<{ code: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { code } = await params;
  const rows = await db.select().from(sessions).where(eq(sessions.joinCode, code.toUpperCase()));

  if (!rows[0]) return NextResponse.json({ error: 'Сессия не найдена' }, { status: 404 });

  const { moderatorToken: _, ...pub } = rows[0];
  return NextResponse.json(pub);
}
