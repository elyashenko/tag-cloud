import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions } from '@/db/schema';
import { eq } from 'drizzle-orm';
import { now } from '@/lib/utils';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const rows = await db.select().from(sessions).where(eq(sessions.id, id));
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { moderatorToken: _, ...pub } = rows[0];
  return NextResponse.json(pub);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const token = req.headers.get('x-moderator-token');

  const rows = await db.select().from(sessions).where(eq(sessions.id, id));
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (rows[0].moderatorToken !== token) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const updates: Record<string, unknown> = {};

  if (body.title) updates.title = body.title.trim();
  if (body.description !== undefined) updates.description = body.description?.trim() || null;
  if (body.status === 'closed') {
    updates.status = 'closed';
    updates.closedAt = now();
  }
  if (body.maxVotes !== undefined) updates.maxVotes = body.maxVotes;
  if (body.allowCustom !== undefined) updates.allowCustom = body.allowCustom;

  await db.update(sessions).set(updates).where(eq(sessions.id, id));
  const updated = await db.select().from(sessions).where(eq(sessions.id, id));
  return NextResponse.json(updated[0]);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const token = req.headers.get('x-moderator-token');

  const rows = await db.select().from(sessions).where(eq(sessions.id, id));
  if (!rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (rows[0].moderatorToken !== token) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await db.update(sessions).set({ status: 'closed' as const, closedAt: now() }).where(eq(sessions.id, id));
  return new NextResponse(null, { status: 204 });
}
