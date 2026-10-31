import React from 'react';
import type { TrinketRelicArtProps } from './types';
import { TrinketBacklightAura } from './TrinketBacklightAura';
import { TrinketAscendedHalo } from './TrinketAscendedHalo';
import { TrinketEvolutionOverlay } from './TrinketEvolutionOverlay';

export type Props = TrinketRelicArtProps;

/**
 * Renders the painted RPG relic image for each Trinket across:
 * - Level 0 (Locked: shadowed obsidian silhouette `/assets/trinkets/${id}_locked.png`)
 * - Level 1 (Base crafted relic `/assets/trinkets/${id}_lv1.png`)
 * - Level 2 (Awakened relic `/assets/trinkets/${id}_lv2.png` + runic/gem upgrades)
 * - Level 3 (Ascended Masterwork `/assets/trinkets/${id}_lv3.png` + halo, royal crests & floating crystals)
 *
 * Implements Composite and Strategy design patterns to separate background auras,
 * ascended masterwork halos, relic image styling, and level evolution overlays.
 */
export const TrinketRelicArt: React.FC<TrinketRelicArtProps> = ({
  trinketId,
  level,
  className = 'w-full h-full',
}) => {
  const isLocked = level === 0;
  const uid = `${trinketId}-lv${level}`;
  const imageSrc = `/assets/trinkets/${trinketId}_${isLocked ? 'locked' : `lv${level}`}.png`;

  const imageTransformClass = isLocked
    ? 'brightness-90 contrast-110 opacity-90 drop-shadow-[0_6px_10px_rgba(0,0,0,0.92)]'
    : level === 3
      ? 'scale-[1.05] drop-shadow-[0_6px_12px_rgba(0,0,0,0.9)] drop-shadow-[0_0_12px_rgba(245,203,92,0.38)]'
      : level === 2
        ? 'scale-[1.02] drop-shadow-[0_6px_12px_rgba(0,0,0,0.9)] drop-shadow-[0_0_8px_rgba(232,182,74,0.26)]'
        : 'drop-shadow-[0_6px_12px_rgba(0,0,0,0.9)]';

  return (
    <div
      data-testid={`trinket-art-${trinketId}-lv${level}`}
      className={`relative flex items-center justify-center select-none ${className}`}
    >
      {/* Radial Backlight Aura behind the Relic */}
      <TrinketBacklightAura trinketId={trinketId} level={level} />

      {/* Level 3 Ascended Masterwork Golden Halo Ring Behind Relic */}
      {level === 3 && <TrinketAscendedHalo uid={uid} />}

      {/* High-Resolution Painted Relic Image for Locked / Lv1 / Lv2 / Lv3 */}
      <img
        src={imageSrc}
        alt={`${trinketId} ${isLocked ? 'locked' : `level ${level}`}`}
        draggable={false}
        className={`relative z-10 w-[124px] h-[134px] object-contain transition-all duration-300 ${imageTransformClass}`}
      />

      {/* Level-Specific RPG Evolution Overlay (Lv 2 Awakened & Lv 3 Masterwork) */}
      <TrinketEvolutionOverlay trinketId={trinketId} level={level} uid={uid} />
    </div>
  );
};

export default TrinketRelicArt;
