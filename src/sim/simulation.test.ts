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
  calculateEnemyTimeScaling,
  calculateHitDamage,
  computeHeroStats,
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
import { CARDS, PERSONAS, POWER_UPS } from '../content/data/catalog';
import { isDevelopmentProcess, IS_DEV } from '../app/debug/devGate';

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

  // Trigger Dash ability -> activates dash invisibility frames (0.26s = 15 ticks at 60Hz)
  const dashed = sim.requestDash(0);
  assert.equal(dashed, true);
  assert.equal(sim.isHeroDashInvisible(), true);
  assert.ok(sim.dashIframeTimer >= 0.25);

  // Step 12 ticks while inside dash invisibility frames: hero takes 0 damage from overlapping brute or projectile
  for (let i = 0; i < 12; i++) {
    sim.tick();
    assert.equal(sim.isHeroDashInvisible(), true);
    assert.equal(sim.currentHp, initialHp);
  }

  // Step another 10 ticks so the 0.26s dash i-frame window expires cleanly
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

  // Damage with 0 cards: 10 (slash) + 20 (base lightning detonation) = ~30 damage
  const damageDealtWithoutCards = hpAfterHit1 - enemy.hp;
  assert.ok(
    damageDealtWithoutCards >= 28,
    `Expected at least 28 damage dealt, got ${damageDealtWithoutCards}`
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
    assert.notEqual(
      p.eyeLeftColor,
      p.eyeRightColor,
      'Each Arcana Persona skin should have distinct heterochromia eye colors'
    );
    assert.equal(
      defaultSave.unlocks.personas.includes(exp.id),
      false,
      `${exp.id} must start locked as a shadow silhouette in default save data`
    );

    // Verify moving with the skin equipped spawns disappearing step effects
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
});

test('Gameplay Polish: 0.5s silent invulnerability after card choice, single initial coin farther from spawn, decreased basic coin drop rate amplified by Lucky Clover, Heal +20HP drop, collapsing thorn arena, and Boss death -> Angel Wings victory sequence', () => {
  const sim = new Simulation({ seed: 31415, professionId: 'warden' });

  // 1. Single initial coin near hero spawn placed farther away at (3.2, -0.85)
  const initialCoins = sim.pickups.filter((p) => p.kind === 'gold_coin');
  assert.equal(initialCoins.length, 1, 'Should spawn only 1 coin near hero spawn');
  const distCoin = Math.hypot(initialCoins[0]!.x, initialCoins[0]!.y);
  assert.ok(distCoin >= 3.0, `Single initial coin should lay farther from spawn (>=3.0u), got ${distCoin}`);

  // 2. Decreased basic coin drop rate (10% base) amplified by Lucky Clover & Luck
  const baseCoinChance = sim.getBasicCoinDropChance();
  assert.ok(
    Math.abs(baseCoinChance - 0.1) < 1e-6,
    `Base coin drop chance should be 10% (0.10), got ${baseCoinChance}`
  );
  sim.debugSetCardLevel('lucky_clover', 3);
  const cloverCoinChance = sim.getBasicCoinDropChance();
  assert.ok(
    cloverCoinChance > 0.45,
    `Lucky Clover Lv 3 should amplify basic coin drop chance significantly (>45%), got ${cloverCoinChance}`
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
  assert.equal(sim.currentHp, hpBeforePotion + 20, 'Activating heal_potion from pocket should heal +20 HP');

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
  // 1. Thander Rein persona metadata check
  const thander = PERSONAS.find((p) => p.id === 'stormcaller_gojo_killua');
  assert.ok(thander, 'stormcaller_gojo_killua persona should exist');
  assert.equal(thander.name, 'Thander Rein', 'Stormcaller persona should be named Thander Rein');
  assert.ok(
    thander.popCultureMashup.includes('Raiden') && thander.popCultureMashup.includes('Thor'),
    'Thander Rein should reference Raiden (Mortal Kombat) and Thor (Marvel)'
  );
  assert.equal(thander.cloakColor, 0xdc2626, 'Thander Rein should wear Thor crimson cloak');

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
});


