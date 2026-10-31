import React from 'react';

export function TitleLockupSvg({ className = 'w-full max-w-md' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 520 150"
      className={className}
      role="img"
      aria-label="Gardenture: Mystic Garden Roguelite"
    >
      {/* Decorative Botanical Vine & Rosebud Plaque Backing */}
      <path
        d="M42 75 C90 22, 430 22, 478 75 C430 128, 90 128, 42 75 Z"
        fill="#263C30"
        stroke="#2D1E2F"
        strokeWidth="6"
      />
      <path
        d="M58 75 C100 34, 420 34, 462 75 C420 116, 100 116, 58 75 Z"
        fill="none"
        stroke="#88D49E"
        strokeWidth="2.5"
        strokeDasharray="8 6"
      />

      {/* Left & Right Emerald Leaf Crests */}
      <path
        d="M18 75 C32 45, 66 48, 72 75 C66 102, 32 105, 18 75 Z"
        fill="#A8E6CF"
        stroke="#2D1E2F"
        strokeWidth="5"
      />
      <path
        d="M502 75 C488 45, 454 48, 448 75 C454 102, 488 105, 502 75 Z"
        fill="#A8E6CF"
        stroke="#2D1E2F"
        strokeWidth="5"
      />
      {/* Pastel Rosebuds */}
      <circle cx="52" cy="75" r="11" fill="#FFAAA6" stroke="#2D1E2F" strokeWidth="4" />
      <circle cx="468" cy="75" r="11" fill="#FFAAA6" stroke="#2D1E2F" strokeWidth="4" />

      {/* Crossed Garden Blade & Solar Star Crown at Top Center */}
      <polygon
        points="260,6 267,23 285,23 271,33 276,50 260,40 244,50 249,33 235,23 253,23"
        fill="#FDFFB6"
        stroke="#2D1E2F"
        strokeWidth="4"
      />

      {/* Main Display Lettering: GARDENTURE */}
      <text
        x="260"
        y="82"
        textAnchor="middle"
        fontFamily="Fraunces, Georgia, serif"
        fontWeight="900"
        fontSize="44"
        fill="#FFFDF0"
        stroke="#2D1E2F"
        strokeWidth="9"
        paintOrder="stroke fill"
        letterSpacing="2"
      >
        GARDENTURE
      </text>

      {/* Subtitle Ribbon */}
      <rect
        x="130"
        y="98"
        width="260"
        height="28"
        rx="14"
        fill="#FFAAA6"
        stroke="#2D1E2F"
        strokeWidth="4"
      />
      <text
        x="260"
        y="117"
        textAnchor="middle"
        fontFamily="Plus Jakarta Sans, sans-serif"
        fontWeight="800"
        fontSize="13"
        fill="#2D1E2F"
        letterSpacing="2.5"
      >
        Mystic Garden Adventure!
      </text>
    </svg>
  );
}
