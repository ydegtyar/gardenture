/**
 * XP Thresholds per Level (Spec Section 10: front-loaded so first level-up is within ~8s)
 */
export const XP_TO_NEXT_LEVEL: number[] = [
  6,   // Lv 1 -> 2
  10,  // Lv 2 -> 3
  16,  // Lv 3 -> 4
  24,  // Lv 4 -> 5
  34,  // Lv 5 -> 6
  46,  // Lv 6 -> 7
  60,  // Lv 7 -> 8
  76,  // Lv 8 -> 9
  94,  // Lv 9 -> 10
  114, // Lv 10 -> 11
  136, // Lv 11 -> 12
  160, // Lv 12 -> 13
  188, // Lv 13 -> 14
];

export function getXpRequiredForLevel(level: number): number {
  const idx = Math.max(0, level - 1);
  if (idx < XP_TO_NEXT_LEVEL.length) {
    return XP_TO_NEXT_LEVEL[idx]!;
  }
  return 188 + (idx - XP_TO_NEXT_LEVEL.length + 1) * 32;
}
