import type React from 'react';
import { MagnetMossIcon, type MagnetMossIconProps } from '../components/MagnetMossIcon';
import { LeafBladeIcon, type LeafBladeIconProps } from '../components/LeafBladeIcon';

export { MagnetMossIcon, type MagnetMossIconProps };
export { LeafBladeIcon, type LeafBladeIconProps };

export type CardIconComponent = React.ComponentType<{
  size?: number;
  className?: string;
  glowColor?: string;
  title?: string;
}>;

export const CARD_ICON_COMPONENTS: Record<string, CardIconComponent> = {
  magnet_moss: MagnetMossIcon,
  garden_blade: LeafBladeIcon,
  leaf_blade: LeafBladeIcon,
};
