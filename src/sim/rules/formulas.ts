/**
 * Core Gameplay Formulas: Damage, Stat Stacking, Time Scaling, Style Rank & Payouts
 * Layer 3 (sim): Pure deterministic rules from Core Gameplay Systems Specification Sections 6, 8, 13.
 */

import { clamp } from '../../core/math/vec2';
import { CARDS, PROFESSIONS, STYLE_RANKS } from '../../content/data/catalog';
import type { ProfessionId } from '../../content/schema/types';

export interface ComputedHeroStats {
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
  xpGainMult: number;
  enemySpeedMult: number;
  damageTakenMult: number;
  extraDashCharges: number;
}

/**
 * Computes hero stats using the universal stacking rule:
 * Stat = Base * (1 + sum(Additive)) * prod(Multiplicative), clamped to safety limits [F].
 */
export function computeHeroStats(
  professionId: ProfessionId,
  ownedCards: Record<string, number>,
  equippedTrinkets: readonly string[],
  activeCurses: readonly string[]
): ComputedHeroStats {
  const prof = PROFESSIONS[professionId] ?? PROFESSIONS.warden!;
  const base = prof.baseStats;

  let maxHpFlat = 0;
  let regenAdd = 0;
  let armorFlat = 0;
  let moveSpeedAdd = 0;
  let damageAdd = 0;
  let attackSpeedAdd = 0;
  let areaAdd = 0;
  let reachAdd = 0;
  let critChanceAdd = 0;
  let critDamageAdd = 0;
  let pickupRadiusAdd = 0;
  let luckFlat = 0;
  let dashCooldownDelta = 0;
  let xpGainAdd = 0;
  let enemySpeedAdd = 0;
  let damageTakenMult = 1.0;
  let extraDashCharges = 0;

  for (const card of CARDS) {
    const level = ownedCards[card.id] ?? 0;
    if (level <= 0) continue;

    if (card.id === 'double_dash') {
      extraDashCharges += level;
    }

    const b = card.statBonusesPerLevel;
    if (!b) continue;
    if (b.maxHpFlat) maxHpFlat += b.maxHpFlat * level;
    if (b.regenAdd) regenAdd += b.regenAdd * level;
    if (b.armorFlat) armorFlat += b.armorFlat * level;
    if (b.moveSpeedAdd) moveSpeedAdd += b.moveSpeedAdd * level;
    if (b.damageAdd) damageAdd += b.damageAdd * level;
    if (b.attackSpeedAdd) attackSpeedAdd += b.attackSpeedAdd * level;
    if (b.areaAdd) areaAdd += b.areaAdd * level;
    if (b.reachAdd) reachAdd += b.reachAdd * level;
    if (b.critChanceAdd) critChanceAdd += b.critChanceAdd * level;
    if (b.critDamageAdd) critDamageAdd += b.critDamageAdd * level;
    if (b.pickupRadiusAdd) pickupRadiusAdd += b.pickupRadiusAdd * level;
    if (b.luckFlat) luckFlat += b.luckFlat * level;
    if (b.dashCooldownDelta) dashCooldownDelta += b.dashCooldownDelta * level;
    if (b.xpGainAdd) xpGainAdd += b.xpGainAdd * level;
    if (b.enemySpeedAdd) enemySpeedAdd += b.enemySpeedAdd * level;
    if (b.damageTakenMult) damageTakenMult *= 1 + b.damageTakenMult * level;
  }

  // Apply Trinkets
  if (equippedTrinkets.includes('aegis_leaf')) {
    maxHpFlat += 10;
  }
  if (equippedTrinkets.includes('clover_charm')) {
    luckFlat += 12;
  }
  if (equippedTrinkets.includes('magnet_root')) {
    pickupRadiusAdd += 0.35;
  }
  if (equippedTrinkets.includes('wind_anklet')) {
    moveSpeedAdd += 0.08;
    dashCooldownDelta -= 0.25;
  }

  // Apply Curses
  let curseHpMult = 1.0;
  if (activeCurses.includes('frenzied_flora')) {
    enemySpeedAdd += 0.2;
  }
  if (activeCurses.includes('fragile_bark')) {
    curseHpMult = 0.75;
  }

  const maxHp = Math.max(25, Math.round((base.maxHp + maxHpFlat) * curseHpMult));

  return {
    maxHp,
    regenPerSec: Math.max(0, base.regenPerSec + regenAdd),
    armor: Math.max(0, base.armor + armorFlat),
    moveSpeed: clamp(base.moveSpeed * (1 + moveSpeedAdd), 2.0, 6.5),
    damageMult: Math.max(0.2, base.damageMult * (1 + damageAdd)),
    attackSpeedMult: clamp(base.attackSpeedMult * (1 + attackSpeedAdd), 0.4, 3.0),
    areaMult: clamp(base.areaMult * (1 + areaAdd), 0.5, 3.0),
    reachMult: clamp(base.reachMult * (1 + reachAdd), 0.5, 2.5),
    critChance: clamp(base.critChance + critChanceAdd, 0, 1.0),
    critDamage: Math.max(1.2, base.critDamage + critDamageAdd),
    pickupRadius: clamp(base.pickupRadius * (1 + pickupRadiusAdd), 1.0, 6.0),
    luck: Math.max(0, base.luck + luckFlat),
    dashCooldown: clamp(base.dashCooldown + dashCooldownDelta, 0.8, 4.0),
    xpGainMult: Math.max(0.5, 1 + xpGainAdd),
    enemySpeedMult: Math.max(0.5, 1 + enemySpeedAdd),
    damageTakenMult,
    extraDashCharges,
  };
}

