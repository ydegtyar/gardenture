/**
 * @file RunSummaryModal.tsx
 * @llm-tag modal:run-summary
 * @llm-context Post-run outcome report displaying final score, survival time, style rank, rewards, and daily streak progress.
 * @llm-description Features near-miss boss milestone notifications, daily streak animations, rewarded ad double coins multiplier, and quick replay/loadout actions.
 */

import React, { useCallback, useEffect, useMemo } from 'react';
import { STYLE_RANKS } from '../../content/data/catalog';
import { getDailyStreakHighlight } from '../../meta/SaveManager';
import { CoinIcon } from '../SvgIcons';
import { useGameShell } from '../context/GameShellContext';
import { cn } from '../../utils/cn';

export interface RunSummarySnapshot {
  outcome: 'victory' | 'defeat' | 'timeout';
  score: number;
  bestScore: number;
  isNewBest: boolean;
  coinsEarned: number;
  gemsEarned: number;
  peakRankIndex: number;
  bestStreak: number;
  kills: number;
  elapsedSeconds: number;
  bossHpRemainingRatio: number;
  doubleCoinsClaimed: boolean;
  dailyStreakDays: number;
  dailyStreakIncremented: boolean;
}

/**
 * @llm-component RunSummaryModal
 * @llm-hook run-summary: displays expedition stats, score records, streak progress, and coin reward doubling
 */
