import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyDamage,
  applyHeal,
  applySetLowHealth,
  applyShield,
  computeHealthBarView,
  createInitialHealthBarState,
  syncGhostToCurrentHp,
} from './healthBarLogic';

test('initial state computes 100% HP, 0% shield, and non-critical status', () => {
  const state = createInitialHealthBarState(100, 100, 0);
  const view = computeHealthBarView(state);
  assert.equal(view.hpPct, 100);
  assert.equal(view.ghostPct, 100);
  assert.equal(view.shieldPct, 0);
  assert.equal(view.hasShield, false);
  assert.equal(view.isCritical, false);
});

test('applyDamage reduces HP immediately while keeping ghostHp for delayed catch-up', () => {
  const initial = createInitialHealthBarState(100, 100, 0);
  const { nextState, hpDelta, shieldDelta, shieldShattered } = applyDamage(initial, 20);
  assert.equal(hpDelta, 20);
  assert.equal(shieldDelta, 0);
  assert.equal(shieldShattered, false);
  assert.equal(nextState.hp, 80);
  assert.equal(nextState.ghostHp, 100);

  const synced = syncGhostToCurrentHp(nextState);
  assert.equal(synced.ghostHp, 80);
});

test('applyShield activates shield state and applyDamage absorbs shield before HP and triggers shatter at 0', () => {
  const initial = createInitialHealthBarState(100, 80, 0);
  const { nextState: withShield, addedShield } = applyShield(initial, 30);
  assert.equal(addedShield, 30);
  assert.equal(computeHealthBarView(withShield).hasShield, true);
  assert.equal(computeHealthBarView(withShield).shieldPct, 30);

  // First hit of 20 consumes shield only (30 -> 10), no shatter yet
  const hit1 = applyDamage(withShield, 20);
  assert.equal(hit1.nextState.shield, 10);
  assert.equal(hit1.nextState.hp, 80);
  assert.equal(hit1.shieldShattered, false);

  // Second hit of 20 breaks remaining 10 shield and deals 10 to HP, triggering shieldShattered
  const hit2 = applyDamage(hit1.nextState, 20);
  assert.equal(hit2.nextState.shield, 0);
  assert.equal(hit2.nextState.hp, 70);
  assert.equal(hit2.shieldShattered, true);
  assert.equal(computeHealthBarView(hit2.nextState).hasShield, false);
});

test('critical low health activates strictly below 25% HP and via applySetLowHealth(true/false)', () => {
  const initial = createInitialHealthBarState(100, 30, 0);
  assert.equal(computeHealthBarView(initial).isCritical, false);

  const afterHit = applyDamage(initial, 10).nextState; // 20% HP (< 25%)
  assert.equal(computeHealthBarView(afterHit).isCritical, true);

  const healed = applyHeal(afterHit, 15).nextState; // 35% HP (>= 25%)
  assert.equal(computeHealthBarView(healed).isCritical, false);

  const toggledLow = applySetLowHealth(healed, true);
  assert.equal(computeHealthBarView(toggledLow).isCritical, true);
  assert.equal(toggledLow.hp < 25, true);

  const restored = applySetLowHealth(toggledLow, false);
  assert.equal(computeHealthBarView(restored).isCritical, false);
  assert.equal(restored.hp, 35);
});

test('prefetchGameScreenAssets includes all health bar HUD static images and power-up HUD icons', async () => {
  const {
    HEALTHBAR_HUD_IMAGES,
    GAME_SCREEN_POWERUP_IMAGES,
    GAME_SCREEN_STATIC_IMAGES,
    prefetchGameScreenAssets,
    areGameScreenAssetsReady,
  } = await import('../../app/utils/prefetchGameScreenAssets');

  assert.deepEqual(HEALTHBAR_HUD_IMAGES, [
    '/healthbar-frame.png',
    '/heart-emblem.png',
    '/shield-overlay.png',
  ]);
  assert.equal(GAME_SCREEN_POWERUP_IMAGES.length, 12);
  for (const hudImg of HEALTHBAR_HUD_IMAGES) {
    assert.ok(
      GAME_SCREEN_STATIC_IMAGES.includes(hudImg),
      `GAME_SCREEN_STATIC_IMAGES must include ${hudImg}`
    );
  }
  await prefetchGameScreenAssets();
  assert.equal(areGameScreenAssetsReady(), true);
});

