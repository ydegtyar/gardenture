import React from 'react';
import type { MenuDataProvider } from './MenuHost';
import {
  MenuCoinIconSvg,
  MenuCrystalIconSvg,
  MenuResumeVineOverlaySvg,
  MenuStarIconSvg,
  MenuStartCornerCrystalSvg,
  MenuTitleCrestSvg,
} from './MenuVisualsSvg';
import { getMainContainerClassName } from './MenuHtmlUi.styles';

export interface Props {
  data: MenuDataProvider;
  isExiting?: boolean;
  onStartRun: () => void;
  onResumeRun: () => void;
  onOpenLoadout: () => void;
  onOpenStore: () => void;
  onWatchCoinsAd?: () => void;
}

export const MenuHtmlUi: React.FC<Props> = ({
  data,
  isExiting = false,
  onStartRun,
  onResumeRun,
  onOpenLoadout,
  onOpenStore,
  onWatchCoinsAd,
}) => {
  const professionLabel = data.activeProfessionName || 'Warden';

  return (
    <main className={getMainContainerClassName(isExiting)}>
      {/* Top Bar: Left Status Capsule & Right Currency Capsule */}
      <div className="flex flex-wrap items-center justify-between gap-2 pointer-events-auto w-full shrink-0">
        {/* Left Capsule: Active Profession · Biome · Best Score */}
        <div
          data-testid="menu-status-pill"
          className="px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#211727]/92 border border-[#9EB56D]/60 text-[11px] sm:text-[13px] font-medium text-[#F5F2EB] flex flex-wrap items-center gap-1.5 sm:gap-2.5 shadow-[0_10px_24px_rgba(5,2,10,0.82),0_3px_8px_rgba(0,0,0,0.7),0_0_20px_rgba(163,190,104,0.22)] max-w-full"
        >
          <span className="truncate">
            <strong className="font-semibold text-[#98E2B6]">{professionLabel}</strong>
          </span>
          <span aria-hidden="true" className="text-[#F5F2EB]/45">
            ·
          </span>
          <span
            data-testid="menu-best-score"
            className="font-mono-tabular font-semibold text-[#FFF4B8] inline-flex items-center gap-1"
            title="Best Score"
          >
            <MenuStarIconSvg className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#F4D372] shrink-0" />
            <span>{data.bestScore.toLocaleString()}</span>
          </span>
        </div>

        {/* Right Capsule: Coins + Ad Bonus + Crystals/Seeds */}
        <div
          data-testid="menu-currency-pill"
          className="flex items-center gap-2.5 sm:gap-3.5 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-[#241A29]/92 border border-[#6E5C78]/55 font-mono-tabular text-xs sm:text-sm font-bold shadow-[0_10px_24px_rgba(5,2,10,0.82),0_3px_8px_rgba(0,0,0,0.7)] shrink-0 ml-auto"
        >
          {data.canWatchAdForCoins && onWatchCoinsAd ? (
            <button
              type="button"
              onClick={onWatchCoinsAd}
              title="Watch ad for +100 Coins"
              className="flex items-center gap-1.5 text-[#FFF0A8] hover:text-[#FFF9D2] active:scale-95 transition-all cursor-pointer"
            >
              <MenuCoinIconSvg className="w-5 h-5 shrink-0" />
              <span data-testid="menu-coins-count">{data.coins}</span>
            </button>
          ) : (
            <div
              title="Purse Coins"
              className="flex items-center gap-1.5 text-[#FFF0A8]"
            >
              <MenuCoinIconSvg className="w-5 h-5 shrink-0" />
              <span data-testid="menu-coins-count">{data.coins}</span>
            </div>
          )}

          <div
            title="Crystals / Seeds"
            className="flex items-center gap-1.5 text-[#F4F8FF]"
          >
            <MenuCrystalIconSvg className="w-4.5 h-5 shrink-0" />
            <span data-testid="menu-crystals-count">{data.crystals}</span>
          </div>
        </div>
      </div>

      {/* Center Lockup & Action Stack */}
      <div className="my-auto mx-auto w-full max-w-[530px] flex flex-col items-center text-center pointer-events-auto py-2 shrink-0 overflow-visible">
        {/* Ornate Vine-Wrapped Botanical Crest */}
        <MenuTitleCrestSvg className="w-full sm:w-[106%] max-w-[390px] xs:max-w-[480px] sm:max-w-[560px] mb-3 sm:mb-4 drop-shadow-[0_16px_28px_rgba(6,2,12,0.88)] shrink-0" />

        {/* Optional Last Ended Run Rewards Banner */}
        {data.lastRunRewards && (
          <div
            data-testid="last-run-rewards-banner"
            className="w-full mb-3 px-4 py-2 rounded-xl bg-[#261A2C]/95 border border-[#98E2B6]/70 text-xs font-bold text-[#FFFDF0] shadow-[0_12px_24px_rgba(5,2,10,0.8)] flex flex-wrap items-center justify-between gap-2"
          >
            <span className="text-[#98E2B6] uppercase tracking-wider text-[11px]">
              Last run:
            </span>
            <span className="font-mono-tabular text-[#FFF0A8] flex items-center gap-2">
              <span>+{data.lastRunRewards.coinsEarned} Coins</span>
              <span className="text-[#FFFDF0]/40">·</span>
              <span className="text-[#BCEBFF]">
                +{data.lastRunRewards.crystalsEarned} Seeds
              </span>
              <span className="text-[#FFFDF0]/40">·</span>
              <span>{data.lastRunRewards.score.toLocaleString()} PTS</span>
            </span>
          </div>
        )}

        {/* Primary CTA Row: Start Run + Optional Resume Run (Lv X) */}
        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3.5 w-full mb-3.5">
          <button
            type="button"
            data-start="true"
            data-testid="menu-start-run-button"
            onClick={onStartRun}
            className="relative flex-1 min-h-[60px] sm:min-h-[66px] px-6 py-3 rounded-[13px] bg-gradient-to-b from-[#F4D372] via-[#DCAC46] to-[#C28E2B] hover:from-[#FFE082] hover:to-[#CFA038] active:scale-[0.99] transition-all border-2 border-[#FFF3B8] shadow-[0_14px_28px_rgba(5,2,10,0.85),0_4px_10px_rgba(0,0,0,0.75),0_0_26px_rgba(244,211,114,0.42)] flex items-center justify-center cursor-pointer group"
          >
            {/* Inner bevel border */}
            <span
              className="absolute inset-[3px] rounded-[9px] border border-[#7A5312]/65 pointer-events-none"
              aria-hidden="true"
            />
            {/* Faceted Crystal Cluster perched on top-right corner */}
            <MenuStartCornerCrystalSvg className="w-8 h-8 absolute -top-2.5 -right-2.5 pointer-events-none drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]" />

            <span className="relative z-10 font-display text-xl sm:text-[23px] font-extrabold text-[#2B1F11] tracking-wide">
              Start Run
            </span>
          </button>

          {data.hasRun && (
            <button
              type="button"
              data-testid="menu-resume-run-button"
              onClick={onResumeRun}
              className="relative sm:w-[215px] min-h-[60px] sm:min-h-[66px] px-5 py-3 rounded-[13px] bg-gradient-to-b from-[#6BE8A8] via-[#34B374] to-[#1D7A4C] hover:from-[#80F2B7] hover:to-[#248F59] active:scale-[0.99] transition-all border-2 border-[#A7F3D0] shadow-[0_14px_28px_rgba(5,2,10,0.85),0_4px_10px_rgba(0,0,0,0.75),0_0_24px_rgba(72,229,122,0.38)] flex items-center justify-center cursor-pointer"
            >
              <span
                className="absolute inset-[3px] rounded-[9px] border border-[#0D3822]/70 pointer-events-none"
                aria-hidden="true"
              />
              <MenuResumeVineOverlaySvg />
              <span className="relative z-10 font-sans text-sm sm:text-[16px] font-bold text-[#0E291A] whitespace-nowrap">
                Resume Run (Lv {data.runLevel ?? 1})
              </span>
            </button>
          )}
        </div>

        {/* Secondary Sanctuary Stack: Loadout & Professions / Relic Store & Quests */}
        <div className="flex flex-col gap-3 w-full">
          <button
            type="button"
            data-testid="open-loadout-button"
            onClick={onOpenLoadout}
            className="relative w-full min-h-[54px] sm:min-h-[58px] px-5 py-3 rounded-[13px] bg-gradient-to-b from-[#2B2032]/92 via-[#221928]/94 to-[#2E2236]/92 hover:from-[#36283F]/96 hover:to-[#3A2B44]/96 active:scale-[0.99] transition-all border border-[#7C6D86]/65 shadow-[0_12px_24px_rgba(5,2,10,0.82),0_4px_10px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.16)] flex items-center justify-center gap-2.5 text-[#F7F4EE] text-sm sm:text-[15px] font-semibold cursor-pointer"
          >
            <svg
              className="w-4.5 h-4.5 text-[#D8CFC2] shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>Loadout & Professions</span>
          </button>

          <button
            type="button"
            data-testid="open-store-button"
            onClick={onOpenStore}
            className="relative w-full min-h-[54px] sm:min-h-[58px] px-5 py-3 rounded-[13px] bg-gradient-to-b from-[#2B2032]/92 via-[#221928]/94 to-[#2E2236]/92 hover:from-[#36283F]/96 hover:to-[#3A2B44]/96 active:scale-[0.99] transition-all border border-[#7C6D86]/65 shadow-[0_12px_24px_rgba(5,2,10,0.82),0_4px_10px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,255,255,0.16)] flex items-center justify-center gap-2.5 text-[#F7F4EE] text-sm sm:text-[15px] font-semibold cursor-pointer"
          >
            <svg
              className="w-4.5 h-4.5 text-[#D8CFC2] shrink-0"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              aria-hidden="true"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span>Relic Store & Quests</span>
          </button>
        </div>
      </div>

      {/* Bottom Safe-Margin Control Hint Line */}
      <div className="text-center text-[11px] sm:text-xs font-medium text-[#EAE4DC]/85 tracking-wide pb-1 sm:pb-0 shrink-0">
        <span className="portrait:hidden">
          Drag / WASD Move · Flick / Space Dash · Q / E Power-Up · P / Esc Pause
        </span>
        <span className="landscape:hidden">Drag to Move · Flick to Dash</span>
      </div>
    </main>
  );
};
