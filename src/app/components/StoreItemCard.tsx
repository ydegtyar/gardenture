import React from 'react';
import type { CurseDef, TrinketDef } from '../../content/schema/types';
import { cn } from '../../utils/cn';
import {
  type StoreCardVariant,
  TrinketCornerFiligreeSvg,
  TrinketLevelCrestBadge,
  TrinketRelicArt,
} from '../trinkets';

/**
 * Centralized theme tokens for Store ItemCards (`trinket` brown-gold and `curse` black-red).
 * Tune `curse.bg`, `curse.border`, `curse.accent`, and `curse.glow` in one place.
 */
export const STORE_CARD_THEMES = {
  trinket: {
    bg: 'linear-gradient(135deg, #1D1712 0%, #120E0B 55%, #0B0907 100%)',
    lockedBg: 'linear-gradient(135deg, #18181B 0%, #121215 55%, #0C0C0E 100%)',
    border: '#7D623A',
    borderActive: '#9E824C',
    innerBevel: 'rgba(200, 157, 84, 0.28)',
    lockedBorder: 'rgba(74, 70, 62, 0.70)',
    lockedBevel: 'rgba(92, 86, 76, 0.22)',
    accent: '#D4A853',
    glow: 'rgba(212, 142, 45, 0.16)',
    activeGlow: 'rgba(72, 229, 122, 0.38)',
    title: '#FFF3D1',
    body: '#D8D0C2',
    muted: '#8C8881',
  },
  curse: {
    bg: 'linear-gradient(160deg, #1a0709 0%, #0d0305 100%)',
    lockedBg: 'linear-gradient(160deg, #14080a 0%, #090304 100%)',
    border: '#7a1424',
    borderHover: '#b3202f',
    borderActive: '#b3202f',
    innerBevel: 'rgba(179, 32, 47, 0.30)',
    lockedBorder: 'rgba(122, 20, 36, 0.45)',
    lockedBevel: 'rgba(122, 20, 36, 0.18)',
    accent: '#ff9aa8',
    glow: 'rgba(179, 32, 47, 0.28)',
    activeGlow: 'rgba(225, 56, 75, 0.46)',
    vignetteShadow:
      '0 12px 28px rgba(0,0,0,0.88), inset 0 0 26px rgba(122, 20, 36, 0.34), inset 0 1px 0 rgba(255, 154, 168, 0.14)',
    activeShadow:
      '0 12px 30px rgba(0,0,0,0.9), 0 0 18px rgba(179, 32, 47, 0.42), inset 0 0 30px rgba(179, 32, 47, 0.42), inset 0 1px 0 rgba(255, 154, 168, 0.24)',
    lockedShadow:
      '0 10px 24px rgba(0,0,0,0.85), inset 0 0 20px rgba(60, 10, 18, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.04)',
    title: '#ff9aa8',
    body: '#CFC3BE',
    muted: '#8E7D80',
  },
} as const;

export interface SectionHeaderProps {
  title: string;
  counterText: string;
  secondaryChipText?: string;
  variant?: StoreCardVariant;
  counterTestId?: string;
  secondaryChipTestId?: string;
}

/**
 * Shared SectionHeader with left title and right-aligned counter chip(s).
 */
export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  counterText,
  secondaryChipText,
  variant = 'trinket',
  counterTestId,
  secondaryChipTestId,
}) => {
  const isCurse = variant === 'curse';
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
      <h3
        className={cn(
          'font-display text-sm sm:text-base font-bold tracking-[0.1em] uppercase',
          isCurse
            ? 'text-[#ff9aa8] drop-shadow-[0_1px_6px_rgba(225,56,75,0.32)]'
            : 'text-[#A8E6CF] drop-shadow-[0_1px_6px_rgba(168,230,207,0.28)]'
        )}
      >
        {title}
      </h3>
      <div className="flex items-center gap-2">
        {secondaryChipText && (
          <span
            data-testid={secondaryChipTestId}
            className={cn(
              'text-[11px] font-bold font-mono-tabular tracking-wider uppercase px-2.5 py-0.5 rounded border',
              isCurse
                ? 'bg-[#1a0709] border-[#b3202f]/60 text-[#ff9aa8] shadow-[0_0_10px_rgba(179,32,47,0.25)]'
                : 'bg-[#18130F] border-[#C89D54]/35 text-[#E8D5B5]'
            )}
          >
            {secondaryChipText}
          </span>
        )}
        <span
          data-testid={counterTestId}
          className={cn(
            'text-[11px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded border',
            isCurse
              ? 'bg-[#160608] border-[#7a1424]/75 text-[#F2D5D9]'
              : 'bg-[#18130F] border-[#C89D54]/35 text-[#E8D5B5]'
          )}
        >
          {counterText}
        </span>
      </div>
    </div>
  );
};

