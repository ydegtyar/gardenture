import React from 'react';
import type { TrinketCornerFiligreeProps } from './types';
import { getCornerFiligreeColors } from './trinketThemes';

export type Props = TrinketCornerFiligreeProps;

/**
 * Ornate gilded/crimson corner flourish used in the 4 corners of each Store ItemCard.
 * Uses token colors for `variant="curse"` without forking the SVG geometry.
 */
export const TrinketCornerFiligreeSvg: React.FC<TrinketCornerFiligreeProps> = ({
  position,
  locked = false,
  variant = 'trinket',
  active = false,
}) => {
  const rotateClass =
    position === 'tl'
      ? 'top-[2px] left-[2px] rotate-0'
      : position === 'tr'
        ? 'top-[2px] right-[2px] rotate-90'
        : position === 'br'
          ? 'bottom-[2px] right-[2px] rotate-180'
          : 'bottom-[2px] left-[2px] -rotate-90';

  const { primaryStroke, secondaryStroke, fillAccent, fillOpacity } =
    getCornerFiligreeColors(locked, variant, active);

  return (
    <svg
      viewBox="0 0 36 36"
      className={`w-7 h-7 absolute pointer-events-none select-none z-10 transition-colors duration-300 ${rotateClass}`}
      aria-hidden="true"
    >
      {/* Outer corner bracket */}
      <path
        d="M2 24 L2 4 Q2 2 4 2 L24 2"
        fill="none"
        stroke={primaryStroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Acanthus scroll leaf */}
      <path
        d="M3 16 C4 9, 9 4, 16 3 C12 6, 9 9, 8 13 C6 11, 4 13, 3 16 Z"
        fill={fillAccent}
        fillOpacity={fillOpacity}
        stroke={primaryStroke}
        strokeWidth="0.9"
      />
      {/* Inner curl */}
      <path
        d="M4 21 C5 15, 8 12, 11 11 C13 10, 14 12, 12 13 C10 14, 9 12, 10 11"
        fill="none"
        stroke={primaryStroke}
        strokeWidth="1"
        strokeLinecap="round"
      />
      <path
        d="M21 4 C15 5, 12 8, 11 11"
        fill="none"
        stroke={secondaryStroke}
        strokeWidth="1"
        strokeLinecap="round"
      />
      {/* Corner diamond boss */}
      <polygon
        points="5,2 8,5 5,8 2,5"
        fill={fillAccent}
        stroke={secondaryStroke}
        strokeWidth="0.8"
      />
      <circle cx="13.5" cy="5.5" r="1" fill={fillAccent} opacity={locked ? 0.4 : 0.85} />
      <circle cx="5.5" cy="13.5" r="1" fill={fillAccent} opacity={locked ? 0.4 : 0.85} />
    </svg>
  );
};

export default TrinketCornerFiligreeSvg;
