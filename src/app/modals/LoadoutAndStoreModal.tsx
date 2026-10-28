/**
 * @file LoadoutAndStoreModal.tsx
 * @llm-tag modal:loadout-and-store
 * @llm-context Comprehensive meta sanctuary modal featuring Loadout configuration, Store/Unlocks, Daily Quests, and Bestiary codex.
 * @llm-description Includes YouTube Playables SDK dev stubs & diagnostics, Hero Persona unlocks via rewarded ads, Trinkets, Curses, Biomes, seeded challenges, and bestiary arena spawning.
 */

import React, { useState } from 'react';
import {
  CARDS,
  CURSES,
  PERSONAS,
  PROFESSIONS,
  THEME_PACKS,
  TRINKETS,
  WEAPONS,
} from '../../content/data/catalog';
import type { ProfessionId } from '../../content/schema/types';
import type { SaveDataV1 } from '../../meta/SaveManager';
import {
  CATALOG_SPRITE_PROMPTS,
  getSpritePortraitDataUrl,
  resolveHeroSpriteKey,
  type SpriteKey,
} from '../../view/SpriteAtlas';
import { CoinIcon, SeedGemIcon } from '../SvgIcons';
import { getTarotMetadata, TarotIllustrationSvg } from '../TarotCardArt';
import { useGameShell } from '../context/GameShellContext';
import {
  LazyBestiaryEnemyDebugBadge,
  LazyBestiaryEnemyDebugSpawner,
  LazySanctuaryHeaderDebugGoldButton,
  LazyStoreDebugTreasuryPanel,
} from '../debug/LazyDebugComponents';
import { IS_DEV } from '../debug/devGate';
import { HeroPersonasSection } from './HeroPersonasSection';
import { YouTubeSdkPanel } from './YouTubeSdkPanel';
import { cn } from '../../utils/cn';

/**
 * @llm-component LoadoutAndStoreModal
 * @llm-hook garden-sanctuary: multi-tab hub for professions, trinkets, curses, quests, bestiary, and YT SDK diagnostics
 */
