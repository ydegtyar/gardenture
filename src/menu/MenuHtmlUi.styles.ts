import type { CSSProperties } from 'react';

export const getMainContainerClassName = (isExiting: boolean): string =>
  `relative z-10 w-full h-full flex flex-col justify-between p-3.5 sm:p-6 md:px-9 md:py-7 pointer-events-none overflow-y-auto overflow-x-hidden safe-area-inset transition-opacity duration-150 ${
    isExiting ? 'opacity-0' : 'opacity-100'
  }`;

export const styles = {
  // Co-located static CSS properties if needed
} as const satisfies Record<string, CSSProperties>;
