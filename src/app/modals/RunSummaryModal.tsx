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

export interface RunSummaryModalProps {
  summary: RunSummarySnapshot;
  canWatchDoubleAd: boolean;
  onWatchDoubleCoinsAd: () => void;
  onPlayAgain: () => void;
  onReturnToTitle: () => void;
}

/**
 * @llm-component RunSummaryModal
 * @llm-hook run-summary: displays expedition stats, score records, streak progress, and coin reward doubling
 */
export function RunSummaryModal({
  summary,
  canWatchDoubleAd,
  onWatchDoubleCoinsAd,
  onPlayAgain,
  onReturnToTitle,
}: RunSummaryModalProps) {
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
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#140E16]/88 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="summary-modal-title"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-[#2B1F2D] border-4 border-[#2D1E2F] p-6 text-[#FFFDF0] shadow-2xl">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-bold tracking-wider text-[#A8E6CF]">
              {summary.outcome === 'victory'
                ? 'MYSTIC GARDEN CLEARED!'
                : summary.outcome === 'timeout'
                  ? 'DUSK FELL OVER THE GARDEN'
                  : 'EXPEDITION ENDED'}
            </p>
            <h2 id="summary-modal-title" className="text-3xl font-display font-bold">
              {summary.outcome === 'victory' ? 'Glorious Bloom!' : 'Run Summary'}
            </h2>
          </div>

          <div className="text-right">
            <span className="text-xs text-[#FFFDF0]/70 block">PEAK STYLE</span>
            <span
              className="text-3xl font-display font-black"
              style={{ color: peakRank.colorHex }}
            >
              {peakRank.letter}
            </span>
          </div>
        </div>

        {/* Near-miss feedback (GDD Section 11) */}
        {summary.outcome !== 'victory' && (
          <p className="text-xs font-medium text-[#FFD3B6] mb-4">
            {summary.bossHpRemainingRatio > 0
              ? `Near Miss: Primordial Thornheart had ${Math.round(summary.bossHpRemainingRatio * 100)}% HP remaining!`
              : summary.elapsedSeconds < 90
                ? `Next milestone: Ancient Moss Colossus arrives at 1:30 (${Math.max(0, 90 - summary.elapsedSeconds)}s away).`
                : `Next milestone: Final Boss arrives at 3:15 (${Math.max(0, 195 - summary.elapsedSeconds)}s away).`}
          </p>
        )}

        {/* 4 Tabular Stat Tiles including Current Daily Streak */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="p-3 rounded-xl bg-[#1E1520] border border-[#FFFDF0]/10">
            <span className="text-[10px] font-bold tracking-wide text-[#FFFDF0]/60 block whitespace-nowrap">
              FINAL SCORE
            </span>
            <span className="text-xl font-mono-tabular font-bold text-[#FDFFB6]">
              {summary.score.toLocaleString()}
            </span>
            <span className="text-[11px] font-mono-tabular text-[#A8E6CF] block whitespace-nowrap">
              {summary.isNewBest ? 'NEW RECORD!' : `Best: ${summary.bestScore.toLocaleString()}`}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#1E1520] border border-[#FFFDF0]/10">
            <span className="text-[10px] font-bold tracking-wide text-[#FFFDF0]/60 block whitespace-nowrap">
              SURVIVED · KILLS
            </span>
            <span className="text-xl font-mono-tabular font-bold text-[#FFFDF0]">
              {timeFormatted}
            </span>
            <span className="text-[11px] font-mono-tabular text-[#FFFDF0]/75 block whitespace-nowrap">
              {summary.kills} Foes · {summary.bestStreak} Streak
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#1E1520] border border-[#FFFDF0]/10">
            <span className="text-[10px] font-bold tracking-wide text-[#FFFDF0]/60 block whitespace-nowrap">
              REWARDS
            </span>
            <span className="text-xl font-mono-tabular font-bold text-[#A8E6CF] flex items-center gap-1">
              +{summary.coinsEarned} <CoinIcon />
            </span>
            <span className="text-[11px] font-mono-tabular text-[#DED2F9] block whitespace-nowrap">
              +{summary.gemsEarned} Rare Seeds
            </span>
          </div>

          <div
            data-testid="daily-streak-indicator"
            data-streak-highlighted={streakHighlight.isHighlighted ? 'true' : 'false'}
            data-streak-milestone={streakHighlight.isMilestone ? 'true' : 'false'}
            className={`p-3 rounded-xl bg-[#1E1520] border transition-all ${streakAnimationClass}`}
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-bold tracking-wide text-[#FDFFB6] block whitespace-nowrap">
                DAILY STREAK
              </span>
              {streakHighlight.isHighlighted && (
                <svg
                  viewBox="0 0 16 16"
                  className="w-3.5 h-3.5 shrink-0 text-[#FDFFB6] animate-streak-spark"
                  aria-hidden="true"
                >
                  <path
                    fill="currentColor"
                    d="M8.5 1.2C8.9 3.6 11.2 4.8 11.8 7.5C12.3 9.7 10.8 12.6 8.2 13.8C9.1 12.1 9.2 10.4 8.1 9.2C7.4 10.3 6.9 11.4 7.1 12.8C5.1 11.8 4.1 9.8 4.5 7.6C4.9 5.5 6.8 3.9 8.5 1.2Z"
                  />
                </svg>
              )}
            </div>
            <span className="text-xl font-mono-tabular font-bold text-[#FFFDF0] block whitespace-nowrap">
              {summary.dailyStreakDays} {summary.dailyStreakDays === 1 ? 'Day' : 'Days'}
            </span>
            <span className="text-[11px] text-[#A8E6CF] block whitespace-nowrap">
              {streakHighlight.statusLabel}
            </span>
          </div>
        </div>

        {/* Rewarded Ad Double Coins Button */}
        {canWatchDoubleAd && !summary.doubleCoinsClaimed && (
          <button
            type="button"
            onClick={onWatchDoubleCoinsAd}
            className="w-full mb-3 py-2.5 px-4 rounded-xl bg-[#FDFFB6] text-[#2D1E2F] font-bold text-sm border-2 border-[#2D1E2F] hover:bg-[#fbbf24] transition-colors whitespace-nowrap"
          >
            Watch Ad to Double Coins (+{summary.coinsEarned} Bonus Coins)
          </button>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            data-start="true"
            onClick={onPlayAgain}
            className="py-3 px-5 rounded-xl bg-[#A8E6CF] text-[#2D1E2F] font-bold text-base border-2 border-[#2D1E2F] hover:bg-[#88D49E] transition-colors whitespace-nowrap"
          >
            Play Again
          </button>
          <button
            type="button"
            onClick={onReturnToTitle}
            className="py-3 px-5 rounded-xl bg-[#3B2B3E] text-[#FFFDF0] font-semibold text-sm border-2 border-[#FFFDF0]/20 hover:border-[#FFFDF0]/50 transition-colors whitespace-nowrap"
          >
            Loadout & Store
          </button>
        </div>
      </div>
    </div>
  );
}
