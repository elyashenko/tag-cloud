import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { tags } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const rows = await db
    .select()
    .from(tags)
    .where(and(eq(tags.sessionId, id), eq(tags.approved, true)));
  return NextResponse.json(rows);
}
