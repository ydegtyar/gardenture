import React from 'react';
import { PERSONAS, PROFESSIONS, isPersonaRelatedToProfession } from '../../content/data/catalog';
import { NO_ADS, PERSONA_NO_ADS_COST_SEEDS } from '../../config/ads';
import { SeedGemIcon } from '../SvgIcons';
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

export const HitenJadePortraitAuraBackSvg: React.FC = () => (
  <svg
    viewBox="0 0 256 256"
    data-testid="hiten-jade-animated-aura-back-svg"
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 z-0 w-full h-full p-1"
  >
    {/* Rising Back Water Vapor Mist Rings & Plumes */}
    <g opacity="0.75">
      <path
        d="M 74 176 Q 128 156 182 174"
        fill="none"
        stroke="#7DD3FC"
        strokeWidth="8"
        strokeLinecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,12; -5,-52; 4,-110"
          dur="2.4s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0;0.65;0"
          dur="2.4s"
          repeatCount="indefinite"
        />
      </path>
      <path
        d="M 78 182 Q 128 162 178 180"
        fill="none"
        stroke="#6EE7B7"
        strokeWidth="8"
        strokeLinecap="round"
      >
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,16; 5,-48; -4,-108"
          dur="2.4s"
          begin="1.2s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          values="0;0.65;0"
          dur="2.4s"
          begin="1.2s"
          repeatCount="indefinite"
        />
      </path>
    </g>

    {/* Back Animated Glacier-Blue Orbital Arc */}
    <g>
      <path
        d="M 56 188 C 34 146 214 118 194 62"
        fill="none"
        stroke="rgba(56, 189, 248, 0.38)"
        strokeWidth="24"
        strokeLinecap="round"
      >
        <animate
          attributeName="d"
          values="
            M 56 188 C 34 146 214 118 194 62;
            M 48 176 C 24 130 224 134 202 74;
            M 64 194 C 46 158 204 104 186 54;
            M 56 188 C 34 146 214 118 194 62
          "
          dur="2.2s"
          repeatCount="indefinite"
        />
      </path>
      <path
        d="M 56 188 C 34 146 214 118 194 62"
        fill="none"
        stroke="#7DD3FC"
        strokeWidth="11"
        strokeLinecap="round"
      >
        <animate
          attributeName="d"
          values="
            M 56 188 C 34 146 214 118 194 62;
            M 48 176 C 24 130 224 134 202 74;
            M 64 194 C 46 158 204 104 186 54;
            M 56 188 C 34 146 214 118 194 62
          "
          dur="2.2s"
          repeatCount="indefinite"
        />
      </path>
    </g>

    {/* Back Animated Emerald-Jade Orbital Arc */}
    <g>
      <path
        d="M 200 186 C 222 144 42 114 62 60"
        fill="none"
        stroke="rgba(16, 185, 129, 0.36)"
        strokeWidth="22"
        strokeLinecap="round"
      >
        <animate
          attributeName="d"
          values="
            M 200 186 C 222 144 42 114 62 60;
            M 208 174 C 232 128 32 130 54 72;
            M 192 192 C 210 156 52 100 70 52;
            M 200 186 C 222 144 42 114 62 60
          "
          dur="2.0s"
          repeatCount="indefinite"
        />
      </path>
      <path
        d="M 200 186 C 222 144 42 114 62 60"
        fill="none"
        stroke="#34D399"
        strokeWidth="10.5"
        strokeLinecap="round"
      >
        <animate
          attributeName="d"
          values="
            M 200 186 C 222 144 42 114 62 60;
            M 208 174 C 232 128 32 130 54 72;
            M 192 192 C 210 156 52 100 70 52;
            M 200 186 C 222 144 42 114 62 60
          "
          dur="2.0s"
          repeatCount="indefinite"
        />
      </path>
    </g>
  </svg>
);

