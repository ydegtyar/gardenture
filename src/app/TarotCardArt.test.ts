import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  getTarotMetadata,
  CARD_ICON_COMPONENTS,
  LeafBladeIcon,
  getCardSymbol,
  EchoSwingSymbol,
  PiercingSlashSymbol,
  EchoSwingIcon,
  PiercingSlashIcon,
  TarotIllustrationSvg,
} from './TarotCardArt';
import { WEAPONS } from '../content/data/catalog';
import { buildLeafBladeSpriteSvg, buildLeafBladeTarotCardSvg } from '../../scripts/generate-leaf-blade-assets.mjs';

test('TarotCardArt: Leaf Blade Tarot metadata & icon registration', () => {
  const metaLeaf = getTarotMetadata('leaf_blade');
  assert.equal(metaLeaf.numeral, 'I');
  assert.equal(metaLeaf.arcanaTitle, 'BLADE OF THE GROVE');

  const metaGarden = getTarotMetadata('garden_blade');
  assert.equal(metaGarden.numeral, 'I');
  assert.equal(metaGarden.arcanaTitle, 'BLADE OF THE GROVE');

  assert.equal(CARD_ICON_COMPONENTS.garden_blade, LeafBladeIcon);
  assert.equal(CARD_ICON_COMPONENTS.leaf_blade, LeafBladeIcon);
});

test('Catalog: garden_blade display name is Leaf Blade', () => {
  const blade = WEAPONS.garden_blade;
  assert.ok(blade, 'garden_blade must exist in catalog');
  assert.equal(blade.name, 'Leaf Blade');
  assert.equal(blade.color, 0x7be0a8);
  assert.ok(blade.tags.includes('melee'));
  assert.ok(blade.tags.includes('slash'));
});

test('Assets: Leaf Blade 1024x1024 sprite and Tarot Card files exist', () => {
  const spritePng = path.resolve('public/assets/weapons/leaf-blade-1024.png');
  const spriteSvg = path.resolve('public/assets/weapons/leaf-blade-1024.svg');
  const cardPng = path.resolve('public/assets/weapons/leaf-blade-card.png');
  const cardSvg = path.resolve('public/assets/weapons/leaf-blade-card.svg');

  assert.ok(fs.existsSync(spritePng), '1024x1024 sprite PNG must exist');
  assert.ok(fs.existsSync(spriteSvg), '1024x1024 sprite SVG must exist');
  assert.ok(fs.existsSync(cardPng), 'Tarot card PNG must exist');
  assert.ok(fs.existsSync(cardSvg), 'Tarot card SVG must exist');

  assert.ok(fs.statSync(spritePng).size > 10000, 'Sprite PNG should have meaningful byte size');
  assert.ok(fs.statSync(cardPng).size > 10000, 'Card PNG should have meaningful byte size');
});

test('SVG Generator: Valid vector definitions for Leaf Blade', () => {
  const spriteSvg = buildLeafBladeSpriteSvg();
  assert.ok(spriteSvg.includes('viewBox="0 0 1024 1024"'));
  assert.ok(spriteSvg.includes('#7be0a8'), 'Must include main mint-green fill');
  assert.ok(spriteSvg.includes('#4fb67f'), 'Must include one shade darker lower edge fill');
  assert.ok(spriteSvg.includes('#2a1f33'), 'Must include thick plum-navy outline');
  assert.ok(spriteSvg.includes('#f8d558'), 'Must include golden crossguard/pommel');
  assert.ok(spriteSvg.includes('#7a482b'), 'Must include brown grip');
  assert.ok(spriteSvg.includes('#e2f8eb'), 'Must include pale-green midrib');
  assert.ok(spriteSvg.includes('rotate(45'), 'Must be rotated 45 degrees');

  const cardSvg = buildLeafBladeTarotCardSvg();
  assert.ok(cardSvg.includes('Leaf Blade'), 'Must include card title');
  assert.ok(cardSvg.includes('MELEE'), 'Must include MELEE tag');
  assert.ok(cardSvg.includes('BLADE OF THE GROVE'), 'Must include arcana title');
  assert.ok(cardSvg.includes('#2a1f33'), 'Must include plum-navy outline');
});

test('TarotCardArt: Echo Swing and Piercing Slash arts, metadata, and symbols', () => {
  // Metadata completeness
  const metaEcho = getTarotMetadata('echo_swing');
  assert.equal(metaEcho.numeral, 'XIII');
  assert.equal(metaEcho.arcanaTitle, 'THE TWIN ECHO');

  const metaPierce = getTarotMetadata('piercing_slash');
  assert.equal(metaPierce.numeral, 'XXI');
  assert.equal(metaPierce.arcanaTitle, 'THE SUNDERED WARD');

  // Dedicated symbol resolution
  assert.equal(getCardSymbol('echo_swing'), EchoSwingSymbol);
  assert.equal(getCardSymbol('piercing_slash'), PiercingSlashSymbol);

  // Tarot illustration rendering with anime dark outlines & preserved test IDs
  const echoMarkup = renderToStaticMarkup(
    React.createElement(TarotIllustrationSvg, { targetId: 'echo_swing', rarity: 'rare' })
  );
  assert.ok(echoMarkup.includes('data-testid="tarot-symbol-echo_swing"'));
  assert.ok(echoMarkup.includes('stroke="#2D1E2F"'));
  assert.ok(echoMarkup.includes('#93C5FD')); // Rare halo color

  const pierceMarkup = renderToStaticMarkup(
    React.createElement(TarotIllustrationSvg, { targetId: 'piercing_slash', rarity: 'uncommon' })
  );
  assert.ok(pierceMarkup.includes('data-testid="tarot-symbol-piercing_slash"'));
  assert.ok(pierceMarkup.includes('stroke="#2D1E2F"'));
  assert.ok(pierceMarkup.includes('#6EE7B7')); // Uncommon halo color

  // Standalone Icon wrappers exported through TarotCardArt
  const echoIconMarkup = renderToStaticMarkup(React.createElement(EchoSwingIcon, { size: 96 }));
  assert.ok(echoIconMarkup.includes('data-testid="tarot-symbol-echo_swing"'));
  assert.ok(echoIconMarkup.includes('width="96"'));

  const pierceIconMarkup = renderToStaticMarkup(React.createElement(PiercingSlashIcon, { size: 120 }));
  assert.ok(pierceIconMarkup.includes('data-testid="tarot-symbol-piercing_slash"'));
  assert.ok(pierceIconMarkup.includes('width="120"'));
});
