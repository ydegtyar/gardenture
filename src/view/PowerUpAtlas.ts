import * as PIXI from 'pixi.js';
import {
  POWERUP_LIST,
  toPowerUpId,
  type AnyPowerUpId,
  type PowerUpId,
} from '../game/data/powerups';

const textures64 = new Map<PowerUpId, PIXI.Texture>();
const textures128 = new Map<PowerUpId, PIXI.Texture>();
let preloadPromise: Promise<void> | null = null;

/**
 * Loads `/assets/powerups/powerups.png` and slices sub-textures matching
 * `/assets/powerups/powerups.json` frames (`@128.png` on row y=0, `@64.png` on row y=128).
 */
export function preloadPowerUpAtlas(): Promise<void> {
  if (preloadPromise) return preloadPromise;
  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    return Promise.resolve();
  }

  preloadPromise = new Promise<void>((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const baseSource = new PIXI.ImageSource({
          resource: img,
          alphaMode: 'premultiply-alpha-on-upload',
        });

        POWERUP_LIST.forEach((def, index) => {
          const tex128 = new PIXI.Texture({
            source: baseSource,
            frame: new PIXI.Rectangle(index * 128, 0, 128, 128),
          });
          const tex64 = new PIXI.Texture({
            source: baseSource,
            frame: new PIXI.Rectangle(index * 64, 128, 64, 64),
          });
          textures128.set(def.id, tex128);
          textures64.set(def.id, tex64);
        });
      } catch (err) {
        console.warn('Failed to slice powerups spritesheet:', err);
      }
      resolve();
    };
    img.onerror = () => {
      resolve();
    };
    img.src = '/assets/powerups/powerups.png';
  });

  return preloadPromise;
}

export function getPowerUpTexture(
  id: AnyPowerUpId,
  size: 64 | 128 = 64
): PIXI.Texture | undefined {
  const canonicalId = toPowerUpId(id);
  return size === 128
    ? textures128.get(canonicalId)
    : textures64.get(canonicalId);
}
