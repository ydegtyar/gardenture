import type * as PIXI from 'pixi.js';
import { BaseHeroProfessionRenderer } from './BaseHeroProfessionRenderer';
import {
  STORMCALLER_HAT_TIP_OFFSET_PX,
  STORMCALLER_EYES_OFFSET_PX,
  getStormcallerHatTipPosition,
  getStormcallerHatTipWorld,
  getStormcallerEyePositions,
  getStormcallerEyePositionsWorld,
} from './stormcallerCoordinates';

export {
  STORMCALLER_HAT_TIP_OFFSET_PX,
  STORMCALLER_EYES_OFFSET_PX,
  getStormcallerHatTipPosition,
  getStormcallerHatTipWorld,
  getStormcallerEyePositions,
  getStormcallerEyePositionsWorld,
};

export class StormcallerHeroRenderer extends BaseHeroProfessionRenderer {
  public readonly professionId = 'stormcaller';
  public static readonly HAT_TIP_OFFSET_PX = STORMCALLER_HAT_TIP_OFFSET_PX;
  public static readonly EYES_OFFSET_PX = STORMCALLER_EYES_OFFSET_PX;
  public static getHatTipPosition = getStormcallerHatTipPosition;
  public static getHatTipWorld = getStormcallerHatTipWorld;
  public static getEyePositions = getStormcallerEyePositions;
  public static getEyePositionsWorld = getStormcallerEyePositionsWorld;

  protected override drawProfessionEyes(
    gOver: PIXI.Graphics,
    hx: number,
    cy: number,
    flipX: number,
    elapsedSeconds: number
  ): void {
    const { leftEyeX, rightEyeX, eyeY } = getStormcallerEyePositions(hx, cy, flipX, false);
    const eyePulse = 0.78 + 0.22 * Math.sin(elapsedSeconds * 9);
    gOver
      .circle(leftEyeX, eyeY, 1.8)
      .fill({ color: 0x38bdf8, alpha: 0.9 * eyePulse });
    gOver
      .circle(rightEyeX, eyeY, 1.8)
      .fill({ color: 0x38bdf8, alpha: 0.9 * eyePulse });
  }
}
