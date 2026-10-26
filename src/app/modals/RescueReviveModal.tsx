/**
 * @file RescueReviveModal.tsx
 * @llm-tag modal:rescue-revive
 * @llm-context Second Blossom rescue revive prompt offered once per run upon hero defeat.
 * @llm-description Offers player a chance to revive via rewarded ad or 150 coins (granting 50% max HP, invulnerability shield, and screen-clearing shockwave), or decline to conclude the run.
 */

import React from 'react';

export interface RescueReviveModalProps {
  coins: number;
  canWatchAd: boolean;
  isAdLoading: boolean;
  onWatchAdRevive: () => void;
  onSpendCoinsRevive: () => void;
  onDeclineRevive: () => void;
}

/**
 * @llm-component RescueReviveModal
 * @llm-hook death-rescue: mid-run death prompt with rewarded video or coin revive
 */
export function RescueReviveModal({
  coins,
  canWatchAd,
  isAdLoading,
  onWatchAdRevive,
  onSpendCoinsRevive,
  onDeclineRevive,
}: RescueReviveModalProps) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#140E16]/85 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rescue-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#2B1F2D] border-4 border-[#FFAAA6] p-6 text-center text-[#FFFDF0] shadow-2xl">
        {/* @llm-hook death-screen-clean: removed abrupt "GARDEN GUARDIAN FALLEN" / sudden death header */}
        <h2 id="rescue-modal-title" className="text-2xl font-display font-bold mb-2">
          Second Blossom Rescue?
        </h2>
        <p className="text-sm text-[#FFFDF0]/80 mb-5">
          Restore 50% Max HP, gain 3.0 seconds of invulnerability, and unleash a shockwave that clears surrounding monsters.
        </p>

        <div className="flex flex-col gap-3">
          {canWatchAd && (
            <button
              type="button"
              disabled={isAdLoading}
              onClick={onWatchAdRevive}
              className="w-full py-3 px-4 rounded-xl bg-[#A8E6CF] text-[#2D1E2F] font-bold text-base border-2 border-[#2D1E2F] hover:bg-[#88D49E] transition-colors whitespace-nowrap"
            >
              {isAdLoading ? 'Loading Rewarded Ad...' : 'Watch Ad to Revive (50% HP + Shield)'}
            </button>
          )}

          <button
            type="button"
            disabled={coins < 150 || isAdLoading}
            onClick={onSpendCoinsRevive}
            className="w-full py-2.5 px-4 rounded-xl bg-[#FDFFB6] text-[#2D1E2F] font-bold text-sm border-2 border-[#2D1E2F] disabled:opacity-40 hover:bg-[#fbbf24] transition-colors whitespace-nowrap"
          >
            Revive with 150 Coins (You have {coins})
          </button>

          <button
            type="button"
            disabled={isAdLoading}
            onClick={onDeclineRevive}
            className="w-full py-2 px-4 rounded-xl bg-transparent text-[#FFFDF0]/70 hover:text-[#FFFDF0] text-sm font-semibold transition-colors whitespace-nowrap"
          >
            End Run & See Score Summary
          </button>
        </div>
      </div>
    </div>
  );
}
