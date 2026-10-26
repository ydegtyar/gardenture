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
    <main className="fixed inset-0 z-20 flex flex-col justify-between p-6 md:p-10 pointer-events-none bg-gradient-to-t from-[#140E16]/85 via-[#140E16]/35 to-[#140E16]/65">
      {/* Top-Right Currency & Best Score Cluster */}
      <div className="flex items-center justify-between gap-4 pointer-events-auto">
        <div className="px-3.5 py-2 rounded-xl bg-[#2B1F2D]/95 border-2 border-[#2D1E2F] text-xs font-semibold text-[#FFFDF0] flex items-center gap-3 shadow-lg">
          <span>
            Active:{' '}
            <strong className="text-[#A8E6CF]">
              {PROFESSIONS[saveData.loadout.professionId]?.name}
            </strong>
          </span>
          <span aria-hidden="true">·</span>
          <span>{THEME_PACKS[saveData.loadout.biomeId].name}</span>
          {saveData.bestScores.allTime > 0 && (
            <>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular text-[#FDFFB6]">
                Best: {saveData.bestScores.allTime.toLocaleString()}
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-[#2B1F2D]/95 border-2 border-[#2D1E2F] font-mono-tabular text-sm font-bold shadow-lg">
          <span className="flex items-center gap-1.5 text-[#FDFFB6]">
            <CoinIcon />
            {saveData.currencies.coins}
          </span>
          <span className="flex items-center gap-1.5 text-[#DED2F9]">
            <SeedGemIcon />
            {saveData.currencies.gems}
          </span>
        </div>
      </div>

      {/* Center Hero Lockup over Calm Negative Space */}
      <div className="my-auto mx-auto w-full max-w-lg flex flex-col items-center text-center pointer-events-auto">
        <TitleLockupSvg className="w-full max-w-md mb-4 drop-shadow-xl" />

        <p
          className="text-sm md:text-base text-[#FFFDF0]/90 font-medium max-w-md mb-6"
          style={{ textWrap: 'balance' }}
        >
          Drag to glide through the mystic garden, flick to dash through telegraphed swarms, draft 30 botanical synergies, and climb to Style Rank SSS.
        </p>

        {lastEndedRunRewards && (
          <div
            data-testid="last-run-rewards-banner"
            className="w-full max-w-md mb-3 px-4 py-2.5 rounded-xl bg-[#2B1F2D]/95 border-2 border-[#A8E6CF] text-xs font-bold text-[#FFFDF0] shadow-lg flex items-center justify-between gap-2"
          >
            <span className="text-[#A8E6CF] uppercase tracking-wider">Run Ended · Rewards</span>
            <span className="font-mono-tabular text-[#FDFFB6] flex items-center gap-2">
              <span>+{lastEndedRunRewards.coinsEarned} Coins</span>
              <span>·</span>
              <span className="text-[#DED2F9]">+{lastEndedRunRewards.gemsEarned} Seeds</span>
              <span>·</span>
              <span>{lastEndedRunRewards.score.toLocaleString()} PTS</span>
            </span>
          </div>
        )}

        {/* Primary Start CTA + Optional Mid-Run Eviction Resume */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full max-w-md mb-3">
          <button
            type="button"
            data-start="true"
            onClick={() => startNewOrResumedRun(false)}
            className="w-full sm:flex-1 py-3.5 px-6 rounded-xl bg-[#A8E6CF] text-[#2D1E2F] font-display font-black text-lg border-4 border-[#2D1E2F] shadow-xl hover:bg-[#88D49E] active:translate-y-0.5 transition-all whitespace-nowrap"
          >
            Start Run
          </button>

          {saveData.activeRun && (
            <button
              type="button"
              onClick={() => startNewOrResumedRun(true)}
              className="w-full sm:w-auto py-3.5 px-5 rounded-xl bg-[#FDFFB6] text-[#2D1E2F] font-bold text-sm border-4 border-[#2D1E2F] shadow-xl hover:bg-[#fbbf24] transition-all whitespace-nowrap"
            >
              Resume Run (Lv {saveData.activeRun.level})
            </button>
          )}
        </div>

        {/* Secondary Sanctuary Actions */}
        <div className="flex items-center justify-center gap-3 w-full max-w-md">
          <button
            type="button"
            onClick={() => setSanctuaryTab('loadout')}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#2B1F2D]/95 text-[#FFFDF0] font-bold text-xs border-2 border-[#2D1E2F] hover:border-[#A8E6CF] transition-colors whitespace-nowrap"
          >
            Loadout & Professions
          </button>
          <button
            type="button"
            onClick={() => setSanctuaryTab('store')}
            className="flex-1 py-2.5 px-4 rounded-xl bg-[#2B1F2D]/95 text-[#FDFFB6] font-bold text-xs border-2 border-[#2D1E2F] hover:border-[#FDFFB6] transition-colors whitespace-nowrap"
          >
            Relic Store & Quests
          </button>
        </div>
      </div>

      {/* Single Flat Borderless Control-Hint Line in Bottom Safe Margin */}
      <div className="text-center text-xs font-medium text-[#FFFDF0]/80 tracking-wide">
        Drag / WASD Move · Flick / Space Dash · Q / E Power-Up · P / Esc Pause
      </div>
    </main>
  );
}
