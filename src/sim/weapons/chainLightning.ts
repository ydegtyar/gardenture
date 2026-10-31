/**
 * Chain Lightning Pure Targeting Logic
 * Layer 3 (sim): 100% pure TypeScript. Zero DOM, Zero PixiJS imports.
 *
 * Implements deterministic seeded targeting, jump progression,
 * resilience against mid-chain enemy deaths, and pre-allocated buffers
 * to eliminate runtime garbage collection.
 */

import type { SimEnemy } from '../Simulation';

export interface ChainStrikeStep {
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  targetId: number;
  enemy: SimEnemy;
  jumpIndex: number;
}

export interface ChainLightningTargetingConfig {
  range: number;
  chainRange: number;
  maxChains: number;
}

export interface SeededRngLike {
  next?: () => number;
  pick?: <T>(items: readonly T[]) => T;
}

// Pre-allocated hot-path buffers to avoid garbage collection allocations per cast
const MAX_POOLED_STEPS = 64;
const candidateBuffer: SimEnemy[] = [];
const hitEnemyIdSet: Set<number> = new Set<number>();
const pooledSteps: ChainStrikeStep[] = Array.from({ length: MAX_POOLED_STEPS }, () => ({
  fromX: 0,
  fromY: 0,
  toX: 0,
  toY: 0,
  targetId: 0,
  enemy: null as unknown as SimEnemy,
  jumpIndex: 0,
}));
const defaultOutBuffer: ChainStrikeStep[] = [];

/**
 * Uniform random picker supporting the project's SeededRNG and falling back safely.
 */
function pickRandomEnemy(candidates: readonly SimEnemy[], rng?: SeededRngLike): SimEnemy {
  if (candidates.length === 1) {
    return candidates[0]!;
  }
  if (rng?.pick) {
    return rng.pick(candidates);
  }
  if (rng?.next) {
    const idx = Math.floor(rng.next() * candidates.length);
    return candidates[idx]!;
  }
  const idx = Math.floor(Math.random() * candidates.length);
  return candidates[idx]!;
}

/**
 * Pure targeting function for Chain Lightning.
 *
 * Algorithm:
 * 1. Initial strike: collect all valid enemies (hp > 0, koTimer <= 0) within `range`
 *    of the caster (casterX, casterY). Pick one uniformly at random. If none, returns empty.
 * 2. Chain jumps: after each strike, store the strike point (the hit enemy's position).
 *    For subsequent jumps, collect valid enemies within `chainRange` of the last strike point
 *    (NOT the caster) and pick one uniformly at random.
 * 3. Exclude enemies already hit by this chain.
 * 4. An enemy dying mid-chain does NOT break the chain because the strike position is preserved.
 * 5. Reuses pre-allocated buffers to prevent hot-path allocations.
 */
export function findChainLightningTargets(
  casterX: number,
  casterY: number,
  enemies: readonly SimEnemy[],
  config: ChainLightningTargetingConfig,
  rng?: SeededRngLike,
  outBuffer: ChainStrikeStep[] = defaultOutBuffer,
  excludeIds?: ReadonlySet<number>
): ChainStrikeStep[] {
  candidateBuffer.length = 0;
  hitEnemyIdSet.clear();
  if (excludeIds) {
    for (const id of excludeIds) {
      hitEnemyIdSet.add(id);
    }
  }
  outBuffer.length = 0;

  if (config.maxChains <= 0 || enemies.length === 0) {
    return outBuffer;
  }

  // 1. Initial strike candidates within range of the caster
  const rangeSq = config.range * config.range;
  for (let i = 0; i < enemies.length; i++) {
    const e = enemies[i]!;
    if (e.hp <= 0 || e.koTimer > 0 || hitEnemyIdSet.has(e.id)) continue;
    const dx = e.x - casterX;
    const dy = e.y - casterY;
    if (dx * dx + dy * dy <= rangeSq) {
      candidateBuffer.push(e);
    }
  }

  if (candidateBuffer.length === 0) {
    return outBuffer;
  }

  // Pick initial target uniformly at random
  const firstTarget = pickRandomEnemy(candidateBuffer, rng);
  hitEnemyIdSet.add(firstTarget.id);

  let currX = firstTarget.x;
  let currY = firstTarget.y;

  let stepCount = 0;
  const initialStep = pooledSteps[stepCount]!;
  initialStep.fromX = casterX;
  initialStep.fromY = casterY;
  initialStep.toX = currX;
  initialStep.toY = currY;
  initialStep.targetId = firstTarget.id;
  initialStep.enemy = firstTarget;
  initialStep.jumpIndex = 0;
  outBuffer.push(initialStep);
  stepCount++;

  // 2. Chain jumps: search within chainRange of the last strike point
  const chainRangeSq = config.chainRange * config.chainRange;

  for (let b = 1; b < config.maxChains; b++) {
    candidateBuffer.length = 0;

    for (let i = 0; i < enemies.length; i++) {
      const e = enemies[i]!;
      if (e.hp <= 0 || e.koTimer > 0 || hitEnemyIdSet.has(e.id)) continue;
      const dx = e.x - currX;
      const dy = e.y - currY;
      if (dx * dx + dy * dy <= chainRangeSq) {
        candidateBuffer.push(e);
      }
    }

    if (candidateBuffer.length === 0) {
      break;
    }

    const nextTarget = pickRandomEnemy(candidateBuffer, rng);
    hitEnemyIdSet.add(nextTarget.id);

    const nextX = nextTarget.x;
    const nextY = nextTarget.y;

    if (stepCount < MAX_POOLED_STEPS) {
      const nextStep = pooledSteps[stepCount]!;
      nextStep.fromX = currX;
      nextStep.fromY = currY;
      nextStep.toX = nextX;
      nextStep.toY = nextY;
      nextStep.targetId = nextTarget.id;
      nextStep.enemy = nextTarget;
      nextStep.jumpIndex = b;
      outBuffer.push(nextStep);
      stepCount++;
    }

    // Store strike point for the next jump (preserved even if enemy dies)
    currX = nextX;
    currY = nextY;
  }

  return outBuffer;
}
