/**
 * 3-Card Level-Up Drafting System with Pool Filtering, Rarity Weights & Pity Rules
 * Layer 3 (sim): Pure deterministic logic per Core Gameplay Systems Specification Section 10 & 11.
 */

import type { SeededRNG } from '../../core/rng/rng';
import { CARDS, WEAPONS } from '../../content/data/catalog';
import type { CardRarity } from '../../content/schema/types';

export interface DraftOfferItem {
  readonly offerId: string;
  readonly kind: 'card' | 'weapon_new' | 'weapon_upgrade' | 'weapon_evolution';
  readonly targetId: string; // cardId or weaponId
  readonly title: string;
  readonly subtitle: string;
  readonly description: string;
  readonly rarity: CardRarity;
  readonly currentLevel: number;
  readonly nextLevel: number;
  readonly maxLevel: number;
  readonly tags: string[];
  readonly iconColor: string;
}

export interface DraftContext {
  readonly rng: SeededRNG;
  readonly luck: number;
  readonly weapons: ReadonlyArray<{ id: string; level: number; evolved: boolean }>;
  readonly ownedCards: Readonly<Record<string, number>>;
  readonly unlockedWeapons: readonly string[];
  readonly consecutiveAllCommonOffers: number;
  readonly excludeOfferIds?: readonly string[];
}

const MAX_WEAPONS = 3;
const MAX_PASSIVE_CARDS = 6; // Generous passive slots while keeping build identity focused

/**
 * Generates 3 unique card offers obeying slot caps, rarity weights, and Pity Rules:
 * - Pity Rule 1: After 3 offers with no card above Common, guarantee at least 1 Uncommon+.
 * - Pity Rule 2: If no offered card shares a tag with the hero's current weapons, replace one with a tag-matching card.
 */
