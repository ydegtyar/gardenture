import React from 'react';
import type { TarotGradientsProps } from './types';

export type Props = TarotGradientsProps;
export type { TarotGradientsProps };

export const TarotGradients: React.FC<TarotGradientsProps> = ({
  gradients: g,
  skyStops,
  haloColor,
}) => {
  return (
    <defs>
      {/* Sky Alcove Vertical Linear Gradient */}
      <linearGradient id={g.sky} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor={skyStops[0]} />
        <stop offset="55%" stopColor={skyStops[1]} />
        <stop offset="100%" stopColor={skyStops[2]} />
      </linearGradient>

      {/* Esoteric Radial Halo Glow */}
      <radialGradient id={g.halo} cx="50%" cy="52%" r="48%">
        <stop offset="0%" stopColor={haloColor} stopOpacity="0.52" />
        <stop offset="52%" stopColor={haloColor} stopOpacity="0.18" />
        <stop offset="100%" stopColor={skyStops[2]} stopOpacity="0" />
      </radialGradient>

      {/* Sunlit Gold & Amber Gradient */}
      <linearGradient id={g.gold} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFFDF5" />
        <stop offset="38%" stopColor="#FDE047" />
        <stop offset="78%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </linearGradient>

      {/* Lush Emerald Leaf Gradient */}
      <linearGradient id={g.emerald} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#D1FAE5" />
        <stop offset="40%" stopColor="#6EE7B7" />
        <stop offset="80%" stopColor="#10B981" />
        <stop offset="100%" stopColor="#065F46" />
      </linearGradient>

      {/* Dewy Mint & Sage Gradient */}
      <linearGradient id={g.mint} x1="15%" y1="0%" x2="85%" y2="100%">
        <stop offset="0%" stopColor="#F0FDF4" />
        <stop offset="45%" stopColor="#A8E6CF" />
        <stop offset="100%" stopColor="#34D399" />
      </linearGradient>

      {/* Blossom Rose & Coral Gradient */}
      <linearGradient id={g.rose} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFE4E6" />
        <stop offset="45%" stopColor="#FDA4AF" />
        <stop offset="85%" stopColor="#F43F5E" />
        <stop offset="100%" stopColor="#9F1239" />
      </linearGradient>

      {/* Pyre Crimson & Ember Flame Gradient */}
      <linearGradient id={g.crimson} x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="35%" stopColor="#FB923C" />
        <stop offset="75%" stopColor="#E11D48" />
        <stop offset="100%" stopColor="#881337" />
      </linearGradient>

      {/* Astral Sky Cyan & Ice Gradient */}
      <linearGradient id={g.cyan} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F0F9FF" />
        <stop offset="42%" stopColor="#93C5FD" />
        <stop offset="82%" stopColor="#3B82F6" />
        <stop offset="100%" stopColor="#1D4ED8" />
      </linearGradient>

      {/* Mystic Lavender & Amethyst Gradient */}
      <linearGradient id={g.violet} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FAF5FF" />
        <stop offset="45%" stopColor="#DDD6FE" />
        <stop offset="82%" stopColor="#A855F7" />
        <stop offset="100%" stopColor="#581C87" />
      </linearGradient>

      {/* Heartwood Oak & Caramel Leather Gradient */}
      <linearGradient id={g.bark} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FCD34D" />
        <stop offset="35%" stopColor="#D9A066" />
        <stop offset="78%" stopColor="#9C6B46" />
        <stop offset="100%" stopColor="#5C3A21" />
      </linearGradient>

      {/* Forged Iron & Silver Gradient */}
      <linearGradient id={g.steel} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#F8FAFC" />
        <stop offset="45%" stopColor="#94A3B8" />
        <stop offset="85%" stopColor="#475569" />
        <stop offset="100%" stopColor="#1E293B" />
      </linearGradient>

      {/* Illuminated Cream Parchment Gradient */}
      <linearGradient id={g.parchment} x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="60%" stopColor="#FFFDF0" />
        <stop offset="100%" stopColor="#FDE68A" />
      </linearGradient>
    </defs>
  );
};

export default TarotGradients;
