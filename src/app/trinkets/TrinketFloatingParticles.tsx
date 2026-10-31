import React from 'react';
import type { TrinketFloatingParticlesProps } from './types';
import { getFloatingParticles } from './trinketThemes';

export type Props = TrinketFloatingParticlesProps;

/**
 * Floating Ember & Stardust Particles for Unlocked Relics.
 */
export const TrinketFloatingParticles: React.FC<TrinketFloatingParticlesProps> = ({
  level,
  isLocked,
}) => {
  if (isLocked) return null;

  const particles = getFloatingParticles(level);

  return (
    <g>
      {particles.map(({ cx, cy, r, color }, idx) => (
        <circle key={idx} cx={cx} cy={cy} r={r} fill={color} opacity="0.88" />
      ))}
    </g>
  );
};

export default TrinketFloatingParticles;
