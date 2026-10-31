/**
 * @file StatPill.tsx
 * Ornate currency / score pill with gold laurel border and smooth number tick animation.
 */

import React, { useEffect, useRef, useState } from 'react';
import { LaurelButtonOrnamentSvg } from './ornateAssets';

export interface StatPillProps {
  value: number;
  icon?: React.ReactNode;
  label?: string;
  secondaryContent?: React.ReactNode;
  ornament?: 'laurel' | 'none';
  className?: string;
  dataTestId?: string;
  valueTestId?: string;
  onClick?: () => void;
  title?: string;
}

export const StatPill: React.FC<StatPillProps> = ({
  value,
  icon,
  label,
  secondaryContent,
  ornament = 'laurel',
  className = '',
  dataTestId,
  valueTestId,
  onClick,
  title,
}) => {
  const [displayedValue, setDisplayedValue] = useState<number>(value);
  const [isTicking, setIsTicking] = useState(false);
  const prevValueRef = useRef<number>(value);

  useEffect(() => {
    const startVal = prevValueRef.current;
    const endVal = value;
    prevValueRef.current = value;

    if (startVal === endVal) {
      setDisplayedValue(endVal);
      return;
    }

    setIsTicking(true);
    const durationMs = 260;
    const startTime = performance.now();
    let rafId = 0;

    const step = (now: number) => {
      const t = Math.min(1, (now - startTime) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayedValue(Math.round(startVal + (endVal - startVal) * eased));
      if (t < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        setDisplayedValue(endVal);
        setIsTicking(false);
      }
    };

    rafId = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(rafId);
    };
  }, [value]);

  const innerContent = (
    <>
      {ornament === 'laurel' && <LaurelButtonOrnamentSvg />}
      {icon && <span className="relative z-10 shrink-0 flex items-center">{icon}</span>}
      {label && (
        <span className="relative z-10 text-[11px] font-semibold text-[#e8d8b7]/85 uppercase tracking-wider">
          {label}
        </span>
      )}
      <span
        data-testid={valueTestId}
        className={`relative z-10 font-mono-tabular font-extrabold text-[#fff4b8] transition-transform duration-150 ${
          isTicking ? 'scale-110 text-[#ffffff]' : 'scale-100'
        }`}
      >
        {displayedValue}
      </span>
      {secondaryContent && (
        <span className="relative z-10 flex items-center gap-1.5 ml-1">{secondaryContent}</span>
      )}
    </>
  );

  const baseClasses = `relative inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-b from-[#261a2c]/95 to-[#160f1b]/95 border-2 border-[#e8b84e]/75 shadow-[0_10px_24px_rgba(5,2,10,0.82),0_3px_8px_rgba(0,0,0,0.7),inset_0_1px_0_rgba(255,241,176,0.3)] text-sm select-none shrink-0 ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        title={title}
        data-testid={dataTestId}
        className={`${baseClasses} cursor-pointer hover:border-[#fff1b0] active:scale-95 transition-all`}
      >
        {innerContent}
      </button>
    );
  }

  return (
    <div data-testid={dataTestId} title={title} className={baseClasses}>
      {innerContent}
    </div>
  );
};

export default StatPill;
