import React, { useEffect, useRef, useState } from 'react';
import { POWER_UPS, STYLE_RANKS } from '../../content/data/catalog';
import { getPowerUpDef } from '../../game/data/powerups';
import { Simulation } from '../../sim/Simulation';
import {
  HeartSocketIcon,
  MuteSvgIcon,
  PauseSvgIcon,
  PowerUpAbilityIcon,
  RestartSvgIcon,
} from '../SvgIcons';
import { ActiveBuffs } from './ActiveBuffs';
import { useGameShell } from '../context/GameShellContext';
import { LazyHudDebugButton } from '../debug/LazyDebugComponents';
import { cn } from '../../utils/cn';

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

  const [heartPulse, setHeartPulse] = useState<'damage' | 'heal' | null>(null);
  const prevHpRef = useRef(hud.hp);

  useEffect(() => {
    if (hud.hp < prevHpRef.current) {
      setHeartPulse('damage');
      const timer = window.setTimeout(() => setHeartPulse(null), 380);
      prevHpRef.current = hud.hp;
      return () => window.clearTimeout(timer);
    } else if (hud.hp > prevHpRef.current) {
      setHeartPulse('heal');
      const timer = window.setTimeout(() => setHeartPulse(null), 380);
      prevHpRef.current = hud.hp;
      return () => window.clearTimeout(timer);
    }
  }, [hud.hp]);

  if (shellState === 'title') return null;

  const currentRankDef = STYLE_RANKS[hud.rankIndex] ?? STYLE_RANKS[0]!;
  const hpRatio = Math.max(0, Math.min(1, hud.hp / Math.max(1, hud.maxHp)));
  const xpRatio = Math.max(0, Math.min(1, hud.xp / Math.max(1, hud.xpToNext)));
  const bossProgressRatio = Math.max(
    0,
    Math.min(1, hud.elapsedSec / Simulation.FINAL_BOSS_SPAWN_SEC),
  );

  return (
    <>
      {/* FULL-SCREEN TOP XP BAR WITH CENTERED, ALWAYS-READABLE LEVEL INDICATOR (Fixed Gradient, Clipped by Fill) */}
      <div
        data-testid="hud-xp-bar"
        className="fixed top-0 inset-x-0 z-20 pointer-events-none h-[18px] sm:h-5 bg-[#2B1F2D]/95 border-b-2 border-[#A8E6CF]/35 shadow-md relative overflow-hidden flex items-center justify-center"
      >
        <div
          data-testid="hud-xp-fill"
          className="absolute inset-y-0 left-0 overflow-hidden transition-all duration-150 ease-out shadow-[0_0_10px_#88D49E]"
          style={{ width: `${Math.round(xpRatio * 100)}%` }}
        >
          <div
            className="h-full w-screen bg-gradient-to-r from-[#52B788] via-[#88D49E] to-[#FDFFB6]" />
        </div>
        <div className="absolute inset-x-0 top-0 h-[40%] bg-white/10 pointer-events-none" />
        <span
          data-testid="hud-level-indicator"
          className="relative z-10 px-2 py-0.5 rounded bg-[#140E16]/75 text-[10px] sm:text-[11px] font-mono-tabular font-black tracking-widest text-[#FFFDF0] drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] leading-none"
        >
          Level {hud.level}
        </span>
      </div>

      <div
        className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-3 md:p-5 pt-6 sm:pt-7 pb-5 sm:pb-6">
        {/* TOP PERIMETER ROW: 3 Compact Corner Clusters */}
        <div className="flex items-start justify-between gap-1.5 sm:gap-3 w-full">
          {/* Cluster 1 (Top-Left): Botanical Thermometer Vitality Indicator + Segmented Dash Cooldown (Outer Container Box Removed) */}
          <div className="w-40 sm:w-64 shrink-0 flex flex-col gap-1.5 pointer-events-none">
            {/* Thermometer Health Bar: Heart Bulb at Start + Glass Tube with Theme Gradient (No VITALITY text, no black tick dashes) */}
            <div
              data-testid="hud-vitality-thermometer"
              className="relative flex items-center w-full"
            >
              {/* At low HP, semi-transparent pulsing background that makes health bar borders clearly visible */}
              {hpRatio <= 0.3 && (
                <div
                  data-testid="hud-low-hp-glow"
                  className="absolute -inset-1 rounded-full bg-[#F43F5E]/20 border border-[#F43F5E]/60 animate-pulse pointer-events-none shadow-[0_0_12px_rgba(244,63,94,0.4)]"
                />
              )}

              {/* Thermometer Heart Reservoir Bulb at Start (Container remains static; only the inner heart icon pulses) */}
              <div
                data-testid="hud-thermometer-bulb"
                className="relative z-10 w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center shrink-0 border-2 border-[#2D1E2F] shadow-[0_2px_8px_rgba(0,0,0,0.65)] bg-gradient-to-br from-[#FFAAA6] via-[#F43F5E] to-[#9F1239]"
              >
                {/* Glass bulb specular highlight */}
                <div
                  className="absolute top-1 left-1.5 w-2.5 h-1.5 rounded-full bg-[#FFFDF0]/45 -rotate-12 pointer-events-none" />
                <HeartSocketIcon
                  state={hpRatio > 0.5 ? 'full' : hpRatio > 0.25 ? 'damaged' : 'empty'}
                  pulse={heartPulse}
                  className={cn(
                    'w-5 h-5 shrink-0 origin-center transition-transform duration-200',
                    heartPulse === 'damage'
                      ? 'scale-125 drop-shadow-[0_0_6px_#FFFDF0]'
                      : heartPulse === 'heal'
                        ? 'scale-125 drop-shadow-[0_0_6px_#88D49E]'
                        : hpRatio <= 0.3
                          ? 'animate-pulse'
                          : 'scale-100'
                  )}
                />
              </div>

              {/* Thermometer Capillary Glass Tube (Border radius applied to grayed backdrop, black dashes removed) */}
              <div
                data-testid="hud-thermometer-tube"
                className="relative -ml-2 flex-1 h-4 sm:h-5 rounded-full bg-[#140D16] border-2 border-[#2D1E2F] overflow-hidden shadow-inner flex items-center"
              >
                {/* Delayed Trailing Damage Ghost Mercury */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-[#FFD3B6]/65 transition-all duration-300"
                  style={{ width: `${Math.round(trailingHpRatio * 100)}%` }}
                />

                {/* Active Theme-Gradient Botanical Mercury Fill */}
                <div
                  data-testid="hud-thermometer-fill"
                  className={cn(
                    'absolute inset-y-0 left-0 rounded-full transition-all duration-100',
                    hpRatio <= 0.3
                      ? 'bg-gradient-to-r from-[#9F1239] via-[#F43F5E] to-[#FB7185] shadow-[0_0_10px_#F43F5E]'
                      : 'bg-gradient-to-r from-[#F43F5E] via-[#FBBF24] to-[#88D49E] shadow-[0_0_10px_rgba(136,212,158,0.55)]'
                  )}
                  style={{ width: `${Math.round(hpRatio * 100)}%` }}
                />

                {/* Optional Shield Ward Overlay Shimmer */}
                {hud.shieldHp > 0 && (
                  <div
                    data-testid="hud-thermometer-shield"
                    className="absolute inset-y-0 left-0 rounded-full border-r-2 border-[#FFFDF0] bg-gradient-to-r from-[#38BDF8]/35 to-[#A0C4FF]/65 transition-all duration-100"
                    style={{
                      width: `${Math.min(100, Math.round((hud.shieldHp / Math.max(1, hud.maxHp)) * 100))}%`,
                    }}
                  />
                )}

                {/* Glass Tube Top Specular Reflection */}
                <div
                  className="absolute top-0.5 inset-x-1 h-1 rounded-full bg-gradient-to-r from-[#FFFDF0]/35 via-[#FFFDF0]/20 to-transparent pointer-events-none" />
              </div>
            </div>

            {/* Full-Width Segmented Dash Cooldown Line (splits into smaller parts as dash count increases) */}
            <div
              data-testid="hud-dash-cooldown-bar"
              className="flex items-center gap-1 sm:gap-1.5 w-full"
            >
              {Array.from({ length: Math.max(1, hud.maxDashCharges) }).map((_, i) => {
                const isReady = i < hud.dashCharges;
                const isRecharging = i === hud.dashCharges;
                const fillPct = isReady
                  ? 100
                  : isRecharging
                    ? Math.round(Math.max(0, Math.min(1, hud.dashReadyRatio)) * 100)
                    : 0;
                return (
                  <div
                    key={i}
                    data-testid={`hud-dash-segment-${i}`}
                    className="relative flex-1 h-2 sm:h-2.5 rounded-full bg-[#18111A] border border-[#2D1E2F] overflow-hidden"
                  >
                    <div
                      className={cn(
                        'h-full transition-all duration-75',
                        hud.isDashInvisible
                          ? 'bg-[#A0C4FF] shadow-[0_0_6px_#A0C4FF]'
                          : isReady
                            ? 'bg-[#A8E6CF] shadow-[0_0_6px_rgba(168,230,207,0.65)]'
                            : 'bg-[#5FE0C8]/75'
                      )}
                      style={{ width: `${fillPct}%` }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Active Power-Up Buff Strip (stacked directly below HP/Dash bars) */}
            <ActiveBuffs buffs={hud.activeBuffs} />
          </div>

          {/* Cluster 2 (Top-Center): Style Rank Letter + Score Near Rank Letter & Decaying SP Bar (No Box Background) */}
          <div className="relative flex flex-col items-center shrink-0">
            <div
              data-testid="hud-rank-score-badge"
              className="relative flex flex-col items-center px-2 py-0.5 shrink-0 transition-all duration-300 z-10"
            >
              <div
                className="flex items-baseline justify-center gap-2 sm:gap-2.5 whitespace-nowrap">
                <span
                  key={`rank-${currentRankDef.letter}-${rankAura?.key ?? 0}`}
                  data-testid="hud-rank-letter"
                  className="text-3xl sm:text-4xl font-display font-black leading-none stroke-plum animate-rank-letter-pop drop-shadow-[0_2px_6px_rgba(0,0,0,0.75)]"
                  style={{ color: currentRankDef.colorHex }}
                >
                  {currentRankDef.letter}
                </span>
                <span
                  data-testid="hud-score"
                  className="text-xs sm:text-sm font-mono-tabular font-extrabold text-[#FDFFB6] tracking-tight drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]"
                >
                  {hud.score.toLocaleString()} PTS
                </span>
              </div>
              <div
                className="w-24 sm:w-32 h-2 rounded-full bg-[#18111A]/90 border border-[#2D1E2F] overflow-hidden mt-1 shadow-sm">
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

          {/* Cluster 3 (Top-Right): Square <svg> Utility Buttons [M] [P] [R] + Dev-Only Lazy Debug Button */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 pointer-events-auto">
            <button
              type="button"
              tabIndex={-1}
              aria-label={userMuted ? 'Unmute Audio [M]' : 'Mute Audio [M]'}
              onClick={(e) => {
                e.currentTarget.blur();
                toggleMute();
              }}
              className="btn-herbarium-seal shrink-0 text-[#EDE6D0]"
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
              className="btn-herbarium-seal shrink-0 text-[#EDE6D0]"
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
              className="btn-herbarium-seal shrink-0 text-[#EDE6D0]"
            >
              <RestartSvgIcon />
            </button>
          </div>
        </div>

        {/* BOTTOM PERIMETER STACK: Special Enemy / Boss Alert Banner at Bottom + Held Power-Up Row */}
        <div className="flex flex-col items-center gap-2 w-full">
          {hud.activeAlert && (
            <div
              data-testid="bottom-alert-banner"
              className="mx-auto px-4 py-1.5 rounded-xl bg-[#2B1F2D]/95 border-2 border-[#FDFFB6] text-xs font-bold text-[#FDFFB6] shadow-lg whitespace-nowrap"
            >
              {hud.activeAlert}
            </div>
          )}

          <div className="flex items-end justify-end gap-2 w-full">
            {/* Held One-Time Usable Items / Power-Up Slots [Q] and [E] */}
            <div
              className="flex items-center gap-2 pointer-events-auto shrink-0 p-1.5 sm:p-2 rounded-2xl bg-[#2B1F2D]/90 border-2 border-[#2D1E2F] shadow-xl">
              {[0, 1].map((slotIdx) => {
                const pId = hud.heldPowerUps[slotIdx];
                const pDef = pId ? POWER_UPS[pId] : null;
                const canonicalDef = pId ? getPowerUpDef(pId) : null;
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
                    style={
                      canonicalDef
                        ? {
                            borderColor: canonicalDef.accent,
                            boxShadow: `0 0 12px ${canonicalDef.accent}45`,
                          }
                        : undefined
                    }
                    className={cn(
                      'relative flex flex-col items-center justify-center rounded-xl border-2 transition-all active:scale-95 whitespace-nowrap shrink-0 p-2 sm:p-2.5 min-w-[70px] sm:min-w-[84px] cursor-pointer',
                      pDef
                        ? 'bg-gradient-to-b from-[#251A2C] to-[#16101B] text-[#EDE6D0] shadow-md hover:brightness-110'
                        : 'bg-[#0E1A17]/60 border-[#3D392A]/40 text-[#EDE6D0]/30 cursor-not-allowed'
                    )}
                  >
                    <span
                      className="portrait:hidden absolute -top-2 -right-2 px-1.5 py-0.2 rounded-full bg-[#2B1F2D] border border-[#A8E6CF] font-mono-tabular text-[10px] font-bold text-[#A8E6CF] shadow">
                      {keyBind}
                    </span>
                    <div className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center mb-1">
                      {pDef ? (
                        <PowerUpAbilityIcon
                          powerUpId={pDef.id}
                          size={64}
                          className="w-9 h-9 sm:w-11 sm:h-11"
                        />
                      ) : (
                        <div
                          className="w-5 h-5 rounded-full border border-dashed border-[#FFFDF0]/20" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* FULL-SCREEN BOTTOM PROGRESS BAR: Time to Final Boss Spawn (Fixed Gradient, Clipped by Fill) */}
      <div
        data-testid="hud-boss-progress-bar"
        className="fixed bottom-0 inset-x-0 z-20 pointer-events-none h-2.5 sm:h-3 bg-[#18111A]/92 border-t border-[#2D1E2F] shadow-sm flex items-center overflow-hidden"
      >
        <div
          data-testid="hud-boss-progress-fill"
          className="h-full overflow-hidden transition-all duration-300 ease-out shadow-[0_0_8px_rgba(244,63,94,0.75)]"
          style={{ width: `${Math.round(bossProgressRatio * 100)}%` }}
        >
          <div
            className="h-full w-screen bg-gradient-to-r from-[#FB7185] via-[#F43F5E] to-[#FDE047]" />
        </div>
      </div>
    </>
  );
}
