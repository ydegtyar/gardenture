/**
 * Pure 2D Vector Math, Geometry Tests, Angle Slerp & Continuous Collision Detection (CCD)
 * Layer 1 (core): Zero DOM, Zero PixiJS imports.
 */

export interface Vec2 {
  x: number;
  y: number;
}

export function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge1 <= edge0) return x >= edge1 ? 1 : 0;
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/**
 * Shortest-arc angular interpolation across [-PI, PI]
 * Prevents 360-degree flip spins during view interpolation.
 */
export function slerpAngle(prevAngle: number, currAngle: number, alpha: number): number {
  const twoPi = Math.PI * 2;
  const diff = ((((currAngle - prevAngle + Math.PI) % twoPi) + twoPi) % twoPi) - Math.PI;
  return prevAngle + diff * alpha;
}

export function angleDifference(a: number, b: number): number {
  const twoPi = Math.PI * 2;
  return ((((b - a + Math.PI) % twoPi) + twoPi) % twoPi) - Math.PI;
}

export function distSq(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return dx * dx + dy * dy;
}

export function dist(x1: number, y1: number, x2: number, y2: number): number {
  return Math.hypot(x2 - x1, y2 - y1);
}

/**
 * Fast circle-vs-circle overlap check using squared distance.
 */
export function circlesOverlap(
  x1: number,
  y1: number,
  r1: number,
  x2: number,
  y2: number,
  r2: number
): boolean {
  const rSum = r1 + r2;
  return distSq(x1, y1, x2, y2) <= rSum * rSum;
}

/**
 * Circle sector (arc) vs circle overlap test.
 * Used for melee arc swings (e.g., Garden Blade 110 deg -> 135 deg) and Shielded enemy frontal arc.
 */
export function arcOverlapsCircle(
  originX: number,
  originY: number,
  reach: number,
  facingAngle: number,
  arcAngleRad: number,
  targetX: number,
  targetY: number,
  targetRadius: number
): boolean {
  const dx = targetX - originX;
  const dy = targetY - originY;
  const dSq = dx * dx + dy * dy;
  const maxDist = reach + targetRadius;
  if (dSq > maxDist * maxDist) return false;
  if (dSq <= targetRadius * targetRadius) return true;

  const angleToTarget = Math.atan2(dy, dx);
  const diff = Math.abs(angleDifference(facingAngle, angleToTarget));
  // Expand angular tolerance slightly by target's subtended angle at distance d
  const d = Math.sqrt(dSq);
  const angularPadding = Math.asin(clamp(targetRadius / d, 0, 1));
  return diff <= arcAngleRad * 0.5 + angularPadding;
}

/**
 * Point-to-segment squared distance, also used for Capsule/Line attacks and CCD sweeps.
 */
export function pointToSegmentDistSq(
  px: number,
  py: number,
  ax: number,
  ay: number,
  bx: number,
  by: number
): { distSq: number; t: number } {
  const abx = bx - ax;
  const aby = by - ay;
  const apx = px - ax;
  const apy = py - ay;
  const abLenSq = abx * abx + aby * aby;
  if (abLenSq <= 1e-8) {
    return { distSq: apx * apx + apy * apy, t: 0 };
  }
  const t = clamp((apx * abx + apy * aby) / abLenSq, 0, 1);
  const closestX = ax + abx * t;
  const closestY = ay + aby * t;
  const dx = px - closestX;
  const dy = py - closestY;
  return { distSq: dx * dx + dy * dy, t };
}

/**
 * Line capsule vs circle test (e.g., Thorn Spear line thrust, Dasher charge path).
 */
export function capsuleOverlapsCircle(
  ax: number,
  ay: number,
  bx: number,
  by: number,
  halfWidth: number,
  cx: number,
  cy: number,
  cRadius: number
): boolean {
  const { distSq: dSq } = pointToSegmentDistSq(cx, cy, ax, ay, bx, by);
  const totalR = halfWidth + cRadius;
  return dSq <= totalR * totalR;
}

/**
 * Continuous Collision Detection (CCD) sweep for fast projectiles moving from (prevX, prevY) to (currX, currY)
 * against a circular collider at (targetX, targetY) with radius targetRadius.
 */
export function ccdSegmentHitsCircle(
  prevX: number,
  prevY: number,
  currX: number,
  currY: number,
  projRadius: number,
  targetX: number,
  targetY: number,
  targetRadius: number
): boolean {
  return capsuleOverlapsCircle(prevX, prevY, currX, currY, projRadius, targetX, targetY, targetRadius);
}