export interface LevelBadgeProps {
  level: 1 | 2 | 3;
  itemId: string;
  variant?: StoreCardVariant;
  testId?: string;
}

/**
 * Shared LevelBadge (`LV 1`, `LV 2`, `LV 3` / `LV 3 MAX`) wrapping TrinketLevelCrestBadge.
 */
export const LevelBadge: React.FC<LevelBadgeProps> = ({
  level,
  itemId,
  variant = 'trinket',
  testId,
}) => (
  <TrinketLevelCrestBadge
    level={level}
    trinketId={itemId}
    variant={variant}
    testId={testId}
  />
);

/**
 * Padlock icon displayed in the top-right header of a locked card.
 */
export const LockedCardBadge: React.FC<{
  testId: string;
  title?: string;
  variant?: StoreCardVariant;
}> = ({ testId, title = 'Locked Relic', variant = 'trinket' }) => {
  const isCurse = variant === 'curse';
  return (
    <span
      data-testid={testId}
      className="inline-flex items-center justify-center w-6 h-6 rounded text-[#8E8A82] shrink-0"
      title={title}
    >
      <svg
        viewBox="0 0 24 24"
        className="w-4.5 h-4.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.85)]"
        fill="none"
      >
        <path
          d="M7 10V7a5 5 0 0 1 10 0v3"
          stroke={isCurse ? '#9E7B80' : '#8E8B84'}
          strokeWidth="2.2"
          strokeLinecap="round"
        />
        <rect
          x="5"
          y="10"
          width="14"
          height="11"
          rx="2.5"
          fill={isCurse ? '#5A3A3E' : '#6E6B64'}
          stroke={isCurse ? '#A88287' : '#9E9A91'}
          strokeWidth="1.2"
        />
        <circle cx="12" cy="15" r="1.4" fill="#1F1E1C" />
        <path
          d="M12 16v2.2"
          stroke="#1F1E1C"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
};

export interface PriceButtonProps {
  label: string;
  canAfford: boolean;
  onClick: () => void;
  variant?: StoreCardVariant;
  testId?: string;
}

/**
 * Shared PriceButton for buying a Trinket (`Buy (N Coins)`) or unlocking a Curse Sigil (`Unlock (N Coins)`).
 * Shows a glowing coin emblem when affordable, or a lock icon + dashed inner border when unaffordable.
 */
export const PriceButton: React.FC<PriceButtonProps> = ({
  label,
  canAfford,
  onClick,
  variant = 'trinket',
  testId,
}) => {
  const isCurse = variant === 'curse';
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={!canAfford}
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-[6px] text-xs font-bold tracking-wide transition-all border whitespace-nowrap',
        canAfford
          ? isCurse
            ? 'bg-gradient-to-b from-[#3B0C14] via-[#26070C] to-[#160306] hover:from-[#4F101B] hover:to-[#22060B] text-[#FFE8EC] border-[#b3202f]/90 shadow-[0_4px_14px_rgba(179,32,47,0.32),inset_0_-2px_6px_rgba(225,56,75,0.28),inset_0_1px_0_rgba(255,180,190,0.25)]'
            : 'bg-gradient-to-b from-[#282015] via-[#1B150E] to-[#120E09] hover:from-[#352A1B] hover:to-[#1A140D] text-[#FFF5D6] border-[#D4A853]/85 shadow-[0_4px_14px_rgba(212,168,83,0.25),inset_0_-2px_6px_rgba(232,182,74,0.35),inset_0_1px_0_rgba(255,240,190,0.28)]'
          : isCurse
            ? 'bg-[#140709]/90 text-[#7A6467] border-[#4A2229]/70 cursor-not-allowed'
            : 'bg-[#18181B]/90 text-[#767572] border-[#3E3D3B] cursor-not-allowed'
      )}
    >
      {!canAfford && (
        <span
          className={cn(
            'absolute inset-[2px] rounded-[4px] border border-dashed pointer-events-none',
            isCurse ? 'border-[#633038]/60' : 'border-[#52514E]/60'
          )}
          aria-hidden="true"
        />
      )}
      <span>{label}</span>
      {canAfford ? (
        <span
          className="inline-block w-3 h-3 rounded-full bg-gradient-to-br from-[#FFF3B0] via-[#E8B64A] to-[#9C6E21] border border-[#FFFDF0]/60 shadow-[0_0_6px_rgba(232,182,74,0.7)]"
          aria-hidden="true"
        />
      ) : (
        <svg
          viewBox="0 0 16 16"
          className={cn('w-3 h-3 opacity-80', isCurse ? 'text-[#8C6D72]' : 'text-[#767572]')}
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M5 7V5a3 3 0 0 1 6 0v2h1a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1zm2-2v2h2V5a1 1 0 0 0-2 0z" />
        </svg>
      )}
    </button>
  );
};

