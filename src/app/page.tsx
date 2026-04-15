'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function Home() {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) return;

    const res = await fetch(`/api/v1/sessions/join/${trimmed}`);
    if (!res.ok) {
      setError('Сессия не найдена');
      return;
    }
    router.push(`/vote/${trimmed}`);
  };

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-4 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          background:
            'radial-gradient(ellipse 600px 400px at 50% 40%, #818cf830, transparent), radial-gradient(ellipse 400px 300px at 70% 60%, #22d3ee20, transparent)',
        }}
      />

      <div className="relative z-10 text-center max-w-xl mx-auto">
        <div className="mb-10 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-surface border border-border text-sm text-muted mb-6">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Real-time voting
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold tracking-tight mb-4">
            Live Tag
            <span className="text-primary"> Cloud</span>
          </h1>
          <p className="text-lg text-muted max-w-md mx-auto">
            Интерактивное облако тегов для конференций и мероприятий. Голосуйте в реальном времени.
          </p>
        </div>

        <div className="space-y-4 animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <Link
            href="/admin"
            className="block w-full py-3.5 px-6 rounded-xl bg-primary hover:bg-primary-hover text-white font-semibold text-lg transition-colors"
          >
            Создать сессию
          </Link>

          <div className="flex items-center gap-3 text-dim text-sm">
            <span className="flex-1 h-px bg-border" />
            или присоединиться
            <span className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={handleJoin} className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError('');
              }}
              placeholder="Код сессии"
              maxLength={6}
              className="flex-1 px-4 py-3 rounded-xl bg-surface border border-border text-text placeholder:text-dim text-center text-xl font-mono tracking-[0.3em] focus:outline-none focus:border-primary transition-colors"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-xl bg-elevated border border-border hover:border-primary text-text font-semibold transition-colors"
            >
              Войти
            </button>
          </form>

          {error && <p className="text-danger text-sm">{error}</p>}
        </div>
      </div>
    </div>
  );
}
