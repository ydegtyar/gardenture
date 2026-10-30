import React from 'react';
import { PROFESSIONS, THEME_PACKS } from '../../content/data/catalog';
import { NO_ADS } from '../../config/ads';
import { useGameShell } from '../context/GameShellContext';
import { MenuHost, type MenuDataProvider } from '../../menu/MenuHost';

/**
 * STATE 1: TITLE SCREEN (Host wrapper around isolated MenuHost)
 */
export function TitleScreenOverlay() {
  const {
    shellState,
    isMenuTransitioning,
    completeMenuTransition,
    saveData,
    lastEndedRunRewards,
    startNewOrResumedRun,
    sanctuaryTab,
    setSanctuaryTab,
    canWatchRewardedAd,
    handleWatchCoinsAd,
  } = useGameShell();

  if (shellState !== 'title' && !isMenuTransitioning) return null;

  const menuData: MenuDataProvider = {
    bestScore: saveData.bestScores.allTime,
    coins: saveData.currencies.coins,
    crystals: saveData.currencies.gems,
    hasRun: Boolean(saveData.activeRun),
    runLevel: saveData.activeRun?.level,
    activeProfessionName: PROFESSIONS[saveData.loadout.professionId]?.name ?? 'Warden',
    activeBiomeName: THEME_PACKS[saveData.loadout.biomeId]?.name ?? 'Sakura Twilight Grove',
    canWatchAdForCoins: !NO_ADS && canWatchRewardedAd,
    lastRunRewards: lastEndedRunRewards
      ? {
          coinsEarned: lastEndedRunRewards.coinsEarned,
          crystalsEarned: lastEndedRunRewards.gemsEarned,
          score: lastEndedRunRewards.score,
        }
      : null,
  };

  return (
    <MenuHost
      data={menuData}
      onStartRun={() => startNewOrResumedRun(false, true)}
      onResumeRun={() => startNewOrResumedRun(true, true)}
      onOpenLoadout={() => setSanctuaryTab('loadout')}
      onOpenStore={() => setSanctuaryTab('store')}
      onWatchCoinsAd={() => void handleWatchCoinsAd()}
      onTransitionComplete={completeMenuTransition}
      isModalOpen={sanctuaryTab !== null}
    />
  );
}
