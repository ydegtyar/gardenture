/**
 * Single Source of Truth Registry for Tactical Arena Power-Up Drops
 * Reused across the In-Run HUD, In-World PixiJS Pickup Drops, and the Bestiary Codex.
 */

export type PowerUpId =
  | 'aegis-orb'
  | 'frost-flask'
  | 'ember-guard'
  | 'clover-magnet'
  | 'sundial-watch'
  | 'heal-20hp';

export type SimPowerUpId =
  | 'shield'
  | 'freeze'
  | 'fire_breath'
  | 'magnet'
  | 'time_slow'
  | 'heal_potion';

export type AnyPowerUpId = PowerUpId | SimPowerUpId;

export interface PowerUpDef {
  id: PowerUpId;
  simId: SimPowerUpId;
  name: string;
  durationSec: number;
  description: string;
  accent: string; // UI border, timer ring, pickup glow
  tint: number; // hex number for Pixi/Phaser/Canvas particle tint
  /** Spritesheet frame or base path (no size suffix, no extension) */
  frame: string;
}

export const POWERUPS: Record<PowerUpId, PowerUpDef> = {
  'aegis-orb': {
    id: 'aegis-orb',
    simId: 'shield',
    name: 'Aegis Orb',
    durationSec: 20,
    description: 'Absorbs next 40 damage for 20s',
    accent: '#4FD1B5',
    tint: 0x4fd1b5,
    frame: 'aegis-orb',
  },
  'frost-flask': {
    id: 'frost-flask',
    simId: 'freeze',
    name: 'Frost Flask',
    durationSec: 3.5,
    description: 'Freezes all enemies in view for 3.5s',
    accent: '#6FA8FF',
    tint: 0x6fa8ff,
    frame: 'frost-flask',
  },
  'ember-guard': {
    id: 'ember-guard',
    simId: 'fire_breath',
    name: 'Ember Guard',
    durationSec: 3,
    description: 'Grants a temporary 3.0s flame barrier & blazing fire cone',
    accent: '#FF8A3D',
    tint: 0xff8a3d,
    frame: 'ember-guard',
  },
  'clover-magnet': {
    id: 'clover-magnet',
    simId: 'magnet',
    name: 'Clover Magnet',
    durationSec: 0.5,
    description: 'Pulls every gem & drop on the map',
    accent: '#FF5C8A',
    tint: 0xff5c8a,
    frame: 'clover-magnet',
  },
  'sundial-watch': {
    id: 'sundial-watch',
    simId: 'time_slow',
    name: 'Sundial Watch',
    durationSec: 4,
    description: 'Slows enemies, charges & enemy projectiles by 80% for 4s (stacks duration)',
    accent: '#B9A6FF',
    tint: 0xb9a6ff,
    frame: 'sundial-watch',
  },
  'heal-20hp': {
    id: 'heal-20hp',
    simId: 'heal_potion',
    name: 'Heal +20HP',
    durationSec: 1.05,
    description: 'Restores +20 HP over 4 pulses of +5 HP each with a brief delay',
    accent: '#2ECC8F',
    tint: 0x2ecc8f,
    frame: 'heal-20hp',
  },
};

export const POWERUP_LIST: readonly PowerUpDef[] = [
  POWERUPS['aegis-orb'],
  POWERUPS['frost-flask'],
  POWERUPS['ember-guard'],
  POWERUPS['clover-magnet'],
  POWERUPS['sundial-watch'],
  POWERUPS['heal-20hp'],
];

export const SIM_TO_POWERUP_ID: Record<SimPowerUpId, PowerUpId> = {
  shield: 'aegis-orb',
  freeze: 'frost-flask',
  fire_breath: 'ember-guard',
  magnet: 'clover-magnet',
  time_slow: 'sundial-watch',
  heal_potion: 'heal-20hp',
};

export const POWERUP_TO_SIM_ID: Record<PowerUpId, SimPowerUpId> = {
  'aegis-orb': 'shield',
  'frost-flask': 'freeze',
  'ember-guard': 'fire_breath',
  'clover-magnet': 'magnet',
  'sundial-watch': 'time_slow',
  'heal-20hp': 'heal_potion',
};

export function toPowerUpId(id: AnyPowerUpId): PowerUpId {
  if (id in POWERUPS) {
    return id as PowerUpId;
  }
  return SIM_TO_POWERUP_ID[id as SimPowerUpId] ?? 'aegis-orb';
}

export function toSimPowerUpId(id: AnyPowerUpId): SimPowerUpId {
  if (id in SIM_TO_POWERUP_ID) {
    return id as SimPowerUpId;
  }
  return POWERUP_TO_SIM_ID[id as PowerUpId] ?? 'shield';
}

export function getPowerUpDef(id: AnyPowerUpId): PowerUpDef {
  return POWERUPS[toPowerUpId(id)];
}

export type IconSize = 32 | 64 | 128 | 256;

export const powerUpIcon = (id: AnyPowerUpId, size: IconSize = 64): string =>
  `/assets/powerups/${POWERUPS[toPowerUpId(id)].frame}@${size}.webp`;

export const powerUpIconPng = (id: AnyPowerUpId, size: IconSize = 64): string =>
  `/assets/powerups/${POWERUPS[toPowerUpId(id)].frame}@${size}.png`;
