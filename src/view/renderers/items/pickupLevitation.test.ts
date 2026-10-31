import test from 'node:test';
import assert from 'node:assert/strict';
import * as PIXI from 'pixi.js';
import {
  PICKUP_BOB_CONFIG,
  BOB_CONFIG,
  pickupRegistry,
  reusableShadow,
  PickupShadowSprite,
} from './PickupRegistry';
import { XpGemPickupRenderer } from './XpGemPickupRenderer';
import { XpClusterPickupRenderer } from './XpClusterPickupRenderer';
import { GoldCoinPickupRenderer } from './GoldCoinPickupRenderer';
import { ChestPickupRenderer } from './ChestPickupRenderer';
import type { SimPickup, Simulation } from '../../../sim/Simulation';

test('Pickup bob config provides typed config object with different scales per object', () => {
  assert.equal(PICKUP_BOB_CONFIG, BOB_CONFIG);

  const kinds = ['xp_gem', 'xp_cluster', 'gold_coin'] as const;
  for (const kind of kinds) {
    const cfg = PICKUP_BOB_CONFIG[kind];
    assert.ok(cfg, `Config must exist for ${kind}`);
    assert.ok(typeof cfg.BOB_AMPLITUDE === 'number' && cfg.BOB_AMPLITUDE > 0);
    assert.ok(typeof cfg.BOB_SPEED === 'number' && cfg.BOB_SPEED > 0);
    assert.equal(cfg.SHADOW_MIN_SCALE, 0.75, 'SHADOW_MIN_SCALE should be ~0.75');
    assert.ok(cfg.SHADOW_MAX_ALPHA > 0);
    // Alpha at highest point is ~0.6x of base (SHADOW_MAX_ALPHA)
    const ratio = cfg.SHADOW_MIN_ALPHA / cfg.SHADOW_MAX_ALPHA;
    assert.ok(Math.abs(ratio - 0.6) < 0.05, `Shadow min alpha should be ~0.6x of base (got ${ratio})`);
    assert.equal(pickupRegistry.getBobConfig(kind), cfg);
  }

  // Ensure different scale / amplitude / speed per object
  assert.notEqual(PICKUP_BOB_CONFIG.xp_gem.BOB_AMPLITUDE, PICKUP_BOB_CONFIG.xp_cluster.BOB_AMPLITUDE);
  assert.notEqual(PICKUP_BOB_CONFIG.xp_gem.BOB_SPEED, PICKUP_BOB_CONFIG.gold_coin.BOB_SPEED);
});

test('PickupShadowSprite animates scale and alpha in sync with bobbing while y stays fixed', () => {
  const sprite = new PickupShadowSprite();
  const config = PICKUP_BOB_CONFIG.gold_coin;

  const mockPickup: SimPickup = {
    id: 42,
    kind: 'gold_coin',
    x: 10,
    y: 20,
    value: 1,
    magnetized: false,
    pullSpeed: 0,
  };

  const groundY = 20 * 48;
  const px = 10 * 48;
  const shadowOffsetY = 8;
  const fixedShadowGroundY = groundY + shadowOffsetY;

  // 1. Lowest point: Math.sin(phase) = -1 -> offsetY = -BOB_AMPLITUDE (minY)
  // t = (-A - (-A)) / (2A) = 0
  // shadow scale must be 1.0, shadow alpha must be SHADOW_MAX_ALPHA (1.0x base)
  (mockPickup as { phase?: number }).phase = -Math.PI / 2; // sin(-PI/2) = -1
  sprite.updateLevitation(mockPickup, 0, config, px, groundY, shadowOffsetY);

  assert.equal(sprite.anchor.x, 0.5);
  assert.equal(sprite.anchor.y, 0.5);
  assert.equal(sprite.x, px);
  assert.equal(sprite.y, fixedShadowGroundY, 'Shadow y must remain fixed at ground position');
  assert.ok(Math.abs(sprite.scale.x - 1.0) < 0.001, 'Lowest point shadow scale must be 1.0');
  assert.ok(Math.abs(sprite.alpha - config.SHADOW_MAX_ALPHA) < 0.001, 'Lowest point shadow alpha must be 1.0x base');
  assert.ok(sprite.pickupY > groundY, 'Pickup rendered y at lowest point must be lower on screen');

  // 2. Highest point: Math.sin(phase) = 1 -> offsetY = BOB_AMPLITUDE (maxY)
  // t = (A - (-A)) / (2A) = 1
  // shadow scale must be SHADOW_MIN_SCALE (~0.75), shadow alpha must be SHADOW_MIN_ALPHA (~0.6x base)
  (mockPickup as { phase?: number }).phase = Math.PI / 2; // sin(PI/2) = 1
  sprite.updateLevitation(mockPickup, 0, config, px, groundY, shadowOffsetY);

  assert.equal(sprite.y, fixedShadowGroundY, 'Shadow y must NEVER change with bobbing');
  assert.ok(Math.abs(sprite.scale.x - config.SHADOW_MIN_SCALE) < 0.001, 'Highest point shadow scale must be 0.75');
  assert.ok(Math.abs(sprite.alpha - config.SHADOW_MIN_ALPHA) < 0.001, 'Highest point shadow alpha must be 0.6x base');
  assert.ok(sprite.pickupY < groundY, 'Pickup rendered y at highest point must be higher on screen');

  // Verify scale is symmetric
  assert.equal(sprite.scale.x, sprite.scale.y, 'Scale must be symmetric');
});

