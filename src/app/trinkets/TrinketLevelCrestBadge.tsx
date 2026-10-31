import React from 'react';
import type { TrinketLevelCrestBadgeProps } from './types';

export type Props = TrinketLevelCrestBadgeProps;

/**
 * Ornate RPG hexagonal metallic crest badge for LV 1 / LV 2 / LV 3.
 * Supports both `trinket` and `curse` theme variants.
 */
export const TrinketLevelCrestBadge: React.FC<TrinketLevelCrestBadgeProps> = ({
  level,
  trinketId,
  variant = 'trinket',
  testId,
}) => {
  const isMax = level === 3;
  const isLv2 = level === 2;
  const isCurse = variant === 'curse';
  const gradKey = `${variant}-${trinketId}-${level}`;

  return (
    <div
      data-testid={testId ?? `${variant === 'curse' ? 'sigil' : 'trinket'}-level-${trinketId}`}
      className="relative inline-flex items-center justify-center select-none shrink-0"
    >
      <svg
        viewBox="0 0 88 34"
        className="w-[66px] h-[26px] drop-shadow-[0_2px_6px_rgba(0,0,0,0.85)]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`crest-bg-${gradKey}`} x1="0" y1="0" x2="0" y2="1">
            {isCurse ? (
              isMax ? (
                <>
                  <stop offset="0%" stopColor="#6E1220" />
                  <stop offset="50%" stopColor="#3B0810" />
                  <stop offset="100%" stopColor="#1A0307" />
                </>
              ) : isLv2 ? (
                <>
                  <stop offset="0%" stopColor="#52101B" />
                  <stop offset="55%" stopColor="#2B070E" />
                  <stop offset="100%" stopColor="#140306" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#3E0D16" />
                  <stop offset="55%" stopColor="#22060B" />
                  <stop offset="100%" stopColor="#110205" />
                </>
              )
            ) : isMax ? (
              <>
                <stop offset="0%" stopColor="#593E14" />
                <stop offset="50%" stopColor="#2B1C08" />
                <stop offset="100%" stopColor="#140C03" />
              </>
            ) : isLv2 ? (
              <>
                <stop offset="0%" stopColor="#1E4D4B" />
                <stop offset="55%" stopColor="#122E2E" />
                <stop offset="100%" stopColor="#0A1A1B" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#244743" />
                <stop offset="55%" stopColor="#162C2A" />
                <stop offset="100%" stopColor="#0C1817" />
              </>
            )}
          </linearGradient>
          <linearGradient id={`crest-rim-${gradKey}`} x1="0" y1="0" x2="1" y2="1">
            {isCurse ? (
              isMax ? (
                <>
                  <stop offset="0%" stopColor="#FFD0D7" />
                  <stop offset="50%" stopColor="#E1384B" />
                  <stop offset="100%" stopColor="#7A1424" />
                </>
              ) : (
                <>
                  <stop offset="0%" stopColor="#FF9AA8" />
                  <stop offset="50%" stopColor="#B3202F" />
                  <stop offset="100%" stopColor="#5C0E1B" />
                </>
              )
            ) : isMax ? (
              <>
                <stop offset="0%" stopColor="#FFF3B0" />
                <stop offset="50%" stopColor="#E8B64A" />
                <stop offset="100%" stopColor="#8F6319" />
              </>
            ) : (
              <>
                <stop offset="0%" stopColor="#E6D2A3" />
                <stop offset="50%" stopColor="#9E8960" />
                <stop offset="100%" stopColor="#5C4E35" />
              </>
            )}
          </linearGradient>
        </defs>
        {/* Outer pointed hexagonal crest */}
        <polygon
          points="12,3 76,3 85,17 76,31 12,31 3,17"
          fill={`url(#crest-bg-${gradKey})`}
          stroke={`url(#crest-rim-${gradKey})`}
          strokeWidth="1.8"
        />
        {/* Inner bevel hairline */}
        <polygon
          points="14,6 74,6 81,17 74,28 14,28 7,17"
          fill="none"
          stroke={
            isCurse
              ? isMax
                ? '#FFB3BE'
                : '#FF7588'
              : isMax
                ? '#FDE68A'
                : '#7CE8C8'
          }
          strokeOpacity="0.35"
          strokeWidth="0.9"
        />
        {/* Side finial diamonds */}
        <polygon
          points="5,17 9,14 11,17 9,20"
          fill={isCurse ? (isMax ? '#FFD0D7' : '#FF9AA8') : isMax ? '#FDE68A' : '#D9C398'}
        />
        <polygon
          points="83,17 79,14 77,17 79,20"
          fill={isCurse ? (isMax ? '#FFD0D7' : '#FF9AA8') : isMax ? '#FDE68A' : '#D9C398'}
        />
      </svg>
      <span
        className={`absolute inset-0 flex items-center justify-center text-[10px] font-extrabold tracking-[0.06em] uppercase ${
          isCurse
            ? isMax
              ? 'text-[#FFE4E8] drop-shadow-[0_1px_4px_rgba(225,56,75,0.75)]'
              : 'text-[#FFD6DC] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]'
            : isMax
              ? 'text-[#FFF3B0] drop-shadow-[0_1px_4px_rgba(232,182,74,0.6)]'
              : 'text-[#E8F8F2] drop-shadow-[0_1px_3px_rgba(0,0,0,0.9)]'
        }`}
      >
        {isMax ? (isCurse ? 'LV 3' : 'MAX') : `LV ${level}`}
      </span>
    </div>
  );
};

export default TrinketLevelCrestBadge;
