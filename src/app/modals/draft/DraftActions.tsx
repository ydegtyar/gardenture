/**
 * @file DraftActions.tsx
 * Action buttons bar for the Botanical Tarot Draft screen built exclusively with `GameButton`
 * from `src/ui/ornate/`:
 * - Mobile (<= 899px): Staggered, slightly overlapping hand-crafted stack with `Skip Draft` inset right.
 * - Desktop (>= 900px): `Watch Ad to Reroll` + `Reroll with Coins` side-by-side, `Skip Draft` centered below.
 */

import React from 'react';
import { Simulation } from '../../../sim/Simulation';
import { CoinIcon } from '../../SvgIcons';
import { GameButton, WingedHeartIconSvg } from '../../../ui/ornate';

export interface DraftActionsProps {
  coins: number;
  freeRerollAvailable: boolean;
  freeRerollsRemaining: number;
  canAdReroll: boolean;
  adRerollsRemaining: number;
  coinRerollsRemaining: number;
  isAdLoading: boolean;
  canInteract: boolean;
  onRerollFree: () => void;
  onRerollAd: () => void;
  onRerollCoins: () => void;
  onSkipDraft: () => void;
}

export const DraftActions: React.FC<DraftActionsProps> = ({
  coins,
  freeRerollAvailable,
  freeRerollsRemaining,
  canAdReroll,
  adRerollsRemaining,
  coinRerollsRemaining,
  isAdLoading,
  canInteract,
  onRerollFree,
  onRerollAd,
  onRerollCoins,
  onSkipDraft,
}) => {
  const canUseCoinReroll = canInteract && coins >= 40 && coinRerollsRemaining > 0;
  const canUseAdReroll = canInteract && canAdReroll && adRerollsRemaining > 0;
  const canUseFreeReroll = canInteract && freeRerollAvailable && freeRerollsRemaining > 0;

  return (
    <div
      data-testid="draft-actions-bar"
      className="w-full max-w-[540px] min-[900px]:max-w-[780px] mx-auto pt-1 flex flex-col gap-1.5 min-[900px]:gap-2.5 shrink-0"
    >
      {/* Primary Reroll Row: Stacked & slightly overlapping on Mobile, Side-by-Side on Desktop */}
      <div className="flex flex-col min-[900px]:grid min-[900px]:grid-cols-2 items-stretch gap-1 min-[900px]:gap-4 w-full">
        {freeRerollAvailable ? (
          <GameButton
            variant="green"
            size="md"
            ornament="ivy"
            align="between"
            dataTestId="draft-reroll-free-btn"
            badgeTestId="draft-reroll-free-count"
            disabled={!canUseFreeReroll}
            onClick={onRerollFree}
            title="Free Reroll"
            subtitle="Trinket Blessing"
            badge={`${freeRerollsRemaining} Left`}
            className="w-full z-20"
            icon={
              <svg
                className="w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
                <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                <path d="M16 16h5v5" />
              </svg>
            }
          />
        ) : (
          <GameButton
            variant="green"
            size="md"
            ornament="ivy"
            align="between"
            dataTestId="draft-reroll-ad-btn"
            disabled={!canUseAdReroll}
            loading={isAdLoading}
            onClick={onRerollAd}
            title="Watch Ad to Reroll"
            subtitle={`Ad Rerolls: ${adRerollsRemaining}/${Simulation.MAX_AD_REROLLS} Left`}
            badge={`${adRerollsRemaining}/${Simulation.MAX_AD_REROLLS}`}
            className="w-full z-20"
            icon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M8 5.14v14l11-7-11-7z" />
              </svg>
            }
          />
        )}

        {/* Reroll with Coins (Amber/Gold with Thorn Vine Ornament) */}
        <GameButton
          variant="gold"
          size="md"
          ornament="thorn"
          align="between"
          dataTestId="draft-reroll-coins-btn"
          disabled={!canUseCoinReroll}
          onClick={onRerollCoins}
          title="Reroll with Coins"
          subtitle={`Vault: ${coins} · ${coinRerollsRemaining}/${Simulation.MAX_COIN_REROLLS} Left`}
          badge={
            <span className="inline-flex items-center gap-1">
              <CoinIcon className="w-3.5 h-3.5" />
              <span>40</span>
            </span>
          }
          className="w-full max-[899px]:-mt-1 z-10"
          icon={
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
              <path
                d="M6 9C6 6.5 8.5 4.5 12 4.5C15.5 4.5 18 6.5 18 9L19.5 17.5C19.8 19.2 18.5 20.5 16.8 20.5H7.2C5.5 20.5 4.2 19.2 4.5 17.5L6 9Z"
                fill="currentColor"
                fillOpacity="0.22"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <circle cx="12" cy="13.5" r="3.5" fill="currentColor" />
            </svg>
          }
        />
      </div>

      {/* Secondary Row: Skip Draft (Inset to right on mobile per Reference 2, centered on desktop) */}
      <div className="w-full flex justify-end min-[900px]:justify-center">
        <GameButton
          variant="teal"
          size="md"
          ornament="laurel"
          align="between"
          dataTestId="draft-skip-btn"
          disabled={!canInteract}
          onClick={onSkipDraft}
          title="Skip Draft"
          subtitle="Herbal Rest"
          badge="+10 HP · +100 Score"
          icon={<WingedHeartIconSvg className="w-5 h-5" />}
          className="w-[88%] sm:w-[82%] min-[900px]:w-[360px]"
        />
      </div>
    </div>
  );
};

export default DraftActions;
