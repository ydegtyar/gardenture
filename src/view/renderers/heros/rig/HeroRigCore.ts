import { clamp, lerp } from '../../../../core/math/vec2';

/**
 * ============================================================================
 * PROCEDURAL 2D HERO RIG, FACING CONTROLLER, ANALYTIC 2-BONE IK,
 * DETERMINISTIC SECONDARY MOTION, AND BEHAVIOR FSM
 * ============================================================================
 * Pure, deterministic, zero-allocation-friendly math & simulation core for
 * procedural cel-shaded vector heroes and personas.
 *
 * Key Guarantees:
 * 1. NEVER uses negative scale (scaleX > 0, scaleY > 0 at all times).
 * 2. Facing is a continuous parameter in [-1, 1] with a ~120ms 3/4-turn
 *    anticipation & subtle overshoot curve, plus a 2D direction vector.
 * 3. Locomotion gait phase is driven strictly by actual distance travelled
 *    so feet never slide when stationary or decelerating.
 * 4. Two-bone analytic IK solves elbow & knee joints cleanly from hip/shoulder
 *    to hand/foot targets.
 * 5. Deterministic fixed-step spring/verlet chains drive hair, twin-tails,
 *    capes, sleeves, sashes, tassels, and robe hems with clamped stretch.
 */

export interface Vec2 {
  x: number;
  y: number;
}

export type SocketName =
  | 'handNear'
  | 'handFar'
  | 'back'
  | 'hip'
  | 'castOrigin'
  | 'headTop'
  | 'feet';

export interface SocketTransform {
  x: number;
  y: number;
  angle: number;
  /** Depth layer hint: -1 = behind body (gUnder), +1 = in front of body (gOver) */
  layer: -1 | 1;
}

export type SocketMap = Record<SocketName, SocketTransform>;

export type HeroActionState =
  | 'Idle'
  | 'Move'
  | 'Dash'
  | 'Attack'
  | 'Cast'
  | 'Hit'
  | 'Dead';

export type HeroGaitStyle = 'bruiser' | 'agile' | 'serene' | 'levitate';

export interface HeroRigProportions {
  /** Height from ground (0) to pelvis center (negative Y is up in screen space) */
  pelvisHeight: number;
  /** Torso length from pelvis to neck */
  torsoLength: number;
  /** Torso base width at chest/shoulders */
  chestWidth: number;
  /** Pelvis/hip width */
  hipWidth: number;
  /** Neck length */
  neckLength: number;
  /** Head radius */
  headRadius: number;
  /** Upper arm bone length */
  upperArmLength: number;
  /** Lower arm (forearm) bone length */
  lowerArmLength: number;
  /** Thigh bone length */
  thighLength: number;
  /** Shin bone length */
  shinLength: number;
  /** Stride length multiplier in pixels */
  strideLength: number;
  /** Distance-to-phase radians multiplier */
  strideFrequency: number;
  /** Pelvis vertical bob amplitude during walk/run */
  bobAmplitude: number;
  /** Forward lean multiplier per unit of velocity */
  leanMultiplier: number;
}

export const DEFAULT_RIG_PROPORTIONS: Record<string, HeroRigProportions> = {
  warden: {
    pelvisHeight: 11.5,
    torsoLength: 14.5,
    chestWidth: 15.0,
    hipWidth: 11.0,
    neckLength: 2.5,
    headRadius: 10.5,
    upperArmLength: 6.5,
    lowerArmLength: 6.5,
    thighLength: 6.0,
    shinLength: 6.0,
    strideLength: 8.5,
    strideFrequency: 0.24,
    bobAmplitude: 2.2,
    leanMultiplier: 0.032,
  },
  seeker: {
    pelvisHeight: 11.5,
    torsoLength: 13.5,
    chestWidth: 12.5,
    hipWidth: 9.2,
    neckLength: 2.5,
    headRadius: 10.0,
    upperArmLength: 6.2,
    lowerArmLength: 6.2,
    thighLength: 6.2,
    shinLength: 6.0,
    strideLength: 9.8,
    strideFrequency: 0.28,
    bobAmplitude: 1.8,
    leanMultiplier: 0.048,
  },
  herbalist: {
    pelvisHeight: 10.5,
    torsoLength: 14.0,
    chestWidth: 12.8,
    hipWidth: 10.2,
    neckLength: 2.2,
    headRadius: 10.8,
    upperArmLength: 6.0,
    lowerArmLength: 6.0,
    thighLength: 5.5,
    shinLength: 5.5,
    strideLength: 7.4,
    strideFrequency: 0.23,
    bobAmplitude: 1.5,
    leanMultiplier: 0.028,
  },
  stormcaller: {
    pelvisHeight: 12.5,
    torsoLength: 14.5,
    chestWidth: 13.2,
    hipWidth: 9.8,
    neckLength: 2.6,
    headRadius: 10.2,
    upperArmLength: 6.4,
    lowerArmLength: 6.4,
    thighLength: 6.2,
    shinLength: 6.0,
    strideLength: 7.8,
    strideFrequency: 0.22,
    bobAmplitude: 1.6,
    leanMultiplier: 0.035,
  },
};

export interface ActionPhaseData {
  phase: 'idle' | 'anticipation' | 'active' | 'recovery';
  /** Normalized progress within current phase [0..1] */
  progress: number;
  /** Normalized overall action progress [0..1] */
  totalProgress: number;
  /** True during the active strike/cast hit window */
  hitWindowActive: boolean;
  /** True when the action is in recovery and can be animation-cancelled */
  canCancel: boolean;
  /** Swing parity (+1 or -1) for alternating slashes */
  swingDir: 1 | -1;
  /** Target world angle for the action */
  aimAngle: number;
}

export interface PoseLayer {
  pelvisOffsetX: number;
  pelvisOffsetY: number;
  torsoLean: number;
  torsoTwist: number;
  headTurn: number;
  headTilt: number;
  /** Positive-only squash and stretch (strictly > 0) */
  scaleX: number;
  scaleY: number;
  handNearOffset: Vec2;
  handFarOffset: Vec2;
}

