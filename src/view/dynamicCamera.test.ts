import test from 'node:test';
import assert from 'node:assert/strict';
import {
  COMBAT_ENTER_DIST,
  COMBAT_EXIT_DIST,
  DEAD_ZONE_RATIO,
  DynamicCamera,
  FOLLOW_SPEED,
  LOOK_AHEAD,
  ZOOM_IN_SPEED,
  ZOOM_MAX,
  ZOOM_MIN,
  ZOOM_MIN_COMBAT,
  ZOOM_OUT_DELAY,
  ZOOM_OUT_SPEED,
} from './DynamicCamera';

test('DynamicCamera exports required configuration constants', () => {
  assert.equal(COMBAT_ENTER_DIST, 300);
  assert.equal(COMBAT_EXIT_DIST, 450);
  assert.ok(ZOOM_IN_SPEED > ZOOM_OUT_SPEED, 'Zoom-in speed should be faster than zoom-out speed');
  assert.ok(ZOOM_OUT_DELAY >= 0.5 && ZOOM_OUT_DELAY <= 1.0, 'ZOOM_OUT_DELAY should be 0.5-1.0s');
  assert.ok(FOLLOW_SPEED > 0);
  assert.ok(LOOK_AHEAD > 0);
  assert.ok(ZOOM_MIN_COMBAT > ZOOM_MAX, 'Combat zoom scale should zoom in closer than exploration scale');
  assert.ok(ZOOM_MIN <= ZOOM_MAX);
});

test('DynamicCamera zooms in smoothly during combat and zooms out in exploration', () => {
  const cam = new DynamicCamera();
  cam.reset(0, 0, ZOOM_MAX);

  // 1. Exploration with no enemies: stays at ZOOM_MAX (zoomed out)
  for (let i = 0; i < 60; i++) {
    cam.update({
      heroX: 0,
      heroY: 0,
      heroVx: 0,
      heroVy: 0,
      ppu: 1,
      enemies: [],
      screenW: 1440,
      screenH: 900,
      dt: 1 / 60,
    });
  }
  assert.equal(cam.inCombat, false);
  assert.ok(Math.abs(cam.zoom - ZOOM_MAX) < 0.005);

  // 2. Enemy enters within COMBAT_ENTER_DIST (e.g. 120px away): smoothly zooms IN without snapping
  const closeEnemy = [{ x: 120, y: 0, hp: 50 }];
  cam.update({
    heroX: 0,
    heroY: 0,
    heroVx: 0,
    heroVy: 0,
    ppu: 1,
    enemies: closeEnemy,
    screenW: 1440,
    screenH: 900,
    dt: 1 / 60,
  });

  // First frame must not snap directly to target
  assert.equal(cam.inCombat, true);
  assert.ok(
    cam.zoom > ZOOM_MAX && cam.zoom < ZOOM_MAX + 0.05,
    `Expected smooth first step, got ${cam.zoom}`
  );

  // Over 1.5 seconds, zoom smoothly approaches combat zoom-in
  let prevZoom = cam.zoom;
  for (let i = 0; i < 90; i++) {
    cam.update({
      heroX: 0,
      heroY: 0,
      heroVx: 0,
      heroVy: 0,
      ppu: 1,
      enemies: closeEnemy,
      screenW: 1440,
      screenH: 900,
      dt: 1 / 60,
    });
    assert.ok(cam.zoom >= prevZoom - 1e-6, 'Zoom should increase monotonically during combat entry');
    prevZoom = cam.zoom;
  }
  assert.ok(
    cam.zoom > ZOOM_MAX + (ZOOM_MIN_COMBAT - ZOOM_MAX) * 0.75,
    `Expected significant combat zoom-in, got ${cam.zoom}`
  );
});