export function RunSummaryModal() {
  const {
    runSummary,
    canWatchRewardedAd,
    handleWatchDoubleCoinsAd,
    startNewOrResumedRun,
    handleReturnToTitleFromSummary,
  } = useGameShell();

  const summary = runSummary;
  const canWatchDoubleAd = canWatchRewardedAd;
  const onWatchDoubleCoinsAd = handleWatchDoubleCoinsAd;
  const onPlayAgain = useCallback(() => startNewOrResumedRun(false), [startNewOrResumedRun]);
  const onReturnToTitle = handleReturnToTitleFromSummary;

  const availableActions = useMemo(() => {
    const list: Array<{
      key: number;
      label: string;
      onClick: () => void;
      disabled?: boolean;
    }> = [];

    if (canWatchDoubleAd && summary && !summary.doubleCoinsClaimed) {
      list.push({
        key: list.length + 1,
        label: 'Watch Ad to Double Coins',
        onClick: onWatchDoubleCoinsAd,
      });
    }

    list.push({
      key: list.length + 1,
      label: 'Play Again',
      onClick: onPlayAgain,
    });

    list.push({
      key: list.length + 1,
      label: 'Loadout & Store',
      onClick: onReturnToTitle,
    });

    return list;
  }, [
    canWatchDoubleAd,
    summary,
    onWatchDoubleCoinsAd,
    onPlayAgain,
    onReturnToTitle,
  ]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) {
        return;
      }

      let index = -1;
      if (e.key === '1' || e.code === 'Digit1' || e.code === 'Numpad1') {
        index = 0;
      } else if (e.key === '2' || e.code === 'Digit2' || e.code === 'Numpad2') {
        index = 1;
      } else if (e.key === '3' || e.code === 'Digit3' || e.code === 'Numpad3') {
        index = 2;
      } else if (e.key === '4' || e.code === 'Digit4' || e.code === 'Numpad4') {
        index = 3;
      }

      if (index >= 0 && availableActions[index] && !availableActions[index].disabled) {
        e.preventDefault();
        availableActions[index].onClick();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [availableActions]);

  if (!summary) return null;

  const peakRank = STYLE_RANKS[summary.peakRankIndex] ?? STYLE_RANKS[0]!;
  const mins = Math.floor(summary.elapsedSeconds / 60);
  const secs = summary.elapsedSeconds % 60;
  const timeFormatted = `${mins}:${secs.toString().padStart(2, '0')}`;
  const streakHighlight = getDailyStreakHighlight(
    summary.dailyStreakDays,
    summary.dailyStreakIncremented
  );
  const streakAnimationClass =
    streakHighlight.isMilestone || streakHighlight.isHighStreak
      ? 'animate-streak-milestone border-[#FDFFB6]'
      : streakHighlight.isHighlighted
        ? 'animate-streak-glow border-[#FDFFB6]/60'
        : 'border-[#FDFFB6]/30';

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#0E1A17]/85 backdrop-blur-sm pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-modal-title"
    >
      {/* Hidden number buttons control (1, 2, 3, 4) */}
      <div
        className="sr-only"
        aria-hidden="true"
        data-testid="summary-hidden-controls"
      >
        <button
          type="button"
          tabIndex={-1}
          aria-label="1"
          data-testid="summary-hidden-button-1"
          disabled={!availableActions[0] || availableActions[0].disabled}
          onClick={availableActions[0]?.onClick}
        >
          1
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label="2"
          data-testid="summary-hidden-button-2"
          disabled={!availableActions[1] || availableActions[1].disabled}
          onClick={availableActions[1]?.onClick}
        >
          2
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label="3"
          data-testid="summary-hidden-button-3"
          disabled={!availableActions[2] || availableActions[2].disabled}
          onClick={availableActions[2]?.onClick}
        >
          3
        </button>
        <button
          type="button"
          tabIndex={-1}
          aria-label="4"
          data-testid="summary-hidden-button-4"
          disabled={!availableActions[3] || availableActions[3].disabled}
          onClick={availableActions[3]?.onClick}
        >
          4
        </button>
      </div>
      <div className="relative w-full max-w-lg rounded-[28px] p-5 sm:p-6 text-[#EDE6D0] overflow-hidden backdrop-blur-md bg-[radial-gradient(130%_100%_at_50%_0%,#1f2a26_0%,#161e1c_55%,#101715_100%)] border border-[#6FA36B]/30 shadow-[0_0_0_1px_rgba(232,182,74,0.12),0_24px_60px_-10px_rgba(4,10,8,0.85),0_0_45px_rgba(95,224,200,0.08),inset_0_1px_0_rgba(237,230,208,0.2),inset_0_0_30px_rgba(14,26,23,0.6)]">
        {/* Botanical corner filigree */}
        <div className="absolute top-2.5 left-3 text-[#6FA36B]/35 text-xs pointer-events-none font-serif select-none">
          ✦ ─ ─
        </div>
        <div className="absolute top-2.5 right-3 text-[#6FA36B]/35 text-xs pointer-events-none font-serif select-none">
          ─ ─ ✦
        </div>
        <div className="absolute bottom-2.5 left-3 text-[#6FA36B]/35 text-xs pointer-events-none font-serif select-none">
          ✦ ─ ─
        </div>
        <div className="absolute bottom-2.5 right-3 text-[#6FA36B]/35 text-xs pointer-events-none font-serif select-none">
          ─ ─ ✦
        </div>

        {/* Modal Header */}
        <header className="relative mb-5 flex items-center justify-between">
          <div className="flex-1 pr-3">
            {/* Headline Title */}
            <h2
              id="summary-modal-title"
              className="text-3xl sm:text-[34px] leading-tight font-serif font-black tracking-tight text-[#EDE6D0] drop-shadow-[0_2px_12px_rgba(232,182,74,0.25)]"
            >
              {summary.outcome === 'victory'
                ? 'Mystic Garden Cleared!'
                : summary.outcome === 'timeout'
                  ? 'Dusk Fell Over The Garden'
                  : 'Expedition Ended'}
            </h2>
          </div>

          {/* Peak Style Wax Seal Medallion */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <div className="relative px-3 py-1 rounded-xl bg-gradient-to-b from-[#352512] to-[#1F170D] border border-[#E8B64A]/60 shadow-[0_0_20px_rgba(232,182,74,0.35)] flex items-center justify-center min-w-[58px]">
              <span
                className="text-2xl font-black font-display tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                style={{ color: peakRank.colorHex || '#F5D061' }}
              >
                {peakRank.letter}
              </span>
              <div className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[#5FE0C8] shadow-[0_0_6px_#5FE0C8]" />
            </div>
          </div>
        </header>

        {/* Near-miss feedback */}
        {summary.outcome !== 'victory' && (
          <p className="text-xs font-medium text-[#F5D061]/90 mb-4 bg-[#1E2824]/60 p-2.5 rounded-xl border border-[#E8B64A]/20">
            {summary.bossHpRemainingRatio > 0
              ? `Near Miss: Primordial Thornheart had ${Math.round(summary.bossHpRemainingRatio * 100)}% HP remaining!`
              : summary.elapsedSeconds < 90
                ? `Next milestone: Ancient Moss Colossus arrives at 1:30 (${Math.max(0, 90 - summary.elapsedSeconds)}s away).`
                : `Next milestone: Final Boss arrives at 3:15 (${Math.max(0, 195 - summary.elapsedSeconds)}s away).`}
          </p>
        )}

        {/* 4 Specimen Tiles */}
        <section className="grid grid-cols-2 gap-2.5 mb-5">
          {/* Tile 1: Final Score Specimen */}
          <article className="p-3.5 rounded-2xl flex flex-col justify-between bg-[linear-gradient(165deg,rgba(28,38,35,0.8)_0%,rgba(18,26,24,0.9)_100%)] border border-[#EDE6D0]/10 shadow-[inset_0_1px_0_rgba(237,230,208,0.06),0_4px_12px_rgba(0,0,0,0.35)]">
            <div>
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-[#EDE6D0]/55 block mb-1">
                FINAL SCORE
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono-tabular tracking-tight text-[#EDE6D0] leading-none">
                {summary.score.toLocaleString()}
              </div>
            </div>
            <div className="mt-2.5 flex items-center gap-1.5">
              <span
                className={cn(
                  'inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider uppercase',
                  summary.isNewBest
                    ? 'bg-[#6FA36B]/20 text-[#86C581] border border-[#6FA36B]/40'
                    : 'text-[#EDE6D0]/50'
                )}
              >
                {summary.isNewBest ? '✦ NEW RECORD!' : `Best: ${summary.bestScore.toLocaleString()}`}
              </span>
            </div>
          </article>

          {/* Tile 2: Survived & Kills Specimen */}
          <article className="p-3.5 rounded-2xl flex flex-col justify-between bg-[linear-gradient(165deg,rgba(28,38,35,0.8)_0%,rgba(18,26,24,0.9)_100%)] border border-[#EDE6D0]/10 shadow-[inset_0_1px_0_rgba(237,230,208,0.06),0_4px_12px_rgba(0,0,0,0.35)]">
            <div>
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-[#EDE6D0]/55 block mb-1">
                SURVIVED · KILLS
              </span>
              <div className="text-xl sm:text-2xl font-black font-mono-tabular tracking-tight text-[#EDE6D0] leading-none">
                {timeFormatted}
              </div>
            </div>
            <div className="mt-2.5 text-[11px] text-[#EDE6D0]/70 font-medium leading-tight">
              <span className="text-[#EDE6D0] font-bold">{summary.kills.toLocaleString()}</span> Foes <span className="text-[#EDE6D0]/30">·</span> <span className="text-[#EDE6D0] font-bold">{summary.bestStreak}</span> Streak
            </div>
          </article>

          {/* Tile 3: Spoils & Bounty Specimen */}
          <article className="p-3.5 rounded-2xl flex flex-col justify-between bg-[linear-gradient(165deg,rgba(28,38,35,0.8)_0%,rgba(18,26,24,0.9)_100%)] border border-[#EDE6D0]/10 shadow-[inset_0_1px_0_rgba(237,230,208,0.06),0_4px_12px_rgba(0,0,0,0.35)]">
            <div>
              <span className="text-[10px] font-extrabold tracking-wider uppercase text-[#EDE6D0]/55 block mb-1">
                REWARDS
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-xl sm:text-2xl font-black font-mono-tabular tracking-tight text-[#F5D061] leading-none">
                  +{summary.coinsEarned}
                </span>
                <CoinIcon />
              </div>
            </div>
            <div className="mt-2 text-[11px] font-medium text-[#5FE0C8] flex items-center gap-1">
              <span className="font-bold">+{summary.gemsEarned}</span> Rare Seeds
            </div>
          </article>

          {/* Tile 4: Daily Blossom Streak Specimen */}
          <article
            data-testid="daily-streak-indicator"
            data-streak-highlighted={streakHighlight.isHighlighted ? 'true' : 'false'}
            data-streak-milestone={streakHighlight.isMilestone ? 'true' : 'false'}
            className={cn(
              'p-3.5 rounded-2xl flex flex-col justify-between bg-[linear-gradient(165deg,rgba(28,38,35,0.8)_0%,rgba(18,26,24,0.9)_100%)] border shadow-[inset_0_1px_0_rgba(237,230,208,0.06),0_4px_12px_rgba(0,0,0,0.35)] transition-all',
              streakAnimationClass
            )}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[10px] font-extrabold tracking-wider uppercase text-[#E8B64A]/85 block">
                  DAILY STREAK
                </span>
                {streakHighlight.isHighlighted && (
                  <svg
                    viewBox="0 0 16 16"
                    className="w-3.5 h-3.5 shrink-0 text-[#E8B64A] animate-streak-spark"
                    aria-hidden="true"
                  >
                    <path
                      fill="currentColor"
                      d="M8.5 1.2C8.9 3.6 11.2 4.8 11.8 7.5C12.3 9.7 10.8 12.6 8.2 13.8C9.1 12.1 9.2 10.4 8.1 9.2C7.4 10.3 6.9 11.4 7.1 12.8C5.1 11.8 4.1 9.8 4.5 7.6C4.9 5.5 6.8 3.9 8.5 1.2Z"
                    />
                  </svg>
                )}
              </div>
              <div className="text-xl sm:text-2xl font-black font-serif tracking-tight text-[#EDE6D0] leading-none flex items-baseline gap-1">
                {summary.dailyStreakDays} <span className="text-sm font-sans font-semibold text-[#EDE6D0]/75">{summary.dailyStreakDays === 1 ? 'Day' : 'Days'}</span>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] font-bold text-[#86C581]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#6FA36B] animate-pulse" />
              {streakHighlight.statusLabel}
            </div>
          </article>
        </section>

        {/* Action Controls */}
        <section className="flex flex-col gap-2.5">
          {/* Primary / Hero Ad Multiplier Button */}
          {canWatchDoubleAd && !summary.doubleCoinsClaimed && (
            <button
              type="button"
              onClick={onWatchDoubleCoinsAd}
              className="group relative w-full
               h-[58px] [border-radius:24px_8px_24px_8px] bg-gradient-to-r from-[#F0C462]
                via-[#E8B64A] to-[#DFA83E] text-[#201A09] font-sans font-extrabold text-[14px]
                 tracking-wide flex items-center justify-between px-4 shadow-[0_8px_24px_-4px_rgba(232,182,74,0.45),inset_0_1px_1px_rgba(255,255,255,0.7)] hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
            >
              <div className="w-6 h-6 mr-2.5 rounded-full bg-[#36270b]/15 border border-[#36270b]/25 flex items-center justify-center shrink-0">
                <svg className="w-3.5 h-3.5 fill-[#201A09]" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span className="font-extrabold tracking-tight w-full">
                Watch Ad to Double Coins <br/> (+{summary.coinsEarned} Bonus Coins)
              </span>
            </button>
          )}

          {/* Secondary Action Pair */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Play Again Button */}
            <button
              type="button"
              data-start="true"
              onClick={onPlayAgain}
              className="h-[52px] [border-radius:12px_20px_12px_20px] bg-gradient-to-b from-[#78B074] to-[#60915C] text-[#0E1F12] font-sans font-extrabold text-[15px] flex items-center justify-center shadow-[0_6px_18px_-2px_rgba(96,145,92,0.4),inset_0_1px_1px_rgba(255,255,255,0.5)] border border-[#86C581]/60 hover:brightness-105 active:scale-[0.98] transition-all cursor-pointer"
            >
              Play Again
            </button>

            {/* Loadout & Store Button */}
            <button
              type="button"
              onClick={onReturnToTitle}
              className="h-[52px] [border-radius:20px_12px_20px_12px] bg-[#24211A] text-[#EDE6D0] font-sans font-bold text-[14px] flex items-center justify-center border border-[#484232] shadow-[inset_0_1px_0_rgba(237,230,208,0.1),0_4px_12px_rgba(0,0,0,0.4)] hover:bg-[#2c2820] active:scale-[0.98] transition-all cursor-pointer"
            >
              Loadout & Store
            </button>
          </div>
        </section>

        {/* Modal Bottom Botanical Notation */}
        <footer className="mt-4 pt-3 border-t border-[#EDE6D0]/10 flex justify-between items-center text-[10px] text-[#EDE6D0]/40 font-mono tracking-wider">
          <span>SPECIMEN EXPD. #{Math.abs(summary.score % 9000 + 1000)}</span>
          <span className="uppercase">{summary.outcome === 'victory' ? 'EXPEDITION VICTORY' : summary.outcome === 'timeout' ? 'EXPEDITION TIMEOUT' : 'EXPEDITION COMPLETE'}</span>
        </footer>
      </div>
    </div>
  );
}
