/**
 * @file DebugCardModal.tsx
 * @llm-tag modal:debug-card
 * @llm-context Live sandbox inspector modal pausing active combat to inspect, equip, level up, or evolve any weapon, card, power-up item, or trigger arena test encounters.
 * @llm-description Allows adjusting card/weapon ranks (0 to max + Evo), equipping droppable usable abilities (Ember Guard, etc.), spawning Big Arena Flowers or the Final Boss Thorn Arena, and triggering test heals.
 */

import React, { useState } from 'react';
import { CARDS, POWER_UPS, WEAPONS } from '../../content/data/catalog';
import type { PowerUpId } from '../../content/schema/types';
import { PowerUpAbilityIcon } from '../SvgIcons';

export interface DebugCardModalProps {
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
}

/**
 * @llm-component DebugCardModal
 * @llm-hook debug-inspector: live dev sandbox modal for weapons, blessing cards, powerups, and boss arenas
 */
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
}: DebugCardModalProps) {
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
