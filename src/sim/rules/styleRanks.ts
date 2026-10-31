import type { StyleRankDef } from '../../content/schema/types';

/**
 * Devil May Cry Style Rank Table (Spec Section 13: D, C, B, A, S, SS, SSS)
 */
export const STYLE_RANKS: StyleRankDef[] = [
  { index: 0, letter: 'D', title: 'Dull Sprout', drainPerSec: 3.0, scoreMult: 1.0, currencyMult: 1.0, colorHex: '#94A3B8', colorNum: 0x94a3b8 },
  { index: 1, letter: 'C', title: 'Crisp Cut', drainPerSec: 5.5, scoreMult: 1.3, currencyMult: 1.1, colorHex: '#A8E6CF', colorNum: 0xa8e6cf },
  { index: 2, letter: 'B', title: 'Bold Briar', drainPerSec: 9.0, scoreMult: 1.7, currencyMult: 1.2, colorHex: '#88D49E', colorNum: 0x88d49e },
  { index: 3, letter: 'A', title: 'Artful Bloom', drainPerSec: 14.0, scoreMult: 2.2, currencyMult: 1.35, colorHex: '#A0C4FF', colorNum: 0xa0c4ff },
  { index: 4, letter: 'S', title: 'Savage Petal', drainPerSec: 20.5, scoreMult: 3.0, currencyMult: 1.5, colorHex: '#DED2F9', colorNum: 0xded2f9 },
  { index: 5, letter: 'SS', title: 'Solar Sovereign', drainPerSec: 28.5, scoreMult: 4.0, currencyMult: 1.7, colorHex: '#FFAAA6', colorNum: 0xffaaa6 },
  { index: 6, letter: 'SSS', title: 'Supreme Sylvan', drainPerSec: 38.0, scoreMult: 5.5, currencyMult: 2.0, colorHex: '#FDFFB6', colorNum: 0xfdffb6 },
];
