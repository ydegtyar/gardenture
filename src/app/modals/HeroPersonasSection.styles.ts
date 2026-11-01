import type { CSSProperties } from 'react';

export const getPersonaCardClassName = (isSelected: boolean, isUnlocked: boolean): string => {
  if (isSelected) {
    return 'bg-gradient-to-br from-[#13281e] via-[#0d1a14] to-[#070e0a] border-[#6EE7B7] ring-1 ring-[#6EE7B7]/45 shadow-[0_14px_32px_rgba(0,0,0,0.9),0_0_18px_rgba(52,211,153,0.28),inset_0_1px_0_rgba(167,243,208,0.28)]';
  }
  if (isUnlocked) {
    return 'bg-gradient-to-br from-[#1D1712] via-[#120E0B] to-[#0B0907] border-[#7D623A]/85 hover:border-[#9E824C] shadow-[0_12px_28px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,232,175,0.18)]';
  }
  return 'bg-gradient-to-br from-[#18181B] via-[#121215] to-[#0C0C0E] border-[#4A463E]/70 shadow-[0_10px_24px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.05)]';
};

export const getPersonaInnerBevelClassName = (isSelected: boolean, isUnlocked: boolean): string => {
  if (isSelected) {
    return 'border-[#6EE7B7]/38';
  }
  if (isUnlocked) {
    return 'border-[#C89D54]/28';
  }
  return 'border-[#5C564C]/22';
};

export const getPortraitContainerClassName = (isUnlocked: boolean): string => {
  return isUnlocked
    ? 'bg-gradient-to-b from-[#231915] via-[#17110E] to-[#0E0A08] border-[#C89D54]/55 shadow-[inset_0_2px_10px_rgba(0,0,0,0.85),0_0_12px_rgba(212,168,83,0.18)]'
    : 'bg-gradient-to-b from-[#121016] to-[#08050B] border-[#4A463E]/60 shadow-inner';
};

export const getPortraitImgClassName = (isUnlocked: boolean): string => {
  return isUnlocked ? '' : 'opacity-90 contrast-200 drop-shadow-[0_0_6px_rgba(168,85,247,0.35)]';
};

export const getPipClassName = (isActive: boolean): string => {
  return isActive ? 'bg-[#A8E6CF]' : 'bg-[#FFFDF0]/15';
};

export const getWearButtonClassName = (isSelected: boolean): string => {
  return isSelected
    ? 'bg-[#E11D48] hover:bg-[#BE123C] text-[#FFFDF0] shadow-sm border border-[#FDA4AF]/40'
    : 'btn-herbarium-secondary-compact';
};

export const getEyeDotStyle = (colorHex: string): CSSProperties => ({
  backgroundColor: colorHex,
});

export const styles = {
  container: {
    // Structural styles if needed
  },
} as const satisfies Record<string, CSSProperties>;
