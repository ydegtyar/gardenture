/**
 * @file MenuHost.tsx
 * Public boundary and host component for the standalone PixiJS MenuScene renderer.
 *
 * Strictly isolated from `game/`, `sim/`, `view/`, `content/`, and `app/context/`.
 * Receives all display state exclusively through the typed `MenuDataProvider` (`data` prop)
 * and emits intents (`onStartRun`, `onResumeRun`, `onOpenLoadout`, `onOpenStore`).
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MenuEventBus } from '../scene/menuEventBus';
import { MenuScene } from '../scene/MenuScene';
import { MenuCssFallbackBackdrop, MenuErrorBoundary } from './MenuErrorBoundary';
import { MenuHtmlUi } from './MenuHtmlUi';

export interface MenuDataProvider {
  bestScore: number;
  coins: number;
  crystals: number;
  hasRun: boolean;
  runLevel?: number;
  activeProfessionName?: string;
  activeBiomeName?: string;
  canWatchAdForCoins?: boolean;
  lastRunRewards?: {
    coinsEarned: number;
    crystalsEarned: number;
    score: number;
  } | null;
}

export interface Props {
  data: MenuDataProvider;

  onStartRun(): void;

  onResumeRun(): void;

  onOpenLoadout(): void;

  onOpenStore(): void;

  onWatchCoinsAd?(): void;

  onTransitionComplete?(mode: 'new' | 'resume'): void;

  /** When true, suppresses Enter/Space shortcut because a Sanctuary modal is open above the menu */
  isModalOpen?: boolean;
  /** Optional flag for testing WebGL failure fallback */
  forceCssFallback?: boolean;
}

