import React from 'react';
import {
  CARDS,
  POWER_UPS,
  STYLE_RANKS,
  WEAPONS,
} from '../../content/data/catalog';
import {
  HeartSocketIcon,
  MuteSvgIcon,
  PauseSvgIcon,
  PowerUpAbilityIcon,
  RestartSvgIcon,
} from '../SvgIcons';
import { useGameShell } from '../context/GameShellContext';
import { LazyHudDebugButton } from '../debug/LazyDebugComponents';

/**
 * STATE 2: PLAYING HUD (World-Matched Botanical Perimeter, >85% Clear)
 */
export function PlayingHudOverlay() {
  const {
    shellState,
    hud,
    trailingHpRatio,
    rankAura,
    userMuted,
    toggleMute,
    pauseRun,
    openDebugMenu,
    startNewOrResumedRun,
    usePowerUpSlot,
  } = useGameShell();

  if (shellState === 'title') return null;

  const currentRankDef = STYLE_RANKS[hud.rankIndex] ?? STYLE_RANKS[0]!;
  const hpRatio = Math.max(0, Math.min(1, hud.hp / Math.max(1, hud.maxHp)));
  const xpRatio = Math.max(0, Math.min(1, hud.xp / Math.max(1, hud.xpToNext)));
  const runMins = Math.floor(hud.elapsedSec / 60);
  const runSecs = hud.elapsedSec % 60;
  const clockText = `${runMins}:${runSecs.toString().padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 md:p-5">
      {/* TOP PERIMETER ROW: 3 Compact Corner Clusters */}
      <div className="flex items-start justify-between gap-1.5 sm:gap-3 w-full">
        {/* Cluster 1 (Top-Left): Vitality Bar, Trailing Damage Bar, Level & Dash Charges */}
        <div className="w-36 sm:w-60 p-2 sm:p-2.5 rounded-xl bg-[#2B1F2D]/92 border-2 border-[#2D1E2F] shadow-md shrink-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <div className="flex items-center gap-1">
              <HeartSocketIcon
                state={hpRatio > 0.5 ? 'full' : hpRatio > 0.25 ? 'damaged' : 'empty'}
              />
              <span className="hidden sm:inline text-[10px] font-extrabold tracking-wider text-[#FFAAA6]">
                VITALITY
              </span>
            </div>
            <span className="text-xs sm:text-sm font-mono-tabular font-bold text-[#FFFDF0] whitespace-nowrap">
              {hud.hp}/{hud.maxHp}
              {hud.shieldHp > 0 ? ` +${hud.shieldHp}` : ''}
            </span>
          </div>

          {/* Health Bar with Delayed Trailing Damage Ghost Bar */}
          <div className="relative h-2.5 sm:h-3 w-full rounded-full bg-[#18111A] border border-[#2D1E2F] overflow-hidden mb-1.5">
            <div
              className="absolute inset-y-0 left-0 bg-[#FFD3B6]/60 transition-all duration-300"
              style={{ width: `${Math.round(trailingHpRatio * 100)}%` }}
            />
            <div
              className="absolute inset-y-0 left-0 bg-[#88D49E] transition-all duration-75"
              style={{
                width: `${Math.round(hpRatio * 100)}%`,
                backgroundColor: hpRatio <= 0.3 ? '#F43F5E' : '#88D49E',
              }}
            />
          </div>

          {/* Level, XP Progress & Dash Charge Pips */}
          <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-bold text-[#A8E6CF] mb-1 whitespace-nowrap">
            <span>LV {hud.level}</span>
            <span
              className={`font-mono-tabular ${
                hud.isDashInvisible ? 'text-[#A0C4FF]' : ''
              }`}
            >
              {hud.isDashInvisible
                ? 'I-FRAME'
                : `DASH ${hud.dashCharges}/${hud.maxDashCharges}`}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[#18111A] overflow-hidden">
            <div
              className="h-full bg-[#FDFFB6] transition-all duration-100"
              style={{ width: `${Math.round(xpRatio * 100)}%` }}
            />
          </div>
        </div>

        {/* Cluster 2 (Top-Center): Devil May Cry Style Rank Badge & Decaying SP Bar with Rank-Up Aura */}
        <div className="relative flex flex-col items-center shrink-0">
          {rankAura?.active && (
            <div
              key={rankAura.key}
              aria-hidden="true"
              className="pointer-events-none absolute -inset-1 sm:-inset-1.5 rounded-2xl animate-rank-aura-glow z-0"
              style={
                {
                  '--rank-aura-color': rankAura.colorHex,
                } as React.CSSProperties
              }
            >
              <div
                className="absolute -inset-1 sm:-inset-1.5 rounded-2xl border-2 animate-rank-aura-ring"
                style={{ borderColor: rankAura.colorHex }}
              />
              <div
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-sm animate-rank-aura-spark"
                style={{ boxShadow: `0 0 8px 2px ${rankAura.colorHex}` }}
              />
              <div
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-sm animate-rank-aura-spark"
                style={{ boxShadow: `0 0 8px 2px ${rankAura.colorHex}` }}
              />
            </div>
          )}

          <div
            className={`relative flex flex-col items-center px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-[#2B1F2D]/92 border-2 shadow-md shrink-0 transition-all duration-300 z-10 ${
              rankAura?.active ? 'border-[#FDFFB6]' : 'border-[#2D1E2F]'
            }`}
            style={{
              boxShadow: rankAura?.active
                ? `0 0 22px 3px ${rankAura.colorHex}66, 0 4px 6px -1px rgba(0, 0, 0, 0.4)`
                : undefined,
            }}
          >
            <div className="flex items-baseline gap-1 sm:gap-2 whitespace-nowrap">
              <span className="hidden sm:inline text-[10px] font-extrabold tracking-wider text-[#FFFDF0]/75">
                STYLE
              </span>
              <span
                key={rankAura?.active ? `rank-${rankAura.key}` : 'rank-static'}
                className={`text-xl sm:text-3xl font-display font-black leading-none stroke-plum ${
                  rankAura?.active ? 'animate-rank-letter-pop' : ''
                }`}
                style={{ color: currentRankDef.colorHex }}
              >
                {currentRankDef.letter}
              </span>
              <span className="text-[10px] sm:text-[11px] font-mono-tabular font-bold text-[#FDFFB6]">
                ×{currentRankDef.scoreMult.toFixed(1)}
              </span>
            </div>
            <div className="w-16 sm:w-28 h-2 rounded-full bg-[#18111A] border border-[#2D1E2F] overflow-hidden mt-1">
              <div
                className="h-full transition-all duration-75"
                style={{
                  width: `${hud.stylePoints}%`,
                  backgroundColor:
                    hud.stylePoints < 15 ? '#F43F5E' : currentRankDef.colorHex,
                }}
              />
            </div>
          </div>
        </div>

        {/* Cluster 3 (Top-Right): Run Clock, Score, and Square <svg> Utility Buttons [M] [P] [R] + Dev-Only Lazy Debug Button */}
        <div className="flex flex-col sm:flex-row items-end sm:items-start gap-1.5 sm:gap-2 shrink-0">
          <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-[#2B1F2D]/92 border-2 border-[#2D1E2F] text-right shadow-md whitespace-nowrap">
            <div className="text-sm sm:text-lg font-mono-tabular font-bold text-[#FFFDF0] leading-tight">
              {clockText}
            </div>
            <div className="text-[10px] sm:text-[11px] font-mono-tabular text-[#FDFFB6]">
              {hud.score.toLocaleString()} PTS
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-1.5 pointer-events-auto">
            <button
              type="button"
              tabIndex={-1}
              aria-label={userMuted ? 'Unmute Audio [M]' : 'Mute Audio [M]'}
              onClick={(e) => {
                e.currentTarget.blur();
                toggleMute();
              }}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#2B1F2D]/95 border-2 border-[#2D1E2F] flex items-center justify-center hover:border-[#A8E6CF] transition-colors shrink-0"
            >
              <MuteSvgIcon muted={userMuted} />
            </button>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Pause Game [P]"
              onClick={(e) => {
                e.currentTarget.blur();
                pauseRun();
              }}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#2B1F2D]/95 border-2 border-[#2D1E2F] flex items-center justify-center hover:border-[#FDFFB6] transition-colors shrink-0"
            >
              <PauseSvgIcon />
            </button>

            {/* Lazy-loaded & rendered ONLY during development process */}
            <LazyHudDebugButton onOpen={openDebugMenu} />

            <button
              type="button"
              tabIndex={-1}
              aria-label="Restart Run [R]"
              onClick={(e) => {
                e.currentTarget.blur();
                startNewOrResumedRun(false);
              }}
              className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-[#2B1F2D]/95 border-2 border-[#2D1E2F] flex items-center justify-center hover:border-[#A8E6CF] transition-colors shrink-0"
            >
              <RestartSvgIcon />
            </button>
          </div>
        </div>
      </div>

      {/* BOTTOM PERIMETER STACK: Special Enemy / Boss Alert Banner at Bottom + Equipped Weapon & Power-Up Row */}
      <div className="flex flex-col items-center gap-2 w-full">
        {hud.isOutsideArena ? (
          <div
            data-testid="bottom-alert-banner"
            className="mx-auto px-4 py-1.5 rounded-xl bg-[#3B1622]/95 border-2 border-[#F43F5E] text-xs font-extrabold text-[#FFAAA6] shadow-lg whitespace-nowrap animate-pulse"
          >
            OUTSIDE THORN ARENA · TAKING BRIAR BLEED DPS!
          </div>
        ) : hud.activeAlert ? (
          <div
            data-testid="bottom-alert-banner"
            className="mx-auto px-4 py-1.5 rounded-xl bg-[#2B1F2D]/95 border-2 border-[#FDFFB6] text-xs font-bold text-[#FDFFB6] shadow-lg whitespace-nowrap"
          >
            {hud.activeAlert}
          </div>
        ) : null}

        <div className="flex items-end justify-between gap-2 w-full">
          <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#2B1F2D]/90 border-2 border-[#2D1E2F] text-[11px] sm:text-xs font-semibold text-[#FFFDF0] whitespace-nowrap overflow-hidden max-w-[54vw] sm:max-w-none">
            {hud.weapons.map((w, idx) => {
              const def = WEAPONS[w.id];
              return (
                <React.Fragment key={w.id}>
                  {idx > 0 && <span aria-hidden="true">·</span>}
                  <span className={`truncate ${w.evolved ? 'text-[#FDFFB6] font-bold' : ''}`}>
                    {w.evolved ? def?.evolvedName : def?.name}{' '}
                    <span className="font-mono-tabular text-[#A8E6CF]">Lv{w.level}</span>
                  </span>
                </React.Fragment>
              );
            })}
            {Object.keys(hud.ownedCards).length > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-[#FDFFB6] font-mono-tabular">
                  {Object.entries(hud.ownedCards)
                    .slice(0, 3)
                    .map(([cid, lv]) => {
                      const cDef = CARDS.find((c) => c.id === cid);
                      if (cDef?.evolvedName && lv > cDef.maxLevel) {
                        return `${cDef.evolvedName} (Evo)`;
                      }
                      return `${cDef?.name ?? cid} Lv${lv}`;
                    })
                    .join(' · ')}
                  {Object.keys(hud.ownedCards).length > 3
                    ? ` +${Object.keys(hud.ownedCards).length - 3}`
                    : ''}
                </span>
              </>
            )}
          </div>

          {/* Held One-Time Power-Up Slots [Q] and [E] */}
          <div className="flex items-center gap-1.5 sm:gap-2 pointer-events-auto shrink-0">
            {[0, 1].map((slotIdx) => {
              const pId = hud.heldPowerUps[slotIdx];
              const pDef = pId ? POWER_UPS[pId] : null;
              const keyBind = slotIdx === 0 ? 'Q' : 'E';
              return (
                <button
                  key={slotIdx}
                  type="button"
                  data-testid={`hud-powerup-slot-${slotIdx}`}
                  disabled={!pDef}
                  aria-label={
                    pDef ? `Use ${pDef.name} [${keyBind}]` : `Empty Power-Up Slot [${keyBind}]`
                  }
                  onClick={(e) => {
                    e.currentTarget.blur();
                    usePowerUpSlot(slotIdx);
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl border-2 border-[#2D1E2F] text-[11px] sm:text-xs font-bold flex items-center gap-1.5 transition-transform active:scale-95 whitespace-nowrap shrink-0 ${
                    pDef
                      ? 'bg-[#2B1F2D] text-[#FFFDF0] shadow-md hover:border-[#FDFFB6]'
                      : 'bg-[#2B1F2D]/60 text-[#FFFDF0]/40'
                  }`}
                >
                  <span className="font-mono-tabular text-[#A8E6CF]">[{keyBind}]</span>
                  {pDef && <PowerUpAbilityIcon powerUpId={pDef.id} className="w-5 h-5" />}
                  <span>{pDef ? pDef.name : 'Empty'}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
