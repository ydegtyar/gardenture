import React from 'react';
import {
  type AnyPowerUpId,
  type IconSize,
  getPowerUpDef,
  powerUpIcon,
} from '../../game/data/powerups';

export function PowerUpAbilityIcon({
  powerUpId,
  size = 64,
  className = 'w-5 h-5 shrink-0',
}: {
  powerUpId: AnyPowerUpId;
  size?: IconSize;
  className?: string;
}) {
  const def = getPowerUpDef(powerUpId);
  const retinaSize: IconSize = size === 32 ? 64 : size === 64 ? 128 : 256;
  return (
    <img
      src={powerUpIcon(def.id, size)}
      srcSet={`${powerUpIcon(def.id, retinaSize)} 2x`}
      alt={def.name}
      referrerPolicy="no-referrer"
      data-testid={`powerup-icon-${powerUpId}`}
      data-powerup-id={def.id}
      className={`${className} object-contain select-none`}
    />
  );
}
