import React from 'react';

export function SeedGemIcon({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <polygon
        points="12,2 20,9 16,21 8,21 4,9"
        fill="#DED2F9"
        stroke="#2D1E2F"
        strokeWidth="2.5"
      />
      <polygon points="12,5 16,10 12,18 8,10" fill="#A8E6CF" />
    </svg>
  );
}
