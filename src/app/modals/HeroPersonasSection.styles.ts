import type { CSSProperties } from 'react';

export const getPersonaCardClassName = (isSelected: boolean, isUnlocked: boolean): string => {
  if (isSelected) {
    return 'bg-[#36493E] border-[#A8E6CF] shadow-[0_0_14px_rgba(168,230,207,0.22)]';
  }
  if (isUnlocked) {
    return 'bg-[#1E1520] border-[#DED2F9]/45';
  }
  return 'bg-[#130D16] border-[#FFFDF0]/15';
};

export const getPortraitContainerClassName = (isUnlocked: boolean): string => {
  return isUnlocked
    ? 'bg-[#2B1F2D] border-[#A8E6CF]/60'
    : 'bg-[#08050B] border-[#2D1E2F] shadow-inner';
};

export const getPortraitImgClassName = (isUnlocked: boolean): string => {
  return isUnlocked ? '' : 'opacity-90 contrast-200 drop-shadow-[0_0_6px_rgba(168,85,247,0.35)]';
};

export const getPipClassName = (isActive: boolean): string => {
  return isActive ? 'bg-[#A8E6CF]' : 'bg-[#FFFDF0]/15';
};

export const getWearButtonClassName = (isSelected: boolean): string => {
  return isSelected
    ? 'bg-[#E11D48] hover:bg-[#BE123C] text-[#FFFDF0] shadow-sm'
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
