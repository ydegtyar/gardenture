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
  POWER_UPS,
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
import {
  POWERUPS,
  POWERUP_LIST,
  getPowerUpDef,
  powerUpIcon,
  powerUpIconPng,
  type PowerUpId as CanonicalPowerUpId,
} from '../../game/data/powerups';
import {
  getMonsterDrops,
  getMonstersDroppingPowerUp,
} from '../../game/data/monsters';
import { CoinIcon, SeedGemIcon } from '../SvgIcons';
import { getTarotMetadata, TarotIllustrationSvg } from '../cards';
import { useGameShell } from '../context/GameShellContext';
import { NO_ADS } from '../../config/ads';
import {
  LazyBestiaryEnemyDebugBadge,
  LazyBestiaryEnemyDebugSpawner,
  LazySanctuaryHeaderDebugGoldButton,
  LazyStoreDebugTreasuryPanel,
} from '../debug/LazyDebugComponents';
import { IS_DEV } from '../debug/devGate';
import {
  HeroPersonasSection,
  HitenJadePortraitAuraBackSvg,
  HitenJadePortraitAuraFrontSvg,
} from './HeroPersonasSection';
import {
  SectionHeader,
  SigilCard,
  TrinketStoreCard,
} from '../components/StoreItemCard';
import { TrinketRelicArt } from '../trinkets';
import { calculateCurseRewardMultiplier } from '../../sim/rules/formulas';
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
    handleUpgradeCurse,
    handleWatchCoinsAd,
    canWatchRewardedAd,
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
  const onUpgradeCurse = handleUpgradeCurse;
  const onWatchCoinsAd = handleWatchCoinsAd;
  const onSpawnBestiaryEnemy = IS_DEV ? handleDebugSpawnBestiaryEnemy : undefined;
  const onClaimQuest = handleClaimQuest;
  const onAddDebugGold = handleDebugAddGold;
  const onStartRun = () => startNewOrResumedRun(false);

  const [tab, setTab] = useState<'loadout' | 'store' | 'quests' | 'bestiary'>(initialTab);
  const [activeDebugEnemyKey, setActiveDebugEnemyKey] = useState<string | null>(null);
  const [bestiaryItemFilter, setBestiaryItemFilter] = useState<
    'all' | 'weapons' | 'powerups' | 'trinkets' | 'sigils'
  >('all');
  const [previewUndiscoveredDrops, setPreviewUndiscoveredDrops] = useState(false);
  const [highlightedPowerUpId, setHighlightedPowerUpId] =
    useState<CanonicalPowerUpId | null>(null);
  const { loadout, unlocks, currencies, retention } = saveData;
  const activeSigilIds = new Set(loadout.curseIds);
  const totalCurseRewardMult = calculateCurseRewardMultiplier(
    loadout.curseIds,
    unlocks.curseLevels
  );

  // Discovered power-ups set (all discovered by default; toggleable to preview silhouette state)
  const discoveredPowerUps = new Set<CanonicalPowerUpId>(
    previewUndiscoveredDrops
      ? ['aegis-orb', 'heal-20hp']
      : POWERUP_LIST.map((p) => p.id)
  );

  const handleJumpToPowerUpCodex = (powerUpId: CanonicalPowerUpId) => {
    if (bestiaryItemFilter !== 'all' && bestiaryItemFilter !== 'powerups') {
      setBestiaryItemFilter('all');
    }
    setHighlightedPowerUpId(powerUpId);
    window.setTimeout(() => {
      const el = document.querySelector(
        `[data-testid="bestiary-item-powerup-${powerUpId}"]`
      );
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 40);
  };

  const handleJumpToMonsterCodex = (monsterKey: SpriteKey) => {
    setActiveDebugEnemyKey(monsterKey);
    window.setTimeout(() => {
      const el = document.querySelector(
        `[data-testid="bestiary-card-${monsterKey}"]`
      );
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 40);
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-[#140E16]/85 pointer-events-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sanctuary-modal-title"
    >
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-[#2B1F2D] border-4 border-[#2D1E2F] text-[#FFFDF0] shadow-2xl overflow-hidden">
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
            {NO_ADS || !canWatchRewardedAd ? (
              <div
                data-testid="store-coins-balance"
                title="Purse Coins"
                aria-label="Purse Coins"
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#FDFFB6]/10 text-[#FDFFB6] border border-[#FDFFB6]/25"
              >
                <CoinIcon />
                <span className="font-bold">{currencies.coins}</span>
              </div>
            ) : (
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
            )}
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
                    const isPersonaAppliedForProf =
                      loadout.personaByProfession?.[profId] !== undefined
                        ? loadout.personaByProfession[profId]
                        : loadout.professionId === profId
                          ? loadout.personaId
                          : undefined;
                    const activeProfPersona = PERSONAS.find(
                      (p) =>
                        p.id === isPersonaAppliedForProf &&
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
                            <div className="relative w-16 h-16 rounded-xl bg-[#2B1F2D] border-2 border-[#2D1E2F] shrink-0 flex items-center justify-center overflow-hidden p-1">
                              {activeProfPersona?.id === 'herbalist_frieren_strange' && (
                                <HitenJadePortraitAuraBackSvg />
                              )}
                              <img
                                src={spriteUrl}
                                alt={`${prof.name} sprite`}
                                referrerPolicy="no-referrer"
                                className="relative z-10 w-full h-full object-contain"
                              />
                              {activeProfPersona?.id === 'herbalist_frieren_strange' && (
                                <HitenJadePortraitAuraFrontSvg />
                              )}
                            </div>
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
                    {(
                      [
                        'garden',
                        'dungeon',
                        'sakura_grove',
                        'sunlit_oasis',
                        'frostbite_glade',
                        'crimson_ashlands',
                      ] as const
                    ).map((bId) => {
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
                <SectionHeader
                  variant="trinket"
                  title="TRINKETS (EQUIP UP TO 3 PASSIVE RELICS)"
                  counterText={`${loadout.trinketIds.length} / 3 Equipped`}
                  counterTestId="trinkets-equipped-counter"
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                  {TRINKETS.map((trinket) => {
                    const unlocked = unlocks.trinkets.includes(trinket.id);
                    const equipped = loadout.trinketIds.includes(trinket.id);
                    const currentLv = Math.max(
                      1,
                      Math.min(3, Math.floor(unlocks.trinketLevels?.[trinket.id] ?? 1))
                    ) as 1 | 2 | 3;

                    return (
                      <TrinketStoreCard
                        key={trinket.id}
                        trinket={trinket}
                        unlocked={unlocked}
                        equipped={equipped}
                        currentLv={currentLv}
                        coins={currencies.coins}
                        gems={currencies.gems}
                        onUnlock={onUnlockTrinket}
                        onUpgrade={onUpgradeTrinket}
                        onToggleEquip={(trinketId) => {
                          const next = equipped
                            ? loadout.trinketIds.filter((id) => id !== trinketId)
                            : [...loadout.trinketIds, trinketId].slice(-3);
                          onSelectLoadout({ trinketIds: next });
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              <div>
                <SectionHeader
                  variant="curse"
                  title="CURSE SIGILS (DIFFICULTY & REWARD MULTIPLIERS)"
                  secondaryChipText={`Total Reward x${totalCurseRewardMult.toFixed(2)}`}
                  secondaryChipTestId="sigils-total-reward"
                  counterText={`${activeSigilIds.size} / ${CURSES.length} ACTIVE`}
                  counterTestId="sigils-active-counter"
                />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5">
                  {CURSES.map((sigil) => {
                    const unlocked = unlocks.curses.includes(sigil.id);
                    const active = activeSigilIds.has(sigil.id);
                    const currentLv = Math.max(
                      1,
                      Math.min(3, Math.floor(unlocks.curseLevels?.[sigil.id] ?? 1))
                    ) as 1 | 2 | 3;

                    return (
                      <SigilCard
                        key={sigil.id}
                        sigil={sigil}
                        unlocked={unlocked}
                        active={active}
                        currentLv={currentLv}
                        coins={currencies.coins}
                        onUnlock={onUnlockCurse}
                        onUpgrade={onUpgradeCurse}
                        onToggleActive={(sigilId) => {
                          const nextSet = new Set(loadout.curseIds);
                          if (nextSet.has(sigilId)) {
                            nextSet.delete(sigilId);
                          } else {
                            nextSet.add(sigilId);
                          }
                          onSelectLoadout({ curseIds: Array.from(nextSet) });
                        }}
                      />
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
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <h3 className="text-xs font-bold tracking-wider text-[#A8E6CF]">
                    01. CHARACTER & ENEMY SPRITE CODEX (WITH ARENA DEBUG SPAWNER)
                  </h3>
                  <button
                    type="button"
                    data-testid="bestiary-toggle-undiscovered-drops"
                    onClick={() => setPreviewUndiscoveredDrops((prev) => !prev)}
                    className={cn(
                      'px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide border transition-colors cursor-pointer',
                      previewUndiscoveredDrops
                        ? 'bg-[#2B1F2D] text-[#FDFFB6] border-[#FDFFB6]/50'
                        : 'bg-[#1E1520] text-[#FFFDF0]/75 border-[#FFFDF0]/15 hover:text-[#FFFDF0]'
                    )}
                  >
                    {previewUndiscoveredDrops
                      ? 'Drops Preview: Undiscovered Silhouettes'
                      : 'Drops Preview: All Discovered'}
                  </button>
                </div>
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

                        {isEnemyEntry && (
                          <DropsSection
                            monsterKey={key}
                            dropIds={getMonsterDrops(key)}
                            discovered={discoveredPowerUps}
                            onSelectPowerUp={handleJumpToPowerUpCodex}
                          />
                        )}

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

              <div
                data-testid="bestiary-available-items-section"
                className="pt-4 border-t border-[#FFFDF0]/15"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <h3 className="text-xs font-bold tracking-wider text-[#A8E6CF]">
                    02. AVAILABLE ITEMS CODEX (WEAPONS, ARENA POWER-UPS, RELIC TRINKETS & CURSE SIGILS)
                  </h3>
                  <span
                    data-testid="bestiary-available-items-count"
                    className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#1E1520] text-[#FDFFB6] border border-[#FDFFB6]/30"
                  >
                    {Object.keys(WEAPONS).length +
                      Object.keys(POWER_UPS).length +
                      TRINKETS.length +
                      CURSES.length}{' '}
                    Items Cataloged
                  </span>
                </div>
                <p className="text-xs text-[#FFFDF0]/75 mb-3">
                  Complete sanctuary & arena item compendium: inspect weapon evolutions, tactical arena power-ups, passive relic trinkets, and curse sigils.
                </p>

                {/* Category Filter Bar */}
                <div
                  data-testid="bestiary-item-filters"
                  className="flex flex-wrap gap-1.5 mb-4"
                >
                  {(
                    [
                      ['all', `All Items (${Object.keys(WEAPONS).length + Object.keys(POWER_UPS).length + TRINKETS.length + CURSES.length})`],
                      ['weapons', `Weapons & Evolutions (${Object.keys(WEAPONS).length})`],
                      ['powerups', `Arena Power-Ups (${Object.keys(POWER_UPS).length})`],
                      ['trinkets', `Relic Trinkets (${TRINKETS.length})`],
                      ['sigils', `Curse Sigils (${CURSES.length})`],
                    ] as const
                  ).map(([filterKey, filterLabel]) => (
                    <button
                      key={filterKey}
                      type="button"
                      data-testid={`bestiary-item-filter-${filterKey}`}
                      onClick={() => setBestiaryItemFilter(filterKey)}
                      className={cn(
                        'px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-colors border',
                        bestiaryItemFilter === filterKey
                          ? 'bg-[#2B3A2E] text-[#FDFFB6] border-[#A8E6CF]/60 shadow-sm'
                          : 'bg-[#1E1520] text-[#FFFDF0]/70 border-[#FFFDF0]/15 hover:text-[#FFFDF0] hover:border-[#FFFDF0]/30'
                      )}
                    >
                      {filterLabel}
                    </button>
                  ))}
                </div>

                <div className="space-y-5">
                  {/* 2A. Weapons & Evolved Weapons */}
                  {(bestiaryItemFilter === 'all' || bestiaryItemFilter === 'weapons') && (
                    <div data-testid="bestiary-items-weapons">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#FDFFB6]">
                          Arsenal Weapons & Lv 8 Evolutions ({Object.keys(WEAPONS).length})
                        </h4>
                        <span className="text-[10px] text-[#FFFDF0]/60">
                          Max Lv 8 + Catalyst Blessing = Evolved Form
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {Object.values(WEAPONS).map((weapon) => {
                          const meta = getTarotMetadata(weapon.id);
                          const catalystCard = CARDS.find(
                            (c) => c.id === weapon.evolvedFromPassiveId
                          );
                          const hexColor = `#${weapon.color.toString(16).padStart(6, '0')}`;
                          return (
                            <div
                              key={weapon.id}
                              data-testid={`bestiary-item-weapon-${weapon.id}`}
                              className="p-3 rounded-xl bg-[#1E1520] border border-[#FFFDF0]/15 flex items-start gap-3"
                            >
                              <div className="w-16 shrink-0 rounded-lg bg-[#FFFDF0] p-1 border border-[#C4B5A6] shadow-sm">
                                <TarotIllustrationSvg
                                  targetId={weapon.id}
                                  rarity="rare"
                                  iconColor={hexColor}
                                />
                              </div>
                              <div className="min-w-0 flex-1 space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <div>
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-[#A8E6CF] block">
                                      {meta.arcanaTitle} · {weapon.shape.toUpperCase()}
                                    </span>
                                    <div className="text-xs font-bold text-[#FDFFB6]">
                                      {weapon.name}
                                    </div>
                                  </div>
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-[#2B1F2D] text-[#FFFDF0]/85 border border-[#FFFDF0]/10 whitespace-nowrap">
                                    DMG {weapon.baseDamage} · {weapon.baseCooldown}s CD
                                  </span>
                                </div>
                                <p className="text-[11px] text-[#FFFDF0]/75 leading-snug">
                                  {weapon.description}
                                </p>
                                <div className="p-2 rounded-lg bg-[#2B1F2D]/90 border border-[#FDFFB6]/25">
                                  <div className="flex items-center justify-between gap-1 text-[10px] font-bold text-[#FDFFB6]">
                                    <span>★ Evolved: {weapon.evolvedName}</span>
                                    {catalystCard && (
                                      <span className="text-[#A8E6CF] text-[9px]">
                                        Requires: {catalystCard.name}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-[#FFFDF0]/75 leading-snug mt-0.5">
                                    {weapon.evolvedDescription}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2B. Tactical Arena Power-Up Drops */}
                  {(bestiaryItemFilter === 'all' || bestiaryItemFilter === 'powerups') && (
                    <div data-testid="bestiary-items-powerups">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#A8E6CF]">
                          Tactical Arena Power-Up Drops ({Object.keys(POWER_UPS).length})
                        </h4>
                        <span className="text-[10px] text-[#FFFDF0]/60">
                          Dropped by Special Monsters & Elites in-run
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {Object.values(POWER_UPS).map((powerUp) => {
                          const def = getPowerUpDef(powerUp.id);
                          const droppedByMonsters = getMonstersDroppingPowerUp(def.id);
                          const isHighlighted = highlightedPowerUpId === def.id;
                          return (
                            <div
                              key={powerUp.id}
                              data-testid={`bestiary-item-powerup-${def.id}`}
                              data-sim-powerup-id={powerUp.id}
                              style={{
                                borderColor: isHighlighted ? def.accent : `${def.accent}66`,
                                boxShadow: isHighlighted
                                  ? `0 0 18px ${def.accent}55`
                                  : `0 0 12px ${def.accent}1f`,
                              }}
                              className="p-3 rounded-xl bg-[#1E1520] border-2 flex flex-col justify-between gap-2.5 transition-all"
                            >
                              <div className="flex items-start gap-3">
                                <div
                                  className="w-16 h-16 rounded-xl bg-[#241a2b] border-2 flex items-center justify-center shrink-0 shadow-inner p-1"
                                  style={{
                                    borderColor: def.accent,
                                    boxShadow: `0 0 10px ${def.accent}44`,
                                  }}
                                >
                                  <img
                                    src={powerUpIcon(def.id, 256)}
                                    srcSet={`${powerUpIcon(def.id, 128)} 1x, ${powerUpIcon(def.id, 256)} 2x`}
                                    onError={(e) => {
                                      const img = e.currentTarget;
                                      const fallback = powerUpIconPng(def.id, 256);
                                      if (!img.src.endsWith(fallback)) {
                                        img.srcset = '';
                                        img.src = fallback;
                                      }
                                    }}
                                    width={56}
                                    height={56}
                                    alt={def.name}
                                    className="w-14 h-14 object-contain select-none"
                                  />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1.5 mb-1">
                                    <div
                                      className="text-xs font-bold truncate"
                                      style={{ color: def.accent }}
                                    >
                                      {def.name}
                                    </div>
                                    <span
                                      className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#2B1F2D] text-[#FFFDF0]/90 border whitespace-nowrap"
                                      style={{ borderColor: `${def.accent}55` }}
                                    >
                                      {def.durationSec}s
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-[#FFFDF0]/80 leading-snug">
                                    {def.description}
                                  </p>
                                </div>
                              </div>

                              {/* Reverse-lookup "Dropped by" monsters */}
                              {droppedByMonsters.length > 0 && (
                                <div className="pt-2 border-t border-[#FFFDF0]/10">
                                  <div className="text-[9px] font-bold uppercase tracking-wider text-[#FFFDF0]/55 mb-1">
                                    Dropped by:
                                  </div>
                                  <div className="flex flex-wrap gap-1">
                                    {droppedByMonsters.map((m) => (
                                      <button
                                        key={m.id}
                                        type="button"
                                        title={m.name}
                                        data-testid={`powerup-dropped-by-${def.id}-${m.id}`}
                                        onClick={() => handleJumpToMonsterCodex(m.id)}
                                        className="px-2 py-0.5 rounded-md bg-[#2B1F2D] hover:bg-[#38283B] text-[10px] font-semibold text-[#EDE6D0] border border-[#FFFDF0]/15 transition-colors cursor-pointer"
                                      >
                                        {m.shortName}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2C. Passive Relic Trinkets */}
                  {(bestiaryItemFilter === 'all' || bestiaryItemFilter === 'trinkets') && (
                    <div data-testid="bestiary-items-trinkets">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#F3D286]">
                          Sanctuary Relic Trinkets ({TRINKETS.length})
                        </h4>
                        <span className="text-[10px] text-[#FFFDF0]/60">
                          Upgradable Lv 1–3 Passive Relics (Equip up to 3)
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {TRINKETS.map((trinket) => {
                          const unlocked = unlocks.trinkets.includes(trinket.id);
                          const currentLv = (unlocks.trinketLevels?.[trinket.id] ?? 1) as 1 | 2 | 3;
                          return (
                            <div
                              key={trinket.id}
                              data-testid={`bestiary-item-trinket-${trinket.id}`}
                              className="p-3 rounded-xl bg-[#1E1520] border border-[#D4A853]/35 flex items-start gap-3"
                            >
                              <div className="w-16 h-16 rounded-xl bg-[#261D1A] border border-[#D4A853]/40 flex items-center justify-center shrink-0 p-1.5">
                                <TrinketRelicArt
                                  trinketId={trinket.id}
                                  level={unlocked ? currentLv : 3}
                                  className="w-full h-full"
                                />
                              </div>
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-xs font-bold text-[#F3D286] truncate">
                                    {trinket.name}
                                  </div>
                                  <span
                                    className={cn(
                                      'text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap border',
                                      unlocked
                                        ? 'bg-[#2B3A2E] text-[#A8E6CF] border-[#A8E6CF]/40'
                                        : 'bg-[#2B1F2D] text-[#FFFDF0]/60 border-[#FFFDF0]/15'
                                    )}
                                  >
                                    {unlocked ? `Owned · Lv ${currentLv}` : `${trinket.costCoins} Coins`}
                                  </span>
                                </div>
                                <div className="space-y-0.5 text-[10px] text-[#FFFDF0]/75 leading-snug">
                                  {trinket.levelDescriptions.map((desc, idx) => (
                                    <div
                                      key={idx}
                                      className={cn(
                                        unlocked && currentLv === idx + 1
                                          ? 'text-[#FDFFB6] font-semibold'
                                          : 'text-[#FFFDF0]/70'
                                      )}
                                    >
                                      {desc}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2D. Curse Sigils */}
                  {(bestiaryItemFilter === 'all' || bestiaryItemFilter === 'sigils') && (
                    <div data-testid="bestiary-items-sigils">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#FF9AA8]">
                          Curse Sigils · Difficulty & Reward Multipliers ({CURSES.length})
                        </h4>
                        <span className="text-[10px] text-[#FFFDF0]/60">
                          Stackable Pact Relics · Upgradable Lv 1–3
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {CURSES.map((sigil) => {
                          const unlocked = unlocks.curses.includes(sigil.id);
                          const currentLv = (unlocks.curseLevels?.[sigil.id] ?? 1) as 1 | 2 | 3;
                          const isActive = activeSigilIds.has(sigil.id);
                          return (
                            <div
                              key={sigil.id}
                              data-testid={`bestiary-item-sigil-${sigil.id}`}
                              className="p-3 rounded-xl bg-[#1A0709] border border-[#7A1424]/70 flex items-start gap-3"
                            >
                              <div className="w-16 h-16 rounded-xl bg-[#120406] border border-[#B3202F]/50 flex items-center justify-center shrink-0 p-1.5">
                                <img
                                  src={sigil.art}
                                  alt={sigil.name}
                                  className="w-full h-full object-contain"
                                />
                              </div>
                              <div className="min-w-0 flex-1 space-y-1">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="text-xs font-bold text-[#FF9AA8] truncate">
                                    {sigil.name}
                                  </div>
                                  <span
                                    className={cn(
                                      'text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap border',
                                      isActive
                                        ? 'bg-[#450D17] text-[#FFD7DD] border-[#E1384B]'
                                        : unlocked
                                        ? 'bg-[#2A0B10] text-[#FF9AA8] border-[#7A1424]'
                                        : 'bg-[#1E1520] text-[#FFFDF0]/60 border-[#FFFDF0]/15'
                                    )}
                                  >
                                    {isActive
                                      ? `Active · Lv ${currentLv}`
                                      : unlocked
                                      ? `Owned · Lv ${currentLv}`
                                      : `${sigil.costCoins} Coins`}
                                  </span>
                                </div>
                                <div className="space-y-0.5 text-[10px] leading-snug">
                                  {sigil.levels.map((tier) => (
                                    <div
                                      key={tier.level}
                                      className={cn(
                                        unlocked && currentLv === tier.level
                                          ? 'text-[#FFD7DD] font-semibold'
                                          : 'text-[#D6C2C5]/75'
                                      )}
                                    >
                                      {tier.description}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-[#FFFDF0]/15">
                <h3 className="text-xs font-bold tracking-wider text-[#FDFFB6] mb-1">
                  03. BOTANICAL TAROT DECK (30 ARCANA BLESSINGS)
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
            Active: {PROFESSIONS[loadout.professionId]?.name} ·{' '}
            {PERSONAS.find(
              (p) =>
                p.id === loadout.personaId &&
                p.professionId === loadout.professionId &&
                unlocks.personas.includes(p.id)
            )?.name ?? 'Seedling Wanderer'}{' '}
            · {THEME_PACKS[loadout.biomeId].name}
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

function DropsSection({
  monsterKey,
  dropIds,
  discovered,
  onSelectPowerUp,
}: {
  monsterKey: SpriteKey;
  dropIds: CanonicalPowerUpId[];
  discovered: Set<CanonicalPowerUpId>;
  onSelectPowerUp?: (id: CanonicalPowerUpId) => void;
}) {
  if (!dropIds.length) return null;
  return (
    <section
      data-testid={`bestiary-monster-drops-${monsterKey}`}
      className="pt-2 border-t border-[#FFFDF0]/10"
    >
      <h4 className="text-[10px] font-bold uppercase tracking-wider text-[#A8E6CF] mb-1.5">
        Power-Up Drops
      </h4>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        {dropIds.map((id) => {
          const p = POWERUPS[id];
          const ok = discovered.has(id);
          return (
            <button
              key={id}
              type="button"
              data-testid={`bestiary-monster-drop-${monsterKey}-${id}`}
              onClick={() => onSelectPowerUp?.(id)}
              title={
                ok
                  ? `${p.name} (${p.durationSec}s) — ${p.description}`
                  : 'Undiscovered'
              }
              style={{
                minWidth: 78,
                height: 62,
                padding: '5px 8px',
                borderRadius: 10,
                background: '#1a1220',
                border: '1.5px solid',
                borderColor: ok ? p.accent : '#3a2d42',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <img
                src={powerUpIcon(id, 128)}
                onError={(e) => {
                  const img = e.currentTarget;
                  const fallback = powerUpIconPng(id, 128);
                  if (!img.src.endsWith(fallback)) {
                    img.src = fallback;
                  }
                }}
                width={36}
                height={36}
                alt={ok ? p.name : 'Undiscovered drop'}
                style={{
                  filter: ok ? 'none' : 'brightness(0) opacity(0.5)',
                  objectFit: 'contain',
                }}
              />
              <span
                style={{
                  fontSize: 9.5,
                  lineHeight: 1.1,
                  marginTop: 3,
                  color: ok ? '#EDE6D0' : '#8A7B96',
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                {ok ? p.name : '???'}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}

