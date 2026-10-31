/**
 * @file useDraftSequence.ts
 * Explicit state machine (`useReducer`) and timing controller for the Botanical Tarot Draft modal:
 * `idle -> revealing -> ready -> flippingBack -> swapping -> revealing -> ready -> resolving`
 */

import { useCallback, useEffect, useReducer, useRef } from 'react';
import type { DraftOfferItem } from '../../../sim/systems/cardDraft';

export type DraftSequencePhase =
  | 'idle'
  | 'revealing'
  | 'ready'
  | 'flippingBack'
  | 'swapping'
  | 'resolving';

export const DRAFT_TIMINGS = {
  BACKDROP_FADE_MS: 200,
  REVEAL_DURATION_MS: 550,
  REVEAL_STAGGER_MS: 180,
  FLIP_BACK_DURATION_MS: 350,
  FLIP_BACK_STAGGER_MS: 120,
  SWAP_HOLD_MS: 60,
  RESOLVE_SELECT_MS: 200,
  RESOLVE_SKIP_MS: 260,
  REDUCED_FADE_MS: 150,
  REDUCED_STAGGER_MS: 50,
} as const;

export function getRevealTotalMs(cardCount: number, reducedMotion = false): number {
  const count = Math.max(1, cardCount);
  if (reducedMotion) {
    return DRAFT_TIMINGS.REDUCED_FADE_MS + (count - 1) * DRAFT_TIMINGS.REDUCED_STAGGER_MS;
  }
  return DRAFT_TIMINGS.REVEAL_DURATION_MS + (count - 1) * DRAFT_TIMINGS.REVEAL_STAGGER_MS;
}

export function getFlipBackTotalMs(cardCount: number, reducedMotion = false): number {
  const count = Math.max(1, cardCount);
  if (reducedMotion) {
    return DRAFT_TIMINGS.REDUCED_FADE_MS + (count - 1) * DRAFT_TIMINGS.REDUCED_STAGGER_MS;
  }
  return DRAFT_TIMINGS.FLIP_BACK_DURATION_MS + (count - 1) * DRAFT_TIMINGS.FLIP_BACK_STAGGER_MS;
}

export interface DraftSequenceState<T = DraftOfferItem> {
  readonly phase: DraftSequencePhase;
  readonly displayedOffers: readonly T[];
  readonly rerollCount: number;
  readonly selectedOfferId: string | null;
  readonly resolvedAction: 'select' | 'skip' | null;
  readonly liveAnnouncement: string;
}

export type DraftSequenceEvent<T = DraftOfferItem> =
  | { type: 'OPEN_DRAFT'; offers: readonly T[] }
  | { type: 'REVEAL_COMPLETE' }
  | { type: 'START_REROLL' }
  | { type: 'FLIP_BACK_COMPLETE' }
  | { type: 'SWAP_OFFERS'; offers: readonly T[]; announcement?: string }
  | { type: 'CANCEL_REROLL' }
  | { type: 'SELECT_CARD'; offerId: string }
  | { type: 'SKIP_DRAFT' }
  | { type: 'RESET' };

export function createInitialDraftSequenceState<T = DraftOfferItem>(
  initialOffers: readonly T[] = []
): DraftSequenceState<T> {
  return {
    phase: initialOffers.length > 0 ? 'revealing' : 'idle',
    displayedOffers: initialOffers,
    rerollCount: 0,
    selectedOfferId: null,
    resolvedAction: null,
    liveAnnouncement: '',
  };
}

/**
 * Pure deterministic reducer for the draft sequence state machine.
 * Decoupled from React/DOM so unit tests can verify every legal and illegal transition.
 */
