import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  TrinketCornerFiligreeSvg,
  TrinketLevelCrestBadge,
  TrinketRelicArt,
  TrinketBacklightAura,
  TrinketAscendedHalo,
  getAuraGlowColor,
  getCornerFiligreeColors,
  getFloatingParticles,
  getTrinketEvolution,
  registerTrinketEvolution,
  AegisLeafEvolution,
  CloverCharmEvolution,
  MagnetRootEvolution,
  WindAnkletEvolution,
} from './index';

test('Trinkets: Corner filigree positions and color token resolution', () => {
  const tl = renderToStaticMarkup(<TrinketCornerFiligreeSvg position="tl" />);
  assert.ok(tl.includes('top-[2px] left-[2px] rotate-0'));

  const br = renderToStaticMarkup(<TrinketCornerFiligreeSvg position="br" />);
  assert.ok(br.includes('bottom-[2px] right-[2px] rotate-180'));

  // Curse variant colors
  const curseFiligree = renderToStaticMarkup(
    <TrinketCornerFiligreeSvg position="tr" variant="curse" active={true} />
  );
  assert.ok(curseFiligree.includes('#E1384B')); // active curse primary stroke

  const lockedTokens = getCornerFiligreeColors(true, 'trinket', false);
  assert.equal(lockedTokens.primaryStroke, '#6A6358');
  assert.equal(lockedTokens.fillOpacity, 0.35);
});

test('Trinkets: Level crest badges render correct labels and test IDs', () => {
  const lv1 = renderToStaticMarkup(
    <TrinketLevelCrestBadge level={1} trinketId="aegis_leaf" />
  );
  assert.ok(lv1.includes('data-testid="trinket-level-aegis_leaf"'));
  assert.ok(lv1.includes('LV 1'));

  const maxTrinket = renderToStaticMarkup(
    <TrinketLevelCrestBadge level={3} trinketId="clover_charm" />
  );
  assert.ok(maxTrinket.includes('MAX'));

  const maxCurse = renderToStaticMarkup(
    <TrinketLevelCrestBadge level={3} trinketId="curse_thorn" variant="curse" />
  );
  assert.ok(maxCurse.includes('data-testid="sigil-level-curse_thorn"'));
  assert.ok(maxCurse.includes('LV 3'));
});

test('Trinkets: Evolution strategy registry resolves components', () => {
  assert.equal(getTrinketEvolution('aegis_leaf'), AegisLeafEvolution);
  assert.equal(getTrinketEvolution('clover_charm'), CloverCharmEvolution);
  assert.equal(getTrinketEvolution('magnet_root'), MagnetRootEvolution);
  assert.equal(getTrinketEvolution('wind_anklet'), WindAnkletEvolution);

  // Dynamic registration test
  const DummyEvolution: React.FC = () => <g id="custom-evolution" />;
  registerTrinketEvolution('dummy_trinket' as any, DummyEvolution as any);
  assert.equal(getTrinketEvolution('dummy_trinket' as any), DummyEvolution);
});

test('Trinkets: TrinketRelicArt renders correct images, auras, halos and test IDs', () => {
  // Locked Level 0
  const lockedMarkup = renderToStaticMarkup(
    <TrinketRelicArt trinketId="aegis_leaf" level={0} />
  );
  assert.ok(lockedMarkup.includes('data-testid="trinket-art-aegis_leaf-lv0"'));
  assert.ok(lockedMarkup.includes('/assets/trinkets/aegis_leaf_locked.png'));
  assert.ok(lockedMarkup.includes('brightness-90'));

  // Level 1
  const lv1Markup = renderToStaticMarkup(
    <TrinketRelicArt trinketId="clover_charm" level={1} />
  );
  assert.ok(lv1Markup.includes('data-testid="trinket-art-clover_charm-lv1"'));
  assert.ok(lv1Markup.includes('/assets/trinkets/clover_charm_lv1.png'));

  // Level 3 (includes golden halo)
  const lv3Markup = renderToStaticMarkup(
    <TrinketRelicArt trinketId="magnet_root" level={3} />
  );
  assert.ok(lv3Markup.includes('data-testid="trinket-art-magnet_root-lv3"'));
  assert.ok(lv3Markup.includes('/assets/trinkets/magnet_root_lv3.png'));
  assert.ok(lv3Markup.includes('halo-gold-magnet_root-lv3')); // Lv 3 ascended halo linearGradient
});

test('Trinkets: Theme helpers return correct visual values', () => {
  // Aura glow
  assert.equal(getAuraGlowColor('aegis_leaf', 0), 'rgba(90, 96, 108, 0.14)');
  assert.equal(getAuraGlowColor('aegis_leaf', 3), 'rgba(72, 229, 122, 0.36)');
  assert.equal(getAuraGlowColor('clover_charm', 3), 'rgba(245, 203, 92, 0.38)');
  assert.equal(getAuraGlowColor('magnet_root', 3), 'rgba(255, 136, 17, 0.42)');

  // Particles
  assert.equal(getFloatingParticles(0).length, 0);
  assert.equal(getFloatingParticles(1).length, 3);
  assert.equal(getFloatingParticles(2).length, 5);
  assert.equal(getFloatingParticles(3).length, 8);
});
