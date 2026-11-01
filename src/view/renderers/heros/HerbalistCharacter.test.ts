import test from 'node:test';
import assert from 'node:assert/strict';
import * as PIXI from 'pixi.js';
import {
  HerbalistCharacter,
  HERBALIST_PALETTE,
  HERBALIST_PARTS_LIST,
} from './HerbalistCharacter';
import { HerbalistHeroRenderer } from './HerbalistHeroRenderer';
import {
  HerbalistFrierenPersonaRenderer,
  computeHitenJadeAuraSample,
} from './HerbalistFrierenPersonaRenderer';
import {
  GardenBladeAttachment,
  getHeroWeaponSocket,
} from './GardenBladeAttachment';
import {
  ChainLightningAttachment,
  computeDeterministicLightningBolt,
} from './ChainLightningAttachment';
import {
  HeroProceduralController,
  createFacingState,
  stepFacingState,
  solveTwoBoneIK,
  createSpringChain,
  stepSpringChain,
} from './rig/HeroRigCore';
import { HeroRenderer } from '../HeroRenderer';
import { ArenaBoundary, drawFinalBossThornArena } from '../bioms/arena';

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
    assert.ok(hero.scale.x > 0 && hero.scale.y > 0, 'Hero scale must stay strictly positive');
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

test('FacingController: Smooth ~120ms 3/4 turn transition in [-1, 1] without instant snap', () => {
  let state = createFacingState(0); // Facing right (+1)
  assert.equal(state.facing, 1);

  // Turn left (-1, 0)
  state = stepFacingState(state, -1, 0, 1 / 60);
  assert.equal(state.targetSign, -1);
  // After 1 frame (~16.6ms), facing must not snap to -1 immediately
  assert.ok(state.facing > -0.95 && state.facing <= 1.0, `Expected smooth transition, got ${state.facing}`);

  // Step through ~150ms (9 frames at 60fps)
  for (let i = 0; i < 12; i++) {
    state = stepFacingState(state, -1, 0, 1 / 60);
    assert.ok(state.facing >= -1.0 && state.facing <= 1.0, 'Facing must stay bounded in [-1, 1]');
  }
  assert.ok(state.facing < -0.75, `Facing should converge toward -1 after ~150ms, got ${state.facing}`);
});

test('HeroProceduralController: Distance-driven gait phase (zero foot sliding when stationary) & positive scales', () => {
  const ctrl = new HeroProceduralController(100, 200);

  // Step while stationary (isMoving = false, velocity = 0)
  const poseIdle1 = ctrl.step({
    professionId: 'herbalist',
    personaId: 'herbalist_frieren_strange',
    hx: 100,
    cy: 198,
    groundY: 200,
    heroVx: 0,
    heroVy: 0,
    facingAngle: 0,
    elapsedSeconds: 1.0,
    dtSec: 1 / 60,
    isMoving: false,
    isDashing: false,
    isHit: false,
    isDead: false,
    isLowHealth: false,
    lowHealthRatio: 1.0,
    isLevitating: false,
  });
  const initialGait = poseIdle1.gaitPhase;
  assert.equal(initialGait, 0);
  assert.ok(poseIdle1.scaleX > 0 && poseIdle1.scaleY > 0);

  // Advance time while still at (100, 200) -> gaitPhase must remain 0 (no foot sliding!)
  const poseIdle2 = ctrl.step({
    professionId: 'herbalist',
    personaId: 'herbalist_frieren_strange',
    hx: 100,
    cy: 198,
    groundY: 200,
    heroVx: 0,
    heroVy: 0,
    facingAngle: 0,
    elapsedSeconds: 2.0,
    dtSec: 1 / 60,
    isMoving: false,
    isDashing: false,
    isHit: false,
    isDead: false,
    isLowHealth: false,
    lowHealthRatio: 1.0,
    isLevitating: false,
  });
  assert.equal(poseIdle2.gaitPhase, 0, 'Gait phase must not advance when distance travelled is 0');

  // Move hero to (112, 200) -> gaitPhase advances proportionally to distance travelled
  const poseWalk = ctrl.step({
    professionId: 'herbalist',
    personaId: 'herbalist_frieren_strange',
    hx: 112,
    cy: 198,
    groundY: 200,
    heroVx: 4.5,
    heroVy: 0,
    facingAngle: 0,
    elapsedSeconds: 2.016,
    dtSec: 1 / 60,
    isMoving: true,
    isDashing: false,
    isHit: false,
    isDead: false,
    isLowHealth: false,
    lowHealthRatio: 1.0,
    isLevitating: false,
  });
  assert.ok(poseWalk.gaitPhase > 0, 'Gait phase must advance when hero travels distance');
  assert.ok(poseWalk.scaleX > 0 && poseWalk.scaleY > 0, 'Positive scale invariant must hold');
});

