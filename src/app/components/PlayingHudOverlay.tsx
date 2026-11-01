import React from 'react';
import { POWER_UPS, STYLE_RANKS } from '../../content/data/catalog';
import { getPowerUpDef } from '../../game/data/powerups';
import { Simulation } from '../../sim/Simulation';
import {
  FullscreenSvgIcon,
  MuteSvgIcon,
  PauseSvgIcon,
  PowerUpAbilityIcon,
  RestartSvgIcon,
} from '../SvgIcons';
import { ActiveBuffs } from './ActiveBuffs';
import { useGameShell } from '../context/GameShellContext';
import { IS_DEV } from '../debug/devGate';
import { LazyHudDebugButton } from '../debug/LazyDebugComponents';
import { BotanicalHealthBar } from '../../ui/healthbar/BotanicalHealthBar';
import { cn } from '../../utils/cn';

/**
 * STATE 2: PLAYING HUD (World-Matched Botanical Perimeter, >85% Clear)
 */
export function PlayingHudOverlay() {
  const {
    shellState,
    isMenuTransitioning,
    hud,
    rankAura,
    userMuted,
    isFullscreen,
    toggleMute,
    toggleFullscreen,
    pauseRun,
    openDebugMenu,
    startNewOrResumedRun,
    usePowerUpSlot,
  } = useGameShell();

  const lastSlotTouchMsRef = React.useRef<Record<number, number>>({});
  const lastFullscreenTouchMsRef = React.useRef<number>(-Infinity);

  if (shellState === 'title') return null;

  const currentRankDef = STYLE_RANKS[hud.rankIndex] ?? STYLE_RANKS[0]!;
  const xpRatio = Math.max(0, Math.min(1, hud.xp / Math.max(1, hud.xpToNext)));
  const bossProgressRatio = Math.max(
    0,
    Math.min(1, hud.elapsedSec / Simulation.FINAL_BOSS_SPAWN_SEC),
  );

  const maxDash = Math.max(1, hud.maxDashCharges);

  return (
    <>
      {/* AAA BOTANICAL TAROT TOP EXPERIENCE LEVEL BAR */}
      <div
        data-testid="hud-xp-bar"
        className={cn(
          'fixed top-0 inset-x-0 pointer-events-none h-[22px] sm:h-[26px] bg-gradient-to-b from-[#110B15]/96 via-[#1B1220]/95 to-[#0D0810]/96 border-b border-[#C89D54]/75 shadow-[0_3px_14px_rgba(0,0,0,0.88),inset_0_-1px_0_rgba(253,255,182,0.22)] relative overflow-hidden flex items-center justify-center',
          isMenuTransitioning ? 'z-10' : 'z-20'
        )}
      >
        {/* Subtle recessed stone/soil trough inner shadow & 10% progression tick marks */}
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-30 pointer-events-none"
          style={{
            backgroundImage:
              'repeating-linear-gradient(90deg, transparent 0%, transparent calc(10% - 1px), rgba(200, 157, 84, 0.35) calc(10% - 1px), rgba(200, 157, 84, 0.35) 10%)',
          }}
        />

        {/* Living Chlorophyll & Golden Nectar XP Fill */}
        <div
          data-testid="hud-xp-fill"
          className="absolute inset-y-[1px] left-0 overflow-hidden transition-all duration-150 ease-out shadow-[0_0_14px_rgba(52,211,153,0.75)]"
          style={{ width: `${Math.round(xpRatio * 100)}%` }}
        >
          <div
            className="h-full w-screen"
            style={{
              background:
                'linear-gradient(90deg, #065F46 0%, #10B981 32%, #6EE7B7 68%, #FEF08A 94%, #FFFDF0 100%)',
            }}
          />
          {/* Subtle botanical diagonal leaf-vein sheen */}
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-25"
            style={{
              backgroundImage:
                'repeating-linear-gradient(125deg, rgba(255,255,255,0.35) 0px, rgba(255,255,255,0.35) 6px, transparent 6px, transparent 16px)',
            }}
          />
          {/* Top liquid glass specular reflection */}
          <div className="absolute inset-x-0 top-0 h-[42%] bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
          {/* Glowing Golden-Emerald Meniscus Spark at Leading Edge */}
          {xpRatio > 0.01 && (
            <div
              aria-hidden="true"
              className="absolute inset-y-0 right-0 w-2.5 bg-gradient-to-l from-[#FFFDF0] via-[#FEF08A] to-transparent shadow-[0_0_10px_#FFFDF0]"
            />
          )}
        </div>

        {/* Top gilded hairline & bottom antique bronze inner bevel */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-[#FFF3D1]/35 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 bottom-0 h-[1px] bg-gradient-to-r from-[#7D623A]/40 via-[#E8B64A]/65 to-[#7D623A]/40 pointer-events-none" />

        {/* Left & Right Botanical Vine Scroll Accents */}
        <svg
          aria-hidden="true"
          viewBox="0 0 48 16"
          className="hidden sm:block absolute left-2 top-1/2 -translate-y-1/2 w-10 h-3.5 text-[#C89D54]/65 pointer-events-none"
          fill="none"
        >
          <path
            d="M2 8 H36 M8 8 C11 3, 17 3, 20 8 C17 13, 11 13, 8 8 Z"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <polygon points="38,8 42,5 46,8 42,11" fill="#E8B64A" />
        </svg>
        <svg
          aria-hidden="true"
          viewBox="0 0 48 16"
          className="hidden sm:block absolute right-2 top-1/2 -translate-y-1/2 w-10 h-3.5 text-[#C89D54]/65 pointer-events-none scale-x-[-1]"
          fill="none"
        >
          <path
            d="M2 8 H36 M8 8 C11 3, 17 3, 20 8 C17 13, 11 13, 8 8 Z"
            stroke="currentColor"
            strokeWidth="1.2"
          />
          <polygon points="38,8 42,5 46,8 42,11" fill="#E8B64A" />
        </svg>

        {/* Centered Ornate Botanical Tarot Level Crest Plaque */}
        <div className="relative z-10 flex items-center gap-1.5 px-2.5 sm:px-3 py-[2px] rounded-full bg-gradient-to-b from-[#24192B]/95 via-[#150E1A]/95 to-[#0D0810]/95 border border-[#E8B64A]/80 shadow-[0_2px_8px_rgba(0,0,0,0.95),0_0_12px_rgba(232,182,74,0.25),inset_0_1px_0_rgba(255,248,214,0.32)]">
          <svg
            aria-hidden="true"
            viewBox="0 0 12 12"
            className="w-2.5 h-2.5 shrink-0"
            fill="none"
          >
            <path
              d="M11 6 C7.5 2.5, 3.5 3, 1 6 C3.5 9, 7.5 9.5, 11 6 Z"
              fill="#6EE7B7"
              stroke="#E8B64A"
              strokeWidth="1"
            />
          </svg>
          <span
            data-testid="hud-level-indicator"
            className="text-[10px] sm:text-[11px] font-mono-tabular font-black tracking-[0.14em] uppercase text-[#FFFDF0] drop-shadow-[0_1px_2px_rgba(0,0,0,0.95)] leading-none"
          >
            Level {hud.level}
          </span>
          <svg
            aria-hidden="true"
            viewBox="0 0 12 12"
            className="w-2.5 h-2.5 shrink-0 scale-x-[-1]"
            fill="none"
          >
            <path
              d="M11 6 C7.5 2.5, 3.5 3, 1 6 C3.5 9, 7.5 9.5, 11 6 Z"
              fill="#6EE7B7"
              stroke="#E8B64A"
              strokeWidth="1"
            />
          </svg>
        </div>
      </div>

      <div
        className="fixed inset-0 z-10 pointer-events-none flex flex-col justify-between p-2 sm:p-3 md:p-5 pt-7 sm:pt-8 pb-5 sm:pb-6">
        {/* TOP PERIMETER ROW: 3 Compact Corner Clusters (Mobile single-row fit) */}
        <div className="flex items-start justify-between gap-1.5 sm:gap-3 w-full">
          {/* Cluster 1 (Top-Left): AAA Botanical Tarot Health Bar + Ornate Botanical Dash Charge Gauge + Dev-Only Demo Controls */}
          <div className="w-[152px] min-[390px]:w-[172px] min-[440px]:w-52 sm:w-[340px] shrink-0 flex flex-col gap-1 sm:gap-1.5 pointer-events-none">
            <div data-testid="hud-vitality-thermometer" className="w-full">
              <BotanicalHealthBar
                hp={hud.hp}
                maxHp={hud.maxHp}
                shield={hud.shieldHp}
                showDemoControls={IS_DEV}
              />
            </div>

            {/* AAA Botanical Roguelite Zephyr Wing / Leaf-Crystal Dash Indicator (Single & Multi-Dash) */}
            <div
              data-testid="hud-dash-cooldown-bar"
              className="flex items-center gap-1 sm:gap-1.5 w-full pl-1 pr-0.5"
            >
              {/* Sculpted Botanical Zephyr Wing Emblem */}
              <div
                aria-hidden="true"
                className={cn(
                  'w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center shrink-0 border transition-all duration-200',
                  hud.isDashInvisible
                    ? 'bg-[#10233A] border-[#7DD3FC] shadow-[0_0_10px_rgba(125,211,252,0.75)]'
                    : hud.dashCharges > 0
                      ? 'bg-gradient-to-b from-[#1B3326] to-[#0D1A13] border-[#E8B64A]/85 shadow-[0_2px_6px_rgba(0,0,0,0.85),0_0_8px_rgba(110,231,183,0.45)]'
                      : 'bg-[#140E16] border-[#5C5346]/60 opacity-75'
                )}
              >
                <svg viewBox="0 0 16 16" className="w-3 h-3 sm:w-3.5 sm:h-3.5" fill="none">
                  <path
                    d="M2.5 11.5 C4.5 6.5, 9 4, 13.8 3.2 C12.2 7.5, 9.2 11.2, 4.5 12.2 Z"
                    fill={
                      hud.isDashInvisible
                        ? '#BAE6FD'
                        : hud.dashCharges > 0
                          ? '#6EE7B7'
                          : '#6B7280'
                    }
                    stroke="#140E16"
                    strokeWidth="0.9"
                  />
                  <path
                    d="M3.5 11.2 Q8 7.5 12.8 4"
                    stroke="#FFFDF0"
                    strokeWidth="0.9"
                    strokeLinecap="round"
                  />
                </svg>
              </div>

              {/* Segmented Leaf-Crystal Charge Cells */}
              <div className="flex items-center gap-1 sm:gap-1.5 flex-1 min-w-0">
                {Array.from({ length: maxDash }).map((_, i) => {
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
                      data-ready={isReady ? 'true' : 'false'}
                      className={cn(
                        'relative flex-1 h-2.5 sm:h-3 rounded-[4px] bg-gradient-to-b from-[#0E0912] via-[#18111D] to-[#0C070E] border overflow-hidden transition-all duration-150',
                        hud.isDashInvisible
                          ? 'border-[#7DD3FC] shadow-[0_0_10px_rgba(125,211,252,0.6),inset_0_1px_2px_rgba(0,0,0,0.85)]'
                          : isReady
                            ? 'border-[#E8B64A]/85 shadow-[0_2px_6px_rgba(0,0,0,0.85),0_0_8px_rgba(52,211,153,0.35),inset_0_1px_0_rgba(255,248,214,0.35)]'
                            : 'border-[#5C5346]/65 shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)]'
                      )}
                    >
                      {/* Liquid Sylph-Emerald / Zephyr Charge Fill */}
                      <div
                        className={cn(
                          'relative h-full transition-all duration-75 overflow-hidden',
                          hud.isDashInvisible
                            ? 'bg-gradient-to-r from-[#38BDF8] via-[#A0C4FF] to-[#FFFDF0] shadow-[0_0_8px_#A0C4FF]'
                            : isReady
                              ? 'bg-gradient-to-r from-[#10B981] via-[#6EE7B7] to-[#FEF08A] shadow-[0_0_8px_rgba(110,231,183,0.75)]'
                              : 'bg-gradient-to-r from-[#047857] via-[#10B981] to-[#6EE7B7]/90'
                        )}
                        style={{ width: `${fillPct}%` }}
                      >
                        {/* Upper glass bevel highlight */}
                        <div className="absolute inset-x-0 top-0 h-[45%] bg-gradient-to-b from-white/40 to-transparent pointer-events-none" />
                        {/* Leading-edge recharge spark */}
                        {isRecharging && fillPct > 4 && fillPct < 100 && (
                          <div className="absolute inset-y-0 right-0 w-1.5 bg-[#FFFDF0] blur-[0.5px] shadow-[0_0_6px_#FFFDF0]" />
                        )}
                      </div>

                      {/* Botanical leaf-vein notch & glowing central diamond pip when charged */}
                      {isReady && (
                        <div
                          aria-hidden="true"
                          className="absolute inset-0 flex items-center justify-center pointer-events-none"
                        >
                          {maxDash === 1 ? (
                            <div className="flex items-center justify-between w-full px-2">
                              <span className="h-[1px] flex-1 bg-gradient-to-r from-transparent via-[#FFFDF0]/55 to-[#FFFDF0]/85" />
                              <span className="mx-1.5 w-1.5 h-1.5 rotate-45 bg-[#FFFDF0] border border-[#064E3B] shadow-[0_0_4px_#FFFDF0]" />
                              <span className="h-[1px] flex-1 bg-gradient-to-l from-transparent via-[#FFFDF0]/55 to-[#FFFDF0]/85" />
                            </div>
                          ) : (
                            <span className="w-1.5 h-1.5 rotate-45 bg-[#FFFDF0] border border-[#064E3B]/80 shadow-[0_0_4px_#FFFDF0]" />
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Active Power-Up Buff Strip (stacked directly below HP/Dash bars) */}
            <ActiveBuffs buffs={hud.activeBuffs} />
          </div>

          {/* Cluster 2 (Top-Center): Style Rank Letter + Score Near Rank Letter & Decaying SP Bar (No Box Background) */}
          <div className="relative flex flex-col items-center shrink min-w-0">
            <div
              data-testid="hud-rank-score-badge"
              className="relative flex flex-col items-center px-1 sm:px-2 py-0.5 shrink-0 transition-all duration-300 z-10"
            >
              <div
                className="flex items-baseline justify-center gap-1 sm:gap-2.5 whitespace-nowrap">
                <span
                  key={`rank-${currentRankDef.letter}-${rankAura?.key ?? 0}`}
                  data-testid="hud-rank-letter"
                  className="text-2xl min-[380px]:text-3xl sm:text-4xl font-display font-black leading-none stroke-plum animate-rank-letter-pop drop-shadow-[0_2px_6px_rgba(0,0,0,0.75)]"
                  style={{ color: currentRankDef.colorHex }}
                >
                  {currentRankDef.letter}
                </span>
                <span
                  data-testid="hud-score"
                  className="text-[11px] min-[380px]:text-xs sm:text-sm font-mono-tabular font-extrabold text-[#FDFFB6] tracking-tight drop-shadow-[0_1px_4px_rgba(0,0,0,0.85)]"
                >
                  {hud.score.toLocaleString()} PTS
                </span>
              </div>
              <div
                className="w-16 min-[380px]:w-20 sm:w-32 h-1.5 sm:h-2 rounded-full bg-[#18111A]/90 border border-[#2D1E2F] overflow-hidden mt-0.5 sm:mt-1 shadow-sm">
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
          <div className="flex items-center gap-1 sm:gap-2 shrink-0 pointer-events-auto">
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

            {/* Lazy-loaded & rendered ONLY during development process on desktop */}
            <div className="hidden sm:block">
              <LazyHudDebugButton onOpen={openDebugMenu} />
            </div>

            <button
              type="button"
              tabIndex={-1}
              aria-label="Restart Run [R]"
              onClick={(e) => {
                e.currentTarget.blur();
                startNewOrResumedRun(false);
              }}
              className="btn-herbarium-seal shrink-0 text-[#EDE6D0] hidden sm:inline-flex"
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

          <div className="flex items-end justify-between gap-2 w-full">
            {/* Bottom-Left: Fullscreen Mode Control [F] */}
            <div className="flex items-center pointer-events-auto shrink-0">
              <button
                type="button"
                tabIndex={-1}
                data-testid="hud-fullscreen-button"
                data-interactive="true"
                aria-pressed={isFullscreen}
                aria-label={isFullscreen ? 'Exit Fullscreen [F]' : 'Enter Fullscreen [F]'}
                title={isFullscreen ? 'Exit Fullscreen [F]' : 'Enter Fullscreen [F]'}
                onPointerDown={(e) => {
                  if (e.pointerType === 'mouse' && e.button !== 0) return;
                  e.stopPropagation();
                  e.currentTarget.blur();
                  lastFullscreenTouchMsRef.current = performance.now();
                  toggleFullscreen();
                }}
                onTouchStart={(e) => {
                  e.stopPropagation();
                  e.currentTarget.blur();
                  const now = performance.now();
                  if (now - lastFullscreenTouchMsRef.current < 400) return;
                  lastFullscreenTouchMsRef.current = now;
                  toggleFullscreen();
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  e.currentTarget.blur();
                  const now = performance.now();
                  if (now - lastFullscreenTouchMsRef.current < 400) return;
                  toggleFullscreen();
                }}
                className="btn-herbarium-seal shrink-0 text-[#EDE6D0] touch-none select-none"
              >
                <FullscreenSvgIcon isFullscreen={isFullscreen} />
              </button>
            </div>

            {/* Bottom-Right: Held One-Time Usable Items / Power-Up Slots [Q] and [E] */}
            <div
              className="flex items-center gap-2 pointer-events-auto shrink-0 p-1.5 sm:p-2 rounded-2xl bg-[#2B1F2D]/90 border-2 border-[#2D1E2F] shadow-xl ml-auto">
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
                    data-powerup-slot={slotIdx}
                    data-interactive="true"
                    aria-disabled={!pDef}
                    aria-label={
                      pDef ? `Use ${pDef.name} [${keyBind}]` : `Empty Power-Up Slot [${keyBind}]`
                    }
                    onPointerDown={(e) => {
                      if (e.pointerType === 'mouse' && e.button !== 0) return;
                      e.stopPropagation();
                      e.currentTarget.blur();
                      lastSlotTouchMsRef.current[slotIdx] = performance.now();
                      usePowerUpSlot(slotIdx);
                    }}
                    onTouchStart={(e) => {
                      e.stopPropagation();
                      e.currentTarget.blur();
                      const now = performance.now();
                      if (now - (lastSlotTouchMsRef.current[slotIdx] ?? -Infinity) < 400) return;
                      lastSlotTouchMsRef.current[slotIdx] = now;
                      usePowerUpSlot(slotIdx);
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      e.currentTarget.blur();
                      const now = performance.now();
                      if (now - (lastSlotTouchMsRef.current[slotIdx] ?? -Infinity) < 400) return;
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
                      'relative flex flex-col items-center justify-center rounded-xl border-2 transition-all active:scale-95 whitespace-nowrap shrink-0 p-2 sm:p-2.5 min-w-[70px] sm:min-w-[84px] cursor-pointer touch-none select-none',
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
        className={cn(
          'fixed bottom-0 inset-x-0 pointer-events-none h-2.5 sm:h-3 bg-[#18111A]/92 border-t border-[#2D1E2F] shadow-sm flex items-center overflow-hidden',
          isMenuTransitioning ? 'z-10' : 'z-20'
        )}
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