export interface StateButtonProps {
  mode: 'equip' | 'equipped' | 'activate' | 'active' | 'upgrade' | 'max';
  label: string;
  onClick?: () => void;
  disabled?: boolean;
  variant?: StoreCardVariant;
  upgradeTargetLevel?: 2 | 3;
  showLockWhenDisabled?: boolean;
  testId?: string;
}

/**
 * Shared StateButton for Equip / Equipped / Activate / Active / Upgrade / MAX chip states.
 */
export const StateButton: React.FC<StateButtonProps> = ({
  mode,
  label,
  onClick,
  disabled = false,
  variant = 'trinket',
  upgradeTargetLevel = 2,
  showLockWhenDisabled = false,
  testId,
}) => {
  const isCurse = variant === 'curse';

  if (mode === 'max') {
    return (
      <span
        data-testid={testId}
        aria-disabled="true"
        className={cn(
          'inline-flex items-center justify-center px-2.5 py-1.5 rounded-[6px] text-[11px] font-extrabold tracking-[0.08em] uppercase border select-none whitespace-nowrap',
          isCurse
            ? 'bg-[#1D070B]/90 text-[#ff9aa8]/85 border-[#7a1424]/75 shadow-[inset_0_1px_0_rgba(255,154,168,0.15)]'
            : 'bg-[#181411]/90 text-[#E8B64A]/85 border-[#7D623A]/65'
        )}
      >
        {label}
      </span>
    );
  }

  if (mode === 'upgrade') {
    return (
      <button
        type="button"
        data-testid={testId}
        disabled={disabled}
        onClick={onClick}
        className={cn(
          'inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-[6px] text-[11px] font-semibold tracking-wide transition-all border whitespace-nowrap',
          disabled
            ? isCurse
              ? 'bg-[#150608]/90 text-[#7A6266] border-[#4A1C24]/65 cursor-not-allowed'
              : 'bg-[#181411]/90 text-[#7A7067] border-[#4A3F35]/60 cursor-not-allowed'
            : isCurse
              ? 'bg-gradient-to-b from-[#330A12] to-[#1A0408] hover:from-[#470E19] hover:to-[#24060C] text-[#FFB8C2] border-[#b3202f]/80 shadow-[0_2px_10px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,165,178,0.22)]'
              : upgradeTargetLevel === 2
                ? 'bg-gradient-to-b from-[#2B2116] to-[#17110B] hover:from-[#382B1C] hover:to-[#1F170F] text-[#F5D78E] border-[#C8963E]/75 shadow-[0_2px_10px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(255,230,160,0.2)]'
                : 'bg-gradient-to-b from-[#162B22] to-[#0C1813] hover:from-[#1E3B2E] hover:to-[#11221B] text-[#98F5C4] border-[#48E57A]/65 shadow-[0_2px_10px_rgba(0,0,0,0.6),inset_0_1px_0_rgba(168,230,207,0.2)]'
        )}
      >
        <span>{label}</span>
        {disabled && showLockWhenDisabled && (
          <svg
            viewBox="0 0 16 16"
            className="w-2.5 h-2.5 text-[#8C6D72] opacity-85 shrink-0"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M5 7V5a3 3 0 0 1 6 0v2h1a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V8a1 1 0 0 1 1-1h1zm2-2v2h2V5a1 1 0 0 0-2 0z" />
          </svg>
        )}
      </button>
    );
  }

  if (mode === 'active' || mode === 'activate') {
    const isActive = mode === 'active';
    return (
      <button
        type="button"
        data-testid={testId}
        disabled={disabled}
        onClick={onClick}
        aria-pressed={isActive}
        className={cn(
          'inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded-[6px] text-xs font-bold tracking-wide transition-all border whitespace-nowrap',
          isActive
            ? 'bg-gradient-to-b from-[#6E1220] via-[#4D0B16] to-[#2E060C] text-[#FFF0F2] border-[#FF5C72] ring-1 ring-[#FF4D64]/55 shadow-[0_0_16px_rgba(225,56,75,0.48),inset_0_1px_0_rgba(255,210,218,0.35)]'
            : 'bg-gradient-to-b from-[#380B13] to-[#1C0509] hover:from-[#4C101B] hover:to-[#28070D] text-[#FFD8DF] border-[#9E1C2B]/85 shadow-[0_3px_10px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,160,175,0.22)]'
        )}
      >
        {isActive && (
          <span
            data-testid={testId ? `${testId}-ember-dot` : undefined}
            className="w-2 h-2 rounded-full bg-[#FF4D64] shadow-[0_0_8px_#FF2E4C] animate-pulse shrink-0"
            aria-hidden="true"
          />
        )}
        <span>{label}</span>
      </button>
    );
  }

  const isEquipped = mode === 'equipped';
  return (
    <button
      type="button"
      data-testid={testId}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'px-3.5 py-1.5 rounded-[6px] text-xs font-bold tracking-wide transition-all border whitespace-nowrap',
        isEquipped
          ? 'bg-gradient-to-b from-[#2E6F4E] via-[#21543A] to-[#163B28] text-[#E6FFF2] border-[#6EE7B7]/85 shadow-[0_0_16px_rgba(72,229,122,0.38),inset_0_1px_0_rgba(255,255,255,0.3)]'
          : 'bg-gradient-to-b from-[#2D2318] to-[#18120C] hover:from-[#3B2E20] hover:to-[#221A11] text-[#FFF3D1] border-[#C89D54]/75 shadow-[0_3px_10px_rgba(0,0,0,0.65),inset_0_1px_0_rgba(255,230,170,0.22)]'
      )}
    >
      {label}
    </button>
  );
};

