/**
 * @file PauseModal.tsx
 * @llm-tag modal:pause
 * @llm-context In-game pause menu displaying active equipment/cards, game audio and visual accessibility settings, and run management actions.
 * @llm-description Allows adjusting music, SFX, bloom/glow, screen shake/motion reduction, and damage numbers during an ongoing run.
 */

import React from 'react';
import { CARDS, WEAPONS } from '../../content/data/catalog';
import { useGameShell } from '../context/GameShellContext';
import { LazyModalDebugCardsButton } from '../debug/LazyDebugComponents';
import { IS_DEV } from '../debug/devGate';
import { cn } from '../../utils/cn';

/**
 * @llm-component PauseModal
 * @llm-hook run-pause: mid-run game pause modal with equipment list and audio/graphics settings
 */
export function PauseModal() {
  const {
    hud,
    saveData,
    updateSettings,
    resumeRun,
    startNewOrResumedRun,
    endRunWithSuddenDeath,
    updateShellState,
    openDebugMenu,
  } = useGameShell();

  const { weapons, ownedCards } = hud;
  const { settings } = saveData;
  const onUpdateSettings = updateSettings;
  const onResume = resumeRun;
  const onRestart = () => startNewOrResumedRun(false);
  const onEndRunAndSummary = endRunWithSuddenDeath;
  const onReturnToTitle = () => updateShellState('title');
  const onOpenDebugCards = IS_DEV ? openDebugMenu : undefined;
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
            <LazyModalDebugCardsButton onOpen={onOpenDebugCards} variant="pause" />
          )}
        </div>
        <p className="text-xs text-[#A8E6CF] mb-4">
          Your mid-run progress is automatically checkpointed.
        </p>

        {/* Equipped Weapons & Synergy Cards Summary */}
        <div className="mb-4 p-3 rounded-xl bg-[#1E1520] border border-[#FFFDF0]/10 max-h-56 overflow-y-auto">
          <p className="text-xs font-bold text-[#FDFFB6] mb-2 tracking-wider">ACTIVE WEAPONS</p>
          <div className="space-y-2 mb-3">
            {weapons.length === 0 ? (
              <p className="text-xs text-[#FFFDF0]/50 italic">No weapons equipped.</p>
            ) : (
              weapons.map((w) => {
                const def = WEAPONS[w.id];
                const currentName = w.evolved ? def?.evolvedName : def?.name;
                const desc = w.evolved
                  ? def?.evolvedDescription
                  : def?.levelUpDescriptions?.[w.level - 1] ?? def?.description;
                return (
                  <div
                    key={w.id}
                    className="p-2 rounded-lg bg-[#2B1F2D]/80 border border-[#FFFDF0]/10 flex flex-col gap-0.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          'text-sm font-bold',
                          w.evolved ? 'text-[#FDFFB6]' : 'text-[#FFFDF0]'
                        )}
                      >
                        {currentName}
                        {w.evolved && (
                          <span className="ml-1.5 text-[10px] px-1.5 py-0.5 rounded bg-[#FDFFB6]/20 text-[#FDFFB6] font-extrabold uppercase">
                            Evolved
                          </span>
                        )}
                      </span>
                      <span className="font-mono-tabular text-xs font-bold text-[#A8E6CF] shrink-0">
                        Lv {w.level}
                      </span>
                    </div>
                    {desc && (
                      <p className="text-[11px] text-[#FFFDF0]/70 leading-snug">
                        {desc}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
          {Object.keys(ownedCards).length > 0 && (
            <div className="pt-2 border-t border-[#FFFDF0]/10">
              <p className="text-[10px] font-bold text-[#A8E6CF] mb-1 tracking-wider uppercase">
                Synergy Cards
              </p>
              <div className="text-xs text-[#FFFDF0]/80">
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
            className="btn-herbarium-primary px-3 text-xs sm:text-sm whitespace-nowrap min-h-[48px] sm:min-h-[52px]"
          >
            Resume Run
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="btn-herbarium-lichen px-3 text-xs sm:text-sm whitespace-nowrap min-h-[48px] sm:min-h-[52px]"
          >
            Restart
          </button>
          <button
            type="button"
            data-testid="pause-end-run-btn"
            onClick={onEndRunAndSummary}
            className="btn-herbarium-danger-compact px-3 text-xs sm:text-sm whitespace-nowrap min-h-[48px] sm:min-h-[52px]"
          >
            End Run
          </button>
          <button
            type="button"
            onClick={onReturnToTitle}
            className="btn-herbarium-secondary-compact px-3 text-xs sm:text-sm whitespace-nowrap min-h-[48px] sm:min-h-[52px]"
          >
            Title Screen
          </button>
        </div>
      </div>
    </div>
  );
}
