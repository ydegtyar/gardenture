import type { TrinketId, TrinketLevel, StoreCardVariant } from './types';

/**
 * Resolves the radial backlight aura color behind each relic depending on ID and unlock level.
 */
export function getAuraGlowColor(trinketId: TrinketId, level: TrinketLevel): string {
  if (level === 0) {
    return 'rgba(90, 96, 108, 0.14)';
  }

  switch (trinketId) {
    case 'aegis_leaf':
      if (level === 3) return 'rgba(72, 229, 122, 0.36)';
      if (level === 2) return 'rgba(72, 229, 122, 0.24)';
      return 'rgba(212, 163, 73, 0.18)';

    case 'clover_charm':
      if (level === 3) return 'rgba(245, 203, 92, 0.38)';
      if (level === 2) return 'rgba(245, 203, 92, 0.26)';
      return 'rgba(212, 163, 73, 0.18)';

    case 'magnet_root':
      if (level === 3) return 'rgba(255, 136, 17, 0.42)';
      if (level === 2) return 'rgba(255, 136, 17, 0.28)';
      return 'rgba(255, 120, 20, 0.20)';

    case 'wind_anklet':
    default:
      if (level === 3) return 'rgba(72, 202, 228, 0.38)';
      if (level === 2) return 'rgba(72, 202, 228, 0.26)';
      return 'rgba(72, 202, 228, 0.18)';
  }
}

export interface CornerFiligreeColorTokens {
  primaryStroke: string;
  secondaryStroke: string;
  fillAccent: string;
  fillOpacity: number;
}

/**
 * Resolves tokenized SVG strokes and fills for corner flourishes.
 */
export function getCornerFiligreeColors(
  locked: boolean,
  variant: StoreCardVariant,
  active: boolean
): CornerFiligreeColorTokens {
  const isCurse = variant === 'curse';

  const primaryStroke = locked
    ? isCurse
      ? '#5A3A3E'
      : '#6A6358'
    : isCurse
      ? active
        ? '#E1384B'
        : '#B3202F'
      : '#D4A853';

  const secondaryStroke = locked
    ? isCurse
      ? '#3D2428'
      : '#46413A'
    : isCurse
      ? '#7A1424'
      : '#8C6728';

  const fillAccent = locked
    ? isCurse
      ? '#4D2E33'
      : '#575148'
    : isCurse
      ? '#FF7588'
      : '#F3D286';

  return {
    primaryStroke,
    secondaryStroke,
    fillAccent,
    fillOpacity: locked ? 0.35 : 0.65,
  };
}

export interface ParticleConfig {
  cx: number;
  cy: number;
  r: number;
  color: string;
}

/**
 * Returns the stardust & ember particle coordinates scaling with relic upgrade level.
 */
export function getFloatingParticles(level: TrinketLevel): ParticleConfig[] {
  if (level === 0) return [];

  const base: ParticleConfig[] = [
    { cx: 34, cy: 134, r: 1.8, color: '#FFB703' },
    { cx: 54, cy: 146, r: 1.3, color: '#FDE68A' },
    { cx: 136, cy: 40, r: 1.5, color: '#FFF3B0' },
  ];

  if (level >= 2) {
    base.push(
      { cx: 28, cy: 58, r: 1.8, color: '#FFF3B0' },
      { cx: 132, cy: 138, r: 2.0, color: '#FFD166' }
    );
  }

  if (level === 3) {
    base.push(
      { cx: 44, cy: 32, r: 2.2, color: '#FFFFFF' },
      { cx: 148, cy: 76, r: 2.1, color: '#FFF3B0' },
      { cx: 88, cy: 22, r: 1.9, color: '#A7F3D0' }
    );
  }

  return base;
}
