/**
 * @file CardDraftModal.tsx
 * @llm-tag modal:card-draft
 * @llm-context AAA Botanical Tarot 3-card level-up draft screen built on the shared `src/ui/ornate/` UI kit.
 * Features a boxless floating layout over `DraftBackdrop`, equal-height row-aligned `DraftCard`s,
 * `useDraftSequence` state machine (`idle -> revealing -> ready -> flippingBack -> swapping -> revealing -> ready -> resolving`),
 * `StatPill` coin counter with laurel border, `DraftActions` (`GameButton`), focus trap, and keyboard shortcuts (`1`/`2`/`3` select, `R` coin reroll).
 */

import React, { useEffect, useRef } from 'react';
import { CoinIcon } from '../SvgIcons';
import { useGameShell } from '../context/GameShellContext';
import { LazyModalDebugCardsButton } from '../debug/LazyDebugComponents';
import { IS_DEV } from '../debug/devGate';
import { StatPill } from '../../ui/ornate';
import { DraftBackdrop } from './draft/DraftBackdrop';
import { DraftCard } from './draft/DraftCard';
import { DraftActions } from './draft/DraftActions';
import { useDraftSequence } from './draft/useDraftSequence';

/**
 * @llm-component CardDraftModal
 * @llm-hook level-up-draft: presents 3 tarot card choices on player level up
 */
