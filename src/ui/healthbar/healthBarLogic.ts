export interface BotanicalHealthBarState {
  hp: number;
  maxHp: number;
  ghostHp: number;
  shield: number;
  maxShield: number;
  forcedLowHealth: boolean;
  preLowHealthHp: number | null;
}

export interface BotanicalHealthBarView {
  hpPct: number;
  ghostPct: number;
  shieldPct: number;
  hasShield: boolean;
  isCritical: boolean;
}

export interface DamageResult {
  nextState: BotanicalHealthBarState;
  hpDelta: number;
  shieldDelta: number;
  shieldShattered: boolean;
}

export interface HealResult {
  nextState: BotanicalHealthBarState;
  healedAmount: number;
}

export interface ShieldResult {
  nextState: BotanicalHealthBarState;
  addedShield: number;
}

export const CRITICAL_HP_RATIO = 0.25;

export function createInitialHealthBarState(
  maxHp = 100,
  initialHp = maxHp,
  initialShield = 0
): BotanicalHealthBarState {
  const safeMaxHp = Math.max(1, maxHp);
  const clampedHp = Math.max(0, Math.min(safeMaxHp, initialHp));
  const clampedShield = Math.max(0, Math.min(safeMaxHp, initialShield));
  return {
    hp: clampedHp,
    maxHp: safeMaxHp,
    ghostHp: clampedHp,
    shield: clampedShield,
    maxShield: safeMaxHp,
    forcedLowHealth: false,
    preLowHealthHp: null,
  };
}

export function computeHealthBarView(state: BotanicalHealthBarState): BotanicalHealthBarView {
  const safeMaxHp = Math.max(1, state.maxHp);
  const safeMaxShield = Math.max(1, state.maxShield);
  const hpRatio = Math.max(0, Math.min(1, state.hp / safeMaxHp));
  const ghostRatio = Math.max(hpRatio, Math.min(1, state.ghostHp / safeMaxHp));
  const shieldRatio = Math.max(0, Math.min(1, state.shield / safeMaxShield));

  return {
    hpPct: Number((hpRatio * 100).toFixed(2)),
    ghostPct: Number((ghostRatio * 100).toFixed(2)),
    shieldPct: Number((shieldRatio * 100).toFixed(2)),
    hasShield: state.shield > 0,
    isCritical: state.forcedLowHealth || (state.hp > 0 && hpRatio < CRITICAL_HP_RATIO) || state.hp === 0,
  };
}

export function applyDamage(
  state: BotanicalHealthBarState,
  rawAmount: number
): DamageResult {
  const amount = Math.max(0, rawAmount);
  if (amount === 0) {
    return {
      nextState: { ...state },
      hpDelta: 0,
      shieldDelta: 0,
      shieldShattered: false,
    };
  }

  const prevShield = state.shield;
  const shieldAbsorbed = Math.min(prevShield, amount);
  const nextShield = Math.max(0, prevShield - shieldAbsorbed);
  const remainingDamage = Math.max(0, amount - shieldAbsorbed);
  const nextHp = Math.max(0, state.hp - remainingDamage);
  const shieldShattered = prevShield > 0 && nextShield === 0;

  const nextState: BotanicalHealthBarState = {
    ...state,
    hp: nextHp,
    // Keep ghostHp at the pre-damage level so .hp-ghost-fill trails behind
    ghostHp: Math.max(state.ghostHp, state.hp),
    shield: nextShield,
    forcedLowHealth:
      nextHp / Math.max(1, state.maxHp) < CRITICAL_HP_RATIO ? state.forcedLowHealth : false,
  };

  return {
    nextState,
    hpDelta: state.hp - nextHp,
    shieldDelta: prevShield - nextShield,
    shieldShattered,
  };
}

export function syncGhostToCurrentHp(
  state: BotanicalHealthBarState
): BotanicalHealthBarState {
  return {
    ...state,
    ghostHp: state.hp,
  };
}

export function applyHeal(
  state: BotanicalHealthBarState,
  rawAmount: number
): HealResult {
  const amount = Math.max(0, rawAmount);
  const nextHp = Math.min(state.maxHp, state.hp + amount);
  const healedAmount = nextHp - state.hp;
  const isStillLow = nextHp / Math.max(1, state.maxHp) < CRITICAL_HP_RATIO;

  const nextState: BotanicalHealthBarState = {
    ...state,
    hp: nextHp,
    ghostHp: nextHp,
    forcedLowHealth: isStillLow ? state.forcedLowHealth : false,
    preLowHealthHp: isStillLow ? state.preLowHealthHp : null,
  };

  return {
    nextState,
    healedAmount,
  };
}

export function applyShield(
  state: BotanicalHealthBarState,
  rawAmount: number
): ShieldResult {
  const amount = Math.max(0, rawAmount);
  const nextShield = Math.min(state.maxShield, state.shield + amount);
  return {
    nextState: {
      ...state,
      shield: nextShield,
    },
    addedShield: nextShield - state.shield,
  };
}

export function applySetLowHealth(
  state: BotanicalHealthBarState,
  lowHealth: boolean
): BotanicalHealthBarState {
  const safeMaxHp = Math.max(1, state.maxHp);
  const currentRatio = state.hp / safeMaxHp;

  if (lowHealth) {
    const targetLowHp =
      currentRatio < CRITICAL_HP_RATIO
        ? state.hp
        : Math.max(1, Math.round(safeMaxHp * 0.18));
    return {
      ...state,
      hp: targetLowHp,
      ghostHp: targetLowHp,
      forcedLowHealth: true,
      preLowHealthHp: currentRatio >= CRITICAL_HP_RATIO ? state.hp : state.preLowHealthHp,
    };
  }

  const restoredHp =
    state.preLowHealthHp !== null && state.preLowHealthHp / safeMaxHp >= CRITICAL_HP_RATIO
      ? state.preLowHealthHp
      : currentRatio < CRITICAL_HP_RATIO
        ? Math.round(safeMaxHp * 0.85)
        : state.hp;

  return {
    ...state,
    hp: restoredHp,
    ghostHp: restoredHp,
    forcedLowHealth: false,
    preLowHealthHp: null,
  };
}
