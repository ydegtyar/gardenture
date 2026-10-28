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
import type {
  DevStubAdOutcomeMode,
  DevStubStorageMode,
  YtSdkDiagnosticsState,
} from '../../platform/ports/PlatformFacade';
import {
  CATALOG_SPRITE_PROMPTS,
  getSpritePortraitDataUrl,
  getSpriteSilhouetteDataUrl,
  resolveHeroSpriteKey,
  resolvePersonaSkinSpriteKey,
  type SpriteKey,
} from '../../view/SpriteAtlas';
import { CoinIcon, SeedGemIcon } from '../SvgIcons';
import { getTarotMetadata, TarotIllustrationSvg } from '../TarotCardArt';
import {
  LazyBestiaryEnemyDebugBadge,
  LazyBestiaryEnemyDebugSpawner,
  LazyPersonaDebugAllButton,
  LazyPersonaDebugSingleButton,
  LazySanctuaryHeaderDebugGoldButton,
  LazyStoreDebugTreasuryPanel,
  LazyYouTubeDevStubControls,
} from '../debug/LazyDebugComponents';

export interface LoadoutAndStoreModalProps {
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
}

/**
 * @llm-component LoadoutAndStoreModal
 * @llm-hook garden-sanctuary: multi-tab hub for professions, trinkets, curses, quests, bestiary, and YT SDK diagnostics
 */
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
}: LoadoutAndStoreModalProps) {
  const [tab, setTab] = useState<'loadout' | 'store' | 'quests' | 'bestiary'>(initialTab);
  const [activeDebugEnemyKey, setActiveDebugEnemyKey] = useState<string | null>(null);
  const { loadout, unlocks, currencies, retention } = saveData;

  const renderYouTubeSdkPanel = () => {
    if (!ytDiagnostics) return null;
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
                className="btn-herbarium-lichen px-3 py-1.5 text-xs whitespace-nowrap min-h-[38px]"
              >
                {isAdLoading ? 'Playing Ad...' : 'Watch Ad (+120 Coins & +2 Seeds)'}
              </button>
            )}
            {onSavePlayerStateNow && (
              <button
                type="button"
                data-testid="yt-sdk-save-now-btn"
                onClick={onSavePlayerStateNow}
                className="btn-herbarium-secondary-compact px-2.5 py-1.5 text-xs whitespace-nowrap min-h-[38px] text-[#A8E6CF]"
              >
                Save Player State
              </button>
            )}
            {onReloadAndReconcileSave && (
              <button
                type="button"
                data-testid="yt-sdk-load-cloud-btn"
                onClick={onReloadAndReconcileSave}
                className="btn-herbarium-secondary-compact px-2.5 py-1.5 text-xs whitespace-nowrap min-h-[38px]"
              >
                Load & Reconcile Save
              </button>
            )}
          </div>
        </div>

        {/* Dev Mode Stub Controls */}
        <LazyYouTubeDevStubControls
          ytDiagnostics={ytDiagnostics}
          onSetDevAdOutcomeMode={onSetDevAdOutcomeMode}
          onSetDevCloudStorageMode={onSetDevCloudStorageMode}
          onSimulateYtAudioToggle={onSimulateYtAudioToggle}
          onSyncScoreNow={onSyncScoreNow}
        />

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
        <div>
          <h3 className="text-xs font-bold tracking-wider text-[#DED2F9]">
            {sectionNumberLabel ? `${sectionNumberLabel} ` : ''}ARCANA CHARACTER SKINS (AD-EXCLUSIVE POP-CULTURE MASHUPS & PERMANENT VFX)
          </h3>
          <p className="text-[11px] text-[#FFFDF0]/70 mt-0.5">
            Locked skins appear only as mysterious shadow silhouettes until opened by watching 3 Rewarded Ads.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loadout.personaId !== 'adventurer_default' && (
            <button
              type="button"
              data-testid="reset-default-persona-btn"
              onClick={() => onSelectLoadout({ personaId: 'adventurer_default' })}
              className="btn-herbarium-secondary-compact px-2.5 py-1 text-[11px] whitespace-nowrap"
            >
              Use Default Hero Look
            </button>
          )}
          {onIncrementAllPersonaAdPips && (
            <LazyPersonaDebugAllButton
              onIncrementAllPersonaAdPips={onIncrementAllPersonaAdPips}
            />
          )}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {PERSONAS.map((persona) => {
          const unlocked = unlocks.personas.includes(persona.id);
          const selected = loadout.personaId === persona.id;
          const pips = unlocks.personaAdPips[persona.id] ?? 0;
          const skinKey = resolvePersonaSkinSpriteKey(persona.id);
          const portraitUrl = skinKey
            ? unlocked
              ? getSpritePortraitDataUrl(skinKey)
              : getSpriteSilhouetteDataUrl(skinKey)
            : '';
          const profName = PROFESSIONS[persona.professionId]?.name ?? persona.professionId;
          const eyeLeftHex = `#${persona.eyeLeftColor.toString(16).padStart(6, '0')}`;
          const eyeRightHex = `#${persona.eyeRightColor.toString(16).padStart(6, '0')}`;

          return (
            <div
              key={persona.id}
              data-testid={`persona-card-${persona.id}`}
              data-unlocked={unlocked ? 'true' : 'false'}
              className={`p-3.5 rounded-xl border-2 flex flex-col justify-between gap-3 transition-colors ${
                selected
                  ? 'bg-[#36493E] border-[#A8E6CF] shadow-[0_0_14px_rgba(168,230,207,0.22)]'
                  : unlocked
                    ? 'bg-[#1E1520] border-[#DED2F9]/45'
                    : 'bg-[#130D16] border-[#FFFDF0]/15'
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`relative w-20 h-20 rounded-xl border-2 shrink-0 flex items-center justify-center overflow-hidden p-1 ${
                    unlocked
                      ? 'bg-[#2B1F2D] border-[#A8E6CF]/60'
                      : 'bg-[#08050B] border-[#2D1E2F] shadow-inner'
                  }`}
                >
                  {portraitUrl && (
                    <img
                      src={portraitUrl}
                      alt={
                        unlocked
                          ? `${persona.name} skin`
                          : `Mystery ${profName} shadow silhouette`
                      }
                      data-testid={
                        unlocked
                          ? `persona-portrait-${persona.id}`
                          : `persona-silhouette-${persona.id}`
                      }
                      data-silhouette={unlocked ? 'false' : 'true'}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full object-contain transition-all duration-300 ${
                        unlocked ? '' : 'opacity-90 contrast-200 drop-shadow-[0_0_6px_rgba(168,85,247,0.35)]'
                      }`}
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1.5 mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-[#2B1F2D] text-[#FDFFB6] border border-[#FDFFB6]/25">
                      {profName} Arcana Skin
                    </span>
                    {unlocked && (
                      <span
                        className="flex items-center gap-1 text-[10px] text-[#FFFDF0]/75"
                        title="Heterochromia Eyes"
                      >
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-[#140E16]"
                          style={{ backgroundColor: eyeLeftHex }}
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-[#140E16]"
                          style={{ backgroundColor: eyeRightHex }}
                        />
                      </span>
                    )}
                  </div>

                  {unlocked ? (
                    <>
                      <div
                        data-testid={`persona-title-${persona.id}`}
                        className="font-display font-bold text-sm text-[#FFFDF0] truncate"
                      >
                        {persona.name}
                      </div>
                      <div className="text-[11px] font-semibold text-[#DED2F9] truncate">
                        {persona.popCultureMashup}
                      </div>
                      <p className="text-[11px] text-[#A8E6CF] mt-1 leading-snug">
                        <span className="font-bold">{persona.permanentVfxLabel}:</span>{' '}
                        {persona.permanentVfxDescription}
                      </p>
                    </>
                  ) : (
                    <>
                      <div
                        data-testid={`persona-title-${persona.id}`}
                        className="font-display font-bold text-sm text-[#DED2F9]/85 truncate"
                      >
                        ??? · Shadowed {profName}
                      </div>
                      <p className="text-[11px] text-[#FFFDF0]/60 mt-0.5 leading-snug">
                        Unopened silhouette. Watch {persona.adPipsRequired} Rewarded Ads to reveal this pop-culture skin & its permanent footsteps VFX.
                      </p>
                      <div className="mt-2 flex items-center gap-1.5">
                        {Array.from({ length: persona.adPipsRequired }).map((_, idx) => (
                          <span
                            key={idx}
                            className={`h-1.5 flex-1 rounded-full ${
                              idx < pips ? 'bg-[#A8E6CF]' : 'bg-[#FFFDF0]/15'
                            }`}
                          />
                        ))}
                        <span className="text-[10px] font-mono-tabular text-[#DED2F9] ml-1">
                          {pips}/{persona.adPipsRequired} Ads
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-[#FFFDF0]/10 flex items-center justify-between gap-2">
                <span className="text-[10px] text-[#FFFDF0]/60 truncate">
                  {unlocked ? persona.subtitle : 'Ad-Exclusive Arcana Unlock'}
                </span>
                {unlocked ? (
                  <button
                    type="button"
                    data-testid={`wear-persona-${persona.id}`}
                    onClick={() =>
                      onSelectLoadout({
                        personaId: persona.id,
                        professionId: persona.professionId,
                        startingWeaponId:
                          PROFESSIONS[persona.professionId]?.startingWeaponId ??
                          loadout.startingWeaponId,
                      })
                    }
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${
                      selected
                        ? 'bg-[#6FA36B] text-[#101F12] shadow-sm'
                        : 'btn-herbarium-secondary-compact'
                    }`}
                  >
                    {selected ? 'Wearing Skin' : 'Wear Skin'}
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      data-testid={`watch-persona-ad-${persona.id}`}
                      onClick={() => onWatchPersonaPipAd(persona.id)}
                      className="btn-herbarium-lichen px-2.5 py-1.5 text-xs whitespace-nowrap min-h-[38px]"
                    >
                      Watch Ad ({pips}/{persona.adPipsRequired})
                    </button>
                    {onIncrementPersonaAdPip && (
                      <LazyPersonaDebugSingleButton
                        personaId={persona.id}
                        onIncrementPersonaAdPip={onIncrementPersonaAdPip}
                      />
                    )}
                  </div>
                )}
              </div>
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
            <div className="flex items-center gap-1 p-1 bg-[#1E1C0E] border border-[#3D392A] rounded-xl">
              {(['loadout', 'store', 'quests', 'bestiary'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  data-testid={`sanctuary-tab-${t}`}
                  onClick={() => setTab(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-colors whitespace-nowrap ${
                    tab === t
                      ? 'bg-[#E8B64A] text-[#201A09] shadow-sm'
                      : 'text-[#EDE6D0]/70 hover:text-[#EDE6D0]'
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
              {renderHeroPersonasSection()}

              {renderYouTubeSdkPanel()}

              <LazyStoreDebugTreasuryPanel onAddDebugGold={onAddDebugGold} />

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
                              disabled={currencies.coins < trinket.costCoins}
                              onClick={() => onUnlockTrinket(trinket.id, trinket.costCoins)}
                              className="btn-herbarium-secondary-compact px-3 py-1.5 text-xs text-[#E8B64A] disabled:opacity-40"
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
                      className={`px-4 py-2 text-xs font-bold whitespace-nowrap ${
                        q.claimed
                          ? 'btn-herbarium-secondary-compact opacity-40 cursor-not-allowed'
                          : done
                          ? 'btn-herbarium-primary shadow-md'
                          : 'btn-herbarium-secondary-compact opacity-50 cursor-not-allowed'
                      }`}
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
