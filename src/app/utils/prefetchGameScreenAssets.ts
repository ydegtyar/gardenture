/**
 * @file prefetchGameScreenAssets.ts
 * Eagerly prefetches, decodes, and pins all static images required on the Game Screen
 * (especially the Botanical Health Bar HUD `/healthbar-frame.png`, `/heart-emblem.png`,
 * `/shield-overlay.png`, Power-Up HUD & drop icons, and Tarot Draft ornaments)
 * in memory before the Game Screen is shown.
 */

import React from 'react';
import { POWERUP_LIST, powerUpIcon } from '../../game/data/powerups';
import { ORNAMENT_ASSETS } from '../../ui/ornate/ornateAssets';
import { preloadPowerUpAtlas } from '../../view/PowerUpAtlas';

/**
 * Critical static PNG layers required by the top-left Botanical Health Bar HUD (`BotanicalHealthBar`).
 */
export const HEALTHBAR_HUD_IMAGES: readonly string[] = [
  '/healthbar-frame.png',
  '/heart-emblem.png',
  '/shield-overlay.png',
] as const;

/**
 * Static WebP/PNG icons required by the in-run HUD power-up slots (`[Q]`, `[E]`) and `ActiveBuffs` strip.
 */
export const GAME_SCREEN_POWERUP_IMAGES: readonly string[] = POWERUP_LIST.flatMap((def) => [
  powerUpIcon(def.id, 64),
  powerUpIcon(def.id, 128),
]);

/**
 * Static ornament images used by in-run overlays (`CardDraftModal` / `DraftBackdrop`).
 */
export const GAME_SCREEN_ORNAMENT_IMAGES: readonly string[] = Object.values(ORNAMENT_ASSETS).map(
  (asset) => asset.webpPath
);

/**
 * Complete deduplicated list of static images needed on the Game Screen.
 */
export const GAME_SCREEN_STATIC_IMAGES: readonly string[] = Array.from(
  new Set([
    ...HEALTHBAR_HUD_IMAGES,
    ...GAME_SCREEN_POWERUP_IMAGES,
    ...GAME_SCREEN_ORNAMENT_IMAGES,
  ])
);

/**
 * Persistent in-memory cache of decoded `HTMLImageElement` instances.
 * Keeping strong references prevents the browser from evicting decoded bitmaps
 * before `PlayingHudOverlay` and `BotanicalHealthBar` mount.
 */
const decodedImageCache = new Map<string, HTMLImageElement>();
const inFlightPromises = new Map<string, Promise<boolean>>();
let allPrefetchPromise: Promise<void> | null = null;
let gameScreenAssetsReady = false;

/**
 * Fetches and decodes a single static image URL into browser memory.
 * Resolves `true` when loaded & decoded, or `false` on error/timeout so a broken asset never blocks gameplay.
 */
export function preloadAndDecodeImage(url: string, timeoutMs = 2500): Promise<boolean> {
  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    return Promise.resolve(true);
  }

  const cached = decodedImageCache.get(url);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return Promise.resolve(true);
  }

  const existingPromise = inFlightPromises.get(url);
  if (existingPromise) {
    return existingPromise;
  }

  const promise = new Promise<boolean>((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      if (timerId !== null) {
        window.clearTimeout(timerId);
      }
      resolve(ok);
    };

    const timerId =
      timeoutMs > 0
        ? window.setTimeout(() => {
            finish(false);
          }, timeoutMs)
        : null;

    const img = new Image();
    img.decoding = 'async';
    if ('fetchPriority' in img) {
      (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority =
        HEALTHBAR_HUD_IMAGES.includes(url) ? 'high' : 'auto';
    }

    decodedImageCache.set(url, img);

    const onReady = () => {
      if (typeof img.decode === 'function') {
        img
          .decode()
          .then(() => finish(true))
          .catch(() => finish(true));
      } else {
        finish(true);
      }
    };

    img.onload = onReady;
    img.onerror = () => {
      decodedImageCache.delete(url);
      finish(false);
    };

    img.src = url;

    if (img.complete && img.naturalWidth > 0) {
      onReady();
    }
  });

  inFlightPromises.set(url, promise);
  return promise;
}

/**
 * Prefetches and decodes all static images needed on the Game Screen
 * (Health Bar HUD frame/heart/shield, Power-Up HUD icons, PixiJS PowerUpAtlas, and draft ornaments).
 */
export function prefetchGameScreenAssets(timeoutMs = 2500): Promise<void> {
  if (gameScreenAssetsReady) {
    return Promise.resolve();
  }
  if (allPrefetchPromise) {
    return allPrefetchPromise;
  }
  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    gameScreenAssetsReady = true;
    return Promise.resolve();
  }

  allPrefetchPromise = Promise.all([
    ...GAME_SCREEN_STATIC_IMAGES.map((url) => preloadAndDecodeImage(url, timeoutMs)),
    preloadPowerUpAtlas(),
  ]).then(() => {
    gameScreenAssetsReady = true;
    if (typeof document !== 'undefined' && document.body) {
      document.body.dataset.hudAssetsReady = 'true';
    }
  });

  return allPrefetchPromise;
}

export function areGameScreenAssetsReady(): boolean {
  return gameScreenAssetsReady;
}

export function getPrefetchedImageUrls(): string[] {
  return Array.from(decodedImageCache.keys());
}

/**
 * Hidden offscreen DOM prewarmer mounted from app boot so the browser's CSS & image compositor
 * rasterizes `/healthbar-frame.png`, `/heart-emblem.png`, `/shield-overlay.png`, and HUD power-up
 * icons before transitioning from the Title Screen to the Game Screen.
 */
export const GameScreenAssetsPrewarmer: React.FC = React.memo(function GameScreenAssetsPrewarmer() {
  return React.createElement(
    'div',
    {
      'aria-hidden': 'true',
      'data-testid': 'game-screen-assets-prewarmer',
      className:
        'fixed -left-[9999px] -top-[9999px] w-px h-px overflow-hidden opacity-0 pointer-events-none select-none',
    },
    React.createElement('div', {
      style: {
        width: 1,
        height: 1,
        backgroundImage:
          'url("/healthbar-frame.png"), url("/heart-emblem.png"), url("/shield-overlay.png")',
      },
    }),
    ...HEALTHBAR_HUD_IMAGES.map((src) =>
      React.createElement('img', {
        key: src,
        src,
        alt: '',
        decoding: 'sync',
        loading: 'eager',
        width: 1,
        height: 1,
      })
    ),
    ...GAME_SCREEN_POWERUP_IMAGES.map((src) =>
      React.createElement('img', {
        key: src,
        src,
        alt: '',
        decoding: 'async',
        loading: 'eager',
        width: 1,
        height: 1,
      })
    )
  );
});