export interface SigilRelicArtProps {
  sigilId: string;
  artSrc: string;
  level: 0 | 1 | 2 | 3;
  active: boolean;
  className?: string;
}

/**
 * Renders the Curse Sigil illustration in the left art slot with a soft crimson glow behind,
 * CSS filter desaturation when locked or inactive, pulsing red aura when active,
 * and level-scaled crimson rune accents at Lv 2 and Lv 3.
 */
export const SigilRelicArt: React.FC<SigilRelicArtProps> = ({
  sigilId,
  artSrc,
  level,
  active,
  className = 'w-full h-[130px]',
}) => {
  const isLocked = level === 0;
  const uid = `sigil-${sigilId}-lv${level}`;

  const glowColor = isLocked
    ? 'rgba(90, 40, 48, 0.14)'
    : active
      ? level === 3
        ? 'rgba(235, 45, 70, 0.46)'
        : level === 2
          ? 'rgba(220, 40, 64, 0.38)'
          : 'rgba(200, 35, 58, 0.32)'
      : level >= 2
        ? 'rgba(165, 28, 46, 0.24)'
        : 'rgba(140, 22, 38, 0.18)';

  return (
    <div
      data-testid={`sigil-art-${sigilId}-lv${level}`}
      className={cn('relative flex items-center justify-center select-none', className)}
    >
      {/* Radial Crimson Backlight Aura */}
      <div
        className={cn(
          'absolute inset-1 rounded-full pointer-events-none transition-all duration-300',
          active && !isLocked && 'animate-pulse'
        )}
        style={{
          background: `radial-gradient(circle at 50% 50%, ${glowColor} 0%, transparent 72%)`,
        }}
      />

      {/* Level 2 / 3 Arcane Crimson Rune Ring Behind Sigil */}
      {!isLocked && (level >= 2 || active) && (
        <svg
          viewBox="0 0 180 180"
          className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id={`sigil-halo-${uid}`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#FFD0D7" />
              <stop offset="50%" stopColor="#E1384B" />
              <stop offset="100%" stopColor="#6E101F" />
            </linearGradient>
          </defs>
          <circle
            cx="90"
            cy="90"
            r="64"
            fill="none"
            stroke={`url(#sigil-halo-${uid})`}
            strokeWidth={level === 3 ? '1.4' : '1.0'}
            strokeDasharray="6 4 2 4"
            opacity={active ? '0.82' : '0.45'}
          />
          {level === 3 && (
            <>
              <circle
                cx="90"
                cy="90"
                r="71"
                fill="none"
                stroke={`url(#sigil-halo-${uid})`}
                strokeWidth="0.85"
                opacity={active ? '0.58' : '0.32'}
              />
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
                const rad = (deg * Math.PI) / 180;
                const x1 = 90 + Math.cos(rad) * 62;
                const y1 = 90 + Math.sin(rad) * 62;
                const x2 = 90 + Math.cos(rad) * 73;
                const y2 = 90 + Math.sin(rad) * 73;
                return (
                  <line
                    key={deg}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#FF9AA8"
                    strokeWidth="1.4"
                    opacity={active ? '0.8' : '0.45'}
                  />
                );
              })}
            </>
          )}
        </svg>
      )}

      {/* High-Resolution Painted Sigil Illustration */}
      <img
        src={artSrc}
        alt={`${sigilId} ${isLocked ? 'locked' : `level ${level}`}`}
        draggable={false}
        className={cn(
          'relative z-10 w-[114px] h-[118px] object-contain transition-all duration-300',
          isLocked
            ? 'grayscale opacity-40 brightness-75 contrast-125 drop-shadow-[0_6px_10px_rgba(0,0,0,0.92)]'
            : active
              ? level === 3
                ? 'scale-[1.05] drop-shadow-[0_6px_12px_rgba(0,0,0,0.92)] drop-shadow-[0_0_14px_rgba(225,56,75,0.65)]'
                : level === 2
                  ? 'scale-[1.02] drop-shadow-[0_6px_12px_rgba(0,0,0,0.92)] drop-shadow-[0_0_10px_rgba(225,56,75,0.5)]'
                  : 'drop-shadow-[0_6px_12px_rgba(0,0,0,0.92)] drop-shadow-[0_0_8px_rgba(225,56,75,0.42)]'
              : 'grayscale-[38%] brightness-90 contrast-105 drop-shadow-[0_6px_12px_rgba(0,0,0,0.9)]'
        )}
      />

      {/* Floating Crimson Ember Particles for Unlocked Sigils */}
      {!isLocked && (
        <svg
          viewBox="0 0 180 180"
          className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
          aria-hidden="true"
        >
          {[
            [34, 134, 1.8, '#FF4D64'],
            [54, 146, 1.3, '#FF9AA8'],
            [136, 40, 1.6, '#FF7588'],
            ...(level >= 2
              ? ([
                  [28, 58, 1.8, '#FF9AA8'],
                  [134, 136, 2.0, '#E1384B'],
                ] as const)
              : []),
            ...(level === 3
              ? ([
                  [44, 32, 2.2, '#FFE4E8'],
                  [146, 78, 2.1, '#FF5C72'],
                  [90, 22, 1.9, '#FF9AA8'],
                ] as const)
              : []),
          ].map(([cx, cy, r, color], idx) => (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r={r}
              fill={String(color)}
              opacity={active ? '0.92' : '0.52'}
            />
          ))}
        </svg>
      )}
    </div>
  );
};

