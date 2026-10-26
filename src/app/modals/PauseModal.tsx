/**
 * @file PauseModal.tsx
 * @llm-tag modal:pause
 * @llm-context In-game pause menu displaying active equipment/cards, game audio and visual accessibility settings, and run management actions.
 * @llm-description Allows adjusting music, SFX, bloom/glow, screen shake/motion reduction, and damage numbers during an ongoing run.
 */

import React from 'react';
import { CARDS, WEAPONS } from '../../content/data/catalog';
import type { SaveDataV1 } from '../../meta/SaveManager';

export interface PauseModalProps {
  weapons: ReadonlyArray<{ id: string; level: number; evolved: boolean }>;
  ownedCards: Readonly<Record<string, number>>;
  settings: SaveDataV1['settings'];
  onUpdateSettings: (partial: Partial<SaveDataV1['settings']>) => void;
  onResume: () => void;
  onRestart: () => void;
  onEndRunAndSummary: () => void;
  onReturnToTitle: () => void;
  onOpenDebugCards?: () => void;
}

/**
 * @llm-component PauseModal
 * @llm-hook run-pause: mid-run game pause modal with equipment list and audio/graphics settings
 */
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
}: PauseModalProps) {
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
