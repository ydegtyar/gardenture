/**
 * @file RescueReviveModal.tsx
 * @llm-tag modal:rescue-revive
 * @llm-context Second Blossom rescue revive prompt offered once per run upon hero defeat.
 * @llm-description Stitch design compliant modal offering player a chance to revive via rewarded ad or 150 coins (granting 50% max HP, invulnerability shield, and screen-clearing shockwave), or decline to conclude the run.
 */

import React from 'react';

export interface Props {
  coins: number;
  canWatchAd: boolean;
  isAdLoading: boolean;
  onWatchAdRevive: () => void;
  onSpendCoinsRevive: () => void;
  onDeclineRevive: () => void;
}

export type RescueReviveModalProps = Props;

/**
 * @llm-component RescueReviveModal
 * @llm-hook death-rescue: mid-run death prompt with rewarded video or coin revive matching Stitch Occult Botanica Rite design
 */
export function RescueReviveModal({
                                    coins,
                                    canWatchAd,
                                    isAdLoading,
                                    onWatchAdRevive,
                                    onSpendCoinsRevive,
                                    onDeclineRevive,
                                  }: Props) {
  const canAffordCoins = coins >= 150;

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#100E04]/85 backdrop-blur-sm pointer-events-auto overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rescue-modal-title"
    >
      {/* Background ambient radial glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-[#93000a]/20 blur-3xl" />
        <div
          className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-[#f2bf52]/10 via-transparent to-transparent" />
      </div>

      {/* Center Codex Modal Card */}
      <div
        className="w-full max-w-md bg-[#1e1c0e]/95 backdrop-blur-xl border border-[#41493f]/40 rounded-2xl p-5 sm:p-6 shadow-[0_8px_32px_rgba(0,0,0,0.6)] relative z-10 flex flex-col items-center text-[#e9e2cc]">
        {/* Top Flourish Filigree */}
        <div className="w-full flex items-center justify-between text-[#f2bf52]/60 mb-2 px-1">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z"
              opacity="0.2"
            />
            <path
              d="M3 3c3 0 6 3 6 6-3 0-6-3-6-6zm18 0c-3 0-6 3-6 6 3 0 6-3 6-6zM3 21c3 0 6-3 6-6-3 0-6-3-6-6zm18 0c-3 0-6-3-6-6 3 0 6 3 6 6z" />
          </svg>

          <div className="flex items-center gap-2">
            <span
              className="h-px w-10 bg-gradient-to-r from-transparent via-[#f2bf52]/50 to-transparent" />
            {/* Flower / lotus icon */}
            <svg className="w-4 h-4 text-[#f2bf52]" viewBox="0 0 24 24" fill="currentColor"
                 aria-hidden="true">
              <path
                d="M12 2c-.6 2.5-2 4.5-4 5.5 1.5.5 3 1.8 3.5 3.5.5-1.7 2-3 3.5-3.5-2-1-3.4-3-4-5.5zm-5 8c-2.5.5-4.5 2-5.5 4 .5-1.5 1.8-3 3.5-3.5 1.7-.5 3-2 3.5-3.5-1 2-3 3.4-5.5 4zm14 4c-1-2-3-3.4-5.5-4 2.5-.5 4.5-2 5.5-4-.5 1.5-1.8 3-3.5 3.5-1.7.5-3 2-3.5 3.5 2-.6 4-2 7-3zm-9 3c-2.8 0-5 2.2-5 5h10c0-2.8-2.2-5-5-5z" />
            </svg>
            <span
              className="h-px w-10 bg-gradient-to-r from-transparent via-[#f2bf52]/50 to-transparent" />
          </div>

          <svg className="w-5 h-5 rotate-90" fill="currentColor" viewBox="0 0 24 24"
               aria-hidden="true">
            <path
              d="M3 3c3 0 6 3 6 6-3 0-6-3-6-6zm18 0c-3 0-6 3-6 6 3 0 6-3 6-6zM3 21c3 0 6-3 6-6-3 0-6 3-6 6zm18 0c-3 0-6-3-6-6 3 0 6 3 6 6z" />
          </svg>
        </div>

        {/* Hero Mystic Blossom Relic Icon with Wax Stamp */}
        <div className="relative my-2 flex items-center justify-center">
          {/* Spore aura glow rings */}
          <div
            className="absolute w-24 h-24 rounded-full bg-[#59dbc3]/15 animate-ping opacity-75" />
          <div className="absolute w-20 h-20 rounded-full bg-[#f2bf52]/20 blur-md" />

          {/* Wax Seal Medallion Outer */}
          <div
            className="relative w-20 h-20 rounded-full bg-[#b68a1f] flex items-center justify-center shadow-xl border border-[#f2bf52]/40">
            {/* Inner engraved chamber */}
            <div
              className="w-16 h-16 rounded-full bg-[#100e04] flex items-center justify-center shadow-inner relative overflow-hidden">
              {/* Pulsing flower emblem */}
              <svg
                className="w-9 h-9 text-[#f2bf52] filter drop-shadow-[0_0_10px_#f2bf52]"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  d="M12 3c-.5 2.5-2 4.5-4.5 5.5 2 .5 3.5 2 4 4.5.5-2.5 2-4 4-4.5-2.5-1-4-3-4.5-5.5zm0 10.5c-1.5 2.5-4 4.2-7 4.5 2.5 1 4 3 4.5 5.5.5-2.5 2-4.5 4.5-5.5-3-.3-5.5-2-7-4.5zm0 0c1.5 2.5 4 4.2 7 4.5-2.5 1-4 3-4.5 5.5-.5-2.5-2-4.5-4.5-5.5 3-.3 5.5-2 7-4.5z" />
              </svg>

              {/* Floating micro particles */}
              <div
                className="absolute bottom-1.5 w-1.5 h-1.5 rounded-full bg-[#59dbc3] blur-[0.5px] animate-bounce" />
              <div
                className="absolute top-2 right-2 w-1 h-1 rounded-full bg-[#9ed498] animate-pulse" />
            </div>

            {/* Wax stamp drips/ears */}
            <div
              className="absolute -bottom-1 -right-0.5 w-4 h-4 rounded-full bg-[#b68a1f] shadow-sm border border-[#f2bf52]/20" />
            <div
              className="absolute -top-0.5 -left-1 w-3.5 h-3.5 rounded-full bg-[#b68a1f] shadow-sm border border-[#f2bf52]/20" />
          </div>
        </div>

        {/* Title & Lore Subtext */}
        <div className="text-center px-1 mt-1 mb-3">
          <span
            className="text-[10px] font-bold text-[#f2bf52] uppercase tracking-[0.2em] block mb-0.5 font-sans">
            Occult Botanica Rite
          </span>
          <h2
            id="rescue-modal-title"
            className="text-2xl sm:text-[26px] font-display font-semibold tracking-normal text-[#e9e2cc] drop-shadow-sm"
          >
            Second Blossom Rescue?
          </h2>

          <div className="flex items-center justify-center gap-1.5 my-1.5 text-[#f2bf52]/70">
            <span className="h-[1px] w-6 bg-[#f2bf52]/40" />
            {/* Sparkle icon */}
            <svg className="w-3.5 h-3.5 text-[#59dbc3]" viewBox="0 0 24 24" fill="currentColor"
                 aria-hidden="true">
              <path d="M12 2L9.5 9.5 2 12l7.5 2.5L12 22l2.5-7.5L22 12l-7.5-2.5z" />
            </svg>
            <span className="h-[1px] w-6 bg-[#f2bf52]/40" />
          </div>

        </div>

        {/* Boon Specification Pills */}
        <div className="w-full grid grid-cols-3 gap-1.5 mb-5 px-1">
          <div
            className="bg-[#222012]/80 border border-[#41493f]/30 rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-sm">
            {/* Leaf/Vitality Icon */}
            <svg className="w-[18px] h-[18px] text-[#9ed498]" viewBox="0 0 24 24"
                 fill="currentColor" aria-hidden="true">
              <path
                d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.75C6 7.6 4 10 4 10s2-1 4.5-1.5c4-1 8.5-.5 8.5-.5z" />
            </svg>
            <span className="text-[11px] text-[#e9e2cc] font-bold mt-0.5">50% HP</span>
            <span className="text-[9px] text-[#c1c9bc] uppercase font-semibold tracking-wider">Quick Bloom</span>
          </div>

          <div
            className="bg-[#222012]/80 border border-[#41493f]/30 rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-sm">
            {/* Shield Icon */}
            <svg className="w-[18px] h-[18px] text-[#59dbc3]" viewBox="0 0 24 24"
                 fill="currentColor" aria-hidden="true">
              <path
                d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 2.18l7 3.12v4.7c0 4.54-3.08 8.79-7 9.9-3.92-1.11-7-5.36-7-9.9V6.3l7-3.12z" />
            </svg>
            <span className="text-[11px] text-[#e9e2cc] font-bold mt-0.5">3.0s Briar</span>
            <span className="text-[9px] text-[#c1c9bc] uppercase font-semibold tracking-wider">Aegis Aura</span>
          </div>

          <div
            className="bg-[#222012]/80 border border-[#41493f]/30 rounded-xl p-2 flex flex-col items-center justify-center text-center shadow-sm">
            {/* Shockwave/Flare Icon */}
            <svg className="w-[18px] h-[18px] text-[#f2bf52]" viewBox="0 0 24 24"
                 fill="currentColor" aria-hidden="true">
              <path
                d="M12 2a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1zm0 16a1 1 0 0 1 1 1v2a1 1 0 0 1-2 0v-2a1 1 0 0 1 1-1zm10-7a1 1 0 0 1-1 1h-2a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1zM5 12a1 1 0 0 1-1 1H2a1 1 0 0 1 0-2h2a1 1 0 0 1 1 1zm14.07-7.07a1 1 0 0 1 0 1.41l-1.42 1.42a1 1 0 1 1-1.41-1.42l1.41-1.41a1 1 0 0 1 1.42 0zM7.76 16.24a1 1 0 0 1 0 1.42l-1.42 1.41a1 1 0 0 1-1.41-1.41l1.41-1.42a1 1 0 0 1 1.42 0zm11.31 11.31a1 1 0 0 1-1.41 0l-1.42-1.41a1 1 0 0 1 1.41-1.42l1.42 1.41a1 1 0 0 1 0 1.42zM6.34 7.76a1 1 0 0 1-1.41 0L3.51 6.34a1 1 0 0 1 1.42-1.41l1.41 1.41a1 1 0 0 1 0 1.42zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10z" />
            </svg>
            <span className="text-[11px] text-[#e9e2cc] font-bold mt-0.5">Shockwave</span>
            <span className="text-[9px] text-[#c1c9bc] uppercase font-semibold tracking-wider">Swarm Purge</span>
          </div>
        </div>

        {/* ACTION BUTTONS: Thumb-Zone Optimized */}
        <div className="w-full flex flex-col gap-2.5">
          {/* Action 1: Rewarded Ad Revive */}
          {canWatchAd && (
            <button
              type="button"
              disabled={isAdLoading}
              onClick={onWatchAdRevive}
              className="w-full  btn-herbarium-lichen px-4 py-2.5 flex items-center  text-left group"
            >
              <div className="flex items-center gap-3 min-w-0 justify-between">
                <div
                  className="w-10 h-10 rounded-lg bg-[#101F12]/15 flex items-center justify-center shrink-0">
                  {/* Smart display / video icon */}
                  <svg className="w-6 h-6 text-[#101F12]" viewBox="0 0 24 24" fill="currentColor"
                       aria-hidden="true">
                    <path
                      d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zm-10.5-2.5l6-3.5-6-3.5v7z" />
                  </svg>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-bold text-[#101F12] truncate leading-tight">
                      {isAdLoading ? 'Loading Rewarded Ad...' : 'Revive with Ad'}
                    </span>
                    <span
                      className="bg-[#101F12] text-[#EDE6D0] text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                      Free
                    </span>
                  </div>
                  <span className="text-xs text-[#1E3A23] truncate">
                    50% HP + Briar Blossom Ward
                  </span>
                </div>
              </div>

              {/* Arrow forward */}
              <svg
                className="w-5 h-5 text-[#101F12] shrink-0 group-hover:translate-x-0.5 transition-transform"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </button>
          )}

          {/* Action 2: Pollen Coin Revive - Only shown if player has coins in vault */}
          {coins > 0 && (
            <button
              type="button"
              disabled={!canAffordCoins || isAdLoading}
              onClick={onSpendCoinsRevive}
              className="w-full btn-herbarium-primary px-4 py-2.5 flex items-center justify-between text-left group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-10 h-10 rounded-lg bg-[#201A09]/15 flex items-center justify-center shrink-0">
                  {/* Savings / coin purse icon */}
                  <svg className="w-6 h-6 text-[#201A09]" viewBox="0 0 24 24" fill="currentColor"
                       aria-hidden="true">
                    <circle cx="12" cy="12" r="9" />
                    <path
                      d="M12 7v10M15 9.5a2.5 2.5 0 0 0-5 0c0 2.5 5 1.5 5 4a2.5 2.5 0 0 1-5 0"
                      stroke="#E8B64A"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </svg>
                </div>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-bold text-[#201A09] truncate leading-tight">
                      Pay 150 Coins
                    </span>
                  </div>
                  <span className="text-xs text-[#201A09]/80 flex items-center gap-1 truncate">
                    <span>Vault: {coins.toLocaleString()} Coins</span>
                    {canAffordCoins && (
                      <svg className="w-3.5 h-3.5 text-[#201A09]" viewBox="0 0 24 24"
                           fill="currentColor" aria-hidden="true">
                        <path
                          d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                      </svg>
                    )}
                  </span>
                </div>
              </div>

              <div
                className="flex items-center gap-1 text-[#EDE6D0] shrink-0 text-xs bg-[#201A09] px-2.5 py-1 rounded-full font-bold shadow-sm">
                <svg className="w-3.5 h-3.5 text-[#E8B64A]" viewBox="0 0 24 24" fill="currentColor"
                     aria-hidden="true">
                  <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="2" />
                  <path d="M12 7v10M14 9.5a2 2 0 0 0-4 0c0 2 4 1.5 4 3.5a2 2 0 0 1-4 0"
                        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" fill="none" />
                </svg>
                <span>150</span>
              </div>
            </button>
          )}

          {/* Action 3: Decline & Summary */}
          <button
            type="button"
            disabled={isAdLoading}
            onClick={onDeclineRevive}
            className="w-full btn-herbarium-danger px-4 py-2.5 flex items-center justify-between text-left group mt-1"
          >
            <div className="flex items-center gap-2">
              {/* Skull / Accept Perish Icon */}
              <svg className="w-4 h-4 text-[#8E2B3A] shrink-0" viewBox="0 0 24 24" fill="currentColor"
                   aria-hidden="true">
                <path
                  d="M12 2a9 9 0 0 0-9 9c0 2.87 1.35 5.43 3.44 7.08V20a2 2 0 0 0 2 2h7.12a2 2 0 0 0 2-2v-1.92A9.002 9.002 0 0 0 21 11a9 9 0 0 0-9-9zm-3.5 11a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm7 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
              </svg>
              <span className="text-xs font-semibold tracking-wide">
                Accept Perish &amp; View Summary
              </span>
            </div>

            {/* Subtle end indicator arrow to balance space-between layout */}
            <svg
              className="w-4 h-4 text-[#8E2B3A]/70 shrink-0 group-hover:translate-x-0.5 transition-transform"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        </div>
    </div>
  );
}
