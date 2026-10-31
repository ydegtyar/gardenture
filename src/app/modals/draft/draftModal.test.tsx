import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  createInitialDraftSequenceState,
  draftSequenceReducer,
  DRAFT_TIMINGS,
  getFlipBackTotalMs,
  getRevealTotalMs,
} from './useDraftSequence';
import {
  GameButton,
  OrnateFrame,
  StatPill,
  ORNAMENT_ASSETS,
  getOrnamentAsset,
} from '../../../ui/ornate';
import { DraftCard } from './DraftCard';
import { DraftActions } from './DraftActions';
import type { DraftOfferItem } from '../../../sim/systems/cardDraft';

const MOCK_OFFERS: DraftOfferItem[] = [
  {
    offerId: 'card_glass_blade',
    kind: 'card',
    targetId: 'glass_blade',
    title: 'Glass Blade',
    subtitle: 'RISK REWARD · RARE',
    description: '+45% All Damage dealt, but -20% Max HP.',
    rarity: 'rare',
    currentLevel: 0,
    nextLevel: 1,
    maxLevel: 3,
    tags: ['melee', 'crit'],
    iconColor: '#38bdf8',
  },
  {
    offerId: 'card_iron_bark',
    kind: 'card',
    targetId: 'iron_bark',
    title: 'Iron Bark',
    subtitle: 'STAT · UNCOMMON',
    description: '+12% Damage Reduction and +25% Knockback Resistance.',
    rarity: 'uncommon',
    currentLevel: 1,
    nextLevel: 2,
    maxLevel: 5,
    tags: ['defense'],
    iconColor: '#34d399',
  },
  {
    offerId: 'evo_garden_blade',
    kind: 'weapon_evolution',
    targetId: 'garden_blade',
    title: 'Sylvan Tempest Blade',
    subtitle: 'Evolution · Leaf Blade Lv 8',
    description: 'Unleashes twin emerald wind waves on every third swing that pierce all foes.',
    rarity: 'legendary',
    currentLevel: 8,
    nextLevel: 9,
    maxLevel: 9,
    tags: ['melee', 'slash', 'wind'],
    iconColor: '#fbbf24',
  },
];

test('useDraftSequence reducer: full lifecycle idle -> revealing -> ready -> flippingBack -> swapping -> revealing -> ready -> resolving', () => {
  let state = createInitialDraftSequenceState<DraftOfferItem>([]);
  assert.equal(state.phase, 'idle');

  // 1. Open draft -> revealing
  state = draftSequenceReducer(state, { type: 'OPEN_DRAFT', offers: MOCK_OFFERS });
  assert.equal(state.phase, 'revealing');
  assert.equal(state.displayedOffers.length, 3);
  assert.equal(state.rerollCount, 0);

  // Guard: cannot select, skip, or reroll while still revealing
  assert.equal(
    draftSequenceReducer(state, { type: 'SELECT_CARD', offerId: 'card_glass_blade' }).phase,
    'revealing'
  );
  assert.equal(draftSequenceReducer(state, { type: 'START_REROLL' }).phase, 'revealing');

  // 2. Reveal complete -> ready
  state = draftSequenceReducer(state, { type: 'REVEAL_COMPLETE' });
  assert.equal(state.phase, 'ready');

  // 3. Start reroll -> flippingBack (keeps old offers visible while flipping to 180deg face-down)
  state = draftSequenceReducer(state, { type: 'START_REROLL' });
  assert.equal(state.phase, 'flippingBack');
  assert.equal(state.displayedOffers[0]?.offerId, 'card_glass_blade');

  // Guard: double-clicking reroll or selecting a card during flippingBack is ignored
  assert.equal(draftSequenceReducer(state, { type: 'START_REROLL' }).phase, 'flippingBack');
  assert.equal(
    draftSequenceReducer(state, { type: 'SELECT_CARD', offerId: 'card_glass_blade' }).phase,
    'flippingBack'
  );

  // 4. Flip-back complete -> swapping (cards are now face-down at 180deg)
  state = draftSequenceReducer(state, { type: 'FLIP_BACK_COMPLETE' });
  assert.equal(state.phase, 'swapping');

  // 5. Swap offers while face-down -> revealing new offers
  const newOffers: DraftOfferItem[] = [MOCK_OFFERS[2]!, MOCK_OFFERS[0]!, MOCK_OFFERS[1]!];
  state = draftSequenceReducer(state, {
    type: 'SWAP_OFFERS',
    offers: newOffers,
    announcement: 'Rerolled cards: Sylvan Tempest Blade, Glass Blade, Iron Bark',
  });
  assert.equal(state.phase, 'revealing');
  assert.equal(state.rerollCount, 1);
  assert.equal(state.displayedOffers[0]?.offerId, 'evo_garden_blade');
  assert.ok(state.liveAnnouncement.includes('Sylvan Tempest Blade'));

  // 6. New cards finish revealing -> ready
  state = draftSequenceReducer(state, { type: 'REVEAL_COMPLETE' });
  assert.equal(state.phase, 'ready');

  // 7. Select card -> resolving
  state = draftSequenceReducer(state, { type: 'SELECT_CARD', offerId: 'evo_garden_blade' });
  assert.equal(state.phase, 'resolving');
  assert.equal(state.selectedOfferId, 'evo_garden_blade');
  assert.equal(state.resolvedAction, 'select');
});

