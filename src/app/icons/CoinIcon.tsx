import React from 'react';

export function CoinIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <circle cx="12" cy="12" r="9.5" fill="#FDFFB6" stroke="#2D1E2F" strokeWidth="2.5" />
      <circle cx="12" cy="12" r="6.5" fill="#FBBF24" />
      <path
        d="M12 7 C14 9, 14 15, 12 17 C10 15, 10 9, 12 7 Z"
        fill="#88D49E"
        stroke="#2D1E2F"
        strokeWidth="1.5"
      />
    </svg>
  );
}
