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
  EchoSwingSymbol,
  PiercingSlashSymbol,
  EchoSwingIcon,
  PiercingSlashIcon,
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
  assert.equal(getCardSymbol('echo_swing'), EchoSwingSymbol);
  assert.equal(getCardSymbol('piercing_slash'), PiercingSlashSymbol);

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

  // Echo Swing: Rare halo and dedicated EchoSwingSymbol
  const htmlEcho = renderToStaticMarkup(
    <TarotIllustrationSvg targetId="echo_swing" rarity="rare" />
  );
  assert.ok(htmlEcho.includes('data-testid="tarot-symbol-echo_swing"'));
  assert.ok(htmlEcho.includes('#93C5FD')); // rare halo stop color
  assert.ok(htmlEcho.includes('stroke="#2D1E2F"')); // dark plum anime outline

  // Piercing Slash: Uncommon halo and dedicated PiercingSlashSymbol
  const htmlPierce = renderToStaticMarkup(
    <TarotIllustrationSvg targetId="piercing_slash" rarity="uncommon" />
  );
  assert.ok(htmlPierce.includes('data-testid="tarot-symbol-piercing_slash"'));
  assert.ok(htmlPierce.includes('#6EE7B7')); // uncommon halo stop color
  assert.ok(htmlPierce.includes('stroke="#2D1E2F"')); // dark plum anime outline

  // Standalone Icon wrappers
  const htmlEchoIcon = renderToStaticMarkup(<EchoSwingIcon size={96} />);
  assert.ok(htmlEchoIcon.includes('data-testid="tarot-symbol-echo_swing"'));
  assert.ok(htmlEchoIcon.includes('width="96"'));

  const htmlPierceIcon = renderToStaticMarkup(<PiercingSlashIcon size={120} />);
  assert.ok(htmlPierceIcon.includes('data-testid="tarot-symbol-piercing_slash"'));
  assert.ok(htmlPierceIcon.includes('width="120"'));

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
