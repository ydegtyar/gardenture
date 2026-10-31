import React from 'react';
import type { EvolutionProps } from './types';

/**
 * 2. GILDED CLOVER CHARM Lv2 & Lv3 Upgrades.
 */
export const CloverCharmEvolution: React.FC<EvolutionProps> = ({ level, uid }) => {
  if (level < 2) return null;

  return (
    <g filter={`url(#upgrade-glow-${uid})`}>
      {/* Center Faceted Emerald Jewel at Clover Intersection */}
      <polygon
        points="89,81 96,88 89,95 82,88"
        fill="#10B981"
        stroke="#FFF3B0"
        strokeWidth="1.4"
      />
      <polygon points="89,84 93,88 89,92 85,88" fill="#A7F3D0" />

      {/* Extra Royal Pendeloque Gem on Lower Draped Chain */}
      <polygon
        points="92,142 96,149 92,156 88,149"
        fill={level === 3 ? '#10B981' : '#FDE68A'}
        stroke="#FFFDF0"
        strokeWidth="1"
      />

      {/* Lv 3 Four Emerald Heart Gems & Starburst Sparkles */}
      {level === 3 && (
        <>
          {[
            [74, 65],
            [109, 73],
            [99, 108],
            [65, 99],
          ].map(([cx, cy], idx) => (
            <circle
              key={idx}
              cx={cx}
              cy={cy}
              r="3.8"
              fill="#10B981"
              stroke="#FEF08A"
              strokeWidth="1.1"
            />
          ))}
        </>
      )}
    </g>
  );
};

export default CloverCharmEvolution;