export interface HeroRig {
  root: Vec2;
  pelvis: Vec2;
  torso: Vec2;
  neck: Vec2;
  head: Vec2;
  shoulderNear: Vec2;
  shoulderFar: Vec2;
  elbowNear: Vec2;
  elbowFar: Vec2;
  handNear: Vec2;
  handFar: Vec2;
  hipNear: Vec2;
  hipFar: Vec2;
  kneeNear: Vec2;
  kneeFar: Vec2;
  footNear: Vec2;
  footFar: Vec2;
}

export interface SpringNode2D {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  length: number;
}

export interface SpringChain2D {
  id: string;
  nodes: SpringNode2D[];
  stiffness: number;
  damping: number;
  gravityY: number;
  maxStretchRatio: number;
  initialized?: boolean;
}

export interface HeroSecondaryMotionChains {
  hairLeft: SpringChain2D;
  hairRight: SpringChain2D;
  cape: SpringChain2D;
  sash: SpringChain2D;
  sleeveNear: SpringChain2D;
  sleeveFar: SpringChain2D;
  robeHem: SpringChain2D;
}

export interface HeroPose {
  /** World-space root anchor at ground level (hx, groundY) */
  rootX: number;
  rootY: number;
  /** World-space visual center (hx, cy) */
  centerY: number;
  /** Continuous horizontal facing in [-1, 1]; never snaps, drives 3/4 view */
  facing: number;
  /** Sign of facing (+1 or -1, non-zero) for socket side conventions */
  facingSign: 1 | -1;
  /** Normalized 2D movement/aim direction vector */
  dirX: number;
  dirY: number;
  /** Smoothed facing angle in radians */
  facingAngle: number;
  /** Turn velocity (rate of change of facing) for 3/4 turn anticipation/overshoot */
  turnVelocity: number;
  /** Strictly positive squash & stretch scales (scaleX > 0, scaleY > 0) */
  scaleX: number;
  scaleY: number;
  /** Vertical jump/dash/levitation lift above ground (>= 0) */
  liftHeight: number;
  /** Distance-driven gait phase in radians */
  gaitPhase: number;
  /** Smoothed locomotion blend weight [0..1] */
  moveWeight: number;
  /** Upper-body action blend weight [0..1] */
  actionWeight: number;
  /** Active FSM state */
  actionState: HeroActionState;
  /** Exposed attack/cast phase data for gameplay/attachments */
  actionPhase: ActionPhaseData;
  /** Torso lean angle in radians */
  torsoLean: number;
  /** Torso twist factor [-1..1] */
  torsoTwist: number;
  /** Head gaze horizontal shift in pixels */
  headGazeX: number;
  /** Head gaze vertical shift in pixels */
  headGazeY: number;
  /** Head tilt angle in radians */
  headTilt: number;
  /** Spontaneous eye blink state [0 = open, 1 = closed] */
  blinkAmount: number;
  /** Hit flash intensity [0..1] */
  hitFlash: number;
  /** Dash/invulnerability blink alpha [0..1] */
  invulnBlink: number;
  /** Low health critical ratio [0..1] */
  lowHealthIntensity: number;
  /** Cast/sleeve glow intensity [0..1] from attachments (e.g. Chain Lightning) */
  sleeveGlow: number;
  /** Solved 2D bone joint positions in world space */
  rig: HeroRig;
  /** Named sockets in world space for weapon/VFX attachments */
  sockets: SocketMap;
  /** Secondary spring/verlet chains in world space */
  secondary: HeroSecondaryMotionChains;
  /** LOD level: 0 = full AAA detail, 1 = simplified secondary details */
  lodLevel: 0 | 1;
}

// ============================================================================
// 1. FACING CONTROLLER (Continuous [-1..1], ~120ms Turn Transition, No Mirroring)
// ============================================================================

export interface FacingState {
  /** Continuous horizontal facing in [-1, 1] */
  facing: number;
  /** Spring velocity for facing transitions */
  facingVel: number;
  /** Target horizontal sign (+1 right, -1 left) */
  targetSign: 1 | -1;
  /** Smoothed 2D direction vector */
  dirX: number;
  dirY: number;
  /** Time remaining in active turn transition (seconds) */
  turnTimer: number;
}

export function createFacingState(initialAngle = 0): FacingState {
  const cosA = Math.cos(initialAngle);
  const sinA = Math.sin(initialAngle);
  const sign: 1 | -1 = cosA < -0.05 ? -1 : 1;
  return {
    facing: sign,
    facingVel: 0,
    targetSign: sign,
    dirX: cosA,
    dirY: sinA,
    turnTimer: 0,
  };
}

/**
 * Pure deterministic step for `FacingState`.
 * Animates a 3/4-view transition over ~110-140ms with slight anticipation and
 * spring overshoot, while clamping `facing` to `[-1, 1]`.
 */
export function stepFacingState(
  state: FacingState,
  targetDirX: number,
  targetDirY: number,
  dtSec: number
): FacingState {
  const dt = clamp(dtSec, 0, 0.1);
  const len = Math.hypot(targetDirX, targetDirY);
  const nx = len > 1e-4 ? targetDirX / len : state.dirX;
  const ny = len > 1e-4 ? targetDirY / len : state.dirY;

  // Hysteresis deadzone around vertical axis so hero doesn't jitter-flip
  let desiredSign = state.targetSign;
  if (nx < -0.14) desiredSign = -1;
  else if (nx > 0.14) desiredSign = 1;

  let turnTimer = Math.max(0, state.turnTimer - dt);
  let facingVel = state.facingVel;
  if (desiredSign !== state.targetSign) {
    // Trigger ~125ms 3/4 turn with brief anticipation impulse
    turnTimer = 0.125;
    facingVel -= desiredSign * 2.2;
  }

  // Critically-underdamped spring with ω ≈ 28 rad/s (~115ms zero-crossing)
  const omega = 28.0;
  const zeta = 0.76; // slight overshoot before settling
  const displacement = state.facing - desiredSign;
  const accel = -omega * omega * displacement - 2 * zeta * omega * facingVel;

  facingVel += accel * dt;
  const rawFacing = state.facing + facingVel * dt;
  const facing = clamp(rawFacing, -1, 1);

  const dirBlend = Math.min(1, dt * 20);
  const dirX = lerp(state.dirX, nx, dirBlend);
  const dirY = lerp(state.dirY, ny, dirBlend);
  const dLen = Math.hypot(dirX, dirY) || 1;

  return {
    facing,
    facingVel,
    targetSign: desiredSign,
    dirX: dirX / dLen,
    dirY: dirY / dLen,
    turnTimer,
  };
}

