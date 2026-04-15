import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { sessions, tags, votes, viewerSessions } from '@/db/schema';
import { eq, and } from 'drizzle-orm';
import { getOrCreateViewerId, getViewerId } from '@/lib/session';
import { generateId, now } from '@/lib/utils';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const { id } = await params;
    const viewerId = await getOrCreateViewerId();

    const sessionRows = await db.select().from(sessions).where(eq(sessions.id, id));
    const session = sessionRows[0];
    if (!session) return NextResponse.json({ error: 'Сессия не найдена' }, { status: 404 });
    if (session.status === 'closed') return NextResponse.json({ error: 'Голосование завершено' }, { status: 403 });

    const body = await req.json();
    const word = (body.word || '').trim();

    if (!word) return NextResponse.json({ error: 'Введите слово' }, { status: 400 });
    if (word.length > 50) return NextResponse.json({ error: 'Максимум 50 символов' }, { status: 400 });

    const currentVotes = await db
      .select()
      .from(votes)
      .where(and(eq(votes.sessionId, id), eq(votes.viewerId, viewerId)));

    if (currentVotes.length >= session.maxVotes) {
      return NextResponse.json({ error: `Максимум ${session.maxVotes} слов` }, { status: 400 });
    }

    const wordLower = word.toLowerCase();
    const sessionTags = await db
      .select()
      .from(tags)
      .where(eq(tags.sessionId, id));

    const existingTag = sessionTags.find((t) => t.label.toLowerCase() === wordLower);

    let tagId: string;
    let label: string;

    if (existingTag) {
      tagId = existingTag.id;
      label = existingTag.label;

      if (currentVotes.some((v) => v.tagId === tagId)) {
        return NextResponse.json({ error: 'Вы уже отправили это слово' }, { status: 409 });
      }
    } else {
      tagId = generateId();
      label = word;
      await db.insert(tags).values({
        id: tagId,
        sessionId: id,
        label: word,
        isCustom: true,
        approved: true,
        createdAt: now(),
      });
    }

    const timestamp = now();

    await db.insert(votes).values({
      id: generateId(),
      sessionId: id,
      viewerId,
      tagId,
      createdAt: timestamp,
    });

    const existingViewer = await db
      .select()
      .from(viewerSessions)
      .where(and(eq(viewerSessions.sessionId, id), eq(viewerSessions.viewerId, viewerId)));

    if (existingViewer[0]) {
      await db
        .update(viewerSessions)
        .set({ voteCount: currentVotes.length + 1, lastSeen: timestamp })
        .where(eq(viewerSessions.id, existingViewer[0].id));
    } else {
      await db.insert(viewerSessions).values({
        id: generateId(),
        sessionId: id,
        viewerId,
        voteCount: 1,
        lastSeen: timestamp,
        createdAt: timestamp,
      });
    }

    return NextResponse.json({ success: true, tagId, label }, { status: 201 });
  } catch (err) {
    console.error('POST /votes error:', err);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  const viewerId = await getViewerId();
  if (!viewerId) return NextResponse.json({ error: 'Сессия просмотра не найдена' }, { status: 401 });

  const url = new URL(req.url);
  const tagId = url.searchParams.get('tagId');
  if (!tagId) return NextResponse.json({ error: 'Не указан идентификатор тега' }, { status: 400 });

  const sessionRows = await db.select().from(sessions).where(eq(sessions.id, id));
  if (!sessionRows[0]) return NextResponse.json({ error: 'Сессия не найдена' }, { status: 404 });
  if (sessionRows[0].status === 'closed') return NextResponse.json({ error: 'Голосование завершено' }, { status: 403 });

  await db
    .delete(votes)
    .where(and(eq(votes.sessionId, id), eq(votes.viewerId, viewerId), eq(votes.tagId, tagId)));

  const remaining = await db
    .select()
    .from(votes)
    .where(and(eq(votes.sessionId, id), eq(votes.viewerId, viewerId)));

  const viewer = await db
    .select()
    .from(viewerSessions)
    .where(and(eq(viewerSessions.sessionId, id), eq(viewerSessions.viewerId, viewerId)));

  if (viewer[0]) {
    await db
      .update(viewerSessions)
      .set({ voteCount: remaining.length, lastSeen: now() })
      .where(eq(viewerSessions.id, viewer[0].id));
  }

  return NextResponse.json({ success: true });
}