export const HitenJadePortraitAuraFrontSvg: React.FC = () => (
  <svg
    viewBox="0 0 256 256"
    data-testid="hiten-jade-animated-aura-svg"
    aria-hidden="true"
    className="pointer-events-none absolute inset-0 z-20 w-full h-full p-1"
  >
    {/* 1. Animated Front Glacier-Blue Orbital (Right-to-Left Crossing Orbital) */}
    <g data-testid="hiten-jade-orbital-blue">
      <path
        d="M 48 174 C 88 198 176 176 206 134 C 220 114 204 88 184 76"
        fill="none"
        stroke="rgba(2, 132, 199, 0.36)"
        strokeWidth="22"
        strokeLinecap="round"
      >
        <animate
          attributeName="d"
          values="
            M 48 174 C 88 198 176 176 206 134 C 220 114 204 88 184 76;
            M 42 160 C 96 212 184 160 214 122 C 226 102 196 76 176 66;
            M 54 184 C 80 182 168 190 198 146 C 212 126 210 98 190 86;
            M 48 174 C 88 198 176 176 206 134 C 220 114 204 88 184 76
          "
          dur="2.1s"
          repeatCount="indefinite"
        />
      </path>
      <path
        d="M 48 174 C 88 198 176 176 206 134 C 220 114 204 88 184 76"
        fill="none"
        stroke="#38BDF8"
        strokeWidth="11"
        strokeLinecap="round"
      >
        <animate
          attributeName="d"
          values="
            M 48 174 C 88 198 176 176 206 134 C 220 114 204 88 184 76;
            M 42 160 C 96 212 184 160 214 122 C 226 102 196 76 176 66;
            M 54 184 C 80 182 168 190 198 146 C 212 126 210 98 190 86;
            M 48 174 C 88 198 176 176 206 134 C 220 114 204 88 184 76
          "
          dur="2.1s"
          repeatCount="indefinite"
        />
      </path>
      <path
        d="M 48 174 C 88 198 176 176 206 134 C 220 114 204 88 184 76"
        fill="none"
        stroke="#E0F2FE"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="44 56"
      >
        <animate
          attributeName="d"
          values="
            M 48 174 C 88 198 176 176 206 134 C 220 114 204 88 184 76;
            M 42 160 C 96 212 184 160 214 122 C 226 102 196 76 176 66;
            M 54 184 C 80 182 168 190 198 146 C 212 126 210 98 190 86;
            M 48 174 C 88 198 176 176 206 134 C 220 114 204 88 184 76
          "
          dur="2.1s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke-dashoffset"
          from="100"
          to="0"
          dur="1.25s"
          repeatCount="indefinite"
        />
      </path>
    </g>

    {/* 2. Animated Front Emerald-Jade Orbital (Left-to-Right Crossing Orbital) */}
    <g data-testid="hiten-jade-orbital-green">
      <path
        d="M 208 170 C 168 194 80 166 50 128 C 36 108 52 82 72 70"
        fill="none"
        stroke="rgba(5, 150, 105, 0.36)"
        strokeWidth="22"
        strokeLinecap="round"
      >
        <animate
          attributeName="d"
          values="
            M 208 170 C 168 194 80 166 50 128 C 36 108 52 82 72 70;
            M 214 156 C 160 208 72 150 42 116 C 30 96 60 70 80 60;
            M 202 180 C 176 178 88 180 58 140 C 44 120 46 92 66 80;
            M 208 170 C 168 194 80 166 50 128 C 36 108 52 82 72 70
          "
          dur="1.95s"
          repeatCount="indefinite"
        />
      </path>
      <path
        d="M 208 170 C 168 194 80 166 50 128 C 36 108 52 82 72 70"
        fill="none"
        stroke="#10B981"
        strokeWidth="11"
        strokeLinecap="round"
      >
        <animate
          attributeName="d"
          values="
            M 208 170 C 168 194 80 166 50 128 C 36 108 52 82 72 70;
            M 214 156 C 160 208 72 150 42 116 C 30 96 60 70 80 60;
            M 202 180 C 176 178 88 180 58 140 C 44 120 46 92 66 80;
            M 208 170 C 168 194 80 166 50 128 C 36 108 52 82 72 70
          "
          dur="1.95s"
          repeatCount="indefinite"
        />
      </path>
      <path
        d="M 208 170 C 168 194 80 166 50 128 C 36 108 52 82 72 70"
        fill="none"
        stroke="#A7F3D0"
        strokeWidth="5"
        strokeLinecap="round"
        strokeDasharray="44 56"
      >
        <animate
          attributeName="d"
          values="
            M 208 170 C 168 194 80 166 50 128 C 36 108 52 82 72 70;
            M 214 156 C 160 208 72 150 42 116 C 30 96 60 70 80 60;
            M 202 180 C 176 178 88 180 58 140 C 44 120 46 92 66 80;
            M 208 170 C 168 194 80 166 50 128 C 36 108 52 82 72 70
          "
          dur="1.95s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="stroke-dashoffset"
          from="0"
          to="100"
          dur="1.25s"
          repeatCount="indefinite"
        />
      </path>
    </g>

    {/* 3. Rising & Coiling Water Vapor Puffs & Steam Tendrils */}
    <g data-testid="hiten-jade-vapor-wisps">
      {[
        { cx: 52, cy: 162, col: '#A7F3D0', glow: '#10B981', dur: '1.9s', begin: '0s', dx: -8 },
        { cx: 204, cy: 164, col: '#E0F2FE', glow: '#38BDF8', dur: '2.1s', begin: '0.4s', dx: 8 },
        { cx: 82, cy: 178, col: '#E0F2FE', glow: '#38BDF8', dur: '1.8s', begin: '0.8s', dx: -6 },
        { cx: 174, cy: 176, col: '#A7F3D0', glow: '#10B981', dur: '2.0s', begin: '1.1s', dx: 6 },
        { cx: 44, cy: 122, col: '#A7F3D0', glow: '#10B981', dur: '1.7s', begin: '0.3s', dx: 7 },
        { cx: 212, cy: 126, col: '#E0F2FE', glow: '#38BDF8', dur: '1.85s', begin: '0.9s', dx: -7 },
      ].map((wisp, idx) => (
        <g key={idx}>
          <animateTransform
            attributeName="transform"
            type="translate"
            values={`0,8; ${wisp.dx},-24; ${-wisp.dx * 0.6},-58`}
            dur={wisp.dur}
            begin={wisp.begin}
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0;0.88;0"
            dur={wisp.dur}
            begin={wisp.begin}
            repeatCount="indefinite"
          />
          <ellipse cx={wisp.cx} cy={wisp.cy} rx="11" ry="6.5" fill={wisp.glow} opacity="0.42" />
          <path
            d={`M ${wisp.cx - 4} ${wisp.cy + 6} Q ${wisp.cx + wisp.dx} ${wisp.cy - 6} ${wisp.cx - 2} ${wisp.cy - 18}`}
            fill="none"
            stroke={wisp.col}
            strokeWidth="4.2"
            strokeLinecap="round"
          />
        </g>
      ))}
    </g>

    {/* 4. Orbiting & Bobbing Diamond Condensation Facets along the Orbitals */}
    <g>
      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0; 14,10; -6,-14; 0,0"
          dur="2.0s"
          repeatCount="indefinite"
        />
        <polygon
          points="50,117 58,128 50,139 42,128"
          fill="#10B981"
          stroke="#2D1E2F"
          strokeWidth="3.2"
        />
        <polygon points="50,122 54,128 50,134 46,128" fill="#A7F3D0" />
      </g>

      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0; -14,10; 6,-14; 0,0"
          dur="2.1s"
          repeatCount="indefinite"
        />
        <polygon
          points="206,123 214,134 206,145 198,134"
          fill="#38BDF8"
          stroke="#2D1E2F"
          strokeWidth="3.2"
        />
        <polygon points="206,128 210,134 206,140 202,134" fill="#E0F2FE" />
      </g>

      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0; 18,-8; -8,6; 0,0"
          dur="1.9s"
          repeatCount="indefinite"
        />
        <polygon
          points="74,165 82,176 74,187 66,176"
          fill="#38BDF8"
          stroke="#2D1E2F"
          strokeWidth="3.2"
        />
        <polygon points="74,170 78,176 74,182 70,176" fill="#E0F2FE" />
      </g>

      <g>
        <animateTransform
          attributeName="transform"
          type="translate"
          values="0,0; -18,-8; 8,6; 0,0"
          dur="1.95s"
          repeatCount="indefinite"
        />
        <polygon
          points="182,161 190,172 182,183 174,172"
          fill="#10B981"
          stroke="#2D1E2F"
          strokeWidth="3.2"
        />
        <polygon points="182,166 186,172 182,178 178,172" fill="#A7F3D0" />
      </g>
    </g>
  </svg>
);

