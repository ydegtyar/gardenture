import { clamp } from '../../../core/math/vec2';
import type { PersonaRenderer, PersonaRenderContext } from './types';

/**
 * Thander Rein persona aura renderer:
 * Levitating thunder stance, electric trailing eye slits & movement light trails.
 */
export class StormcallerGojoPersonaRenderer implements PersonaRenderer {
  public readonly id = 'stormcaller_gojo_killua';
  public readonly isLevitating = true;

  private thunderEyeTrail: Array<{
    lx: number;
    ly: number;
    rx: number;
    ry: number;
    t: number;
  }> = [];

  public drawAura(ctx: PersonaRenderContext): void {
    const {
      gOver,
      hx,
      cy,
      flipX,
      elapsedSeconds,
      eyeLeftColor,
      heroVx,
      heroVy,
    } = ctx;

    const eyeY = cy - 4.5;
    const leftEyeX = hx - 4.2 * flipX;
    const rightEyeX = hx + 4.2 * flipX;
    const eyePulse = 0.78 + 0.22 * Math.sin(elapsedSeconds * 9);

    // THANDER REIN:
    // - No blue circle under the hero (uses the dark ground shadow circle instead).
    // - No blue circles on the eyes; both eyes share the same electric color and emit trailing lightning lines directly from the eyes!
    const eyeColor = eyeLeftColor; // Both eyes have identical color (0x38bdf8)
    const coreColor = 0xe0f2fe;

    // Crisp slanted lightning eye slits + ambient eye-corner spark lines (no circles!)
    for (const exPos of [leftEyeX, rightEyeX]) {
      const dir = exPos === leftEyeX ? -flipX : flipX;
      const tailFlickX = -heroVx * 1.4 + dir * 4.8;
      const tailFlickY = -heroVy * 1.4 - 2.2 + Math.sin(elapsedSeconds * 28 + exPos) * 1.2;

      // Sharp glowing eye line + immediate trailing wisp line on each eye
      gOver
        .moveTo(exPos - 2.2 * dir, eyeY + 0.5)
        .lineTo(exPos + 2.0 * dir, eyeY - 0.6)
        .lineTo(exPos + tailFlickX, eyeY + tailFlickY)
        .stroke({ color: eyeColor, width: 3.2, alpha: 0.92 * eyePulse, cap: 'round', join: 'round' });
      gOver
        .moveTo(exPos - 1.8 * dir, eyeY + 0.4)
        .lineTo(exPos + 1.8 * dir, eyeY - 0.5)
        .lineTo(exPos + tailFlickX * 0.85, eyeY + tailFlickY * 0.85)
        .stroke({ color: coreColor, width: 1.5, alpha: 0.98, cap: 'round', join: 'round' });
    }

    // Record & prune world-space eye trail points for movement light trails
    const trail = this.thunderEyeTrail;
    if (
      trail.length > 0 &&
      (elapsedSeconds < trail[trail.length - 1]!.t ||
        Math.hypot(hx - trail[trail.length - 1]!.lx, eyeY - trail[trail.length - 1]!.ly) > 140)
    ) {
      trail.length = 0;
    }

    const speed = Math.hypot(heroVx, heroVy);
    if (speed > 0.2) {
      const last = trail[trail.length - 1];
      if (!last || elapsedSeconds - last.t >= 0.018 || Math.hypot(leftEyeX - last.lx, eyeY - last.ly) >= 4) {
        trail.push({
          lx: leftEyeX,
          ly: eyeY,
          rx: rightEyeX,
          ry: eyeY,
          t: elapsedSeconds,
        });
        if (trail.length > 16) {
          trail.shift();
        }
      }
    }

    while (trail.length > 0 && elapsedSeconds - trail[0]!.t > 0.34) {
      trail.shift();
    }

    // Draw persistent multi-segment lightning eye light trail left behind on movement
    if (trail.length >= 2) {
      for (let i = 0; i < trail.length - 1; i++) {
        const p0 = trail[i]!;
        const p1 = trail[i + 1]!;
        const ageRatio = clamp(1 - (elapsedSeconds - p0.t) / 0.34, 0, 1);
        const jitter = Math.sin(elapsedSeconds * 38 + i * 2.1) * 1.8 * (1 - ageRatio);

        // Outer electric cyan glow ribbon for left & right eye trails
        gOver
          .moveTo(p0.lx, p0.ly + jitter)
          .lineTo(p1.lx, p1.ly)
          .stroke({
            color: eyeColor,
            width: 4.0 * ageRatio,
            alpha: 0.72 * ageRatio,
            cap: 'round',
          });
        gOver
          .moveTo(p0.rx, p0.ry - jitter)
          .lineTo(p1.rx, p1.ry)
          .stroke({
            color: eyeColor,
            width: 4.0 * ageRatio,
            alpha: 0.72 * ageRatio,
            cap: 'round',
          });

        // Inner white-hot lightning core ribbon
        gOver
          .moveTo(p0.lx, p0.ly + jitter)
          .lineTo(p1.lx, p1.ly)
          .stroke({
            color: coreColor,
            width: 1.8 * ageRatio,
            alpha: 0.95 * ageRatio,
            cap: 'round',
          });
        gOver
          .moveTo(p0.rx, p0.ry - jitter)
          .lineTo(p1.rx, p1.ry)
          .stroke({
            color: coreColor,
            width: 1.8 * ageRatio,
            alpha: 0.95 * ageRatio,
            cap: 'round',
          });
      }

      // Connect latest trail sample directly to current eye positions
      const newest = trail[trail.length - 1]!;
      gOver
        .moveTo(newest.lx, newest.ly)
        .lineTo(leftEyeX, eyeY)
        .moveTo(newest.rx, newest.ry)
        .lineTo(rightEyeX, eyeY)
        .stroke({ color: eyeColor, width: 3.8, alpha: 0.85, cap: 'round' });
      gOver
        .moveTo(newest.lx, newest.ly)
        .lineTo(leftEyeX, eyeY)
        .moveTo(newest.rx, newest.ry)
        .lineTo(rightEyeX, eyeY)
        .stroke({ color: coreColor, width: 1.8, alpha: 0.98, cap: 'round' });
    }
  }
}
