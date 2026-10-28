/**
 * @file RunSummaryModal.tsx
 * @llm-tag modal:run-summary
 * @llm-context Post-run outcome report displaying final score, survival time, style rank, rewards, and daily streak progress.
 * @llm-description Features near-miss boss milestone notifications, daily streak animations, rewarded ad double coins multiplier, and quick replay/loadout actions.
 */

import React from 'react';
import { STYLE_RANKS } from '../../content/data/catalog';
import { getDailyStreakHighlight } from '../../meta/SaveManager';
import { CoinIcon } from '../SvgIcons';
import { useGameShell } from '../context/GameShellContext';

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

  if (!runSummary) return null;

  const summary = runSummary;
  const canWatchDoubleAd = canWatchRewardedAd;
  const onWatchDoubleCoinsAd = handleWatchDoubleCoinsAd;
  const onPlayAgain = () => startNewOrResumedRun(false);
  const onReturnToTitle = handleReturnToTitleFromSummary;

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
        <header className="relative mb-5 flex items-start justify-between">
          <div className="flex-1 pr-3">
            {/* Eyebrow Banner */}
            <div className="flex items-center gap-1.5 mb-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#5FE0C8] shadow-[0_0_6px_#5FE0C8]" />
              <p className="text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#86C581]">
                {summary.outcome === 'victory'
                  ? 'MYSTIC GARDEN CLEARED!'
                  : summary.outcome === 'timeout'
                    ? 'DUSK FELL OVER THE GARDEN'
                    : 'EXPEDITION ENDED'}
              </p>
            </div>
            {/* Headline Title */}
            <h2
              id="summary-modal-title"
              className="text-3xl sm:text-[34px] leading-tight font-serif font-black tracking-tight text-[#EDE6D0] drop-shadow-[0_2px_12px_rgba(232,182,74,0.25)]"
            >
              {summary.outcome === 'victory' ? 'Glorious Bloom!' : 'Run Summary'}
            </h2>
          </div>

          {/* Peak Style Wax Seal Medallion */}
          <div className="flex flex-col items-center justify-center shrink-0">
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-[#EDE6D0]/50 mb-0.5">
              PEAK STYLE
            </span>
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
                className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider uppercase ${
                  summary.isNewBest
                    ? 'bg-[#6FA36B]/20 text-[#86C581] border border-[#6FA36B]/40'
                    : 'text-[#EDE6D0]/50'
                }`}
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
            className={`p-3.5 rounded-2xl flex flex-col justify-between bg-[linear-gradient(165deg,rgba(28,38,35,0.8)_0%,rgba(18,26,24,0.9)_100%)] border shadow-[inset_0_1px_0_rgba(237,230,208,0.06),0_4px_12px_rgba(0,0,0,0.35)] transition-all ${streakAnimationClass}`}
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
