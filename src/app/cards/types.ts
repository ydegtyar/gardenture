import type React from 'react';
import type { CardRarity } from '../../content/schema/types';

export interface TarotMetadata {
  numeral: string;
  arcanaTitle: string;
}

export interface GradientIds {
  sky: string;
  halo: string;
  gold: string;
  emerald: string;
  mint: string;
  rose: string;
  crimson: string;
  cyan: string;
  violet: string;
  bark: string;
  steel: string;
  parchment: string;
}

export interface CardSymbolProps {
  gradients: GradientIds;
}

export type CardSymbolComponent = React.ComponentType<CardSymbolProps>;

export interface TarotCardBackProps {
  orientation?: 'vertical' | 'horizontal';
}

export interface TarotIllustrationProps {
  targetId: string;
  rarity: CardRarity;
  accentColor?: string;
  iconColor?: string;
  className?: string;
}

export interface TarotCardFrameProps {
  gradients: GradientIds;
  haloColor: string;
  children?: React.ReactNode;
}

export interface TarotGradientsProps {
  gradients: GradientIds;
  skyStops: [string, string, string];
  haloColor: string;
}