test('Hysteresis prevents flickering when enemy hovers around 300px-450px threshold', () => {
  const cam = new DynamicCamera();
  cam.reset(0, 0, ZOOM_MAX);

  // Enemy at 360px (between 300px enter and 450px exit) while not yet in combat: does NOT enter combat
  for (let i = 0; i < 30; i++) {
    cam.update({
      heroX: 0,
      heroY: 0,
      heroVx: 0,
      heroVy: 0,
      ppu: 1,
      enemies: [{ x: 360, y: 0, hp: 40 }],
      screenW: 1440,
      screenH: 900,
      dt: 1 / 60,
    });
  }
  assert.equal(cam.inCombat, false, 'Should not enter combat above 300px');

  // Enemy steps to 290px (<= 300px): enters combat
  cam.update({
    heroX: 0,
    heroY: 0,
    heroVx: 0,
    heroVy: 0,
    ppu: 1,
    enemies: [{ x: 290, y: 0, hp: 40 }],
    screenW: 1440,
    screenH: 900,
    dt: 1 / 60,
  });
  assert.equal(cam.inCombat, true, 'Should enter combat at <= 300px');

  // Enemy hovers and oscillates between 295px and 435px for 2 seconds: must stay in combat without flickering
  for (let i = 0; i < 120; i++) {
    const oscillatingDist = 365 + Math.sin(i * 0.3) * 70; // 295px .. 435px
    cam.update({
      heroX: 0,
      heroY: 0,
      heroVx: 0,
      heroVy: 0,
      ppu: 1,
      enemies: [{ x: oscillatingDist, y: 0, hp: 40 }],
      screenW: 1440,
      screenH: 900,
      dt: 1 / 60,
    });
    assert.equal(cam.inCombat, true, `Combat state flickered at frame ${i} (dist=${oscillatingDist})`);
  }
});

test('ZOOM_OUT_DELAY holds combat zoom briefly after last enemy leaves range before zooming out', () => {
  const cam = new DynamicCamera();
  cam.reset(0, 0, ZOOM_MAX);

  // Enter combat and stabilize for 1.5s
  for (let i = 0; i < 90; i++) {
    cam.update({
      heroX: 0,
      heroY: 0,
      heroVx: 0,
      heroVy: 0,
      ppu: 1,
      enemies: [{ x: 150, y: 0, hp: 40 }],
      screenW: 1440,
      screenH: 900,
      dt: 1 / 60,
    });
  }
  const combatZoom = cam.zoom;
  assert.ok(combatZoom > 1.1);

  // Enemy disappears (killed). Advance for 0.4s (< ZOOM_OUT_DELAY = 0.75s)
  for (let i = 0; i < 24; i++) {
    cam.update({
      heroX: 0,
      heroY: 0,
      heroVx: 0,
      heroVy: 0,
      ppu: 1,
      enemies: [],
      screenW: 1440,
      screenH: 900,
      dt: 1 / 60,
    });
  }
  assert.equal(cam.inCombat, true, 'Should remain in combat during ZOOM_OUT_DELAY');
  assert.ok(cam.zoom >= combatZoom - 0.01, 'Zoom should hold steady during ZOOM_OUT_DELAY');

  // Advance past ZOOM_OUT_DELAY (another 2.5 seconds) -> smoothly zooms out toward ZOOM_MAX
  for (let i = 0; i < 150; i++) {
    cam.update({
      heroX: 0,
      heroY: 0,
      heroVx: 0,
      heroVy: 0,
      ppu: 1,
      enemies: [],
      screenW: 1440,
      screenH: 900,
      dt: 1 / 60,
    });
  }
  assert.equal(cam.inCombat, false);
  assert.ok(cam.zoom < combatZoom - 0.15, 'Should smoothly zoom out after delay expires');
});

test('Dead-zone suppresses tiny hero jitter while look-ahead leads movement', () => {
  const cam = new DynamicCamera();
  cam.reset(0, 0, ZOOM_MAX);

  // Tiny adjustment well inside 10% screen dead-zone (e.g. 8px on a 1440px screen)
  const deadZoneLimitPx = (1440 * DEAD_ZONE_RATIO * 0.5) / ZOOM_MAX;
  assert.ok(deadZoneLimitPx > 50);

  cam.update({
    heroX: 10,
    heroY: -6,
    heroVx: 0,
    heroVy: 0,
    ppu: 1,
    enemies: [],
    screenW: 1440,
    screenH: 900,
    dt: 1 / 60,
  });
  // Camera moves minimally (only gentle recentering drift, < 0.25px)
  assert.ok(Math.abs(cam.x) < 0.25, `Expected dead-zone stability, got cam.x=${cam.x}`);

  // Sustained movement to the right with velocity triggers smooth look-ahead
  let heroX = 0;
  const speedPx = 260;
  for (let i = 0; i < 90; i++) {
    const dt = 1 / 60;
    heroX += speedPx * dt;
    cam.update({
      heroX,
      heroY: 0,
      heroVx: speedPx,
      heroVy: 0,
      ppu: 1,
      enemies: [],
      screenW: 1440,
      screenH: 900,
      dt,
    });
  }
  // With look-ahead, camera leads or tracks smoothly in the movement direction
  assert.ok(cam.x > heroX - deadZoneLimitPx, 'Camera should follow moving hero with look-ahead');
});

