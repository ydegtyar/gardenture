import React, { useEffect, useRef, useState } from 'react';
import { IS_DEV } from '../../app/debug/devGate';
import { BotanicalHealthBarController } from './BotanicalHealthBarController';
import type { BotanicalHealthBarState, BotanicalHealthBarView } from './healthBarLogic';

export interface BotanicalHealthBarProps {
  hp?: number;
  maxHp?: number;
  shield?: number;
  showDemoControls?: boolean;
  defaultDemoExpanded?: boolean;
  className?: string;
}

function syncControllerStateToLiveSim(state: BotanicalHealthBarState): void {
  if (typeof window === 'undefined') return;
  const sim = (window as unknown as Record<string, unknown>).__BLOSSOM_SIM__ as
    | {
        currentHp: number;
        maxHp: number;
        shieldHp: number;
        shieldTimer: number;
      }
    | undefined;
  if (!sim) return;
  const ratio = state.hp / Math.max(1, state.maxHp);
  sim.currentHp = Math.max(1, Math.round(ratio * sim.maxHp));
  sim.shieldHp = Math.round((state.shield / Math.max(1, state.maxShield)) * sim.maxHp);
  if (sim.shieldHp > 0) {
    sim.shieldTimer = Math.max(sim.shieldTimer ?? 0, 30);
  } else {
    sim.shieldTimer = 0;
  }
}

export function BotanicalHealthBar({
  hp = 100,
  maxHp = 100,
  shield = 0,
  showDemoControls = IS_DEV,
  className = '',
}: BotanicalHealthBarProps) {
  const barRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<BotanicalHealthBarController | null>(null);
  if (!controllerRef.current) {
    controllerRef.current = new BotanicalHealthBarController(maxHp, hp, shield);
  }

  const [snapshot, setSnapshot] = useState<{
    state: BotanicalHealthBarState;
    view: BotanicalHealthBarView;
  }>(() => ({
    state: controllerRef.current!.getState(),
    view: controllerRef.current!.getView(),
  }));

  const manualDemoLockUntilRef = useRef<number>(0);

  useEffect(() => {
    const ctrl = controllerRef.current!;
    ctrl.mount(barRef.current);
    const unsubscribe = ctrl.subscribe((nextState, nextView) => {
      setSnapshot({ state: { ...nextState }, view: { ...nextView } });
    });
    return () => {
      unsubscribe();
      ctrl.destroy();
    };
  }, []);

  useEffect(() => {
    const currentCtrlHp = controllerRef.current?.getState().hp ?? hp;
    if (
      Date.now() < manualDemoLockUntilRef.current &&
      hp > 0 &&
      !(currentCtrlHp <= 1 && hp > currentCtrlHp)
    ) {
      return;
    }
    controllerRef.current?.syncFromTelemetry(hp, maxHp, shield);
  }, [hp, maxHp, shield]);

  const handleDamage = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    const ctrl = controllerRef.current;
    if (!ctrl) return;
    manualDemoLockUntilRef.current = Date.now() + 1200;
    ctrl.takeDamage(20);
    syncControllerStateToLiveSim(ctrl.getState());
  };

  const handleHeal = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    const ctrl = controllerRef.current;
    if (!ctrl) return;
    manualDemoLockUntilRef.current = Date.now() + 1200;
    ctrl.heal(15);
    syncControllerStateToLiveSim(ctrl.getState());
  };

  const handleAddShield = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    const ctrl = controllerRef.current;
    if (!ctrl) return;
    manualDemoLockUntilRef.current = Date.now() + 1200;
    ctrl.addShield(30);
    syncControllerStateToLiveSim(ctrl.getState());
  };

  const handleToggleLowHp = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.blur();
    const ctrl = controllerRef.current;
    if (!ctrl) return;
    manualDemoLockUntilRef.current = Date.now() + 1200;
    ctrl.toggleLowHealth();
    syncControllerStateToLiveSim(ctrl.getState());
  };

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      {/* AAA Botanical Health Bar Container (.hud-healthbar) */}
      <div
        ref={barRef}
        data-testid="hud-healthbar"
        role="meter"
        aria-label="Player Health"
        aria-valuenow={Math.round(snapshot.state.hp)}
        aria-valuemin={0}
        aria-valuemax={Math.round(snapshot.state.maxHp)}
        className="hud-healthbar"
      >
        {/* Meter Track (.hp-track) positioned behind the PNG frame cutout */}
        <div data-testid="hp-track" className="hp-track">
          <div data-testid="hp-ghost-fill" className="hp-ghost-fill" />
          <div data-testid="hp-main-fill" className="hp-main-fill" />
          <div
            data-testid="shield-fill"
            data-empty={!snapshot.view.hasShield}
            className="shield-fill"
          />
        </div>

        {/* Static PNG Frame Overlay (healthbar-frame.png, pointer-events: none) */}
        <div className="healthbar-frame-overlay" aria-hidden="true" />

        {/* Heart Socket (.heart-icon) positioned on left anchor point above frame */}
        <div data-testid="heart-icon" className="heart-icon" aria-hidden="true" />
      </div>

      {/* Development-Only Interactive Demo Buttons ("Damage -20", "Heal +15", "Add Shield +30", "Toggle Low HP") */}
      {IS_DEV && showDemoControls && (
        <div
          data-testid="healthbar-demo-controls"
          className="flex items-center gap-1 pointer-events-auto flex-nowrap"
        >
          <button
            type="button"
            data-testid="btn-damage-20"
            onClick={handleDamage}
            className="px-2 py-1 rounded-md bg-[#2A1219]/95 hover:bg-[#3F1924] border border-[#FF2A55]/60 text-[10px] font-mono-tabular font-bold text-[#FFD5DF] shadow transition-transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
          >
            Damage -20
          </button>
          <button
            type="button"
            data-testid="btn-heal-15"
            onClick={handleHeal}
            className="px-2 py-1 rounded-md bg-[#0F291E]/95 hover:bg-[#163D2C] border border-[#4ADE80]/60 text-[10px] font-mono-tabular font-bold text-[#D1FAE5] shadow transition-transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
          >
            Heal +15
          </button>
          <button
            type="button"
            data-testid="btn-shield-30"
            onClick={handleAddShield}
            className="px-2 py-1 rounded-md bg-[#0F2233]/95 hover:bg-[#16324B] border border-[#38BDF8]/60 text-[10px] font-mono-tabular font-bold text-[#E0F2FE] shadow transition-transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0"
          >
            Add Shield +30
          </button>
          <button
            type="button"
            data-testid="btn-toggle-low-hp"
            aria-pressed={snapshot.view.isCritical}
            onClick={handleToggleLowHp}
            className={`px-2 py-1 rounded-md border text-[10px] font-mono-tabular font-bold shadow transition-transform active:scale-95 cursor-pointer whitespace-nowrap shrink-0 ${
              snapshot.view.isCritical
                ? 'bg-[#5A0014] border-[#FF0033] text-[#FFF1F2] shadow-[0_0_8px_rgba(255,0,51,0.5)]'
                : 'bg-[#1F1624]/95 hover:bg-[#2D2034] border-[#E8B64A]/50 text-[#FDE68A]'
            }`}
          >
            Toggle Low HP
          </button>
        </div>
      )}
    </div>
  );
}
