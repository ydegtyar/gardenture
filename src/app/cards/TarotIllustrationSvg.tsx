import React, { useId } from 'react';
import { CARDS } from '../../content/data/catalog';
import { CARD_ICON_COMPONENTS } from './iconRegistry';
import { TarotGradients } from './TarotGradients';
import { TarotCardFrame } from './TarotCardFrame';
import { getCardSymbol } from './symbols';
import type { GradientIds, TarotIllustrationProps } from './types';

export type Props = TarotIllustrationProps;
export type { TarotIllustrationProps };

/**
 * Renders the bespoke antique Tarot illustration inside an arched esoteric alcove
 * with multi-stop linear and radial gradients depicting each card or weapon.
 *
 * Implements Composite and Template Method design patterns:
 * - Checks CustomIcon registry first (e.g. MagnetMossIcon, LeafBladeIcon).
 * - Assembles TarotGradients defs, decorative TarotCardFrame, and the resolved CardSymbol.
 */
export const TarotIllustrationSvg: React.FC<TarotIllustrationProps> = ({
  targetId,
  rarity,
  accentColor,
  iconColor,
  className = 'w-full h-auto aspect-[180/132] block select-none',
}) => {
  const cardDef = CARDS.find((c) => c.id === targetId);
  const iconKey = cardDef?.iconKey ?? targetId;
  const CustomIcon =
    cardDef?.iconComponent ??
    (iconKey ? CARD_ICON_COMPONENTS[iconKey] : null);

  if (CustomIcon) {
    return (
      <CustomIcon
        size={132}
        className={className}
        glowColor={iconColor ?? cardDef?.iconColor ?? '#3DDC97'}
        title={cardDef?.name ?? 'Magnet Moss'}
      />
    );
  }

  const rawUid = useId().replace(/:/g, '');
  const g: GradientIds = {
    sky: `t-sky-${rawUid}`,
    halo: `t-halo-${rawUid}`,
    gold: `t-gold-${rawUid}`,
    emerald: `t-em-${rawUid}`,
    mint: `t-mint-${rawUid}`,
    rose: `t-rose-${rawUid}`,
    crimson: `t-crim-${rawUid}`,
    cyan: `t-cyan-${rawUid}`,
    violet: `t-vio-${rawUid}`,
    bark: `t-bark-${rawUid}`,
    steel: `t-steel-${rawUid}`,
    parchment: `t-parch-${rawUid}`,
  };

  const resolvedColor = accentColor ?? iconColor ?? '#88D49E';

  const skyStops: [string, string, string] =
    rarity === 'legendary'
      ? ['#4A2545', '#271432', '#150B1E']
      : rarity === 'rare'
        ? ['#1F3356', '#162038', '#0E1424']
        : rarity === 'uncommon'
          ? ['#1D3E35', '#152A26', '#0D1B18']
          : ['#342539', '#221827', '#150E18'];

  const haloColor =
    rarity === 'legendary'
      ? '#FDE047'
      : rarity === 'rare'
        ? '#93C5FD'
        : rarity === 'uncommon'
          ? '#6EE7B7'
          : resolvedColor;

  const SymbolComponent = getCardSymbol(targetId);

  return (
    <svg
      viewBox="0 0 180 132"
      className={className}
      aria-hidden="true"
    >
      <TarotGradients gradients={g} skyStops={skyStops} haloColor={haloColor} />
      <TarotCardFrame gradients={g} haloColor={haloColor}>
        <SymbolComponent gradients={g} />
      </TarotCardFrame>
    </svg>
  );
};

export default TarotIllustrationSvg;