// ============================================================================
// 2. ANALYTIC TWO-BONE IK SOLVER (Arms & Legs)
// ============================================================================

/**
 * Solves a 2-bone limb chain (root -> midJoint -> endEffector) in 2D using the
 * law of cosines.
 *
 * @param rootX Shoulder or Hip X
 * @param rootY Shoulder or Hip Y
 * @param targetX Desired Hand or Foot X
 * @param targetY Desired Hand or Foot Y
 * @param len1 Upper limb length (upperArm or thigh)
 * @param len2 Lower limb length (forearm or shin)
 * @param bendDir +1 or -1 (or continuous value) selecting which side the elbow/knee bends toward
 * @param outMid Output mid-joint (elbow or knee)
 * @param outEnd Output clamped end-effector (hand or foot)
 */
export function solveTwoBoneIK(
  rootX: number,
  rootY: number,
  targetX: number,
  targetY: number,
  len1: number,
  len2: number,
  bendDir: number,
  outMid: Vec2,
  outEnd: Vec2
): void {
  const dx = targetX - rootX;
  const dy = targetY - rootY;
  const rawDist = Math.hypot(dx, dy);
  const maxReach = Math.max(0.01, (len1 + len2) * 0.995);
  const minReach = Math.max(0.01, Math.abs(len1 - len2) + 0.05);
  const dist = clamp(rawDist, minReach, maxReach);

  const dirX = rawDist > 1e-4 ? dx / rawDist : 0;
  const dirY = rawDist > 1e-4 ? dy / rawDist : 1;

  outEnd.x = rootX + dirX * dist;
  outEnd.y = rootY + dirY * dist;

  // Law of cosines for angle at root joint
  const cosAngle = clamp(
    (len1 * len1 + dist * dist - len2 * len2) / (2 * len1 * dist),
    -1,
    1
  );
  const sinAngle = Math.sqrt(Math.max(0, 1 - cosAngle * cosAngle));

  // Perpendicular vector scaled by continuous bendDir in [-1, 1]
  const perpX = -dirY * bendDir;
  const perpY = dirX * bendDir;

  outMid.x = rootX + (dirX * cosAngle + perpX * sinAngle) * len1;
  outMid.y = rootY + (dirY * cosAngle + perpY * sinAngle) * len1;
}

// ============================================================================
// 3. DETERMINISTIC FIXED-STEP SECONDARY MOTION (Verlet / Spring Chains)
// ============================================================================

export function createSpringChain(
  id: string,
  anchorX: number,
  anchorY: number,
  segmentLengths: readonly number[],
  stiffness = 26.0,
  damping = 0.84,
  gravityY = 65.0,
  maxStretchRatio = 1.15
): SpringChain2D {
  const nodes: SpringNode2D[] = [{ x: anchorX, y: anchorY, prevX: anchorX, prevY: anchorY, length: 0 }];
  let curY = anchorY;
  for (const segLen of segmentLengths) {
    curY += segLen;
    nodes.push({
      x: anchorX,
      y: curY,
      prevX: anchorX,
      prevY: curY,
      length: segLen,
    });
  }
  return {
    id,
    nodes,
    stiffness,
    damping,
    gravityY,
    maxStretchRatio,
  };
}

/**
 * Advances a 2D spring/verlet chain with a deterministic fixed substep,
 * responding to anchor movement, hero velocity drag, wind oscillation,
 * and clamped distance constraints so segments never over-stretch.
 */
export function stepSpringChain(
  chain: SpringChain2D,
  anchorX: number,
  anchorY: number,
  heroVx: number,
  heroVy: number,
  elapsedSeconds: number,
  dtSec: number,
  restOffsetX = 0
): void {
  const nodes = chain.nodes;
  if (nodes.length === 0) return;

  const root = nodes[0]!;
  // Snap chain on first frame or large teleports to avoid lines/trails from (0, 0)
  if (!chain.initialized || Math.hypot(anchorX - root.x, anchorY - root.y) > 90) {
    chain.initialized = true;
    let y = anchorY;
    for (let i = 0; i < nodes.length; i++) {
      const n = nodes[i]!;
      y += n.length;
      n.x = anchorX + restOffsetX * i;
      n.y = y;
      n.prevX = n.x;
      n.prevY = n.y;
    }
    return;
  }

  const fixedDt = 1 / 60;
  const steps = clamp(Math.round(dtSec / fixedDt), 1, 3);
  const subDt = clamp(dtSec / steps, 0.002, 0.025);

  root.prevX = root.x;
  root.prevY = root.y;
  root.x = anchorX;
  root.y = anchorY;

  for (let s = 0; s < steps; s++) {
    for (let i = 1; i < nodes.length; i++) {
      const node = nodes[i]!;
      const parent = nodes[i - 1]!;

      const vx = (node.x - node.prevX) * chain.damping;
      const vy = (node.y - node.prevY) * chain.damping;
      node.prevX = node.x;
      node.prevY = node.y;

      // Ambient breeze wave + opposite drag from hero world velocity
      const breeze = Math.sin(elapsedSeconds * 4.2 + i * 1.1) * 14.0;
      const dragX = -heroVx * 5.2 + breeze;
      const dragY = -heroVy * 2.5 + chain.gravityY;

      // Soft rest pose spring pull toward (parent.x + restOffsetX, parent.y + node.length)
      const restX = parent.x + restOffsetX;
      const restY = parent.y + node.length;
      const springFx = (restX - node.x) * chain.stiffness;
      const springFy = (restY - node.y) * chain.stiffness;

      node.x += vx + (dragX + springFx) * subDt * subDt;
      node.y += vy + (dragY + springFy) * subDt * subDt;

      // Distance constraint with clamped stretch
      const dx = node.x - parent.x;
      const dy = node.y - parent.y;
      const dist = Math.hypot(dx, dy);
      const maxLen = node.length * chain.maxStretchRatio;
      const minLen = node.length * 0.65;
      if (dist > 1e-4) {
        const targetDist = clamp(dist, minLen, maxLen);
        node.x = parent.x + (dx / dist) * targetDist;
        node.y = parent.y + (dy / dist) * targetDist;
      }
    }
  }
}

