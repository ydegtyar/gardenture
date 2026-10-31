import React from 'react';

export function HeartSocketIcon({
  state = 'full',
  pulse = null,
  className = 'w-5 h-5 shrink-0',
}: {
  state?: 'full' | 'damaged' | 'empty';
  pulse?: 'damage' | 'heal' | null;
  className?: string;
}) {
  const fill =
    pulse === 'heal'
      ? '#88D49E'
      : pulse === 'damage'
        ? '#FB7185'
        : state === 'full'
          ? '#FFAAA6'
          : state === 'damaged'
            ? '#FFD3B6'
            : '#1E2923';
  return (
    <svg
      viewBox="0 0 24 24"
      data-testid="hud-heart-icon"
      data-pulse={pulse ?? 'idle'}
      className={className}
      aria-hidden="true"
    >
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={fill}
        stroke="#2D1E2F"
        strokeWidth="2.5"
      />
      {(state === 'full' || pulse !== null) && <circle cx="8" cy="8" r="1.8" fill="#FFFDF0" />}
    </svg>
  );
}
