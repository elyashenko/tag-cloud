import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { votes, tags } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getViewerId } from '@/lib/session';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const viewerId = await getViewerId();
  if (!viewerId) return NextResponse.json([]);

  const myVotes = await db
    .select({
      tagId: votes.tagId,
      label: tags.label,
      createdAt: votes.createdAt,
    })
    .from(votes)
    .innerJoin(tags, eq(votes.tagId, tags.id))
    .where(and(eq(votes.sessionId, id), eq(votes.viewerId, viewerId)));

  return NextResponse.json(myVotes);
}
