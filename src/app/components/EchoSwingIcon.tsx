import React from 'react';
import { TarotIllustrationSvg } from '../cards/TarotIllustrationSvg';
import type { CardRarity } from '../../content/schema/types';

export interface EchoSwingIconProps {
  size?: number;
  className?: string;
  glowColor?: string;
  title?: string;
  rarity?: CardRarity;
}

/**
 * Standalone icon component for Echo Swing (XIII · THE TWIN ECHO).
 * Renders the antique tarot alcove with twin golden-and-cyan slash arcs and acoustic echo reverberations.
 */
export const EchoSwingIcon = React.memo(function EchoSwingIcon({
  size = 132,
  className,
  glowColor = '#93C5FD',
  title = 'Echo Swing',
  rarity = 'rare',
}: EchoSwingIconProps) {
  return (
    <TarotIllustrationSvg
      targetId="echo_swing"
      rarity={rarity}
      iconColor={glowColor}
      className={className}
      size={size}
    />
  );
});