test('IKSolver & SecondaryMotion: Analytic 2-bone IK and clamped spring chain stretch', () => {
  const elbow = { x: 0, y: 0 };
  const hand = { x: 0, y: 0 };

  // Target beyond max reach (10 + 10 = 20) should clamp cleanly to max reach
  solveTwoBoneIK(0, 0, 50, 0, 10, 10, 1, elbow, hand);
  const reachDist = Math.hypot(hand.x, hand.y);
  assert.ok(reachDist <= 20.0 && reachDist > 19.5, `Expected clamped reach ~19.9, got ${reachDist}`);

  // Spring chain stretch clamping
  const chain = createSpringChain('testHair', 0, 0, [6, 6, 6], 28, 0.82, 55, 1.15);
  stepSpringChain(chain, 25, -10, 12, -5, 1.5, 1 / 60, -2);
  for (let i = 1; i < chain.nodes.length; i++) {
    const p = chain.nodes[i - 1]!;
    const n = chain.nodes[i]!;
    const d = Math.hypot(n.x - p.x, n.y - p.y);
    assert.ok(
      d <= n.length * chain.maxStretchRatio + 1e-3,
      `Segment ${i} stretched beyond maxStretchRatio: ${d}`
    );
  }
});

test('Pure Samplers & Socket Attachments: Determinism and socket contract', () => {
  // 1. computeHitenJadeAuraSample determinism
  const s1 = computeHitenJadeAuraSample(3.25, 2.5, -1.2);
  const s2 = computeHitenJadeAuraSample(3.25, 2.5, -1.2);
  assert.deepEqual(s1, s2, 'computeHitenJadeAuraSample must be 100% deterministic');

  // 2. computeDeterministicLightningBolt determinism
  const b1 = computeDeterministicLightningBolt(10, 20, 110, 80, 4, 0.22, 42);
  const b2 = computeDeterministicLightningBolt(10, 20, 110, 80, 4, 0.22, 42);
  assert.deepEqual(b1, b2, 'computeDeterministicLightningBolt must be 100% deterministic');
  assert.deepEqual(b1.mainPoints[0], { x: 10, y: 20 });
  assert.deepEqual(b1.mainPoints[b1.mainPoints.length - 1], { x: 110, y: 80 });

  // 3. Socket-bound GardenBladeAttachment & ChainLightningAttachment contract
  const ctrl = new HeroProceduralController(50, 100);
  const pose = ctrl.step({
    professionId: 'herbalist',
    personaId: 'herbalist_frieren_strange',
    hx: 50,
    cy: 98,
    groundY: 100,
    heroVx: 0,
    heroVy: 0,
    facingAngle: 0,
    elapsedSeconds: 1.0,
    dtSec: 1 / 60,
    isMoving: false,
    isDashing: false,
    isHit: false,
    isDead: false,
    isLowHealth: false,
    lowHealthRatio: 1.0,
    isLevitating: false,
  });

  const bladeAttachment = new GardenBladeAttachment('herbalist', 'herbalist_frieren_strange');
  assert.equal(bladeAttachment.suppressesDefaultWeapon, true);
  assert.ok(bladeAttachment.getSocketRequirements().includes('handNear'));

  const gUnder = new PIXI.Graphics();
  const gOver = new PIXI.Graphics();
  bladeAttachment.configure(
    { level: 3, evolved: false, phase: 'active', phaseTimer: 0.04, swingCounter: 0 },
    getHeroWeaponSocket('herbalist', undefined, undefined, undefined, 'herbalist_frieren_strange'),
    1.0
  );
  bladeAttachment.update(1 / 60, pose);
  bladeAttachment.draw(gUnder, gOver, pose);

  const lightningAttachment = new ChainLightningAttachment();
  assert.equal(lightningAttachment.suppressesDefaultWeapon, false);
  assert.ok(lightningAttachment.getSocketRequirements().includes('castOrigin'));
  lightningAttachment.syncFromSimulation({
    weapons: [{ id: 'chain_lightning', evolved: false }],
    visualEffects: [{ kind: 'chain_bolt', timer: 0.1, maxTimer: 0.15 }],
    elapsedSeconds: 1.0,
  } as any);
  lightningAttachment.update(1 / 60, pose);
  assert.ok(pose.sleeveGlow > 0, 'ChainLightningAttachment should energize heroPose.sleeveGlow');
  lightningAttachment.draw(gUnder, gOver, pose);
});

