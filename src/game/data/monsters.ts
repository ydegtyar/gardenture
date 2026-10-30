/**
 * Monster Power-Up Drop Registry for the Bestiary Codex
 * Links Bestiary monster entries (SpriteKey) to their tactical arena power-up drops
 * and provides reverse-lookup helpers for Power-Up Codex cards.
 */

import type { SpriteKey } from '../../view/SpriteAtlas';
import { type AnyPowerUpId, type PowerUpId, toPowerUpId } from './powerups';

export interface MonsterDef {
  id: SpriteKey;
  name: string;
  shortName: string;
  drops: PowerUpId[];
}

export const MONSTERS: Record<string, MonsterDef> = {
  enemy_chaser_norm: {
    id: 'enemy_chaser_norm',
    name: 'Chaser · Thorn-Vine Swarmer (6.1)',
    shortName: 'Thorn-Vine Swarmer',
    drops: ['clover-magnet', 'heal-20hp'],
  },
  enemy_dasher_norm: {
    id: 'enemy_dasher_norm',
    name: 'Dasher · Briar Charger (6.2)',
    shortName: 'Briar Charger',
    drops: ['ember-guard', 'sundial-watch'],
  },
  enemy_spitter_norm: {
    id: 'enemy_spitter_norm',
    name: 'Spitter · Spore Pitcher (6.3)',
    shortName: 'Spore Pitcher',
    drops: ['frost-flask', 'clover-magnet'],
  },
  enemy_brute_norm: {
    id: 'enemy_brute_norm',
    name: 'Brute · Moss Golem (6.4)',
    shortName: 'Moss Golem',
    drops: ['aegis-orb', 'heal-20hp'],
  },
  enemy_splitter_norm: {
    id: 'enemy_splitter_norm',
    name: 'Splitter · Bulb Mitotic (6.5)',
    shortName: 'Bulb Mitotic',
    drops: ['frost-flask', 'clover-magnet'],
  },
  enemy_shielded_norm: {
    id: 'enemy_shielded_norm',
    name: 'Shielded · Bark Sentinel (6.6)',
    shortName: 'Bark Sentinel',
    drops: ['aegis-orb', 'sundial-watch'],
  },
  special_golden_beast: {
    id: 'special_golden_beast',
    name: 'Golden Beast · Special (6.8)',
    shortName: 'Golden Wheat Fox',
    drops: ['clover-magnet', 'sundial-watch'],
  },
  special_bloom_giant: {
    id: 'special_bloom_giant',
    name: 'Bloom Giant · Special (6.9)',
    shortName: 'Sunflower Colossus',
    drops: ['aegis-orb', 'ember-guard', 'sundial-watch'],
  },
  special_brood_mother: {
    id: 'special_brood_mother',
    name: 'Brood Mother · Special (6.10)',
    shortName: 'Orchid Brood Queen',
    drops: ['frost-flask', 'heal-20hp'],
  },
  special_mirror_wisp: {
    id: 'special_mirror_wisp',
    name: 'Mirror Wisp · Special (6.11)',
    shortName: 'Dewdrop Mirror Wisp',
    drops: ['frost-flask', 'clover-magnet', 'heal-20hp'],
  },
  boss_moss_colossus: {
    id: 'boss_moss_colossus',
    name: 'Ancient Moss Colossus · Mini-Boss (6.12)',
    shortName: 'Ancient Moss Colossus',
    drops: ['aegis-orb', 'ember-guard', 'heal-20hp'],
  },
  boss_thornheart_p1: {
    id: 'boss_thornheart_p1',
    name: 'Primordial Thornheart · Phase 1 (6.13)',
    shortName: 'Primordial Thornheart',
    drops: ['aegis-orb', 'heal-20hp'],
  },
  boss_thornheart_p2: {
    id: 'boss_thornheart_p2',
    name: 'Frenzied Bloom · Phase 2 (6.14)',
    shortName: 'Frenzied Bloom',
    drops: ['frost-flask', 'sundial-watch'],
  },
  boss_thornheart_p3: {
    id: 'boss_thornheart_p3',
    name: 'Apex Briar Overlord · Phase 3 (6.15)',
    shortName: 'Apex Briar Overlord',
    drops: ['ember-guard', 'aegis-orb', 'heal-20hp'],
  },
};

export function getMonsterDrops(monsterId: string): PowerUpId[] {
  return MONSTERS[monsterId]?.drops ?? [];
}

export function getMonstersDroppingPowerUp(powerUpId: AnyPowerUpId): MonsterDef[] {
  const canonicalId = toPowerUpId(powerUpId);
  return Object.values(MONSTERS).filter((m) => m.drops.includes(canonicalId));
}
