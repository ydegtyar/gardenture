import React from 'react';
import type { EvolutionProps } from './types';

/**
 * 1. AEGIS LEAF BROOCH Lv2 & Lv3 Upgrades.
 */
export const AegisLeafEvolution: React.FC<EvolutionProps> = ({ level, uid }) => {
  if (level < 2) return null;

  return (
    <g filter={`url(#upgrade-glow-${uid})`}>
      {/* Glowing Emerald Paladin Rune on Heater Shield Boss (centered on shield ridge at 116, 107) */}
      {level === 3 && (
        <path
          d="M105 107 L127 107 M116 94 L116 121"
          stroke="#FFF3B0"
          strokeWidth="2"
          strokeLinecap="round"
        />
      )}
      <polygon
        points="116,98 122,107 116,116 110,107"
        fill="#10B981"
        stroke="#D1FAE5"
        strokeWidth="1.3"
      />
      <polygon points="116,102 119,107 116,112 113,107" fill="#ECFDF5" />

      {/* Golden Filigree Vein Nodes along Leaf Midrib */}
      <circle cx="96" cy="72" r="2.3" fill="#A7F3D0" stroke="#065F46" strokeWidth="0.6" />
      <circle cx="80" cy="92" r="2.3" fill="#A7F3D0" stroke="#065F46" strokeWidth="0.6" />
      {level === 3 && (
        <>
          <circle cx="64" cy="112" r="2.3" fill="#A7F3D0" stroke="#065F46" strokeWidth="0.6" />
          {/* Crown Crest above Shield */}
          <path
            d="M105 84 L110 77 L116 82 L122 77 L127 84 Z"
            fill={`url(#upgrade-gold-${uid})`}
            stroke="#FFFDF0"
            strokeWidth="0.9"
          />
        </>
      )}
    </g>
  );
};

export default AegisLeafEvolution;
