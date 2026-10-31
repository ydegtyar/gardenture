/**
 * @file OrnateFrame.tsx
 * Reusable polished-gold frame with leafy vine corners, inner metallic outline,
 * parchment/velvet interior surface, and rarity gem accents.
 *
 * Usage:
 * | Prop | Values | Default | Description |
 * | --- | --- | --- | --- |
 * | `variant` | `'card' \| 'button' \| 'pill'` | `'card'` | Frame geometry and border thickness |
 * | `rarity` | `'common' \| 'uncommon' \| 'rare' \| 'epic' \| 'legendary'` | `'uncommon'` | Gem hue & outer aura |
 * | `corners` | `'vine' \| 'filigree' \| 'none'` | `'vine'` | Corner botanical ornaments |
 * | `glow` | `boolean \| 'subtle' \| 'strong'` | `'subtle'` | Outer rarity radiance |
 * | `surface` | `'parchment' \| 'velvet' \| 'none'` | `'parchment'` | Interior fill texture |
 */

import React, { useState } from 'react';
import {
  CornerVineOrnamentSvg,
  getOrnamentAsset,
  RARITY_GEM_COLORS,
  RarityGemSvg,
  type OrnateRarity,
} from './ornateAssets';

export interface OrnateFrameProps {
  variant?: 'card' | 'button' | 'pill';
  rarity?: OrnateRarity;
  corners?: 'vine' | 'filigree' | 'none';
  glow?: boolean | 'subtle' | 'strong';
  surface?: 'parchment' | 'velvet' | 'none';
  showSideGems?: boolean;
  className?: string;
  innerClassName?: string;
  children?: React.ReactNode;
}

export const OrnateFrame: React.FC<OrnateFrameProps> = ({
  variant = 'card',
  rarity = 'uncommon',
  corners = 'vine',
  glow = 'subtle',
  surface = 'parchment',
  showSideGems = false,
  className = '',
  innerClassName = '',
  children,
}) => {
  const [cornerRasterFailed, setCornerRasterFailed] = useState(false);
  const cornerAsset = getOrnamentAsset('cornerVineGold');
  const rarityPalette = RARITY_GEM_COLORS[rarity] ?? RARITY_GEM_COLORS.uncommon;

  const glowShadow =
    glow === false
      ? '0 14px 32px rgba(4, 2, 8, 0.78), 0 4px 10px rgba(0, 0, 0, 0.65)'
      : glow === 'strong' || glow === true
        ? `0 18px 40px rgba(4, 2, 8, 0.85), 0 0 28px ${rarityPalette.glow}, inset 0 1px 0 rgba(255, 248, 214, 0.8)`
        : `0 16px 34px rgba(4, 2, 8, 0.8), 0 0 16px ${rarityPalette.glow}, inset 0 1px 0 rgba(255, 248, 214, 0.7)`;

  const radiusOuter =
    variant === 'pill'
      ? 'rounded-full p-[2px]'
      : variant === 'button'
        ? 'rounded-[14px] p-[2.5px]'
        : 'rounded-[18px] p-[4px] sm:p-[5px]';

  const radiusInner =
    variant === 'pill'
      ? 'rounded-full'
      : variant === 'button'
        ? 'rounded-[11.5px]'
        : 'rounded-[13px]';

  const surfaceClasses =
    surface === 'parchment'
      ? 'ornate-parchment-surface border-[2px] border-[#3d2610]'
      : surface === 'velvet'
        ? 'bg-gradient-to-b from-[#2b1c34] via-[#1c1224] to-[#120b18] text-[#fdf8eb] border-[2px] border-[#6e4b1f]'
        : '';

  return (
    <div
      data-ornate-frame={variant}
      data-ornate-rarity={rarity}
      style={{
        background: 'var(--ornate-gold-border-gradient)',
        boxShadow: glowShadow,
      }}
      className={`relative border border-[#fff1b0] select-none ${radiusOuter} ${className}`}
    >
      {/* Inner etched metallic bevel line */}
      <div
        className={`relative w-full h-full flex flex-col ${radiusInner} ${surfaceClasses} ${innerClassName}`}
      >
        {children}
      </div>

      {/* 4-Corner Leafy Gold Vine Ornaments */}
      {corners !== 'none' && variant === 'card' && (
        <>
          {(['tl', 'tr', 'bl', 'br'] as const).map((pos) => {
            const posClasses =
              pos === 'tl'
                ? '-top-1.5 -left-1.5'
                : pos === 'tr'
                  ? '-top-1.5 -right-1.5'
                  : pos === 'bl'
                    ? '-bottom-1.5 -left-1.5'
                    : '-bottom-1.5 -right-1.5';
            const flipClasses =
              pos === 'tr'
                ? '-scale-x-100'
                : pos === 'bl'
                  ? '-scale-y-100'
                  : pos === 'br'
                    ? '-scale-x-100 -scale-y-100'
                    : '';

            return (
              <div
                key={pos}
                aria-hidden="true"
                className={`pointer-events-none absolute z-20 w-7 h-7 sm:w-8 sm:h-8 ${posClasses}`}
              >
                {!cornerRasterFailed && corners === 'vine' ? (
                  <img
                    src={cornerAsset.webpPath}
                    alt=""
                    loading="lazy"
                    width={32}
                    height={32}
                    onError={() => setCornerRasterFailed(true)}
                    className={`w-full h-full object-contain drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)] ${flipClasses}`}
                  />
                ) : (
                  <CornerVineOrnamentSvg
                    position={pos}
                    rarity={rarity}
                    className="w-full h-full drop-shadow-[0_2px_4px_rgba(0,0,0,0.65)]"
                  />
                )}
              </div>
            );
          })}
        </>
      )}

      {/* Optional Mid-Edge Rarity Gems */}
      {showSideGems && variant === 'card' && (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-2 left-1/2 -translate-x-1/2 z-20 drop-shadow-[0_2px_4px_rgba(0,0,0,0.75)]"
          >
            <RarityGemSvg rarity={rarity} className="w-3.5 h-3.5" />
          </span>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-2 left-1/2 -translate-x-1/2 z-20 drop-shadow-[0_2px_4px_rgba(0,0,0,0.75)]"
          >
            <RarityGemSvg rarity={rarity} className="w-3.5 h-3.5" />
          </span>
        </>
      )}
    </div>
  );
};

export default OrnateFrame;
