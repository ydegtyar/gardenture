import React from 'react';
import {
  CardDraftModal,
  LoadoutAndStoreModal,
  PauseModal,
  RescueReviveModal,
  RunSummaryModal,
} from '../Modals';
import { useGameShell } from '../context/GameShellContext';
import { LazyDebugCardModal } from '../debug/LazyDebugComponents';
import { IS_DEV } from '../debug/devGate';

/**
 * Coordinates all game shell modals (Card Draft, Rescue Revive, Pause, Run Summary,
 * Garden Sanctuary, and the lazy-loaded development-only DebugCardModal).
 */
export function GameModalsOverlay() {
  const {
    shellState,
    draftOffers,
    awaitingRevive,
    debugMenuOpen,
    runSummary,
    sanctuaryTab,
  } = useGameShell();

  return (
    <>
      {shellState === 'playing' && draftOffers.length > 0 && <CardDraftModal />}

      {shellState === 'playing' && awaitingRevive && <RescueReviveModal />}

      {shellState === 'paused' && <PauseModal />}

      {IS_DEV && debugMenuOpen && <LazyDebugCardModal />}

      {shellState === 'gameover' && runSummary && <RunSummaryModal />}

      {shellState === 'title' && sanctuaryTab !== null && <LoadoutAndStoreModal />}
    </>
  );
}
