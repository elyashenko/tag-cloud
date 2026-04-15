'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { WordCloud } from '@/components/WordCloud';
import Link from 'next/link';

interface SessionData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  joinCode: string;
  maxVotes: number;
  allowCustom: boolean;
  createdAt: string;
}

interface Tag {
  id: string;
  label: string;
  sessionId: string;
}

interface Results {
  tags: { tagId: string; label: string; voteCount: number }[];
  totalVoters: number;
  totalVotes: number;
}

function getModToken(sessionId: string): string | null {
  try {
    const tokens = JSON.parse(localStorage.getItem('mod_tokens') || '{}');
    return tokens[sessionId] || null;
  } catch {
    return null;
  }
}

export default function AdminSessionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [session, setSession] = useState<SessionData | null>(null);
  const [tagList, setTagList] = useState<Tag[]>([]);
  const [results, setResults] = useState<Results | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const modToken = typeof window !== 'undefined' ? getModToken(id) : null;
  const appUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const voteUrl = session ? `${appUrl}/vote/${session.joinCode}` : '';

  const fetchSession = useCallback(async () => {
    const res = await fetch(`/api/v1/sessions/${id}`);
    if (res.ok) setSession(await res.json());
  }, [id]);

  const fetchTags = useCallback(async () => {
    const res = await fetch(`/api/v1/sessions/${id}/tags`);
    if (res.ok) setTagList(await res.json());
  }, [id]);

  const fetchResults = useCallback(async () => {
    const res = await fetch(`/api/v1/sessions/${id}/results`);
    if (res.ok) setResults(await res.json());
  }, [id]);

  useEffect(() => {
    fetchSession();
    fetchTags();
    fetchResults();
  }, [fetchSession, fetchTags, fetchResults]);

  useEffect(() => {
    if (session?.status !== 'active') return;
    const iv = setInterval(() => {
      fetchResults();
      fetchTags();
    }, 1000);
    return () => clearInterval(iv);
  }, [session?.status, fetchResults, fetchTags]);

  const removeTag = async (tagId: string) => {
    if (!modToken) return;
    await fetch(`/api/v1/sessions/${id}/tags/${tagId}`, {
      method: 'DELETE',
      headers: { 'x-moderator-token': modToken },
    });
    fetchTags();
    fetchResults();
  };

  const endSession = async () => {
    if (!modToken || !confirm('Завершить сессию? Голосование будет закрыто.')) return;

    const res = await fetch(`/api/v1/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-moderator-token': modToken },
      body: JSON.stringify({ status: 'closed' }),
    });
    if (res.ok) fetchSession();
    else setError('Не удалось завершить сессию');
  };

  const copyLink = () => {
    navigator.clipboard.writeText(voteUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!session) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-muted animate-pulse text-lg">Загрузка...</div>
      </div>
    );
  }

  const words = results?.tags.map((t) => ({ text: t.label, value: t.voteCount })) ?? [];
  const topTag = results?.tags.reduce(
    (best, t) => (t.voteCount > (best?.voteCount ?? 0) ? t : best),
    results.tags[0],
  );
  const sortedTags = [...(results?.tags ?? [])].sort((a, b) => b.voteCount - a.voteCount);

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/admin" className="text-xl font-bold tracking-tight">
            <span className="text-primary">Tag</span>Cloud
          </Link>
          <div className="flex items-center gap-3">
            {session.status === 'active' && (
              <Link
                href={`/display/${session.id}`}
                target="_blank"
                className="px-3 py-1.5 text-sm rounded-lg bg-elevated border border-border hover:border-primary/50 transition-colors"
              >
                Полный экран ↗
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8 animate-fade-in">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold">{session.title}</h1>
            {session.status === 'active' ? (
              <span className="live-badge px-3 py-1 rounded-full text-xs font-bold bg-success/20 text-success border border-success/30">
                LIVE
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-dim/20 text-dim border border-dim/30">
                ЗАВЕРШЕНА
              </span>
            )}
          </div>
          {session.description && <p className="text-muted mt-1">{session.description}</p>}
        </div>

        {error && (
          <div className="p-3 mb-6 rounded-lg bg-danger/10 border border-danger/30 text-danger text-sm">{error}</div>
        )}

        <div className="grid lg:grid-cols-[340px_1fr] gap-8">
          <div className="space-y-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="p-5 rounded-xl bg-surface border border-border">
              <h3 className="font-semibold mb-4">QR-код для участников</h3>
              {voteUrl && (
                <div className="flex flex-col items-center gap-4">
                  <div className="p-3 bg-white rounded-xl">
                    <QRCodeSVG value={voteUrl} size={200} level="M" />
                  </div>
                  <div className="text-center w-full">
                    <div className="font-mono text-2xl font-bold tracking-[0.25em] text-primary mb-2">
                      {session.joinCode}
                    </div>
                    <p className="text-xs text-dim break-all mb-3">{voteUrl}</p>
                    <button
                      onClick={copyLink}
                      className="w-full py-2 rounded-lg bg-elevated border border-border hover:border-primary/50 text-sm transition-colors"
                    >
                      {copied ? '✓ Скопировано' : 'Копировать ссылку'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="p-5 rounded-xl bg-surface border border-border">
              <h3 className="font-semibold mb-3">Статистика</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted">Участников</span>
                  <span className="font-semibold text-accent">{results?.totalVoters ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Всего ответов</span>
                  <span className="font-semibold">{results?.totalVotes ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">Уникальных слов</span>
                  <span className="font-semibold">{tagList.length}</span>
                </div>
                {topTag && topTag.voteCount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-muted">Лидер</span>
                    <span className="font-semibold text-warning">{topTag.label}</span>
                  </div>
                )}
              </div>
            </div>

            {sortedTags.length > 0 && (
              <div className="p-5 rounded-xl bg-surface border border-border">
                <h3 className="font-semibold mb-3 flex items-center justify-between">
                  Все слова
                  <span className="text-sm text-dim font-normal">{sortedTags.length}</span>
                </h3>
                <div className="space-y-1.5 max-h-[260px] overflow-y-auto">
                  {sortedTags.map((tag) => (
                    <div key={tag.tagId} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate">{tag.label}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-muted tabular-nums">{tag.voteCount}</span>
                        {session.status === 'active' && modToken && (
                          <button
                            onClick={() => removeTag(tag.tagId)}
                            className="w-5 h-5 rounded flex items-center justify-center text-xs text-dim hover:text-danger hover:bg-danger/10 transition-colors"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {session.status === 'active' && modToken && (
              <button
                onClick={endSession}
                className="w-full py-2.5 rounded-lg border border-danger/30 text-danger hover:bg-danger/10 font-medium text-sm transition-colors"
              >
                Завершить сессию
              </button>
            )}
          </div>

          <div
            className="rounded-xl bg-surface border border-border p-4 min-h-[400px] flex items-center justify-center animate-fade-in"
            style={{ animationDelay: '0.2s' }}
          >
            <WordCloud words={words} />
          </div>
        </div>
      </main>
    </div>
  );
}
