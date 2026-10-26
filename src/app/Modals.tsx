/**
 * Game Shell Modals: Loadout & Store, 3-Card Level-Up Draft, Rescue Revive, Pause & Summary
 * Layer 7 (app): Styled in carved oak (#3B2A26), cream parchment (#FFFDF0), dark plum (#2D1E2F),
 * and pastel botanical accents without backdrop-filter over the active canvas.
 */

import React, { useState } from 'react';
import {
  CARDS,
  CURSES,
  PERSONAS,
  POWER_UPS,
  PROFESSIONS,
  STYLE_RANKS,
  THEME_PACKS,
  TRINKETS,
  WEAPONS,
} from '../content/data/catalog';
import type { PowerUpId, ProfessionId } from '../content/schema/types';
import type { DraftOfferItem } from '../sim/systems/cardDraft';
import { getDailyStreakHighlight, type SaveDataV1 } from '../meta/SaveManager';
import type {
  DevStubAdOutcomeMode,
  DevStubStorageMode,
  YtSdkDiagnosticsState,
} from '../platform/ports/PlatformFacade';
import {
  CATALOG_SPRITE_PROMPTS,
  getSpritePortraitDataUrl,
  resolveHeroSpriteKey,
  type SpriteKey,
} from '../view/SpriteAtlas';
import { CoinIcon, PowerUpAbilityIcon, SeedGemIcon } from './SvgIcons';
import { getTarotMetadata, TarotIllustrationSvg } from './TarotCardArt';

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