export const HeroPersonasSection: React.FC<Props> = ({ sectionNumberLabel }) => {
  const {
    saveData,
    handleSelectLoadout,
    handleWatchPersonaPipAd,
    handleBuyPersonaWithSeeds,
    handleDebugIncrementPersonaAdPip,
    handleDebugIncrementAllPersonaAdPips,
  } = useGameShell();

  const { loadout, unlocks } = saveData;
  const onSelectLoadout = handleSelectLoadout;
  const onWatchPersonaPipAd = handleWatchPersonaPipAd;
  const onBuyPersonaWithSeeds = handleBuyPersonaWithSeeds;
  const onIncrementPersonaAdPip = IS_DEV && !NO_ADS ? handleDebugIncrementPersonaAdPip : undefined;
  const onIncrementAllPersonaAdPips = IS_DEV && !NO_ADS ? handleDebugIncrementAllPersonaAdPips : undefined;

  return (
    <div className="pt-2 border-t border-[#FFFDF0]/10">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
        <div>
          <h3 className="text-xs font-bold tracking-wider text-[#DED2F9]">
            {sectionNumberLabel ? `${sectionNumberLabel} ` : ''}ARCANA CHARACTER SKINS ({NO_ADS ? 'RARE SEED UNLOCKS' : 'AD-EXCLUSIVE'} & PERMANENT VFX)
          </h3>
          <p className="text-[11px] text-[#FFFDF0]/70 mt-0.5">
            {NO_ADS
              ? `Locked skins appear only as mysterious shadow silhouettes until unlocked with Rare Seeds.`
              : `Locked skins appear only as mysterious shadow silhouettes until opened by watching 3 Rewarded Ads.`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {loadout.personaId !== 'adventurer_default' &&
            isPersonaRelatedToProfession(loadout.personaId, loadout.professionId) && (
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
          const isCurrentHero = loadout.professionId === persona.professionId;
          const isApplied =
            loadout.personaByProfession?.[persona.professionId] === persona.id ||
            (isCurrentHero && loadout.personaId === persona.id);
          const selected = isCurrentHero && isApplied;
          const pips = unlocks.personaAdPips[persona.id] ?? 0;
          const costSeeds =
            persona.unlockCostSeeds > 0 ? persona.unlockCostSeeds : PERSONA_NO_ADS_COST_SEEDS;
          const canAffordSeeds = saveData.currencies.gems >= costSeeds;
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
                  {unlocked && persona.id === 'herbalist_frieren_strange' && (
                    <HitenJadePortraitAuraBackSvg />
                  )}
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
                      className={`relative z-10 w-full h-full object-contain transition-all duration-300 ${getPortraitImgClassName(
                        unlocked
                      )}`}
                    />
                  )}
                  {unlocked && persona.id === 'herbalist_frieren_strange' && (
                    <HitenJadePortraitAuraFrontSvg />
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
                        title={
                          persona.eyeLeftColor === persona.eyeRightColor
                            ? 'Mystic Eyes'
                            : 'Heterochromia Eyes'
                        }
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
                        {NO_ADS
                          ? `Unopened silhouette. Unlock with ${costSeeds} Rare Seeds to reveal this pop-culture skin & its permanent footsteps VFX.`
                          : `Unopened silhouette. Watch ${persona.adPipsRequired} Rewarded Ads to reveal this pop-culture skin & its permanent footsteps VFX.`}
                      </p>
                      {NO_ADS ? (
                        <div className="mt-2 flex items-center justify-between gap-1.5">
                          <span className="text-[11px] font-bold text-[#DED2F9] flex items-center gap-1">
                            <SeedGemIcon className="w-3.5 h-3.5 inline text-[#DED2F9]" />
                            Cost: {costSeeds} Rare Seeds
                          </span>
                          <span className="text-[10px] text-[#FFFDF0]/60 font-mono-tabular">
                            Have: {saveData.currencies.gems}
                          </span>
                        </div>
                      ) : (
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
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="pt-2 border-t border-[#FFFDF0]/10 flex items-center justify-between gap-2">
                <span className="text-[10px] text-[#FFFDF0]/60 truncate">
                  {unlocked
                    ? persona.subtitle
                    : NO_ADS
                    ? `Rare Seed Arcana Unlock (${costSeeds} Seeds)`
                    : 'Ad-Exclusive Arcana Unlock'}
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
                ) : NO_ADS ? (
                  <button
                    type="button"
                    data-testid={`buy-persona-seeds-${persona.id}`}
                    disabled={!canAffordSeeds}
                    onClick={() => void onBuyPersonaWithSeeds(persona.id)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${
                      canAffordSeeds
                        ? 'btn-herbarium-primary min-h-[38px] cursor-pointer'
                        : 'bg-[#2B1F2D] text-[#FFFDF0]/40 border border-[#FFFDF0]/10 cursor-not-allowed min-h-[38px]'
                    }`}
                    title={
                      canAffordSeeds
                        ? `Unlock for ${costSeeds} Seeds`
                        : `Need ${costSeeds - saveData.currencies.gems} more seeds`
                    }
                  >
                    Unlock ({costSeeds} Seeds)
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