test('useDraftSequence reducer: CANCEL_REROLL cleanly flips existing cards back to revealing if ad fails', () => {
  let state = createInitialDraftSequenceState(MOCK_OFFERS);
  state = draftSequenceReducer(state, { type: 'REVEAL_COMPLETE' });
  state = draftSequenceReducer(state, { type: 'START_REROLL' });
  state = draftSequenceReducer(state, { type: 'FLIP_BACK_COMPLETE' });
  assert.equal(state.phase, 'swapping');

  state = draftSequenceReducer(state, { type: 'CANCEL_REROLL' });
  assert.equal(state.phase, 'revealing');
  assert.equal(state.rerollCount, 0);
  assert.equal(state.displayedOffers.length, 3);
});

test('useDraftSequence reducer: SWAP_OFFERS from resolving phase transitions to revealing and resets selectedOfferId/resolvedAction so queued drafts never get stuck', () => {
  let state = createInitialDraftSequenceState(MOCK_OFFERS);
  state = draftSequenceReducer(state, { type: 'REVEAL_COMPLETE' });
  assert.equal(state.phase, 'ready');

  // Pick a card -> enters resolving phase
  state = draftSequenceReducer(state, { type: 'SELECT_CARD', offerId: 'card_glass_blade' });
  assert.equal(state.phase, 'resolving');
  assert.equal(state.selectedOfferId, 'card_glass_blade');
  assert.equal(state.resolvedAction, 'select');

  // Next queued draft arrives via SWAP_OFFERS while in resolving phase
  const nextOffers: DraftOfferItem[] = [MOCK_OFFERS[1]!, MOCK_OFFERS[2]!, MOCK_OFFERS[0]!];
  state = draftSequenceReducer(state, {
    type: 'SWAP_OFFERS',
    offers: nextOffers,
    announcement: 'New cards drawn',
  });
  assert.equal(state.phase, 'revealing');
  assert.equal(state.selectedOfferId, null);
  assert.equal(state.resolvedAction, null);
  assert.equal(state.displayedOffers[0]?.offerId, 'card_iron_bark');

  // Completes reveal -> ready for next pick
  state = draftSequenceReducer(state, { type: 'REVEAL_COMPLETE' });
  assert.equal(state.phase, 'ready');
});

