import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  POWERUPS,
  POWERUP_LIST,
  getPowerUpDef,
  powerUpIcon,
  powerUpIconPng,
  toPowerUpId,
  toSimPowerUpId,
} from './powerups';
import {
  MONSTERS,
  getMonsterDrops,
  getMonstersDroppingPowerUp,
} from './monsters';

describe('Tactical Arena Power-Up Registry & Bestiary Monster Drops', () => {
  it('defines all 6 canonical power-ups with matching accent, tint, durationSec, and descriptions', () => {
    assert.equal(POWERUP_LIST.length, 6);
    assert.equal(POWERUPS['aegis-orb'].accent, '#4FD1B5');
    assert.equal(POWERUPS['aegis-orb'].tint, 0x4fd1b5);
    assert.equal(POWERUPS['aegis-orb'].durationSec, 20);

    assert.equal(POWERUPS['frost-flask'].accent, '#6FA8FF');
    assert.equal(POWERUPS['frost-flask'].tint, 0x6fa8ff);
    assert.equal(POWERUPS['frost-flask'].durationSec, 3.5);

    assert.equal(POWERUPS['ember-guard'].accent, '#FF8A3D');
    assert.equal(POWERUPS['ember-guard'].tint, 0xff8a3d);
    assert.equal(POWERUPS['ember-guard'].durationSec, 3);

    assert.equal(POWERUPS['clover-magnet'].accent, '#FF5C8A');
    assert.equal(POWERUPS['clover-magnet'].tint, 0xff5c8a);
    assert.equal(POWERUPS['clover-magnet'].durationSec, 0.5);

    assert.equal(POWERUPS['sundial-watch'].accent, '#B9A6FF');
    assert.equal(POWERUPS['sundial-watch'].tint, 0xb9a6ff);
    assert.equal(POWERUPS['sundial-watch'].durationSec, 4);

    assert.equal(POWERUPS['heal-20hp'].accent, '#2ECC8F');
    assert.equal(POWERUPS['heal-20hp'].tint, 0x2ecc8f);
    assert.equal(POWERUPS['heal-20hp'].durationSec, 1.05);
  });

  it('resolves asset paths via powerUpIcon and powerUpIconPng for both canonical and sim IDs', () => {
    assert.equal(
      powerUpIcon('aegis-orb', 128),
      '/assets/powerups/aegis-orb@128.webp'
    );
    assert.equal(
      powerUpIcon('shield', 64),
      '/assets/powerups/aegis-orb@64.webp'
    );
    assert.equal(
      powerUpIconPng('heal_potion', 256),
      '/assets/powerups/heal-20hp@256.png'
    );
    assert.equal(toSimPowerUpId('sundial-watch'), 'time_slow');
    assert.equal(toPowerUpId('fire_breath'), 'ember-guard');
    assert.equal(getPowerUpDef('magnet').id, 'clover-magnet');
  });

  it('maps Bestiary monsters to their power-up drops and supports reverse lookup', () => {
    assert.ok(Object.keys(MONSTERS).length >= 10);
    const goldenBeastDrops = getMonsterDrops('special_golden_beast');
    assert.ok(goldenBeastDrops.includes('clover-magnet'));
    assert.ok(goldenBeastDrops.includes('sundial-watch'));

    for (const def of POWERUP_LIST) {
      const droppers = getMonstersDroppingPowerUp(def.id);
      assert.ok(
        droppers.length > 0,
        `Expected at least one monster to drop ${def.id}`
      );
    }
  });
});
