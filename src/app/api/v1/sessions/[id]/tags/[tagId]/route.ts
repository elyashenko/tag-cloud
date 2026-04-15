import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions, tags, votes } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

type Params = { params: Promise<{ id: string; tagId: string }> };

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id, tagId } = await params;
  const token = req.headers.get('x-moderator-token');

  const rows = await db.select().from(sessions).where(eq(sessions.id, id));
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (rows[0].moderatorToken !== token) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await db.delete(votes).where(eq(votes.tagId, tagId));
  await db.delete(tags).where(and(eq(tags.id, tagId), eq(tags.sessionId, id)));

  return new NextResponse(null, { status: 204 });
}