test('HeroRenderer.drawHero: Pure vector rendering across all professions & personas (no sprite, no negative scale)', () => {
  const gUnder = new PIXI.Graphics();
  const gOver = new PIXI.Graphics();
  const heroSprite = new PIXI.Sprite();
  const atlas = new Map<string, PIXI.Texture>();

  const configs = [
    { professionId: 'warden', personaId: null },
    { professionId: 'warden', personaId: 'warden_zagreus_naruto' },
    { professionId: 'seeker', personaId: null },
    { professionId: 'seeker', personaId: 'seeker_hollow_levi' },
    { professionId: 'herbalist', personaId: null },
    { professionId: 'herbalist', personaId: 'herbalist_frieren_strange' },
    { professionId: 'stormcaller', personaId: null },
    { professionId: 'stormcaller', personaId: 'stormcaller_gojo_killua' },
  ];

  for (const cfg of configs) {
    for (const facingAngle of [0, Math.PI, Math.PI / 2, -Math.PI / 2]) {
      const mockSim: any = {
        professionId: cfg.professionId,
        personaId: cfg.personaId,
        heroPrevX: 10,
        heroPrevY: 10,
        heroX: 10.2,
        heroY: 10,
        heroVx: Math.cos(facingAngle) * 3,
        heroVy: Math.sin(facingAngle) * 3,
        heroFacingAngle: facingAngle,
        elapsedSeconds: 1.5,
        heroDashTimer: 0,
        heroHurtFlashTimer: 0,
        heroHp: 100,
        heroMaxHp: 100,
        heroShieldHp: 0,
        heroShieldTimer: 0,
        heroShieldBreakFadeTimer: 0,
        isWinSequence: false,
        winSequenceTimer: 0,
        weapons: [
          { id: 'garden_blade', level: 2, evolved: false, phase: 'active', phaseTimer: 0.04, swingCounter: 1 },
          { id: 'chain_lightning', level: 1, evolved: false },
        ],
        visualEffects: [],
      };

      HeroRenderer.drawHero(
        gUnder,
        heroSprite,
        gOver,
        atlas,
        mockSim,
        1.0,
        facingAngle
      );

      assert.equal(heroSprite.visible, false, 'Legacy heroSprite must remain hidden during vector rendering');
      assert.ok(heroSprite.scale.x > 0 && heroSprite.scale.y > 0, 'heroSprite scale must never be negative');
    }
  }

  // Verify that every .arc() call on gOver/gUnder is preceded by .moveTo() at the arc start point (no line from 0,0)
  for (const g of [gUnder, gOver]) {
    let lastCmd = '';
    let lastMoveX = Number.NaN;
    let lastMoveY = Number.NaN;
    const origMoveTo = g.moveTo.bind(g);
    const origArc = g.arc.bind(g);
    const origStroke = g.stroke.bind(g);

    g.moveTo = (x: number, y: number) => {
      lastCmd = 'moveTo';
      lastMoveX = x;
      lastMoveY = y;
      return origMoveTo(x, y);
    };
    g.arc = (cx: number, cy: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean) => {
      assert.equal(lastCmd, 'moveTo', 'Every g.arc() call must be preceded by g.moveTo() to prevent a line from (0, 0)');
      const expectedStartX = cx + Math.cos(startAngle) * radius;
      const expectedStartY = cy + Math.sin(startAngle) * radius;
      assert.ok(
        Math.hypot(lastMoveX - expectedStartX, lastMoveY - expectedStartY) < 0.5,
        `g.moveTo(${lastMoveX}, ${lastMoveY}) must match arc start (${expectedStartX}, ${expectedStartY})`
      );
      lastCmd = 'arc';
      return origArc(cx, cy, radius, startAngle, endAngle, anticlockwise);
    };
    g.stroke = (style?: any) => {
      lastCmd = 'stroke';
      return origStroke(style);
    };
  }

  HeroRenderer.drawHero(
    gUnder,
    heroSprite,
    gOver,
    atlas,
    {
      professionId: 'herbalist',
      personaId: 'herbalist_frieren_strange',
      heroPrevX: 15,
      heroPrevY: 15,
      heroX: 15,
      heroY: 15,
      heroVx: 0,
      heroVy: 0,
      heroFacingAngle: 0,
      elapsedSeconds: 2.0,
      weapons: [
        { id: 'garden_blade', level: 3, evolved: false, phase: 'active', phaseTimer: 0.04, swingCounter: 0 },
      ],
      visualEffects: [],
    } as any,
    1.0,
    0
  );
});

