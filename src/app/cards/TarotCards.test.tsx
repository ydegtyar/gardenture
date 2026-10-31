import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  getTarotMetadata,
  TAROT_METADATA,
  TarotCardBackSvg,
  TarotIllustrationSvg,
  getCardSymbol,
  registerCardSymbol,
  CARD_ICON_COMPONENTS,
  LeafBladeSymbol,
  FleetStepSymbol,
  DoubleDashSymbol,
} from './index';

test('TarotCards: metadata completeness and fallback', () => {
  assert.equal(getTarotMetadata('leaf_blade').numeral, 'I');
  assert.equal(getTarotMetadata('leaf_blade').arcanaTitle, 'BLADE OF THE GROVE');
  assert.equal(getTarotMetadata('fleet_step').numeral, 'XII');
  assert.equal(getTarotMetadata('fleet_step').arcanaTitle, 'THE PHANTOM STEP');
  assert.equal(getTarotMetadata('double_dash').numeral, 'XVII');
  assert.equal(getTarotMetadata('double_dash').arcanaTitle, 'THE DUAL ZEPHYR');

  // Fallback for unknown card
  const fallback = getTarotMetadata('unknown_mystic_card');
  assert.equal(fallback.numeral, 'ARCANA');
  assert.equal(fallback.arcanaTitle, 'MYSTIC BLESSING');

  // Ensure all metadata entries have non-empty numerals and arcana titles
  for (const [id, meta] of Object.entries(TAROT_METADATA)) {
    assert.ok(meta.numeral.length > 0, `${id} numeral should not be empty`);
    assert.ok(meta.arcanaTitle.length > 0, `${id} arcanaTitle should not be empty`);
  }
});

test('TarotCards: symbol registry pattern resolves symbols', () => {
  // Direct matching
  assert.equal(getCardSymbol('leaf_blade'), LeafBladeSymbol);
  assert.equal(getCardSymbol('fleet_step'), FleetStepSymbol);
  assert.equal(getCardSymbol('double_dash'), DoubleDashSymbol);

  // Fallback
  const fallbackSymbol = getCardSymbol('non_existent_card');
  assert.ok(fallbackSymbol, 'Fallback symbol should be resolved');

  // Custom registration
  const dummySymbol: React.FC = () => <g id="custom-test-symbol" />;
  registerCardSymbol('test_custom_symbol', dummySymbol as any);
  assert.equal(getCardSymbol('test_custom_symbol'), dummySymbol);
});

test('TarotCards: TarotIllustrationSvg renders with symbols and preserved test IDs', () => {
  const htmlFleet = renderToStaticMarkup(
    <TarotIllustrationSvg targetId="fleet_step" rarity="uncommon" />
  );
  assert.ok(htmlFleet.includes('data-testid="tarot-symbol-fleet_step"'));
  assert.ok(htmlFleet.includes('<svg'));
  assert.ok(htmlFleet.includes('<defs>'));

  const htmlDash = renderToStaticMarkup(
    <TarotIllustrationSvg targetId="double_dash" rarity="legendary" />
  );
  assert.ok(htmlDash.includes('data-testid="tarot-symbol-double_dash"'));
  assert.ok(htmlDash.includes('#FDE047')); // legendary halo stop color

  // Custom icon check (e.g. magnet_moss or leaf_blade)
  const htmlMoss = renderToStaticMarkup(
    <TarotIllustrationSvg targetId="magnet_moss" rarity="rare" />
  );
  assert.ok(htmlMoss.includes('Magnet Moss'));
});

test('TarotCards: TarotCardBackSvg renders both orientations', () => {
  const verticalMarkup = renderToStaticMarkup(<TarotCardBackSvg orientation="vertical" />);
  assert.ok(verticalMarkup.includes('viewBox="0 0 180 260"'));

  const horizontalMarkup = renderToStaticMarkup(<TarotCardBackSvg orientation="horizontal" />);
  assert.ok(horizontalMarkup.includes('viewBox="0 0 420 116"'));
});
