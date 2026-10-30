/**
 * Bespoke Inline <svg> Title Emblem & World-Matched Botanical HUD Icons
 * Layer 7 (app): Crafted with #2D1E2F dark plum silhouettes, interior detail, and pastel highlights.
 */

import React from 'react';
import {
  type AnyPowerUpId,
  type IconSize,
  getPowerUpDef,
  powerUpIcon,
} from '../game/data/powerups';

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
  size = 64,
  className = 'w-5 h-5 shrink-0',
}: {
  powerUpId: AnyPowerUpId;
  size?: IconSize;
  className?: string;
}) {
  const def = getPowerUpDef(powerUpId);
  const retinaSize: IconSize = size === 32 ? 64 : size === 64 ? 128 : 256;
  return (
    <img
      src={powerUpIcon(def.id, size)}
      srcSet={`${powerUpIcon(def.id, retinaSize)} 2x`}
      alt={def.name}
      referrerPolicy="no-referrer"
      data-testid={`powerup-icon-${powerUpId}`}
      data-powerup-id={def.id}
      className={`${className} object-contain select-none`}
    />
  );
}


