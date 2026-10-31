import React from 'react';
import type { TrinketBacklightAuraProps } from './types';
import { getAuraGlowColor } from './trinketThemes';

export type Props = TrinketBacklightAuraProps;

/**
 * Radial Backlight Aura behind the Relic.
 */
export const TrinketBacklightAura: React.FC<TrinketBacklightAuraProps> = ({
  trinketId,
  level,
}) => {
  const auraGlowColor = getAuraGlowColor(trinketId, level);

  return (
    <div
      className="absolute inset-1 rounded-full pointer-events-none transition-all duration-300"
      style={{
        background: `radial-gradient(circle at 50% 50%, ${auraGlowColor} 0%, transparent 72%)`,
      }}
    />
  );
};

export default TrinketBacklightAura;
