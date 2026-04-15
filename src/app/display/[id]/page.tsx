'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { WordCloud } from '@/components/WordCloud';

interface SessionData {
  id: string;
  title: string;
  status: string;
  joinCode: string;
}

interface Results {
  tags: { tagId: string; label: string; voteCount: number }[];
  totalVoters: number;
  totalVotes: number;
}

export default function DisplayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [session, setSession] = useState<SessionData | null>(null);
  const [results, setResults] = useState<Results | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const fetchResults = useCallback(async () => {
    const res = await fetch(`/api/v1/sessions/${id}/results`);
    if (res.ok) {
      setResults(await res.json());
      setLastUpdate(new Date());
    }
  }, [id]);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/v1/sessions/${id}`);
      if (res.ok) setSession(await res.json());
      fetchResults();
    })();
  }, [id, fetchResults]);

  useEffect(() => {
    const iv = setInterval(async () => {
      fetchResults();
      const res = await fetch(`/api/v1/sessions/${id}`);
      if (res.ok) setSession(await res.json());
    }, 1000);
    return () => clearInterval(iv);
  }, [id, fetchResults]);

  if (!session) {
    return (
      <div className="h-dvh flex items-center justify-center bg-bg">
        <div className="text-muted animate-pulse text-xl">Загрузка...</div>
      </div>
    );
  }

  const words = results?.tags.map((t) => ({ text: t.label, value: t.voteCount })) ?? [];
  const topTag = results?.tags.reduce(
    (best, t) => (t.voteCount > (best?.voteCount ?? 0) ? t : best),
    results.tags[0],
  );
  const ago = Math.round((Date.now() - lastUpdate.getTime()) / 1000);

  return (
    <div className="h-dvh flex flex-col bg-bg overflow-hidden">
      <header className="shrink-0 flex items-center justify-between px-6 py-4 border-b border-border/50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">{session.title}</h1>
          {session.status === 'active' ? (
            <span className="live-badge px-3 py-1 rounded-full text-xs font-bold bg-success/20 text-success border border-success/30">
              LIVE
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-warning/20 text-warning border border-warning/30">
              ЗАВЕРШЕНО
            </span>
          )}
        </div>
        <div className="flex items-center gap-6 text-sm text-muted">
          <span>
            <span className="text-text font-semibold">{results?.totalVoters ?? 0}</span> участников
          </span>
          <span>
            <span className="text-text font-semibold">{results?.totalVotes ?? 0}</span> голосов
          </span>
          {topTag && topTag.voteCount > 0 && (
            <span>
              Лидер: <span className="text-warning font-semibold">{topTag.label}</span>
            </span>
          )}
          <span className="text-dim">{ago < 2 ? 'только что' : `${ago}с назад`}</span>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center p-8">
        <WordCloud words={words} maxFont={120} minFont={20} className="max-w-5xl" />
      </div>

      <footer className="shrink-0 flex items-center justify-center gap-6 px-6 py-3 border-t border-border/50 text-sm text-dim">
        <span>
          Присоединяйтесь: <span className="font-mono text-primary text-base font-bold tracking-wider">{session.joinCode}</span>
        </span>
      </footer>
    </div>
  );
}
