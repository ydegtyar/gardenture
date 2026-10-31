import type { PowerUpDef, PowerUpId } from '../content/schema/types';

export const POWER_UPS: Record<PowerUpId, PowerUpDef> = {
  shield: {
    id: 'shield',
    name: 'Aegis Orb',
    shortDesc: 'Absorbs next 40 damage for 20 s',
    durationSec: 20,
    color: '#4FD1B5',
  },
  freeze: {
    id: 'freeze',
    name: 'Frost Flask',
    shortDesc: 'Freezes all enemies in view for 3.5 s',
    durationSec: 3.5,
    color: '#6FA8FF',
  },
  fire_breath: {
    id: 'fire_breath',
    name: 'Ember Guard',
    shortDesc: 'Grants a temporary 3.0 s flame barrier & blazing fire cone',
    durationSec: 3.0,
    color: '#FF8A3D',
  },
  magnet: {
    id: 'magnet',
    name: 'Clover Magnet',
    shortDesc: 'Pulls every gem & drop on the map',
    durationSec: 0.5,
    color: '#FF5C8A',
  },
  time_slow: {
    id: 'time_slow',
    name: 'Sundial Watch',
    shortDesc: 'Slows enemies, charges & projectiles by 80% for 4 s',
    durationSec: 4.0,
    color: '#B9A6FF',
  },
  heal_potion: {
    id: 'heal_potion',
    name: 'Heal +20HP',
    shortDesc: 'Restores +20 HP over 4 pulses of +5 HP each with a brief delay',
    durationSec: 1.05,
    color: '#2ECC8F',
  },
};