export function MenuHost({
                           data,
                           onStartRun,
                           onResumeRun,
                           onOpenLoadout,
                           onOpenStore,
                           onWatchCoinsAd,
                           onTransitionComplete,
                           isModalOpen = false,
                           forceCssFallback = false,
                         }: Props) {
  const canvasHostRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<MenuScene | null>(null);
  const busRef = useRef<MenuEventBus | null>(null);
  const isTransitioningRef = useRef(false);

  const [useFallback, setUseFallback] = useState<boolean>(forceCssFallback);
  const [fallbackReason, setFallbackReason] = useState<string | null>(
    forceCssFallback ? 'Forced CSS fallback' : null,
  );
  const [isExiting, setIsExiting] = useState(false);

  // Store latest callbacks in refs so HUD/prop updates never remount the PixiJS Application
  const callbacksRef = useRef({
    onStartRun,
    onResumeRun,
    onTransitionComplete,
    isModalOpen,
  });
  callbacksRef.current = {
    onStartRun,
    onResumeRun,
    onTransitionComplete,
    isModalOpen,
  };

  useEffect(() => {
    if (forceCssFallback) {
      setUseFallback(true);
      setFallbackReason('Forced CSS fallback');
      return;
    }

    const hostEl = canvasHostRef.current;
    if (!hostEl) return;

    const bus = new MenuEventBus();
    busRef.current = bus;

    const scene = new MenuScene({
      bus,
      initialQuality: 'high',
      transitionDurationMs: 160,
      onFallbackRequired: (reason) => {
        setUseFallback(true);
        setFallbackReason(reason);
      },
    });
    sceneRef.current = scene;

    const unsubTransitionDone = bus.on('scene:transitionDone', ({ mode }) => {
      isTransitioningRef.current = false;
      callbacksRef.current.onTransitionComplete?.(mode);
    });

    const unsubContextLost = bus.on('menu:contextLost', () => {
      setUseFallback(true);
      setFallbackReason('WebGL context lost');
    });

    const unsubContextRestored = bus.on('menu:contextRestored', () => {
      setUseFallback(false);
      setFallbackReason(null);
    });

    void scene.mount(hostEl);

    if (typeof window !== 'undefined') {
      const win = window as unknown as Record<string, unknown>;
      win.__MENU_SCENE__ = scene;
      win.__MENU_DIAGNOSTICS__ = () => MenuScene.getGlobalDiagnostics();
    }

    return () => {
      unsubTransitionDone();
      unsubContextLost();
      unsubContextRestored();
      bus.clear();
      void scene.unmount();
      sceneRef.current = null;
      busRef.current = null;
      if (typeof window !== 'undefined') {
        const win = window as unknown as Record<string, unknown>;
        if (win.__MENU_SCENE__ === scene) {
          win.__MENU_SCENE__ = null;
        }
      }
    };
  }, [forceCssFallback]);

  const triggerRunHandoff = useCallback((mode: 'new' | 'resume') => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setIsExiting(true);

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    // 1. Immediately invoke host callback so `document.body.dataset.state = 'playing'`
    // is set at t = 0ms and the game canvas mounts underneath (paused during crossfade).
    if (mode === 'resume') {
      callbacksRef.current.onResumeRun();
    } else {
      callbacksRef.current.onStartRun();
    }

    // 2. Emit `menu:start` on the internal bus so MenuScene plays its transition and emits `scene:transitionDone`
    const bus = busRef.current;
    const scene = sceneRef.current;
    if (bus && scene && scene.getDiagnostics().mounted) {
      bus.emit('menu:start', { mode });
      window.setTimeout(() => {
        if (isTransitioningRef.current) {
          isTransitioningRef.current = false;
          callbacksRef.current.onTransitionComplete?.(mode);
        }
      }, 240);
    } else {
      isTransitioningRef.current = false;
      callbacksRef.current.onTransitionComplete?.(mode);
    }
  }, []);

  // Namespaced keyboard listener attached only while MenuHost is mounted
  useEffect(() => {
    const onMenuKeyDown = (ev: KeyboardEvent) => {
      if (callbacksRef.current.isModalOpen || isTransitioningRef.current) return;
      if (
        ev.target instanceof HTMLInputElement ||
        ev.target instanceof HTMLTextAreaElement ||
        ev.target instanceof HTMLSelectElement
      ) {
        return;
      }
      if (ev.code === 'Enter' || ev.code === 'Space') {
        ev.preventDefault();
        triggerRunHandoff('new');
      }
    };

    window.addEventListener('keydown', onMenuKeyDown);
    return () => {
      window.removeEventListener('keydown', onMenuKeyDown);
    };
  }, [triggerRunHandoff]);

  return (
    <MenuErrorBoundary fallbackUI={(
      <MenuHtmlUi
        data={data}
        isExiting={isExiting}
        onStartRun={() => triggerRunHandoff('new')}
        onResumeRun={() => triggerRunHandoff('resume')}
        onOpenLoadout={onOpenLoadout}
        onOpenStore={onOpenStore}
        onWatchCoinsAd={onWatchCoinsAd}
      />
    )}>
      <div
        id="menu-root"
        data-testid="menu-root"
        className="fixed inset-0 z-20 overflow-hidden select-none"
      >
        {/* Standalone Menu PixiJS Canvas Mount Target */}
        <div
          ref={canvasHostRef}
          data-testid="menu-canvas-container"
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
        />

        {/* Smooth Radial Atmospheric Depth Vignette & Center UI Elevation Backdrop */}
        <div
          aria-hidden="true"
          className="absolute inset-0 pointer-events-none z-[5] bg-[radial-gradient(ellipse_at_50%_52%,rgba(7,3,12,0.26)_0%,rgba(14,7,22,0.04)_44%,rgba(5,2,10,0.56)_100%)]"
        />

        {/* Automatic CSS Twilight + Animated Sakura Petals Fallback if WebGL fails or is lost */}
        {useFallback && <MenuCssFallbackBackdrop reason={fallbackReason} />}

        {/* Menu HTML UI Overlay */}
        <MenuHtmlUi
          data={data}
          isExiting={isExiting}
          onStartRun={() => triggerRunHandoff('new')}
          onResumeRun={() => triggerRunHandoff('resume')}
          onOpenLoadout={onOpenLoadout}
          onOpenStore={onOpenStore}
          onWatchCoinsAd={onWatchCoinsAd}
        />
      </div>
    </MenuErrorBoundary>
  );
}

/**
 * Standalone `/menu-only` isolation harness that renders `MenuHost` with mocked
 * `MenuDataProvider` data and zero game simulation or game renderer code loaded.
 */
export function StandaloneMenuShowcase() {
  const [mockData, setMockData] = useState<MenuDataProvider>({
    bestScore: 1570,
    coins: 175,
    crystals: 5,
    hasRun: true,
    runLevel: 2,
    activeProfessionName: 'Warden',
    activeBiomeName: 'Sakura Twilight Grove',
    canWatchAdForCoins: true,
  });
  const [lastIntent, setLastIntent] = useState<string>('idle');

  return (
    <div
      data-testid="standalone-menu-route"
      data-last-intent={lastIntent}
      className="relative w-screen h-screen overflow-hidden bg-[#191022]"
    >
      <MenuHost
        data={mockData}
        onStartRun={() => setLastIntent('start_run')}
        onResumeRun={() => setLastIntent('resume_run')}
        onOpenLoadout={() => setLastIntent('open_loadout')}
        onOpenStore={() => setLastIntent('open_store')}
        onWatchCoinsAd={() => {
          setLastIntent('watch_coins_ad');
          setMockData((prev) => ({ ...prev, coins: prev.coins + 100 }));
        }}
      />
    </div>
  );
}