/**
 * Exact Per-Hit Damage Formula (Spec Section 6):
 * D = ceil(B * (1 + sum(A_d)) * prod(M) * C * (1 - R_t)), minimum 1
 */
export function calculateHitDamage(params: {
  baseDamage: number;
  additiveBonusSum: number;
  multiplicativeProduct?: number;
  isCrit: boolean;
  critMultiplier: number;
  targetDamageReduction: number;
}): number {
  const {
    baseDamage,
    additiveBonusSum,
    multiplicativeProduct = 1.0,
    isCrit,
    critMultiplier,
    targetDamageReduction,
  } = params;

  const critFactor = isCrit ? critMultiplier : 1.0;
  const reductionFactor = clamp(1.0 - targetDamageReduction, 0.05, 1.5);
  const raw =
    baseDamage *
    Math.max(0.1, 1.0 + additiveBonusSum) *
    multiplicativeProduct *
    critFactor *
    reductionFactor;

  return Math.max(1, Math.ceil(raw - 1e-9));
}

/**
 * Enemy Time Scaling Formula (Spec Section 8):
 * S(t) = 1 + 0.35 * t_min + 0.04 * t_min^2
 */
export function calculateEnemyTimeScaling(elapsedSeconds: number, difficultyTier = 1): number {
  const tMin = Math.max(0, elapsedSeconds / 60);
  const baseScale = 1 + 0.35 * tMin + 0.04 * tMin * tMin;
  const tierMult = 1 + Math.max(0, difficultyTier - 1) * 0.25;
  return baseScale * tierMult;
}

/**
 * Enemy Speed Time Scaling (Spec Section 8: +4% per minute)
 */
export function calculateEnemySpeedScaling(elapsedSeconds: number): number {
  const tMin = Math.max(0, elapsedSeconds / 60);
  return 1 + 0.04 * tMin;
}

/**
 * Style Rank Transition Step (Spec Section 13):
 * SP in [0, 100]. At >= 100 -> rank up & restart at 30 SP (or clamp at 100 on SSS).
 * At <= 0 -> rank down & restart at 70 SP (or clamp at 0 on D).
 */
export function stepStyleRank(
  rankIndex: number,
  stylePoints: number,
  deltaSp: number
): { rankIndex: number; stylePoints: number; changed: 'up' | 'down' | null } {
  let idx = clamp(rankIndex, 0, STYLE_RANKS.length - 1);
  let sp = stylePoints + deltaSp;
  let changed: 'up' | 'down' | null = null;

  if (sp >= 100) {
    if (idx < STYLE_RANKS.length - 1) {
      idx++;
      sp = 30;
      changed = 'up';
    } else {
      sp = 100;
    }
  } else if (sp <= 0) {
    if (idx > 0) {
      idx--;
      sp = 70;
      changed = 'down';
    } else {
      sp = 0;
    }
  }

  return { rankIndex: idx, stylePoints: sp, changed };
}

/**
 * End-of-Run Coin Payout Formula (Spec Section 13):
 * coins = floor((0.1 * kills + 0.5 * secondsSurvived + bossBonus) * avgCurrencyMult * curseRewardMult)
 */
export function calculateRunCoins(params: {
  kills: number;
  secondsSurvived: number;
  victory: boolean;
  avgCurrencyMult: number;
  curseRewardMult: number;
  hasMagnetRoot: boolean;
}): number {
  const bossBonus = params.victory ? 60 : 0;
  const base = 0.1 * params.kills + 0.5 * params.secondsSurvived + bossBonus;
  const trinketMult = params.hasMagnetRoot ? 1.15 : 1.0;
  return Math.max(
    5,
    Math.floor(base * Math.max(1.0, params.avgCurrencyMult) * params.curseRewardMult * trinketMult)
  );
}
