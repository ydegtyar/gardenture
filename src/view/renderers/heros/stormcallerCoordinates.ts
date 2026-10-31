/**
 * Coordinate helpers and offset constants for the Stormcaller hero and Thander Rein persona.
 */

export const STORMCALLER_HAT_TIP_OFFSET_PX = {
  x: 1.0,
  y: -27.0,
} as const;

export const STORMCALLER_EYES_OFFSET_PX = {
  base: {
    spreadX: 3.2,
    y: -12.1,
  },
  skin: {
    spreadX: 3.85,
    y: -12.5,
  },
  spreadX: 3.85,
  y: -12.5,
} as const;

/**
 * Calculates the exact tip position of Stormcaller's hat in screen pixel coordinates.
 * Chain lightning always arcs from this point when playing as Stormcaller, even if Garden Blade is equipped.
 */
export function getStormcallerHatTipPosition(
  hx: number,
  hy: number,
  flipX = 1,
  elapsedSeconds = 0
): { x: number; y: number } {
  const breathSway = Math.sin(elapsedSeconds * 3.5) * 0.5;
  return {
    x: hx + STORMCALLER_HAT_TIP_OFFSET_PX.x * flipX,
    y: hy + STORMCALLER_HAT_TIP_OFFSET_PX.y + breathSway,
  };
}

/**
 * Calculates the exact tip position of Stormcaller's hat in simulation world coordinates.
 */
export function getStormcallerHatTipWorld(
  heroX: number,
  heroY: number,
  facingAngle = 0
): { x: number; y: number } {
  const flipX = Math.cos(facingAngle) < -0.15 ? -1 : 1;
  return {
    x: heroX + (STORMCALLER_HAT_TIP_OFFSET_PX.x / 24) * flipX,
    y: heroY + STORMCALLER_HAT_TIP_OFFSET_PX.y / 24,
  };
}

/**
 * Calculates the exact eye positions of Stormcaller in screen pixel coordinates.
 */
export function getStormcallerEyePositions(
  hx: number,
  cy: number,
  flipX = 1,
  isSkin = false
): { leftEyeX: number; rightEyeX: number; eyeY: number } {
  const spreadX = isSkin
    ? STORMCALLER_EYES_OFFSET_PX.skin.spreadX
    : STORMCALLER_EYES_OFFSET_PX.base.spreadX;
  const offsetY = isSkin
    ? STORMCALLER_EYES_OFFSET_PX.skin.y
    : STORMCALLER_EYES_OFFSET_PX.base.y;

  return {
    leftEyeX: hx - spreadX * flipX,
    rightEyeX: hx + spreadX * flipX,
    eyeY: cy + offsetY,
  };
}

/**
 * Calculates the exact eye positions of Stormcaller in simulation world coordinates.
 */
export function getStormcallerEyePositionsWorld(
  heroX: number,
  heroY: number,
  facingAngle = 0,
  isSkin = false
): { leftEyeX: number; rightEyeX: number; eyeY: number } {
  const flipX = Math.cos(facingAngle) < -0.15 ? -1 : 1;
  const spreadX =
    (isSkin ? STORMCALLER_EYES_OFFSET_PX.skin.spreadX : STORMCALLER_EYES_OFFSET_PX.base.spreadX) /
    24;
  const offsetY =
    (isSkin ? STORMCALLER_EYES_OFFSET_PX.skin.y : STORMCALLER_EYES_OFFSET_PX.base.y) / 24;

  return {
    leftEyeX: heroX - spreadX * flipX,
    rightEyeX: heroX + spreadX * flipX,
    eyeY: heroY + offsetY,
  };
}
