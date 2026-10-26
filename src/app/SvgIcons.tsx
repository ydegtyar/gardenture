/**
 * Bespoke Inline <svg> Title Emblem & World-Matched Botanical HUD Icons
 * Layer 7 (app): Crafted with #2D1E2F dark plum silhouettes, interior detail, and pastel highlights.
 */

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
        MYSTIC GARDEN ROGUELITE
      </text>
    </svg>
  );
}

export function HeartSocketIcon({ state = 'full' }: { state?: 'full' | 'damaged' | 'empty' }) {
  const fill = state === 'full' ? '#FFAAA6' : state === 'damaged' ? '#FFD3B6' : '#1E2923';
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" aria-hidden="true">
      <path
        d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"
        fill={fill}
        stroke="#2D1E2F"
        strokeWidth="2.5"
      />
      {state === 'full' && <circle cx="8" cy="8" r="1.8" fill="#FFFDF0" />}
    </svg>
  );
}

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

export function PauseSvgIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <rect
        x="6"
        y="4"
        width="4.5"
        height="16"
        rx="1.5"
        fill="#FDFFB6"
        stroke="#2D1E2F"
        strokeWidth="2.2"
      />
      <rect
        x="13.5"
        y="4"
        width="4.5"
        height="16"
        rx="1.5"
        fill="#FDFFB6"
        stroke="#2D1E2F"
        strokeWidth="2.2"
      />
    </svg>
  );
}