// ============================================================================
// 4. HERO BEHAVIOR FSM & PROCEDURAL POSE CONTROLLER
// ============================================================================

export interface HeroControllerInput {
  professionId: string;
  personaId?: string | null;
  hx: number;
  cy: number;
  groundY: number;
  heroVx: number;
  heroVy: number;
  facingAngle: number;
  elapsedSeconds: number;
  dtSec: number;
  isMoving: boolean;
  isDashing: boolean;
  isHit: boolean;
  isDead: boolean;
  isLowHealth: boolean;
  lowHealthRatio: number;
  isLevitating: boolean;
  /** Optional active melee swing state (e.g. Garden Blade or Thorn Spear) */
  meleeWeapon?: {
    phase: string;
    phaseTimer: number;
    swingCounter: number;
    lockedAngle?: number;
  } | null;
  /** Optional active spell/cast state (e.g. Chain Lightning / Cast Heal) */
  isCastingSpell?: boolean;
  castAimAngle?: number;
  reducedMotion?: boolean;
  cameraZoom?: number;
}

/**
 * Lightweight frame profiler & LOD helper for hero rendering.
 */
export class HeroRenderProfiler {
  public static lastFrameDurationMs = 0;
  public static smoothedFrameDurationMs = 0;
  public static drawCallEstimate = 0;

  public static beginFrame(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }

  public static endFrame(startTimeMs: number, drawCalls = 1): void {
    const now = typeof performance !== 'undefined' ? performance.now() : Date.now();
    const elapsed = Math.max(0, now - startTimeMs);
    this.lastFrameDurationMs = elapsed;
    this.smoothedFrameDurationMs =
      this.smoothedFrameDurationMs * 0.9 + elapsed * 0.1;
    this.drawCallEstimate = drawCalls;
  }

  public static computeHeroLodLevel(
    cameraZoom = 1.0,
    reducedMotion = false
  ): 0 | 1 {
    if (reducedMotion || cameraZoom < 0.55) {
      return 1;
    }
    return 0;
  }
}

/**
 * Stateful per-hero procedural rig & animation controller.
 * Maintains continuous facing, distance-driven gait phase, planted foot locks,
 * layered pose weights, blink timers, and deterministic secondary motion chains.
 */
export class HeroProceduralController {
  public facingState: FacingState = createFacingState(0);
  public actionState: HeroActionState = 'Idle';
  public stateTimer = 0;

  /** Distance-driven gait phase (radians) - advances ONLY when hero moves in world space */
  public gaitPhase = 0;
  private lastWorldX = Number.NaN;
  private lastWorldY = Number.NaN;
  private prevSpeed = 0;
  private stopSlideTimer = 0;
  private stopSlideDirX = 0;

  /** Layer weights for smooth blending (no pops) */
  public moveWeight = 0;
  public actionWeight = 0;
  public castTimer = 0;

  /** Spontaneous blink state */
  private blinkCountdown = 2.8;
  private blinkActiveTimer = 0;

  /** Reusable Pose & Rig allocation (zero per-frame object churn) */
  public readonly pose: HeroPose;

  constructor(initialX = 0, initialY = 0) {
    const makeVec = (): Vec2 => ({ x: initialX, y: initialY });
    const makeSocket = (layer: -1 | 1): SocketTransform => ({
      x: initialX,
      y: initialY,
      angle: 0,
      layer,
    });

    this.pose = {
      rootX: initialX,
      rootY: initialY,
      centerY: initialY,
      facing: 1,
      facingSign: 1,
      dirX: 1,
      dirY: 0,
      facingAngle: 0,
      turnVelocity: 0,
      scaleX: 1,
      scaleY: 1,
      liftHeight: 0,
      gaitPhase: 0,
      moveWeight: 0,
      actionWeight: 0,
      actionState: 'Idle',
      actionPhase: {
        phase: 'idle',
        progress: 0,
        totalProgress: 0,
        hitWindowActive: false,
        canCancel: true,
        swingDir: 1,
        aimAngle: 0,
      },
      torsoLean: 0,
      torsoTwist: 0,
      headGazeX: 0,
      headGazeY: 0,
      headTilt: 0,
      blinkAmount: 0,
      hitFlash: 0,
      invulnBlink: 0,
      lowHealthIntensity: 0,
      sleeveGlow: 0,
      rig: {
        root: makeVec(),
        pelvis: makeVec(),
        torso: makeVec(),
        neck: makeVec(),
        head: makeVec(),
        shoulderNear: makeVec(),
        shoulderFar: makeVec(),
        elbowNear: makeVec(),
        elbowFar: makeVec(),
        handNear: makeVec(),
        handFar: makeVec(),
        hipNear: makeVec(),
        hipFar: makeVec(),
        kneeNear: makeVec(),
        kneeFar: makeVec(),
        footNear: makeVec(),
        footFar: makeVec(),
      },
      sockets: {
        handNear: makeSocket(1),
        handFar: makeSocket(-1),
        back: makeSocket(-1),
        hip: makeSocket(1),
        castOrigin: makeSocket(1),
        headTop: makeSocket(1),
        feet: makeSocket(-1),
      },
      secondary: {
        hairLeft: createSpringChain('hairLeft', initialX, initialY, [5.5, 5.5, 5.0], 28, 0.82, 55),
        hairRight: createSpringChain('hairRight', initialX, initialY, [5.5, 5.5, 5.0], 28, 0.82, 55),
        cape: createSpringChain('cape', initialX, initialY, [6.5, 7.0, 7.0], 22, 0.84, 62),
        sash: createSpringChain('sash', initialX, initialY, [4.5, 5.0, 4.5], 26, 0.83, 58),
        sleeveNear: createSpringChain('sleeveNear', initialX, initialY, [4.2, 4.0], 32, 0.8, 50),
        sleeveFar: createSpringChain('sleeveFar', initialX, initialY, [4.2, 4.0], 32, 0.8, 50),
        robeHem: createSpringChain('robeHem', initialX, initialY, [4.5, 4.5], 30, 0.82, 65),
      },
      lodLevel: 0,
    };
  }

