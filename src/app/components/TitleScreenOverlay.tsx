import React from 'react';
import { PROFESSIONS, THEME_PACKS } from '../../content/data/catalog';
import { CoinIcon, SeedGemIcon, TitleLockupSvg } from '../SvgIcons';
import { useGameShell } from '../context/GameShellContext';

/**
 * STATE 1: TITLE SCREEN (Atmospheric Live World Tour + Bespoke SVG Lockup)
 */
export function TitleScreenOverlay() {
  const {
    shellState,
    saveData,
    lastEndedRunRewards,
    startNewOrResumedRun,
    setSanctuaryTab,
  } = useGameShell();

  if (shellState !== 'title') return null;

  return (
    <main className="fixed inset-0 z-20 flex flex-col justify-between p-3 sm:p-6 md:p-10 pointer-events-none bg-gradient-to-t from-[#140E16]/90 via-[#140E16]/40 to-[#140E16]/70 overflow-y-auto overflow-x-hidden safe-area-inset">
      {/* Top Currency & Best Score Cluster */}
      <div className="flex flex-wrap items-center justify-between gap-2 pointer-events-auto w-full">
        <div className="px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#2B1F2D]/95 border-2 border-[#2D1E2F] text-[11px] sm:text-xs font-semibold text-[#FFFDF0] flex flex-wrap items-center gap-1.5 sm:gap-3 shadow-lg max-w-full">
          <span className="truncate">
            Active:{' '}
            <strong className="text-[#A8E6CF]">
              {PROFESSIONS[saveData.loadout.professionId]?.name}
            </strong>
          </span>
          <span aria-hidden="true" className="text-[#FFFDF0]/50">·</span>
          <span className="truncate">{THEME_PACKS[saveData.loadout.biomeId].name}</span>
          {saveData.bestScores.allTime > 0 && (
            <>
              <span aria-hidden="true" className="text-[#FFFDF0]/50 hidden xs:inline">·</span>
              <span className="font-mono-tabular text-[#FDFFB6] text-[10px] sm:text-xs">
                Best: {saveData.bestScores.allTime.toLocaleString()}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 px-2.5 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-[#2B1F2D]/95 border-2 border-[#2D1E2F] font-mono-tabular text-xs sm:text-sm font-bold shadow-lg shrink-0 ml-auto">
          <span className="flex items-center gap-1 sm:gap-1.5 text-[#FDFFB6]">
            <CoinIcon />
            {saveData.currencies.coins}
          </span>
          <span className="flex items-center gap-1 sm:gap-1.5 text-[#DED2F9]">
            <SeedGemIcon />
            {saveData.currencies.gems}
          </span>
        </div>
      </div>

      {/* Center Hero Lockup over Calm Negative Space */}
      <div className="my-auto mx-auto w-full max-w-lg flex flex-col items-center text-center pointer-events-auto py-2 sm:py-4">
        <TitleLockupSvg className="w-full max-w-[280px] xs:max-w-xs sm:max-w-md mb-2 sm:mb-4 drop-shadow-xl" />

        {lastEndedRunRewards && (
          <div
            data-testid="last-run-rewards-banner"
            className="w-full max-w-md mb-2.5 sm:mb-3 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl bg-[#2B1F2D]/95 border-2 border-[#A8E6CF] text-[11px] sm:text-xs font-bold text-[#FFFDF0] shadow-lg flex flex-wrap items-center justify-between gap-1.5 sm:gap-2"
          >
            <span className="text-[#A8E6CF] uppercase tracking-wider text-[10px] sm:text-xs">Run Ended · Rewards</span>
            <span className="font-mono-tabular text-[#FDFFB6] flex items-center gap-1.5 sm:gap-2 text-[11px] sm:text-xs">
              <span>+{lastEndedRunRewards.coinsEarned} Coins</span>
              <span className="text-[#FFFDF0]/40">·</span>
              <span className="text-[#DED2F9]">+{lastEndedRunRewards.gemsEarned} Seeds</span>
              <span className="text-[#FFFDF0]/40">·</span>
              <span>{lastEndedRunRewards.score.toLocaleString()} PTS</span>
            </span>
          </div>
        )}

        {/* Primary Start CTA + Optional Mid-Run Eviction Resume */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 w-full max-w-md mb-2 sm:mb-3">
          <button
            type="button"
            data-start="true"
            onClick={() => startNewOrResumedRun(false)}
            className="w-full sm:flex-1 btn-herbarium-primary justify-center text-center px-4 sm:px-6 py-3 sm:py-0 text-base sm:text-lg tracking-wide whitespace-nowrap shadow-xl"
          >
            <span className="leading-none text-center mx-auto">Start Run</span>
          </button>

          {saveData.activeRun && (
            <button
              type="button"
              onClick={() => startNewOrResumedRun(true)}
              className="w-full sm:w-auto btn-herbarium-lichen px-4 sm:px-5 py-2.5 sm:py-0 text-xs sm:text-sm whitespace-nowrap shadow-lg"
            >
              Resume Run (Lv {saveData.activeRun.level})
            </button>
          )}
        </div>

        {/* Secondary Sanctuary Actions */}
        <div className="flex flex-col xs:flex-row items-center justify-center gap-2 sm:gap-3 w-full max-w-md">
          <button
            type="button"
            onClick={() => setSanctuaryTab('loadout')}
            className="w-full xs:flex-1 btn-herbarium-secondary px-3 sm:px-4 text-[11px] sm:text-xs whitespace-nowrap py-2.5 sm:py-0"
          >
            {/* Book / Codex Icon */}
            <svg className="w-4 h-4 text-[#C4B998] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>Loadout & Professions</span>
          </button>
          <button
            type="button"
            onClick={() => setSanctuaryTab('store')}
            className="w-full xs:flex-1 btn-herbarium-secondary px-3 sm:px-4 text-[11px] sm:text-xs whitespace-nowrap py-2.5 sm:py-0"
          >
            {/* Store / Relic Sparkle Icon */}
            <svg className="w-4 h-4 text-[#C4B998] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span>Relic Store & Quests</span>
          </button>
        </div>
      </div>

      {/* Single Flat Borderless Control-Hint Line in Bottom Safe Margin */}
      <div className="text-center text-[11px] sm:text-xs font-medium text-[#FFFDF0]/80 tracking-wide pb-1 sm:pb-0">
        <span className="portrait:hidden">Drag / WASD Move · Flick / Space Dash · Q / E Power-Up · P / Esc Pause</span>
        <span className="landscape:hidden">Drag to Move · Flick to Dash</span>
      </div>
    </main>
  );
}