export function draftSequenceReducer<T = DraftOfferItem>(
  state: DraftSequenceState<T>,
  event: DraftSequenceEvent<T>
): DraftSequenceState<T> {
  switch (event.type) {
    case 'OPEN_DRAFT': {
      if (event.offers.length === 0) {
        return createInitialDraftSequenceState([]);
      }
      return {
        phase: 'revealing',
        displayedOffers: event.offers,
        rerollCount: 0,
        selectedOfferId: null,
        resolvedAction: null,
        liveAnnouncement: '',
      };
    }

    case 'REVEAL_COMPLETE': {
      if (state.phase !== 'revealing') return state;
      return {
        ...state,
        phase: 'ready',
      };
    }

    case 'START_REROLL': {
      // Lock out rerolls unless strictly in 'ready' phase
      if (state.phase !== 'ready') return state;
      return {
        ...state,
        phase: 'flippingBack',
      };
    }

    case 'FLIP_BACK_COMPLETE': {
      if (state.phase !== 'flippingBack') return state;
      return {
        ...state,
        phase: 'swapping',
      };
    }

    case 'SWAP_OFFERS': {
      if (
        state.phase !== 'swapping' &&
        state.phase !== 'flippingBack' &&
        state.phase !== 'ready' &&
        state.phase !== 'resolving'
      ) {
        return state;
      }
      return {
        ...state,
        phase: 'revealing',
        displayedOffers: event.offers,
        rerollCount: state.rerollCount + 1,
        selectedOfferId: null,
        resolvedAction: null,
        liveAnnouncement: event.announcement ?? '',
      };
    }

    case 'CANCEL_REROLL': {
      if (state.phase !== 'swapping' && state.phase !== 'flippingBack') return state;
      return {
        ...state,
        phase: 'revealing',
        selectedOfferId: null,
        resolvedAction: null,
      };
    }

    case 'SELECT_CARD': {
      if (state.phase !== 'ready') return state;
      return {
        ...state,
        phase: 'resolving',
        selectedOfferId: event.offerId,
        resolvedAction: 'select',
      };
    }

    case 'SKIP_DRAFT': {
      if (state.phase !== 'ready') return state;
      return {
        ...state,
        phase: 'resolving',
        selectedOfferId: null,
        resolvedAction: 'skip',
      };
    }

    case 'RESET': {
      return createInitialDraftSequenceState([]);
    }

    default:
      return state;
  }
}

export interface UseDraftSequenceOptions {
  offers: readonly DraftOfferItem[];
  reducedMotion?: boolean;
  isAdLoading?: boolean;
  onSelectOffer: (offerId: string) => void;
  onSkipDraft: () => void;
}