test('useDraftSequence timings: stagger math respects normal and reduced motion budgets', () => {
  assert.equal(
    getRevealTotalMs(3, false),
    DRAFT_TIMINGS.REVEAL_DURATION_MS + 2 * DRAFT_TIMINGS.REVEAL_STAGGER_MS
  );
  assert.equal(
    getFlipBackTotalMs(3, false),
    DRAFT_TIMINGS.FLIP_BACK_DURATION_MS + 2 * DRAFT_TIMINGS.FLIP_BACK_STAGGER_MS
  );
  assert.ok(getRevealTotalMs(3, true) < getRevealTotalMs(3, false));
});

test('Ornament manifest & WebP assets exist on disk and stay under 400 KB budget', () => {
  const rootDir = process.cwd();
  let totalWebpBytes = 0;
  const assetEntries = Object.values(ORNAMENT_ASSETS);
  assert.ok(assetEntries.length >= 8, 'Expected at least 8 registered ornament assets');

  for (const meta of assetEntries) {
    assert.equal(getOrnamentAsset(meta.id).id, meta.id);
    const webpDisk = path.join(rootDir, 'public', meta.webpPath);
    const pngDisk = path.join(rootDir, 'public', meta.pngPath);
    assert.ok(fs.existsSync(webpDisk), `Missing WebP asset: ${webpDisk}`);
    assert.ok(fs.existsSync(pngDisk), `Missing PNG asset: ${pngDisk}`);
    totalWebpBytes += fs.statSync(webpDisk).size;
  }

  assert.ok(
    totalWebpBytes <= 400 * 1024,
    `Expected total WebP ornaments (${totalWebpBytes} bytes) to be <= 400 KB`
  );
});

test('Ornate UI Kit & DraftCard: renders full untranscated arcana titles and aligned row markers', () => {
  const cardMarkup = renderToStaticMarkup(
    <DraftCard
      offer={MOCK_OFFERS[0]!}
      index={0}
      phase="ready"
      rerollCount={0}
      isSelected={false}
      isAnySelected={false}
      canInteract={true}
      onSelect={() => {}}
    />
  );

  // Verify THE GLASS RAPIER is rendered in full without truncate class
  assert.ok(cardMarkup.includes('THE GLASS RAPIER'));
  assert.ok(cardMarkup.includes('data-card-row="desktop-header"'));
  assert.ok(cardMarkup.includes('data-card-row="desktop-art"'));
  assert.ok(cardMarkup.includes('data-card-row="desktop-arcana"'));
  assert.ok(cardMarkup.includes('data-card-row="desktop-title"'));
  assert.ok(cardMarkup.includes('data-card-row="desktop-description"'));
  assert.ok(cardMarkup.includes('data-card-row="desktop-footer"'));

  const actionsMarkup = renderToStaticMarkup(
    <DraftActions
      coins={160}
      freeRerollAvailable={false}
      freeRerollsRemaining={0}
      canAdReroll={true}
      adRerollsRemaining={3}
      coinRerollsRemaining={3}
      isAdLoading={false}
      canInteract={true}
      onRerollFree={() => {}}
      onRerollAd={() => {}}
      onRerollCoins={() => {}}
      onSkipDraft={() => {}}
    />
  );

  assert.ok(actionsMarkup.includes('Watch Ad to Reroll'));
  assert.ok(actionsMarkup.includes('Reroll with Coins'));
  assert.ok(actionsMarkup.includes('Skip Draft'));
  assert.ok(actionsMarkup.includes('+10 HP · +100 Score'));

  const pillMarkup = renderToStaticMarkup(
    <OrnateFrame variant="pill" rarity="legendary">
      <StatPill value={240} ornament="laurel" />
    </OrnateFrame>
  );
  assert.ok(pillMarkup.includes('240'));

  const btnMarkup = renderToStaticMarkup(
    <GameButton
      variant="gold"
      size="lg"
      ornament="thorn"
      title="Reroll with Coins"
      subtitle="Vault: 160 · 3/3 Left"
      badge="40"
    />
  );
  assert.ok(btnMarkup.includes('aria-label="Reroll with Coins — Vault: 160 · 3/3 Left — 40"'));
});
