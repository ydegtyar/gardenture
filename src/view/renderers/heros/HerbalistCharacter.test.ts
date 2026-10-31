import test from 'node:test';
import assert from 'node:assert/strict';
import * as PIXI from 'pixi.js';
import {
  HerbalistCharacter,
  HERBALIST_PALETTE,
  HERBALIST_PARTS_LIST,
} from './HerbalistCharacter';
import { HerbalistHeroRenderer } from './HerbalistHeroRenderer';
import { HerbalistFrierenPersonaRenderer } from './HerbalistFrierenPersonaRenderer';
import { getHeroWeaponSocket } from './GardenBladeAttachment';
import { HeroRenderer } from '../HeroRenderer';

test('HerbalistCharacter: Palette and parts list are defined', () => {
  assert.equal(HERBALIST_PALETTE.plumOutline, '#2a1a2e');
  assert.equal(HERBALIST_PALETTE.strawYellow, '#fef08a');
  assert.equal(HERBALIST_PALETTE.goldenYellow, '#f59e0b');
  assert.equal(HERBALIST_PALETTE.bandGreen, '#10b981');
  assert.equal(HERBALIST_PALETTE.flowerPink, '#f472b6');
  assert.equal(HERBALIST_PALETTE.peachSkin, '#fed7aa');
  assert.equal(HERBALIST_PALETTE.brownHair, '#78350f');
  assert.equal(HERBALIST_PALETTE.tunicGreen, '#22c55e');
  assert.equal(HERBALIST_PALETTE.tunicLightGreen, '#86efac');
  assert.equal(HERBALIST_PALETTE.creamWhite, '#fffdf0');
  assert.equal(HERBALIST_PALETTE.mintOrb, '#5eead4');
  assert.equal(HERBALIST_PALETTE.woodBrown, '#b45309');

  assert.ok(HERBALIST_PARTS_LIST.length >= 8);
  const groundRing = HERBALIST_PARTS_LIST.find((p) => p.id === 'groundRing');
  assert.ok(groundRing);
  assert.equal(groundRing?.zOrder, 0);
});

test('HerbalistCharacter: Creation, pivot at feet, and initial idle state', () => {
  const hero = new HerbalistCharacter();
  assert.equal(hero.pivot.x, 0);
  assert.equal(hero.pivot.y, 0);
  assert.equal(hero.currentState, 'idle');
  assert.ok(hero.container === hero);

  // Update idle animation across multiple frames
  for (let i = 0; i < 60; i++) {
    hero.update(1 / 60);
  }
  assert.equal(hero.currentState, 'idle');
  hero.destroy();
});

test('HerbalistCharacter: cast_heal state animation cycle', () => {
  const hero = HeroRenderer.createHerbalistCharacter();
  hero.castHeal();
  assert.equal(hero.currentState, 'cast_heal');

  // Step midway through cast
  hero.update(0.6);
  assert.equal(hero.currentState, 'cast_heal');

  // Step to completion (> 1.2s)
  hero.update(0.7);
  assert.equal(hero.currentState, 'idle');
  hero.destroy();
});

test('HerbalistCharacter: harvest state animation cycle and ground leaf burst', () => {
  const hero = new HerbalistCharacter();
  hero.harvest();
  assert.equal(hero.currentState, 'harvest');

  // Step through crouch and spring transitions
  hero.update(0.2);
  assert.equal(hero.currentState, 'harvest');

  hero.update(0.3);
  assert.equal(hero.currentState, 'harvest');

  // Step to completion (> 0.8s total)
  hero.update(0.4);
  assert.equal(hero.currentState, 'idle');
  hero.destroy();
});

test('HerbalistCharacter: Equip Garden Blade card removes hand with stick and attaches sword hand', () => {
  const hero = new HerbalistCharacter();
  assert.equal(hero.hasGardenBlade, false);

  // Initially has stick equipped
  hero.update(1 / 60);

  // Equip Garden Blade card
  hero.equipGardenBlade(true, {
    level: 2,
    evolved: false,
    phase: 'ready',
    phaseTimer: 0,
    swingCounter: 1,
  });

  assert.equal(hero.hasGardenBlade, true);
  hero.update(1 / 60);

  // Unequip Garden Blade card restores hand with stick
  hero.setGardenBlade(false);
  assert.equal(hero.hasGardenBlade, false);
  hero.update(1 / 60);

  hero.destroy();
});

test('GardenBladeAttachment: Reusable across all hero renderers', () => {
  const g = new PIXI.Graphics();

  // Test Herbalist without Garden Blade (draws hand with stick)
  const mockSimHerbalistWithoutBlade: any = {
    weapons: [{ id: 'petal_orbit' }],
  };
  const attached1 = HeroRenderer.attachGardenBladeToHero({
    gOver: g,
    hx: 100,
    cy: 200,
    displayFacingAngle: 0,
    flipX: 1,
    elapsedSeconds: 1.0,
    sim: mockSimHerbalistWithoutBlade,
    professionId: 'herbalist',
  });
  assert.equal(attached1, false);

  // Test Herbalist with Garden Blade (removes stick and attaches sword hand)
  const mockSimHerbalistWithBlade: any = {
    weapons: [
      { id: 'petal_orbit' },
      { id: 'garden_blade', level: 1, evolved: false, phase: 'ready', phaseTimer: 0, swingCounter: 0 },
    ],
  };
  const attached2 = HeroRenderer.attachGardenBladeToHero({
    gOver: g,
    hx: 100,
    cy: 200,
    displayFacingAngle: 0,
    flipX: 1,
    elapsedSeconds: 1.0,
    sim: mockSimHerbalistWithBlade,
    professionId: 'herbalist',
  });
  assert.equal(attached2, true);

  // Test Warden, Seeker, Stormcaller with Garden Blade
  for (const profId of ['warden', 'seeker', 'stormcaller']) {
    const mockSim: any = {
      weapons: [
        { id: 'garden_blade', level: 2, evolved: false, phase: 'active', phaseTimer: 0.04, swingCounter: 0 },
      ],
    };
    const attached = HeroRenderer.attachGardenBladeToHero({
      gOver: g,
      hx: 100,
      cy: 200,
      displayFacingAngle: 0.5,
      flipX: -1,
      elapsedSeconds: 2.0,
      sim: mockSim,
      professionId: profId,
    });
    assert.equal(attached, true);
  }
});

