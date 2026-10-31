import React from 'react';
import type { MenuDataProvider } from './MenuHost';
import {
  MenuCoinIconSvg,
  MenuCrystalIconSvg,
  MenuStarIconSvg,
  MenuTitleCrestSvg,
} from './MenuVisualsSvg';
import { getMainContainerClassName } from './MenuHtmlUi.styles';
import { GameButton } from '../ui/ornate';

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
          <GameButton
            variant="gold"
            size="lg"
            ornament="crystal"
            align="center"
            title="Start Run"
            dataStart={true}
            dataTestId="menu-start-run-button"
            onClick={onStartRun}
            className="flex-1"
          />

          {data.hasRun && (
            <GameButton
              variant="green"
              size="lg"
              ornament="ivy"
              align="center"
              title={`Resume Run (Lv ${data.runLevel ?? 1})`}
              dataTestId="menu-resume-run-button"
              onClick={onResumeRun}
              className="sm:w-[218px]"
            />
          )}
        </div>

        {/* Secondary Sanctuary Stack: Loadout & Professions / Relic Store & Quests */}
        <div className="flex flex-col gap-3 w-full">
          <GameButton
            variant="dark"
            size="md"
            ornament="none"
            align="center"
            title="Loadout & Professions"
            dataTestId="open-loadout-button"
            onClick={onOpenLoadout}
            className="w-full"
            icon={
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
            }
          />

          <GameButton
            variant="dark"
            size="md"
            ornament="none"
            align="center"
            title="Relic Store & Quests"
            dataTestId="open-store-button"
            onClick={onOpenStore}
            className="w-full"
            icon={
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
            }
          />
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
