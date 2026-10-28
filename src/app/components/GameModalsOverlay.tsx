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
    saveData,
    sanctuaryTab,
    setSanctuaryTab,
    draftOffers,
    awaitingRevive,
    isAdLoading,
    runSummary,
    debugMenuOpen,
    ytDiagnostics,
    ytSdkBanner,
    lastSyncSource,
    hud,
    freeRerollAvailable,
    canAdReroll,
    adRerollsRemaining,
    coinRerollsRemaining,
    canWatchRewardedAd,
    startNewOrResumedRun,
    updateShellState,
    resumeRun,
    endRunWithSuddenDeath,
    updateSettings,
    handleSelectCardOffer,
    handleRerollFree,
    handleRerollAd,
    handleRerollCoins,
    handleSkipDraft,
    handleWatchAdRevive,
    handleSpendCoinsRevive,
    handleDeclineRevive,
    handleWatchDoubleCoinsAd,
    handleReturnToTitleFromSummary,
    handleSelectLoadout,
    handleUnlockProfession,
    handleUnlockTrinket,
    handleUpgradeTrinket,
    handleUnlockCurse,
    handleWatchPersonaPipAd,
    handleWatchSanctuaryRewardAd,
    handleSavePlayerStateNow,
    handleReloadAndReconcileSave,
    handleClaimQuest,
    openDebugMenu,
    closeDebugMenu,
    handleDebugSetCardLevel,
    handleDebugSetWeaponLevel,
    handleDebugSpawnPowerUpDrop,
    handleDebugGivePowerUp,
    handleDebugTriggerPowerUp,
    handleDebugSpawnArenaFlower,
    handleDebugSpawnFinalBossArena,
    handleDebugTestHealHero,
    handleDebugResetAllCards,
    handleDebugAddGold,
    handleDebugIncrementPersonaAdPip,
    handleDebugIncrementAllPersonaAdPips,
    handleDebugSpawnBestiaryEnemy,
    handleSetDevAdOutcomeMode,
    handleSetDevCloudStorageMode,
    handleSimulateYtAudioToggle,
    handleSyncScoreNow,
  } = useGameShell();

  return (
    <>
      {shellState === 'playing' && draftOffers.length > 0 && (
        <CardDraftModal
          level={hud.level}
          offers={draftOffers}
          freeRerollAvailable={freeRerollAvailable}
          canAdReroll={canAdReroll}
          adRerollsRemaining={adRerollsRemaining}
          coinRerollsRemaining={coinRerollsRemaining}
          isAdLoading={isAdLoading}
          coins={saveData.currencies.coins}
          onSelectOffer={handleSelectCardOffer}
          onRerollFree={handleRerollFree}
          onRerollAd={handleRerollAd}
          onRerollCoins={handleRerollCoins}
          onSkip={handleSkipDraft}
          onOpenDebugCards={IS_DEV ? openDebugMenu : undefined}
        />
      )}

      {shellState === 'playing' && awaitingRevive && (
        <RescueReviveModal
          coins={saveData.currencies.coins}
          canWatchAd={canWatchRewardedAd}
          isAdLoading={isAdLoading}
          onWatchAdRevive={handleWatchAdRevive}
          onSpendCoinsRevive={handleSpendCoinsRevive}
          onDeclineRevive={handleDeclineRevive}
        />
      )}

      {shellState === 'paused' && (
        <PauseModal
          weapons={hud.weapons}
          ownedCards={hud.ownedCards}
          settings={saveData.settings}
          onUpdateSettings={updateSettings}
          onResume={resumeRun}
          onRestart={() => startNewOrResumedRun(false)}
          onEndRunAndSummary={endRunWithSuddenDeath}
          onReturnToTitle={() => updateShellState('title')}
          onOpenDebugCards={IS_DEV ? openDebugMenu : undefined}
        />
      )}

      {IS_DEV && debugMenuOpen && (
        <LazyDebugCardModal
          weapons={hud.weapons}
          ownedCards={hud.ownedCards}
          heldPowerUps={hud.heldPowerUps}
          onSetCardLevel={handleDebugSetCardLevel}
          onSetWeaponLevel={handleDebugSetWeaponLevel}
          onSpawnPowerUpDrop={handleDebugSpawnPowerUpDrop}
          onGivePowerUp={handleDebugGivePowerUp}
          onTriggerPowerUp={handleDebugTriggerPowerUp}
          onSpawnArenaFlower={handleDebugSpawnArenaFlower}
          onSpawnFinalBossArena={handleDebugSpawnFinalBossArena}
          onTestHealHero={handleDebugTestHealHero}
          onResetAllCards={handleDebugResetAllCards}
          onClose={closeDebugMenu}
        />
      )}

      {shellState === 'gameover' && runSummary && (
        <RunSummaryModal
          summary={runSummary}
          canWatchDoubleAd={canWatchRewardedAd}
          onWatchDoubleCoinsAd={handleWatchDoubleCoinsAd}
          onPlayAgain={() => startNewOrResumedRun(false)}
          onReturnToTitle={handleReturnToTitleFromSummary}
        />
      )}

      {shellState === 'title' && sanctuaryTab !== null && (
        <LoadoutAndStoreModal
          saveData={saveData}
          initialTab={sanctuaryTab}
          ytDiagnostics={ytDiagnostics}
          lastSyncSource={lastSyncSource}
          statusBannerText={ytSdkBanner}
          isAdLoading={isAdLoading}
          onClose={() => setSanctuaryTab(null)}
          onSelectLoadout={handleSelectLoadout}
          onUnlockProfession={handleUnlockProfession}
          onUnlockTrinket={handleUnlockTrinket}
          onUpgradeTrinket={handleUpgradeTrinket}
          onUnlockCurse={handleUnlockCurse}
          onWatchPersonaPipAd={handleWatchPersonaPipAd}
          onWatchSanctuaryRewardAd={handleWatchSanctuaryRewardAd}
          onIncrementPersonaAdPip={IS_DEV ? handleDebugIncrementPersonaAdPip : undefined}
          onIncrementAllPersonaAdPips={IS_DEV ? handleDebugIncrementAllPersonaAdPips : undefined}
          onSavePlayerStateNow={handleSavePlayerStateNow}
          onReloadAndReconcileSave={handleReloadAndReconcileSave}
          onSetDevAdOutcomeMode={IS_DEV ? handleSetDevAdOutcomeMode : undefined}
          onSetDevCloudStorageMode={IS_DEV ? handleSetDevCloudStorageMode : undefined}
          onSimulateYtAudioToggle={IS_DEV ? handleSimulateYtAudioToggle : undefined}
          onSyncScoreNow={IS_DEV ? handleSyncScoreNow : undefined}
          onSpawnBestiaryEnemy={IS_DEV ? handleDebugSpawnBestiaryEnemy : undefined}
          onClaimQuest={handleClaimQuest}
          onAddDebugGold={handleDebugAddGold}
          onStartRun={() => startNewOrResumedRun(false)}
        />
      )}
    </>
  );
}