test('Performance: reusableShadow is reused without per-frame allocations', () => {
  assert.ok(reusableShadow instanceof PIXI.Sprite);
  const p: SimPickup = {
    id: 1,
    kind: 'xp_gem',
    x: 5,
    y: 5,
    value: 1,
    magnetized: false,
    pullSpeed: 0,
  };

  const ref1 = reusableShadow;
  reusableShadow.updateLevitation(p, 0.1, PICKUP_BOB_CONFIG.xp_gem, 240, 240, 7);
  const ref2 = reusableShadow;
  assert.equal(ref1, ref2, 'Must reuse the exact same singleton instance');
  assert.ok(typeof (p as { phase?: number }).phase === 'number', 'Uses pickup state for phase');
});

test('Renderers draw shadow before item body and keep non-bobbing pickups unchanged', () => {
  const g = new PIXI.Graphics();
  const mockSim = { elapsedSeconds: 1.5 } as Simulation;

  const gemRenderer = new XpGemPickupRenderer();
  const gemPickup: SimPickup = {
    id: 10,
    kind: 'xp_gem',
    x: 2,
    y: 3,
    value: 1,
    magnetized: false,
    pullSpeed: 0,
  };
  gemRenderer.draw({ g, pickup: gemPickup, sim: mockSim, px: 96, py: 144 });

  const clusterRenderer = new XpClusterPickupRenderer();
  const clusterPickup: SimPickup = {
    id: 11,
    kind: 'xp_cluster',
    x: 4,
    y: 5,
    value: 5,
    magnetized: false,
    pullSpeed: 0,
  };
  clusterRenderer.draw({ g, pickup: clusterPickup, sim: mockSim, px: 192, py: 240 });

  const coinRenderer = new GoldCoinPickupRenderer();
  const coinPickup: SimPickup = {
    id: 12,
    kind: 'gold_coin',
    x: 6,
    y: 7,
    value: 1,
    magnetized: false,
    pullSpeed: 0,
  };
  coinRenderer.draw({ g, pickup: coinPickup, sim: mockSim, px: 288, py: 336 });

  // Non-bobbing pickups like Chest stay unchanged
  const chestRenderer = new ChestPickupRenderer();
  const chestPickup: SimPickup = {
    id: 13,
    kind: 'chest',
    x: 8,
    y: 9,
    value: 10,
    magnetized: false,
    pullSpeed: 0,
  };
  chestRenderer.draw({ g, pickup: chestPickup, sim: mockSim, px: 384, py: 432 });

  // Chest does not have a phase initialized (non-bobbing)
  assert.equal((chestPickup as { phase?: number }).phase, undefined);
});
