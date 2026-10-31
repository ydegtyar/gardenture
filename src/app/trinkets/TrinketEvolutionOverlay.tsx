import React from 'react';
import type { TrinketId, TrinketLevel } from './types';
import { getTrinketEvolution } from './evolutions';
import { TrinketFloatingParticles } from './TrinketFloatingParticles';

export interface Props {
  trinketId: TrinketId;
  level: TrinketLevel;
  uid: string;
}

export type TrinketEvolutionOverlayProps = Props;

/**
 * Level-Specific RPG Evolution Overlay (Lv 2 Awakened & Lv 3 Masterwork)
 * with glowing runes, jewels, and stardust particles.
 */
export const TrinketEvolutionOverlay: React.FC<Props> = ({
  trinketId,
  level,
  uid,
}) => {
  const isLocked = level === 0;
  const EvolutionComponent = getTrinketEvolution(trinketId);

  return (
    <svg
      viewBox="0 0 180 180"
      className="absolute inset-0 w-full h-full pointer-events-none z-20 overflow-visible"
      aria-hidden="true"
    >
      <defs>
        <filter id={`upgrade-glow-${uid}`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id={`upgrade-gold-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#FFFDF0" />
          <stop offset="45%" stopColor="#F5CC6A" />
          <stop offset="100%" stopColor="#9C6E21" />
        </linearGradient>
      </defs>

      {/* Trinket-Specific Evolution Upgrades (Lv 2 & Lv 3) */}
      {EvolutionComponent && (
        <EvolutionComponent level={level} uid={uid} />
      )}

      {/* Floating Ember & Stardust Particles for Unlocked Relics */}
      <TrinketFloatingParticles level={level} isLocked={isLocked} />
    </svg>
  );
};

export default TrinketEvolutionOverlay;