test('World bounds clamp camera at every zoom level while keeping hero visible', () => {
  const cam = new DynamicCamera();
  const bounds = { minX: -1200, maxX: 1200, minY: -900, maxY: 900 };
  cam.reset(1150, 850, ZOOM_MAX);

  for (let i = 0; i < 60; i++) {
    cam.update({
      heroX: 1150,
      heroY: 850,
      heroVx: 200,
      heroVy: 200,
      ppu: 1,
      enemies: i > 30 ? [{ x: 1100, y: 820, hp: 50 }] : [],
      screenW: 1440,
      screenH: 900,
      dt: 1 / 60,
      worldBounds: bounds,
    });

    const halfViewW = (1440 * 0.5) / cam.zoom;
    const halfViewH = (900 * 0.5) / cam.zoom;

    // Camera viewport edges must never exceed worldBounds
    assert.ok(
      cam.x + halfViewW <= bounds.maxX + 1e-4,
      `Right edge exceeded world bounds: ${cam.x + halfViewW} > ${bounds.maxX}`
    );
    assert.ok(
      cam.x - halfViewW >= bounds.minX - 1e-4,
      `Left edge exceeded world bounds: ${cam.x - halfViewW} < ${bounds.minX}`
    );
    assert.ok(
      cam.y + halfViewH <= bounds.maxY + 1e-4,
      `Bottom edge exceeded world bounds: ${cam.y + halfViewH} > ${bounds.maxY}`
    );
    assert.ok(
      cam.y - halfViewH >= bounds.minY - 1e-4,
      `Top edge exceeded world bounds: ${cam.y - halfViewH} < ${bounds.minY}`
    );

    // Hero at (1150, 850) must be visible inside viewport [cam.x - halfViewW, cam.x + halfViewW]
    assert.ok(1150 >= cam.x - halfViewW && 1150 <= cam.x + halfViewW, 'Hero X must remain visible');
    assert.ok(850 >= cam.y - halfViewH && 850 <= cam.y + halfViewH, 'Hero Y must remain visible');
  }
});

test('Frame-rate independence: 30 FPS, 60 FPS, and 144 FPS converge consistently', () => {
  function runAtFps(fps: number): { x: number; y: number; zoom: number } {
    const cam = new DynamicCamera();
    cam.reset(0, 0, ZOOM_MAX);
    const dt = 1 / fps;
    const steps = Math.round(1.0 * fps);
    let hx = 0;
    let hy = 0;
    const vx = 220;
    const vy = 110;

    for (let i = 0; i < steps; i++) {
      hx += vx * dt;
      hy += vy * dt;
      cam.update({
        heroX: hx,
        heroY: hy,
        heroVx: vx,
        heroVy: vy,
        ppu: 1,
        enemies: [{ x: hx + 140, y: hy, hp: 50 }],
        screenW: 1440,
        screenH: 900,
        dt,
      });
    }
    return { x: cam.x, y: cam.y, zoom: cam.zoom };
  }

  const r30 = runAtFps(30);
  const r60 = runAtFps(60);
  const r144 = runAtFps(144);

  assert.ok(
    Math.abs(r30.zoom - r60.zoom) < 0.015 && Math.abs(r60.zoom - r144.zoom) < 0.01,
    `Zoom diverged across FPS: 30fps=${r30.zoom}, 60fps=${r60.zoom}, 144fps=${r144.zoom}`
  );
  assert.ok(
    Math.abs(r30.x - r60.x) < 4.5 && Math.abs(r60.x - r144.x) < 2.5,
    `Position X diverged across FPS: 30fps=${r30.x}, 60fps=${r60.x}, 144fps=${r144.x}`
  );
});