export function generateCardDraftOffers(ctx: DraftContext): {
  offers: DraftOfferItem[];
  allCommon: boolean;
} {
  const candidates: DraftOfferItem[] = [];
  const heroWeaponTags = new Set<string>();

  for (const w of ctx.weapons) {
    const def = WEAPONS[w.id];
    if (def) {
      for (const t of def.tags) heroWeaponTags.add(t);
    }
  }

  // 1. Check for eligible Weapon Evolutions (Weapon at Lv 8 + required passive owned)
  for (const w of ctx.weapons) {
    const def = WEAPONS[w.id];
    if (!def) continue;
    if (w.level >= 8 && !w.evolved && (ctx.ownedCards[def.evolvedFromPassiveId] ?? 0) > 0) {
      candidates.push({
        offerId: `evo_${w.id}`,
        kind: 'weapon_evolution',
        targetId: w.id,
        title: def.evolvedName,
        subtitle: `Evolution · ${def.name} Lv 8`,
        description: def.evolvedDescription,
        rarity: 'legendary',
        currentLevel: 8,
        nextLevel: 9,
        maxLevel: 9,
        tags: def.tags,
        iconColor: '#FDFFB6',
      });
    } else if (w.level < 8) {
      // Weapon level-up candidate
      const nextLv = w.level + 1;
      candidates.push({
        offerId: `wpn_up_${w.id}`,
        kind: 'weapon_upgrade',
        targetId: w.id,
        title: `${def.name} Lv ${nextLv}`,
        subtitle: `Weapon Upgrade · ${def.shape.toUpperCase()}`,
        description: def.levelUpDescriptions[nextLv - 1] ?? '+20% Damage & Area',
        rarity: nextLv >= 7 ? 'rare' : 'uncommon',
        currentLevel: w.level,
        nextLevel: nextLv,
        maxLevel: 8,
        tags: def.tags,
        iconColor: '#A8E6CF',
      });
    }
  }

  // 2. New Weapon unlocks if slots < MAX_WEAPONS
  if (ctx.weapons.length < MAX_WEAPONS) {
    const ownedWeaponIds = new Set(ctx.weapons.map((w) => w.id));
    for (const wId of ctx.unlockedWeapons) {
      if (ownedWeaponIds.has(wId)) continue;
      const def = WEAPONS[wId];
      if (!def) continue;
      candidates.push({
        offerId: `wpn_new_${wId}`,
        kind: 'weapon_new',
        targetId: wId,
        title: `New: ${def.name}`,
        subtitle: `New Weapon · ${def.shape.toUpperCase()}`,
        description: def.description,
        rarity: 'uncommon',
        currentLevel: 0,
        nextLevel: 1,
        maxLevel: 8,
        tags: def.tags,
        iconColor: '#88D49E',
      });
    }
  }

  // 3. Filter eligible Cards from the 30-card catalog
  const ownedCardCount = Object.keys(ctx.ownedCards).filter((k) => (ctx.ownedCards[k] ?? 0) > 0).length;

  for (const card of CARDS) {
    const currentLv = ctx.ownedCards[card.id] ?? 0;
    if (card.evolvedName && currentLv === card.maxLevel) {
      candidates.push({
        offerId: `evo_card_${card.id}`,
        kind: 'card',
        targetId: card.id,
        title: card.evolvedName,
        subtitle: `Evolution · ${card.name} Lv ${card.maxLevel}`,
        description: card.evolvedDescription ?? card.shortDesc,
        rarity: 'legendary',
        currentLevel: currentLv,
        nextLevel: card.maxLevel + 1,
        maxLevel: card.maxLevel + 1,
        tags: card.tags,
        iconColor: '#FDFFB6',
      });
      continue;
    }
    if (currentLv >= card.maxLevel) continue;
    if (currentLv === 0 && ownedCardCount >= MAX_PASSIVE_CARDS && card.type !== 'stat') {
      continue;
    }
    if (card.requiresTag && !heroWeaponTags.has(card.requiresTag)) {
      continue;
    }

    candidates.push({
      offerId: `card_${card.id}`,
      kind: 'card',
      targetId: card.id,
      title: card.name,
      subtitle: `${card.type.replace('_', ' ').toUpperCase()} · ${card.rarity.toUpperCase()}`,
      description: card.shortDesc,
      rarity: card.rarity,
      currentLevel: currentLv,
      nextLevel: currentLv + 1,
      maxLevel: card.maxLevel,
      tags: card.tags,
      iconColor: card.iconColor,
    });
  }

  // Exclude previously shown cards on reroll if enough candidates remain
  const excludeSet = new Set(ctx.excludeOfferIds ?? []);
  let pool = candidates.filter((c) => !excludeSet.has(c.offerId));
  if (pool.length < 3) {
    pool = [...candidates];
  }

  // Calculate rarity weights adjusted by Luck (Spec Section 10: +1.5% shifted from common per luck point)
  const luckShift = Math.min(45, ctx.luck * 1.5);
  const rarityWeights: Record<CardRarity, number> = {
    common: Math.max(15, 60 - luckShift),
    uncommon: 28 + luckShift * 0.55,
    rare: 10 + luckShift * 0.35,
    legendary: 2 + luckShift * 0.1,
  };

  const picked: DraftOfferItem[] = [];
  const usedIds = new Set<string>();

  const pickWeightedFrom = (subset: DraftOfferItem[]): DraftOfferItem | null => {
    const available = subset.filter((c) => !usedIds.has(c.offerId));
    if (available.length === 0) return null;

    let totalWeight = 0;
    const weights: number[] = [];
    for (const item of available) {
      let w = rarityWeights[item.rarity] ?? 10;
      if (item.kind === 'weapon_evolution') w *= 8;
      else if (item.kind === 'weapon_upgrade') w *= 1.3;
      weights.push(w);
      totalWeight += w;
    }

    let roll = ctx.rng.range(0, totalWeight);
    for (let i = 0; i < available.length; i++) {
      roll -= weights[i]!;
      if (roll <= 0) {
        return available[i]!;
      }
    }
    return available[available.length - 1]!;
  };

  // Guarantee eligible Weapon & Card Evolutions appear in the offer when unlocked (Spec Section 11)
  for (const item of pool) {
    if (
      (item.kind === 'weapon_evolution' || item.offerId.startsWith('evo_card_')) &&
      picked.length < 3
    ) {
      picked.push(item);
      usedIds.add(item.offerId);
    }
  }

  // Pity Rule 1: If 3 consecutive offers were all common, force a slot to be Uncommon+
  if (ctx.consecutiveAllCommonOffers >= 3 && !picked.some((p) => p.rarity !== 'common')) {
    const highRarityPool = pool.filter((c) => c.rarity !== 'common');
    const forced = pickWeightedFrom(highRarityPool);
    if (forced && picked.length < 3) {
      picked.push(forced);
      usedIds.add(forced.offerId);
    }
  }

  while (picked.length < 3 && picked.length < pool.length) {
    const item = pickWeightedFrom(pool);
    if (!item) break;
    picked.push(item);
    usedIds.add(item.offerId);
  }

  // Pity Rule 2: Ensure at least one offered item matches the hero's weapon tags
  const hasTagMatch = picked.some((item) => item.tags.some((t) => heroWeaponTags.has(t)));
  if (!hasTagMatch && picked.length > 0) {
    const tagMatchPool = pool.filter(
      (c) => !usedIds.has(c.offerId) && c.tags.some((t) => heroWeaponTags.has(t))
    );
    const replacement = pickWeightedFrom(tagMatchPool);
    if (replacement) {
      picked[picked.length - 1] = replacement;
    }
  }

  const allCommon = picked.length > 0 && picked.every((p) => p.rarity === 'common');
  return { offers: picked, allCommon };
}
