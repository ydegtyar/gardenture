import type React from 'react';
import type { TrinketDef } from '../../content/schema/types';

export type TrinketId = TrinketDef['id'];

export type StoreCardVariant = 'trinket' | 'curse';

export type CornerPosition = 'tl' | 'tr' | 'bl' | 'br';

export type TrinketLevel = 0 | 1 | 2 | 3;

export interface TrinketRelicArtProps {
  trinketId: TrinketId;
  /** 0 = Locked shadowed silhouette before Lv 1 is unlocked; 1 = Lv 1; 2 = Lv 2; 3 = Lv 3 */
  level: TrinketLevel;
  className?: string;
}

export interface TrinketCornerFiligreeProps {
  position: CornerPosition;
  locked?: boolean;
  variant?: StoreCardVariant;
  active?: boolean;
}

export interface TrinketLevelCrestBadgeProps {
  level: 1 | 2 | 3;
  trinketId: string;
  variant?: StoreCardVariant;
  testId?: string;
}

export interface TrinketBacklightAuraProps {
  trinketId: TrinketId;
  level: TrinketLevel;
}

export interface TrinketAscendedHaloProps {
  uid: string;
}

export interface TrinketFloatingParticlesProps {
  level: TrinketLevel;
  isLocked: boolean;
}

export interface TrinketEvolutionProps {
  trinketId: TrinketId;
  level: TrinketLevel;
  uid: string;
}

export type TrinketEvolutionComponent = React.ComponentType<{
  level: TrinketLevel;
  uid: string;
}>;