test('ArenaBoundary: Procedural Botanical Dark Fantasy Thorn Wall generation, dynamic inward growth, and arc moveTo safety', () => {
  const boundary = new ArenaBoundary({ initialRadiusPx: 600 });

  // 1. Deterministic organic edge radius
  const r0a = boundary.getOrganicEdgeRadius(0.5, 480, 1.0);
  const r0b = boundary.getOrganicEdgeRadius(0.5, 480, 1.0);
  assert.equal(r0a, r0b, 'getOrganicEdgeRadius must be deterministic');

  // 2. Dynamic inward growth state progression as targetRadiusPx shrinks
  boundary.update(1 / 60, 420);
  const gState1 = boundary.getGrowthState();
  assert.ok(gState1.radiusPx < 600 && gState1.radiusPx > 420, 'Radius should smoothly lerp inward toward target');
  assert.ok(gState1.growthProgress > 0, 'Inward constriction should increase growthProgress');

  // 3. Verify render() precedes every .arc() with .moveTo() (no stray lines from 0,0) and draws cleanly
  const g = new PIXI.Graphics();
  let lastCmd = '';
  const origMoveTo = g.moveTo.bind(g);
  const origArc = g.arc.bind(g);
  g.moveTo = (x: number, y: number) => {
    lastCmd = 'moveTo';
    return origMoveTo(x, y);
  };
  g.arc = (cx: number, cy: number, radius: number, startAngle: number, endAngle: number, anticlockwise?: boolean) => {
    assert.equal(lastCmd, 'moveTo', 'Every ArenaBoundary g.arc() must be preceded by g.moveTo()');
    lastCmd = 'arc';
    return origArc(cx, cy, radius, startAngle, endAngle, anticlockwise);
  };

  boundary.render(g, 100, 120, false);

  // Also test drawFinalBossThornArena facade with active Simulation
  drawFinalBossThornArena(
    g,
    {
      arenaActive: true,
      arenaCenterX: 2.0,
      arenaCenterY: 3.0,
      arenaRadiusU: 10.0,
    } as any,
    3.0,
    48
  );

  // 4. Zero-leak destroy()
  boundary.destroy();
});

test('ArenaBoundary: Frustum culling, zero computation in glade center, and ParticleContainer pooling', () => {
  const boundary = new ArenaBoundary({ initialRadiusPx: 800 });
  const g = new PIXI.Graphics();

  // Track draw calls
  let drawCommandCount = 0;
  const origMoveTo = g.moveTo.bind(g);
  g.moveTo = (x: number, y: number) => {
    drawCommandCount++;
    return origMoveTo(x, y);
  };

  // 1. Verify ParticleContainers and pools are pre-allocated
  assert.ok(boundary.thornParticleContainer !== undefined, 'thornParticleContainer must be initialized');
  assert.ok(boundary.moteParticleContainer !== undefined, 'moteParticleContainer must be initialized');
  assert.equal(boundary.thornParticleContainer.particleChildren.length, 240, '240 pooled thorn particles pre-allocated');
  assert.equal(boundary.moteParticleContainer.particleChildren.length, 80, '80 pooled mote particles pre-allocated');

  // 2. Camera is in the center of the arena (hero fighting in glade)
  // Arena center (0, 0), radius 800. Viewport is [-200, 200] x [-150, 150].
  // Furthest corner is Math.hypot(200, 150) = 250px < 800 - 45 = 755px.
  // 100% of the thorn wall is off-screen.
  drawCommandCount = 0;
  boundary.render(g, 0, 0, false, {
    minX: -200,
    minY: -150,
    maxX: 200,
    maxY: 150,
  });

  assert.equal(
    drawCommandCount,
    0,
    'When hero is in the arena clearing, zero thorn wall draw commands must execute (100% offscreen culling)!'
  );

  // 3. Camera moves near the eastern boundary: viewport intersects east wall
  drawCommandCount = 0;
  boundary.render(g, 0, 0, false, {
    minX: 650,
    minY: -200,
    maxX: 950,
    maxY: 200,
  });

  assert.ok(
    drawCommandCount > 0,
    'Draw commands should execute when camera approaches the thorn boundary'
  );

  // Verify that active particles on the east side have x > 0
  const activeThorns = boundary.thornParticleContainer.particleChildren.filter(
    (p) => p.scaleX > 0 && p.x > -1000
  );
  assert.ok(activeThorns.length > 0, 'Active pooled thorn particles should be positioned on visible boundary');
  for (const p of activeThorns) {
    assert.ok(p.x > 0, 'Visible thorns in eastern camera frustum must have x > 0');
  }

  // 4. Deactivate particles
  boundary.deactivateParticles();
  const remainingActive = boundary.thornParticleContainer.particleChildren.filter(
    (p) => p.scaleX > 0 && p.x > -1000
  );
  assert.equal(remainingActive.length, 0, 'All particles should be deactivated and hidden');

  // 5. Cleanup
  boundary.destroy();
});


