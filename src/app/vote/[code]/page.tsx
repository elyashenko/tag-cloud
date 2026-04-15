'use client';

import { useState, useEffect, useCallback, useRef, use } from 'react';
import Link from 'next/link';

interface SessionData {
  id: string;
  title: string;
  description: string | null;
  status: string;
  joinCode: string;
  maxVotes: number;
}

interface MyWord {
  tagId: string;
  label: string;
}

export default function VotePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = use(params);
  const [session, setSession] = useState<SessionData | null>(null);
  const [myWords, setMyWords] = useState<MyWord[]>([]);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notFound, setNotFound] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchMyWords = useCallback(async (sessionId: string) => {
    const res = await fetch(`/api/v1/sessions/${sessionId}/votes/me`);
    if (res.ok) setMyWords(await res.json());
  }, []);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/v1/sessions/join/${code}`);
      if (!res.ok) {
        setNotFound(true);
        return;
      }
      const s: SessionData = await res.json();
      setSession(s);
      fetchMyWords(s.id);
    })();
  }, [code, fetchMyWords]);

  const submitWord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !input.trim() || submitting) return;
    setSubmitting(true);
    setError('');

    try {
      const res = await fetch(`/api/v1/sessions/${session.id}/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word: input.trim() }),
      });

      if (res.ok) {
        setInput('');
        fetchMyWords(session.id);
        inputRef.current?.focus();
      } else {
        const text = await res.text();
        try {
          const data = JSON.parse(text);
          setError(data.error || 'Ошибка отправки');
        } catch {
          setError('Ошибка отправки');
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const removeWord = async (tagId: string) => {
    if (!session) return;
    await fetch(`/api/v1/sessions/${session.id}/votes?tagId=${tagId}`, { method: 'DELETE' });
    fetchMyWords(session.id);
  };

  if (notFound) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-4">
        <h1 className="text-2xl font-bold mb-2">Сессия не найдена</h1>
        <p className="text-muted mb-6">Проверьте код и попробуйте снова</p>
        <Link href="/" className="text-primary hover:underline">
          На главную
        </Link>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="text-muted animate-pulse text-lg">Загрузка...</div>
      </div>
    );
  }

  const canAddMore = myWords.length < session.maxVotes && session.status === 'active';

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
          <span className="text-lg font-bold tracking-tight">
            <span className="text-primary">Tag</span>Cloud
          </span>
          {session.status === 'active' && (
            <span className="flex items-center gap-2 text-sm text-muted">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
              Активно
            </span>
          )}
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full px-4 py-10">
        <div className="text-center mb-10 animate-fade-in">
          <h1 className="text-2xl sm:text-3xl font-bold mb-2">{session.title}</h1>
          {session.description && <p className="text-muted">{session.description}</p>}
          {session.status === 'closed' && (
            <div className="mt-5 px-5 py-3 rounded-xl bg-warning/10 border border-warning/30 text-warning text-sm inline-block">
              Голосование завершено. Спасибо за участие!
            </div>
          )}
        </div>

        {canAddMore && (
          <div className="w-full animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <form onSubmit={submitWord} className="flex gap-2 mb-3">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => {
                  setInput(e.target.value);
                  setError('');
                }}
                placeholder="Введите слово или фразу..."
                maxLength={50}
                autoFocus
                className="flex-1 px-4 py-3.5 rounded-xl bg-surface border border-border text-text placeholder:text-dim text-lg focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="submit"
                disabled={!input.trim() || submitting}
                className="px-6 py-3.5 rounded-xl bg-primary hover:bg-primary-hover disabled:opacity-40 text-white font-semibold text-lg transition-colors"
              >
                {submitting ? '...' : '→'}
              </button>
            </form>
            {error && <p className="text-center text-danger text-sm">{error}</p>}
            <p className="text-center text-dim text-xs mt-2">
              {myWords.length} из {session.maxVotes}
            </p>
          </div>
        )}

        {myWords.length > 0 && (
          <div className="w-full mt-8 animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <p className="text-sm text-muted mb-3">Ваши ответы:</p>
            <div className="space-y-2">
              {myWords.map((w) => (
                <div
                  key={w.tagId}
                  className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-surface border border-border"
                >
                  <span className="font-medium">{w.label}</span>
                  {session.status === 'active' && (
                    <button
                      onClick={() => removeWord(w.tagId)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-dim hover:text-danger hover:bg-danger/10 transition-colors"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {!canAddMore && session.status === 'active' && myWords.length > 0 && (
          <div className="mt-8 text-center animate-fade-in">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-success/10 border border-success/30 text-success">
              <span className="text-lg">✓</span>
              <span className="font-medium">Спасибо за ваши ответы!</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
