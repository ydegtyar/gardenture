/**
 * Headless Node Unit Tests (Pure Logic & 1,000-Tick Determinism Verification)
 * Verifies Core Math/CCD, Seeded PRNG, Damage & Style Rank Formulas, Card Pity Rules,
 * and 1,000-tick Headless Simulation without DOM or PixiJS.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  arcOverlapsCircle,
  ccdSegmentHitsCircle,
  slerpAngle,
  smoothstep,
} from '../core/math/vec2';
import { RNGStreams, hashStringToSeed } from '../core/rng/rng';
import {
  calculateCurseRewardMultiplier,
  calculateEnemyTimeScaling,
  calculateHitDamage,
  computeHeroStats,
  getCurseLevelDef,
  stepStyleRank,
} from './rules/formulas';
import { generateCardDraftOffers } from './systems/cardDraft';
import { Simulation } from './Simulation';
import {
  SaveManager,
  createDefaultSaveData,
  getDailyStreakHighlight,
  reconcileSaveData,
  updateDailyRunStreak,
} from '../meta/SaveManager';
import { createPlatformFacade } from '../platform/Adapters';
import { BALANCE_CONFIG, CARDS, CURSES, PALETTE, PERSONAS, POWER_UPS, WEAPONS, isPersonaRelatedToProfession } from '../content/data/catalog';
import { resolveHeroSpriteKey } from '../view/SpriteAtlas';
import { isDevelopmentProcess, IS_DEV } from '../app/debug/devGate';
import { computeHitenJadeAuraSample } from '../view/renderers/heros/HerbalistFrierenPersonaRenderer';
import { findChainLightningTargets } from './weapons/chainLightning';
import { CHAIN_LIGHTNING_CONFIG } from '../content/data/chainLightningConfig';
import { drawLightningStrikeEffect } from '../view/renderers/weapons/ChainLightningRenderer';
import { drawThornTrailHazard } from '../view/renderers/weapons/ThornTrailRenderer';
import { getGardenBladeTipPosition } from '../view/renderers/heros/weapons';
import {
  getStormcallerHatTipPosition,
  getStormcallerEyePositions,
} from '../view/renderers/heros/StormcallerHeroRenderer';

test('Current Daily Streak consecutive-day tracking (updateDailyRunStreak) & milestone highlight rules', () => {
  // 1. First completed run ever -> 1 Day, streakIncremented = true
  const firstRun = updateDailyRunStreak(0, '', '2026-10-23');
  assert.equal(firstRun.streakDays, 1);
  assert.equal(firstRun.lastPlayedUtcDate, '2026-10-23');
  assert.equal(firstRun.streakIncremented, true);

  const firstHighlight = getDailyStreakHighlight(firstRun.streakDays, firstRun.streakIncremented);
  assert.equal(firstHighlight.isHighlighted, true);
  assert.equal(firstHighlight.isMilestone, false);
  assert.equal(firstHighlight.badgeText, 'NEW');

  // 2. Second completed run on the same UTC day -> stays 1 Day, streakIncremented = false
  const sameDayRun = updateDailyRunStreak(
    firstRun.streakDays,
    firstRun.lastPlayedUtcDate,
    '2026-10-23'
  );
  assert.equal(sameDayRun.streakDays, 1);
  assert.equal(sameDayRun.lastPlayedUtcDate, '2026-10-23');
  assert.equal(sameDayRun.streakIncremented, false);

  const sameDayLowHighlight = getDailyStreakHighlight(
    sameDayRun.streakDays,
    sameDayRun.streakIncremented
  );
  assert.equal(sameDayLowHighlight.isHighlighted, false);
  assert.equal(sameDayLowHighlight.statusLabel, 'Active Today');

  // 3. Completed run on the next consecutive UTC day -> increments to 2 Days
  const nextDayRun = updateDailyRunStreak(
    sameDayRun.streakDays,
    sameDayRun.lastPlayedUtcDate,
    '2026-10-24'
  );
  assert.equal(nextDayRun.streakDays, 2);
  assert.equal(nextDayRun.lastPlayedUtcDate, '2026-10-24');
  assert.equal(nextDayRun.streakIncremented, true);

  // 3b. Reaching Day 3 triggers a Milestone highlight & radiance animation state
  const dayThreeRun = updateDailyRunStreak(
    nextDayRun.streakDays,
    nextDayRun.lastPlayedUtcDate,
    '2026-10-25'
  );
  assert.equal(dayThreeRun.streakDays, 3);
  const milestoneHighlight = getDailyStreakHighlight(
    dayThreeRun.streakDays,
    dayThreeRun.streakIncremented
  );
  assert.equal(milestoneHighlight.isHighlighted, true);
  assert.equal(milestoneHighlight.isMilestone, true);
  assert.equal(milestoneHighlight.isHighStreak, true);
  assert.equal(milestoneHighlight.badgeText, 'MILESTONE');
  assert.equal(milestoneHighlight.statusLabel, '3-Day Milestone!');

  // 3c. Day 4 is a high streak (4 days) even when not a specific milestone number
  const dayFourHighlight = getDailyStreakHighlight(4, false);
  assert.equal(dayFourHighlight.isHighlighted, true);
  assert.equal(dayFourHighlight.isMilestone, false);
  assert.equal(dayFourHighlight.isHighStreak, true);
  assert.equal(dayFourHighlight.badgeText, 'HOT STREAK');

  // 4. Completed run after a multi-day gap -> resets to 1 Day
  const afterGapRun = updateDailyRunStreak(
    dayThreeRun.streakDays,
    dayThreeRun.lastPlayedUtcDate,
    '2026-10-29'
  );
  assert.equal(afterGapRun.streakDays, 1);
  assert.equal(afterGapRun.lastPlayedUtcDate, '2026-10-29');
  assert.equal(afterGapRun.streakIncremented, true);
});

test('Dash invisibility frames (i-frames) grant full contact/projectile immunity and stealth', () => {
  const sim = new Simulation({
    seed: 7777,
    professionId: 'warden',
    startingWeaponId: 'garden_blade',
  });
  const initialHp = sim.currentHp;

  // Spawn a heavy Brute directly on top of the hero and an enemy projectile aimed through the hero
  sim.spawnEnemy('brute', sim.heroX + 0.1, sim.heroY, false);
  sim.projectiles.push({
    id: 9999,
    isEnemy: true,
    x: sim.heroX,
    y: sim.heroY,
    prevX: sim.heroX - 0.5,
    prevY: sim.heroY,
    vx: 4.5,
    vy: 0,
    radius: 0.3,
    damage: 25,
    isCrit: false,
    pierceRemaining: 0,
    lifeTimer: 2.0,
    color: 0xf43f5e,
    weaponTags: [],
    hitEnemyIds: new Set(),
  });

  // Trigger Dash ability -> activates dash invisibility frames (0.32s = ~19 ticks at 60Hz)
  const dashed = sim.requestDash(0);
  assert.equal(dashed, true);
  assert.equal(sim.isHeroDashInvisible(), true);
  assert.ok(sim.dashIframeTimer >= 0.30);

  // Step 12 ticks while inside dash invisibility frames: hero takes 0 damage from overlapping brute or projectile
  for (let i = 0; i < 12; i++) {
    sim.tick();
    assert.equal(sim.isHeroDashInvisible(), true);
    assert.equal(sim.currentHp, initialHp);
  }

  // Step another 10 ticks so the 0.32s dash i-frame window expires cleanly
  for (let i = 0; i < 10; i++) {
    sim.tick();
  }
  assert.equal(sim.isHeroDashInvisible(), false);
});

test('Vector Math, Angle Slerp & Continuous Collision Detection (CCD)', () => {
  assert.equal(smoothstep(8, 56, 8), 0);
  assert.equal(smoothstep(8, 56, 56), 1);

  // Shortest-arc slerp across PI / -PI boundary
  const slerped = slerpAngle(Math.PI - 0.1, -Math.PI + 0.1, 0.5);
  assert.ok(Math.abs(Math.abs(slerped) - Math.PI) < 0.05);

  // Fast projectile tunneling prevention via CCD sweep
  const hit = ccdSegmentHitsCircle(0, 0, 10, 0, 0.25, 5, 0.2, 0.4);
  assert.equal(hit, true);

  const miss = ccdSegmentHitsCircle(0, 0, 10, 0, 0.25, 5, 2.5, 0.4);
  assert.equal(miss, false);

  // Arc overlap test
  const inFrontArc = arcOverlapsCircle(0, 0, 2.0, 0, (110 * Math.PI) / 180, 1.4, 0.2, 0.4);
  assert.equal(inFrontArc, true);

  const behindArc = arcOverlapsCircle(0, 0, 2.0, 0, (110 * Math.PI) / 180, -1.4, 0, 0.4);
  assert.equal(behindArc, false);
});

test('Core Gameplay Systems Spec Section 6 Worked Damage Example & Time Scaling', () => {
  // Worked example from Spec Section 6:
  // Level 3 sword B = 14, +20% additive card, x1.25 multiplicative card -> 14 * 1.2 * 1.25 = 21
  const normalHit = calculateHitDamage({
    baseDamage: 14,
    additiveBonusSum: 0.2,
    multiplicativeProduct: 1.25,
    isCrit: false,
    critMultiplier: 1.5,
    targetDamageReduction: 0,
  });
  assert.equal(normalHit, 21);

  // Crit hit (150%): 21 * 1.5 = 31.5 -> rounded up to 32
  const critHit = calculateHitDamage({
    baseDamage: 14,
    additiveBonusSum: 0.2,
    multiplicativeProduct: 1.25,
    isCrit: true,
    critMultiplier: 1.5,
    targetDamageReduction: 0,
  });
  assert.equal(critHit, 32);

  // Shielded front (50% reduction): 21 * 0.5 = 10.5 -> rounded up to 11
  const shieldedHit = calculateHitDamage({
    baseDamage: 14,
    additiveBonusSum: 0.2,
    multiplicativeProduct: 1.25,
    isCrit: false,
    critMultiplier: 1.5,
    targetDamageReduction: 0.5,
  });
  assert.equal(shieldedHit, 11);

  // Enemy Time Scaling S(t) = 1 + 0.35 * t_min + 0.04 * t_min^2
  assert.ok(Math.abs(calculateEnemyTimeScaling(0) - 1.0) < 1e-6);
  assert.ok(Math.abs(calculateEnemyTimeScaling(120) - 1.86) < 1e-6);
  assert.ok(Math.abs(calculateEnemyTimeScaling(240) - 3.04) < 1e-6);
});

test('Devil May Cry Style Rank Meter Transitions (D to SSS)', () => {
  // Rank up at 100 SP -> restarts at 30 SP in next rank
  const up = stepStyleRank(0, 90, 15);
  assert.equal(up.rankIndex, 1); // C
  assert.equal(up.stylePoints, 30);
  assert.equal(up.changed, 'up');

  // Rank down at 0 SP -> restarts at 70 SP in lower rank
  const down = stepStyleRank(2, 10, -15);
  assert.equal(down.rankIndex, 1); // B -> C
  assert.equal(down.stylePoints, 70);
  assert.equal(down.changed, 'down');

  // Simulation emit on rank up
  const sim = new Simulation({ seed: 42 });
  let rankedUpFired = false;
  let receivedRankIndex = -1;
  sim.events.on('StyleRankChanged', (ev) => {
    if (ev.rankedUp) {
      rankedUpFired = true;
      receivedRankIndex = ev.newRankIndex;
    }
  });
  sim.addStylePoints(120);
  assert.equal(rankedUpFired, true);
  assert.equal(receivedRankIndex, 1);
});

test('3-Card Draft Pity Rules & Weapon Evolutions', () => {
  const streams = new RNGStreams(hashStringToSeed('2026-10-23'));

  // Pity Rule 1: After 3 consecutive all-common offers, next offer guarantees at least 1 Uncommon+
  const pityRes = generateCardDraftOffers({
    rng: streams.cards,
    luck: 0,
    weapons: [{ id: 'garden_blade', level: 2, evolved: false }],
    ownedCards: {},
    unlockedWeapons: ['garden_blade', 'thorn_spear'],
    consecutiveAllCommonOffers: 3,
  });
  assert.equal(pityRes.offers.length, 3);
  assert.equal(
    pityRes.offers.some((o) => o.rarity !== 'common'),
    true
  );

  // Weapon Evolution check: Garden Blade Lv 8 + Sharper Edge owned -> offers Verdant Edge
  const evoRes = generateCardDraftOffers({
    rng: streams.cards,
    luck: 10,
    weapons: [{ id: 'garden_blade', level: 8, evolved: false }],
    ownedCards: { sharper_edge: 1 },
    unlockedWeapons: ['garden_blade'],
    consecutiveAllCommonOffers: 0,
  });
  assert.equal(
    evoRes.offers.some((o) => o.offerId === 'evo_garden_blade'),
    true
  );
});

test('Headless 1,000-Tick Deterministic Simulation & Mid-Run Checkpoint Serialization', () => {
  const seed = 424242;
  const runBot = (s: number): { heroX: number; heroY: number; score: number; kills: number } => {
    const sim = new Simulation({
      seed: s,
      professionId: 'warden',
      startingWeaponId: 'garden_blade',
    });

    for (let tick = 1; tick <= 1000; tick++) {
      // Bot orbits gently and dashes every 180 ticks
      const angle = tick * 0.03;
      sim.setMoveIntent(Math.cos(angle), Math.sin(angle));
      if (tick % 180 === 0) {
        sim.requestDash(angle);
      }
      sim.tick();

      // Auto-pick first card if level-up modal opens so simulation continues
      if (sim.pendingCardOffers.length > 0) {
        sim.applyCardOffer(sim.pendingCardOffers[0]!.offerId);
      }
    }

    return {
      heroX: sim.heroX,
      heroY: sim.heroY,
      score: sim.score,
      kills: sim.kills,
    };
  };

  const resA = runBot(seed);
  const resB = runBot(seed);

  // Must be 100% bit-for-bit deterministic across identical seeds
  assert.equal(resA.heroX, resB.heroX);
  assert.equal(resA.heroY, resB.heroY);
  assert.equal(resA.score, resB.score);
  assert.equal(resA.kills, resB.kills);
  assert.ok(resA.kills > 0, 'Bot should defeat enemies during 1,000 ticks');

  // Verify checkpoint serialization & restoration
  const simOrig = new Simulation({ seed: 999, professionId: 'stormcaller' });
  for (let i = 0; i < 120; i++) simOrig.tick();
  const cp = simOrig.serializeCheckpoint();
  const restored = Simulation.fromCheckpoint(cp, ['chain_lightning']);
  assert.equal(restored.elapsedTicks, simOrig.elapsedTicks);
  assert.equal(restored.professionId, 'stormcaller');

  // Compute stats sanity check
  const stats = computeHeroStats('warden', { sharper_edge: 2 }, ['aegis_leaf'], []);
  assert.equal(stats.maxHp, 110);
});

test('Storm Mark Debuff & Card-Scaling Lightning Detonation', () => {
  const sim = new Simulation({ seed: 1234, startingWeaponId: 'chain_lightning' });

  // Spawn an enemy
  const enemy = sim.spawnEnemy('brute', 2.0, 0, false);
  assert.ok(enemy);
  assert.equal(enemy.stormMarkTimer, 0);

  // Attack 1: Struck with lightning -> applies storm mark debuff (stormMarkTimer = 5.0)
  (sim as any).applyDamageToEnemy(enemy, 15, false, 0, ['lightning', 'area']);
  assert.ok(enemy.stormMarkTimer > 4.5, 'Enemy should be marked with storm mark debuff');

  const hpAfterHit1 = enemy.hp;
  const fxCountBefore = sim.visualEffects.length;

  // Attack 2: Subsequent attack (e.g. basic slash sword attack)
  // Detonates the mark, strikes with overhead lightning, and deals card-scaled bonus damage!
  (sim as any).applyDamageToEnemy(enemy, 10, false, 0, ['slash']);

  assert.equal(enemy.stormMarkTimer, 0, 'Storm mark should be consumed upon next attack');

  // Overhead lightning strike visual effect should be created
  const lightningFx = sim.visualEffects.find((fx) => fx.kind === 'lightning_strike');
  assert.ok(lightningFx, 'Overhead lightning strike effect should be triggered on detonation');
  assert.ok(sim.visualEffects.length > fxCountBefore);

  // Damage with 0 cards: 10 (slash) + 10 (base lightning detonation) = ~20 damage
  const damageDealtWithoutCards = hpAfterHit1 - enemy.hp;
  assert.ok(
    damageDealtWithoutCards >= 19,
    `Expected at least 19 damage dealt, got ${damageDealtWithoutCards}`
  );

  // Now test that detonation damage increases with each card received
  const enemy2 = sim.spawnEnemy('brute', 2.0, 0, false);
  assert.ok(enemy2);

  // Mark enemy2 with lightning
  (sim as any).applyDamageToEnemy(enemy2, 15, false, 0, ['lightning', 'area']);
  assert.ok(enemy2.stormMarkTimer > 4.5);
  const hpEnemy2AfterMark = enemy2.hp;

  // Simulate acquiring 4 cards
  sim.totalCardsReceived = 4;

  (sim as any).applyDamageToEnemy(enemy2, 10, false, 0, ['slash']);
  const damageDealtWithCards = hpEnemy2AfterMark - enemy2.hp;

  // With 4 cards (+32 damage), detonation damage is significantly higher
  assert.ok(
    damageDealtWithCards > damageDealtWithoutCards,
    `Damage with cards (${damageDealtWithCards}) must exceed damage without cards (${damageDealtWithoutCards})`
  );
  assert.ok(
    damageDealtWithCards >= damageDealtWithoutCards + 25,
    `Card-scaled damage should scale substantially with 4 cards received`
  );

  // Attack 3: Test that even when the triggering attack is a Critical Hit, overhead lightning strike is NORMAL damage (avoids always crit mechanic)
  const enemy3 = sim.spawnEnemy('brute', 2.0, 0, false)!;
  (sim as any).applyDamageToEnemy(enemy3, 15, false, 0, ['lightning', 'area']);
  assert.ok(enemy3.stormMarkTimer > 4.5);

  const hits: Array<{ damage: number; isCrit: boolean; weaponTag: string }> = [];
  const unsubscribe = sim.events.on('EnemyHit', (ev) => {
    hits.push({ damage: ev.damage, isCrit: ev.isCrit, weaponTag: ev.weaponTag });
  });

  // Trigger detonation with a guaranteed critical attack
  (sim as any).applyDamageToEnemy(enemy3, 10, true, 0, ['slash']);
  unsubscribe();

  const detonationHit = hits.find((h) => h.weaponTag === 'storm_detonation');
  assert.ok(detonationHit, 'Must emit EnemyHit event for storm_detonation');
  assert.equal(
    detonationHit.isCrit,
    false,
    'Overhead lightning strike must be normal damage, not inheriting crit from triggering hit'
  );
});

test('Card choice grants 0.5s silent invisibility without visual invuln/dash timers', () => {
  const sim = new Simulation({ seed: 777 });
  sim.triggerLevelUpCardDraft();
  assert.ok(sim.pendingCardOffers.length > 0);

  const picked = sim.applyCardOffer(sim.pendingCardOffers[0]!.offerId);
  assert.equal(picked, true);
  assert.equal(sim.cardPickInvisTimer, 0.5);
  assert.equal(sim.invulnTimer, 0, 'Should not trigger visible invulnTimer flicker');
  assert.equal(sim.dashIframeTimer, 0, 'Should not trigger visible dashIframeTimer tint');
  assert.equal(sim.isHeroDashInvisible(), true, 'Hero should have full invisibility immunity');

  // Step 29 ticks (< 0.5s at 60Hz) -> still invisible
  for (let i = 0; i < 29; i++) sim.tick();
  assert.equal(sim.isHeroDashInvisible(), true);

  // Step 2 more ticks (> 0.5s total) -> invisibility expires
  sim.tick();
  sim.tick();
  assert.equal(sim.cardPickInvisTimer, 0);
  assert.equal(sim.isHeroDashInvisible(), false);
});

test('Spore Pop applies low-DPS poison status and Bloom Hammer emits sky-fall visual effect', () => {
  const sim = new Simulation({ seed: 2026, startingWeaponId: 'bloom_hammer' });
  sim.cards.spore_pop = 2;

  const target = sim.spawnEnemy('brute', 1.8, 0, false);
  assert.ok(target);
  assert.equal(target.poisonTimer, 0);

  // Trigger Bloom Hammer attack by ticking until weapon swings
  for (let i = 0; i < 15; i++) sim.tick();
  const hammerFx = sim.visualEffects.find((fx) => fx.kind === 'bloom_hammer');
  assert.ok(hammerFx, 'Bloom Hammer should spawn a bloom_hammer sky-fall visual effect');

  // Hit target with spore_proc tag -> should apply poisonTimer = 4.0 and low poisonDps
  (sim as any).applyDamageToEnemy(target, 5, false, 0, ['spore_proc', 'area', 'nature']);
  assert.ok(target.poisonTimer > 3.5, 'Target should be poisoned by Spore Pop');
  assert.ok(target.poisonDps > 0 && target.poisonDps <= 12, 'Poison DPS should be low and positive');

  const hpBeforePoisonTick = target.hp;
  // Advance 35 ticks so the 30-tick poison DOT interval triggers at least once
  for (let i = 0; i < 35; i++) sim.tick();
  assert.ok(target.hp < hpBeforePoisonTick, 'Poison should deal periodic low DPS over time');
});

test('Flick-dash spawns lingering 0.3s motion trail effects behind the player', () => {
  const sim = new Simulation({ seed: 3030, professionId: 'warden' });
  const dashed = sim.requestDash(0);
  assert.equal(dashed, true);

  // Immediately on dash start, an initial dash_ghost node is spawned with maxTimer = 0.3s
  const initialGhost = sim.visualEffects.find((fx) => fx.kind === 'dash_ghost');
  assert.ok(initialGhost, 'Dash should immediately spawn a dash_ghost trail node');
  assert.equal(initialGhost.maxTimer, 0.3);
  assert.equal(initialGhost.timer, 0.3);

  // Step 8 ticks (full 0.14s dash duration) -> multiple trail nodes spawned along dash path
  for (let i = 0; i < 8; i++) sim.tick();
  const ghostsDuringDash = sim.visualEffects.filter((fx) => fx.kind === 'dash_ghost');
  assert.ok(ghostsDuringDash.length >= 4, 'Dash should leave multiple trail nodes behind the player');
  assert.ok(
    ghostsDuringDash.every((g) => Math.abs(g.maxTimer - 0.3) < 1e-6),
    'All dash trail nodes must have a 0.3s fade duration'
  );

  // Step 10 more ticks (~0.30s total since first node) -> initial node expires while later nodes still linger
  for (let i = 0; i < 10; i++) sim.tick();
  const remainingGhosts = sim.visualEffects.filter((fx) => fx.kind === 'dash_ghost');
  assert.ok(remainingGhosts.length > 0, 'Later dash trail nodes should still linger before 0.3s after dash end');

  // Step 12 more ticks -> all 0.3s trail nodes have faded out completely
  for (let i = 0; i < 12; i++) sim.tick();
  assert.equal(
    sim.visualEffects.filter((fx) => fx.kind === 'dash_ghost').length,
    0,
    'All dash motion trail nodes should fade out after 0.3s'
  );
});

test('Collecting a gold coin pickup emits CoinCollected event for golden petal burst and increments bonus coins', () => {
  const sim = new Simulation({ seed: 5050, professionId: 'warden' });
  let coinCollectedPayload: { x: number; y: number; value: number } | null = null;
  sim.events.on('CoinCollected', (ev) => {
    coinCollectedPayload = ev;
  });

  // Place a gold coin directly on the hero's pickup radius
  sim.pickups.push({
    id: 8888,
    kind: 'gold_coin',
    x: sim.heroX + 0.15,
    y: sim.heroY,
    value: 3,
    magnetized: false,
    pullSpeed: 0,
  });

  sim.tick();
  assert.ok(coinCollectedPayload, 'CoinCollected event should fire when player collects a gold_coin');
  assert.equal((coinCollectedPayload as { value: number }).value, 3);
  assert.equal(sim.bonusCoinsCollected, 3);
});

test('Debug menu methods set any card and any weapon to any level and recompute hero stats', () => {
  const sim = new Simulation({ seed: 7070, professionId: 'warden' });
  const baseMaxHp = sim.maxHp;
  const baseDamageMult = sim.stats.damageMult;

  // Choose Sharper Edge at Lv 5 and Hardy Bark at Lv 3
  assert.equal(sim.debugSetCardLevel('sharper_edge', 5), true);
  assert.equal(sim.cards.sharper_edge, 5);
  assert.ok(sim.stats.damageMult > baseDamageMult);

  assert.equal(sim.debugSetCardLevel('hardy_bark', 3), true);
  assert.equal(sim.cards.hardy_bark, 3);
  assert.equal(sim.maxHp, baseMaxHp + 45);
  assert.equal(sim.currentHp, baseMaxHp + 45);
  assert.equal(sim.cardPickInvisTimer, 0.5);

  // Clamp beyond maxLevel (e.g. Greedy Roots maxLevel is 3)
  sim.debugSetCardLevel('greedy_roots', 99);
  assert.equal(sim.cards.greedy_roots, 3);

  // Set card to 0 removes it
  sim.debugSetCardLevel('sharper_edge', 0);
  assert.equal(sim.cards.sharper_edge, undefined);

  // Set any weapon to any level or evolved state
  assert.equal(sim.debugSetWeaponLevel('thorn_spear', 6, false), true);
  const spear = sim.weapons.find((w) => w.id === 'thorn_spear');
  assert.ok(spear);
  assert.equal(spear.level, 6);
  assert.equal(spear.evolved, false);

  assert.equal(sim.debugSetWeaponLevel('bloom_hammer', 8, true), true);
  const hammer = sim.weapons.find((w) => w.id === 'bloom_hammer');
  assert.ok(hammer);
  assert.equal(hammer.level, 8);
  assert.equal(hammer.evolved, true);

  // Turn weapon off
  sim.debugSetWeaponLevel('thorn_spear', 0, false);
  assert.equal(sim.weapons.find((w) => w.id === 'thorn_spear'), undefined);
});

test('Shockwave spawns shockwave_blast on equip, dash arrival, and every 5th hit; Ember Guard has decreased spawn rate and all 5 items drop distinctly', () => {
  const sim = new Simulation({ seed: 9090, professionId: 'warden' });

  // 1. Verify ember_guard is NOT a tarot card in CARDS, and POWER_UPS.fire_breath is 'Ember Guard'
  assert.equal(
    CARDS.some((c) => c.id === 'ember_guard'),
    false,
    'ember_guard must not exist in tarot CARDS catalog'
  );
  assert.equal(POWER_UPS.fire_breath.name, 'Ember Guard');
  assert.equal(sim.debugSetCardLevel('ember_guard', 1), false);

  // Verify Ember Guard does NOT unconditionally spawn in the starting clearing
  const initialEmberGuardDrop = sim.pickups.find(
    (p) => p.kind === 'power_up' && p.powerUpId === 'fire_breath'
  );
  assert.equal(
    initialEmberGuardDrop,
    undefined,
    'Starting clearing must not unconditionally spawn an Ember Guard item'
  );

  // Verify rollPowerUpDrop() has a low spawn rate for fire_breath (<15%) and prevents duplicate spawns when held
  let fireBreathCount = 0;
  const totalRolls = 300;
  for (let i = 0; i < totalRolls; i++) {
    if (sim.rollPowerUpDrop() === 'fire_breath') {
      fireBreathCount++;
    }
  }
  assert.ok(
    fireBreathCount > 0 && fireBreathCount < totalRolls * 0.15,
    `Ember Guard spawn weight should be low (~6%), got ${fireBreathCount}/${totalRolls}`
  );

  // Verify all 5 droppable items can be spawned on the ground with their distinct powerUpId
  for (const id of ['shield', 'freeze', 'fire_breath', 'magnet', 'time_slow'] as const) {
    sim.debugSpawnPowerUpDrop(id);
    assert.ok(
      sim.pickups.some((p) => p.kind === 'power_up' && p.powerUpId === id),
      `Expected droppable item pickup for ${id}`
    );
  }
  sim.pickups.length = 0;

  // 2. Equip Shockwave Lv 3 via debug menu -> immediately spawns a shockwave_blast preview
  assert.equal(sim.debugSetCardLevel('shockwave', 3), true);
  assert.ok(
    sim.visualEffects.some((fx) => fx.kind === 'shockwave_blast'),
    'Equipping shockwave should spawn a shockwave_blast visual effect'
  );

  // Clear visual effects and trigger a dash -> should unleash a shockwave_blast on dash arrival
  sim.visualEffects.length = 0;
  assert.equal(sim.requestDash(0), true);
  for (let i = 0; i < 12; i++) sim.tick();
  assert.ok(
    sim.visualEffects.some((fx) => fx.kind === 'shockwave_blast'),
    'Finishing a dash with Shockwave equipped should unleash a shockwave_blast'
  );

  // 3. Spawn a droppable Ember Guard item, pick it up, and use it via requestUsePowerUp(0)
  sim.debugSpawnPowerUpDrop('fire_breath');
  const dropped = sim.pickups.find(
    (p) => p.kind === 'power_up' && p.powerUpId === 'fire_breath'
  );
  assert.ok(dropped, 'debugSpawnPowerUpDrop should spawn a droppable Ember Guard pickup');
  dropped.x = sim.heroX;
  dropped.y = sim.heroY;
  sim.tick();
  assert.equal(sim.heldPowerUps[0], 'fire_breath', 'Picking up Ember Guard should store it in heldPowerUps[0]');

  // While Ember Guard is already held, rollPowerUpDrop must not roll another fire_breath
  for (let i = 0; i < 50; i++) {
    assert.notEqual(sim.rollPowerUpDrop(), 'fire_breath');
  }

  // Spawn an enemy near the hero and use the Ember Guard item via requestUsePowerUp(0)
  const enemy = sim.spawnEnemy('brute', sim.heroX + 1.2, sim.heroY, false);
  assert.ok(enemy);
  const initialHp = enemy.hp;

  sim.visualEffects.length = 0;
  sim.requestUsePowerUp(0);
  sim.tick();

  assert.equal(sim.heldPowerUps.length, 0, 'Using Ember Guard consumes it from the held slot');
  assert.ok(sim.fireBreathTimer > 2.5, 'Using Ember Guard activates fireBreathTimer');
  assert.ok(
    sim.visualEffects.some((fx) => fx.kind === 'ember_burst'),
    'Using Ember Guard immediately triggers an ember_burst visual effect'
  );
  assert.ok(
    sim.visualEffects.some((fx) => fx.kind === 'fire_cone'),
    'Using Ember Guard immediately triggers a fire_cone visual effect'
  );
  assert.ok(enemy.hp < initialHp, 'Ember Guard item damages nearby enemies');
  assert.ok(enemy.burnTimer > 0, 'Ember Guard item ignites nearby enemies with burn');
});

test('Lucky Clover spawns clover_step trail while moving with intensity scaling from Lv 1 to Lv 5', () => {
  const sim = new Simulation({ seed: 2025, professionId: 'warden' });

  // Equip Lucky Clover Lv 1
  sim.debugSetCardLevel('lucky_clover', 1);
  sim.visualEffects.length = 0;

  // Move hero right for 30 ticks (0.5s -> ~2.0u moved)
  sim.setMoveIntent(1, 0);
  for (let i = 0; i < 30; i++) sim.tick();

  const lv1Steps = sim.visualEffects.filter((fx) => fx.kind === 'clover_step');
  assert.ok(lv1Steps.length >= 2, `Expected Lv 1 Lucky Clover footsteps, got ${lv1Steps.length}`);
  assert.equal(lv1Steps[0]!.arcRad, 1);
  const lv1Radius = lv1Steps[0]!.radius;

  // Equip Lucky Clover Lv 5 -> higher step frequency and larger step radius/duration
  sim.debugSetCardLevel('lucky_clover', 5);
  sim.visualEffects.length = 0;
  for (let i = 0; i < 30; i++) sim.tick();

  const lv5Steps = sim.visualEffects.filter((fx) => fx.kind === 'clover_step');
  assert.ok(
    lv5Steps.length > lv1Steps.length * 2,
    `Expected Lv 5 Lucky Clover to spawn more frequent footsteps than Lv 1 (${lv5Steps.length} vs ${lv1Steps.length})`
  );
  assert.equal(lv5Steps[0]!.arcRad, 5);
  assert.ok(lv5Steps[0]!.radius > lv1Radius, 'Lv 5 clover step radius should exceed Lv 1');
});

test('Hero heal spawns heal_pulse visual effect scaled by heal power, and Regrowth Evolution deals full-HP heal amount to all enemies on map', () => {
  const sim = new Simulation({ seed: 3035, professionId: 'warden' });
  sim.enemies.length = 0;

  // 1. Small heal vs Large heal visual effect scaling
  sim.currentHp = 50;
  sim.visualEffects.length = 0;
  sim.healHero(2);
  const smallHealFx = sim.visualEffects.find((fx) => fx.kind === 'heal_pulse');
  assert.ok(smallHealFx, 'Small heal should spawn a heal_pulse visual effect');
  assert.equal(smallHealFx.arcRad, 2);

  sim.visualEffects.length = 0;
  sim.healHero(25);
  const bigHealFx = sim.visualEffects.find((fx) => fx.kind === 'heal_pulse');
  assert.ok(bigHealFx, 'Big heal should spawn a heal_pulse visual effect');
  assert.equal(bigHealFx.arcRad, 25);
  assert.ok(bigHealFx.radius > smallHealFx.radius, 'Heal effect radius should scale with heal power');
  assert.ok(bigHealFx.maxTimer > smallHealFx.maxTimer, 'Heal effect duration should scale with heal power');

  // 2. Regrowth Evolution (level 6 = Overgrowth Surge):
  // Spawn enemies at far corners of the map
  const e1 = sim.spawnEnemy('brute', 15, 12, false)!;
  const e2 = sim.spawnEnemy('brute', -18, -14, false)!;
  const e1StartHp = e1.hp;
  const e2StartHp = e2.hp;

  // Set Regrowth to Lv 5 (not evolved yet) and heal at full HP -> no damage to enemies
  sim.debugSetCardLevel('regrowth', 5);
  sim.currentHp = sim.maxHp;
  sim.healHero(12);
  assert.equal(e1.hp, e1StartHp, 'Unevolved Regrowth Lv 5 should not damage enemies on heal');

  // Evolve Regrowth (level 6): debugSetCardLevel sets HP to full and triggers a heal of 24
  sim.debugSetCardLevel('regrowth', 6);
  assert.equal(sim.isRegrowthEvolved(), true);
  assert.equal(e1.hp, e1StartHp - 24, 'Regrowth Evolution initial heal at full HP deals exact heal amount (24) to enemy 1');
  assert.equal(e2.hp, e2StartHp - 24, 'Regrowth Evolution initial heal at full HP deals exact heal amount (24) to enemy 2');

  // If hero is NOT fully healed after the heal, it should NOT damage enemies
  const hpAfterFirstNova = e1.hp;
  sim.currentHp = sim.maxHp - 30;
  sim.healHero(10); // currentHp becomes maxHp - 20 (< maxHp)
  assert.equal(e1.hp, hpAfterFirstNova, 'Heal that does not reach full HP should not trigger Overgrowth Surge');

  // When hero IS fully healed, any heal (e.g. healHero(15)) deals exact heal amount (15) to all enemies on map
  sim.currentHp = sim.maxHp;
  sim.healHero(15);
  assert.equal(e1.hp, hpAfterFirstNova - 15, 'Heal at full HP deals exact heal amount (15) to enemy 1');
  assert.equal(e2.hp, hpAfterFirstNova - 15, 'Heal at full HP deals exact heal amount (15) to enemy 2');
});

test('Petal Orbit applies spider-web glue slow debuff (slowTimer & webSlowTimer) to touched enemies', () => {
  const sim = new Simulation({ seed: 4045, professionId: 'warden' });
  sim.weapons = [];
  sim.enemies.length = 0;

  // Equip Petal Orbit Lv 1 (reach = 1.45 * areaMult)
  sim.debugSetWeaponLevel('petal_orbit', 1, false);
  const orbitRadius = 1.45 * sim.stats.areaMult;

  // Place a tough enemy right on the petal orbit ring
  const enemy = sim.spawnEnemy('brute', sim.heroX + orbitRadius, sim.heroY, true)!;
  assert.equal(enemy.slowTimer, 0);
  assert.equal(enemy.webSlowTimer, 0);

  // Tick simulation until an orbiting petal touches the enemy
  for (let i = 0; i < 40; i++) {
    enemy.x = sim.heroX + orbitRadius;
    enemy.y = sim.heroY;
    sim.tick();
    if (enemy.webSlowTimer > 0) break;
  }

  assert.ok(enemy.webSlowTimer > 0, 'Touched enemy should have active webSlowTimer spider-web glue debuff');
  assert.ok(enemy.slowTimer > 0, 'Touched enemy should have active slowTimer movement debuff');
});

test('Arena Limiting: no hard world border, Final Boss thorn circle deals DPS outside arena, and Big Arena Flowers spawn randomly around the world and drop random power-ups', () => {
  const sim = new Simulation({ seed: 5055, professionId: 'warden' });

  // 1. At start of run, 6 Big Arena Flowers are scattered randomly around the world (7.5u..24.0u away, not directly on spawn)
  const startingFlowers = sim.enemies.filter((e) => e.isArenaFlower);
  assert.equal(startingFlowers.length, 6, 'Should scatter 6 Big Arena Flowers around the world at run start');
  assert.ok(startingFlowers[0]!.maxHp >= 150, 'Big Arena Flower should have high HP stats');
  for (const f of startingFlowers) {
    const distFromOrigin = Math.hypot(f.x, f.y);
    assert.ok(
      distFromOrigin >= 7.4 && distFromOrigin <= 24.5,
      `Flower should be scattered randomly around the world (7.5u..24u), got ${distFromOrigin}`
    );
  }

  // 2. Destroying a Big Arena Flower drops a random usable item (power_up)
  sim.pickups.length = 0;
  const flower = startingFlowers[0]!;
  (sim as any).applyDamageToEnemy(flower, flower.hp + 100, false, 0, ['slash']);
  assert.equal(flower.hp, 0, 'Big Arena Flower should be destroyed');
  const powerUpDrop = sim.pickups.find((d) => d.kind === 'power_up');
  assert.ok(powerUpDrop, 'Destroyed Big Arena Flower should drop a random power_up item');
  assert.ok(powerUpDrop.powerUpId, 'Dropped power_up item should have a valid powerUpId');

  // 3. Thorn arena starts active from the beginning of the game at 28.0u and slowly collapses toward Final Boss size (13.5u)
  assert.equal(sim.arenaActive, true, 'Thorn circle arena should be active from the start of the game');
  assert.equal(
    sim.arenaRadiusU,
    Simulation.INITIAL_ARENA_RADIUS_U,
    'Thorn circle arena should start at 28.0u radius'
  );

  // Walking inside the 28.0u initial thorn arena does not trigger outside-arena damage
  sim.heroX = 20.0;
  sim.heroY = 0;
  sim.setMoveIntent(1, 0);
  sim.tick();
  assert.ok(sim.heroX > 20.0, 'Hero can move freely without hard world border');
  assert.equal(sim.isOutsideArena, false, 'Hero at 20u is inside initial 28u thorn arena');

  // 4. Final Boss fight centers the thorn arena with spacious 13.5u radius (and deals DPS outside it)
  sim.heroX = 10.0;
  sim.heroY = 10.0;
  (sim as any).spawnBoss(true);
  assert.equal(sim.arenaActive, true);
  assert.equal(sim.arenaCenterX, 10.0);
  assert.equal(sim.arenaCenterY, 10.0);
  assert.equal(
    sim.arenaRadiusU,
    Simulation.FINAL_BOSS_ARENA_RADIUS_P1_U,
    'Final Boss Phase 1 thorn circle should leave more space (13.5u radius)'
  );

  // Move hero outside the thorn circle (> 13.5u from center)
  sim.heroX = sim.arenaCenterX + 16.0;
  sim.heroY = sim.arenaCenterY;
  sim.currentHp = sim.maxHp;
  const hpBeforeOutside = sim.currentHp;

  // Step 30 ticks (0.5s) outside the thorn circle -> takes continuous thorn bleed DPS
  sim.setMoveIntent(0, 0);
  for (let i = 0; i < 30; i++) sim.tick();
  assert.equal(sim.isOutsideArena, true, 'Hero outside arenaRadiusU should be flagged isOutsideArena');
  assert.ok(sim.currentHp < hpBeforeOutside, 'Hero outside thorn arena should take continuous DPS to HP');
});

test('Seed Blades applies small Venom Poison DPS starting from Level 2', () => {
  const sim = new Simulation({ seed: 6065, professionId: 'warden' });
  sim.weapons = [];
  sim.enemies.length = 0;

  // 1. Seed Blades Level 1 does NOT apply poison
  sim.debugSetWeaponLevel('seed_blades', 1, false);
  const targetLv1 = sim.spawnEnemy('brute', sim.heroX + 2.0, sim.heroY, false)!;
  for (let i = 0; i < 60; i++) {
    targetLv1.x = sim.heroX + 2.0;
    targetLv1.y = sim.heroY;
    sim.tick();
  }
  assert.equal(targetLv1.poisonTimer, 0, 'Seed Blades Lv 1 should not poison enemies');

  // 2. Seed Blades Level 2+ applies Venom Poison DPS (poisonTimer > 0 & poisonDps > 0)
  sim.projectiles.length = 0;
  sim.debugSetWeaponLevel('seed_blades', 2, false);
  const targetLv2 = sim.spawnEnemy('brute', sim.heroX + 2.0, sim.heroY, false)!;
  for (let i = 0; i < 60; i++) {
    targetLv2.x = sim.heroX + 2.0;
    targetLv2.y = sim.heroY;
    sim.tick();
    if (targetLv2.poisonTimer > 0) break;
  }
  assert.ok(targetLv2.poisonTimer > 0, 'Seed Blades Lv 2 should apply poisonTimer to hit enemies');
  assert.ok(targetLv2.poisonDps >= 2, 'Seed Blades Lv 2 should apply positive Venom Poison DPS');

  // Verify poison ticks enemy HP down without incrementing totalHitsDealt or consuming Storm Mark
  const hpAfterHit = targetLv2.hp;
  targetLv2.stormMarkTimer = 4.0;
  const hitsBeforeDot = sim.totalHitsDealt;
  sim.weapons = []; // Stop firing more blades so only poison ticks
  for (let i = 0; i < 35; i++) sim.tick();
  assert.ok(targetLv2.hp < hpAfterHit, 'Venom poison should tick down enemy HP over time');
  assert.equal(sim.totalHitsDealt, hitsBeforeDot, 'Poison DOT ticks should not increment weapon hit counter');
  assert.ok(targetLv2.stormMarkTimer > 3.0, 'Poison DOT ticks should not consume Storm Mark');
});

test('Petal Orbit shared radius/count helpers & Regrowth Evolution card draft offer', () => {
  const sim = new Simulation({ seed: 7075, professionId: 'warden' });
  sim.weapons = [];
  sim.enemies.length = 0;

  // 1. Petal Orbit radius scales at Lv 3 (+18% area) and Lv 6 (+0.35u reach)
  sim.debugSetWeaponLevel('petal_orbit', 1, false);
  const rLv1 = sim.getOrbitRadiusU();
  assert.equal(sim.getOrbitPetalCount(), 2);

  sim.debugSetWeaponLevel('petal_orbit', 3, false);
  const rLv3 = sim.getOrbitRadiusU();
  assert.ok(rLv3 > rLv1, 'Petal Orbit Lv 3 should have a wider orbit radius than Lv 1');

  sim.debugSetWeaponLevel('petal_orbit', 6, false);
  const rLv6 = sim.getOrbitRadiusU();
  assert.ok(rLv6 > rLv3, 'Petal Orbit Lv 6 should have a wider orbit radius than Lv 3');
  assert.equal(sim.getOrbitPetalCount(), 5);

  // 2. Regrowth at Lv 5 unlocks Overgrowth Surge evolution in the level-up Card Draft
  sim.debugSetCardLevel('regrowth', 5);
  const enemy = sim.spawnEnemy('brute', 8.0, 5.0, false)!;
  const enemyHpBefore = enemy.hp;

  sim.triggerLevelUpCardDraft();
  const regrowthEvoOffer = sim.pendingCardOffers.find((o) => o.offerId === 'evo_card_regrowth');
  assert.ok(regrowthEvoOffer, 'Regrowth Lv 5 should offer Overgrowth Surge evolution in card draft');
  assert.equal(regrowthEvoOffer.title, 'Overgrowth Surge');

  // Selecting Overgrowth Surge in the draft evolves Regrowth to Lv 6 and triggers full-HP map damage
  sim.currentHp = sim.maxHp - 10;
  sim.applyCardOffer('evo_card_regrowth');
  assert.equal(sim.isRegrowthEvolved(), true, 'Regrowth should be evolved after picking evo_card_regrowth');
  assert.equal(sim.currentHp, sim.maxHp, 'Picking Overgrowth Surge should restore full HP');
  assert.equal(enemy.hp, enemyHpBefore - 24, 'Picking Overgrowth Surge should deal map-wide surge damage');
});

test('Frost Flask pauses new enemy spawns, Clover Magnet magnetizes gold coins, and Second Wind leaves a Hero Grave that heals +25 HP on destroy', () => {
  const sim = new Simulation({ seed: 8085, professionId: 'warden' });
  sim.enemies.length = 0;
  sim.directorBankedBudget = 20;
  sim.spawnTimer = 0;

  // 1. Frost Flask ('freeze') activates freezeAuraTimer = 3.5 and blocks wave spawns
  sim.debugTriggerPowerUp('freeze');
  assert.equal(sim.freezeAuraTimer, 3.5);
  for (let i = 0; i < 30; i++) sim.tick();
  assert.equal(
    sim.enemies.filter((e) => !e.isArenaFlower).length,
    0,
    'No new wave enemies should spawn while Frost Flask freezeAuraTimer is active'
  );

  // 2. Clover Magnet ('magnet') magnetizes gold_coin pickups alongside XP gems
  sim.pickups.push({
    id: 7771,
    kind: 'gold_coin',
    x: sim.heroX + 12.0,
    y: sim.heroY + 12.0,
    value: 5,
    magnetized: false,
    pullSpeed: 0,
  });
  sim.debugTriggerPowerUp('magnet');
  const coinPickup = sim.pickups.find((p) => p.id === 7771)!;
  assert.equal(coinPickup.magnetized, true, 'Clover Magnet should magnetize gold_coin pickups');
  assert.equal(coinPickup.pullSpeed, 14.0);

  // 3. Second Wind triggers 'second_wind_blast' and leaves a Hero Grave that heals +25 HP when destroyed
  sim.debugSetCardLevel('second_wind', 1);
  sim.invulnTimer = 0;
  sim.cardPickInvisTimer = 0;
  sim.currentHp = 5;
  (sim as any).damageHero(50);

  assert.equal(sim.secondWindUsed, true);
  assert.ok(sim.currentHp > 0, 'Hero should survive lethal damage via Second Wind');
  assert.ok(
    sim.visualEffects.some((fx) => fx.kind === 'second_wind_blast'),
    'Second Wind should spawn a second_wind_blast visual effect'
  );
  const grave = sim.enemies.find((e) => e.isHeroGrave);
  assert.ok(grave, 'Second Wind should leave a stationary destructible Hero Grave');

  // Damage hero slightly so we can verify the +25 HP heal from destroying the grave
  sim.currentHp = 20;
  (sim as any).applyDamageToEnemy(grave, grave.hp + 10, false, 0, ['slash']);
  assert.equal(grave.hp, 0, 'Hero Grave should be destroyed');
  assert.equal(sim.currentHp, 45, 'Destroying the Hero Grave should heal the hero for +25 HP');
});

test('Echo Swing spawns doubled isEcho visual effect, Golden Sunflower uses 3 attack modes, and Death/Victory sequences animate before ending run', () => {
  const sim = new Simulation({ seed: 9095, professionId: 'warden' });
  sim.enemies.length = 0;

  // 1. Echo Swing Lv 3 repeats every 2nd swing with isEcho: true
  sim.debugSetCardLevel('echo_swing', 3);
  sim.cardPickInvisTimer = 0;
  const dummy = sim.spawnEnemy('brute', sim.heroX + 1.5, sim.heroY, false)!;
  dummy.hp = 5000;
  dummy.maxHp = 5000;

  let sawEchoFx = false;
  for (let i = 0; i < 90; i++) {
    dummy.x = sim.heroX + 1.5;
    dummy.y = sim.heroY;
    sim.tick();
    if (sim.visualEffects.some((fx) => fx.isEcho)) {
      sawEchoFx = true;
      break;
    }
  }
  assert.equal(sawEchoFx, true, 'Echo Swing should spawn a doubled visual effect with isEcho = true');

  // 2. Golden Sunflower ('bloom_giant') telegraphs and executes seed volley & leaf spiral projectiles
  sim.enemies.length = 0;
  sim.projectiles.length = 0;
  const sunflower = sim.spawnSpecialMonster('bloom_giant')!;
  assert.ok(sunflower);
  assert.equal(sunflower.specialId, 'bloom_giant');
  assert.ok(sunflower.despawnTimer >= 60, 'Special monsters should live longer');

  // Force sunflower into 'sunflower_seed_volley' telegraph and finish telegraph
  sunflower.x = sim.heroX + 3.0;
  sunflower.y = sim.heroY;
  sunflower.aiState = 'telegraph';
  sunflower.bossAttackMode = 'sunflower_seed_volley';
  sunflower.aiTimer = 0.01;
  sim.tick();
  assert.ok(
    sim.projectiles.some((p) => p.projectileKind === 'sunflower_seed'),
    'Golden Sunflower seed volley mode should fire sunflower_seed projectiles'
  );

  // Force sunflower into 'sunflower_leaf_spiral' telegraph and finish telegraph
  sim.projectiles.length = 0;
  sunflower.aiState = 'telegraph';
  sunflower.bossAttackMode = 'sunflower_leaf_spiral';
  sunflower.aiTimer = 0.01;
  sim.tick();
  assert.ok(
    sim.projectiles.some((p) => p.projectileKind === 'sunflower_leaf'),
    'Golden Sunflower leaf spiral mode should fire sunflower_leaf projectiles'
  );

  // 3. Victory Sequence (white angel wings ascension) runs before runEnded becomes true
  const boss = sim.debugSpawnFinalBossArena()!;
  (sim as any).applyDamageToEnemy(boss, boss.hp + 1000, false, 0, ['slash']);
  assert.ok(sim.victorySequenceTimer > 1.5, 'Killing Final Boss should start victorySequenceTimer');
  assert.equal(sim.runEnded, false, 'Run should not end until victory angel wings animation finishes');
  for (let i = 0; i < 120; i++) sim.tick();
  assert.equal(sim.runEnded, true);
  assert.equal(sim.runOutcome, 'victory');

  // 4. Death Sequence & Sudden Death on End Run (bypasses extra lives, leaves a grave, and awards run rewards)
  const simDefeat = new Simulation({ seed: 1111, professionId: 'warden' });
  simDefeat.debugSetCardLevel('second_wind', 1);
  simDefeat.debugTriggerPowerUp('shield');
  simDefeat.reviveUsed = false;
  simDefeat.kills = 25;
  simDefeat.bonusCoinsCollected = 12;
  simDefeat.elapsedTicks = 60 * 40; // 40s survived
  simDefeat.elapsedSeconds = 40;

  let runEndedPayload: { coinsEarned: number; gemsEarned: number; score: number; outcome: string } | null = null;
  simDefeat.events.on('RunEnded', (ev) => {
    runEndedPayload = ev;
  });

  simDefeat.triggerSuddenDeath();
  assert.equal(simDefeat.currentHp, 0, 'Sudden death should set hero HP to 0 even with extra lives');
  assert.equal(simDefeat.shieldHp, 0, 'Sudden death should clear shield HP');
  assert.equal(simDefeat.secondWindUsed, true, 'Sudden death should bypass Second Wind extra life');
  assert.equal(simDefeat.reviveUsed, true, 'Sudden death should bypass Rescue Revive extra life');
  assert.ok(simDefeat.deathSequenceTimer > 1.4, 'Sudden death should start deathSequenceTimer');
  assert.ok(
    simDefeat.enemies.some((e) => e.isHeroGrave),
    'Sudden death sequence should leave a Hero Grave at the hero position'
  );
  assert.equal(simDefeat.runEnded, false, 'Run should wait for death grave animation before ending');
  for (let i = 0; i < 110; i++) simDefeat.tick();
  assert.equal(simDefeat.runEnded, true);
  assert.equal(simDefeat.runOutcome, 'defeat');
  assert.ok(runEndedPayload, 'RunEnded event should be emitted with run rewards');
  assert.ok((runEndedPayload as { coinsEarned: number }).coinsEarned >= 30, 'Player should receive coins according to run performance');
  assert.ok((runEndedPayload as { score: number }).score >= 2000, 'Player should receive score according to run performance');
});

test('Bestiary debug spawner supports infinite_hp, swarm, and respawn_on_death modes on the arena with hero', () => {
  const sim = new Simulation({ seed: 2222, professionId: 'warden' });
  sim.enemies.length = 0;

  // 1. Infinite HP mode ('infinite_hp'): spawns an enemy with isInfiniteHp = true whose HP never drops below maxHp
  const spawnedInf = sim.debugSpawnBestiaryEnemy('enemy_brute_norm', 'infinite_hp');
  assert.equal(spawnedInf.length, 1);
  const infBrute = sim.enemies.find((e) => e.bestiaryKey === 'enemy_brute_norm' && e.isInfiniteHp)!;
  assert.ok(infBrute, 'Should spawn an infinite-HP Bramble Brute near the hero');
  assert.equal(infBrute.archetypeId, 'brute');
  assert.equal(infBrute.isInfiniteHp, true);

  // Deal massive direct damage & Regrowth Evolution full-HP damage -> HP stays at maxHp
  (sim as any).applyDamageToEnemy(infBrute, 99999, true, 0.5, ['slash']);
  assert.equal(infBrute.hp, infBrute.maxHp, 'Infinite HP enemy should immediately restore HP to maxHp when damaged');
  sim.debugSetCardLevel('regrowth', 6);
  sim.currentHp = sim.maxHp;
  sim.healHero(50);
  assert.equal(infBrute.hp, infBrute.maxHp, 'Infinite HP enemy should also survive Regrowth Evolution map-wide damage');

  // 2. Swarm mode ('swarm'): spawns a large group of enemies around the hero
  sim.enemies.length = 0;
  const swarmUnits = sim.debugSpawnBestiaryEnemy('enemy_chaser_norm', 'swarm');
  assert.equal(swarmUnits.length, 14, 'Swarm mode should spawn 14 regular enemies around the hero');
  assert.equal(
    sim.enemies.filter((e) => e.bestiaryKey === 'enemy_chaser_norm').length,
    14,
    'All 14 spawned swarm enemies should be present on the arena'
  );

  // Special monster swarm spawns 8 units
  const specialSwarmUnits = sim.debugSpawnBestiaryEnemy('special_bloom_giant', 'swarm');
  assert.equal(specialSwarmUnits.length, 8, 'Swarm mode for special monsters should spawn 8 units');

  // 3. Single Respawn on Death mode ('respawn_on_death'): killing the enemy automatically spawns a fresh replacement on the arena
  sim.enemies.length = 0;
  const respawnUnits = sim.debugSpawnBestiaryEnemy('boss_thornheart_p2', 'respawn_on_death');
  assert.equal(respawnUnits.length, 1);
  const firstBoss = sim.enemies.find((e) => e.bestiaryKey === 'boss_thornheart_p2' && e.respawnOnDeath)!;
  assert.ok(firstBoss, 'Should spawn a respawning Thornheart Phase 2 boss');
  const firstBossId = firstBoss.id;

  // Kill the respawning boss -> should NOT end the run in victory, and should immediately spawn a new replacement copy
  (sim as any).applyDamageToEnemy(firstBoss, firstBoss.hp + 5000, false, 0, ['slash']);
  assert.equal(sim.victorySequenceTimer, 0, 'Killing a respawnOnDeath boss should not trigger the run victory sequence');
  const replacementBoss = sim.enemies.find(
    (e) => e.bestiaryKey === 'boss_thornheart_p2' && e.respawnOnDeath && e.hp > 0 && e.id !== firstBossId
  );
  assert.ok(replacementBoss, 'Killing a respawnOnDeath enemy should immediately respawn a new copy on the arena with the hero');
});

test('YouTube Playables SDK integration: Dev Mode Stubs, Rewarded Ad outcomes, and Dual-Storage Player State Reconciliation', async () => {
  const platform = createPlatformFacade({ adDelayMs: 0 });
  const saveManager = new SaveManager(platform);

  // 1. Lifecycle signaling sets firstFrameReadyCalled and gameReadyCalled on dev stub
  platform.lifecycle.notifyFirstFrameReady();
  platform.lifecycle.notifyGameReady();
  const diagInit = platform.devStub.getDiagnostics();
  assert.equal(diagInit.isDevStub, true);
  assert.equal(diagInit.firstFrameReadyCalled, true);
  assert.equal(diagInit.gameReadyCalled, true);

  // 2. Rewarded Ad stub modes: 'grant', 'skip', and 'error'
  platform.devStub.setAdOutcomeMode('grant');
  const granted = await platform.ads.requestRewardedAd('reward_sanctuary_grant_v1');
  assert.equal(granted, true, 'Grant mode should resolve true');
  assert.equal(platform.devStub.getDiagnostics().lastAdResult, 'granted');
  assert.equal(platform.devStub.getDiagnostics().totalAdsGranted, 1);

  const reward = saveManager.claimSanctuaryAdReward(120, 2);
  assert.equal(reward.coinsAdded, 120);
  assert.equal(reward.gemsAdded, 2);
  assert.equal(saveManager.getState().currencies.coins, 280);
  assert.equal(saveManager.getState().currencies.gems, 7);
  assert.equal(saveManager.getState().currencies.adWatchCountToday, 1);

  platform.devStub.setAdOutcomeMode('skip');
  const skipped = await platform.ads.requestRewardedAd('reward_persona_pip_v1');
  assert.equal(skipped, false, 'Skip mode should resolve false without granting reward');
  assert.equal(platform.devStub.getDiagnostics().lastAdResult, 'skipped');

  platform.devStub.setAdOutcomeMode('error');
  const errored = await platform.ads.requestRewardedAd('reward_revive_run_v1');
  assert.equal(errored, false, 'Error mode should gracefully resolve false without throwing');
  assert.equal(platform.devStub.getDiagnostics().lastAdResult, 'error');

  // 3. Saving Player State to YouTube Cloud & LocalStorage Backup + Offline Fallback
  platform.devStub.setCloudStorageMode('synced');
  const saveOk = await saveManager.flushImmediate();
  assert.equal(saveOk, true, 'Saving in synced cloud mode should succeed');
  assert.ok(
    platform.devStub.getDiagnostics().lastSavedCloudBytes > 100,
    'Cloud payload byte length should be recorded'
  );

  // Switch cloud stub to 'offline' -> saveRaw returns false (cloud error) while still writing LocalStorage backup
  platform.devStub.setCloudStorageMode('offline');
  saveManager.getState().currencies.coins = 555;
  const offlineSaveOk = await saveManager.flushImmediate();
  assert.equal(offlineSaveOk, false, 'Offline cloud stub should report cloud save failure');
  assert.ok(
    platform.storage.loadLocalBackupRaw().includes('555'),
    'Local backup must still be written when YouTube Cloud is offline'
  );

  // 4. Dual-Storage Reconciliation merges unlocks, highest personaAdPips, and highest allTime score
  const olderCloud = createDefaultSaveData();
  olderCloud.updatedAtEpochMs = 1_000_000;
  olderCloud.unlocks.personas = ['adventurer_default', 'sunflower_bard'];
  olderCloud.unlocks.personaAdPips = { sunflower_bard: 2, frost_alchemist: 1 };
  olderCloud.bestScores.allTime = 9500;

  const newerLocal = createDefaultSaveData();
  newerLocal.updatedAtEpochMs = 2_000_000;
  newerLocal.currencies.coins = 777;
  newerLocal.unlocks.professions = ['warden', 'stormcaller'];
  newerLocal.unlocks.personaAdPips = { frost_alchemist: 3 };
  newerLocal.bestScores.allTime = 4200;

  const { state: merged, source } = reconcileSaveData(
    JSON.stringify(olderCloud),
    JSON.stringify(newerLocal)
  );
  assert.equal(source, 'merged');
  assert.equal(merged.currencies.coins, 777, 'Uses newer snapshot currencies');
  assert.ok(merged.unlocks.personas.includes('sunflower_bard'), 'Preserves cloud unlocked personas');
  assert.ok(merged.unlocks.professions.includes('stormcaller'), 'Preserves local unlocked professions');
  assert.equal(merged.unlocks.personaAdPips.sunflower_bard, 2);
  assert.equal(merged.unlocks.personaAdPips.frost_alchemist, 3);
  assert.equal(merged.bestScores.allTime, 9500, 'Preserves highest all-time score across both storages');
});

test('Development process gate (isDevelopmentProcess) enables lazy debug features only in development and disables them in production', () => {
  assert.equal(isDevelopmentProcess(true), true, 'Debug features should be enabled when DEV is true');
  assert.equal(isDevelopmentProcess(false), false, 'Debug features must be disabled when DEV is false (production)');
  assert.equal(typeof IS_DEV, 'boolean');
});

test('Card Draft allows up to 3 Ad Watch rerolls and up to 3 Coin rerolls per run and preserves counts across checkpoints', () => {
  const sim = new Simulation({ seed: 9191, professionId: 'warden' });
  sim.triggerLevelUpCardDraft();

  assert.equal(Simulation.MAX_AD_REROLLS, 3);
  assert.equal(Simulation.MAX_COIN_REROLLS, 3);
  assert.equal(sim.adRerollsUsed, 0);
  assert.equal(sim.coinRerollsUsed, 0);

  // 1. Up to 3 Ad Watch rerolls succeed; 4th is rejected
  sim.rerollCardDraft('ad');
  assert.equal(sim.adRerollsUsed, 1);
  sim.rerollCardDraft('ad');
  assert.equal(sim.adRerollsUsed, 2);
  sim.rerollCardDraft('ad');
  assert.equal(sim.adRerollsUsed, 3);
  const offersAfter3Ad = sim.pendingCardOffers.map((o) => o.offerId);
  sim.rerollCardDraft('ad');
  assert.equal(sim.adRerollsUsed, 3, '4th ad reroll should be blocked after 3 uses');
  assert.deepEqual(
    sim.pendingCardOffers.map((o) => o.offerId),
    offersAfter3Ad,
    'Blocked 4th ad reroll should not change card offers'
  );

  // 2. Up to 3 Coin rerolls succeed independently; 4th is rejected
  sim.rerollCardDraft('coins');
  assert.equal(sim.coinRerollsUsed, 1);
  sim.rerollCardDraft('coins');
  assert.equal(sim.coinRerollsUsed, 2);
  sim.rerollCardDraft('coins');
  assert.equal(sim.coinRerollsUsed, 3);
  const offersAfter3Coins = sim.pendingCardOffers.map((o) => o.offerId);
  sim.rerollCardDraft('coins');
  assert.equal(sim.coinRerollsUsed, 3, '4th coin reroll should be blocked after 3 uses');
  assert.deepEqual(
    sim.pendingCardOffers.map((o) => o.offerId),
    offersAfter3Coins,
    'Blocked 4th coin reroll should not change card offers'
  );

  // 3. Checkpoint serialization preserves both adRerollsUsed and coinRerollsUsed
  const cp = sim.serializeCheckpoint();
  const restored = Simulation.fromCheckpoint(cp, ['garden_blade']);
  assert.equal(restored.adRerollsUsed, 3);
  assert.equal(restored.coinRerollsUsed, 3);
});

test('Reworked Arcana Persona skins are ad-exclusive, cover all 4 professions with pop-culture mashups & heterochromia eyes, and leave disappearing step effects', () => {
  const defaultSave = createDefaultSaveData();

  assert.equal(PERSONAS.length, 4, 'There should be 4 reworked Arcana Persona skins');
  const expectedSkins = [
    {
      id: 'warden_zagreus_naruto',
      professionId: 'warden',
      stepEffectKind: 'zagreus_fire_step',
    },
    {
      id: 'seeker_hollow_levi',
      professionId: 'seeker',
      stepEffectKind: 'void_soul_step',
    },
    {
      id: 'herbalist_frieren_strange',
      professionId: 'herbalist',
      stepEffectKind: 'alchemy_rune_step',
    },
    {
      id: 'stormcaller_gojo_killua',
      professionId: 'stormcaller',
      stepEffectKind: 'godspeed_lightning_step',
    },
  ] as const;

  for (const exp of expectedSkins) {
    const p = PERSONAS.find((item) => item.id === exp.id);
    assert.ok(p, `Persona ${exp.id} should exist in PERSONAS catalog`);
    assert.equal(p.professionId, exp.professionId);
    assert.equal(p.stepEffectKind, exp.stepEffectKind);
    assert.equal(p.adPipsRequired, 3, 'Each Arcana Persona skin must require watching 3 ads');
    assert.equal(p.unlockCostSeeds, 0, 'Arcana Persona skins must only be unlockable via ads');
    if (exp.id === 'stormcaller_gojo_killua' || exp.id === 'herbalist_frieren_strange') {
      assert.equal(
        p.eyeLeftColor,
        p.eyeRightColor,
        `${p.name} should have matching blue eye colors`
      );
    } else {
      assert.notEqual(
        p.eyeLeftColor,
        p.eyeRightColor,
        'Other Arcana Persona skins should have distinct heterochromia eye colors'
      );
    }
    assert.equal(
      defaultSave.unlocks.personas.includes(exp.id),
      false,
      `${exp.id} must start locked as a shadow silhouette in default save data`
    );

    if (exp.id === 'herbalist_frieren_strange') {
      assert.equal(p.name, 'Hiten Jade', 'Herbalist persona should be named Hiten Jade');
      assert.equal(p.eyeLeftColor, 0x0284c7, 'Hiten Jade left eye should be blue');
      assert.equal(p.eyeRightColor, 0x0284c7, 'Hiten Jade right eye should be blue');
      const hitenText = `${p.name} ${p.subtitle} ${p.popCultureMashup} ${p.permanentVfxLabel} ${p.permanentVfxDescription}`.toLowerCase();
      for (const forbidden of [
        'frieren',
        'strange',
        'katara',
        'avatar',
        'sakura',
        'naruto',
        'byakugou',
        'water tribe',
      ]) {
        assert.equal(
          hitenText.includes(forbidden),
          false,
          `Hiten Jade lore must not reference "${forbidden}"`
        );
      }
      assert.equal(p.bodyColor, 0xf472b6, 'Hiten Jade should have blossom-pink hair color');
      assert.equal(p.cloakColor, 0x0284c7, 'Hiten Jade should have cerulean vestments color');

      // Verify high-grade animated orbitals, diamond condensation facets, and rising water vapor puffs
      const sample0 = computeHitenJadeAuraSample(0, 0, 0);
      const sample1 = computeHitenJadeAuraSample(0.45, 2.5, -1.0);
      const sample2 = computeHitenJadeAuraSample(1.35, 0, 0);
      assert.equal(sample0.facets.length, 8, 'Should animate 8 orbiting diamond condensation facets along the green & blue orbitals');
      assert.equal(sample0.vaporPuffs.length, 10, 'Should animate 10 rising wispy water vapor puffs & steam tendrils');
      assert.notEqual(sample0.iceSwayX, sample1.iceSwayX, 'Ice-blue orbital should undulate over time');
      assert.notEqual(sample0.jadeSwayX, sample1.jadeSwayX, 'Diamond-green orbital should undulate over time');
      assert.notEqual(sample0.flowPulseA, sample1.flowPulseA, 'Condensation surge wave should travel along orbitals');
      assert.notEqual(sample1.facets[0]!.dx, sample2.facets[0]!.dx, 'Diamond condensation facets should orbit along the orbitals');
      assert.notEqual(sample1.facets[0]!.scale, sample2.facets[0]!.scale, 'Diamond condensation facets should pulse in scale');
      assert.notEqual(
        sample0.facets[0]!.isFront,
        sample2.facets[0]!.isFront,
        'Orbiting diamond facets should revolve full-circle between front and back hemispheres'
      );
      assert.notEqual(
        sample0.vaporPuffs[0]!.dy,
        sample1.vaporPuffs[0]!.dy,
        'Water vapor puffs must rise vertically over time'
      );
      assert.ok(
        sample0.facets.some((f) => f.isFront) && sample0.facets.some((f) => !f.isFront),
        'Helical diamond condensation facets should orbit both in front of and behind the character'
      );
      assert.ok(
        sample0.vaporPuffs.some((vp) => vp.isFront) && sample0.vaporPuffs.some((vp) => !vp.isFront),
        'Rising water vapor puffs should billow both in front of and behind the character'
      );

      // Verify Herbalist Healing Dash restores 4 HP
      const simHerbalist = new Simulation({
        seed: 7878,
        professionId: 'herbalist',
        personaId: 'herbalist_frieren_strange',
      });
      simHerbalist.currentHp = simHerbalist.maxHp - 20;
      const hpBeforeDash = simHerbalist.currentHp;
      assert.equal(simHerbalist.requestDash(0), true);
      assert.equal(
        simHerbalist.currentHp - hpBeforeDash,
        4,
        'Herbalist Healing Dash should restore 4 HP'
      );
    }

    // Verify moving with the skin equipped spawns disappearing step effects (except Thander Rein and Frieren Strange who have no trailing step effects)
    const sim = new Simulation({
      seed: 4242,
      professionId: exp.professionId,
      personaId: exp.id,
    });
    sim.setMoveIntent(1, 0);
    for (let t = 0; t < 15; t++) {
      sim.tick();
    }
    const stepFx = sim.visualEffects.filter((fx) => fx.kind === exp.stepEffectKind);
    if (exp.id === 'stormcaller_gojo_killua' || exp.id === 'herbalist_frieren_strange') {
      assert.equal(
        stepFx.length,
        0,
        `${exp.id} should NOT leave trailing ground step effects`
      );
    } else {
      assert.ok(
        stepFx.length > 0,
        `Moving with ${exp.id} should leave ${exp.stepEffectKind} footsteps behind the character`
      );

      // Stop moving and advance ticks -> footsteps must disappear after their timer expires
      sim.setMoveIntent(0, 0);
      sim.heroVx = 0;
      sim.heroVy = 0;
      for (let t = 0; t < 60; t++) {
        sim.tick();
      }
      assert.equal(
        sim.visualEffects.filter((fx) => fx.kind === exp.stepEffectKind).length,
        0,
        `${exp.stepEffectKind} footsteps must disappear after the character`
      );
    }
  }
});

test('Gameplay Polish: 0.5s silent invulnerability after card choice, single initial coin farther from spawn, decreased basic coin drop rate amplified by Lucky Clover, Heal +20HP drop, collapsing thorn arena, and Boss death -> Angel Wings victory sequence', () => {
  const sim = new Simulation({ seed: 31415, professionId: 'warden' });

  // 1. Single initial coin near hero spawn placed farther away at (3.2, -0.85)
  const initialCoins = sim.pickups.filter((p) => p.kind === 'gold_coin');
  assert.equal(initialCoins.length, 1, 'Should spawn only 1 coin near hero spawn');
  const distCoin = Math.hypot(initialCoins[0]!.x, initialCoins[0]!.y);
  assert.ok(distCoin >= 3.0, `Single initial coin should lay farther from spawn (>=3.0u), got ${distCoin}`);

  // 2. Decreased basic coin drop rate (1.5% base) amplified by Lucky Clover & Luck
  const baseCoinChance = sim.getBasicCoinDropChance();
  assert.ok(
    Math.abs(baseCoinChance - BALANCE_CONFIG.BASE_COIN_DROP_RATE) < 1e-6,
    `Base coin drop chance should be ${BALANCE_CONFIG.BASE_COIN_DROP_RATE}, got ${baseCoinChance}`
  );
  sim.debugSetCardLevel('lucky_clover', 3);
  const cloverCoinChance = sim.getBasicCoinDropChance();
  assert.ok(
    cloverCoinChance > 0.35,
    `Lucky Clover Lv 3 should amplify basic coin drop chance significantly (>35%), got ${cloverCoinChance}`
  );

  // 3. After card choice (or skip), hero gets 0.5s silent invulnerability (cardPickInvisTimer) without dash visual
  sim.triggerLevelUpCardDraft();
  const firstOfferId = sim.pendingCardOffers[0]!.offerId;
  sim.applyCardOffer(firstOfferId);
  assert.equal(sim.cardPickInvisTimer, 0.5, 'Picking a card should grant 0.5s cardPickInvisTimer');
  assert.equal(sim.dashIframeTimer, 0, 'Card choice invulnerability should not trigger dash visual iframe timer');
  const hpBeforeHit = sim.currentHp;
  (sim as any).damageHero(35);
  assert.equal(sim.currentHp, hpBeforeHit, 'Hero should ignore damage during 0.5s cardPickInvisTimer');

  // 4. Dash strike burst & Aegis burst visual effects
  sim.debugTriggerPowerUp('shield');
  assert.ok(
    sim.visualEffects.some((fx) => fx.kind === 'aegis_burst'),
    'Activating Aegis Orb should emit aegis_burst visual effect'
  );
  sim.visualEffects.length = 0;
  sim.requestDash();
  for (let i = 0; i < 20; i++) sim.tick();
  assert.ok(
    sim.visualEffects.some((fx) => fx.kind === 'dash_strike_burst'),
    'Warden dash strike should emit dash_strike_burst visual effect'
  );

  // 5. New item drop Heal +20HP ('heal_potion') appears in hero pockets (heldPowerUps) and heals +20 HP when used
  sim.currentHp = Math.max(10, sim.maxHp - 35);
  const hpBeforePotion = sim.currentHp;
  sim.heldPowerUps.length = 0;
  const potion = sim.debugSpawnHeal20Drop();
  assert.equal(potion.kind, 'heal_potion');
  assert.equal(potion.value, 20);
  // Move hero onto the potion to collect it into pocket slot
  sim.heroX = potion.x;
  sim.heroY = potion.y;
  sim.tick();
  assert.equal(
    sim.heldPowerUps[0],
    'heal_potion',
    'Collecting heal_potion should place it in hero pockets (heldPowerUps[0]) like Ember Guard or Aegis'
  );
  assert.equal(
    sim.currentHp,
    hpBeforePotion,
    'Collecting heal_potion into pockets should not heal until activated from pocket'
  );
  sim.requestUsePowerUp(0);
  sim.tick();
  assert.equal(sim.heldPowerUps.length, 0, 'Activating heal_potion consumes it from hero pockets');
  assert.equal(
    sim.currentHp,
    hpBeforePotion + 5,
    'Activating heal_potion from pocket should heal +5 HP on the first pulse (with 3 pulses remaining)'
  );
  assert.equal(sim.healPotionPulsesRemaining, 3, 'Should have 3 delayed +5 HP pulses remaining');
  for (let i = 0; i < 50; i++) sim.tick();
  assert.equal(sim.healPotionPulsesRemaining, 0, 'All 4 pulses of +5 HP should finish after ~0.75s');
  assert.equal(sim.currentHp, hpBeforePotion + 20, 'Total healing after 4 pulses of +5 HP should be +20 HP');

  // 6. Thorn area slowly collapses from 28.0u at 0s toward 13.5u at 225s (FINAL_BOSS_SPAWN_SEC)
  assert.equal(Simulation.FINAL_BOSS_SPAWN_SEC, 225, 'Final Boss spawn time should be 225s (+30s)');
  const halfBossSec = Simulation.FINAL_BOSS_SPAWN_SEC * 0.5; // 112.5s
  sim.elapsedTicks = Math.round(halfBossSec * 60);
  sim.elapsedSeconds = halfBossSec;
  sim.tick();
  const midExpected = (Simulation.INITIAL_ARENA_RADIUS_U + Simulation.FINAL_BOSS_ARENA_RADIUS_P1_U) * 0.5;
  assert.ok(
    Math.abs(sim.arenaRadiusU - midExpected) < 0.25,
    `Thorn arena should collapse halfway (~${midExpected}u) at ${halfBossSec}s, got ${sim.arenaRadiusU}`
  );

  // 7. On winning: despawn all enemies except Final Boss, play bossDeathTimer (0.85s), and only after that despawn boss & finish Angel Wings ascension
  const minion1 = sim.spawnEnemy('chaser', sim.heroX + 3, sim.heroY, false)!;
  const minion2 = sim.spawnEnemy('brute', sim.heroX - 3, sim.heroY, false)!;
  const finalBoss = sim.debugSpawnFinalBossArena()!;
  assert.ok(sim.enemies.includes(minion1) && sim.enemies.includes(minion2));

  (sim as any).applyDamageToEnemy(finalBoss, finalBoss.hp + 9999, false, 0, ['slash']);
  assert.equal(
    sim.enemies.filter((e) => !e.isFinalBoss).length,
    0,
    'Winning should immediately despawn all enemies except the Final Boss'
  );
  assert.equal(
    sim.enemies.filter((e) => e.isFinalBoss).length,
    1,
    'Final Boss should remain on arena during its death animation (bossDeathTimer > 0)'
  );
  assert.ok(sim.bossDeathTimer > 0.7, 'bossDeathTimer should be active right after lethal blow');

  // Tick through bossDeathTimer (~55 ticks = ~0.91s) -> Final Boss despawns, victorySequenceTimer continues for Angel Wings
  for (let i = 0; i < 55; i++) sim.tick();
  assert.equal(sim.bossDeathTimer, 0, 'bossDeathTimer should finish after ~0.85s');
  assert.equal(sim.enemies.length, 0, 'Final Boss should despawn once bossDeathTimer reaches 0');
  assert.ok(sim.victorySequenceTimer > 0.8, 'Angel Wings victorySequenceTimer should still be playing');
  assert.equal(sim.runEnded, false, 'Final screen should not appear until Angel Wings animation completes');

  // Tick remaining ~70 ticks -> run ends in victory
  for (let i = 0; i < 75; i++) sim.tick();
  assert.equal(sim.runEnded, true);
  assert.equal(sim.runOutcome, 'victory');
});

test('Quick Hands increases Petal Orbs spinning speed, Thander Rein persona rework, Final Boss +30s spawn time & reduced minion spawn rate', () => {
  // 1. Thander Rein persona metadata check (no Raiden or Thor mentions)
  const thander = PERSONAS.find((p) => p.id === 'stormcaller_gojo_killua');
  assert.ok(thander, 'stormcaller_gojo_killua persona should exist');
  assert.equal(thander.name, 'Thander Rein', 'Stormcaller persona should be named Thander Rein');
  assert.ok(
    !thander.popCultureMashup.toLowerCase().includes('raiden') &&
      !thander.popCultureMashup.toLowerCase().includes('thor') &&
      !thander.permanentVfxDescription.toLowerCase().includes('raiden') &&
      !thander.permanentVfxDescription.toLowerCase().includes('thor'),
    'Thander Rein description must not mention Raiden or Thor Odinson'
  );
  assert.equal(thander.cloakColor, 0xdc2626, 'Thander Rein should wear crimson cloak');

  // 2. Quick Hands leveling increases Petal Orbs angular spin speed (bonusOrbitAngle)
  const simNoQuick = new Simulation({ seed: 1010, professionId: 'warden' });
  simNoQuick.debugSetWeaponLevel('petal_orbit', 1, false);
  simNoQuick.bonusOrbitAngle = 0;
  for (let i = 0; i < 60; i++) simNoQuick.tick();
  const angleWithoutQuickHands = simNoQuick.bonusOrbitAngle;

  const simWithQuick = new Simulation({ seed: 1010, professionId: 'warden' });
  simWithQuick.debugSetWeaponLevel('petal_orbit', 1, false);
  simWithQuick.debugSetCardLevel('quick_hands', 4);
  simWithQuick.bonusOrbitAngle = 0;
  for (let i = 0; i < 60; i++) simWithQuick.tick();
  const angleWithQuickHands = simWithQuick.bonusOrbitAngle;

  assert.ok(
    angleWithQuickHands > angleWithoutQuickHands * 1.8,
    `Quick Hands Lv 4 should significantly increase Petal Orbs spin speed (${angleWithQuickHands} vs ${angleWithoutQuickHands})`
  );

  // 3. Final Boss spawns at 225s (not 195s) and has decreased regular enemy spawn rate
  const simBossTiming = new Simulation({ seed: 2020, professionId: 'warden' });
  simBossTiming.elapsedTicks = 200 * 60;
  simBossTiming.elapsedSeconds = 200;
  simBossTiming.tick();
  assert.equal(
    simBossTiming.finalBossSpawned,
    false,
    'Final Boss should NOT spawn at 200s because spawn time was increased by +30s to 225s'
  );

  simBossTiming.elapsedTicks = 225 * 60;
  simBossTiming.elapsedSeconds = 225;
  simBossTiming.tick();
  assert.equal(
    simBossTiming.finalBossSpawned,
    true,
    'Final Boss should spawn at 225s (FINAL_BOSS_SPAWN_SEC)'
  );

  // Check spawnTimer cooldown after spawning a wave during Final Boss is slower (>= 2.0s)
  simBossTiming.directorBankedBudget = 20;
  simBossTiming.spawnTimer = 0;
  (simBossTiming as any).updateWaveDirector(1 / 60);
  assert.ok(
    simBossTiming.spawnTimer >= 2.0,
    `Expected decreased spawn rate (spawnTimer >= 2.0s) during Final Boss, got ${simBossTiming.spawnTimer}`
  );

  // Check Final Boss health points scaling
  assert.equal(Simulation.FINAL_BOSS_BASE_HP, 1500, 'Final Boss base HP should be 1500');
  const spawnedFinalBoss = simBossTiming.enemies.find((e) => e.isFinalBoss);
  assert.ok(spawnedFinalBoss, 'Final Boss should be in enemies list');
  assert.ok(
    spawnedFinalBoss.maxHp > 2500,
    `Final Boss HP at 225s should scale above 2500, got ${spawnedFinalBoss.maxHp}`
  );
});

test('Arbalete (replaces Thorn Spear) has increased default range, fires arbalete_bolt projectiles, explodes at end of flight when evolved, and Swift Boots grants passive dodge chance', () => {
  // 1. Arbalete catalog & increased default range verification
  const sim = new Simulation({ seed: 4040, professionId: 'warden' });
  sim.weapons = [];
  sim.enemies.length = 0;

  sim.debugSetWeaponLevel('thorn_spear', 1, false);
  const arbaleteWpn = sim.weapons.find((w) => w.id === 'thorn_spear');
  assert.ok(arbaleteWpn, 'Arbalete weapon should be equipped');

  // Spawn an enemy at 3.2u (outside old 2.9u range, inside new 3.6u default range)
  const targetInNewRange = sim.spawnEnemy('brute', sim.heroX + 3.2, sim.heroY, false)!;
  targetInNewRange.hp = 500;
  targetInNewRange.maxHp = 500;

  // Step ticks so Arbalete fires a bolt
  let firedBolt = false;
  for (let i = 0; i < 40; i++) {
    targetInNewRange.x = sim.heroX + 3.2;
    targetInNewRange.y = sim.heroY;
    sim.tick();
    if (sim.projectiles.some((p) => p.projectileKind === 'arbalete_bolt')) {
      firedBolt = true;
    }
  }
  assert.equal(firedBolt, true, 'Arbalete should fire an arbalete_bolt projectile');
  assert.ok(
    targetInNewRange.hp < 500,
    'Arbalete bolt should hit enemy at 3.2u thanks to increased 3.6u default range'
  );

  // 2. Evolved Arbalete (Crimson Bramble Arbalete) bolt explodes at the end of its flight dealing extra AoE damage
  sim.projectiles.length = 0;
  sim.visualEffects.length = 0;
  sim.enemies.length = 0;
  sim.debugSetWeaponLevel('thorn_spear', 8, true);

  // Spawn a target at the end of the bolt's flight path (off-axis by 0.9u so the bolt itself misses it, but the end-of-flight explosion hits it!)
  const evolvedReach = (3.6 + 0.45 + 0.65) * sim.stats.reachMult;
  const bystander = sim.spawnEnemy('brute', sim.heroX + evolvedReach, sim.heroY + 0.95, false)!;
  bystander.hp = 600;
  bystander.maxHp = 600;

  // Fire evolved Arbalete along +X axis
  sim.heroFacingAngle = 0;
  let sawExplosionFx = false;
  for (let i = 0; i < 65; i++) {
    bystander.x = sim.heroX + evolvedReach;
    bystander.y = sim.heroY + 0.95;
    sim.tick();
    if (sim.visualEffects.some((fx) => fx.kind === 'ember_burst' || fx.kind === 'circle_blast')) {
      sawExplosionFx = true;
    }
  }

  assert.ok(
    bystander.hp < 600,
    `Evolved Arbalete bolt should explode at the end of its flight and deal AoE damage to nearby enemies (HP: ${bystander.hp}/600)`
  );
  assert.ok(
    sawExplosionFx,
    'Evolved Arbalete bolt explosion should spawn ember_burst / circle_blast visual effects'
  );

  // 3. Swift Boots passive dodge chance on level up
  const simDodge = new Simulation({ seed: 5151, professionId: 'warden' });
  assert.equal(simDodge.stats.dodgeChance, 0, 'Base dodge chance without Swift Boots should be 0');

  simDodge.debugSetCardLevel('swift_boots', 5);
  simDodge.cardPickInvisTimer = 0;
  simDodge.invulnTimer = 0;
  assert.ok(
    Math.abs(simDodge.stats.dodgeChance - 0.3) < 1e-6,
    `Swift Boots Lv 5 should grant 30% passive dodge chance (+6% per level), got ${simDodge.stats.dodgeChance}`
  );

  let dodgesTriggered = 0;
  let hitsTaken = 0;
  let lastFloatText = '';
  simDodge.events.on('FloatingText', (ev) => {
    lastFloatText = ev.text;
  });
  for (let i = 0; i < 60; i++) {
    simDodge.currentHp = simDodge.maxHp;
    simDodge.invulnTimer = 0;
    simDodge.cardPickInvisTimer = 0;
    lastFloatText = '';
    (simDodge as any).damageHero(10);
    if (simDodge.currentHp === simDodge.maxHp) {
      dodgesTriggered++;
      assert.equal(lastFloatText, 'miss', 'Passive dodge should emit miss FloatingText event');
    } else {
      hitsTaken++;
    }
  }
  assert.ok(
    dodgesTriggered >= 8 && hitsTaken >= 20,
    `Expected Swift Boots Lv 5 (30% dodge) to dodge multiple attacks across 60 trials (dodged: ${dodgesTriggered}, hit: ${hitsTaken})`
  );
});

test('Style meter faster level/rank decay & damage penalty, Iron Bark Lv2+ damage reflection, and 3-stage Final Boss telegraphed attacks & themed projectiles', () => {
  // 1. Faster style meter decay with higher hero level, and heavier style loss on damage at high style ranks
  const simLowLv = new Simulation({ seed: 6060, professionId: 'warden' });
  simLowLv.level = 1;
  simLowLv.rankIndex = 3; // Rank A (upThreshold = 110)
  simLowLv.stylePoints = 60;
  simLowLv.tick();
  const pointsAfterLowLv = simLowLv.stylePoints;

  const simHighLv = new Simulation({ seed: 6060, professionId: 'warden' });
  simHighLv.level = 10;
  simHighLv.rankIndex = 3; // Rank A (upThreshold = 110)
  simHighLv.stylePoints = 60;
  simHighLv.tick();
  const pointsAfterHighLv = simHighLv.stylePoints;

  assert.ok(
    pointsAfterHighLv < pointsAfterLowLv,
    `Higher hero level should make style meter fall faster (${pointsAfterHighLv} vs ${pointsAfterLowLv})`
  );

  // Damage penalty scales steeply with style rank
  const simLowRankDmg = new Simulation({ seed: 6161, professionId: 'warden' });
  simLowRankDmg.cardPickInvisTimer = 0;
  simLowRankDmg.invulnTimer = 0;
  simLowRankDmg.rankIndex = 1; // Rank C (upThreshold = 55)
  simLowRankDmg.stylePoints = 50;
  (simLowRankDmg as any).damageHero(8);
  const dropAtRankC = 50 - simLowRankDmg.stylePoints;

  const simHighRankDmg = new Simulation({ seed: 6161, professionId: 'warden' });
  simHighRankDmg.cardPickInvisTimer = 0;
  simHighRankDmg.invulnTimer = 0;
  simHighRankDmg.rankIndex = 5; // Rank SS (upThreshold = 180)
  simHighRankDmg.stylePoints = 150;
  (simHighRankDmg as any).damageHero(8);
  const dropAtRankSS = 150 - simHighRankDmg.stylePoints;

  assert.ok(
    dropAtRankSS > dropAtRankC * 2.5,
    `Style meter should fall much more on damage at high style ranks (drop SS: ${dropAtRankSS} vs drop C: ${dropAtRankC})`
  );

  // 2. Iron Bark Lv 2+ returns blocked damage to attacking enemy
  const simThorns = new Simulation({ seed: 7070, professionId: 'warden' });
  simThorns.cardPickInvisTimer = 0;
  simThorns.invulnTimer = 0;
  const attacker = simThorns.spawnEnemy('brute', simThorns.heroX + 1.0, simThorns.heroY, false)!;
  attacker.hp = 200;
  attacker.maxHp = 200;

  // At Iron Bark Lv 1, blocked damage is NOT reflected
  simThorns.debugSetCardLevel('iron_bark', 1);
  simThorns.cardPickInvisTimer = 0;
  simThorns.invulnTimer = 0;
  (simThorns as any).damageHero(10, attacker);
  assert.equal(attacker.hp, 200, 'Iron Bark Lv 1 should not reflect blocked damage');

  // At Iron Bark Lv 2+, blocked damage IS returned to attacking enemy
  simThorns.debugSetCardLevel('iron_bark', 3); // +3 armor (+1 base warden armor = 4 armor)
  simThorns.cardPickInvisTimer = 0;
  simThorns.invulnTimer = 0;
  (simThorns as any).damageHero(10, attacker);
  assert.ok(
    attacker.hp < 200,
    `Iron Bark Lv 3 should return blocked damage to the attacking enemy (attacker HP: ${attacker.hp}/200)`
  );

  // 3. Final Boss 3 distinct stages, telegraphed attacks, and stage-themed projectiles
  const simBoss = new Simulation({ seed: 8080, professionId: 'warden' });
  simBoss.weapons = [];
  simBoss.maxHp = 9999;
  simBoss.currentHp = 9999;
  const boss = simBoss.debugSpawnFinalBossArena()!;
  assert.ok(boss, 'Final Boss should spawn');

  // Stage 1: Primordial Thornheart -> boss_p1_vine_whip / boss_p1_root_slam & boss_vine_thorn projectiles
  boss.bossPhase = 1;
  boss.aiState = 'seek';
  boss.aiTimer = 0;
  simBoss.projectiles.length = 0;
  let sawVineThorn = false;
  for (let i = 0; i < 65; i++) {
    simBoss.heroX = boss.x + 4.2;
    simBoss.heroY = boss.y;
    simBoss.tick();
    if (simBoss.projectiles.some((p) => p.projectileKind === 'boss_vine_thorn')) {
      sawVineThorn = true;
    }
  }
  assert.equal(sawVineThorn, true, 'Stage 1 Final Boss should fire boss_vine_thorn projectiles after telegraph');

  // Stage 2: Frenzied Bloom -> boss_p2_petal_spiral / boss_p2_bramble_charge & boss_magenta_petal projectiles
  boss.hp = Math.floor(boss.maxHp * 0.55);
  boss.aiState = 'seek';
  boss.aiTimer = 0;
  simBoss.projectiles.length = 0;
  let sawMagentaPetal = false;
  for (let i = 0; i < 95; i++) {
    simBoss.heroX = boss.x + 4.2;
    simBoss.heroY = boss.y;
    simBoss.tick();
    if (simBoss.projectiles.some((p) => p.projectileKind === 'boss_magenta_petal')) {
      sawMagentaPetal = true;
    }
  }
  assert.equal(boss.bossPhase, 2, 'Boss should transition to Stage 2 at 55% HP');
  assert.equal(
    sawMagentaPetal,
    true,
    'Stage 2 Final Boss should fire boss_magenta_petal projectiles after telegraph'
  );

  // Stage 3: Apex Briar Overlord -> boss_p3_crimson_cross / boss_p3_abyssal_nova & boss_abyssal_razor projectiles
  const maxHpBeforeStage3 = boss.maxHp;
  boss.hp = Math.floor(boss.maxHp * 0.25);
  boss.aiState = 'seek';
  boss.aiTimer = 0;
  simBoss.projectiles.length = 0;
  let sawAbyssalRazor = false;
  for (let i = 0; i < 65; i++) {
    simBoss.heroX = boss.x + 4.2;
    simBoss.heroY = boss.y;
    simBoss.tick();
    if (simBoss.projectiles.some((p) => p.projectileKind === 'boss_abyssal_razor')) {
      sawAbyssalRazor = true;
    }
  }
  assert.equal(boss.bossPhase, 3, 'Boss should transition to Stage 3 at 25% HP');
  assert.ok(
    boss.maxHp > maxHpBeforeStage3,
    `Final Boss Stage 3 should gain bonus HP (new maxHp ${boss.maxHp} > ${maxHpBeforeStage3})`
  );
  assert.equal(
    sawAbyssalRazor,
    true,
    'Stage 3 Final Boss should fire boss_abyssal_razor projectiles after telegraph'
  );
});

test('Killing Final Boss with projectiles, DoT, or ground hazards while multiple projectiles/enemies/hazards are active never freezes or throws', () => {
  // Case 1: Final Boss killed by player projectile while multiple enemy/player projectiles exist in sim.projectiles
  const simProj = new Simulation({ seed: 9191, professionId: 'warden' });
  simProj.weapons = [];
  simProj.spawnEnemy('chaser', simProj.heroX - 4, simProj.heroY, false);
  const boss1 = simProj.debugSpawnFinalBossArena()!;
  boss1.x = simProj.heroX + 1.2;
  boss1.y = simProj.heroY;
  boss1.prevX = boss1.x;
  boss1.prevY = boss1.y;
  boss1.hp = 5;
  simProj.spawnEnemy('brute', simProj.heroX + 4, simProj.heroY, false);

  // Add multiple projectiles before and after the lethal bolt
  for (let k = 0; k < 4; k++) {
    simProj.projectiles.push({
      id: 9000 + k,
      isEnemy: true,
      projectileKind: 'boss_vine_thorn',
      x: simProj.heroX - 5,
      y: simProj.heroY - 5,
      prevX: simProj.heroX - 5,
      prevY: simProj.heroY - 5,
      vx: -1,
      vy: 0,
      radius: 0.25,
      damage: 10,
      isCrit: false,
      pierceRemaining: 0,
      lifeTimer: 2.0,
      color: 0x10b981,
      weaponTags: [],
      hitEnemyIds: new Set(),
    });
  }
  simProj.projectiles.push({
    id: 9050,
    isEnemy: false,
    projectileKind: 'arbalete_bolt',
    x: boss1.x - 0.1,
    y: boss1.y,
    prevX: boss1.x - 0.3,
    prevY: boss1.y,
    vx: 12,
    vy: 0,
    radius: 0.3,
    damage: 50,
    isCrit: true,
    pierceRemaining: 1,
    lifeTimer: 1.0,
    explodesOnExpire: true,
    explosionDamage: 40,
    explosionRadius: 2.0,
    color: 0xf43f5e,
    weaponTags: ['pierce', 'projectile'],
    hitEnemyIds: new Set(),
  });

  // Tick through the kill, bossDeathTimer (0.85s), and victorySequenceTimer (1.95s)
  for (let t = 0; t < 130; t++) {
    simProj.tick();
  }
  assert.equal(simProj.runEnded, true, 'Run should end cleanly in victory after projectile boss kill');
  assert.equal(simProj.runOutcome, 'victory');

  // Case 2: Final Boss killed by burn DoT while multiple enemies exist before and after boss in sim.enemies
  const simDot = new Simulation({ seed: 9292, professionId: 'warden' });
  simDot.weapons = [];
  simDot.spawnEnemy('chaser', simDot.heroX - 4, simDot.heroY, false);
  const boss2 = simDot.debugSpawnFinalBossArena()!;
  simDot.spawnEnemy('brute', simDot.heroX + 4, simDot.heroY, false);
  boss2.hp = 1;
  boss2.burnTimer = 2.0;
  boss2.burnDps = 50;

  for (let t = 0; t < 160; t++) {
    simDot.tick();
  }
  assert.equal(simDot.runEnded, true, 'Run should end cleanly in victory after DoT boss kill');
  assert.equal(simDot.runOutcome, 'victory');
});

test('Losti Seige persona lore, overheal prevention, Crit Burst starfall visual effect, and smaller Lucky Clover / Dodge scales', () => {
  // 1. Losti Seige persona verification (no Naruto or Zagreus references)
  const losti = PERSONAS.find((p) => p.id === 'warden_zagreus_naruto');
  assert.ok(losti, 'warden_zagreus_naruto persona should exist');
  assert.equal(losti.name, 'Losti Seige', 'Warden persona should be renamed to Losti Seige');
  const fullLore = `${losti.name} ${losti.subtitle} ${losti.popCultureMashup} ${losti.permanentVfxDescription}`.toLowerCase();
  assert.ok(
    !fullLore.includes('naruto') && !fullLore.includes('zagreus') && !fullLore.includes('uzumaki'),
    'Losti Seige descriptions must not contain any references to Naruto or Zagreus'
  );

  // 2. Prevent healing over available HP limit & stop heal potion pulses when full HP is reached
  const simHeal = new Simulation({ seed: 9595, professionId: 'warden' });
  simHeal.currentHp = simHeal.maxHp - 7;
  simHeal.visualEffects.length = 0;
  simHeal.debugTriggerPowerUp('heal_potion'); // Immediately heals +5 (to maxHp - 2) and queues 3 pulses
  assert.equal(simHeal.currentHp, simHeal.maxHp - 2);
  assert.equal(simHeal.healPotionPulsesRemaining, 3);

  // Advance 20 ticks (0.33s) -> next pulse heals +2 to reach maxHp and cancels remaining pulses
  for (let i = 0; i < 20; i++) simHeal.tick();
  assert.equal(simHeal.currentHp, simHeal.maxHp, 'HP must never exceed maxHp');
  assert.equal(
    simHeal.healPotionPulsesRemaining,
    0,
    'Remaining heal potion pulses should stop once hero reaches full HP'
  );

  // Calling healHero when already at full HP does not exceed maxHp or spawn heal_pulse
  simHeal.visualEffects.length = 0;
  simHeal.healHero(20);
  assert.equal(simHeal.currentHp, simHeal.maxHp);
  assert.equal(
    simHeal.visualEffects.filter((fx) => fx.kind === 'heal_pulse').length,
    0,
    'Healing at full HP without Regrowth Evolution should not spawn heal_pulse'
  );

  // 3. Crit Burst spawns 'crit_starfall' visual effect on critical hits
  const simCrit = new Simulation({ seed: 9696, professionId: 'warden' });
  simCrit.debugSetCardLevel('crit_burst', 2);
  simCrit.visualEffects.length = 0;
  const dummy = simCrit.spawnEnemy('brute', simCrit.heroX + 1.5, simCrit.heroY, false)!;
  (simCrit as any).applyDamageToEnemy(dummy, 20, true, 0.2, ['slash']);
  const starfallFx = simCrit.visualEffects.find((fx) => fx.kind === 'crit_starfall');
  assert.ok(starfallFx, 'Crit Burst proc should spawn a crit_starfall visual effect');
  assert.equal(starfallFx.arcRad, 2);
});

test('Task Verification: Charger channel follow, Brute danger bump & moving charge, Ad revive freeze, Piercing Slash gap coverage, Tarot draft enemy gating, and Trinket Lv 1-3 progression', () => {
  // 1. Charger enemy (dasher) follows hero at reduced speed while channeling
  const simCharger = new Simulation({ seed: 1111, professionId: 'warden' });
  simCharger.enemies.length = 0;
  const charger = simCharger.spawnEnemy('dasher', simCharger.heroX + 4.0, simCharger.heroY, false)!;
  assert.equal(charger.archetypeId, 'dasher');

  // Step 1 tick -> charger enters telegraph
  simCharger.tick();
  assert.equal(charger.aiState, 'telegraph');
  assert.equal(charger.telegraphDuration, BALANCE_CONFIG.CHARGER_TELEGRAPH_DURATION_SEC);

  const prevX = charger.x;
  // Step 10 ticks (0.166s) during telegraph
  for (let i = 0; i < 10; i++) simCharger.tick();
  assert.equal(charger.aiState, 'telegraph');
  assert.ok(charger.x < prevX, 'Charger must keep moving towards hero during telegraph channel');
  const progress = 1 - charger.aiTimer / charger.telegraphDuration;
  assert.ok(progress > 0 && progress < 1, 'Telegraph progress must advance with timer');

  // 2. Brute enemy: bumped speed & damage, moving slam channel, and brute_slam_flash
  const simBrute = new Simulation({ seed: 2222, professionId: 'warden' });
  simBrute.enemies.length = 0;
  const brute = simBrute.spawnEnemy('brute', simBrute.heroX + 1.9, simBrute.heroY, false)!;
  assert.equal(brute.contactDamage, BALANCE_CONFIG.BRUTE_BASE_CONTACT_DAMAGE);
  assert.equal(brute.speed, BALANCE_CONFIG.BRUTE_BASE_SPEED);

  simBrute.tick();
  assert.equal(brute.aiState, 'telegraph');
  assert.equal(brute.telegraphDuration, BALANCE_CONFIG.BRUTE_TELEGRAPH_DURATION_SEC);

  const bruteStartX = brute.x;
  simBrute.tick();
  assert.ok(brute.x < bruteStartX, 'Brute must move towards hero while channeling slam');

  // Advance brute telegraph until attack frame
  simBrute.visualEffects.length = 0;
  while (brute.aiState === 'telegraph') {
    simBrute.tick();
  }
  assert.equal(brute.aiState, 'recover');
  const slamFlash = simBrute.visualEffects.find((fx) => fx.kind === 'brute_slam_flash');
  assert.ok(slamFlash, 'brute_slam_flash must spawn on the exact frame the slam attack resolves');

  // 3. Rewarded Ad Revive freezes all enemies for 2 seconds
  const simRevive = new Simulation({ seed: 3333, professionId: 'warden' });
  simRevive.enemies.length = 0;
  const e1 = simRevive.spawnEnemy('chaser', simRevive.heroX + 3.0, simRevive.heroY, false)!;
  const e2 = simRevive.spawnEnemy('brute', simRevive.heroX - 2.5, simRevive.heroY, false)!;

  simRevive.applyPlayerRevive({ isAdRevive: true });
  assert.equal(e1.freezeTimer, BALANCE_CONFIG.AD_REVIVE_FREEZE_SECONDS);
  assert.equal(e2.freezeTimer, BALANCE_CONFIG.AD_REVIVE_FREEZE_SECONDS);

  const e1FrozenX = e1.x;
  const e2FrozenX = e2.x;
  for (let i = 0; i < 30; i++) simRevive.tick(); // 0.5s into freeze
  assert.equal(e1.x, e1FrozenX, 'Frozen enemy 1 must not move');
  assert.equal(e2.x, e2FrozenX, 'Frozen enemy 2 must not move');
  assert.ok(e1.freezeTimer > 0, 'Freeze timer should still be active');

  // Advance past 2.0s
  for (let i = 0; i < 100; i++) simRevive.tick();
  assert.equal(e1.freezeTimer, 0);
  assert.equal(e2.freezeTimer, 0);
  simRevive.tick();
  assert.notEqual(e1.x, e1FrozenX, 'Normal enemy movement must resume after freeze expires');

  // 4. Piercing Slash weapon gap coverage
  const simSlash = new Simulation({ seed: 4444, professionId: 'warden' });
  simSlash.enemies.length = 0;
  const blade = simSlash.weapons.find((w) => w.id === 'garden_blade')!;
  blade.cooldownTimer = 0;

  // An enemy placed at 3.5u (outside basic blade reach 1.85+1.0 = 2.85u)
  const farEnemy = simSlash.spawnEnemy('chaser', simSlash.heroX + 3.5, simSlash.heroY, false)!;
  simSlash.tick();
  assert.equal(blade.phase, 'ready', 'Without Piercing Slash, enemy at 3.5u should not trigger blade');

  // Now give Piercing Slash card
  simSlash.cards.piercing_slash = 1;
  simSlash.tick();
  assert.equal(blade.phase, 'windup', 'With Piercing Slash, enemy at 3.5u must trigger blade to cover the gap');

  // 5. Botanical Tarot draft safe-distance gating
  const simDraft = new Simulation({ seed: 5555, professionId: 'warden' });
  simDraft.enemies.length = 0;
  // Hero spawn near enemy within basic blade reach (1.85u)
  simDraft.spawnEnemy('chaser', simDraft.heroX + 1.2, simDraft.heroY, false);
  assert.equal(simDraft.isHeroSafeForCardDraft(), false, 'Hero should not be safe for draft when enemy is within blade range');

  simDraft.enemies.length = 0;
  simDraft.spawnEnemy('chaser', simDraft.heroX + 4.0, simDraft.heroY, false);
  assert.equal(simDraft.isHeroSafeForCardDraft(), true, 'Hero is safe for draft when enemy is outside blade range');

  // 6. Trinket 3-tier upgrades and stat scaling
  const statsLv1 = computeHeroStats('warden', {}, ['aegis_leaf', 'clover_charm', 'magnet_root', 'wind_anklet'], [], {
    aegis_leaf: 1,
    clover_charm: 1,
    magnet_root: 1,
    wind_anklet: 1,
  });
  const statsLv2 = computeHeroStats('warden', {}, ['aegis_leaf', 'clover_charm', 'magnet_root', 'wind_anklet'], [], {
    aegis_leaf: 2,
    clover_charm: 2,
    magnet_root: 2,
    wind_anklet: 2,
  });
  const statsLv3 = computeHeroStats('warden', {}, ['aegis_leaf', 'clover_charm', 'magnet_root', 'wind_anklet'], [], {
    aegis_leaf: 3,
    clover_charm: 3,
    magnet_root: 3,
    wind_anklet: 3,
  });

  // Aegis Leaf: +10 max HP per level (+10 / +20 / +30)
  assert.equal(statsLv2.maxHp - statsLv1.maxHp, 10);
  assert.equal(statsLv3.maxHp - statsLv2.maxHp, 10);

  // Amber Magnet: +10% pickup radius per level (+20% base, +30%, +40%)
  assert.ok(statsLv2.pickupRadius > statsLv1.pickupRadius);
  assert.ok(statsLv3.pickupRadius > statsLv2.pickupRadius);

  // Sylph Feather Anklet: +3% speed/lv, Lv 2 grants +5% dodge, Lv 3 grants +1 extra dash
  assert.equal(statsLv1.dodgeChance, 0);
  assert.equal(statsLv2.dodgeChance, 0.05);
  assert.equal(statsLv3.dodgeChance, 0.05);
  assert.equal(statsLv1.extraDashCharges, 0);
  assert.equal(statsLv2.extraDashCharges, 0);
  assert.equal(statsLv3.extraDashCharges, 1);

  // Gilded Clover Charm: free rerolls up to 3 total
  const simClover1 = new Simulation({ seed: 7771, professionId: 'warden', equippedTrinkets: ['clover_charm'], trinketLevels: { clover_charm: 1 } });
  assert.equal(simClover1.freeRerollsRemaining, 1);
  const simClover3 = new Simulation({ seed: 7773, professionId: 'warden', equippedTrinkets: ['clover_charm'], trinketLevels: { clover_charm: 3 } });
  assert.equal(simClover3.freeRerollsRemaining, 3);
});

test('Unified Ads & Platform Manager: Lazy-loading, Capability queries, STUB provider simulation, and NoOp fallback', async () => {
  const { PlatformManager } = await import('../platform/PlatformManager');
  const { PlatformFeature } = await import('../platform/types');
  const { StubPlatformAdapter } = await import('../platform/providers/StubPlatformAdapter');
  const { NoOpLocalAdapter } = await import('../platform/providers/NoOpLocalAdapter');

  let paused = false;
  let muted = false;
  const hooks = {
    onPauseGame: () => { paused = true; },
    onResumeGame: () => { paused = false; },
    onMuteAudio: () => { muted = true; },
    onUnmuteAudio: () => { muted = false; },
  };

  // 1. Test STUB provider (default)
  const stubAdapter = new StubPlatformAdapter({ adDurationMs: 0 });
  const pm = new PlatformManager();
  await pm.initialize(hooks, stubAdapter);

  assert.equal(pm.provider, 'STUB');
  assert.equal(pm.canUse(PlatformFeature.REWARDED_ADS), true);
  assert.equal(pm.canUse(PlatformFeature.INTERSTITIAL_ADS), true);
  assert.equal(pm.canUse(PlatformFeature.CLOUD_SAVE), true);
  assert.equal(pm.canUse(PlatformFeature.LEADERBOARDS), true);
  assert.equal(pm.canUse(PlatformFeature.GAMEPLAY_TELEMETRY), true);

  // Rewarded ad simulates pause/mute and grants bonuses
  const rewardResult = await pm.requestRewardAd('reward_double_coins_v1');
  assert.equal(rewardResult.rewarded, true);
  assert.equal(rewardResult.rewardId, 'reward_double_coins_v1');
  assert.equal(paused, false, 'Audio/Game should resume after ad completion');
  assert.equal(muted, false, 'Audio should unmute after ad completion');

  // Interstitial ad
  const interstitialOk = await pm.requestInterstitialAd('post_run');
  assert.equal(interstitialOk, true);

  // Cloud Save & Load
  const saveOk = await pm.save('test_player_data', { coins: 999, level: 12 });
  assert.equal(saveOk, true);
  const loaded = await pm.load<{ coins: number; level: number }>('test_player_data');
  assert.deepEqual(loaded, { coins: 999, level: 12 });

  // 2. Test NoOp / Local / Itch.io fallback
  const noOpAdapter = new NoOpLocalAdapter();
  const pmNoOp = new PlatformManager();
  await pmNoOp.initialize(hooks, noOpAdapter);

  assert.equal(pmNoOp.provider, 'LocalOrItchIo');
  assert.equal(pmNoOp.canUse(PlatformFeature.REWARDED_ADS), false, 'Rewarded ads must be disabled on NoOp');
  assert.equal(pmNoOp.canUse(PlatformFeature.INTERSTITIAL_ADS), false, 'Interstitials must be disabled on NoOp');

  const noOpReward = await pmNoOp.requestRewardAd('reward_revive_run_v1');
  assert.equal(noOpReward.rewarded, false, 'NoOp must return false for rewarded ads');
  const noOpInterstitial = await pmNoOp.requestInterstitialAd();
  assert.equal(noOpInterstitial, false, 'NoOp must return false for interstitials');

  // 3. Test GameMonetizeAdapter lifecycle according to official MonetizeGame SDK spec
  const { GameMonetizeAdapter } = await import('../platform/providers/GameMonetizeAdapter');
  let gmPaused = false;
  let gmMuted = false;
  const gmHooks = {
    onPauseGame: () => { gmPaused = true; },
    onResumeGame: () => { gmPaused = false; },
    onMuteAudio: () => { gmMuted = true; },
    onUnmuteAudio: () => { gmMuted = false; },
  };

  const gmAdapter = new GameMonetizeAdapter({
    gameId: 'jyg60hwle8o4ch7vh9rn4wnajwztewgj',
    allowBannerAsRewardFallback: true,
  });

  // Mock GameMonetize ambient window.sdk
  (globalThis as any).window = globalThis.window || {};
  (globalThis as any).window.sdk = {
    showBanner: () => {
      // GameMonetize fires SDK_GAME_PAUSE when video opens, and SDK_GAME_START when video finishes
      setTimeout(() => {
        gmAdapter.handleGlobalSdkEvent('SDK_GAME_PAUSE');
        setTimeout(() => {
          gmAdapter.handleGlobalSdkEvent('SDK_GAME_START');
        }, 10);
      }, 5);
    },
  };

  await gmAdapter.init(gmHooks);
  assert.equal(gmAdapter.providerName, 'GameMonetize');
  assert.equal(gmAdapter.isFeatureSupported(PlatformFeature.REWARDED_ADS), true);
  assert.equal(gmAdapter.isFeatureSupported(PlatformFeature.INTERSTITIAL_ADS), true);

  // Rewarded ad for card reroll:
  const cardRerollAdResult = await gmAdapter.showRewardedAd('reward_card_reroll_v1');
  assert.equal(cardRerollAdResult.rewarded, true);
  assert.equal(cardRerollAdResult.rewardId, 'reward_card_reroll_v1');
  assert.equal(gmPaused, false, 'Game should resume after SDK_GAME_START');
  assert.equal(gmMuted, false, 'Audio should unmute after SDK_GAME_START');

  // Rewarded ad for loadout coins click (+100 coins):
  const coinsAdResult = await gmAdapter.showRewardedAd('reward_loadout_coins_v1');
  assert.equal(coinsAdResult.rewarded, true);
  assert.equal(coinsAdResult.rewardId, 'reward_loadout_coins_v1');

  // 4. Test GameDistributionAdapter lifecycle according to official GD-HTML5 SDK spec
  const { GameDistributionAdapter } = await import('../platform/providers/GameDistributionAdapter');
  let gdPaused = false;
  let gdMuted = false;
  const gdHooks = {
    onPauseGame: () => { gdPaused = true; },
    onResumeGame: () => { gdPaused = false; },
    onMuteAudio: () => { gdMuted = true; },
    onUnmuteAudio: () => { gdMuted = false; },
  };

  const gdAdapter = new GameDistributionAdapter({
    gameId: 'test-gd-game-id-12345',
  });

  // Mock GameDistribution ambient window.gdsdk
  (globalThis as any).window.gdsdk = {
    AdType: { Rewarded: 'rewarded', Interstitial: 'interstitial' },
    preloadAd: async () => {},
    showAd: async (type?: any) => {
      setTimeout(() => {
        (gdAdapter as any).handleGlobalSdkEvent('SDK_GAME_PAUSE');
        setTimeout(() => {
          if (type === 'rewarded' || type === (globalThis as any).window.gdsdk?.AdType?.Rewarded) {
            (gdAdapter as any).handleGlobalSdkEvent('SDK_REWARDED_WATCH_COMPLETE');
          }
          (gdAdapter as any).handleGlobalSdkEvent('SDK_GAME_START');
        }, 15);
      }, 5);
    },
  };

  await gdAdapter.init(gdHooks);
  assert.equal(gdAdapter.providerName, 'GameDistribution');
  assert.equal(gdAdapter.isFeatureSupported(PlatformFeature.REWARDED_ADS), true);
  assert.equal(gdAdapter.isFeatureSupported(PlatformFeature.INTERSTITIAL_ADS), true);

  // Interstitial ad:
  const gdInterstitialResult = await gdAdapter.showInterstitialAd();
  assert.equal(gdInterstitialResult, true);
  assert.equal(gdPaused, false, 'Game should resume after SDK_GAME_START');
  assert.equal(gdMuted, false, 'Audio should unmute after SDK_GAME_START');

  // Rewarded ad:
  const gdRewardResult = await gdAdapter.showRewardedAd('reward_arcana_persona_v1');
  assert.equal(gdRewardResult.rewarded, true);
  assert.equal(gdRewardResult.rewardId, 'reward_arcana_persona_v1');
  assert.equal(gdPaused, false, 'Game should resume after rewarded ad finishes');
  assert.equal(gdMuted, false, 'Audio should unmute after rewarded ad finishes');
});

test('Seed Blades strikes random enemy within range, Aegis Aura fades & blinks before disappearing, and upgraded Clover Charm tracks remaining free rerolls', async () => {
  const { computeAegisAuraBlinkAlpha } = await import('../view/renderers/heros/common');

  // 1. Seed Blades strikes random enemies within range instead of always locking onto the closest enemy
  const sim = new Simulation({
    seed: 4242,
    professionId: 'seeker',
    startingWeaponId: 'seed_blades',
    equippedTrinkets: ['clover_charm'],
    trinketLevels: { clover_charm: 3 },
  });
  sim.enemies.length = 0;

  // Spawn 4 enemies at different distances within Seed Blades range (5.2u * 1.15 = 5.98u)
  const eClosest = sim.spawnEnemy('chaser', sim.heroX + 1.2, sim.heroY, false)!;
  const eMid = sim.spawnEnemy('chaser', sim.heroX, sim.heroY + 2.8, false)!;
  const eFar1 = sim.spawnEnemy('chaser', sim.heroX - 3.9, sim.heroY, false)!;
  const eFar2 = sim.spawnEnemy('chaser', sim.heroX, sim.heroY - 4.8, false)!;
  for (const e of [eClosest, eMid, eFar1, eFar2]) {
    e.hp = 9999;
    e.maxHp = 9999;
    e.speed = 0;
  }

  const targetedIds = new Set<number>();
  for (let i = 0; i < 24; i++) {
    const picked = sim.acquireRandomTargetInRange(6.0);
    assert.ok(picked, 'Should pick an enemy in range');
    targetedIds.add(picked.id);
  }
  assert.ok(
    targetedIds.size >= 3,
    `Seed Blades random targeting should strike multiple different enemies in range rather than only the closest (got ${targetedIds.size} distinct targets)`
  );

  // Verify actual Seed Blades weapon attack locks onto non-closest enemies across swings
  const swingAngles = new Set<string>();
  const sbWeapon = sim.weapons.find((w) => w.id === 'seed_blades')!;
  for (let s = 0; s < 15; s++) {
    sbWeapon.phase = 'ready';
    sbWeapon.cooldownTimer = 0;
    sim.tick(); // transitions ready -> windup and locks onto a random enemy in range
    swingAngles.add(sbWeapon.lockedAngle.toFixed(2));
  }
  assert.ok(
    swingAngles.size >= 2,
    'Seed Blades weapon attacks should lock onto random enemies at different angles instead of only the closest enemy'
  );

  // 2. Aegis Aura fade-blink before disappearing (both on timer expiration and on shield break)
  assert.equal(
    computeAegisAuraBlinkAlpha(12.0, 40, 0),
    1.0,
    'Aegis Aura should be at full 1.0 alpha when shieldTimer > 3.5s'
  );
  const warningSamples: number[] = [];
  for (let t = 3.4; t >= 0.1; t -= 0.15) {
    warningSamples.push(computeAegisAuraBlinkAlpha(t, 40, 0));
  }
  const minWarnAlpha = Math.min(...warningSamples);
  const maxWarnAlpha = Math.max(...warningSamples);
  assert.ok(
    minWarnAlpha < 0.35 && maxWarnAlpha > 0.65,
    `Aegis Aura should oscillate (blink) and fade during final 3.5s (min=${minWarnAlpha.toFixed(2)}, max=${maxWarnAlpha.toFixed(2)})`
  );
  assert.ok(
    computeAegisAuraBlinkAlpha(0.15, 40, 0) < computeAegisAuraBlinkAlpha(3.4, 40, 0),
    'Aegis Aura fade envelope should decrease as shieldTimer approaches 0'
  );

  // Breaking shield by damage sets shieldBreakFadeTimer = 0.45s so it fade-blinks before disappearing
  sim.debugTriggerPowerUp('shield');
  assert.equal(sim.shieldHp, 40);
  sim.invulnTimer = 0;
  sim.dashIframeTimer = 0;
  sim.cardPickInvisTimer = 0;
  (sim as any).damageHero(55);
  assert.equal(sim.shieldHp, 0, 'Shield HP should be depleted by heavy hit');
  assert.ok(
    sim.shieldBreakFadeTimer > 0.4,
    'Depleting shield HP should trigger shieldBreakFadeTimer so Aegis Aura fade-blinks before disappearing'
  );
  assert.ok(
    computeAegisAuraBlinkAlpha(0, 0, sim.shieldBreakFadeTimer) > 0,
    'Aegis Aura should remain partially visible while shieldBreakFadeTimer > 0'
  );

  // 3. Upgraded Gilded Clover Charm (Lv 3) starts with 3 free rerolls and decrements properly
  assert.equal(sim.maxFreeRerolls, 3);
  assert.equal(sim.freeRerollsRemaining, 3);
  assert.equal(sim.freeRerollUsed, false);
  sim.triggerLevelUpCardDraft();
  sim.rerollCardDraft('free');
  assert.equal(sim.freeRerollsRemaining, 2);
  assert.equal(sim.freeRerollUsed, false);
  sim.rerollCardDraft('free');
  assert.equal(sim.freeRerollsRemaining, 1);
  assert.equal(sim.freeRerollUsed, false);
  sim.rerollCardDraft('free');
  assert.equal(sim.freeRerollsRemaining, 0);
  assert.equal(sim.freeRerollUsed, true);
});

test('Curse Sigils: 4 sigils catalog, 3-level upgrades, multi-sigil stacking reward multiplier, and Withered Root regenMultiplier', () => {
  // 1. Verify all 4 sigils exist in CURSES with 3 levels and expected costs/art
  assert.equal(CURSES.length, 4);
  const ids = CURSES.map((c) => c.id);
  assert.deepEqual(ids, ['swarm_brand', 'frenzied_flora', 'fragile_bark', 'withered_root']);

  const withered = CURSES.find((c) => c.id === 'withered_root')!;
  assert.equal(withered.name, 'Withered Root Sigil');
  assert.equal(withered.costCoins, 250);
  assert.equal(withered.upgradeCostCoinsLv2, 260);
  assert.equal(withered.upgradeCostCoinsLv3, 420);
  assert.equal(withered.art, '/assets/sigils/withered-root.png');
  assert.equal(withered.levels[0].regenMultiplier, 0.5);
  assert.equal(withered.levels[1].regenMultiplier, 0.35);
  assert.equal(withered.levels[2].regenMultiplier, 0.25);

  // 2. Multi-sigil stacking reward multiplier: 1 + sum(activeSigil.rewardBonus at current level)
  assert.equal(calculateCurseRewardMultiplier([]), 1.0);
  const allLv1Mult = calculateCurseRewardMultiplier(
    ['swarm_brand', 'frenzied_flora', 'fragile_bark', 'withered_root'],
    { swarm_brand: 1, frenzied_flora: 1, fragile_bark: 1, withered_root: 1 }
  );
  // 1 + 0.25 + 0.30 + 0.35 + 0.40 = 2.30
  assert.ok(Math.abs(allLv1Mult - 2.3) < 1e-6, `Expected 2.30 at Lv 1, got ${allLv1Mult}`);

  const allLv3Mult = calculateCurseRewardMultiplier(
    ['swarm_brand', 'frenzied_flora', 'fragile_bark', 'withered_root'],
    { swarm_brand: 3, frenzied_flora: 3, fragile_bark: 3, withered_root: 3 }
  );
  // 1 + 0.60 + 0.65 + 0.70 + 0.75 = 3.70
  assert.ok(Math.abs(allLv3Mult - 3.7) < 1e-6, `Expected 3.70 at Lv 3, got ${allLv3Mult}`);

  // 3. computeHeroStats scaling across Lv 1, Lv 2, Lv 3 for all 4 sigils
  const baseStats = computeHeroStats('warden', {}, [], []);
  assert.equal(baseStats.regenMultiplier, 1.0);
  assert.equal(baseStats.enemySpeedMult, 1.0);
  assert.equal(baseStats.enemyTelegraphSpeedMult, 1.0);
  assert.equal(baseStats.enemySpawnBudgetMult, 1.0);

  const stackedLv2 = computeHeroStats(
    'warden',
    {},
    [],
    ['swarm_brand', 'frenzied_flora', 'fragile_bark', 'withered_root'],
    {},
    { swarm_brand: 2, frenzied_flora: 2, fragile_bark: 2, withered_root: 2 }
  );
  assert.equal(stackedLv2.maxHp, 70, 'Brittle Bark Lv 2 (-30% Max HP) should reduce 100 Max HP to 70');
  assert.ok(Math.abs(stackedLv2.enemySpeedMult - 1.3) < 1e-6);
  assert.ok(Math.abs(stackedLv2.enemyTelegraphSpeedMult - 1.3) < 1e-6);
  assert.ok(Math.abs(stackedLv2.enemySpawnBudgetMult - 1.35) < 1e-6);
  assert.ok(Math.abs(stackedLv2.regenMultiplier - 0.35) < 1e-6);

  const stackedLv3 = computeHeroStats(
    'warden',
    {},
    [],
    ['swarm_brand', 'frenzied_flora', 'fragile_bark', 'withered_root'],
    {},
    { swarm_brand: 3, frenzied_flora: 3, fragile_bark: 3, withered_root: 3 }
  );
  assert.equal(stackedLv3.maxHp, 65, 'Brittle Bark Lv 3 (-35% Max HP) should reduce 100 Max HP to 65');
  assert.ok(Math.abs(stackedLv3.enemySpeedMult - 1.4) < 1e-6);
  assert.ok(Math.abs(stackedLv3.enemyTelegraphSpeedMult - 1.4) < 1e-6);
  assert.ok(Math.abs(stackedLv3.enemySpawnBudgetMult - 1.5) < 1e-6);
  assert.ok(Math.abs(stackedLv3.regenMultiplier - 0.25) < 1e-6);

  // 4. Simulation integration: Withered Root slows HP regen, Dash recharge, and Shield recharge
  const simNormal = new Simulation({
    seed: 1010,
    professionId: 'warden',
    equippedTrinkets: ['aegis_leaf'],
    activeCurses: [],
  });
  const simWitheredLv3 = new Simulation({
    seed: 1010,
    professionId: 'warden',
    equippedTrinkets: ['aegis_leaf'],
    activeCurses: ['withered_root'],
    curseLevels: { withered_root: 3 },
  });
  assert.equal(simNormal.stats.regenMultiplier, 1.0);
  assert.equal(simWitheredLv3.stats.regenMultiplier, 0.25);

  // Dash recharge comparison
  simNormal.requestDash(0);
  simWitheredLv3.requestDash(0);
  for (let i = 0; i < 30; i++) {
    simNormal.tick();
    simWitheredLv3.tick();
  }
  assert.ok(
    simWitheredLv3.dashCooldownTimer > simNormal.dashCooldownTimer,
    `Withered Root should slow Dash cooldown recovery (${simWitheredLv3.dashCooldownTimer} vs ${simNormal.dashCooldownTimer})`
  );

  // Shield recharge comparison (partially depleted active shield recharges at 2.0 * regenMultiplier HP/sec)
  simNormal.shieldTimer = 15;
  simNormal.shieldMaxHp = 40;
  simNormal.shieldHp = 10;
  simWitheredLv3.shieldTimer = 15;
  simWitheredLv3.shieldMaxHp = 40;
  simWitheredLv3.shieldHp = 10;
  simNormal.enemies.length = 0;
  simWitheredLv3.enemies.length = 0;
  for (let i = 0; i < 180; i++) {
    simNormal.tick();
    simWitheredLv3.tick();
  }
  assert.ok(
    simNormal.shieldHp > simWitheredLv3.shieldHp,
    `Withered Root Lv 3 (0.25x) should slow shield recharge progression (Withered shieldHp=${simWitheredLv3.shieldHp} vs Normal shieldHp=${simNormal.shieldHp})`
  );

  // 5. SaveManager persistence & reconciliation of curseLevels
  const baseSave = createDefaultSaveData();
  assert.equal(baseSave.unlocks.curseLevels.swarm_brand, 1);
  const remoteSave = createDefaultSaveData();
  remoteSave.unlocks.curses = ['swarm_brand', 'withered_root'];
  remoteSave.unlocks.curseLevels = { swarm_brand: 3, withered_root: 2 };
  const merged = reconcileSaveData(JSON.stringify(baseSave), JSON.stringify(remoteSave));
  assert.equal(merged.state.unlocks.curseLevels.swarm_brand, 3);
  assert.equal(merged.state.unlocks.curseLevels.withered_root, 2);
});

test('Item pickup and Perfect Dodge do not spawn floating text', () => {
  const sim = new Simulation({ seed: 2027, professionId: 'warden' });
  const floatingTexts: string[] = [];
  let perfectDodgeEmitted = false;
  let powerUpPickedCount = 0;

  sim.events.on('FloatingText', (ev) => {
    floatingTexts.push(ev.text);
  });
  sim.events.on('PerfectDodge', () => {
    perfectDodgeEmitted = true;
  });
  sim.events.on('PowerUpPicked', () => {
    powerUpPickedCount++;
  });

  // 1. Trigger a Perfect Dodge near a telegraphing enemy -> awards SP & emits PerfectDodge, but NO FloatingText
  const enemy = sim.spawnEnemy('dasher', sim.heroX + 1.5, sim.heroY, false)!;
  enemy.aiState = 'telegraph';
  const dashed = sim.requestDash(0);
  assert.equal(dashed, true);
  assert.equal(perfectDodgeEmitted, true, 'PerfectDodge event should still fire');
  assert.equal(
    floatingTexts.some((t) => t.toUpperCase().includes('PERFECT DODGE')),
    false,
    'Perfect Dodge must not spawn PERFECT DODGE floating text'
  );

  // 2. Collect all power-up items & heal_potion -> stores in heldPowerUps & emits PowerUpPicked, but NO FloatingText
  for (const id of ['shield', 'freeze', 'fire_breath', 'magnet', 'time_slow', 'heal_potion'] as const) {
    sim.debugSpawnPowerUpDrop(id);
    const pickup = sim.pickups[sim.pickups.length - 1]!;
    pickup.x = sim.heroX;
    pickup.y = sim.heroY;
    sim.tick();
  }
  assert.equal(powerUpPickedCount, 6, 'All 6 item pickups should be collected');
  assert.equal(
    floatingTexts.length,
    0,
    `Picking up items must not spawn item title floating text, got: ${floatingTexts.join(', ')}`
  );
});

test('Chain Lightning Rework: Targeting logic, jump progression, mid-chain enemy death resilience, and buffer reuse', () => {
  // Test pure targeting function with mock enemies
  const mockEnemies: any[] = [
    { id: 1, x: 2.0, y: 0, hp: 50, koTimer: 0 },
    { id: 2, x: 5.5, y: 0, hp: 40, koTimer: 0 },
    { id: 3, x: 8.8, y: 0, hp: 30, koTimer: 0 },
    { id: 4, x: 25.0, y: 0, hp: 100, koTimer: 0 }, // Out of range of all jumps
  ];

  // Config: initial range 4.0 from caster (0, 0), chainRange 4.0, maxChains 3
  const config = {
    range: 4.0,
    chainRange: 4.0,
    maxChains: 3,
  };

  const steps = findChainLightningTargets(0, 0, mockEnemies, config);
  assert.equal(steps.length, 3, 'Should chain through 3 targets (E1 -> E2 -> E3)');

  // Step 0: Caster -> E1
  assert.equal(steps[0]!.targetId, 1);
  assert.equal(steps[0]!.fromX, 0);
  assert.equal(steps[0]!.fromY, 0);
  assert.equal(steps[0]!.toX, 2.0);

  // Step 1: E1 -> E2 (within chainRange 4.0 of E1, even though distance from caster is 5.5!)
  assert.equal(steps[1]!.targetId, 2);
  assert.equal(steps[1]!.fromX, 2.0);
  assert.equal(steps[1]!.toX, 5.5);

  // Step 2: E2 -> E3 (within chainRange 4.0 of E2)
  assert.equal(steps[2]!.targetId, 3);
  assert.equal(steps[2]!.fromX, 5.5);
  assert.equal(steps[2]!.toX, 8.8);

  // Resilience against mid-chain enemy death:
  // If an enemy dies mid-chain, the stored strike point ensures subsequent jumps continue
  const dyingEnemies: any[] = [
    { id: 10, x: 2.0, y: 0, hp: 10, koTimer: 0 },
    { id: 20, x: 5.0, y: 0, hp: 100, koTimer: 0 },
  ];
  const stepsWithDeath = findChainLightningTargets(0, 0, dyingEnemies, config);
  assert.equal(stepsWithDeath.length, 2);
  assert.equal(stepsWithDeath[0]!.targetId, 10);
  // Emulate death: hp becomes 0
  dyingEnemies[0]!.hp = 0;
  // Second step was calculated from (2.0, 0)
  assert.equal(stepsWithDeath[1]!.targetId, 20);
  assert.equal(stepsWithDeath[1]!.fromX, 2.0);

  // Buffer reuse check: returned array is populated without throwing
  const bufA = findChainLightningTargets(0, 0, mockEnemies, config);
  const bufB = findChainLightningTargets(0, 0, mockEnemies, config);
  assert.equal(bufA, bufB, 'Should reuse pre-allocated buffer for zero hot-path allocations');

  // Verify full simulation weapon swing with chain lightning
  const sim = new Simulation({ seed: 42, startingWeaponId: 'chain_lightning' });
  const e1 = sim.spawnEnemy('brute', 2.0, 0, false)!;
  const e2 = sim.spawnEnemy('brute', 5.8, 0, false)!;
  const e1StartHp = e1.hp;
  const e2StartHp = e2.hp;

  // Trigger attack
  sim.tick();
  const weapon = sim.weapons.find((w) => w.id === 'chain_lightning');
  assert.ok(weapon);

  // Advance simulation to weapon trigger
  for (let i = 0; i < 70; i++) {
    sim.tick();
    if (e1.hp < e1StartHp) break;
  }
  assert.ok(e1.hp < e1StartHp, 'Target 1 should receive chain lightning damage');
  assert.ok(e2.hp < e2StartHp, 'Target 2 should receive chained lightning damage');

  const dmgE1 = e1StartHp - e1.hp;
  const dmgE2 = e2StartHp - e2.hp;
  assert.ok(
    dmgE1 > dmgE2,
    `Target 1 damage (${dmgE1}) must be strictly greater than Target 2 damage (${dmgE2}) due to per-bounce falloff`
  );
  assert.ok(
    Math.abs(dmgE2 / dmgE1 - CHAIN_LIGHTNING_CONFIG.damageFalloff) <= 0.1,
    `Target 2 damage should be ~${CHAIN_LIGHTNING_CONFIG.damageFalloff * 100}% of Target 1 damage`
  );

  // Verify lightning start point follows hero on movement
  const initialBolt = sim.visualEffects.find(
    (fx) => fx.kind === 'chain_bolt' && fx.angle === 0
  );
  if (initialBolt) {
    const origBoltX = initialBolt.x;
    sim.heroX += 3.5;
    sim.heroY -= 2.0;
    sim.tick();
    assert.equal(
      initialBolt.x,
      sim.heroX,
      'Lightning start x must follow heroX upon movement'
    );
    assert.equal(
      initialBolt.y,
      sim.heroY,
      'Lightning start y must follow heroY upon movement'
    );
    assert.notEqual(initialBolt.x, origBoltX);
  }
});

test('Chain Bloom: Bolder chain lightning approach with multi-chain synergy and isBloom flag', () => {
  const sim = new Simulation({ seed: 100, startingWeaponId: 'arbalete' });
  sim.cards.chain_bloom = 3;

  // Spawn an initial enemy and a chained enemy nearby
  const e1 = sim.spawnEnemy('brute', 2.0, 0, false)!;
  const e2 = sim.spawnEnemy('brute', 4.0, 0, false)!;
  sim.spatialGrid.insert(e1.id, e1.x, e1.y, e1.radius);
  sim.spatialGrid.insert(e2.id, e2.x, e2.y, e2.radius);
  const e2HpBefore = e2.hp;

  // Simulate projectile hitting enemy 1
  sim.projectiles.push({
    id: 9999,
    isEnemy: false,
    x: e1.x,
    y: e1.y,
    prevX: e1.x - 0.5,
    prevY: e1.y,
    vx: 10,
    vy: 0,
    radius: 0.3,
    damage: 30,
    isCrit: false,
    pierceRemaining: 0,
    lifeTimer: 1.0,
    color: 0xffffff,
    weaponTags: ['projectile'],
    hitEnemyIds: new Set(),
  });

  sim.tick();

  assert.ok(e2.hp < e2HpBefore, 'Chain Bloom should damage nearby chained enemy');
  const bloomFx = sim.visualEffects.find((fx) => fx.isBloom);
  assert.ok(bloomFx, 'Chain Bloom visual effect should have isBloom = true');
  assert.equal(bloomFx.kind, 'chain_bolt');
});

test('Garden Blade level-up progression increases damage, range, and area on each level', () => {
  const sim = new Simulation({
    seed: 1234,
    startingWeaponId: 'garden_blade',
    professionId: 'warden',
    unlockedWeapons: ['garden_blade'],
  });

  // 1. Verify strict per-level stat growth from Lv 1 to Lv 8
  let prevStats = sim.getGardenBladeStats(1, false);
  assert.equal(prevStats.damage, 14 * sim.stats.damageMult, 'Lv 1 damage should equal base 14 * damageMult');
  assert.equal(prevStats.reach, 1.85 * sim.stats.reachMult, 'Lv 1 reach should equal base 1.85u * reachMult');
  assert.equal(prevStats.arcDeg, 115 * sim.stats.areaMult, 'Lv 1 arc should equal base 115 deg * areaMult');
  assert.equal(prevStats.areaMult, 1.0 * sim.stats.areaMult, 'Lv 1 areaMult should equal base 1.0 * areaMult');

  for (let lv = 2; lv <= 8; lv++) {
    const currentStats = sim.getGardenBladeStats(lv, false);
    assert.ok(
      currentStats.damage > prevStats.damage,
      `Garden Blade Lv ${lv} damage (${currentStats.damage}) must be strictly higher than Lv ${lv - 1} (${prevStats.damage})`
    );
    assert.ok(
      currentStats.reach > prevStats.reach,
      `Garden Blade Lv ${lv} reach (${currentStats.reach}) must be strictly higher than Lv ${lv - 1} (${prevStats.reach})`
    );
    assert.ok(
      currentStats.arcDeg > prevStats.arcDeg,
      `Garden Blade Lv ${lv} arcDeg (${currentStats.arcDeg}) must be strictly wider than Lv ${lv - 1} (${prevStats.arcDeg})`
    );
    assert.ok(
      currentStats.arcRad > prevStats.arcRad,
      `Garden Blade Lv ${lv} arcRad must be strictly wider than Lv ${lv - 1}`
    );
    assert.ok(
      currentStats.areaMult > prevStats.areaMult,
      `Garden Blade Lv ${lv} areaMult (${currentStats.areaMult}) must be strictly higher than Lv ${lv - 1} (${prevStats.areaMult})`
    );
    prevStats = currentStats;
  }

  // 2. Verify milestone cooldown reductions at Lv 4 and Lv 7
  const cdLv1 = sim.getGardenBladeStats(1, false).cooldown;
  const cdLv4 = sim.getGardenBladeStats(4, false).cooldown;
  const cdLv7 = sim.getGardenBladeStats(7, false).cooldown;
  assert.ok(cdLv4 < cdLv1, 'Cooldown at Lv 4 should be reduced compared to Lv 1');
  assert.ok(cdLv7 < cdLv4, 'Cooldown at Lv 7 should be reduced compared to Lv 4');

  // 3. Verify Evolved Verdant Edge has highest stats
  const evolvedStats = sim.getGardenBladeStats(8, true);
  assert.ok(evolvedStats.damage > prevStats.damage, 'Evolved blade damage should exceed Lv 8');
  assert.ok(evolvedStats.reach > prevStats.reach, 'Evolved blade reach should exceed Lv 8');
  assert.ok(evolvedStats.arcDeg > prevStats.arcDeg, 'Evolved blade arc should exceed Lv 8');

  // 4. Hitbox Range Scaling Verification in Combat:
  // Enemy radius for chaser is 0.4u.
  // Lv 1 reach = 1.85u -> maxDist = 1.85 + 0.4 = 2.25u.
  // Lv 3 reach = 2.01u -> maxDist = 2.01 + 0.4 = 2.41u.
  // Place target at x = 2.30u (within reach of Lv 3, but outside Lv 1).
  sim.enemies = [];
  sim.spatialGrid.clear();
  sim.visualEffects = [];
  sim.debugSetWeaponLevel('garden_blade', 1, false);
  const targetFar = sim.spawnEnemy('chaser', 2.30, 0, false)!;
  sim.spatialGrid.insert(targetFar.id, targetFar.x, targetFar.y, targetFar.radius);
  const targetFarHpBefore = targetFar.hp;

  const blade = sim.weapons.find((w) => w.id === 'garden_blade')!;
  blade.phase = 'ready';
  blade.cooldownTimer = 0;
  blade.lockedAngle = 0;
  blade.lockedTargetX = targetFar.x;
  blade.lockedTargetY = targetFar.y;

  // Fire attack at Lv 1
  const statsLv1 = sim.getGardenBladeStats(1, false);
  (sim as any).fireWeaponAttack(blade, 'arc', statsLv1.damage, statsLv1.reach, statsLv1.areaMult, false);
  assert.equal(targetFar.hp, targetFarHpBefore, 'Enemy at 2.30u should NOT take damage from Lv 1 Garden Blade (reach 1.85u)');

  // Fire attack at Lv 3 (reach 2.01u)
  sim.debugSetWeaponLevel('garden_blade', 3, false);
  const statsLv3 = sim.getGardenBladeStats(3, false);
  (sim as any).fireWeaponAttack(blade, 'arc', statsLv3.damage, statsLv3.reach, statsLv3.areaMult, false);
  assert.ok(targetFar.hp < targetFarHpBefore, 'Enemy at 2.30u MUST take damage from Lv 3 Garden Blade (reach 2.01u)');

  // 5. Hitbox Arc/Area Scaling Verification in Combat:
  // Place enemy at radius 1.6u, angle 82 deg off-center.
  // With Warden areaMult (1.1):
  // Lv 1 arc is 126.5 deg (half-arc = 63.25 deg) + 14.48 deg padding = 77.73 deg. At 82 deg, outside arc!
  // Lv 4 arc is 145.48 deg (half-arc = 72.74 deg) + 14.48 deg padding = 87.22 deg. At 82 deg, inside arc!
  sim.enemies = [];
  sim.spatialGrid.clear();
  sim.debugSetWeaponLevel('garden_blade', 1, false);
  const angleOffCenter = (82 * Math.PI) / 180;
  const arcTarget = sim.spawnEnemy(
    'chaser',
    Math.cos(angleOffCenter) * 1.6,
    Math.sin(angleOffCenter) * 1.6,
    false
  )!;
  sim.spatialGrid.insert(arcTarget.id, arcTarget.x, arcTarget.y, arcTarget.radius);
  const arcTargetHpBefore = arcTarget.hp;

  blade.phase = 'ready';
  blade.cooldownTimer = 0;
  blade.lockedAngle = 0;
  blade.lockedTargetX = 2.0;
  blade.lockedTargetY = 0;

  // Fire attack at Lv 1 (115 deg * 1.1 arc)
  (sim as any).fireWeaponAttack(blade, 'arc', statsLv1.damage, statsLv1.reach, statsLv1.areaMult, false);
  assert.equal(arcTarget.hp, arcTargetHpBefore, 'Enemy at 82 deg should NOT take damage from Lv 1 Garden Blade');

  // Fire attack at Lv 4 (widened arc)
  sim.debugSetWeaponLevel('garden_blade', 4, false);
  const statsLv4 = sim.getGardenBladeStats(4, false);
  (sim as any).fireWeaponAttack(blade, 'arc', statsLv4.damage, statsLv4.reach, statsLv4.areaMult, false);
  assert.ok(arcTarget.hp < arcTargetHpBefore, 'Enemy at 82 deg MUST take damage from Lv 4 Garden Blade');

  // 6. Visual Effects Radius & ArcRad scale with blade level
  sim.visualEffects = [];
  (sim as any).fireWeaponAttack(blade, 'arc', statsLv4.damage, statsLv4.reach, statsLv4.areaMult, false);
  const slashFx = sim.visualEffects.find((fx: any) => fx.kind === 'slash_arc')!;
  assert.ok(slashFx, 'Must spawn slash_arc visual effect');
  assert.equal(slashFx.radius, statsLv4.reach, 'Visual effect radius should match weapon reach');
  assert.equal(slashFx.arcRad, statsLv4.arcRad, 'Visual effect arcRad should match weapon arcRad');

  // 7. Verify levelUpDescriptions clearly outline damage, range, and area improvements
  const desc = WEAPONS.garden_blade.levelUpDescriptions;
  assert.equal(desc.length, 8);
  for (let i = 1; i < desc.length; i++) {
    assert.ok(desc[i].includes('Damage'), `Level ${i + 1} description should mention Damage: "${desc[i]}"`);
    assert.ok(desc[i].includes('Range'), `Level ${i + 1} description should mention Range: "${desc[i]}"`);
    assert.ok(desc[i].includes('Area'), `Level ${i + 1} description should mention Area: "${desc[i]}"`);
  }
});

test('Overhead Lightning Strike: New lightning style rendering on lightning-marked enemy taking damage', () => {
  const sim = new Simulation({ seed: 42, startingWeaponId: 'garden_blade' });
  const enemy = sim.spawnEnemy('brute', 3.0, 0, false)!;

  // 1. Initial lightning hit marks the enemy with Storm Mark debuff
  (sim as any).applyDamageToEnemy(enemy, 15, false, 0, ['lightning']);
  assert.ok(enemy.stormMarkTimer > 4.5, 'Enemy must receive Storm Mark debuff when struck by lightning');

  // 2. Any subsequent attack detonates the mark with overhead lightning strike
  (sim as any).applyDamageToEnemy(enemy, 10, false, 0, ['slash']);
  assert.equal(enemy.stormMarkTimer, 0, 'Storm Mark must be consumed upon detonation');

  const strikeFx = sim.visualEffects.find((fx) => fx.kind === 'lightning_strike');
  assert.ok(strikeFx, 'Overhead lightning_strike visual effect must be spawned');
  assert.equal(strikeFx.color, CHAIN_LIGHTNING_CONFIG.strike.colors.midGlow);

  // 3. Verify new lightning style rendering pipeline
  const strokeCalls: any[] = [];
  const fillCalls: any[] = [];
  const fakeGraphics: any = {
    moveTo: () => fakeGraphics,
    lineTo: () => fakeGraphics,
    stroke: (opts: any) => {
      strokeCalls.push(opts);
      return fakeGraphics;
    },
    circle: () => fakeGraphics,
    fill: (opts: any) => {
      fillCalls.push(opts);
      return fakeGraphics;
    },
  };

  // Execute drawing mid-flight (timeElapsed = 0.05s)
  strikeFx.timer = strikeFx.maxTimer - 0.05;
  assert.doesNotThrow(() => {
    drawLightningStrikeEffect(fakeGraphics, strikeFx, 1.0);
  });

  // Verify multi-layered glow strokes and core were rendered (at least 4 main layers + branches)
  assert.ok(strokeCalls.length >= 4, 'Must render at least 4 layered strokes (outer, mid, inner, core)');
  assert.ok(fillCalls.length >= 2, 'Must render ground impact flash and overhead cloud origin flash');

  // Verify that once the effect expires, nothing is drawn (no lingering graphics)
  strokeCalls.length = 0;
  fillCalls.length = 0;
  strikeFx.timer = 0; // expired
  drawLightningStrikeEffect(fakeGraphics, strikeFx, 0.0);
  assert.equal(strokeCalls.length, 0, 'Expired strike must not draw strokes');
  assert.equal(fillCalls.length, 0, 'Expired strike must not draw fills');
});

test('Dash high velocity removal and extended invulnerability coverage', () => {
  const sim = new Simulation({
    seed: 8888,
    professionId: 'warden',
    startingWeaponId: 'garden_blade',
  });

  // 1. Dash with stationary input (no movement intent)
  sim.setMoveIntent(0, 0);
  assert.equal(sim.requestDash(0), true);

  // During active dash (dashTimer > 0), hero moves at high dash speed
  sim.tick();
  assert.ok(sim.heroVx > 10, 'Hero should have high velocity during the active dash burst');
  assert.equal(sim.heroVy, 0);

  // Tick until dashTimer reaches 0 (total 0.14s = 9 ticks)
  for (let i = 0; i < 8; i++) {
    sim.tick();
    // Verify invulnerability covers the whole dash duration
    assert.ok(sim.invulnTimer > 0, 'Hero must be invulnerable during the entire dash duration');
    assert.equal(sim.isHeroDashInvisible(), true, 'Hero must have dash i-frames during dash duration');
  }

  // Dash has now completed: heroVx must immediately reset to 0 without residual high velocity slide
  assert.equal(sim.dashTimer, 0, 'Dash timer should be completed');
  assert.equal(sim.heroVx, 0, 'Hero X velocity must be 0 immediately after dash completion with no movement intent');
  assert.equal(sim.heroVy, 0, 'Hero Y velocity must be 0 immediately after dash completion');

  // Verify dash range was slightly increased from 2.6u to 3.2u
  const posAfterDashX = sim.heroX;
  assert.equal(Simulation.DASH_DISTANCE_U, 3.2, 'Dash distance should be set to 3.2 units');
  assert.ok(posAfterDashX >= 3.0, `Dash travel distance should exceed old 2.6u, got ${posAfterDashX}`);

  // Verify that on subsequent ticks, hero remains completely stopped (no sliding forward)
  sim.tick();
  assert.equal(sim.heroX, posAfterDashX, 'Hero should not slide forward after dash ends');

  // Hero still maintains invulnerability / i-frames right after dash arrival to safely recover
  assert.ok(sim.invulnTimer > 0, 'Invulnerability should safely cover post-dash arrival');
  assert.equal(sim.isHeroDashInvisible(), true, 'I-frames should safely cover post-dash arrival');

  // 2. Dash with active movement intent: velocity should seamlessly drop to walk speed, not lingering dash velocity
  const simMoving = new Simulation({
    seed: 8889,
    professionId: 'warden',
    startingWeaponId: 'garden_blade',
  });
  simMoving.setMoveIntent(1, 0);
  assert.equal(simMoving.requestDash(0), true);

  // Run through active dash duration
  for (let i = 0; i < 9; i++) {
    simMoving.tick();
  }
  assert.equal(simMoving.dashTimer, 0);
  assert.ok(
    Math.abs(simMoving.heroVx - simMoving.stats.moveSpeed) < 1e-4,
    `Hero X velocity should reset immediately to moveSpeed (${simMoving.stats.moveSpeed}), but got ${simMoving.heroVx}`
  );

  // 3. Stormcaller profession should receive 0.38s invulnerability window
  const simStorm = new Simulation({
    seed: 8890,
    professionId: 'stormcaller',
    startingWeaponId: 'chain_lightning',
  });
  simStorm.requestDash(0);
  assert.ok(
    simStorm.dashIframeTimer >= 0.37,
    `Stormcaller should receive ~0.38s i-frames, got ${simStorm.dashIframeTimer}`
  );
  assert.ok(
    simStorm.invulnTimer >= 0.37,
    `Stormcaller should receive ~0.38s invulnerability, got ${simStorm.invulnTimer}`
  );
});

test('Golden Wheat Fox AI: slightly decreased speed, thorn area avoidance, and seeking the most powerful enemy', () => {
  const sim = new Simulation({
    seed: 4242,
    professionId: 'warden',
    startingWeaponId: 'blade_slash',
  });

  // 1. Spawning Golden Wheat Fox verifies slightly decreased movement speed (2.25 vs old 2.65)
  const fox = sim.spawnSpecialMonster('golden_beast');
  assert.ok(fox, 'Golden Wheat Fox should be spawned');
  assert.equal(fox.specialId, 'golden_beast');
  assert.equal(
    fox.speed,
    2.25,
    `Golden Wheat Fox speed should be slightly decreased to 2.25, got ${fox.speed}`
  );

  // 2. Identification of the most powerful enemy on the map
  // Clean other enemies for controlled test
  sim.enemies = [fox];

  // When only the fox is present, no powerful ally exists
  assert.equal(sim.findMostPowerfulEnemy(fox.id), null);

  // Spawn a weak spitter and a high-HP brute
  const spitter = sim.spawnEnemy('spitter', 5, 5, false);
  const brute = sim.spawnEnemy('brute', -5, -5, false);
  assert.ok(spitter && brute);

  // findMostPowerfulEnemy should rank brute higher than spitter
  const powerful1 = sim.findMostPowerfulEnemy(fox.id);
  assert.ok(powerful1);
  assert.equal(powerful1.id, brute.id, 'Brute should be selected over Spitter as most powerful');

  // Spawn an Ancient Moss Colossus (Mini-Boss)
  const miniBoss = (sim as any).spawnBoss(false);
  assert.ok(miniBoss);
  const powerful2 = sim.findMostPowerfulEnemy(fox.id);
  assert.ok(powerful2);
  assert.equal(powerful2.id, miniBoss.id, 'Mini-Boss should take precedence as most powerful combat enemy');

  // Stationary objects like Arena Flower and Hero Grave should NEVER be chosen
  const flower = sim.spawnArenaFlower(0, 0);
  const grave = sim.spawnHeroGrave(1, 1);
  assert.ok(flower && grave);
  miniBoss.hp = 0; // kill mini boss
  brute.hp = 0; // kill brute
  spitter.hp = 0; // kill spitter
  assert.equal(sim.findMostPowerfulEnemy(fox.id), null, 'Flowers and Graves should not be chosen as allies');

  // 3. Fox fleeing toward most powerful enemy
  // Reset enemies to just fox and a healthy Brute
  brute.hp = brute.maxHp;
  sim.enemies = [fox, brute];
  brute.x = 10;
  brute.y = 0;
  fox.x = 0;
  fox.y = 0;
  sim.heroX = 0;
  sim.heroY = 5; // Hero is below fox at (0, 5)

  // Force fox mode to seek_powerful
  fox.foxRunMode = 'seek_powerful';
  fox.foxTargetEnemyId = brute.id;
  fox.aiTimer = 3.0;

  const startDistToBrute = Math.hypot(brute.x - fox.x, brute.y - fox.y);
  sim.tick();
  const nextDistToBrute = Math.hypot(brute.x - fox.x, brute.y - fox.y);
  assert.ok(
    nextDistToBrute < startDistToBrute,
    `Fox in seek_powerful mode should move closer to most powerful enemy (started: ${startDistToBrute}, now: ${nextDistToBrute})`
  );

  // 4. Thorn Area Avoidance: outer thorn circle arena
  // Position hero at arena center (0, 0) and fox right near thorn edge (19.0, 0) inside arena of radius 20.0
  sim.enemies = [fox];
  sim.arenaActive = true;
  sim.finalBossSpawned = true; // Prevent automatic collapse calculation from overwriting test radius
  sim.arenaCenterX = 0;
  sim.arenaCenterY = 0;
  sim.arenaRadiusU = 20.0;
  sim.heroX = 0;
  sim.heroY = 0;
  fox.x = 19.0;
  fox.y = 0;
  fox.foxRunMode = 'flee_hero';
  fox.aiTimer = 3.0;

  // Run 30 ticks; the hero is at center (0,0), so pure flee would push directly into thorns (x > 20)
  for (let t = 0; t < 30; t++) {
    sim.tick();
  }
  const distFromCenter = Math.hypot(fox.x - sim.arenaCenterX, fox.y - sim.arenaCenterY);
  const maxSafeDist = sim.arenaRadiusU - fox.radius;
  assert.ok(
    distFromCenter <= maxSafeDist + 0.01,
    `Fox must avoid running into the thorn perimeter! Dist: ${distFromCenter}, max safe: ${maxSafeDist}`
  );
  // Also verify it deflected tangentially (y != 0) rather than stalling head-on
  assert.ok(
    Math.abs(fox.y) > 0.1,
    `Fox should deflect tangentially along the thorn boundary wall (y: ${fox.y})`
  );

  // 5. Thorn Area Avoidance: ground thorn hazards
  // Place a thorn_trail hazard directly ahead of fox
  fox.x = 5;
  fox.y = 5;
  sim.heroX = 5;
  sim.heroY = 2; // Hero is above fox at (5, 2), fleeing would normally push downward to (5, 6+)
  sim.hazards = [
    {
      id: 9999,
      kind: 'thorn_trail',
      x: 5,
      y: 7, // Thorn patch directly in the flee path
      radius: 1.5,
      damage: 10,
      tickTimer: 0.2,
      lifeTimer: 5.0,
      color: 0xff0000,
    },
  ];

  sim.tick();
  // With thorn trail avoidance, fox should deflect sideways (x != 5) to avoid the thorn patch
  assert.ok(
    Math.abs(fox.x - 5) > 0.001,
    `Fox should steer away from thorn trail hazard (fox.x: ${fox.x})`
  );
});

test('Chain Lightning with Garden Blade equipped starts at the edge of the blade', () => {
  const sim = new Simulation({ seed: 42, startingWeaponId: 'chain_lightning' });
  sim.weapons.push({
    id: 'garden_blade',
    level: 2,
    evolved: false,
    phase: 'ready',
    phaseTimer: 0,
    cooldownTimer: 0,
    swingCounter: 0,
    lockedAngle: 0,
    lockedTargetX: 0,
    lockedTargetY: 0,
    orbitAngle: 0,
    orbitHitCooldowns: new Map(),
  });

  const tipWorld = sim.getGardenBladeTipWorld();
  assert.ok(tipWorld, 'Must return world coordinates for Garden Blade tip');
  assert.notEqual(tipWorld.x, sim.heroX, 'Blade tip x must differ from hero x');

  const tipPx = getGardenBladeTipPosition(sim, 100, 100, 0, 0);
  assert.ok(tipPx, 'Must return pixel coordinates for Garden Blade tip');
  assert.ok(tipPx.x > 100, 'Blade tip pixel x must extend forward from hero center');

  const e1 = sim.spawnEnemy('brute', 2.0, 0, false)!;
  for (let i = 0; i < 70; i++) {
    sim.tick();
    if (sim.visualEffects.some((fx) => fx.kind === 'chain_bolt' && fx.angle === 0)) break;
  }

  const initialBolt = sim.visualEffects.find(
    (fx) => fx.kind === 'chain_bolt' && fx.angle === 0
  );
  assert.ok(initialBolt, 'Initial chain bolt must spawn');
  const currentTip = sim.getGardenBladeTipWorld()!;
  assert.ok(
    Math.abs(initialBolt.x - currentTip.x) < 0.05,
    `Initial bolt start x (${initialBolt.x}) must match blade tip x (${currentTip.x})`
  );
  assert.ok(
    Math.abs(initialBolt.y - currentTip.y) < 0.05,
    `Initial bolt start y (${initialBolt.y}) must match blade tip y (${currentTip.y})`
  );
});

test('Stormcaller always starts Chain Lightning from the tip of the hat even if Garden Blade is equipped', () => {
  const sim = new Simulation({
    seed: 42,
    professionId: 'stormcaller',
    startingWeaponId: 'chain_lightning',
  });
  sim.weapons.push({
    id: 'garden_blade',
    level: 2,
    evolved: false,
    phase: 'ready',
    phaseTimer: 0,
    cooldownTimer: 0,
    swingCounter: 0,
    lockedAngle: 0,
    lockedTargetX: 0,
    lockedTargetY: 0,
    orbitAngle: 0,
    orbitHitCooldowns: new Map(),
  });

  const hatTipWorld = sim.getStormcallerHatTipWorld();
  assert.ok(hatTipWorld, 'Must return world coordinates for Stormcaller hat tip');
  assert.ok(
    hatTipWorld.y < sim.heroY,
    `Hat tip y (${hatTipWorld.y}) must be above hero y (${sim.heroY})`
  );

  const bladeTipWorld = sim.getGardenBladeTipWorld();
  assert.ok(bladeTipWorld, 'Garden blade tip world coordinates should be present');
  assert.notEqual(
    hatTipWorld.y,
    bladeTipWorld.y,
    'Hat tip y and blade tip y must be different points'
  );

  const hatTipPx = getStormcallerHatTipPosition(100, 100, 1, 0);
  assert.ok(hatTipPx, 'Must return pixel coordinates for Stormcaller hat tip');
  assert.equal(
    hatTipPx.y,
    73,
    'Hat tip pixel y must be exactly 27px above hero center (100 - 27 = 73)'
  );

  sim.spawnEnemy('brute', 2.0, 0, false);
  for (let i = 0; i < 70; i++) {
    sim.tick();
    if (sim.visualEffects.some((fx) => fx.kind === 'chain_bolt' && fx.angle === 0)) break;
  }

  const initialBolt = sim.visualEffects.find(
    (fx) => fx.kind === 'chain_bolt' && fx.angle === 0
  );
  assert.ok(initialBolt, 'Initial chain bolt must spawn');
  const currentHatTip = sim.getStormcallerHatTipWorld();
  assert.ok(
    Math.abs(initialBolt.x - currentHatTip.x) < 0.05,
    `Initial bolt start x (${initialBolt.x}) must match Stormcaller hat tip x (${currentHatTip.x})`
  );
  assert.ok(
    Math.abs(initialBolt.y - currentHatTip.y) < 0.05,
    `Initial bolt start y (${initialBolt.y}) must match Stormcaller hat tip y (${currentHatTip.y})`
  );

  // Initial bolt must NOT start at the blade tip for Stormcaller
  const currentBladeTip = sim.getGardenBladeTipWorld()!;
  assert.ok(
    Math.abs(initialBolt.y - currentBladeTip.y) > 0.5,
    `Initial bolt start y (${initialBolt.y}) should not equal garden blade tip y (${currentBladeTip.y})`
  );
});

test('Thorn Trail slows down enemies by 50% while in hazard and applies thorn slow debuff', () => {
  const sim = new Simulation({
    seed: 1234,
    professionId: 'warden',
    startingWeaponId: 'garden_blade',
  });

  // Spawn an ordinary enemy (chaser) at (0, 3) with hero at (0, 0)
  sim.heroX = 0;
  sim.heroY = 0;
  const enemy = sim.spawnEnemy('chaser', 0, 3, false);
  assert.ok(enemy, 'Enemy must be spawned');
  assert.equal(enemy.thornSlowTimer, 0);
  assert.equal(enemy.slowTimer, 0);

  // Measure base move distance without any hazard
  const startY = enemy.y;
  sim.tick();
  const normalDeltaY = Math.abs(startY - enemy.y);
  assert.ok(normalDeltaY > 0.01, 'Enemy should move toward hero');

  // Place a thorn_trail hazard directly at the enemy position
  sim.hazards = [
    {
      id: 8881,
      kind: 'thorn_trail',
      x: enemy.x,
      y: enemy.y,
      radius: 1.5,
      damage: 10,
      tickTimer: 0.2,
      lifeTimer: 2.0,
      color: 0xff0000,
    },
  ];

  const beforeThornY = enemy.y;
  sim.tick();
  const slowedDeltaY = Math.abs(beforeThornY - enemy.y);

  // Verify enemy received active thornSlowTimer and slowTimer
  assert.ok(enemy.thornSlowTimer > 0, 'Enemy in thorn trail must have thornSlowTimer > 0');
  assert.ok(enemy.slowTimer > 0, 'Enemy in thorn trail must have slowTimer > 0');

  // Verify enemy moves at approximately 50% speed
  const speedRatio = slowedDeltaY / normalDeltaY;
  assert.ok(
    speedRatio <= 0.55 && speedRatio >= 0.45,
    `Enemy speed in thorn trail should be ~50% of normal speed (ratio: ${speedRatio.toFixed(3)})`
  );

  // Clear hazard and tick to verify slow debuff lingers and decays
  sim.hazards = [];
  const initialThornTimer = enemy.thornSlowTimer;
  sim.tick();
  assert.ok(
    enemy.thornSlowTimer < initialThornTimer,
    'Thorn slow timer should count down after leaving hazard'
  );
});

test('Thorn Trail Hazard Renderer draws 3 thorns per vine (added 1 extra thorn per vine, 9 total)', () => {
  const fillCalls: any[] = [];
  const strokeCalls: any[] = [];
  const fakeGraphics: any = {
    moveTo: () => fakeGraphics,
    lineTo: () => fakeGraphics,
    bezierCurveTo: () => fakeGraphics,
    closePath: () => fakeGraphics,
    setTransform: () => fakeGraphics,
    stroke: (opts: any) => {
      strokeCalls.push(opts);
      return fakeGraphics;
    },
    fill: (opts: any) => {
      fillCalls.push(opts);
      return fakeGraphics;
    },
  };

  assert.doesNotThrow(() => {
    drawThornTrailHazard(fakeGraphics, 100, 100, 30, 1.0, 42, 0.5);
  });

  // Verify thorns were drawn with PALETTE.CRIMSON_WARN
  // 3 vines * 3 thorns per vine = 9 sharp crimson thorns
  const thornFills = fillCalls.filter((f) => f.color === PALETTE.CRIMSON_WARN);
  assert.equal(
    thornFills.length,
    9,
    `drawThornTrailHazard must draw 9 crimson thorns across the 3 vines (3 per vine), found ${thornFills.length}`
  );

  // Verify mint leaves (4) and blush rosebud (1) were also rendered
  const leafFills = fillCalls.filter((f) => f.color === PALETTE.MINT_GREEN);
  assert.equal(leafFills.length, 4, 'Must draw 4 emerald/mint leaves');
  const budFills = fillCalls.filter((f) => f.color === PALETTE.BLUSH_ROSE);
  assert.equal(budFills.length, 1, 'Must draw central rosebud diamond');
});

test('Stormcaller eye placement: screen pixels and simulation world coordinates match sprite anatomy', () => {
  const hatTipPx = getStormcallerHatTipPosition(100, 100, 1, 0);
  assert.equal(hatTipPx.y, 73, 'Hat tip y must be 27px above hero center');

  const baseEyesPx = getStormcallerEyePositions(100, 100, 1, false);
  assert.equal(baseEyesPx.leftEyeX, 96.8, 'Base left eye x should be 100 - 3.2 = 96.8');
  assert.equal(baseEyesPx.rightEyeX, 103.2, 'Base right eye x should be 100 + 3.2 = 103.2');
  assert.equal(baseEyesPx.eyeY, 87.9, 'Base eye y should be 100 - 12.1 = 87.9');

  const flippedEyesPx = getStormcallerEyePositions(100, 100, -1, false);
  assert.equal(flippedEyesPx.leftEyeX, 103.2, 'Flipped left eye x should be 100 + 3.2 = 103.2');
  assert.equal(flippedEyesPx.rightEyeX, 96.8, 'Flipped right eye x should be 100 - 3.2 = 96.8');
  assert.equal(flippedEyesPx.eyeY, 87.9, 'Flipped eye y should remain 87.9');

  const skinEyesPx = getStormcallerEyePositions(100, 100, 1, true);
  assert.equal(skinEyesPx.leftEyeX, 96.15, 'Skin left eye x should be 100 - 3.85 = 96.15');
  assert.equal(skinEyesPx.rightEyeX, 103.85, 'Skin right eye x should be 100 + 3.85 = 103.85');
  assert.equal(skinEyesPx.eyeY, 87.5, 'Skin eye y should be 100 - 12.5 = 87.5');

  const sim = new Simulation({
    seed: 99,
    professionId: 'stormcaller',
  });
  const eyesWorld = sim.getStormcallerEyesWorld();
  assert.ok(eyesWorld.eyeY < sim.heroY, 'Stormcaller eye world y must be above hero world y');
  assert.ok(
    eyesWorld.eyeY > sim.getStormcallerHatTipWorld().y,
    'Stormcaller eyes must be positioned below the hat tip'
  );
});

test('Passive dodge spawns smaller "miss" text above the missed enemy instead of "dodge"', () => {
  const sim = new Simulation({ seed: 7777, professionId: 'warden' });
  sim.debugSetCardLevel('swift_boots', 5); // 30% dodge chance
  sim.cardPickInvisTimer = 0;
  sim.invulnTimer = 0;

  const enemy = sim.spawnEnemy('brute', sim.heroX + 2.0, sim.heroY + 1.0, false)!;
  assert.ok(enemy, 'Enemy should be spawned');

  const floatingEvents: Array<{
    x: number;
    y: number;
    text: string;
    scale: number;
    color: number;
  }> = [];
  sim.events.on('FloatingText', (ev) => {
    floatingEvents.push({ ...ev });
  });

  // Force a dodge against the enemy
  let dodged = false;
  for (let i = 0; i < 50; i++) {
    sim.currentHp = sim.maxHp;
    sim.invulnTimer = 0;
    sim.cardPickInvisTimer = 0;
    floatingEvents.length = 0;

    (sim as any).damageHero(10, enemy);
    if (sim.currentHp === sim.maxHp) {
      dodged = true;
      const floatEv = floatingEvents[0];
      assert.ok(floatEv, 'Dodge must emit a FloatingText event');
      assert.equal(floatEv.text, 'miss', 'Floating text must be "miss" instead of "dodge"');
      assert.equal(floatEv.scale, 0.55, 'Floating text must have smaller scale (0.55)');
      assert.equal(floatEv.color, PALETTE.MINT_GREEN);
      // Verify floating text was placed above the missed enemy
      assert.equal(floatEv.x, enemy.x, 'Text x coordinate must be positioned on the missed enemy');
      assert.ok(
        floatEv.y < enemy.y,
        `Text y coordinate (${floatEv.y}) must be above the missed enemy (${enemy.y})`
      );
      break;
    }
  }

  assert.equal(dodged, true, 'At least one dodge should trigger across 50 attempts');
});

test('Piercing Slash card is never offered in card draft if Garden Blade is not equipped', () => {
  // 1. Without garden_blade equipped (even with thorn_spear which has 'slash' tag)
  for (let seed = 1000; seed < 1100; seed++) {
    const streams = new RNGStreams(seed);
    const result = generateCardDraftOffers({
      rng: streams.cards,
      luck: 10,
      weapons: [{ id: 'thorn_spear', level: 3, evolved: false }],
      ownedCards: {},
      unlockedWeapons: ['thorn_spear'],
      consecutiveAllCommonOffers: 0,
    });
    const hasPiercingSlash = result.offers.some(
      (o) => o.targetId === 'piercing_slash' || o.offerId.includes('piercing_slash')
    );
    assert.equal(
      hasPiercingSlash,
      false,
      `Piercing Slash must not be offered when garden_blade is not equipped (seed ${seed})`
    );
  }

  // 2. In Simulation level-up drafts with a hero who does not have garden_blade (Seeker starts with thorn_spear)
  const simSeeker = new Simulation({ seed: 7777, professionId: 'seeker' });
  for (let i = 0; i < 50; i++) {
    simSeeker.triggerLevelUpCardDraft();
    const hasPiercingSlash = simSeeker.pendingCardOffers.some(
      (o) => o.targetId === 'piercing_slash' || o.offerId.includes('piercing_slash')
    );
    assert.equal(
      hasPiercingSlash,
      false,
      'Piercing Slash must never appear in draft offers for Seeker without Garden Blade'
    );
    // Also test rerolls
    const rerolled = simSeeker.rerollCardDraft('free');
    const hasPiercingSlashReroll = rerolled.some(
      (o) => o.targetId === 'piercing_slash' || o.offerId.includes('piercing_slash')
    );
    assert.equal(
      hasPiercingSlashReroll,
      false,
      'Piercing Slash must never appear after reroll without Garden Blade'
    );
    simSeeker.pendingCardOffers = [];
  }

  // 3. When garden_blade is equipped, piercing_slash CAN be offered
  let offeredWithBlade = false;
  for (let seed = 2000; seed < 2100; seed++) {
    const streams = new RNGStreams(seed);
    const result = generateCardDraftOffers({
      rng: streams.cards,
      luck: 10,
      weapons: [{ id: 'garden_blade', level: 3, evolved: false }],
      ownedCards: {},
      unlockedWeapons: ['garden_blade'],
      consecutiveAllCommonOffers: 0,
    });
    if (result.offers.some((o) => o.targetId === 'piercing_slash')) {
      offeredWithBlade = true;
      break;
    }
  }
  assert.equal(
    offeredWithBlade,
    true,
    'Piercing Slash should be eligible and offered when garden_blade is equipped'
  );
});

test('Sharper Edge card is only shown/offered if Garden Blade is equipped', () => {
  // 1. Without garden_blade equipped (e.g. thorn_spear)
  for (let seed = 1000; seed < 1100; seed++) {
    const streams = new RNGStreams(seed);
    const result = generateCardDraftOffers({
      rng: streams.cards,
      luck: 10,
      weapons: [{ id: 'thorn_spear', level: 3, evolved: false }],
      ownedCards: {},
      unlockedWeapons: ['thorn_spear'],
      consecutiveAllCommonOffers: 0,
    });
    const hasSharperEdge = result.offers.some(
      (o) => o.targetId === 'sharper_edge' || o.offerId.includes('sharper_edge')
    );
    assert.equal(
      hasSharperEdge,
      false,
      `Sharper Edge must not be offered when garden_blade is not equipped (seed ${seed})`
    );
  }

  // 2. In Simulation level-up drafts with Seeker (starts with thorn_spear)
  const simSeeker = new Simulation({ seed: 8888, professionId: 'seeker' });
  for (let i = 0; i < 50; i++) {
    simSeeker.triggerLevelUpCardDraft();
    const hasSharperEdge = simSeeker.pendingCardOffers.some(
      (o) => o.targetId === 'sharper_edge' || o.offerId.includes('sharper_edge')
    );
    assert.equal(
      hasSharperEdge,
      false,
      'Sharper Edge must never appear in draft offers for Seeker without Garden Blade'
    );
    const rerolled = simSeeker.rerollCardDraft('free');
    const hasSharperEdgeReroll = rerolled.some(
      (o) => o.targetId === 'sharper_edge' || o.offerId.includes('sharper_edge')
    );
    assert.equal(
      hasSharperEdgeReroll,
      false,
      'Sharper Edge must never appear after reroll without Garden Blade'
    );
    simSeeker.pendingCardOffers = [];
  }

  // 3. When garden_blade is equipped, sharper_edge CAN be offered
  let offeredWithBlade = false;
  for (let seed = 3000; seed < 3100; seed++) {
    const streams = new RNGStreams(seed);
    const result = generateCardDraftOffers({
      rng: streams.cards,
      luck: 0,
      weapons: [{ id: 'garden_blade', level: 1, evolved: false }],
      ownedCards: {},
      unlockedWeapons: ['garden_blade'],
      consecutiveAllCommonOffers: 0,
    });
    if (result.offers.some((o) => o.targetId === 'sharper_edge')) {
      offeredWithBlade = true;
      break;
    }
  }
  assert.equal(
    offeredWithBlade,
    true,
    'Sharper Edge should be eligible and offered when garden_blade is equipped'
  );
});

test('Burning Thorns card is only shown/offered if Thorn Trail is equipped', () => {
  // 1. Without thorn_trail equipped (even with weapons having pierce like arbalete)
  for (let seed = 1000; seed < 1100; seed++) {
    const streams = new RNGStreams(seed);
    const result = generateCardDraftOffers({
      rng: streams.cards,
      luck: 15,
      weapons: [{ id: 'thorn_spear', level: 3, evolved: false }],
      ownedCards: {},
      unlockedWeapons: ['thorn_spear'],
      consecutiveAllCommonOffers: 0,
    });
    const hasBurningThorns = result.offers.some(
      (o) => o.targetId === 'burning_thorns' || o.offerId.includes('burning_thorns')
    );
    assert.equal(
      hasBurningThorns,
      false,
      `Burning Thorns must not be offered when thorn_trail is not equipped (seed ${seed})`
    );
  }

  // 2. In Simulation level-up drafts without thorn_trail
  const sim = new Simulation({ seed: 9999, professionId: 'seeker' });
  for (let i = 0; i < 50; i++) {
    sim.triggerLevelUpCardDraft();
    const hasBurningThorns = sim.pendingCardOffers.some(
      (o) => o.targetId === 'burning_thorns' || o.offerId.includes('burning_thorns')
    );
    assert.equal(
      hasBurningThorns,
      false,
      'Burning Thorns must never appear in draft offers without Thorn Trail equipped'
    );
    const rerolled = sim.rerollCardDraft('free');
    const hasBurningThornsReroll = rerolled.some(
      (o) => o.targetId === 'burning_thorns' || o.offerId.includes('burning_thorns')
    );
    assert.equal(
      hasBurningThornsReroll,
      false,
      'Burning Thorns must never appear after reroll without Thorn Trail equipped'
    );
    sim.pendingCardOffers = [];
  }

  // 3. When thorn_trail IS equipped, burning_thorns CAN be offered
  let offeredWithThornTrail = false;
  for (let seed = 4000; seed < 4100; seed++) {
    const streams = new RNGStreams(seed);
    const result = generateCardDraftOffers({
      rng: streams.cards,
      luck: 10,
      weapons: [{ id: 'garden_blade', level: 1, evolved: false }],
      ownedCards: { thorn_trail: 1 },
      unlockedWeapons: ['garden_blade'],
      consecutiveAllCommonOffers: 0,
    });
    if (result.offers.some((o) => o.targetId === 'burning_thorns')) {
      offeredWithThornTrail = true;
      break;
    }
  }
  assert.equal(
    offeredWithThornTrail,
    true,
    'Burning Thorns should be eligible and offered when thorn_trail is equipped'
  );

  // 4. Synergistic burn effect: enemies damaged by thorn_trail ignite when burning_thorns is owned
  const simBurn = new Simulation({ seed: 5555, professionId: 'warden' });
  simBurn.cards.thorn_trail = 1;
  simBurn.cards.burning_thorns = 2;
  const enemy = simBurn.spawnEnemy('chaser', simBurn.heroX + 1.0, simBurn.heroY, false)!;
  enemy.hp = 100;
  enemy.burnTimer = 0;
  // Trigger hazard tick on enemy
  simBurn.hazards.push({
    id: (simBurn as any).nextEntityId++,
    kind: 'thorn_trail',
    x: enemy.x,
    y: enemy.y,
    radius: 1.0,
    damage: 10,
    tickTimer: 0,
    lifeTimer: 2.0,
    color: 0xffffff,
  });
  simBurn.tick();
  assert.ok(enemy.burnTimer > 0, 'Enemy must catch fire from thorn trail hazard when burning_thorns is equipped');
  assert.equal(enemy.burnDps, 8, 'Burn DPS should scale with burning_thorns level (2 * 4 = 8)');
});

test('Arcana Persona skin & amplification isolation: apply personas only to related heroes and show skin only if applied and related hero picked for run', () => {
  // 1. Authoritative Hero-Persona associations
  // warden -> losti siege (warden_zagreus_naruto)
  // seeker -> vessel ackerman (seeker_hollow_levi)
  // herbalist -> hiten jade (herbalist_frieren_strange)
  // stormcaller -> thander rein (stormcaller_gojo_killua)
  assert.equal(isPersonaRelatedToProfession('warden_zagreus_naruto', 'warden'), true);
  assert.equal(isPersonaRelatedToProfession('seeker_hollow_levi', 'seeker'), true);
  assert.equal(isPersonaRelatedToProfession('herbalist_frieren_strange', 'herbalist'), true);
  assert.equal(isPersonaRelatedToProfession('stormcaller_gojo_killua', 'stormcaller'), true);

  // 2. Cross-hero persona applications must return false
  assert.equal(isPersonaRelatedToProfession('stormcaller_gojo_killua', 'seeker'), false, 'Stormcaller persona must NOT relate to seeker');
  assert.equal(isPersonaRelatedToProfession('stormcaller_gojo_killua', 'warden'), false);
  assert.equal(isPersonaRelatedToProfession('stormcaller_gojo_killua', 'herbalist'), false);
  assert.equal(isPersonaRelatedToProfession('seeker_hollow_levi', 'stormcaller'), false);
  assert.equal(isPersonaRelatedToProfession('seeker_hollow_levi', 'warden'), false);
  assert.equal(isPersonaRelatedToProfession('seeker_hollow_levi', 'herbalist'), false);
  assert.equal(isPersonaRelatedToProfession('warden_zagreus_naruto', 'seeker'), false);
  assert.equal(isPersonaRelatedToProfession('herbalist_frieren_strange', 'seeker'), false);
  assert.equal(isPersonaRelatedToProfession('adventurer_default', 'seeker'), false);
  assert.equal(isPersonaRelatedToProfession(undefined, 'seeker'), false);

  // 3. SpriteAtlas resolveHeroSpriteKey:
  // Taking Seeker when Stormcaller persona is in state must return hero_seeker, NEVER skin_stormcaller_gojo_killua
  assert.equal(resolveHeroSpriteKey('seeker', 'stormcaller_gojo_killua'), 'hero_seeker');
  assert.equal(resolveHeroSpriteKey('seeker', 'warden_zagreus_naruto'), 'hero_seeker');
  assert.equal(resolveHeroSpriteKey('seeker', 'herbalist_frieren_strange'), 'hero_seeker');
  assert.equal(resolveHeroSpriteKey('seeker', 'adventurer_default'), 'hero_seeker');
  // Seeker skin shows only if Vessel Ackerman is applied and Seeker is picked
  assert.equal(resolveHeroSpriteKey('seeker', 'seeker_hollow_levi'), 'skin_seeker_hollow_levi');

  // Warden
  assert.equal(resolveHeroSpriteKey('warden', 'warden_zagreus_naruto'), 'skin_warden_zagreus_naruto');
  assert.equal(resolveHeroSpriteKey('warden', 'stormcaller_gojo_killua'), 'hero_warden');
  assert.equal(resolveHeroSpriteKey('warden', 'seeker_hollow_levi'), 'hero_warden');

  // Herbalist
  assert.equal(resolveHeroSpriteKey('herbalist', 'herbalist_frieren_strange'), 'skin_herbalist_frieren_strange');
  assert.equal(resolveHeroSpriteKey('herbalist', 'stormcaller_gojo_killua'), 'hero_herbalist');
  assert.equal(resolveHeroSpriteKey('herbalist', 'seeker_hollow_levi'), 'hero_herbalist');

  // Stormcaller
  assert.equal(resolveHeroSpriteKey('stormcaller', 'stormcaller_gojo_killua'), 'skin_stormcaller_gojo_killua');
  assert.equal(resolveHeroSpriteKey('stormcaller', 'seeker_hollow_levi'), 'hero_stormcaller');
  assert.equal(resolveHeroSpriteKey('stormcaller', 'warden_zagreus_naruto'), 'hero_stormcaller');

  // 4. Simulation run isolation:
  // If a run is started with Seeker but stormcaller_gojo_killua was passed as personaId:
  const simSeekerMismatched = new Simulation({
    seed: 101,
    professionId: 'seeker',
    personaId: 'stormcaller_gojo_killua',
  });
  assert.equal(simSeekerMismatched.isPersonaSkinApplied(), false);
  simSeekerMismatched.setMoveIntent(1, 0);
  for (let t = 0; t < 15; t++) {
    simSeekerMismatched.tick();
  }
  // Mismatched persona must NEVER spawn step visual effects
  assert.equal(
    simSeekerMismatched.visualEffects.filter(
      (fx) => fx.kind === 'godspeed_lightning_step' || fx.kind === 'void_soul_step'
    ).length,
    0,
    'Mismatched persona must not leave any trailing footsteps'
  );

  // When Seeker is picked with Vessel Ackerman:
  const simSeekerApplied = new Simulation({
    seed: 102,
    professionId: 'seeker',
    personaId: 'seeker_hollow_levi',
  });
  assert.equal(simSeekerApplied.isPersonaSkinApplied(), true);
  simSeekerApplied.setMoveIntent(1, 0);
  for (let t = 0; t < 15; t++) {
    simSeekerApplied.tick();
  }
  const voidSteps = simSeekerApplied.visualEffects.filter((fx) => fx.kind === 'void_soul_step');
  assert.ok(voidSteps.length > 0, 'Seeker with Vessel Ackerman applied should spawn void_soul_step');

  // 5. SaveManager loadout per-profession persona persistence & reconciliation
  const defaultSave = createDefaultSaveData();
  assert.deepEqual(defaultSave.loadout.personaByProfession, {});
  const cloudSave = createDefaultSaveData();
  cloudSave.loadout.personaByProfession = {
    seeker: 'seeker_hollow_levi',
    stormcaller: 'stormcaller_gojo_killua',
  };
  const merged = reconcileSaveData(JSON.stringify(cloudSave), JSON.stringify(defaultSave));
  assert.equal(merged.state.loadout.personaByProfession?.seeker, 'seeker_hollow_levi');
  assert.equal(merged.state.loadout.personaByProfession?.stormcaller, 'stormcaller_gojo_killua');
});


test('Avoid moving picked up item to Q slot if it is empty after Q slot item use', () => {
  const sim = new Simulation({ seed: 101, professionId: 'warden' });
  sim.heldPowerUps.length = 0;

  // 1. Pick up two items: shield in slot 0 (Q) and fire_breath in slot 1 (E)
  sim.addHeldPowerUp('shield');
  sim.addHeldPowerUp('fire_breath');
  assert.equal(sim.heldPowerUps[0], 'shield', 'Slot 0 [Q] should have shield');
  assert.equal(sim.heldPowerUps[1], 'fire_breath', 'Slot 1 [E] should have fire_breath');

  // 2. Use Q slot item (slotIndex = 0)
  sim.requestUsePowerUp(0);
  sim.tick();

  // Shield was consumed; Q slot (index 0) must be empty (null/falsy), and E slot (index 1) must remain fire_breath
  assert.equal(sim.heldPowerUps[0], null, 'Slot 0 [Q] should be empty (null) after Q slot item use');
  assert.equal(
    sim.heldPowerUps[1],
    'fire_breath',
    'Item in Slot 1 [E] must NOT be moved to Slot 0 [Q] when Q slot is used'
  );
  assert.ok(sim.shieldTimer > 0, 'Shield power up should be activated');

  // 3. Trying to use Q slot again does nothing because it is empty
  sim.requestUsePowerUp(0);
  sim.tick();
  assert.equal(sim.heldPowerUps[0], null, 'Slot 0 [Q] remains empty');
  assert.equal(sim.heldPowerUps[1], 'fire_breath', 'Slot 1 [E] remains fire_breath');

  // 4. Pick up another item ('time_slow') when Q slot is empty and E slot is occupied
  const pickedSlot = sim.addHeldPowerUp('time_slow');
  assert.equal(pickedSlot, 0, 'New item should fill empty Slot 0 [Q]');
  assert.equal(sim.heldPowerUps[0], 'time_slow', 'Slot 0 [Q] now holds time_slow');
  assert.equal(sim.heldPowerUps[1], 'fire_breath', 'Slot 1 [E] still holds fire_breath without moving');

  // 5. Use E slot item (slotIndex = 1)
  sim.requestUsePowerUp(1);
  sim.tick();
  assert.equal(sim.heldPowerUps[0], 'time_slow', 'Slot 0 [Q] still holds time_slow');
  assert.equal(sim.heldPowerUps[1], undefined, 'Slot 1 [E] is now empty');
  assert.ok(sim.fireBreathTimer > 0, 'Fire breath power up should be activated');

  // 6. Use remaining Q slot item
  sim.requestUsePowerUp(0);
  sim.tick();
  assert.equal(sim.heldPowerUps.length, 0, 'All power ups consumed, held array should be empty');
});

test('Sundial watch effect: stacks in time when used in a row, slows enemies by 80%, slows charges and projectiles', () => {
  const sim = new Simulation({ seed: 1234, professionId: 'warden' });
  sim.heldPowerUps.length = 0;
  sim.enemies.length = 0;
  sim.projectiles.length = 0;

  // 1. Stacking timer: use time_slow twice
  sim.addHeldPowerUp('time_slow');
  sim.requestUsePowerUp(0);
  sim.tick();
  assert.ok(sim.timeSlowTimer > 3.8 && sim.timeSlowTimer <= 4.0, 'First use sets timer to 4s');

  sim.addHeldPowerUp('time_slow');
  sim.requestUsePowerUp(0);
  sim.tick();
  assert.ok(sim.timeSlowTimer > 7.5 && sim.timeSlowTimer <= 8.0, 'Second use stacks timer by +4s');

  // 2. Slow enemy movement by 80% (speed is 20% = factor 0.2)
  const enemyNormal = new Simulation({ seed: 1234, professionId: 'warden' });
  enemyNormal.enemies.length = 0;
  const eNormal = enemyNormal.spawnEnemy('chaser', 10, 0, false)!;
  const eSlowed = sim.spawnEnemy('chaser', 10, 0, false)!;

  const normalStartX = eNormal.x;
  const slowStartX = eSlowed.x;

  enemyNormal.tick();
  sim.tick();

  const normalMoved = Math.abs(eNormal.x - normalStartX);
  const slowMoved = Math.abs(eSlowed.x - slowStartX);
  assert.ok(
    Math.abs(slowMoved / normalMoved - 0.2) < 0.05,
    `Enemy movement should be slowed by 80% (0.2x speed, got ${slowMoved / normalMoved})`
  );

  // 3. Slow charger in 'charge' state by 80% (0.2x speed)
  const chargerNormal = new Simulation({ seed: 1234, professionId: 'warden' });
  chargerNormal.enemies.length = 0;
  const cNormal = chargerNormal.spawnEnemy('dasher', 10, 0, false)!;
  cNormal.aiState = 'charge';
  cNormal.telegraphAngle = Math.PI; // charging left
  cNormal.aiTimer = 1.0;

  const chargerSlow = sim.spawnEnemy('dasher', 10, 0, false)!;
  chargerSlow.aiState = 'charge';
  chargerSlow.telegraphAngle = Math.PI;
  chargerSlow.aiTimer = 1.0;

  const cNormalStartX = cNormal.x;
  const cSlowStartX = chargerSlow.x;

  chargerNormal.tick();
  sim.tick();

  const cNormalMoved = Math.abs(cNormal.x - cNormalStartX);
  const cSlowMoved = Math.abs(chargerSlow.x - cSlowStartX);
  assert.ok(
    Math.abs(cSlowMoved / cNormalMoved - 0.2) < 0.05,
    `Enemy charge speed should be slowed by 80% (0.2x speed, got ${cSlowMoved / cNormalMoved})`
  );

  // 4. Slow enemy projectiles by 80% (0.2x speed)
  const projNormal = new Simulation({ seed: 1234, professionId: 'warden' });
  projNormal.projectiles.length = 0;
  projNormal.projectiles.push({
    id: 1,
    isEnemy: true,
    projectileKind: 'sunflower_seed',
    x: 10,
    y: 0,
    prevX: 10,
    prevY: 0,
    vx: -10,
    vy: 0,
    radius: 0.5,
    damage: 10,
    isCrit: false,
    pierceRemaining: 0,
    lifeTimer: 2.0,
    color: 0xffffff,
    weaponTags: [],
    hitEnemyIds: new Set(),
  });

  sim.projectiles.length = 0;
  sim.projectiles.push({
    id: 2,
    isEnemy: true,
    projectileKind: 'sunflower_seed',
    x: 10,
    y: 0,
    prevX: 10,
    prevY: 0,
    vx: -10,
    vy: 0,
    radius: 0.5,
    damage: 10,
    isCrit: false,
    pierceRemaining: 0,
    lifeTimer: 2.0,
    color: 0xffffff,
    weaponTags: [],
    hitEnemyIds: new Set(),
  });

  projNormal.tick();
  sim.tick();

  const pNormalMoved = Math.abs(projNormal.projectiles[0]!.x - 10);
  const pSlowMoved = Math.abs(sim.projectiles[0]!.x - 10);
  assert.ok(
    Math.abs(pSlowMoved / pNormalMoved - 0.2) < 0.05,
    `Enemy projectile speed should be slowed by 80% (0.2x speed, got ${pSlowMoved / pNormalMoved})`
  );
});

test('Revive lifecycle: lethal hit halts mid-tick card drafts, revive clears stale drafts without ambushing player, and post-revive card picks never freeze simulation', () => {
  const sim = new Simulation({ seed: 4242, professionId: 'warden' });
  sim.enemies.length = 0;

  // 1. Simulate close-quarters combat where XP gems queued drafts before lethal hit
  const attacker = sim.spawnEnemy('brute', sim.heroX + 0.5, sim.heroY, false)!;
  attacker.contactDamage = 500;
  sim.queuedCardDraftCount = 2;
  sim.pickups.push({
    id: 9991,
    kind: 'xp_gem',
    x: sim.heroX,
    y: sim.heroY,
    value: 50,
    magnetized: true,
    pullSpeed: 10,
  });

  let lethalIntercepted = false;
  let levelUpDuringDeath = false;
  sim.events.on('LethalHitIntercepted', (ev) => {
    if (ev.reason === 'rescue_offer') {
      lethalIntercepted = true;
    }
  });
  sim.events.on('LevelUp', () => {
    if (sim.awaitingReviveDecision || sim.currentHp <= 0) {
      levelUpDuringDeath = true;
    }
  });

  // Step 1 tick: enemy deals lethal contact damage -> tick halts immediately before pickups/weapons can trigger LevelUp
  sim.invulnTimer = 0;
  sim.cardPickInvisTimer = 0;
  sim.tick();

  assert.equal(lethalIntercepted, true, 'Lethal hit should emit rescue_offer');
  assert.equal(sim.awaitingReviveDecision, true);
  assert.equal(sim.currentHp, 0);
  assert.equal(levelUpDuringDeath, false, 'LevelUp must never fire while hero is dead / awaiting revive');
  assert.equal(sim.isHeroSafeForCardDraft(), false, 'Dead hero awaiting revive is never safe for card draft');
  assert.equal(sim.pendingCardOffers.length, 0, 'No pending card offers should exist while awaiting revive');

  // Ticking while awaitingReviveDecision === true must not advance elapsedTicks or trigger queued drafts
  const ticksAtDeath = sim.elapsedTicks;
  attacker.hp = 0;
  attacker.koTimer = 0.2;
  sim.tick();
  assert.equal(sim.elapsedTicks, ticksAtDeath);
  assert.equal(sim.pendingCardOffers.length, 0);

  // 2. Revive player -> restores 50% HP, clears awaitingReviveDecision, does not ambush with stale card draft
  const overlappingEnemy = sim.spawnEnemy('chaser', sim.heroX, sim.heroY, false)!;
  sim.applyPlayerRevive({ isAdRevive: true });
  assert.equal(sim.awaitingReviveDecision, false);
  assert.equal(sim.reviveUsed, true);
  assert.ok(sim.currentHp >= Math.floor(sim.maxHp * 0.5));
  assert.equal(sim.pendingCardOffers.length, 0, 'Revive must not immediately pop stale card draft modal');
  assert.equal(sim.queuedCardDraftCount, 0, 'Revive must clear stale pre-death queued drafts');
  assert.ok(
    Math.hypot(overlappingEnemy.x - sim.heroX, overlappingEnemy.y - sim.heroY) > 2.0,
    'Overlapping enemy at d=0 must still be knocked back on revive'
  );

  // 3. Subsequent level-up after revive opens card draft, and picking ANY card advances simulation without getting stuck
  sim.enemies.length = 0;
  sim.pickups.length = 0;
  for (let idx = 0; idx < 3; idx++) {
    sim.triggerLevelUpCardDraft();
    assert.equal(sim.pendingCardOffers.length, 3, 'Post-revive level-up should offer 3 cards');
    const pickedOffer = sim.pendingCardOffers[idx]!;
    const applied = sim.applyCardOffer(pickedOffer.offerId);
    assert.equal(applied, true, `Picking card index ${idx} (${pickedOffer.offerId}) after revive must succeed`);
    assert.equal(sim.pendingCardOffers.length, 0, 'pendingCardOffers must be empty after picking a card');
    assert.equal(sim.awaitingReviveDecision, false);

    const beforeTick = sim.elapsedTicks;
    sim.tick();
    assert.equal(
      sim.elapsedTicks,
      beforeTick + 1,
      `Simulation must continue ticking after picking card index ${idx} post-revive`
    );
  }
});