export function useDraftSequence({
  offers,
  reducedMotion = false,
  isAdLoading = false,
  onSelectOffer,
  onSkipDraft,
}: UseDraftSequenceOptions) {
  const [state, dispatch] = useReducer(
    draftSequenceReducer<DraftOfferItem>,
    offers,
    createInitialDraftSequenceState
  );

  const latestOffersRef = useRef<readonly DraftOfferItem[]>(offers);
  latestOffersRef.current = offers;
  const prevSyncedOffersRef = useRef<readonly DraftOfferItem[]>(offers);
  const offersSig = offers.map((o) => o.offerId).join('|');
  const displayedSig = state.displayedOffers.map((o) => o.offerId).join('|');

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const internalRerollActiveRef = useRef(false);

  const clearPendingTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      clearPendingTimer();
    };
  }, [clearPendingTimer]);

  // Advance `revealing -> ready` after all 3 cards complete their staggered flip-forward
  useEffect(() => {
    if (state.phase !== 'revealing') return;
    const totalMs = getRevealTotalMs(state.displayedOffers.length, reducedMotion);
    const id = setTimeout(() => {
      dispatch({ type: 'REVEAL_COMPLETE' });
    }, totalMs);
    return () => clearTimeout(id);
  }, [state.phase, state.displayedOffers.length, state.rerollCount, reducedMotion]);

  // Sync external offer updates (e.g., if offers change outside triggerReroll or a queued draft opens)
  useEffect(() => {
    const offersChangedRef = prevSyncedOffersRef.current !== offers;
    prevSyncedOffersRef.current = offers;

    if (offers.length === 0) {
      dispatch({ type: 'RESET' });
      return;
    }
    if (state.displayedOffers.length === 0) {
      dispatch({ type: 'OPEN_DRAFT', offers });
      return;
    }
    if (
      !internalRerollActiveRef.current &&
      (offersSig !== displayedSig || (state.phase === 'resolving' && offersChangedRef))
    ) {
      const titles = offers.map((o) => o.title).join(', ');
      dispatch({
        type: 'SWAP_OFFERS',
        offers,
        announcement: `New cards drawn: ${titles}`,
      });
    }
  }, [offers, offersSig, displayedSig, state.displayedOffers.length, state.phase]);

  const canInteract = state.phase === 'ready' && !isAdLoading;

  const triggerReroll = useCallback(
    (rerollAction: () => unknown | Promise<unknown>) => {
      if (state.phase !== 'ready' || isAdLoading || internalRerollActiveRef.current) {
        return;
      }
      internalRerollActiveRef.current = true;
      const beforeSig = latestOffersRef.current.map((o) => o.offerId).join('|');
      dispatch({ type: 'START_REROLL' });

      const flipBackMs = getFlipBackTotalMs(state.displayedOffers.length, reducedMotion);
      clearPendingTimer();

      timerRef.current = setTimeout(() => {
        dispatch({ type: 'FLIP_BACK_COMPLETE' });
        void Promise.resolve(rerollAction())
          .then(() => {
            timerRef.current = setTimeout(() => {
              const updatedOffers = latestOffersRef.current;
              const afterSig = updatedOffers.map((o) => o.offerId).join('|');
              internalRerollActiveRef.current = false;
              if (afterSig !== beforeSig && updatedOffers.length > 0) {
                const titles = updatedOffers.map((o) => o.title).join(', ');
                dispatch({
                  type: 'SWAP_OFFERS',
                  offers: updatedOffers,
                  announcement: `Rerolled cards: ${titles}`,
                });
              } else {
                dispatch({ type: 'CANCEL_REROLL' });
              }
            }, DRAFT_TIMINGS.SWAP_HOLD_MS);
          })
          .catch(() => {
            internalRerollActiveRef.current = false;
            dispatch({ type: 'CANCEL_REROLL' });
          });
      }, flipBackMs);
    },
    [state.phase, state.displayedOffers.length, isAdLoading, reducedMotion, clearPendingTimer]
  );

  const triggerSelectCard = useCallback(
    (offerId: string) => {
      if (state.phase !== 'ready' || isAdLoading) return;
      dispatch({ type: 'SELECT_CARD', offerId });
      clearPendingTimer();
      const delayMs = reducedMotion ? 80 : DRAFT_TIMINGS.RESOLVE_SELECT_MS;
      timerRef.current = setTimeout(() => {
        onSelectOffer(offerId);
      }, delayMs);
    },
    [state.phase, isAdLoading, reducedMotion, onSelectOffer, clearPendingTimer]
  );

  const triggerSkipDraft = useCallback(() => {
    if (state.phase !== 'ready' || isAdLoading) return;
    dispatch({ type: 'SKIP_DRAFT' });
    clearPendingTimer();
    const delayMs = reducedMotion ? 100 : DRAFT_TIMINGS.RESOLVE_SKIP_MS;
    timerRef.current = setTimeout(() => {
      onSkipDraft();
    }, delayMs);
  }, [state.phase, isAdLoading, reducedMotion, onSkipDraft, clearPendingTimer]);

  return {
    phase: state.phase,
    displayedOffers: state.displayedOffers.length > 0 ? state.displayedOffers : offers,
    rerollCount: state.rerollCount,
    selectedOfferId: state.selectedOfferId,
    resolvedAction: state.resolvedAction,
    liveAnnouncement: state.liveAnnouncement,
    canInteract,
    triggerReroll,
    triggerSelectCard,
    triggerSkipDraft,
  };
}
