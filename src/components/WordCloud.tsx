'use client';

const COLORS = [
  '#818cf8', '#38bdf8', '#34d399', '#fbbf24', '#f472b6',
  '#a78bfa', '#fb923c', '#2dd4bf', '#60a5fa', '#c084fc',
  '#e879f9', '#facc15', '#4ade80', '#f97316', '#22d3ee',
];

function stableHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  }
  return h;
}

interface Props {
  words: { text: string; value: number }[];
  maxFont?: number;
  minFont?: number;
  className?: string;
}

export function WordCloud({ words, maxFont = 80, minFont = 16, className = '' }: Props) {
  if (words.length === 0) {
    return (
      <div className={`flex items-center justify-center min-h-[200px] text-muted ${className}`}>
        <p className="text-lg opacity-60">Голосов пока нет</p>
      </div>
    );
  }

  const maxVal = Math.max(...words.map((w) => w.value), 1);

  const display = [...words].sort((a, b) => stableHash(a.text) - stableHash(b.text));

  return (
    <div className={`flex flex-wrap items-center justify-center gap-x-5 gap-y-3 p-6 ${className}`}>
      {display.map((word) => {
        const ratio = word.value / maxVal;
        const size = Math.round(minFont + ratio * (maxFont - minFont));
        const opacity = 0.45 + ratio * 0.55;
        const color = COLORS[Math.abs(stableHash(word.text)) % COLORS.length];
        const glow = ratio > 0.5 ? `0 0 ${Math.round(ratio * 30)}px ${color}50` : 'none';
        const rotation = ((stableHash(word.text) % 7) - 3) * 1.5;

        return (
          <span
            key={word.text}
            className="inline-block font-bold leading-none transition-all duration-700 ease-out cursor-default select-none"
            style={{
              fontSize: `${size}px`,
              color,
              opacity,
              textShadow: glow,
              transform: `rotate(${rotation}deg)`,
            }}
          >
            {word.text}
          </span>
        );
      })}
    </div>
  );
}