export function CardDraftModal({
  level,
  offers,
  freeRerollAvailable,
  canAdReroll,
  coins,
  onSelectOffer,
  onRerollFree,
  onRerollAd,
  onRerollCoins,
  onSkip,
  onOpenDebugCards,
}: {
  level: number;
  offers: DraftOfferItem[];
  freeRerollAvailable: boolean;
  canAdReroll: boolean;
  coins: number;
  onSelectOffer: (offerId: string) => void;
  onRerollFree: () => void;
  onRerollAd: () => void;
  onRerollCoins: () => void;
  onSkip: () => void;
  onOpenDebugCards?: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-3 sm:p-4 bg-[#140E16]/85 pointer-events-auto overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="draft-modal-title"
    >
      <div className="w-full max-w-4xl rounded-2xl bg-[#2B1F2D] border-4 border-[#2D1E2F] shadow-2xl p-4 sm:p-6 text-[#FFFDF0]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-[#FFFDF0]/15">
          <div>
            <p className="text-xs font-semibold tracking-wider text-[#A8E6CF]">
              LEVEL {level} REACHED · DRAW ONE BOTANICAL ARCANA
            </p>
            <h2 id="draft-modal-title" className="text-2xl md:text-3xl font-display font-bold text-[#FFFDF0]">
              Botanical Tarot Draft
            </h2>
          </div>
          <div className="flex items-center gap-3 text-sm font-mono-tabular text-[#FDFFB6]">
            <span className="flex items-center gap-1.5">
              <CoinIcon />
              {coins}
            </span>
          </div>
        </div>

        {/* 3 Antique Tarot Cards (Mobile horizontal sliding snap row + Desktop 3-column grid) */}
        <div
          data-testid="tarot-cards-sliding-row"
          className="flex md:grid md:grid-cols-3 overflow-x-auto md:overflow-visible snap-x snap-mandatory gap-3.5 pb-2 mb-4 -mx-1 px-1"
        >
          {offers.map((offer, idx) => {
            const tarotMeta = getTarotMetadata(offer.targetId);
            const outerFrameStyles =
              offer.rarity === 'legendary'
                ? 'border-[#FBBF24] bg-gradient-to-b from-[#FFFDF0] via-[#FEF9E7] to-[#F9EBB2] shadow-[0_8px_24px_rgba(251,191,36,0.28)]'
                : offer.rarity === 'rare'
                  ? 'border-[#A0C4FF] bg-gradient-to-b from-[#FFFDF0] via-[#F4F8FF] to-[#E5EEFF] shadow-[0_8px_20px_rgba(160,196,255,0.2)]'
                  : offer.rarity === 'uncommon'
                    ? 'border-[#88D49E] bg-gradient-to-b from-[#FFFDF0] via-[#F4FBF7] to-[#E6F5EC]'
                    : 'border-[#C4B5A6] bg-gradient-to-b from-[#FFFDF0] via-[#FAF5E8] to-[#EFE6D5]';

            const gemColor =
              offer.rarity === 'legendary'
                ? '#FBBF24'
                : offer.rarity === 'rare'
                  ? '#60A5FA'
                  : offer.rarity === 'uncommon'
                    ? '#34D399'
                    : '#A8A29E';

            return (
              <button
                key={offer.offerId}
                type="button"
                data-testid={`tarot-card-offer-${idx}`}
                onClick={() => onSelectOffer(offer.offerId)}
                className={`w-[256px] max-w-[75vw] sm:w-[270px] md:w-auto md:max-w-none shrink-0 snap-center group relative text-left rounded-2xl text-[#2D1E2F] border-4 ${outerFrameStyles} p-2.5 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1.5 hover:shadow-2xl active:translate-y-0 focus-visible:outline-2 focus-visible:outline-[#FDFFB6]`}
              >
                {/* Inner Vintage Ink Tarot Border */}
                <div className="w-full h-full rounded-xl border-2 border-[#2D1E2F] p-2.5 flex flex-col justify-between bg-[#FFFDF0]/75">
                  <div>
                    {/* Top Roman Numeral Cartouche & Rarity Gem */}
                    <div className="flex items-center justify-between gap-1 pb-1.5 mb-2 border-b-2 border-[#2D1E2F]/20">
                      <span className="px-2 py-0.5 rounded bg-[#2D1E2F] text-[#FDFFB6] font-display font-bold text-[11px] tracking-widest uppercase">
                        {tarotMeta.numeral}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rotate-45 border border-[#2D1E2F] inline-block"
                          style={{ backgroundColor: gemColor }}
                        />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#5C4760]">
                          {offer.subtitle}
                        </span>
                      </div>
                      <span className="font-mono-tabular text-xs font-bold text-[#5C4760]">
                        [{idx + 1}]
                      </span>
                    </div>

                    {/* Central Arched Old-World Tarot Illustration */}
                    <div className="w-32 sm:w-36 mx-auto mb-2 transition-transform duration-200 group-hover:scale-[1.03]">
                      <TarotIllustrationSvg
                        targetId={offer.targetId}
                        rarity={offer.rarity}
                        iconColor={offer.iconColor}
                      />
                    </div>

                    {/* Vintage Ribbon Scroll Title Banner */}
                    <div className="relative bg-[#2D1E2F] text-[#FFFDF0] rounded-lg px-2.5 py-1.5 text-center mb-2 border-2 border-[#8C5A3C] shadow-sm">
                      <div className="text-[10px] font-bold tracking-widest uppercase text-[#FDFFB6]/90">
                        {tarotMeta.arcanaTitle}
                      </div>
                      <h3 className="text-base font-display font-bold text-[#FFFDF0] leading-tight">
                        {offer.title}
                      </h3>
                    </div>

                    {/* Parchment Scripture Effect Box */}
                    <p className="text-xs font-semibold text-[#3D2B40] leading-snug text-center px-1 mb-2">
                      {offer.description}
                    </p>
                  </div>

                  {/* Bottom Esoteric Synergy & Level Footer */}
                  <div className="pt-2 border-t-2 border-[#2D1E2F]/15 flex items-center justify-between text-[11px] text-[#5C4760] font-bold">
                    <span className="uppercase tracking-wider">{offer.tags.join(' · ')}</span>
                    <span className="font-mono-tabular px-1.5 py-0.5 rounded bg-[#2D1E2F]/10 text-[#2D1E2F]">
                      Lv {offer.currentLevel} → {offer.nextLevel}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Reroll & Skip Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {freeRerollAvailable ? (
              <button
                type="button"
                onClick={onRerollFree}
                className="px-4 py-2 rounded-lg bg-[#A8E6CF] text-[#2D1E2F] font-bold text-sm border-2 border-[#2D1E2F] hover:bg-[#88D49E] transition-colors whitespace-nowrap shrink-0"
              >
                Free Reroll (1 Left)
              </button>
            ) : canAdReroll ? (
              <button
                type="button"
                onClick={onRerollAd}
                className="px-4 py-2 rounded-lg bg-[#FDFFB6] text-[#2D1E2F] font-bold text-sm border-2 border-[#2D1E2F] hover:bg-[#fbbf24] transition-colors whitespace-nowrap shrink-0"
              >
                Watch Ad to Reroll
              </button>
            ) : null}

            <button
              type="button"
              disabled={coins < 40}
              onClick={onRerollCoins}
              className="px-4 py-2 rounded-lg bg-[#3B2B3E] text-[#FFFDF0] font-semibold text-sm border-2 border-[#FFFDF0]/20 hover:border-[#FDFFB6] disabled:opacity-40 transition-colors whitespace-nowrap shrink-0"
            >
              Reroll (40 Coins)
            </button>
          </div>

          <div className="flex items-center gap-2">
            {onOpenDebugCards && (
              <button
                type="button"
                onClick={onOpenDebugCards}
                className="px-3.5 py-2 rounded-lg bg-[#3B2B3E] text-[#FDFFB6] font-bold text-sm border-2 border-[#FDFFB6]/40 hover:bg-[#4B374E] transition-colors whitespace-nowrap shrink-0"
              >
                Debug Cards
              </button>
            )}
            <button
              type="button"
              onClick={onSkip}
              className="px-4 py-2 rounded-lg bg-[#3B2B3E] text-[#A8E6CF] font-semibold text-sm border-2 border-[#A8E6CF]/40 hover:bg-[#4B374E] transition-colors whitespace-nowrap shrink-0"
            >
              Skip (+10 HP · +100 Score)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function RescueReviveModal({
  coins,
  canWatchAd,
  isAdLoading,
  onWatchAdRevive,
  onSpendCoinsRevive,
  onDeclineRevive,
}: {
  coins: number;
  canWatchAd: boolean;
  isAdLoading: boolean;
  onWatchAdRevive: () => void;
  onSpendCoinsRevive: () => void;
  onDeclineRevive: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#140E16]/85 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="rescue-modal-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-[#2B1F2D] border-4 border-[#FFAAA6] p-6 text-center text-[#FFFDF0] shadow-2xl">
        <p className="text-xs font-bold tracking-wider text-[#FFAAA6] mb-1">
          GARDEN GUARDIAN FALLEN
        </p>
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

export function PauseModal({
  weapons,
  ownedCards,
  settings,
  onUpdateSettings,
  onResume,
  onRestart,
  onEndRunAndSummary,
  onReturnToTitle,
  onOpenDebugCards,
}: {
  weapons: ReadonlyArray<{ id: string; level: number; evolved: boolean }>;
  ownedCards: Readonly<Record<string, number>>;
  settings: SaveDataV1['settings'];
  onUpdateSettings: (partial: Partial<SaveDataV1['settings']>) => void;
  onResume: () => void;
  onRestart: () => void;
  onEndRunAndSummary: () => void;
  onReturnToTitle: () => void;
  onOpenDebugCards?: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#140E16]/85 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pause-modal-title"
    >
      <div className="w-full max-w-lg rounded-2xl bg-[#2B1F2D] border-4 border-[#2D1E2F] p-6 text-[#FFFDF0] shadow-2xl">
        <div className="flex items-center justify-between gap-2 mb-1">
          <h2 id="pause-modal-title" className="text-2xl font-display font-bold">
            Run Paused
          </h2>
          {onOpenDebugCards && (
            <button
              type="button"
              onClick={onOpenDebugCards}
              className="px-3 py-1.5 rounded-xl bg-[#3B2B3E] text-[#FDFFB6] font-bold text-xs border-2 border-[#FDFFB6]/50 hover:bg-[#4D3851] transition-colors whitespace-nowrap shrink-0"
            >
              Debug Cards
            </button>
          )}
        </div>
        <p className="text-xs text-[#A8E6CF] mb-4">
          Your mid-run progress is automatically checkpointed.
        </p>

        {/* Equipped Weapons Summary */}
        <div className="mb-4 p-3 rounded-xl bg-[#1E1520] border border-[#FFFDF0]/10">
          <p className="text-xs font-bold text-[#FDFFB6] mb-2">ACTIVE WEAPONS</p>
          <div className="flex flex-wrap gap-3 text-sm">
            {weapons.map((w) => {
              const def = WEAPONS[w.id];
              return (
                <div key={w.id} className="font-semibold text-[#FFFDF0]">
                  {w.evolved ? def?.evolvedName : def?.name}{' '}
                  <span className="font-mono-tabular text-xs text-[#A8E6CF]">
                    Lv {w.level}
                  </span>
                </div>
              );
            })}
          </div>
          {Object.keys(ownedCards).length > 0 && (
            <div className="mt-2 pt-2 border-t border-[#FFFDF0]/10 text-xs text-[#FFFDF0]/80">
              {Object.entries(ownedCards)
                .map(([cid, lv]) => {
                  const c = CARDS.find((item) => item.id === cid);
                  if (c?.evolvedName && lv > c.maxLevel) {
                    return `${c.evolvedName} (Evo)`;
                  }
                  return `${c?.name ?? cid} Lv ${lv}`;
                })
                .join(' · ')}
            </div>
          )}
        </div>

        {/* Settings Controls */}
        <div className="space-y-3 mb-6 text-sm">
          <label className="flex items-center justify-between gap-4">
            <span>Music Volume</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.musicVolume}
              onChange={(e) => onUpdateSettings({ musicVolume: parseFloat(e.target.value) })}
              className="w-36 accent-[#A8E6CF]"
            />
          </label>
          <label className="flex items-center justify-between gap-4">
            <span>SFX Volume</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={settings.sfxVolume}
              onChange={(e) => onUpdateSettings({ sfxVolume: parseFloat(e.target.value) })}
              className="w-36 accent-[#A8E6CF]"
            />
          </label>
          <label className="flex items-center justify-between gap-4">
            <span>Botanical Bloom / Glow</span>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              aria-label="Botanical Bloom / Glow"
              value={settings.bloomIntensity ?? 1.0}
              onChange={(e) => onUpdateSettings({ bloomIntensity: parseFloat(e.target.value) })}
              className="w-36 accent-[#A8E6CF]"
            />
          </label>
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <span>Reduced Motion & Screen Shake</span>
            <input
              type="checkbox"
              checked={settings.reducedMotion}
              onChange={(e) => onUpdateSettings({ reducedMotion: e.target.checked })}
              className="w-4 h-4 accent-[#A8E6CF]"
            />
          </label>
          <label className="flex items-center justify-between gap-4 cursor-pointer">
            <span>Floating Damage Numbers</span>
            <input
              type="checkbox"
              checked={settings.showDamageNumbers}
              onChange={(e) => onUpdateSettings({ showDamageNumbers: e.target.checked })}
              className="w-4 h-4 accent-[#A8E6CF]"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={onResume}
            className="py-2.5 px-3 rounded-xl bg-[#A8E6CF] text-[#2D1E2F] font-bold text-xs sm:text-sm border-2 border-[#2D1E2F] hover:bg-[#88D49E] transition-colors whitespace-nowrap"
          >
            Resume Run
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="py-2.5 px-3 rounded-xl bg-[#FDFFB6] text-[#2D1E2F] font-bold text-xs sm:text-sm border-2 border-[#2D1E2F] hover:bg-[#fbbf24] transition-colors whitespace-nowrap"
          >
            Restart
          </button>
          <button
            type="button"
            data-testid="pause-end-run-btn"
            onClick={onEndRunAndSummary}
            className="py-2.5 px-3 rounded-xl bg-[#FFAAA6] text-[#2D1E2F] font-bold text-xs sm:text-sm border-2 border-[#2D1E2F] hover:bg-[#f88b86] transition-colors whitespace-nowrap"
          >
            End Run
          </button>
          <button
            type="button"
            onClick={onReturnToTitle}
            className="py-2.5 px-3 rounded-xl bg-[#3B2B3E] text-[#FFFDF0] font-semibold text-xs sm:text-sm border-2 border-[#FFFDF0]/20 hover:border-[#FFFDF0]/50 transition-colors whitespace-nowrap"
          >
            Title Screen
          </button>
        </div>
      </div>
    </div>
  );
}

export function RunSummaryModal({
  summary,
  canWatchDoubleAd,
  onWatchDoubleCoinsAd,
  onPlayAgain,
  onReturnToTitle,
}: {
  summary: RunSummarySnapshot;
  canWatchDoubleAd: boolean;
  onWatchDoubleCoinsAd: () => void;
  onPlayAgain: () => void;
  onReturnToTitle: () => void;
}) {
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

export function LoadoutAndStoreModal({
  saveData,
  initialTab,
  ytDiagnostics,
  lastSyncSource = 'default',
  statusBannerText = null,
  isAdLoading = false,
  onClose,
  onSelectLoadout,
  onUnlockProfession,
  onUnlockTrinket,
  onUnlockCurse,
  onWatchPersonaPipAd,
  onWatchSanctuaryRewardAd,
  onIncrementPersonaAdPip,
  onIncrementAllPersonaAdPips,
  onSavePlayerStateNow,
  onReloadAndReconcileSave,
  onSetDevAdOutcomeMode,
  onSetDevCloudStorageMode,
  onSimulateYtAudioToggle,
  onSyncScoreNow,
  onSpawnBestiaryEnemy,
  onClaimQuest,
  onAddDebugGold,
  onStartRun,
}: {
  saveData: SaveDataV1;
  initialTab: 'loadout' | 'store' | 'quests' | 'bestiary';
  ytDiagnostics?: YtSdkDiagnosticsState;
  lastSyncSource?: 'cloud' | 'local' | 'merged' | 'default';
  statusBannerText?: string | null;
  isAdLoading?: boolean;
  onClose: () => void;
  onSelectLoadout: (partial: Partial<SaveDataV1['loadout']>) => void;
  onUnlockProfession: (profId: ProfessionId, cost: number) => void;
  onUnlockTrinket: (trinketId: string, cost: number) => void;
  onUnlockCurse: (curseId: string, cost: number) => void;
  onWatchPersonaPipAd: (personaId: string) => void;
  onWatchSanctuaryRewardAd?: () => void;
  onIncrementPersonaAdPip?: (personaId: string) => void;
  onIncrementAllPersonaAdPips?: () => void;
  onSavePlayerStateNow?: () => void;
  onReloadAndReconcileSave?: () => void;
  onSetDevAdOutcomeMode?: (mode: DevStubAdOutcomeMode) => void;
  onSetDevCloudStorageMode?: (mode: DevStubStorageMode) => void;
  onSimulateYtAudioToggle?: () => void;
  onSyncScoreNow?: () => void;
  onSpawnBestiaryEnemy?: (
    bestiaryKey: string,
    mode: 'infinite_hp' | 'swarm' | 'respawn_on_death'
  ) => void;
  onClaimQuest: (questId: string) => void;
  onAddDebugGold: (amount: number) => void;
  onStartRun: () => void;
}) {
  const [tab, setTab] = useState<'loadout' | 'store' | 'quests' | 'bestiary'>(initialTab);
  const [activeDebugEnemyKey, setActiveDebugEnemyKey] = useState<string | null>(null);
  const { loadout, unlocks, currencies, retention } = saveData;

  const renderYouTubeSdkPanel = () => {
    if (!ytDiagnostics) return null;
    const adMode = ytDiagnostics.adOutcomeMode;
    const cloudMode = ytDiagnostics.cloudStorageMode;
    return (
      <div
        data-testid="yt-sdk-panel"
        className="p-3.5 rounded-xl bg-[#1E1520] border-2 border-[#A8E6CF]/45 space-y-3"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#A8E6CF] uppercase tracking-wider">
                YouTube Playables SDK · Ad Rewards, Cloud Save & Dev Stubs
              </span>
              <span
                data-testid="yt-sdk-env-badge"
                className={`px-2 py-0.5 rounded text-[10px] font-mono-tabular font-bold ${
                  ytDiagnostics.isPlayablesEnv
                    ? 'bg-[#A8E6CF] text-[#2D1E2F]'
                    : 'bg-[#DED2F9] text-[#2D1E2F]'
                }`}
              >
                {ytDiagnostics.isPlayablesEnv
                  ? `YT Host (${ytDiagnostics.sdkVersion})`
                  : `Dev Mode Stub (${ytDiagnostics.sdkVersion})`}
              </span>
            </div>
            <div className="text-[11px] text-[#FFFDF0]/75 mt-0.5 font-mono-tabular">
              Ads Today: {currencies.adWatchCountToday}/6 · Ad Tokens: {currencies.adTokensToday} · Cloud Payload: {ytDiagnostics.lastSavedCloudBytes} / 16,384 B · Sync: {lastSyncSource.toUpperCase()}
              {ytDiagnostics.lastSubmittedScore !== null &&
                ` · Synced Score: ${ytDiagnostics.lastSubmittedScore}`}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {onWatchSanctuaryRewardAd && (
              <button
                type="button"
                data-testid="watch-sanctuary-reward-ad"
                disabled={isAdLoading}
                onClick={onWatchSanctuaryRewardAd}
                className="px-3 py-1.5 rounded-lg bg-[#FDFFB6] text-[#2D1E2F] text-xs font-extrabold border-2 border-[#2D1E2F] hover:bg-[#fbbf24] disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {isAdLoading ? 'Playing Ad...' : 'Watch Ad (+120 Coins & +2 Seeds)'}
              </button>
            )}
            {onSavePlayerStateNow && (
              <button
                type="button"
                data-testid="yt-sdk-save-now-btn"
                onClick={onSavePlayerStateNow}
                className="px-2.5 py-1.5 rounded-lg bg-[#A8E6CF] text-[#2D1E2F] text-xs font-extrabold border-2 border-[#2D1E2F] hover:bg-[#88D49E] transition-colors whitespace-nowrap"
              >
                Save Player State
              </button>
            )}
            {onReloadAndReconcileSave && (
              <button
                type="button"
                data-testid="yt-sdk-load-cloud-btn"
                onClick={onReloadAndReconcileSave}
                className="px-2.5 py-1.5 rounded-lg bg-[#3B2B3E] text-[#FFFDF0] text-xs font-bold border border-[#FFFDF0]/25 hover:bg-[#4D3851] transition-colors whitespace-nowrap"
              >
                Load & Reconcile Save
              </button>
            )}
          </div>
        </div>

        {/* Dev Mode Stub Controls */}
        <div className="pt-2 border-t border-[#FFFDF0]/10 flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[#DED2F9] font-bold">Ad Stub Mode:</span>
            {(
              [
                ['grant', 'Grant Reward', 'yt-stub-ad-grant'],
                ['skip', 'Skip Ad', 'yt-stub-ad-skip'],
                ['error', 'Ad Error', 'yt-stub-ad-error'],
              ] as const
            ).map(([mode, label, testId]) => (
              <button
                key={mode}
                type="button"
                data-testid={testId}
                onClick={() => onSetDevAdOutcomeMode?.(mode)}
                className={`px-2 py-0.5 rounded font-bold transition-colors whitespace-nowrap ${
                  adMode === mode
                    ? 'bg-[#DED2F9] text-[#2D1E2F]'
                    : 'bg-[#2B1F2D] text-[#FFFDF0]/75 hover:text-[#FFFDF0]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[#A8E6CF] font-bold">Cloud Save Stub:</span>
            {(
              [
                ['synced', 'Cloud Synced', 'yt-stub-cloud-synced'],
                ['offline', 'Offline (Fallback)', 'yt-stub-cloud-offline'],
              ] as const
            ).map(([mode, label, testId]) => (
              <button
                key={mode}
                type="button"
                data-testid={testId}
                onClick={() => onSetDevCloudStorageMode?.(mode)}
                className={`px-2 py-0.5 rounded font-bold transition-colors whitespace-nowrap ${
                  cloudMode === mode
                    ? 'bg-[#A8E6CF] text-[#2D1E2F]'
                    : 'bg-[#2B1F2D] text-[#FFFDF0]/75 hover:text-[#FFFDF0]'
                }`}
              >
                {label}
              </button>
            ))}
            {onSimulateYtAudioToggle && (
              <button
                type="button"
                data-testid="yt-stub-audio-toggle"
                onClick={onSimulateYtAudioToggle}
                className="px-2 py-0.5 rounded bg-[#2B1F2D] text-[#FDFFB6] font-bold hover:bg-[#3B2B3E] whitespace-nowrap"
              >
                YT Audio: {ytDiagnostics.simulatedAudioEnabled ? 'ON' : 'MUTED'}
              </button>
            )}
            {onSyncScoreNow && (
              <button
                type="button"
                data-testid="yt-stub-sync-score"
                onClick={onSyncScoreNow}
                className="px-2 py-0.5 rounded bg-[#2B1F2D] text-[#A8E6CF] font-bold hover:bg-[#3B2B3E] whitespace-nowrap"
              >
                Send Score
              </button>
            )}
          </div>
        </div>

        {statusBannerText && (
          <div
            data-testid="yt-sdk-status-banner"
            className="px-3 py-1.5 rounded-lg bg-[#2B1F2D] border border-[#FDFFB6]/50 text-[11px] font-mono-tabular font-bold text-[#FDFFB6]"
          >
            {statusBannerText}
          </div>
        )}
      </div>
    );
  };

  const renderHeroPersonasSection = (sectionNumberLabel?: string) => (
    <div className="pt-2 border-t border-[#FFFDF0]/10">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <h3 className="text-xs font-bold tracking-wider text-[#DED2F9]">
          {sectionNumberLabel ? `${sectionNumberLabel} ` : ''}HERO PERSONAS (COSMETIC TRAVELERS)
        </h3>
        {onIncrementAllPersonaAdPips && (
          <button
            type="button"
            data-testid="debug-persona-ad-all"
            onClick={onIncrementAllPersonaAdPips}
            className="px-2.5 py-1 rounded-lg bg-[#DED2F9] text-[#2D1E2F] text-[11px] font-extrabold border-2 border-[#2D1E2F] hover:bg-[#c4b5fd] transition-colors whitespace-nowrap"
          >
            +1 Watched Ad (All Personas)
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PERSONAS.map((persona) => {
          const unlocked = unlocks.personas.includes(persona.id);
          const selected = loadout.personaId === persona.id;
          const pips = unlocks.personaAdPips[persona.id] ?? 0;
          const cloakHex = `#${persona.cloakColor.toString(16).padStart(6, '0')}`;
          const accentHex = `#${persona.accentColor.toString(16).padStart(6, '0')}`;
          return (
            <div
              key={persona.id}
              data-testid={`persona-card-${persona.id}`}
              className={`p-3.5 rounded-xl border-2 flex items-center justify-between gap-3 ${
                selected
                  ? 'bg-[#36493E] border-[#A8E6CF]'
                  : 'bg-[#1E1520] border-[#FFFDF0]/15'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative w-9 h-9 rounded-full border-2 border-[#2D1E2F] shrink-0 flex items-center justify-center shadow-inner" style={{ backgroundColor: cloakHex }}>
                  <span className="w-3.5 h-3.5 rounded-full border border-[#2D1E2F]" style={{ backgroundColor: accentHex }} />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm truncate">{persona.name}</div>
                  <div className="text-xs text-[#FFFDF0]/70 truncate">{persona.subtitle}</div>
                  {!unlocked && persona.adPipsRequired > 0 && (
                    <div className="text-[10px] font-mono-tabular text-[#DED2F9] mt-0.5">
                      Watched Ads: {pips} / {persona.adPipsRequired}
                    </div>
                  )}
                </div>
              </div>
              {unlocked ? (
                <button
                  type="button"
                  data-testid={`wear-persona-${persona.id}`}
                  onClick={() => onSelectLoadout({ personaId: persona.id })}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 ${
                    selected
                      ? 'bg-[#A8E6CF] text-[#2D1E2F]'
                      : 'bg-[#3B2B3E] text-[#FFFDF0] hover:bg-[#4D3851]'
                  }`}
                >
                  {selected ? 'Wearing' : 'Wear'}
                </button>
              ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    data-testid={`watch-persona-ad-${persona.id}`}
                    onClick={() => onWatchPersonaPipAd(persona.id)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#DED2F9] text-[#2D1E2F] text-xs font-bold hover:bg-[#c4b5fd] transition-colors whitespace-nowrap"
                  >
                    Watch Ad ({pips}/{persona.adPipsRequired})
                  </button>
                  {onIncrementPersonaAdPip && (
                    <button
                      type="button"
                      data-testid={`debug-persona-ad-${persona.id}`}
                      onClick={() => onIncrementPersonaAdPip(persona.id)}
                      className="px-2 py-1.5 rounded-lg bg-[#FDFFB6] text-[#2D1E2F] text-xs font-extrabold border border-[#2D1E2F] hover:bg-[#fbbf24] transition-colors whitespace-nowrap"
                      title="Increase watched ad count to unlock persona"
                    >
                      +1 Ad
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#140E16]/85 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sanctuary-modal-title"
    >
      <div className="w-full max-w-3xl max-h-[88vh] flex flex-col rounded-2xl bg-[#2B1F2D] border-4 border-[#2D1E2F] text-[#FFFDF0] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 py-4 bg-[#1E1520] border-b border-[#FFFDF0]/10">
          <div className="flex items-center gap-3">
            <h2 id="sanctuary-modal-title" className="text-xl font-display font-bold">
              Garden Sanctuary
            </h2>
            <div className="flex items-center gap-1 p-1 bg-[#2B1F2D] rounded-lg">
              {(['loadout', 'store', 'quests', 'bestiary'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  data-testid={`sanctuary-tab-${t}`}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1 rounded-md text-xs font-bold capitalize transition-colors whitespace-nowrap ${
                    tab === t
                      ? 'bg-[#A8E6CF] text-[#2D1E2F]'
                      : 'text-[#FFFDF0]/75 hover:text-[#FFFDF0]'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm font-mono-tabular">
            <span
              data-testid="store-coins-balance"
              className="flex items-center gap-1.5 text-[#FDFFB6]"
            >
              <CoinIcon />
              {currencies.coins}
            </span>
            <button
              type="button"
              data-testid="debug-add-gold-btn"
              onClick={() => onAddDebugGold(100)}
              className="px-2.5 py-1 rounded-lg bg-[#FDFFB6] text-[#2D1E2F] font-sans text-xs font-extrabold border-2 border-[#2D1E2F] hover:bg-[#fbbf24] active:translate-y-0.5 transition-all whitespace-nowrap shrink-0"
            >
              +100 Gold (Debug)
            </button>
            <span className="flex items-center gap-1.5 text-[#DED2F9]">
              <SeedGemIcon />
              {currencies.gems}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded-lg bg-[#3B2B3E] font-sans text-xs font-bold hover:bg-[#4E3952]"
            >
              Close
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {tab === 'loadout' && (
            <>
              {/* Profession Selection */}
              <div>
                <h3 className="text-xs font-bold tracking-wider text-[#A8E6CF] mb-2.5">
                  01. CHOOSE PROFESSION (PLAYSTYLE & DASH)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(Object.keys(PROFESSIONS) as ProfessionId[]).map((profId) => {
                    const prof = PROFESSIONS[profId]!;
                    const isUnlocked = unlocks.professions.includes(profId);
                    const isSelected = loadout.professionId === profId;
                    const spriteUrl = getSpritePortraitDataUrl(resolveHeroSpriteKey(profId));
                    return (
                      <div
                        key={profId}
                        className={`p-3.5 rounded-xl border-2 flex flex-col justify-between ${
                          isSelected
                            ? 'bg-[#36493E] border-[#A8E6CF]'
                            : 'bg-[#1E1520] border-[#FFFDF0]/15'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {spriteUrl && (
                            <img
                              src={spriteUrl}
                              alt={`${prof.name} sprite`}
                              referrerPolicy="no-referrer"
                              className="w-16 h-16 rounded-xl bg-[#2B1F2D] border-2 border-[#2D1E2F] shrink-0 object-contain p-1"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1 mb-1">
                              <span className="font-display font-bold text-base truncate">
                                {prof.name}
                              </span>
                              <span className="text-xs text-[#FDFFB6] shrink-0">
                                {prof.roleLabel}
                              </span>
                            </div>
                            <p className="text-xs text-[#FFFDF0]/80 mb-1.5">{prof.description}</p>
                            <p className="text-[11px] text-[#A8E6CF]">
                              Dash ({prof.dashName}): {prof.dashDescription}
                            </p>
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-[#FFFDF0]/10 flex items-center justify-between">
                          <span className="text-[11px] text-[#FFFDF0]/60">
                            Starts with {WEAPONS[prof.startingWeaponId]?.name}
                          </span>
                          {isUnlocked ? (
                            <button
                              type="button"
                              onClick={() =>
                                onSelectLoadout({
                                  professionId: profId,
                                  startingWeaponId: prof.startingWeaponId,
                                })
                              }
                              className={`px-3 py-1 rounded-lg text-xs font-bold whitespace-nowrap ${
                                isSelected
                                  ? 'bg-[#A8E6CF] text-[#2D1E2F]'
                                  : 'bg-[#3B2B3E] text-[#FFFDF0] hover:bg-[#4D3851]'
                              }`}
                            >
                              {isSelected ? 'Equipped' : 'Select'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={currencies.coins < prof.unlockCostCoins}
                              onClick={() => onUnlockProfession(profId, prof.unlockCostCoins)}
                              className="px-3 py-1 rounded-lg bg-[#FDFFB6] text-[#2D1E2F] text-xs font-bold disabled:opacity-40 whitespace-nowrap"
                            >
                              Unlock ({prof.unlockCostCoins} Coins)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {renderHeroPersonasSection('02.')}

              {renderYouTubeSdkPanel()}

              {/* Biome & Daily Seed Toggle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-[#FFFDF0]/10">
                <div>
                  <h3 className="text-xs font-bold tracking-wider text-[#A8E6CF] mb-2">
                    03. BIOME THEME PACK
                  </h3>
                  <div className="grid grid-cols-2 gap-2 min-w-0">
                    {(['garden', 'dungeon', 'sakura_grove', 'sunlit_oasis'] as const).map((bId) => {
                      const t = THEME_PACKS[bId];
                      const active = loadout.biomeId === bId;
                      return (
                        <button
                          key={bId}
                          type="button"
                          data-testid={`biome-pack-${bId}`}
                          onClick={() => onSelectLoadout({ biomeId: bId })}
                          className={`min-w-0 overflow-hidden p-2.5 rounded-xl border-2 text-left transition-colors ${
                            active
                              ? 'bg-[#36493E] border-[#A8E6CF]'
                              : 'bg-[#1E1520] border-[#FFFDF0]/15'
                          }`}
                        >
                          <div className="text-xs font-bold truncate">{t.name}</div>
                          <div className="text-[11px] text-[#FFFDF0]/70 truncate">
                            {t.subtitle}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-bold tracking-wider text-[#A8E6CF] mb-2">
                    04. RUN SEED MODE
                  </h3>
                  <button
                    type="button"
                    onClick={() =>
                      onSelectLoadout({ isDailySeedMode: !loadout.isDailySeedMode })
                    }
                    className={`w-full p-2.5 rounded-xl border-2 text-left transition-colors ${
                      loadout.isDailySeedMode
                        ? 'bg-[#3B2B3E] border-[#FDFFB6]'
                        : 'bg-[#1E1520] border-[#FFFDF0]/15'
                    }`}
                  >
                    <div className="text-xs font-bold flex items-center justify-between">
                      <span>Daily Seeded Challenge</span>
                      <span className="text-[#FDFFB6]">
                        {loadout.isDailySeedMode ? 'ACTIVE' : 'STANDARD'}
                      </span>
                    </div>
                    <div className="text-[11px] text-[#FFFDF0]/70">
                      Identical deterministic wave & card seed for all players today.
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}

          {tab === 'store' && (
            <div className="space-y-5">
              {renderYouTubeSdkPanel()}

              <div className="p-3.5 rounded-xl bg-[#1E1520] border-2 border-[#FDFFB6]/40 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold text-[#FDFFB6]">Store Debug Treasury</div>
                  <div className="text-[11px] text-[#FFFDF0]/75">
                    Add +100 Gold instantly to purchase and test any Relic, Curse, or Profession upgrade.
                  </div>
                </div>
                <button
                  type="button"
                  data-testid="store-debug-add-100-gold"
                  onClick={() => onAddDebugGold(100)}
                  className="px-3.5 py-1.5 rounded-lg bg-[#FDFFB6] text-[#2D1E2F] text-xs font-extrabold border-2 border-[#2D1E2F] hover:bg-[#fbbf24] active:translate-y-0.5 transition-all whitespace-nowrap shrink-0"
                >
                  +100 Gold
                </button>
              </div>

              {renderHeroPersonasSection()}

              <div>
                <h3 className="text-xs font-bold tracking-wider text-[#A8E6CF] mb-2.5">
                  TRINKETS (EQUIP UP TO 3 PASSIVE RELICS)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TRINKETS.map((trinket) => {
                    const unlocked = unlocks.trinkets.includes(trinket.id);
                    const equipped = loadout.trinketIds.includes(trinket.id);
                    return (
                      <div
                        key={trinket.id}
                        className="p-3.5 rounded-xl bg-[#1E1520] border border-[#FFFDF0]/15 flex flex-col justify-between"
                      >
                        <div>
                          <div className="font-bold text-sm text-[#FDFFB6]">{trinket.name}</div>
                          <p className="text-xs text-[#FFFDF0]/80 mt-1">{trinket.description}</p>
                        </div>
                        <div className="mt-3 flex justify-end">
                          {unlocked ? (
                            <button
                              type="button"
                              onClick={() => {
                                const next = equipped
                                  ? loadout.trinketIds.filter((id) => id !== trinket.id)
                                  : [...loadout.trinketIds, trinket.id].slice(-3);
                                onSelectLoadout({ trinketIds: next });
                              }}
                              className={`px-3 py-1 rounded-lg text-xs font-bold ${
                                equipped
                                  ? 'bg-[#A8E6CF] text-[#2D1E2F]'
                                  : 'bg-[#3B2B3E] text-[#FFFDF0]'
                              }`}
                            >
                              {equipped ? 'Equipped' : 'Equip'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={currencies.coins < trinket.costCoins}
                              onClick={() => onUnlockTrinket(trinket.id, trinket.costCoins)}
                              className="px-3 py-1 rounded-lg bg-[#FDFFB6] text-[#2D1E2F] text-xs font-bold disabled:opacity-40"
                            >
                              Buy ({trinket.costCoins} Coins)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold tracking-wider text-[#FFAAA6] mb-2.5">
                  CURSE SIGILS (DIFFICULTY & REWARD MULTIPLIERS)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {CURSES.map((curse) => {
                    const unlocked = unlocks.curses.includes(curse.id);
                    const active = loadout.curseIds.includes(curse.id);
                    return (
                      <div
                        key={curse.id}
                        className="p-3.5 rounded-xl bg-[#1E1520] border border-[#FFAAA6]/30 flex flex-col justify-between"
                      >
                        <div>
                          <div className="font-bold text-sm text-[#FFAAA6]">{curse.name}</div>
                          <p className="text-xs text-[#FFFDF0]/80 mt-1">{curse.description}</p>
                        </div>
                        <div className="mt-3 flex justify-end">
                          {unlocked ? (
                            <button
                              type="button"
                              onClick={() => {
                                const next = active
                                  ? loadout.curseIds.filter((id) => id !== curse.id)
                                  : [...loadout.curseIds, curse.id];
                                onSelectLoadout({ curseIds: next });
                              }}
                              className={`px-3 py-1 rounded-lg text-xs font-bold ${
                                active
                                  ? 'bg-[#FFAAA6] text-[#2D1E2F]'
                                  : 'bg-[#3B2B3E] text-[#FFFDF0]'
                              }`}
                            >
                              {active ? 'Active Curse' : 'Activate'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={currencies.coins < curse.costCoins}
                              onClick={() => onUnlockCurse(curse.id, curse.costCoins)}
                              className="px-3 py-1 rounded-lg bg-[#FDFFB6] text-[#2D1E2F] text-xs font-bold disabled:opacity-40"
                            >
                              Unlock ({curse.costCoins} Coins)
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {renderHeroPersonasSection()}
            </div>
          )}

          {tab === 'quests' && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold tracking-wider text-[#A8E6CF] mb-2">
                DAILY BOTANICAL COMMISSIONS
              </h3>
              {retention.dailyQuests.map((q) => {
                const done = q.progress >= q.target;
                return (
                  <div
                    key={q.id}
                    className="p-4 rounded-xl bg-[#1E1520] border border-[#FFFDF0]/15 flex items-center justify-between gap-4"
                  >
                    <div>
                      <div className="font-bold text-sm">{q.title}</div>
                      <div className="text-xs font-mono-tabular text-[#A8E6CF] mt-0.5">
                        Progress: {Math.min(q.progress, q.target)} / {q.target} · Reward: +{q.rewardCoins} Coins, +{q.rewardGems} Seeds
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={!done || q.claimed}
                      onClick={() => onClaimQuest(q.id)}
                      className="px-4 py-1.5 rounded-lg bg-[#FDFFB6] text-[#2D1E2F] font-bold text-xs disabled:opacity-40 whitespace-nowrap"
                    >
                      {q.claimed ? 'Claimed' : done ? 'Claim Reward' : 'In Progress'}
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {tab === 'bestiary' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xs font-bold tracking-wider text-[#A8E6CF] mb-1">
                  01. CHARACTER & ENEMY SPRITE CODEX (WITH ARENA DEBUG SPAWNER)
                </h3>
                <p className="text-xs text-[#FFFDF0]/75 mb-3">
                  Use the Debug controls near any enemy to spawn them on the arena with the hero with Infinite HP, as a Swarm, or as a Single target that respawns after death.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {(
                    [
                      ['enemy_chaser_norm', 'Chaser · Thorn-Vine Swarmer (6.1)'],
                      ['enemy_dasher_norm', 'Dasher · Briar Charger (6.2)'],
                      ['enemy_spitter_norm', 'Spitter · Spore Pitcher (6.3)'],
                      ['enemy_brute_norm', 'Brute · Moss Golem (6.4)'],
                      ['enemy_splitter_norm', 'Splitter · Bulb Mitotic (6.5)'],
                      ['enemy_shielded_norm', 'Shielded · Bark Sentinel (6.6)'],
                      ['special_golden_beast', 'Golden Beast · Special (6.8)'],
                      ['special_bloom_giant', 'Bloom Giant · Special (6.9)'],
                      ['special_brood_mother', 'Brood Mother · Special (6.10)'],
                      ['special_mirror_wisp', 'Mirror Wisp · Special (6.11)'],
                      ['boss_moss_colossus', 'Ancient Moss Colossus · Mini-Boss (6.12)'],
                      ['boss_thornheart_p1', 'Primordial Thornheart · Phase 1 (6.13)'],
                      ['boss_thornheart_p2', 'Frenzied Bloom · Phase 2 (6.14)'],
                      ['boss_thornheart_p3', 'Apex Briar Overlord · Phase 3 (6.15)'],
                      ['hero_warden', 'Warden Profession (2.2)'],
                      ['hero_seeker', 'Seeker Profession (2.3)'],
                      ['hero_herbalist', 'Herbalist Profession (2.4)'],
                      ['hero_stormcaller', 'Stormcaller Profession (2.5)'],
                    ] as ReadonlyArray<readonly [SpriteKey, string]>
                  ).map(([key, label]) => {
                    const url = getSpritePortraitDataUrl(key);
                    const isEnemyEntry = !key.startsWith('hero_');
                    const isDebugHighlighted = activeDebugEnemyKey === key;
                    return (
                      <div
                        key={key}
                        data-testid={`bestiary-card-${key}`}
                        className={`p-3 rounded-xl bg-[#1E1520] border flex flex-col justify-between gap-2.5 transition-colors ${
                          isDebugHighlighted
                            ? 'border-[#FDFFB6]'
                            : 'border-[#FFFDF0]/15'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {url && (
                            <img
                              src={url}
                              alt={label}
                              referrerPolicy="no-referrer"
                              className="w-16 h-16 rounded-xl bg-[#2B1F2D] border-2 border-[#2D1E2F] shrink-0 object-contain p-1"
                            />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-1.5 mb-1">
                              <div className="text-xs font-bold text-[#FDFFB6] truncate">
                                {label}
                              </div>
                              {isEnemyEntry && (
                                <button
                                  type="button"
                                  data-testid={`bestiary-debug-btn-${key}`}
                                  onClick={() =>
                                    setActiveDebugEnemyKey((prev) => (prev === key ? null : key))
                                  }
                                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold border transition-colors shrink-0 ${
                                    isDebugHighlighted
                                      ? 'bg-[#FDFFB6] text-[#2D1E2F] border-[#2D1E2F]'
                                      : 'bg-[#2B1F2D] text-[#FDFFB6] border-[#FDFFB6]/50 hover:bg-[#3B2B3E]'
                                  }`}
                                >
                                  Debug
                                </button>
                              )}
                            </div>
                            <p className="text-[11px] text-[#FFFDF0]/75 leading-snug">
                              {CATALOG_SPRITE_PROMPTS[key]}
                            </p>
                          </div>
                        </div>

                        {isEnemyEntry && onSpawnBestiaryEnemy && (
                          <div
                            data-testid={`bestiary-debug-controls-${key}`}
                            className={`pt-2 border-t border-[#FFFDF0]/10 flex flex-wrap items-center gap-1.5 ${
                              isDebugHighlighted ? 'bg-[#2B1F2D]/60 -mx-1 px-1.5 pb-1 rounded-lg' : ''
                            }`}
                          >
                            <button
                              type="button"
                              data-testid={`bestiary-spawn-infinite-${key}`}
                              onClick={() => onSpawnBestiaryEnemy(key, 'infinite_hp')}
                              className="flex-1 py-1 px-2 rounded-lg bg-[#FDFFB6] text-[#2D1E2F] text-[10px] font-extrabold border border-[#2D1E2F] hover:bg-[#fbbf24] transition-colors whitespace-nowrap"
                            >
                              ∞ Infinite HP
                            </button>
                            <button
                              type="button"
                              data-testid={`bestiary-spawn-swarm-${key}`}
                              onClick={() => onSpawnBestiaryEnemy(key, 'swarm')}
                              className="flex-1 py-1 px-2 rounded-lg bg-[#FFAAA6] text-[#2D1E2F] text-[10px] font-extrabold border border-[#2D1E2F] hover:bg-[#f88b86] transition-colors whitespace-nowrap"
                            >
                              Spawn Lot (Swarm)
                            </button>
                            <button
                              type="button"
                              data-testid={`bestiary-spawn-respawn-${key}`}
                              onClick={() => onSpawnBestiaryEnemy(key, 'respawn_on_death')}
                              className="flex-1 py-1 px-2 rounded-lg bg-[#A8E6CF] text-[#2D1E2F] text-[10px] font-extrabold border border-[#2D1E2F] hover:bg-[#88D49E] transition-colors whitespace-nowrap"
                            >
                              1× Respawn on Death
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-[#FFFDF0]/15">
                <h3 className="text-xs font-bold tracking-wider text-[#FDFFB6] mb-1">
                  02. BOTANICAL TAROT DECK (30 ARCANA BLESSINGS & 6 WEAPONS)
                </h3>
                <p className="text-xs text-[#FFFDF0]/75 mb-3">
                  Each blessing card is illustrated as an antique botanical Tarot card depicting its core power.
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {CARDS.map((card) => {
                    const meta = getTarotMetadata(card.id);
                    return (
                      <div
                        key={card.id}
                        className="rounded-xl bg-[#FFFDF0] text-[#2D1E2F] border-2 border-[#C4B5A6] p-2 flex flex-col justify-between shadow-md"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[10px] font-bold text-[#5C4760] pb-1 mb-1.5 border-b border-[#2D1E2F]/15">
                            <span className="px-1.5 py-0.5 rounded bg-[#2D1E2F] text-[#FDFFB6] font-display">
                              {meta.numeral}
                            </span>
                            <span className="uppercase">{card.rarity}</span>
                          </div>
                          <div className="w-24 mx-auto mb-1.5">
                            <TarotIllustrationSvg
                              targetId={card.id}
                              rarity={card.rarity}
                              iconColor={card.iconColor}
                            />
                          </div>
                          <div className="bg-[#2D1E2F] text-[#FFFDF0] rounded px-1.5 py-1 text-center mb-1.5">
                            <div className="text-[9px] text-[#FDFFB6] uppercase tracking-wider">
                              {meta.arcanaTitle}
                            </div>
                            <div className="text-xs font-display font-bold leading-tight">
                              {card.name}
                            </div>
                          </div>
                          <p className="text-[11px] text-[#3D2B40] leading-snug text-center">
                            {card.shortDesc}
                          </p>
                        </div>
                        <div className="mt-2 pt-1 border-t border-[#2D1E2F]/10 text-[10px] font-bold text-[#5C4760] text-center uppercase">
                          {card.tags.join(' · ')}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Start CTA */}
        <div className="px-6 py-4 bg-[#1E1520] border-t border-[#FFFDF0]/10 flex items-center justify-between">
          <span className="text-xs text-[#FFFDF0]/75">
            Active: {PROFESSIONS[loadout.professionId]?.name} · {PERSONAS.find((p) => p.id === loadout.personaId)?.name ?? 'Seedling Wanderer'} · {THEME_PACKS[loadout.biomeId].name}
          </span>
          <button
            type="button"
            data-start="true"
            onClick={onStartRun}
            className="px-6 py-2.5 rounded-xl bg-[#A8E6CF] text-[#2D1E2F] font-bold text-sm border-2 border-[#2D1E2F] hover:bg-[#88D49E] transition-colors whitespace-nowrap"
          >
            Start Run Now
          </button>
        </div>
      </div>
    </div>
  );
}

export function DebugCardModal({
  weapons,
  ownedCards,
  heldPowerUps = [],
  onSetCardLevel,
  onSetWeaponLevel,
  onSpawnPowerUpDrop,
  onGivePowerUp,
  onTriggerPowerUp,
  onSpawnArenaFlower,
  onSpawnFinalBossArena,
  onTestHealHero,
  onResetAllCards,
  onClose,
}: {
  weapons: ReadonlyArray<{ id: string; level: number; evolved: boolean }>;
  ownedCards: Readonly<Record<string, number>>;
  heldPowerUps?: ReadonlyArray<PowerUpId>;
  onSetCardLevel: (cardId: string, level: number) => void;
  onSetWeaponLevel: (weaponId: string, level: number, evolved: boolean) => void;
  onSpawnPowerUpDrop?: (powerUpId: PowerUpId) => void;
  onGivePowerUp?: (powerUpId: PowerUpId) => void;
  onTriggerPowerUp?: (powerUpId: PowerUpId) => void;
  onSpawnArenaFlower?: () => void;
  onSpawnFinalBossArena?: () => void;
  onTestHealHero?: (amount: number) => void;
  onResetAllCards: () => void;
  onClose: () => void;
}) {
  const [filter, setFilter] = useState<
    'all' | 'active' | 'weapons' | 'stat' | 'behavior' | 'synergy' | 'risk_reward'
  >('all');
  const [searchQuery, setSearchQuery] = useState('');

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const weaponList = Object.values(WEAPONS).filter((w) => {
    if (
      filter !== 'all' &&
      filter !== 'weapons' &&
      !(filter === 'active' && weapons.some((eq) => eq.id === w.id))
    ) {
      return false;
    }
    if (!normalizedQuery) return true;
    return (
      w.name.toLowerCase().includes(normalizedQuery) ||
      w.evolvedName.toLowerCase().includes(normalizedQuery) ||
      w.description.toLowerCase().includes(normalizedQuery) ||
      w.tags.some((t) => t.toLowerCase().includes(normalizedQuery))
    );
  });

  const cardList = CARDS.filter((c) => {
    const currentLv = ownedCards[c.id] ?? 0;
    if (filter === 'weapons') return false;
    if (filter === 'active' && currentLv <= 0) return false;
    if (
      filter !== 'all' &&
      filter !== 'active' &&
      c.type !== filter
    ) {
      return false;
    }
    if (!normalizedQuery) return true;
    return (
      c.name.toLowerCase().includes(normalizedQuery) ||
      c.shortDesc.toLowerCase().includes(normalizedQuery) ||
      c.tags.some((t) => t.toLowerCase().includes(normalizedQuery))
    );
  });

  const totalOwnedCards = Object.values(ownedCards).reduce((sum, lv) => sum + lv, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-[#140E16]/88 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="debug-card-modal-title"
    >
      <div className="w-full max-w-5xl max-h-[90vh] flex flex-col rounded-2xl bg-[#2B1F2D] border-4 border-[#2D1E2F] text-[#FFFDF0] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 bg-[#1E1520] border-b border-[#FFFDF0]/10">
          <div>
            <p className="text-[11px] font-bold tracking-wider text-[#FDFFB6]">
              LIVE SANDBOX INSPECTOR · PAUSES COMBAT WHILE OPEN
            </p>
            <h2 id="debug-card-modal-title" className="text-xl sm:text-2xl font-display font-bold">
              Debug Card, Weapon & Droppable Item Selector
            </h2>
          </div>

          <div className="flex items-center gap-2.5">
            <span className="text-xs font-mono-tabular text-[#A8E6CF] whitespace-nowrap">
              Equipped Weapons: {weapons.length} · Card Ranks: {totalOwnedCards}
            </span>
            <button
              type="button"
              onClick={onResetAllCards}
              className="px-3 py-1.5 rounded-lg bg-[#3B2B3E] text-[#FFAAA6] text-xs font-bold border border-[#FFAAA6]/40 hover:bg-[#4D3851] transition-colors whitespace-nowrap shrink-0"
            >
              Reset Cards
            </button>
            <button
              type="button"
              data-testid="close-debug-card-modal"
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg bg-[#A8E6CF] text-[#2D1E2F] text-xs font-extrabold border-2 border-[#2D1E2F] hover:bg-[#88D49E] transition-colors whitespace-nowrap shrink-0"
            >
              Close & Resume
            </button>
          </div>
        </div>

        {/* Filter Bar & Search Input */}
        <div className="px-5 py-3 bg-[#241926] border-b border-[#FFFDF0]/10 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-1 p-1 bg-[#1E1520] rounded-lg">
            {(
              [
                ['all', 'All (36)'],
                ['active', 'Equipped'],
                ['weapons', 'Weapons (6)'],
                ['stat', 'Stat (12)'],
                ['behavior', 'Behavior (8)'],
                ['synergy', 'Synergy (6)'],
                ['risk_reward', 'Risk/Reward (4)'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`px-2.5 py-1 rounded-md text-xs font-bold transition-colors whitespace-nowrap ${
                  filter === key
                    ? 'bg-[#FDFFB6] text-[#2D1E2F]'
                    : 'text-[#FFFDF0]/75 hover:text-[#FFFDF0]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <input
            type="search"
            aria-label="Search cards or weapons"
            placeholder="Filter by card name, weapon, or tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full sm:w-64 px-3 py-1.5 rounded-lg bg-[#1E1520] border border-[#FFFDF0]/20 text-xs text-[#FFFDF0] placeholder-[#FFFDF0]/45 focus:outline-none focus:border-[#A8E6CF]"
          />
        </div>

        {/* Scrollable Grid of Droppable Usable Items, Weapons, and Blessing Cards */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          {filter === 'all' && (
            <div>
              <h3 className="text-xs font-bold tracking-wider text-[#FB923C] mb-2.5">
                00. USABLE DROPPABLE ITEMS (EMBER GUARD & POWER-UPS · USE WITH [Q] / [E])
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.values(POWER_UPS).map((pDef) => {
                  const isHeld = heldPowerUps.includes(pDef.id);
                  const isEmberGuard = pDef.id === 'fire_breath';
                  return (
                    <div
                      key={pDef.id}
                      data-testid={`debug-powerup-row-${pDef.id}`}
                      className={`p-3 rounded-xl border-2 flex flex-col justify-between gap-2.5 ${
                        isEmberGuard
                          ? 'bg-[#3B231E]/90 border-[#FB923C]'
                          : isHeld
                            ? 'bg-[#36493E]/85 border-[#A8E6CF]'
                            : 'bg-[#1E1520] border-[#FFFDF0]/15'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          data-testid={`debug-powerup-icon-${pDef.id}`}
                          className="w-10 h-10 rounded-xl bg-[#2B1F2D] border-2 border-[#2D1E2F] flex items-center justify-center shrink-0 shadow-inner"
                        >
                          <PowerUpAbilityIcon powerUpId={pDef.id} className="w-7 h-7" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="font-display font-bold text-sm text-[#FFFDF0] truncate">
                              {pDef.name}
                            </span>
                            <span className="font-mono-tabular text-[11px] font-bold text-[#FDFFB6] whitespace-nowrap shrink-0">
                              {isHeld ? 'Held in [Q/E]' : 'Droppable Item'}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#FFFDF0]/80 leading-snug mt-1">
                            {pDef.shortDesc}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 pt-1.5 border-t border-[#FFFDF0]/10">
                        <button
                          type="button"
                          data-testid={`debug-powerup-drop-${pDef.id}`}
                          onClick={() => onSpawnPowerUpDrop?.(pDef.id)}
                          className="flex-1 py-1 px-2 rounded bg-[#2B1F2D] hover:bg-[#3B2B3E] text-[#FFFDF0] text-[11px] font-bold transition-colors whitespace-nowrap"
                        >
                          Drop Item
                        </button>
                        <button
                          type="button"
                          data-testid={`debug-powerup-equip-${pDef.id}`}
                          onClick={() => onGivePowerUp?.(pDef.id)}
                          className="flex-1 py-1 px-2 rounded bg-[#A8E6CF] hover:bg-[#88D49E] text-[#2D1E2F] text-[11px] font-bold transition-colors whitespace-nowrap"
                        >
                          Equip [Q/E]
                        </button>
                        <button
                          type="button"
                          data-testid={`debug-powerup-use-${pDef.id}`}
                          onClick={() => onTriggerPowerUp?.(pDef.id)}
                          className="flex-1 py-1 px-2 rounded bg-[#FB923C] hover:bg-[#F97316] text-[#2D1E2F] text-[11px] font-extrabold transition-colors whitespace-nowrap"
                        >
                          Use Now
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Arena, Final Boss Thorn Circle & Heal Effect Sandbox Controls */}
              <div className="mt-3 p-3 rounded-xl bg-[#1E1520] border-2 border-[#A8E6CF]/40 flex flex-wrap items-center justify-between gap-2.5">
                <div>
                  <div className="text-xs font-bold text-[#A8E6CF]">
                    Arena Flowers, Final Boss Thorn Circle & Heal Effects
                  </div>
                  <div className="text-[11px] text-[#FFFDF0]/75">
                    Spawn a high-HP Big Arena Flower, trigger the Final Boss thorn circle arena, or test Hero Heal scaling.
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    data-testid="debug-spawn-arena-flower"
                    onClick={() => onSpawnArenaFlower?.()}
                    className="px-2.5 py-1.5 rounded-lg bg-[#FFAAA6] text-[#2D1E2F] text-xs font-extrabold border-2 border-[#2D1E2F] hover:bg-[#f88b86] transition-colors whitespace-nowrap"
                  >
                    + Spawn Big Arena Flower
                  </button>
                  <button
                    type="button"
                    data-testid="debug-spawn-final-boss-arena"
                    onClick={() => onSpawnFinalBossArena?.()}
                    className="px-2.5 py-1.5 rounded-lg bg-[#F43F5E] text-[#FFFDF0] text-xs font-extrabold border-2 border-[#2D1E2F] hover:bg-[#e11d48] transition-colors whitespace-nowrap"
                  >
                    Start Final Boss Thorn Arena
                  </button>
                  <button
                    type="button"
                    data-testid="debug-heal-small"
                    onClick={() => onTestHealHero?.(4)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#A8E6CF] text-[#2D1E2F] text-xs font-bold border-2 border-[#2D1E2F] hover:bg-[#88D49E] transition-colors whitespace-nowrap"
                  >
                    Heal +4 HP
                  </button>
                  <button
                    type="button"
                    data-testid="debug-heal-big"
                    onClick={() => onTestHealHero?.(35)}
                    className="px-2.5 py-1.5 rounded-lg bg-[#88D49E] text-[#2D1E2F] text-xs font-extrabold border-2 border-[#2D1E2F] hover:bg-[#4ade80] transition-colors whitespace-nowrap"
                  >
                    Heal +35 HP
                  </button>
                </div>
              </div>
            </div>
          )}

          {weaponList.length > 0 && (
            <div>
              <h3 className="text-xs font-bold tracking-wider text-[#A8E6CF] mb-2.5">
                01. WEAPONS (CHOOSE ANY LEVEL 1–8 OR EVOLVED)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {weaponList.map((wDef) => {
                  const eq = weapons.find((w) => w.id === wDef.id);
                  const currentLv = eq ? eq.level : 0;
                  const isEvolved = eq ? eq.evolved : false;

                  return (
                    <div
                      key={wDef.id}
                      data-testid={`debug-weapon-row-${wDef.id}`}
                      className={`p-3 rounded-xl border-2 flex flex-col justify-between gap-2.5 ${
                        currentLv > 0
                          ? 'bg-[#36493E]/85 border-[#A8E6CF]'
                          : 'bg-[#1E1520] border-[#FFFDF0]/15'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-display font-bold text-sm text-[#FFFDF0]">
                            {isEvolved ? `${wDef.evolvedName} (${wDef.name})` : wDef.name}
                          </div>
                          <div className="text-[11px] text-[#FFFDF0]/75 leading-snug mt-0.5">
                            {isEvolved ? wDef.evolvedDescription : wDef.description}
                          </div>
                        </div>
                        <span className="font-mono-tabular text-xs font-bold text-[#FDFFB6] whitespace-nowrap shrink-0">
                          {currentLv === 0
                            ? 'Off'
                            : isEvolved
                              ? 'Lv 8 · Evo'
                              : `Lv ${currentLv} / 8`}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-[#FFFDF0]/10">
                        <button
                          type="button"
                          onClick={() => onSetWeaponLevel(wDef.id, 0, false)}
                          className={`px-2 py-1 rounded text-[11px] font-mono-tabular font-bold transition-colors whitespace-nowrap ${
                            currentLv === 0
                              ? 'bg-[#FFAAA6] text-[#2D1E2F]'
                              : 'bg-[#2B1F2D] text-[#FFFDF0]/70 hover:text-[#FFFDF0]'
                          }`}
                        >
                          Off
                        </button>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((lv) => (
                          <button
                            key={lv}
                            type="button"
                            data-testid={`debug-weapon-${wDef.id}-lv-${lv}`}
                            onClick={() => onSetWeaponLevel(wDef.id, lv, false)}
                            className={`px-2 py-1 rounded text-[11px] font-mono-tabular font-bold transition-colors whitespace-nowrap ${
                              currentLv === lv && !isEvolved
                                ? 'bg-[#A8E6CF] text-[#2D1E2F]'
                                : 'bg-[#2B1F2D] text-[#FFFDF0]/85 hover:bg-[#3B2B3E]'
                            }`}
                          >
                            {lv}
                          </button>
                        ))}
                        <button
                          type="button"
                          data-testid={`debug-weapon-${wDef.id}-evo`}
                          onClick={() => onSetWeaponLevel(wDef.id, 8, true)}
                          className={`px-2.5 py-1 rounded text-[11px] font-mono-tabular font-extrabold transition-colors whitespace-nowrap ${
                            isEvolved
                              ? 'bg-[#FDFFB6] text-[#2D1E2F]'
                              : 'bg-[#2B1F2D] text-[#FDFFB6] hover:bg-[#3B2B3E]'
                          }`}
                        >
                          Evo
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {cardList.length > 0 && (
            <div>
              <h3 className="text-xs font-bold tracking-wider text-[#FDFFB6] mb-2.5">
                02. BOTANICAL TAROT CARDS (CHOOSE ANY CARD & ANY LEVEL)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {cardList.map((card) => {
                  const currentLv = ownedCards[card.id] ?? 0;
                  const isCardEvolved = Boolean(card.evolvedName && currentLv > card.maxLevel);
                  const levels = Array.from({ length: card.maxLevel }, (_, i) => i + 1);

                  return (
                    <div
                      key={card.id}
                      data-testid={`debug-card-row-${card.id}`}
                      className={`p-3 rounded-xl border-2 flex flex-col justify-between gap-2.5 ${
                        isCardEvolved
                          ? 'bg-[#36493E] border-[#FDFFB6]'
                          : currentLv > 0
                            ? 'bg-[#36493E]/85 border-[#A8E6CF]'
                            : 'bg-[#1E1520] border-[#FFFDF0]/15'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-display font-bold text-sm text-[#FFFDF0] truncate">
                            {isCardEvolved ? `${card.evolvedName} (${card.name})` : card.name}
                          </span>
                          <span className="font-mono-tabular text-xs font-bold text-[#FDFFB6] whitespace-nowrap shrink-0">
                            {isCardEvolved
                              ? `Lv ${card.maxLevel} · Evo`
                              : `Lv ${currentLv} / ${card.maxLevel}`}
                          </span>
                        </div>
                        <div className="text-[10px] font-semibold text-[#A8E6CF] mt-0.5">
                          {card.type.replace('_', ' ')} · {isCardEvolved ? 'legendary evo' : card.rarity} · {card.tags.join(' · ')}
                        </div>
                        <p className="text-[11px] text-[#FFFDF0]/80 leading-snug mt-1">
                          {isCardEvolved && card.evolvedDescription
                            ? card.evolvedDescription
                            : card.shortDesc}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 pt-1.5 border-t border-[#FFFDF0]/10">
                        <button
                          type="button"
                          data-testid={`debug-card-${card.id}-lv-0`}
                          onClick={() => onSetCardLevel(card.id, 0)}
                          className={`flex-1 py-1 rounded text-[11px] font-mono-tabular font-bold transition-colors whitespace-nowrap ${
                            currentLv === 0
                              ? 'bg-[#FFAAA6] text-[#2D1E2F]'
                              : 'bg-[#2B1F2D] text-[#FFFDF0]/70 hover:text-[#FFFDF0]'
                          }`}
                        >
                          Off
                        </button>
                        {levels.map((lv) => (
                          <button
                            key={lv}
                            type="button"
                            data-testid={`debug-card-${card.id}-lv-${lv}`}
                            onClick={() => onSetCardLevel(card.id, lv)}
                            className={`flex-1 py-1 rounded text-[11px] font-mono-tabular font-bold transition-colors whitespace-nowrap ${
                              currentLv === lv
                                ? 'bg-[#A8E6CF] text-[#2D1E2F]'
                                : 'bg-[#2B1F2D] text-[#FFFDF0]/85 hover:bg-[#3B2B3E]'
                            }`}
                          >
                            Lv {lv}
                          </button>
                        ))}
                        {card.evolvedName && (
                          <button
                            type="button"
                            data-testid={`debug-card-${card.id}-evo`}
                            onClick={() => onSetCardLevel(card.id, card.maxLevel + 1)}
                            className={`px-2 py-1 rounded text-[11px] font-mono-tabular font-extrabold transition-colors whitespace-nowrap ${
                              isCardEvolved
                                ? 'bg-[#FDFFB6] text-[#2D1E2F]'
                                : 'bg-[#2B1F2D] text-[#FDFFB6] hover:bg-[#3B2B3E]'
                            }`}
                          >
                            Evo
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