export function RestartSvgIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path
        d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"
        fill="none"
        stroke="#A8E6CF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 3v5h5"
        fill="none"
        stroke="#A8E6CF"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function PowerUpAbilityIcon({
  powerUpId,
  className = 'w-5 h-5 shrink-0',
}: {
  powerUpId: 'shield' | 'freeze' | 'fire_breath' | 'magnet' | 'time_slow';
  className?: string;
}) {
  if (powerUpId === 'shield') {
    // Aegis Orb: Radiant emerald bastion shield inside a protective barrier halo
    return (
      <svg
        viewBox="0 0 28 28"
        className={className}
        data-testid="powerup-icon-shield"
        aria-hidden="true"
      >
        <circle
          cx="14"
          cy="14"
          r="12"
          fill="#A8E6CF"
          fillOpacity="0.25"
          stroke="#A8E6CF"
          strokeWidth="1.8"
          strokeDasharray="3 2"
        />
        <path
          d="M14 3.5 L22.5 7 V13.8 C22.5 19.2 18.8 23.1 14 25 C9.2 23.1 5.5 19.2 5.5 13.8 V7 L14 3.5 Z"
          fill="#88D49E"
          stroke="#2D1E2F"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <path
          d="M14 6.2 L19.8 8.7 V13.5 C19.8 17.5 17.2 20.6 14 22.1 C10.8 20.6 8.2 17.5 8.2 13.5 V8.7 L14 6.2 Z"
          fill="#A8E6CF"
          stroke="#2D1E2F"
          strokeWidth="1.5"
        />
        {/* Golden oak-leaf cross chevron */}
        <path
          d="M14 8.5 V19.5 M10.2 13.2 L14 10.5 L17.8 13.2"
          fill="none"
          stroke="#FDFFB6"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="10.5" cy="9.5" r="1.3" fill="#FFFDF0" />
      </svg>
    );
  }

  if (powerUpId === 'freeze') {
    // Frost Flask: Corked crystalline ice potion vial with snowflake core
    return (
      <svg
        viewBox="0 0 28 28"
        className={className}
        data-testid="powerup-icon-freeze"
        aria-hidden="true"
      >
        {/* Cork & glass neck */}
        <rect
          x="11.5"
          y="2.5"
          width="5"
          height="3.2"
          rx="1"
          fill="#D9A066"
          stroke="#2D1E2F"
          strokeWidth="1.8"
        />
        <rect
          x="10.5"
          y="5.2"
          width="7"
          height="3"
          rx="1"
          fill="#FFFDF0"
          stroke="#2D1E2F"
          strokeWidth="2"
        />
        {/* Diamond/round frost alchemical flask body */}
        <path
          d="M11.2 8.2 L6 15.2 C4.6 17.2 5.4 21.5 8.5 23.5 C10.2 24.6 17.8 24.6 19.5 23.5 C22.6 21.5 23.4 17.2 22 15.2 L16.8 8.2 Z"
          fill="#A0C4FF"
          stroke="#2D1E2F"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* Snowflake crystal inside flask */}
        <path
          d="M14 11.8 V21.2 M9.8 14.1 L18.2 18.9 M18.2 14.1 L9.8 18.9"
          stroke="#FFFDF0"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="14" cy="16.5" r="2" fill="#FDFFB6" stroke="#2D1E2F" strokeWidth="1.2" />
      </svg>
    );
  }

  if (powerUpId === 'fire_breath') {
    // Ember Guard: Blazing flame-crested guardian shield & roaring fire crown
    return (
      <svg
        viewBox="0 0 28 28"
        className={className}
        data-testid="powerup-icon-fire_breath"
        aria-hidden="true"
      >
        {/* Outer roaring 3-tongue flame crown */}
        <path
          d="M14 2 C16.5 6 20 5.5 21 9.5 C23.8 11.2 24.2 16.5 21.5 20.5 C19.2 23.8 16.5 25.2 14 26 C11.5 25.2 8.8 23.8 6.5 20.5 C3.8 16.5 4.2 11.2 7 9.5 C8 5.5 11.5 6 14 2 Z"
          fill="#F97316"
          stroke="#2D1E2F"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        {/* Inner golden flame shield */}
        <path
          d="M14 6.8 C15.8 9.8 18.5 10.2 18.8 14.2 C19 17.8 16.8 21.2 14 22.8 C11.2 21.2 9 17.8 9.2 14.2 C9.5 10.2 12.2 9.8 14 6.8 Z"
          fill="#FDFFB6"
          stroke="#2D1E2F"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
        {/* White-hot ember core */}
        <polygon points="14,11.2 16.6,15.8 14,19.8 11.4,15.8" fill="#FFFDF0" />
      </svg>
    );
  }

  if (powerUpId === 'magnet') {
    // Clover Magnet: Polarized U-shaped horseshoe magnet with emerald clover & attraction waves
    return (
      <svg
        viewBox="0 0 28 28"
        className={className}
        data-testid="powerup-icon-magnet"
        aria-hidden="true"
      >
        {/* U-shaped horseshoe magnet arch */}
        <path
          d="M6.5 7 V15.5 C6.5 20.2 9.8 23.5 14 23.5 C18.2 23.5 21.5 20.2 21.5 15.5 V7 H17.2 V15.2 C17.2 17.3 15.8 19 14 19 C12.2 19 10.8 17.3 10.8 15.2 V7 Z"
          fill="#F43F5E"
          stroke="#2D1E2F"
          strokeWidth="2.3"
          strokeLinejoin="round"
        />
        {/* North & South polarized gold/sky-blue tips */}
        <rect
          x="6.5"
          y="5.5"
          width="4.3"
          height="4.2"
          fill="#FDFFB6"
          stroke="#2D1E2F"
          strokeWidth="2"
        />
        <rect
          x="17.2"
          y="5.5"
          width="4.3"
          height="4.2"
          fill="#A0C4FF"
          stroke="#2D1E2F"
          strokeWidth="2"
        />
        {/* Magnetic lightning/clover spark at center */}
        <polygon
          points="14,9 15.3,12 18.3,13.2 15.3,14.5 14,17.5 12.7,14.5 9.7,13.2 12.7,12"
          fill="#A8E6CF"
          stroke="#2D1E2F"
          strokeWidth="1.4"
        />
      </svg>
    );
  }

  // 'time_slow' -> Sundial Watch: Ornate golden pocket watch / chronometer with lavender clock face
  return (
    <svg
      viewBox="0 0 28 28"
      className={className}
      data-testid="powerup-icon-time_slow"
      aria-hidden="true"
    >
      {/* Top pocket-watch crown & ring */}
      <circle
        cx="14"
        cy="3.8"
        r="2.1"
        fill="none"
        stroke="#FDFFB6"
        strokeWidth="2"
      />
      <rect
        x="12.2"
        y="5.2"
        width="3.6"
        height="2.4"
        rx="0.8"
        fill="#FBBF24"
        stroke="#2D1E2F"
        strokeWidth="1.6"
      />
      {/* Outer gold bezel */}
      <circle
        cx="14"
        cy="16"
        r="9.5"
        fill="#FBBF24"
        stroke="#2D1E2F"
        strokeWidth="2.4"
      />
      {/* Inner lavender sundial clock face */}
      <circle
        cx="14"
        cy="16"
        r="7.1"
        fill="#DED2F9"
        stroke="#2D1E2F"
        strokeWidth="1.6"
      />
      {/* Clock hands & center pivot */}
      <path
        d="M14 16 V11.5 M14 16 L17.6 17.6"
        stroke="#2D1E2F"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <circle cx="14" cy="16" r="1.4" fill="#FDFFB6" stroke="#2D1E2F" strokeWidth="1.2" />
    </svg>
  );
}

