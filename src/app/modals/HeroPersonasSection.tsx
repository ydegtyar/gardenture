import React from 'react';
import { PERSONAS, PROFESSIONS } from '../../content/data/catalog';
import {
  getSpritePortraitDataUrl,
  getSpriteSilhouetteDataUrl,
  resolvePersonaSkinSpriteKey,
} from '../../view/SpriteAtlas';
import { useGameShell } from '../context/GameShellContext';
import {
  LazyPersonaDebugAllButton,
  LazyPersonaDebugSingleButton,
} from '../debug/LazyDebugComponents';
import { IS_DEV } from '../debug/devGate';
import {
  getEyeDotStyle,
  getPipClassName,
  getPersonaCardClassName,
  getPortraitContainerClassName,
  getPortraitImgClassName,
  getWearButtonClassName,
} from './HeroPersonasSection.styles';

export interface Props {
  sectionNumberLabel?: string;
}

export const HeroPersonasSection: React.FC<Props> = ({ sectionNumberLabel }) => {
  const {
    saveData,
    handleSelectLoadout,
    handleWatchPersonaPipAd,
    handleDebugIncrementPersonaAdPip,
    handleDebugIncrementAllPersonaAdPips,
  } = useGameShell();

  const { loadout, unlocks } = saveData;
  const onSelectLoadout = handleSelectLoadout;
  const onWatchPersonaPipAd = handleWatchPersonaPipAd;
  const onIncrementPersonaAdPip = IS_DEV ? handleDebugIncrementPersonaAdPip : undefined;
  const onIncrementAllPersonaAdPips = IS_DEV ? handleDebugIncrementAllPersonaAdPips : undefined;

  return (
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
              className={`p-3.5 rounded-xl border-2 flex flex-col justify-between gap-3 transition-colors ${getPersonaCardClassName(
                selected,
                unlocked
              )}`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <div
                  className={`relative w-20 h-20 rounded-xl border-2 shrink-0 flex items-center justify-center overflow-hidden p-1 ${getPortraitContainerClassName(
                    unlocked
                  )}`}
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
                      className={`w-full h-full object-contain transition-all duration-300 ${getPortraitImgClassName(
                        unlocked
                      )}`}
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
                          style={getEyeDotStyle(eyeLeftHex)}
                        />
                        <span
                          className="w-2.5 h-2.5 rounded-full border border-[#140E16]"
                          style={getEyeDotStyle(eyeRightHex)}
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
                            className={`h-1.5 flex-1 rounded-full ${getPipClassName(idx < pips)}`}
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
                    onClick={() => {
                      if (selected) {
                        onSelectLoadout({ personaId: 'adventurer_default' });
                      } else {
                        onSelectLoadout({
                          personaId: persona.id,
                          professionId: persona.professionId,
                          startingWeaponId:
                            PROFESSIONS[persona.professionId]?.startingWeaponId ??
                            loadout.startingWeaponId,
                        });
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${getWearButtonClassName(
                      selected
                    )}`}
                  >
                    {selected ? 'Unequip' : 'Wear Skin'}
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
};

export default HeroPersonasSection;
