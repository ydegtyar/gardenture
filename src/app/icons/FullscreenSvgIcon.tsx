import React from 'react';

export function FullscreenSvgIcon({ isFullscreen }: { isFullscreen: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      {isFullscreen ? (
        <>
          {/* Inward collapse arrows (Exit Fullscreen) */}
          <path
            d="M4 9h5V4M20 9h-5V4M4 15h5v5M20 15h-5v5"
            fill="none"
            stroke="#2D1E2F"
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M4 9h5V4M20 9h-5V4M4 15h5v5M20 15h-5v5"
            fill="none"
            stroke="#FDFFB6"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="1.8" fill="#A8E6CF" />
        </>
      ) : (
        <>
          {/* Outward expand corners (Enter Fullscreen) */}
          <path
            d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"
            fill="none"
            stroke="#2D1E2F"
            strokeWidth="4.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5"
            fill="none"
            stroke="#A8E6CF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M12 9.5L14.5 12L12 14.5L9.5 12Z"
            fill="#FFFDF0"
            stroke="#2D1E2F"
            strokeWidth="1.2"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}
