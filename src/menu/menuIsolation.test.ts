import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { MenuEventBus, MenuQualityMonitor, MENU_QUALITY_BUDGETS } from '../scene/menuEventBus';
import { MenuScene } from '../scene/MenuScene';

function listTypeScriptFiles(dirPath: string): string[] {
  if (!fs.existsSync(dirPath)) return [];
  const results: string[] = [];
  for (const entry of fs.readdirSync(dirPath, { withFileTypes: true })) {
    const full = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      results.push(...listTypeScriptFiles(full));
    } else if (entry.isFile() && /\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.test.ts')) {
      results.push(full);
    }
  }
  return results;
}

function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\/\/.*$/gm, '');
}

test('Menu Isolation Rule 4: menu/** and scene/** never import from game, sim, view, content, or app/context, and vice versa', () => {
  const rootDir = process.cwd();
  const menuFiles = [
    ...listTypeScriptFiles(path.join(rootDir, 'src/menu')),
    ...listTypeScriptFiles(path.join(rootDir, 'src/scene')),
  ];

  assert.ok(menuFiles.length >= 4, 'Expected menu/ and scene/ modules to exist');

  const forbiddenForMenu = [/from\s+['"][^'"]*(?:\/|^)(?:game|sim|view|content|app\/context)(?:\/|['"])/];
  for (const file of menuFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const codeOnly = stripComments(content);
    for (const pattern of forbiddenForMenu) {
      assert.equal(
        pattern.test(codeOnly),
        false,
        `Forbidden game import found in ${path.relative(rootDir, file)}`
      );
    }
    // Also verify Ticker.shared is never referenced in executable code in menu/ or scene/
    assert.equal(
      codeOnly.includes('Ticker.shared'),
      false,
      `Ticker.shared must not be used in ${path.relative(rootDir, file)}`
    );
  }

  const gameFiles = [
    ...listTypeScriptFiles(path.join(rootDir, 'src/sim')),
    ...listTypeScriptFiles(path.join(rootDir, 'src/view')),
  ];
  const forbiddenForGame = [/from\s+['"][^'"]*(?:\/|^)(?:menu|scene)(?:\/|['"])/];
  for (const file of gameFiles) {
    const content = fs.readFileSync(file, 'utf8');
    const codeOnly = stripComments(content);
    for (const pattern of forbiddenForGame) {
      assert.equal(
        pattern.test(codeOnly),
        false,
        `Forbidden menu/scene import found in ${path.relative(rootDir, file)}`
      );
    }
  }

  // Verify eslint.config.js exists and configures no-restricted-imports
  const eslintPath = path.join(rootDir, 'eslint.config.js');
  assert.ok(fs.existsSync(eslintPath), 'eslint.config.js must exist');
  const eslintSource = fs.readFileSync(eslintPath, 'utf8');
  assert.ok(eslintSource.includes('no-restricted-imports'), 'eslint.config.js must enforce no-restricted-imports');
});

test('Menu Isolation Rule 10: MenuQualityMonitor and MenuEventBus operate independently with clean teardown', () => {
  const bus = new MenuEventBus();
  const monitor = new MenuQualityMonitor('high');

  assert.equal(monitor.getTier(), 'high');
  assert.deepEqual(monitor.getBudget(), MENU_QUALITY_BUDGETS.high);

  const observedTiers: string[] = [];
  const unsubscribe = bus.on('menu:qualityChanged', ({ tier }) => {
    observedTiers.push(tier);
  });
  assert.equal(bus.listenerCount(), 1);

  // Feed slow frames (> 28ms) to trigger step-down from high -> medium
  for (let i = 0; i < 30; i++) {
    const changed = monitor.recordFrame(34);
    if (changed) {
      bus.emit('menu:qualityChanged', { tier: changed, avgFrameMs: monitor.getAverageFrameMs() });
    }
  }
  assert.equal(monitor.getTier(), 'medium');
  assert.deepEqual(observedTiers, ['medium']);

  // Advance past cooldown (30 frames) + 30 slow frames (> 36ms) to step down from medium -> low
  for (let i = 0; i < 65; i++) {
    const changed = monitor.recordFrame(42);
    if (changed) {
      bus.emit('menu:qualityChanged', { tier: changed, avgFrameMs: monitor.getAverageFrameMs() });
    }
  }
  assert.equal(monitor.getTier(), 'low');
  assert.deepEqual(observedTiers, ['medium', 'low']);

  unsubscribe();
  assert.equal(bus.listenerCount(), 0);

  monitor.setTier('high');
  assert.equal(monitor.getTier(), 'high');
});

test('Menu Isolation Rules 6 & 7: MenuScene 20x idempotent mount/unmount leaves zero orphan resources and emits scene:transitionDone', async () => {
  MenuScene.resetGlobalDiagnostics();
  const bus = new MenuEventBus();
  let fallbackCallbacks = 0;

  for (let cycle = 0; cycle < 20; cycle++) {
    const scene = new MenuScene({
      bus,
      onFallbackRequired: () => {
        fallbackCallbacks += 1;
      },
    });

    // In headless Node environment without DOM, mount() triggers graceful failure containment fallback
    const mounted = await scene.mount(null as unknown as HTMLElement);
    assert.equal(mounted, false);

    // Verify menu:start -> scene:transitionDone contract while subscribed
    let transitionDoneCount = 0;
    const offDone = bus.on('scene:transitionDone', () => {
      transitionDoneCount += 1;
    });
    bus.emit('menu:start', { mode: 'new' });
    assert.equal(transitionDoneCount, 1, 'Expected scene:transitionDone to fire when menu:start is emitted');
    offDone();

    await scene.unmount();
    // Second unmount call is idempotent
    await scene.unmount();
  }

  assert.equal(fallbackCallbacks, 20, 'Expected all 20 headless mounts to invoke fallback containment');
  const diag = MenuScene.getGlobalDiagnostics();
  assert.equal(diag.activeInstances, 0, 'Expected 0 active MenuScene instances after 20x mount/unmount');
  assert.equal(diag.activeListeners, 0, 'Expected 0 active window listeners after 20x mount/unmount');
  assert.equal(diag.activeTextures, 0, 'Expected 0 active textures after 20x mount/unmount');
  assert.equal(bus.listenerCount(), 0, 'Expected 0 bus listeners remaining after unmount');
});
