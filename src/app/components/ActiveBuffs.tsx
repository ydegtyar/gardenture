import React from 'react';
import {
  POWERUPS,
  type PowerUpId,
  powerUpIcon,
} from '../../game/data/powerups';
import { cn } from '../../utils/cn';

export interface ActiveBuff {
  id: PowerUpId;
  remainingSec: number; // ticked down in the game loop
}

export function ActiveBuffs({ buffs }: { buffs: ActiveBuff[] }) {
  if (!buffs || buffs.length === 0) return null;

  return (
    <div
      data-testid="hud-active-buffs"
      className="hud-buffs flex items-center gap-2 mt-1 pointer-events-none w-max"
    >
      {buffs.map((b) => {
        const def = POWERUPS[b.id];
        if (!def) return null;
        const pct = Math.max(0, Math.min(1, b.remainingSec / def.durationSec));
        const isExpiring = pct <= 0.25 && def.durationSec >= 2.0;
        const isShortFlash = b.id === 'clover-magnet' || b.id === 'heal-20hp';

        return (
          <div
            key={b.id}
            data-testid={`hud-buff-${b.id}`}
            className={cn(
              'hud-buff relative w-11 h-11 sm:w-12 sm:h-12 rounded-[10px] bg-[#241a2b] border-2 flex items-center justify-center overflow-hidden transition-transform duration-150',
              isExpiring && 'hud-buff--expiring animate-pulse scale-105',
              isShortFlash && 'scale-105'
            )}
            style={
              {
                '--accent': def.accent,
                '--pct': `${pct * 360}deg`,
                borderColor: def.accent,
                boxShadow: `0 0 12px ${def.accent}66`,
              } as React.CSSProperties
            }
            title={`${def.name} — ${def.description}`}
          >
            <img
              src={powerUpIcon(b.id, 64)}
              srcSet={`${powerUpIcon(b.id, 128)} 2x`}
              alt={def.name}
              width={40}
              height={40}
              referrerPolicy="no-referrer"
              className="relative z-10 w-9 h-9 sm:w-10 sm:h-10 object-contain select-none"
            />
            <div
              className="hud-buff__sweep absolute inset-0 pointer-events-none"
              style={{
                background: `conic-gradient(transparent ${pct * 360}deg, rgba(0,0,0,0.68) 0deg)`,
              }}
            />
            <span
              data-testid={`hud-buff-timer-${b.id}`}
              className="hud-buff__time absolute bottom-0 inset-x-0 z-20 bg-[#140D16]/85 text-[9px] font-mono-tabular font-black text-center text-[#FFFDF0] leading-tight py-0.2"
              style={{ color: def.accent }}
            >
              {b.remainingSec.toFixed(1)}s
            </span>
          </div>
        );
      })}
    </div>
  );
}