test('Hiten Jade persona skin: stick with hand is removed, leaving it only on base Herbalist hero', () => {
  // 1. HerbalistHeroRenderer.usesStickWeapon logic
  assert.equal(HerbalistHeroRenderer.usesStickWeapon(undefined), true);
  assert.equal(HerbalistHeroRenderer.usesStickWeapon(null), true);
  assert.equal(HerbalistHeroRenderer.usesStickWeapon('adventurer_default'), true);
  assert.equal(HerbalistHeroRenderer.usesStickWeapon('herbalist_frieren_strange'), false);

  // 2. HerbalistFrierenPersonaRenderer properties
  const frierenRenderer = new HerbalistFrierenPersonaRenderer();
  assert.equal(frierenRenderer.suppressDefaultWeapon, true);
  assert.equal(frierenRenderer.hasDefaultWeapon, false);
  assert.equal(frierenRenderer.weaponSocket?.drawDefaultWeapon, undefined);
  assert.equal(frierenRenderer.weaponSocket?.sleeveColor, 0x0284c7);
  assert.equal(frierenRenderer.weaponSocket?.cuffColor, 0xf8fafc);
  assert.equal(frierenRenderer.weaponSocket?.handColor, 0xffe4d6);

  // 3. Socket resolution: base Herbalist hero has drawDefaultWeapon defined
  const baseSocket = getHeroWeaponSocket('herbalist', undefined, undefined, undefined, null);
  assert.equal(typeof baseSocket.drawDefaultWeapon, 'function');

  // Socket resolution: Hiten Jade persona skin has drawDefaultWeapon suppressed
  const hitenSocket = getHeroWeaponSocket(
    'herbalist',
    undefined,
    undefined,
    frierenRenderer.weaponSocket,
    'herbalist_frieren_strange'
  );
  assert.equal(hitenSocket.drawDefaultWeapon, undefined);
  assert.equal(hitenSocket.sleeveColor, 0x0284c7);
  assert.equal(hitenSocket.cuffColor, 0xf8fafc);
  assert.equal(hitenSocket.handColor, 0xffe4d6);

  // 4. attachGardenBladeToHero simulation check:
  // Base Herbalist without Garden Blade draws default stick weapon
  let stickDrawCount = 0;
  const gBase = new PIXI.Graphics();
  const origRoundRectBase = gBase.roundRect.bind(gBase);
  gBase.roundRect = (...args: any[]) => {
    stickDrawCount++;
    return (origRoundRectBase as any)(...args);
  };

  const mockSimBaseHerbalist: any = {
    professionId: 'herbalist',
    personaId: null,
    weapons: [{ id: 'petal_orbit' }],
  };
  const attachedBase = HeroRenderer.attachGardenBladeToHero({
    gOver: gBase,
    hx: 0,
    cy: 0,
    displayFacingAngle: 0,
    flipX: 1,
    elapsedSeconds: 0,
    sim: mockSimBaseHerbalist,
    professionId: 'herbalist',
  });
  assert.equal(attachedBase, false);
  assert.ok(stickDrawCount > 0, 'Base Herbalist should draw wooden stick');

  // Hiten Jade without Garden Blade does NOT draw default stick weapon
  let hitenStickCount = 0;
  const gHiten = new PIXI.Graphics();
  const origRoundRectHiten = gHiten.roundRect.bind(gHiten);
  gHiten.roundRect = (...args: any[]) => {
    hitenStickCount++;
    return (origRoundRectHiten as any)(...args);
  };

  const mockSimHitenJade: any = {
    professionId: 'herbalist',
    personaId: 'herbalist_frieren_strange',
    weapons: [{ id: 'petal_orbit' }],
  };
  const attachedHiten = HeroRenderer.attachGardenBladeToHero({
    gOver: gHiten,
    hx: 0,
    cy: 0,
    displayFacingAngle: 0,
    flipX: 1,
    elapsedSeconds: 0,
    sim: mockSimHitenJade,
    professionId: 'herbalist',
    personaId: 'herbalist_frieren_strange',
  });
  assert.equal(attachedHiten, false);
  assert.equal(hitenStickCount, 0, 'Hiten Jade persona skin should NEVER draw wooden stick');

  // Hiten Jade WITH Garden Blade attaches sword using cerulean sleeve
  const gHitenBlade = new PIXI.Graphics();
  const mockSimHitenWithBlade: any = {
    professionId: 'herbalist',
    personaId: 'herbalist_frieren_strange',
    weapons: [
      { id: 'petal_orbit' },
      { id: 'garden_blade', level: 1, evolved: false, phase: 'ready', phaseTimer: 0, swingCounter: 0 },
    ],
  };
  const attachedHitenWithBlade = HeroRenderer.attachGardenBladeToHero({
    gOver: gHitenBlade,
    hx: 0,
    cy: 0,
    displayFacingAngle: 0,
    flipX: 1,
    elapsedSeconds: 0,
    sim: mockSimHitenWithBlade,
    professionId: 'herbalist',
    personaId: 'herbalist_frieren_strange',
  });
  assert.equal(attachedHitenWithBlade, true, 'Hiten Jade with Garden Blade equips blade');
});
