import React from 'react';

export function MuteSvgIcon({ muted }: { muted: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path
        d="M11 5L6 9H2v6h4l5 4V5z"
        fill={muted ? '#FFAAA6' : '#A8E6CF'}
        stroke="#2D1E2F"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      {muted ? (
        <path
          d="M22 9l-6 6M16 9l6 6"
          stroke="#FFAAA6"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"
          fill="none"
          stroke="#FFFDF0"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
