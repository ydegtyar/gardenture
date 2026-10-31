/**
 * Content Schema Definitions
 * Layer 2 (content): Pure TypeScript interfaces for data tables.
 */

import type React from 'react';

export type ProfessionId = 'warden' | 'seeker' | 'herbalist' | 'stormcaller';
export type WeaponShape = 'arc' | 'line' | 'circle' | 'projectile' | 'orbit' | 'chain';
export type CardType = 'stat' | 'behavior' | 'synergy' | 'risk_reward' | 'weapon' | 'evolution';
export type CardRarity = 'common' | 'uncommon' | 'rare' | 'legendary';
export type EnemyArchetypeId = 'chaser' | 'dasher' | 'spitter' | 'brute' | 'splitter' | 'shielded';
export type SpecialMonsterId = 'golden_beast' | 'bloom_giant' | 'brood_mother' | 'mirror_wisp';
export type PowerUpId = 'shield' | 'freeze' | 'fire_breath' | 'magnet' | 'time_slow' | 'heal_potion';

export type PersonaStepEffectKind =
  | 'zagreus_fire_step'
  | 'void_soul_step'
  | 'alchemy_rune_step'
  | 'godspeed_lightning_step';

export interface PersonaDef {
  id: string;
  professionId: ProfessionId;
  name: string;
  subtitle: string;
  popCultureMashup: string;
  permanentVfxLabel: string;
  permanentVfxDescription: string;
  stepEffectKind: PersonaStepEffectKind;
  eyeLeftColor: number;
  eyeRightColor: number;
  bodyColor: number;
  cloakColor: number;
  accentColor: number;
  unlockCostSeeds: number;
  adPipsRequired: number;
}

export interface ProfessionDef {
  id: ProfessionId;
  name: string;
  roleLabel: string;
  description: string;
  startingWeaponId: string;
  dashName: string;
  dashDescription: string;
  passiveName: string;
  passiveDescription: string;
  baseStats: {
    maxHp: number;
    regenPerSec: number;
    armor: number;
    moveSpeed: number;
    damageMult: number;
    attackSpeedMult: number;
    areaMult: number;
    reachMult: number;
    critChance: number;
    critDamage: number;
    pickupRadius: number;
    luck: number;
    dashCooldown: number;
  };
  preferredTags: string[];
  unlockCostCoins: number;
  primaryColor: number;
  accentColor: number;
}

export interface WeaponDef {
  id: string;
  name: string;
  evolvedName: string;
  evolvedFromPassiveId: string;
  evolvedDescription: string;
  shape: WeaponShape;
  description: string;
  baseDamage: number;
  baseCooldown: number;
  baseReach: number;
  baseArcDeg?: number;
  baseWidth?: number;
  baseRadius?: number;
  baseProjSpeed?: number;
  basePierce?: number;
  baseCount?: number;
  baseKnockback: number;
  delaySec?: number;
  tags: string[];
  color: number;
  evolvedColor: number;
  levelUpDescriptions: string[];
}

export interface CardDef {
  id: string;
  name: string;
  evolvedName?: string;
  evolvedDescription?: string;
  type: 'stat' | 'behavior' | 'synergy' | 'risk_reward';
  rarity: CardRarity;
  maxLevel: number;
  tags: string[];
  requiresTag?: string;
  requiresWeaponId?: string;
  requiresCardId?: string;
  shortDesc: string;
  iconColor: string;
  iconKey?: string;
  iconComponent?: React.ComponentType<{
    size?: number;
    className?: string;
    glowColor?: string;
    title?: string;
  }>;
  statBonusesPerLevel?: {
    damageAdd?: number;
    attackSpeedAdd?: number;
    areaAdd?: number;
    reachAdd?: number;
    moveSpeedAdd?: number;
    maxHpFlat?: number;
    healInstant?: number;
    pickupRadiusAdd?: number;
    luckFlat?: number;
    critChanceAdd?: number;
    critDamageAdd?: number;
    armorFlat?: number;
    regenAdd?: number;
    dashCooldownDelta?: number;
    xpGainAdd?: number;
    enemySpeedAdd?: number;
    damageTakenMult?: number;
    dodgeChanceAdd?: number;
  };
}

export interface EnemyArchetypeDef {
  id: EnemyArchetypeId;
  name: string;
  gardenName: string;
  dungeonName: string;
  baseHp: number;
  speed: number;
  contactDamage: number;
  radius: number;
  xpValue: number;
  budgetCost: number;
  killPoints: number;
  knockbackResist: number;
  color: number;
  accentColor: number;
}

export interface SpecialMonsterDef {
  id: SpecialMonsterId;
  name: string;
  baseArchetype: EnemyArchetypeId;
  hpMultiplier: number;
  speedOverride?: number;
  rewardType: 'rare_card' | 'power_up' | 'uncommon_card_gems' | 'power_up_seed';
  color: number;
  description: string;
}

export interface PowerUpDef {
  id: PowerUpId;
  name: string;
  shortDesc: string;
  durationSec: number;
  color: string;
}

export interface WavePhaseDef {
  startSec: number;
  endSec: number;
  budgetPerSec: number;
  activeCap: number;
  allowedArchetypes: EnemyArchetypeId[];
  eliteChance: number;
}

export interface StyleRankDef {
  index: number;
  letter: 'D' | 'C' | 'B' | 'A' | 'S' | 'SS' | 'SSS';
  title: string;
  drainPerSec: number;
  scoreMult: number;
  currencyMult: number;
  colorHex: string;
  colorNum: number;
}

export interface TrinketDef {
  id: string;
  name: string;
  description: string;
  costCoins: number;
  upgradeCostCoinsLv2: number;
  upgradeCostSeedsLv3: number;
  levelDescriptions: readonly [string, string, string];
}

export interface CurseLevelDef {
  level: 1 | 2 | 3;
  description: string;
  nextPreviewText: string;
  rewardBonus: number;
  upgradeCost?: number;
  spawnBudgetMultAdd?: number;
  enemySpeedMultAdd?: number;
  telegraphSpeedMultAdd?: number;
  maxHpMult?: number;
  regenMultiplier?: number;
}

export interface CurseDef {
  id: string;
  name: string;
  description: string;
  art: string;
  rewardMultAdd: number;
  costCoins: number;
  upgradeCostCoinsLv2: number;
  upgradeCostCoinsLv3: number;
  levels: readonly [CurseLevelDef, CurseLevelDef, CurseLevelDef];
}

export type BiomeId =
  | 'garden'
  | 'dungeon'
  | 'sakura_grove'
  | 'sunlit_oasis'
  | 'frostbite_glade'
  | 'crimson_ashlands';

export interface ThemePackDef {
  id: BiomeId;
  name: string;
  subtitle: string;
  groundBaseColor: number;
  groundTileAltColor: number;
  groundDecalColor: number;
  outlineColor: number;
  borderVineColor: number;
}

