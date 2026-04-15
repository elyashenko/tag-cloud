import { NextResponse } from 'next/server';
import { getOrCreateViewerId, getViewerId } from '@/lib/session';

export async function POST() {
  const viewerId = await getOrCreateViewerId();
  return NextResponse.json({ viewerId });
}

export async function GET() {
  const viewerId = await getViewerId();
  if (!viewerId) return NextResponse.json({ error: 'No session' }, { status: 404 });
  return NextResponse.json({ viewerId });
}
