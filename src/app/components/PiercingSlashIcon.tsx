import React from 'react';
import { TarotIllustrationSvg } from '../cards/TarotIllustrationSvg';
import type { CardRarity } from '../../content/schema/types';

export interface PiercingSlashIconProps {
  size?: number;
  className?: string;
  glowColor?: string;
  title?: string;
  rarity?: CardRarity;
}

/**
 * Standalone icon component for Piercing Slash (XXI · THE SUNDERED WARD).
 * Renders the ancient carved-bark shield cleaved in two by a radiant piercing emerald crescent wave.
 */
export const PiercingSlashIcon = React.memo(function PiercingSlashIcon({
  size = 132,
  className,
  glowColor = '#6EE7B7',
  title = 'Piercing Slash',
  rarity = 'uncommon',
}: PiercingSlashIconProps) {
  return (
    <TarotIllustrationSvg
      targetId="piercing_slash"
      rarity={rarity}
      iconColor={glowColor}
      className={className}
      size={size}
    />
  );
});