export function LoadoutAndStoreModal() {
  const {
    saveData,
    sanctuaryTab,
    setSanctuaryTab,
    handleSelectLoadout,
    handleUnlockProfession,
    handleUnlockTrinket,
    handleUpgradeTrinket,
    handleUnlockCurse,
    handleWatchCoinsAd,
    isAdLoading,
    handleDebugSpawnBestiaryEnemy,
    handleClaimQuest,
    handleDebugAddGold,
    startNewOrResumedRun,
  } = useGameShell();

  const initialTab = (sanctuaryTab ?? 'loadout') as 'loadout' | 'store' | 'quests' | 'bestiary';
  const onClose = () => setSanctuaryTab(null);
  const onSelectLoadout = handleSelectLoadout;
  const onUnlockProfession = handleUnlockProfession;
  const onUnlockTrinket = handleUnlockTrinket;
  const onUpgradeTrinket = handleUpgradeTrinket;
  const onUnlockCurse = handleUnlockCurse;
  const onWatchCoinsAd = handleWatchCoinsAd;
  const onSpawnBestiaryEnemy = IS_DEV ? handleDebugSpawnBestiaryEnemy : undefined;
  const onClaimQuest = handleClaimQuest;
  const onAddDebugGold = handleDebugAddGold;
  const onStartRun = () => startNewOrResumedRun(false);

  const [tab, setTab] = useState<'loadout' | 'store' | 'quests' | 'bestiary'>(initialTab);
  const [activeDebugEnemyKey, setActiveDebugEnemyKey] = useState<string | null>(null);
  const { loadout, unlocks, currencies, retention } = saveData;

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
            <div className="flex items-center gap-1 p-1 bg-[#1E1C0E] border border-[#3D392A] rounded-xl">
              {(['loadout', 'store', 'quests', 'bestiary'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  data-testid={`sanctuary-tab-${t}`}
                  onClick={() => setTab(t)}
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors whitespace-nowrap',
                    tab === t
                      ? 'bg-[#E8B64A] text-[#201A09] shadow-sm'
                      : 'text-[#EDE6D0]/70 hover:text-[#EDE6D0]'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3 text-sm font-mono-tabular">
            <button
              type="button"
              data-testid="store-coins-balance"
              onClick={onWatchCoinsAd}
              disabled={isAdLoading}
              title="Watch ad for +100 Coins"
              aria-label="Watch ad for +100 Coins"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FDFFB6]/10 hover:bg-[#FDFFB6]/20 active:scale-95 transition-all text-[#FDFFB6] border border-[#FDFFB6]/25 cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <CoinIcon />
              <span className="font-bold">{currencies.coins}</span>
              <span className="text-[10px] bg-[#FDFFB6]/25 group-hover:bg-[#FDFFB6]/35 text-[#18241E] font-extrabold px-1.5 py-0.5 rounded-full ml-0.5 flex items-center gap-1 whitespace-nowrap">
                {isAdLoading ? '...' : '+100 🎬'}
              </span>
            </button>
            <LazySanctuaryHeaderDebugGoldButton onAddDebugGold={onAddDebugGold} />
            <span className="flex items-center gap-1.5 text-[#DED2F9]">
              <SeedGemIcon />
              {currencies.gems}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="btn-herbarium-secondary-compact px-3 py-1 text-xs whitespace-nowrap"
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
                    const activeProfPersona = PERSONAS.find(
                      (p) =>
                        p.id === loadout.personaId &&
                        p.professionId === profId &&
                        unlocks.personas.includes(p.id)
                    );
                    const spriteUrl = getSpritePortraitDataUrl(
                      resolveHeroSpriteKey(profId, activeProfPersona?.id)
                    );
                    return (
                      <div
                        key={profId}
                        className={cn(
                          'p-3.5 rounded-xl border-2 flex flex-col justify-between',
                          isSelected
                            ? 'bg-[#36493E] border-[#A8E6CF]'
                            : 'bg-[#1E1520] border-[#FFFDF0]/15'
                        )}
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
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                                isSelected
                                  ? 'bg-[#6FA36B] text-[#101F12] shadow-sm'
                                  : 'btn-herbarium-secondary-compact'
                              }`}
                            >
                              {isSelected ? 'Equipped' : 'Select'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={currencies.coins < prof.unlockCostCoins}
                              onClick={() => onUnlockProfession(profId, prof.unlockCostCoins)}
                              className="btn-herbarium-secondary-compact px-3 py-1.5 text-xs text-[#E8B64A] disabled:opacity-40 whitespace-nowrap"
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

              {/* Hero Personas */}
              <HeroPersonasSection sectionNumberLabel="02." />

              <YouTubeSdkPanel />

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
                              ? 'bg-[#12302B] border-[#6FA36B] shadow-[0_0_10px_rgba(111,163,107,0.3)]'
                              : 'btn-herbarium-secondary-compact'
                          }`}
                        >
                          <div className="text-xs font-bold truncate">{t.name}</div>
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
                        ? 'bg-[#12302B] border-[#E8B64A] shadow-[0_0_10px_rgba(232,182,74,0.3)]'
                        : 'btn-herbarium-secondary-compact'
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
              <HeroPersonasSection />

              <YouTubeSdkPanel />

              <LazyStoreDebugTreasuryPanel onAddDebugGold={onAddDebugGold} />

              <div>
                <h3 className="text-xs font-bold tracking-wider text-[#A8E6CF] mb-2.5">
                  TRINKETS (EQUIP UP TO 3 PASSIVE RELICS)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {TRINKETS.map((trinket) => {
                    const unlocked = unlocks.trinkets.includes(trinket.id);
                    const equipped = loadout.trinketIds.includes(trinket.id);
                    const currentLv = Math.max(
                      1,
                      Math.min(3, Math.floor(unlocks.trinketLevels?.[trinket.id] ?? 1))
                    );
                    const levelDesc = unlocked
                      ? trinket.levelDescriptions?.[currentLv - 1] ?? trinket.description
                      : trinket.description;
                    const canAffordLv2 = currencies.coins >= trinket.upgradeCostCoinsLv2;
                    const canAffordLv3 = currencies.gems >= trinket.upgradeCostSeedsLv3;

                    return (
                      <div
                        key={trinket.id}
                        className="p-3.5 rounded-xl bg-[#1E1520] border border-[#FFFDF0]/15 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-bold text-sm text-[#FDFFB6]">{trinket.name}</span>
                            {unlocked && (
                              <span
                                data-testid={`trinket-level-${trinket.id}`}
                                className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                  currentLv === 3
                                    ? 'bg-[#FDFFB6]/20 text-[#FDFFB6] border border-[#FDFFB6]/40'
                                    : 'bg-[#A8E6CF]/20 text-[#A8E6CF] border border-[#A8E6CF]/30'
                                }`}
                              >
                                {currentLv === 3 ? 'Lv 3 (MAX)' : `Lv ${currentLv}`}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-[#FFFDF0]/80 mt-1">{levelDesc}</p>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2 flex-wrap">
                          {unlocked && currentLv < 3 ? (
                            <button
                              type="button"
                              data-testid={`upgrade-trinket-${trinket.id}`}
                              disabled={currentLv === 1 ? !canAffordLv2 : !canAffordLv3}
                              onClick={() => onUpgradeTrinket?.(trinket.id)}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                currentLv === 1
                                  ? 'bg-[#E8B64A]/20 hover:bg-[#E8B64A]/30 text-[#E8B64A] border border-[#E8B64A]/40 disabled:opacity-40'
                                  : 'bg-[#88D49E]/20 hover:bg-[#88D49E]/30 text-[#88D49E] border border-[#88D49E]/40 disabled:opacity-40'
                              }`}
                            >
                              {currentLv === 1
                                ? `Upgrade to Lv 2 (${trinket.upgradeCostCoinsLv2} Coins)`
                                : `Upgrade to Lv 3 (${trinket.upgradeCostSeedsLv3} Seeds)`}
                            </button>
                          ) : (
                            <div />
                          )}
                          <div className="ml-auto">
                            {unlocked ? (
                              <button
                                type="button"
                                data-testid={`equip-trinket-${trinket.id}`}
                                onClick={() => {
                                  const next = equipped
                                    ? loadout.trinketIds.filter((id) => id !== trinket.id)
                                    : [...loadout.trinketIds, trinket.id].slice(-3);
                                  onSelectLoadout({ trinketIds: next });
                                }}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                  equipped
                                    ? 'bg-[#6FA36B] text-[#101F12] shadow-sm'
                                    : 'btn-herbarium-secondary-compact'
                                }`}
                              >
                                {equipped ? 'Equipped' : 'Equip'}
                              </button>
                            ) : (
                              <button
                                type="button"
                                data-testid={`buy-trinket-${trinket.id}`}
                                disabled={currencies.coins < trinket.costCoins}
                                onClick={() => onUnlockTrinket(trinket.id, trinket.costCoins)}
                                className="btn-herbarium-secondary-compact px-3 py-1.5 text-xs text-[#E8B64A] disabled:opacity-40"
                              >
                                Buy ({trinket.costCoins} Coins)
                              </button>
                            )}
                          </div>
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
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                active
                                  ? 'bg-[#8E2B3A] text-[#EDE6D0] shadow-sm'
                                  : 'btn-herbarium-secondary-compact'
                              }`}
                            >
                              {active ? 'Active Curse' : 'Activate'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              disabled={currencies.coins < curse.costCoins}
                              onClick={() => onUnlockCurse(curse.id, curse.costCoins)}
                              className="btn-herbarium-secondary-compact px-3 py-1.5 text-xs text-[#E8B64A] disabled:opacity-40"
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
                      className={cn(
                        'px-4 py-2 text-xs font-bold whitespace-nowrap',
                        q.claimed
                          ? 'btn-herbarium-secondary-compact opacity-40 cursor-not-allowed'
                          : done
                          ? 'btn-herbarium-primary shadow-md'
                          : 'btn-herbarium-secondary-compact opacity-50 cursor-not-allowed'
                      )}
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
                                <LazyBestiaryEnemyDebugBadge
                                  enemyKey={key}
                                  isHighlighted={isDebugHighlighted}
                                  onToggle={() =>
                                    setActiveDebugEnemyKey((prev) => (prev === key ? null : key))
                                  }
                                />
                              )}
                            </div>
                            <p className="text-[11px] text-[#FFFDF0]/75 leading-snug">
                              {CATALOG_SPRITE_PROMPTS[key]}
                            </p>
                          </div>
                        </div>

                        {isEnemyEntry && onSpawnBestiaryEnemy && (
                          <LazyBestiaryEnemyDebugSpawner
                            enemyKey={key}
                            isHighlighted={isDebugHighlighted}
                            onSpawnBestiaryEnemy={onSpawnBestiaryEnemy}
                          />
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
            className="btn-herbarium-primary px-6 text-sm tracking-wide whitespace-nowrap shadow-lg min-h-[50px]"
          >
            Start Run Now
          </button>
        </div>
      </div>
    </div>
  );
}