export function CardDraftModal() {
  const {
    hud,
    draftOffers,
    freeRerollAvailable,
    freeRerollsRemaining,
    canAdReroll,
    adRerollsRemaining,
    coinRerollsRemaining,
    isAdLoading,
    saveData,
    handleSelectCardOffer,
    handleRerollFree,
    handleRerollAd,
    handleRerollCoins,
    handleSkipDraft,
    openDebugMenu,
  } = useGameShell();

  const level = hud.level;
  const coins = saveData.currencies.coins;
  const reducedMotion = Boolean(saveData.settings?.reducedMotion);
  const onOpenDebugCards = IS_DEV ? openDebugMenu : undefined;

  const {
    phase,
    displayedOffers,
    rerollCount,
    selectedOfferId,
    resolvedAction,
    liveAnnouncement,
    canInteract,
    triggerReroll,
    triggerSelectCard,
    triggerSkipDraft,
  } = useDraftSequence({
    offers: draftOffers,
    reducedMotion,
    isAdLoading,
    onSelectOffer: handleSelectCardOffer,
    onSkipDraft: handleSkipDraft,
  });

  const dialogRef = useRef<HTMLDivElement | null>(null);
  const firstCardRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Focus management: remember prior focus on mount, focus first card when ready, restore on unmount
  useEffect(() => {
    previouslyFocusedRef.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    return () => {
      if (previouslyFocusedRef.current && typeof previouslyFocusedRef.current.focus === 'function') {
        previouslyFocusedRef.current.focus();
      }
    };
  }, []);

  useEffect(() => {
    if (phase === 'ready' && firstCardRef.current) {
      firstCardRef.current.focus({ preventScroll: true });
    }
  }, [phase]);

  // Keyboard shortcuts (`1`, `2`, `3` select card; `R` coin reroll; `Tab` focus trap)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = Array.from(
          dialogRef.current.querySelectorAll<HTMLElement>(
            'button:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        );
        if (focusable.length > 0) {
          const first = focusable[0]!;
          const last = focusable[focusable.length - 1]!;
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
        return;
      }

      if (!canInteract) return;

      if (e.code === 'Digit1' || e.code === 'Numpad1') {
        if (displayedOffers[0]) {
          e.preventDefault();
          triggerSelectCard(displayedOffers[0].offerId);
        }
      } else if (e.code === 'Digit2' || e.code === 'Numpad2') {
        if (displayedOffers[1]) {
          e.preventDefault();
          triggerSelectCard(displayedOffers[1].offerId);
        }
      } else if (e.code === 'Digit3' || e.code === 'Numpad3') {
        if (displayedOffers[2]) {
          e.preventDefault();
          triggerSelectCard(displayedOffers[2].offerId);
        }
      } else if (e.code === 'KeyR') {
        if (coins >= 40 && coinRerollsRemaining > 0) {
          e.preventDefault();
          triggerReroll(handleRerollCoins);
        } else if (freeRerollAvailable && freeRerollsRemaining > 0) {
          e.preventDefault();
          triggerReroll(handleRerollFree);
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    canInteract,
    displayedOffers,
    coins,
    coinRerollsRemaining,
    freeRerollAvailable,
    freeRerollsRemaining,
    handleRerollCoins,
    handleRerollFree,
    triggerReroll,
    triggerSelectCard,
  ]);

  return (
    <DraftBackdrop reducedMotion={reducedMotion}>
      {/* Dev-only Debug Cards Trigger (Visually isolated in bottom-left corner, never in production) */}
      {IS_DEV && onOpenDebugCards && (
        <div
          data-testid="draft-dev-debug-slot"
          className="fixed bottom-2 left-2 z-50 opacity-80 hover:opacity-100 transition-opacity"
        >
          <LazyModalDebugCardsButton onOpen={onOpenDebugCards} variant="draft" />
        </div>
      )}

      {/* Polite Screen-Reader Live Region for Rerolled Cards */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      {/* Skip Herbal Blessing Floating Toast */}
      {resolvedAction === 'skip' && (
        <div
          data-testid="draft-skip-toast"
          role="status"
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 px-5 py-2.5 rounded-full bg-[#132924]/95 border-2 border-[#e8b84e] text-[#fff1b0] font-display font-extrabold text-base sm:text-lg shadow-[0_12px_32px_rgba(0,0,0,0.85),0_0_24px_rgba(110,231,183,0.5)] pointer-events-none animate-bounce"
        >
          +10 HP · +100 Score
        </div>
      )}

      {/* =====================================================================
          BOXLESS FLOATING DRAFT STAGE
          Zero container background, zero panel border, zero panel box-shadow.
          Header, 3 ornate cards, and action buttons sit directly on the backdrop.
          ===================================================================== */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="draft-modal-title"
        data-testid="draft-floating-stage"
        data-phase={phase}
        className="ornate-draft-stage relative z-10 flex flex-col justify-between gap-2.5 sm:gap-4 px-1 sm:px-2"
      >
        {/* Header Bar Floating Directly on Backdrop */}
        <header className="w-full flex items-center justify-between gap-3 px-1 shrink-0">
          <div className="min-w-0">
            <p className="text-[10px] sm:text-xs font-extrabold tracking-[0.16em] text-[#86efac] uppercase drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
              LEVEL {level} REACHED · DRAW ONE BOTANICAL ARCANA
            </p>
            <h2
              id="draft-modal-title"
              className="text-xl sm:text-2xl min-[900px]:text-3xl font-display font-extrabold text-[#fff8e7] leading-tight drop-shadow-[0_4px_12px_rgba(0,0,0,0.92)]"
            >
              Botanical Tarot Draft
            </h2>
          </div>

          <StatPill
            value={coins}
            icon={<CoinIcon className="w-4.5 h-4.5" />}
            ornament="laurel"
            dataTestId="draft-modal-coin-badge"
            title="Vault Coins"
          />
        </header>

        {/* 3 Equal-Height Ornate Tarot Cards Grid (No carousel dots on desktop) */}
        <div
          data-testid="tarot-cards-sliding-row"
          className="ornate-draft-cards-grid py-1"
        >
          {displayedOffers.map((offer, idx) => (
            <DraftCard
              key={`tarot-slot-${idx}`}
              offer={offer}
              index={idx}
              phase={phase}
              rerollCount={rerollCount}
              isSelected={selectedOfferId === offer.offerId}
              isAnySelected={selectedOfferId !== null}
              canInteract={canInteract}
              reducedMotion={reducedMotion}
              onSelect={triggerSelectCard}
              cardRef={idx === 0 ? (el) => { firstCardRef.current = el; } : undefined}
            />
          ))}
        </div>

        {/* Ornate Action Buttons (`Watch Ad to Reroll`, `Reroll with Coins`, `Skip Draft`) */}
        <DraftActions
          coins={coins}
          freeRerollAvailable={freeRerollAvailable}
          freeRerollsRemaining={freeRerollsRemaining}
          canAdReroll={canAdReroll}
          adRerollsRemaining={adRerollsRemaining}
          coinRerollsRemaining={coinRerollsRemaining}
          isAdLoading={isAdLoading}
          canInteract={canInteract}
          onRerollFree={() => triggerReroll(handleRerollFree)}
          onRerollAd={() => triggerReroll(handleRerollAd)}
          onRerollCoins={() => triggerReroll(handleRerollCoins)}
          onSkipDraft={triggerSkipDraft}
        />
      </div>
    </DraftBackdrop>
  );
}

export default CardDraftModal;
