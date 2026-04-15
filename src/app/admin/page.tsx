'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Session {
  id: string;
  title: string;
  description: string | null;
  status: string;
  joinCode: string;
  maxVotes: number;
  createdAt: string;
}

export default function AdminPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/api/v1/sessions')
      .then((r) => r.json())
      .then(setSessions);
  }, []);

  const createSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || loading) return;
    setLoading(true);

    try {
      const res = await fetch('/api/v1/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description: description.trim() || undefined,
        }),
      });

      const session = await res.json();

      const tokens = JSON.parse(localStorage.getItem('mod_tokens') || '{}');
      tokens[session.id] = session.moderatorToken;
      localStorage.setItem('mod_tokens', JSON.stringify(tokens));

      router.push(`/admin/session/${session.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold tracking-tight">
            <span className="text-primary">Tag</span>Cloud
          </Link>
          <span className="text-sm text-muted">Панель модератора</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[1fr_1.5fr] gap-8">
          <div className="animate-fade-in">
            <h2 className="text-2xl font-bold mb-6">Новая сессия</h2>
            <form onSubmit={createSession} className="space-y-4">
              <div>
                <label className="block text-sm text-muted mb-1.5">Заголовок</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Название сессии"
                  required
                  className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-text placeholder:text-dim focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1.5">
                  Вопрос для аудитории <span className="text-dim">(опционально)</span>
                </label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Какие технологии определят 2026 год?"
                  className="w-full px-4 py-2.5 rounded-lg bg-surface border border-border text-text placeholder:text-dim focus:outline-none focus:border-primary transition-colors"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !title.trim()}
                className="w-full py-3 rounded-lg bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-semibold transition-colors"
              >
                {loading ? 'Создание...' : 'Создать сессию'}
              </button>
            </form>
          </div>

          <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <h2 className="text-2xl font-bold mb-6">Сессии</h2>
            {sessions.length === 0 ? (
              <p className="text-muted">Пока нет сессий</p>
            ) : (
              <div className="space-y-3">
                {sessions.map((s) => (
                  <Link
                    key={s.id}
                    href={`/admin/session/${s.id}`}
                    className="block p-4 rounded-xl bg-surface border border-border hover:border-primary/50 transition-colors group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                          {s.title}
                        </h3>
                        <p className="text-sm text-muted mt-0.5">
                          Код: <span className="font-mono text-text">{s.joinCode}</span>
                        </p>
                      </div>
                      <span
                        className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          s.status === 'active'
                            ? 'bg-success/15 text-success'
                            : 'bg-dim/15 text-dim'
                        }`}
                      >
                        {s.status === 'active' ? 'LIVE' : 'Закрыта'}
                      </span>
                    </div>
                    <p className="text-xs text-dim mt-2">
                      {new Date(s.createdAt).toLocaleString('ru-RU')}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