export interface ItemCardProps {
  variant?: StoreCardVariant;
  itemId: string;
  title: string;
  description: string;
  nextLevelPreview?: string | null;
  unlocked: boolean;
  activeOrEquipped: boolean;
  level: 1 | 2 | 3;
  artSlot: React.ReactNode;
  actionsSlot: React.ReactNode;
  cardTestId?: string;
  lockedBadgeTestId?: string;
  levelBadgeTestId?: string;
}

/**
 * Shared RPG Store ItemCard (frame + inner bevel hairline + 4 corner filigree ornaments +
 * radial ember backdrop + left art slot + right content & action row).
 * Used by both Trinkets (`variant="trinket"`) and Curse Sigils (`variant="curse"`).
 */
export const ItemCard: React.FC<ItemCardProps> = ({
  variant = 'trinket',
  itemId,
  title,
  description,
  nextLevelPreview,
  unlocked,
  activeOrEquipped,
  level,
  artSlot,
  actionsSlot,
  cardTestId,
  lockedBadgeTestId,
  levelBadgeTestId,
}) => {
  const isCurse = variant === 'curse';
  const curseTheme = STORE_CARD_THEMES.curse;

  if (!isCurse) {
    // Exact Trinket Card markup & classes so Trinket cards look and behave 100% identically
    return (
      <div
        data-testid={cardTestId ?? `trinket-card-${itemId}`}
        className={cn(
          'relative overflow-hidden rounded-[6px] px-3.5 py-3 border transition-all duration-300 flex items-stretch gap-3 min-h-[146px]',
          unlocked
            ? 'bg-gradient-to-br from-[#1D1712] via-[#120E0B] to-[#0B0907] border-[#7D623A]/85 shadow-[0_12px_28px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,232,175,0.18)]'
            : 'bg-gradient-to-br from-[#18181B] via-[#121215] to-[#0C0C0E] border-[#4A463E]/70 shadow-[0_10px_24px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.05)]',
          activeOrEquipped && 'ring-1 ring-[#6EE7B7]/40 border-[#9E824C]'
        )}
      >
        {/* Inner Bevel Hairline Frame */}
        <div
          className={cn(
            'absolute inset-[3px] rounded-[4px] border pointer-events-none z-10',
            unlocked ? 'border-[#C89D54]/28' : 'border-[#5C564C]/22'
          )}
        />

        {/* 4 Ornate Gilded Corner Filigree Flourishes */}
        <TrinketCornerFiligreeSvg position="tl" locked={!unlocked} variant="trinket" />
        <TrinketCornerFiligreeSvg position="tr" locked={!unlocked} variant="trinket" />
        <TrinketCornerFiligreeSvg position="bl" locked={!unlocked} variant="trinket" />
        <TrinketCornerFiligreeSvg position="br" locked={!unlocked} variant="trinket" />

        {/* Atmospheric Ember / Smoke Backdrop */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: unlocked
              ? 'radial-gradient(circle at 22% 70%, rgba(212, 142, 45, 0.16), transparent 58%)'
              : 'radial-gradient(circle at 30% 80%, rgba(110, 116, 128, 0.12), transparent 60%)',
          }}
        />

        {/* Left Showcase Column */}
        <div className="relative w-[112px] sm:w-[122px] shrink-0 flex items-center justify-center z-10 -my-1">
          {artSlot}
        </div>

        {/* Right Column: Title, Level/Lock Badge, Description, RPG Action Buttons */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 z-10">
          <div>
            <div className="flex items-center justify-between gap-1.5">
              <h4
                className={cn(
                  'font-display text-[15px] sm:text-[15.5px] font-bold tracking-normal leading-tight whitespace-nowrap',
                  unlocked
                    ? 'text-[#FFF3D1] drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]'
                    : 'text-[#8C8881]'
                )}
              >
                {title}
              </h4>

              {unlocked ? (
                <LevelBadge
                  level={level}
                  itemId={itemId}
                  variant="trinket"
                  testId={levelBadgeTestId ?? `trinket-level-${itemId}`}
                />
              ) : (
                <LockedCardBadge
                  testId={lockedBadgeTestId ?? `trinket-locked-${itemId}`}
                  title="Locked Relic"
                  variant="trinket"
                />
              )}
            </div>

            <p
              className={cn(
                'text-xs leading-relaxed mt-1.5',
                unlocked ? 'text-[#D8D0C2]' : 'text-[#8C8881]'
              )}
            >
              {description}
            </p>
          </div>

          {/* Bottom Action Bar */}
          <div className="mt-2.5 flex items-center justify-end gap-2 flex-nowrap">
            {actionsSlot}
          </div>
        </div>
      </div>
    );
  }

  // Variant === 'curse' (Black-Red Crimson Sigil Card)
  return (
    <div
      data-testid={cardTestId ?? `sigil-card-${itemId}`}
      style={{
        background: unlocked ? curseTheme.bg : curseTheme.lockedBg,
        boxShadow: unlocked
          ? activeOrEquipped
            ? curseTheme.activeShadow
            : curseTheme.vignetteShadow
          : curseTheme.lockedShadow,
      }}
      className={cn(
        'group relative overflow-hidden rounded-[6px] px-3.5 py-3 border transition-all duration-300 flex items-stretch gap-3 min-h-[146px]',
        unlocked
          ? activeOrEquipped
            ? 'border-[#b3202f] ring-1 ring-[#FF4D64]/45'
            : 'border-[#7a1424] hover:border-[#b3202f]'
          : 'border-dashed border-[#7a1424]/55'
      )}
    >
      {/* Inner Bevel Hairline Frame */}
      <div
        className={cn(
          'absolute inset-[3px] rounded-[4px] border pointer-events-none z-10 transition-colors duration-300',
          unlocked
            ? activeOrEquipped
              ? 'border-[#ff9aa8]/35'
              : 'border-[#b3202f]/28 group-hover:border-[#b3202f]/42'
            : 'border-[#7a1424]/20'
        )}
      />

      {/* 4 Ornate Crimson Corner Filigree Flourishes */}
      <TrinketCornerFiligreeSvg
        position="tl"
        locked={!unlocked}
        variant="curse"
        active={activeOrEquipped}
      />
      <TrinketCornerFiligreeSvg
        position="tr"
        locked={!unlocked}
        variant="curse"
        active={activeOrEquipped}
      />
      <TrinketCornerFiligreeSvg
        position="bl"
        locked={!unlocked}
        variant="curse"
        active={activeOrEquipped}
      />
      <TrinketCornerFiligreeSvg
        position="br"
        locked={!unlocked}
        variant="curse"
        active={activeOrEquipped}
      />

      {/* Atmospheric Crimson Ember / Vignette Backdrop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: unlocked
            ? activeOrEquipped
              ? `radial-gradient(circle at 22% 65%, ${curseTheme.activeGlow}, transparent 60%)`
              : `radial-gradient(circle at 22% 70%, ${curseTheme.glow}, transparent 58%)`
            : 'radial-gradient(circle at 30% 80%, rgba(110, 45, 58, 0.12), transparent 60%)',
        }}
      />

      {/* Left Showcase Column: Sigil Art */}
      <div className="relative w-[112px] sm:w-[122px] shrink-0 flex items-center justify-center z-10 -my-1">
        {artSlot}
      </div>

      {/* Right Column: Title, Level/Lock Badge, Description, Next-Level Preview, Action Row */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5 z-10">
        <div>
          <div className="flex items-center justify-between gap-1.5">
            <h4
              className={cn(
                'font-display text-[15px] sm:text-[15.5px] font-bold tracking-normal leading-tight whitespace-nowrap',
                unlocked
                  ? 'text-[#ff9aa8] drop-shadow-[0_2px_4px_rgba(0,0,0,0.92)]'
                  : 'text-[#8E7D80]'
              )}
            >
              {title}
            </h4>

            {unlocked ? (
              <LevelBadge
                level={level}
                itemId={itemId}
                variant="curse"
                testId={levelBadgeTestId ?? `sigil-level-${itemId}`}
              />
            ) : (
              <LockedCardBadge
                testId={lockedBadgeTestId ?? `sigil-locked-${itemId}`}
                title="Locked Curse Sigil"
                variant="curse"
              />
            )}
          </div>

          <p
            className={cn(
              'text-xs leading-relaxed mt-1.5',
              unlocked ? 'text-[#CFC3BE]' : 'text-[#8E7D80]'
            )}
          >
            {description}
          </p>

          {unlocked && nextLevelPreview && (
            <p
              data-testid={`sigil-next-${itemId}`}
              className="text-[11px] leading-snug mt-1 text-[#9E878B] font-medium"
            >
              {nextLevelPreview}
            </p>
          )}
        </div>

        {/* Bottom Action Bar */}
        <div className="mt-2.5 flex items-center justify-end gap-2 flex-nowrap">
          {actionsSlot}
        </div>
      </div>
    </div>
  );
};

export interface TrinketStoreCardProps {
  trinket: TrinketDef;
  unlocked: boolean;
  equipped: boolean;
  currentLv: 1 | 2 | 3;
  coins: number;
  gems: number;
  onUnlock: (trinketId: string, cost: number) => void;
  onUpgrade?: (trinketId: string) => void;
  onToggleEquip: (trinketId: string) => void;
}

/**
 * Trinket Store Card built on top of shared `ItemCard`, `StateButton`, and `PriceButton`.
 */
export const TrinketStoreCard: React.FC<TrinketStoreCardProps> = ({
  trinket,
  unlocked,
  equipped,
  currentLv,
  coins,
  gems,
  onUnlock,
  onUpgrade,
  onToggleEquip,
}) => {
  const levelDesc = unlocked
    ? trinket.levelDescriptions?.[currentLv - 1] ?? trinket.description
    : trinket.description;
  const canAffordBuy = coins >= trinket.costCoins;
  const canAffordLv2 = coins >= trinket.upgradeCostCoinsLv2;
  const canAffordLv3 = gems >= trinket.upgradeCostSeedsLv3;
  const canAffordUpgrade = currentLv === 1 ? canAffordLv2 : canAffordLv3;

  return (
    <ItemCard
      variant="trinket"
      itemId={trinket.id}
      title={trinket.name}
      description={levelDesc}
      unlocked={unlocked}
      activeOrEquipped={equipped}
      level={currentLv}
      artSlot={
        <TrinketRelicArt
          trinketId={trinket.id}
          level={unlocked ? currentLv : 0}
          className="w-full h-[130px]"
        />
      }
      actionsSlot={
        <>
          {unlocked && currentLv < 3 && (
            <StateButton
              variant="trinket"
              mode="upgrade"
              upgradeTargetLevel={currentLv === 1 ? 2 : 3}
              testId={`upgrade-trinket-${trinket.id}`}
              disabled={!canAffordUpgrade}
              onClick={() => onUpgrade?.(trinket.id)}
              label={
                currentLv === 1
                  ? `Upgrade to Lv 2 (${trinket.upgradeCostCoinsLv2} Coins)`
                  : `Upgrade to Lv 3 (${trinket.upgradeCostSeedsLv3} Seeds)`
              }
            />
          )}

          {unlocked ? (
            <StateButton
              variant="trinket"
              mode={equipped ? 'equipped' : 'equip'}
              testId={`equip-trinket-${trinket.id}`}
              onClick={() => onToggleEquip(trinket.id)}
              label={equipped ? 'Equipped' : 'Equip'}
            />
          ) : (
            <PriceButton
              variant="trinket"
              testId={`buy-trinket-${trinket.id}`}
              canAfford={canAffordBuy}
              onClick={() => onUnlock(trinket.id, trinket.costCoins)}
              label={`Buy (${trinket.costCoins} Coins)`}
            />
          )}
        </>
      }
    />
  );
};

export interface SigilStoreCardProps {
  sigil: CurseDef;
  unlocked: boolean;
  active: boolean;
  currentLv: 1 | 2 | 3;
  coins: number;
  onUnlock: (sigilId: string, cost: number) => void;
  onUpgrade: (sigilId: string) => void;
  onToggleActive: (sigilId: string) => void;
}

/**
 * Curse Sigil Store Card (`ItemCard` with `variant="curse"`).
 * Supports multi-select activation, 3 upgrade levels (Lv 1 -> Lv 2 -> Lv 3),
 * next-level preview line, and MAX chip at Lv 3.
 */
export const SigilCard: React.FC<SigilStoreCardProps> = ({
  sigil,
  unlocked,
  active,
  currentLv,
  coins,
  onUnlock,
  onUpgrade,
  onToggleActive,
}) => {
  const currentLevelDef = sigil.levels[currentLv - 1] ?? sigil.levels[0];
  const nextLevelDef =
    currentLv === 1 ? sigil.levels[1] : currentLv === 2 ? sigil.levels[2] : undefined;
  const description = unlocked ? currentLevelDef.description : sigil.description;

  const nextLevelPreview =
    unlocked && nextLevelDef
      ? `Next: ${nextLevelDef.nextPreviewText} · Reward +${Math.round(nextLevelDef.rewardBonus * 100)}%`
      : null;

  const canAffordUnlock = coins >= sigil.costCoins;
  const upgradeCost =
    currentLv === 1 ? sigil.upgradeCostCoinsLv2 : sigil.upgradeCostCoinsLv3;
  const canAffordUpgrade = coins >= upgradeCost;

  return (
    <ItemCard
      variant="curse"
      itemId={sigil.id}
      title={sigil.name}
      description={description}
      nextLevelPreview={nextLevelPreview}
      unlocked={unlocked}
      activeOrEquipped={active}
      level={currentLv}
      artSlot={
        <SigilRelicArt
          sigilId={sigil.id}
          artSrc={sigil.art}
          level={unlocked ? currentLv : 0}
          active={active}
          className="w-full h-[130px]"
        />
      }
      actionsSlot={
        <>
          {unlocked &&
            (currentLv < 3 ? (
              <StateButton
                variant="curse"
                mode="upgrade"
                upgradeTargetLevel={currentLv === 1 ? 2 : 3}
                testId={`upgrade-sigil-${sigil.id}`}
                disabled={!canAffordUpgrade}
                showLockWhenDisabled={true}
                onClick={() => onUpgrade(sigil.id)}
                label={`Upgrade to Lv ${currentLv + 1} (${upgradeCost} Coins)`}
              />
            ) : (
              <StateButton
                variant="curse"
                mode="max"
                testId={`max-sigil-${sigil.id}`}
                label="MAX"
              />
            ))}

          {unlocked ? (
            <StateButton
              variant="curse"
              mode={active ? 'active' : 'activate'}
              testId={`toggle-sigil-${sigil.id}`}
              onClick={() => onToggleActive(sigil.id)}
              label={active ? 'Active' : 'Activate'}
            />
          ) : (
            <PriceButton
              variant="curse"
              testId={`unlock-sigil-${sigil.id}`}
              canAfford={canAffordUnlock}
              onClick={() => onUnlock(sigil.id, sigil.costCoins)}
              label={`Unlock (${sigil.costCoins} Coins)`}
            />
          )}
        </>
      }
    />
  );
};