  /**
   * Updates the hero's FSM, continuous facing, distance-driven locomotion,
   * 2-bone IK limbs, sockets, and secondary spring chains.
   */
  public step(input: HeroControllerInput): HeroPose {
    const dt = clamp(input.dtSec, 0.001, 0.1);
    const props =
      DEFAULT_RIG_PROPORTIONS[input.professionId] ??
      DEFAULT_RIG_PROPORTIONS.warden!;

    // 1. Facing without Mirroring: smooth continuous [-1, 1] transition
    const aimCos = Math.cos(input.facingAngle);
    const aimSin = Math.sin(input.facingAngle);
    this.facingState = stepFacingState(this.facingState, aimCos, aimSin, dt);
    const facing = this.facingState.facing;
    const facingSign: 1 | -1 = facing >= 0 ? 1 : -1;

    // 2. Distance-Driven Gait Phase (zero foot sliding!)
    if (Number.isNaN(this.lastWorldX)) {
      this.lastWorldX = input.hx;
      this.lastWorldY = input.groundY;
    }
    const dxWorld = input.hx - this.lastWorldX;
    const dyWorld = input.groundY - this.lastWorldY;
    const distStep = Math.hypot(dxWorld, dyWorld);
    this.lastWorldX = input.hx;
    this.lastWorldY = input.groundY;

    const speed = Math.hypot(input.heroVx, input.heroVy);
    if (distStep > 0.01 && distStep < 80 && input.isMoving) {
      this.gaitPhase = (this.gaitPhase + distStep * props.strideFrequency) % (Math.PI * 2);
    }

    // Stop-slide settling impulse when transitioning from fast move to stop
    if (this.prevSpeed > 2.2 && speed <= 0.35) {
      this.stopSlideTimer = 0.16;
      this.stopSlideDirX = this.facingState.dirX;
    }
    this.prevSpeed = speed;
    if (this.stopSlideTimer > 0) {
      this.stopSlideTimer = Math.max(0, this.stopSlideTimer - dt);
    }

    // 3. Priority Behavior FSM (Dead > Hit > Dash > Attack > Cast > Move > Idle)
    const wpn = input.meleeWeapon;
    const isAttacking = Boolean(wpn && wpn.phase !== 'ready');
    if (input.isCastingSpell) {
      this.castTimer = 0.28;
    } else if (this.castTimer > 0) {
      this.castTimer = Math.max(0, this.castTimer - dt);
    }

    const prevState = this.actionState;
    if (input.isDead) {
      this.actionState = 'Dead';
    } else if (input.isHit) {
      this.actionState = 'Hit';
    } else if (input.isDashing) {
      this.actionState = 'Dash';
    } else if (isAttacking) {
      this.actionState = 'Attack';
    } else if (this.castTimer > 0) {
      this.actionState = 'Cast';
    } else if (input.isMoving && speed > 0.15) {
      this.actionState = 'Move';
    } else {
      this.actionState = 'Idle';
    }

    if (this.actionState !== prevState) {
      this.stateTimer = 0;
    } else {
      this.stateTimer += dt;
    }

    // 4. Smooth Layer Weights (locomotion vs upper-body action)
    const targetMoveWeight = input.isMoving && speed > 0.15 ? clamp(speed / 4.2, 0.25, 1.0) : 0;
    this.moveWeight = lerp(this.moveWeight, targetMoveWeight, Math.min(1, dt * 14));

    const targetActionWeight =
      this.actionState === 'Attack' || this.actionState === 'Cast' || this.actionState === 'Hit'
        ? 1.0
        : 0.0;
    this.actionWeight = lerp(this.actionWeight, targetActionWeight, Math.min(1, dt * 20));

    // 5. Evaluate Attack / Cast Action Phase Data (Anticipation -> Active -> Recovery)
    const actionPhase = this.pose.actionPhase;
    actionPhase.aimAngle =
      typeof wpn?.lockedAngle === 'number'
        ? wpn.lockedAngle
        : (input.castAimAngle ?? input.facingAngle);
    actionPhase.swingDir = (wpn?.swingCounter ?? 0) % 2 === 0 ? 1 : -1;

    if (wpn && wpn.phase !== 'ready') {
      if (wpn.phase === 'windup') {
        const p = clamp(1 - wpn.phaseTimer / 0.08, 0, 1);
        actionPhase.phase = 'anticipation';
        actionPhase.progress = p;
        actionPhase.totalProgress = p * 0.28;
        actionPhase.hitWindowActive = false;
        actionPhase.canCancel = false;
      } else if (wpn.phase === 'active') {
        const p = clamp(1 - wpn.phaseTimer / 0.1, 0, 1);
        actionPhase.phase = 'active';
        actionPhase.progress = p;
        actionPhase.totalProgress = 0.28 + p * 0.44;
        actionPhase.hitWindowActive = true;
        actionPhase.canCancel = false;
      } else {
        const p = clamp(1 - wpn.phaseTimer / 0.1, 0, 1);
        actionPhase.phase = 'recovery';
        actionPhase.progress = p;
        actionPhase.totalProgress = 0.72 + p * 0.28;
        actionPhase.hitWindowActive = false;
        actionPhase.canCancel = p > 0.35;
      }
    } else if (this.castTimer > 0) {
      const p = clamp(1 - this.castTimer / 0.28, 0, 1);
      actionPhase.phase = p < 0.25 ? 'anticipation' : p < 0.7 ? 'active' : 'recovery';
      actionPhase.progress = p;
      actionPhase.totalProgress = p;
      actionPhase.hitWindowActive = p >= 0.25 && p < 0.7;
      actionPhase.canCancel = p >= 0.7;
    } else {
      actionPhase.phase = 'idle';
      actionPhase.progress = 0;
      actionPhase.totalProgress = 0;
      actionPhase.hitWindowActive = false;
      actionPhase.canCancel = true;
    }

    // 6. Spontaneous Eye Blinking
    if (this.blinkActiveTimer > 0) {
      this.blinkActiveTimer -= dt;
      if (this.blinkActiveTimer <= 0) {
        this.blinkCountdown = 2.6 + ((Math.sin(input.elapsedSeconds * 17.3) + 1) * 1.1);
      }
    } else {
      this.blinkCountdown -= dt;
      if (this.blinkCountdown <= 0) {
        this.blinkActiveTimer = 0.13;
      }
    }

    // 7. Compute Positive-Only Squash & Stretch, Pelvis Bob, Lean & Lift
    const breathWave = Math.sin(input.elapsedSeconds * 3.2);
    const walkDoubleFreq = Math.abs(Math.sin(this.gaitPhase));
    const stopSettle =
      this.stopSlideTimer > 0
        ? Math.sin((this.stopSlideTimer / 0.16) * Math.PI) * 0.06
        : 0;

    let scaleX = 1.0 - breathWave * 0.015 + walkDoubleFreq * 0.035 * this.moveWeight + stopSettle;
    let scaleY = 1.0 + breathWave * 0.018 - walkDoubleFreq * 0.03 * this.moveWeight - stopSettle;

    // Subtle 3/4 turn squash anticipation + overshoot (always strictly positive!)
    if (this.facingState.turnTimer > 0) {
      const turnP = this.facingState.turnTimer / 0.125;
      const turnPulse = Math.sin(turnP * Math.PI);
      scaleX *= 1.0 - turnPulse * 0.06;
      scaleY *= 1.0 + turnPulse * 0.05;
    }

    if (this.actionState === 'Dash') {
      scaleX = 1.16;
      scaleY = 0.86;
    } else if (this.actionState === 'Hit') {
      scaleX = 1.12;
      scaleY = 0.88;
    } else if (actionPhase.phase === 'anticipation') {
      scaleX *= 1.04;
      scaleY *= 0.96;
    } else if (actionPhase.phase === 'active') {
      scaleX *= 0.96;
      scaleY *= 1.05;
    }

    // Enforce strict positive scale invariant (never mirror via negative scale)
    scaleX = Math.max(0.5, scaleX);
    scaleY = Math.max(0.5, scaleY);

    const levitateFloat = input.isLevitating
      ? 5.5 + Math.sin(input.elapsedSeconds * 3.4) * 2.0
      : 0;
    const dashLift = this.actionState === 'Dash' ? 3.5 : 0;
    const liftHeight = Math.max(0, levitateFloat + dashLift);

    // Pelvis bob & velocity lean
    const pelvisBob = input.isLevitating
      ? 0
      : -Math.abs(Math.sin(this.gaitPhase)) * props.bobAmplitude * this.moveWeight +
        breathWave * 0.55 * (1 - this.moveWeight);
    const stopLean =
      this.stopSlideTimer > 0
        ? -this.stopSlideDirX * Math.sin((this.stopSlideTimer / 0.16) * Math.PI) * 0.09
        : 0;
    const velocityLean = clamp(input.heroVx * props.leanMultiplier, -0.22, 0.22) + stopLean;

    // Action upper-body twist & lean
    let actionTwist = 0;
    let actionLeanOffset = 0;
    if (actionPhase.phase === 'anticipation') {
      actionTwist = -0.35 * actionPhase.progress * actionPhase.swingDir;
      actionLeanOffset = -0.08 * facingSign * actionPhase.progress;
    } else if (actionPhase.phase === 'active') {
      actionTwist = (0.48 * actionPhase.progress - 0.15) * actionPhase.swingDir;
      actionLeanOffset = 0.12 * facingSign * (1 - actionPhase.progress * 0.5);
    } else if (actionPhase.phase === 'recovery') {
      actionTwist = 0.33 * (1 - actionPhase.progress) * actionPhase.swingDir;
    }

    const walkCounterTwist = Math.sin(this.gaitPhase) * 0.22 * this.moveWeight;
    const torsoTwist = clamp(facing * 0.65 + walkCounterTwist + actionTwist, -1, 1);
    const torsoLean = velocityLean + actionLeanOffset;

    // 8. Build 2D Rig Joint Positions in World Space
    const rig = this.pose.rig;
    const rootX = input.hx;
    const rootY = input.groundY + 11; // Ground contact point under boots

    rig.root.x = rootX;
    rig.root.y = rootY;

    const pelvisX = rootX + Math.sin(torsoLean) * 2.0;
    const pelvisY = rootY - props.pelvisHeight * scaleY + pelvisBob - liftHeight;
    rig.pelvis.x = pelvisX;
    rig.pelvis.y = pelvisY;

    const sinLean = Math.sin(torsoLean);
    const cosLean = Math.cos(torsoLean);
    const torsoX = pelvisX + sinLean * (props.torsoLength * 0.55 * scaleY);
    const torsoY = pelvisY - cosLean * (props.torsoLength * 0.55 * scaleY);
    rig.torso.x = torsoX;
    rig.torso.y = torsoY;

    const neckX = pelvisX + sinLean * (props.torsoLength * scaleY);
    const neckY = pelvisY - cosLean * (props.torsoLength * scaleY);
    rig.neck.x = neckX;
    rig.neck.y = neckY;

    const headBob = Math.sin(input.elapsedSeconds * 3.2 - 0.35) * 0.65;
    const headX = neckX + sinLean * props.neckLength + facing * 0.9;
    const headY = neckY - cosLean * props.neckLength - props.headRadius * 0.62 + headBob;
    rig.head.x = headX;
    rig.head.y = headY;

    // Near and Far Shoulders & Hips shift continuously with `facing` and `torsoTwist`
    // When facing > 0 (facing right): Near side is left/back-right (-facing), Far side is (+facing) in 3/4 view
    const halfChest = props.chestWidth * 0.5 * scaleX;
    const halfHip = props.hipWidth * 0.5 * scaleX;
    const perspectiveSpread = 0.42 + 0.58 * (1 - Math.abs(facing) * 0.35);

    // Near shoulder is on the camera-facing side (-facingSign), Far shoulder is on the forward-reaching side (+facingSign)
    rig.shoulderNear.x = neckX - facing * halfChest * perspectiveSpread - torsoTwist * 1.6;
    rig.shoulderNear.y = neckY + 2.2;
    rig.shoulderFar.x = neckX + facing * halfChest * perspectiveSpread + torsoTwist * 1.6;
    rig.shoulderFar.y = neckY + 1.6;

    rig.hipNear.x = pelvisX - facing * halfHip * perspectiveSpread;
    rig.hipNear.y = pelvisY + 1.2;
    rig.hipFar.x = pelvisX + facing * halfHip * perspectiveSpread;
    rig.hipFar.y = pelvisY + 0.8;

    // 9. Solve Legs with Distance-Driven Foot-Planting & Analytic 2-Bone IK
    const nearPhase = this.gaitPhase;
    const farPhase = this.gaitPhase + Math.PI;

    const solveLeg = (
      hip: Vec2,
      phase: number,
      sideOffset: number,
      outKnee: Vec2,
      outFoot: Vec2
    ) => {
      if (input.isLevitating) {
        const hoverWave = Math.sin(input.elapsedSeconds * 3.0 + sideOffset) * 1.4;
        const targetFootX = hip.x + sideOffset * 1.5 - input.heroVx * 0.45;
        const targetFootY = hip.y + (props.thighLength + props.shinLength) * 0.78 + hoverWave;
        solveTwoBoneIK(
          hip.x,
          hip.y,
          targetFootX,
          targetFootY,
          props.thighLength,
          props.shinLength,
          facingSign * 0.65,
          outKnee,
          outFoot
        );
        return;
      }

      // Foot-planting curve: when sin(phase) < 0, foot is planted on ground sweeping back;
      // when sin(phase) > 0, foot lifts in an arc forward.
      const swingSin = Math.sin(phase);
      const swingCos = Math.cos(phase);
      const stride = props.strideLength * this.moveWeight;
      const strideDirX = Math.abs(this.facingState.dirX) > 0.2 ? this.facingState.dirX : facingSign * 0.75;
      const strideDirY = this.facingState.dirY * 0.32;

      const footSweep = swingCos * stride;
      const footLift = Math.max(0, swingSin) * 4.8 * this.moveWeight;

      const targetFootX = hip.x + footSweep * strideDirX;
      const targetFootY =
        rootY - 1.5 + footSweep * strideDirY - footLift - liftHeight;

      solveTwoBoneIK(
        hip.x,
        hip.y,
        targetFootX,
        targetFootY,
        props.thighLength * scaleY,
        props.shinLength * scaleY,
        facingSign * 0.85,
        outKnee,
        outFoot
      );
    };

    solveLeg(rig.hipNear, nearPhase, -facingSign, rig.kneeNear, rig.footNear);
    solveLeg(rig.hipFar, farPhase, facingSign, rig.kneeFar, rig.footFar);

    // 10. Solve Arms with Counter-Swing + Upper-Body Action Override & 2-Bone IK
    const armSwingNear = -Math.cos(nearPhase) * 4.5 * this.moveWeight;
    const armSwingFar = -Math.cos(farPhase) * 4.5 * this.moveWeight;

    let nearHandTargetX =
      rig.shoulderNear.x + armSwingNear * facingSign - facingSign * 2.2;
    let nearHandTargetY =
      rig.shoulderNear.y + (props.upperArmLength + props.lowerArmLength) * 0.76 + Math.abs(armSwingNear) * 0.25;

    let farHandTargetX =
      rig.shoulderFar.x + armSwingFar * facingSign + facingSign * 3.8;
    let farHandTargetY =
      rig.shoulderFar.y + (props.upperArmLength + props.lowerArmLength) * 0.72 + Math.abs(armSwingFar) * 0.25;

    // Action layer overrides weapon/casting hand target smoothly
    if (this.actionWeight > 0.01) {
      const aimCosA = Math.cos(actionPhase.aimAngle);
      const aimSinA = Math.sin(actionPhase.aimAngle);
      const reach = (props.upperArmLength + props.lowerArmLength) * 0.88;

      let swingArcAngle = actionPhase.aimAngle;
      if (actionPhase.phase === 'anticipation') {
        swingArcAngle -= actionPhase.swingDir * 0.95 * actionPhase.progress;
      } else if (actionPhase.phase === 'active') {
        swingArcAngle +=
          actionPhase.swingDir * (-0.95 + 1.85 * actionPhase.progress);
      } else if (actionPhase.phase === 'recovery') {
        swingArcAngle +=
          actionPhase.swingDir * 0.9 * (1 - actionPhase.progress);
      }

      const actX = rig.shoulderNear.x + Math.cos(swingArcAngle) * reach;
      const actY = rig.shoulderNear.y + Math.sin(swingArcAngle) * reach * 0.75;
      nearHandTargetX = lerp(nearHandTargetX, actX, this.actionWeight);
      nearHandTargetY = lerp(nearHandTargetY, actY, this.actionWeight);

      if (this.castTimer > 0) {
        const castX = rig.shoulderFar.x + aimCosA * reach * 0.92;
        const castY = rig.shoulderFar.y + aimSinA * reach * 0.75 - 2.0;
        farHandTargetX = lerp(farHandTargetX, castX, this.actionWeight);
        farHandTargetY = lerp(farHandTargetY, castY, this.actionWeight);
      }
    }

    solveTwoBoneIK(
      rig.shoulderNear.x,
      rig.shoulderNear.y,
      nearHandTargetX,
      nearHandTargetY,
      props.upperArmLength,
      props.lowerArmLength,
      -facingSign * 0.75,
      rig.elbowNear,
      rig.handNear
    );

    solveTwoBoneIK(
      rig.shoulderFar.x,
      rig.shoulderFar.y,
      farHandTargetX,
      farHandTargetY,
      props.upperArmLength,
      props.lowerArmLength,
      -facingSign * 0.75,
      rig.elbowFar,
      rig.handFar
    );

    // 11. Populate Named Sockets in World Space
    const sockets = this.pose.sockets;
    const nearForearmAngle = Math.atan2(
      rig.handNear.y - rig.elbowNear.y,
      rig.handNear.x - rig.elbowNear.x
    );
    const farForearmAngle = Math.atan2(
      rig.handFar.y - rig.elbowFar.y,
      rig.handFar.x - rig.elbowFar.x
    );

    sockets.handNear.x = rig.handNear.x;
    sockets.handNear.y = rig.handNear.y;
    sockets.handNear.angle = nearForearmAngle;
    sockets.handNear.layer = 1;

    sockets.handFar.x = rig.handFar.x;
    sockets.handFar.y = rig.handFar.y;
    sockets.handFar.angle = farForearmAngle;
    sockets.handFar.layer = -1;

    sockets.back.x = rig.torso.x - facing * 5.2;
    sockets.back.y = rig.torso.y - 2.0;
    sockets.back.angle = torsoLean - facingSign * 0.65;
    sockets.back.layer = -1;

    sockets.hip.x = rig.hipNear.x - facing * 2.5;
    sockets.hip.y = rig.hipNear.y + 1.5;
    sockets.hip.angle = torsoLean;
    sockets.hip.layer = 1;

    sockets.castOrigin.x = rig.handNear.x + this.facingState.dirX * 5.5;
    sockets.castOrigin.y = rig.handNear.y + this.facingState.dirY * 4.0 - 1.5;
    sockets.castOrigin.angle = input.facingAngle;
    sockets.castOrigin.layer = 1;

    sockets.headTop.x = rig.head.x;
    sockets.headTop.y = rig.head.y - props.headRadius;
    sockets.headTop.angle = torsoLean * 0.5;
    sockets.headTop.layer = 1;

    sockets.feet.x = rootX;
    sockets.feet.y = rootY;
    sockets.feet.angle = 0;
    sockets.feet.layer = -1;

    // 12. Step Deterministic Spring / Verlet Secondary Motion Chains
    const lodLevel = HeroRenderProfiler.computeHeroLodLevel(
      input.cameraZoom ?? 1.0,
      input.reducedMotion ?? false
    );
    this.pose.lodLevel = lodLevel;

    const sec = this.pose.secondary;
    const earSpan = props.headRadius * 0.92;
    stepSpringChain(
      sec.hairLeft,
      rig.head.x - earSpan + facing * 1.5,
      rig.head.y - 1.5,
      input.heroVx,
      input.heroVy,
      input.elapsedSeconds,
      dt,
      -2.2 - facing * 1.2
    );
    stepSpringChain(
      sec.hairRight,
      rig.head.x + earSpan + facing * 1.5,
      rig.head.y - 1.5,
      input.heroVx,
      input.heroVy,
      input.elapsedSeconds,
      dt,
      2.2 - facing * 1.2
    );
    stepSpringChain(
      sec.cape,
      rig.neck.x - facing * 3.5,
      rig.neck.y + 1.5,
      input.heroVx,
      input.heroVy,
      input.elapsedSeconds,
      dt,
      -facing * 2.8
    );
    stepSpringChain(
      sec.sash,
      rig.pelvis.x + facing * 3.5,
      rig.pelvis.y + 1.0,
      input.heroVx,
      input.heroVy,
      input.elapsedSeconds,
      dt,
      -facing * 1.5
    );
    stepSpringChain(
      sec.sleeveNear,
      rig.handNear.x,
      rig.handNear.y,
      input.heroVx,
      input.heroVy,
      input.elapsedSeconds,
      dt,
      -facing * 0.8
    );
    stepSpringChain(
      sec.sleeveFar,
      rig.handFar.x,
      rig.handFar.y,
      input.heroVx,
      input.heroVy,
      input.elapsedSeconds,
      dt,
      -facing * 0.8
    );
    stepSpringChain(
      sec.robeHem,
      rig.pelvis.x,
      rig.pelvis.y + 2.0,
      input.heroVx,
      input.heroVy,
      input.elapsedSeconds,
      dt,
      -facing * 1.2
    );

    // 13. Finalize Pose Output Properties
    this.pose.rootX = rootX;
    this.pose.rootY = rootY;
    this.pose.centerY = input.cy - liftHeight + pelvisBob;
    this.pose.facing = facing;
    this.pose.facingSign = facingSign;
    this.pose.dirX = this.facingState.dirX;
    this.pose.dirY = this.facingState.dirY;
    this.pose.facingAngle = input.facingAngle;
    this.pose.turnVelocity = this.facingState.facingVel;
    this.pose.scaleX = scaleX;
    this.pose.scaleY = scaleY;
    this.pose.liftHeight = liftHeight;
    this.pose.gaitPhase = this.gaitPhase;
    this.pose.moveWeight = this.moveWeight;
    this.pose.actionWeight = this.actionWeight;
    this.pose.actionState = this.actionState;
    this.pose.torsoLean = torsoLean;
    this.pose.torsoTwist = torsoTwist;
    this.pose.headGazeX = facing * 3.2 + this.facingState.dirX * 1.4;
    this.pose.headGazeY = clamp(this.facingState.dirY * 1.6, -1.8, 2.2);
    this.pose.headTilt = torsoLean * 0.45 - this.facingState.facingVel * 0.015;
    this.pose.blinkAmount = this.blinkActiveTimer > 0 ? 1 : 0;
    this.pose.hitFlash = input.isHit ? 1.0 : 0.0;
    this.pose.invulnBlink = input.isDashing
      ? 0.55 + 0.45 * Math.sin(input.elapsedSeconds * 36)
      : 0;
    this.pose.lowHealthIntensity = input.isLowHealth
      ? clamp(1 - input.lowHealthRatio / 0.25, 0.25, 1.0)
      : 0;
    this.pose.sleeveGlow = Math.max(0, this.pose.sleeveGlow - dt * 3.5);

    return this.pose;
  }
}
