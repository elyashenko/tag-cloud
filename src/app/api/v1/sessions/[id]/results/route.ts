import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tags, votes, viewerSessions } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;

  const results = await db
    .select({
      tagId: tags.id,
      label: tags.label,
      color: tags.color,
      voteCount: sql<number>`count(${votes.id})`.as('vote_count'),
    })
    .from(tags)
    .leftJoin(votes, eq(tags.id, votes.tagId))
    .where(eq(tags.sessionId, id))
    .groupBy(tags.id);

  const voterRows = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(viewerSessions)
    .where(eq(viewerSessions.sessionId, id));

  const voteRows = await db
    .select({ cnt: sql<number>`count(*)` })
    .from(votes)
    .where(eq(votes.sessionId, id));

  return NextResponse.json({
    tags: results,
    totalVoters: voterRows[0]?.cnt ?? 0,
    totalVotes: voteRows[0]?.cnt ?? 0,
  });
}
