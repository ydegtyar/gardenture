/**
 * Gardenture: Mystic Garden Roguelite
 * Layer 7 (app): Root Game Shell composing GameShellProvider (React Context),
 * PixiJS v8 WebGL Viewport, Title Screen Overlay, Playing HUD Overlay, and Game Modals.
 * Also supports standalone `/menu-only` or `?menu-only=1` isolation route with mocked MenuDataProvider.
 */

import React from 'react';
import { GameShellProvider } from './app/context/GameShellContext';
import { GameCanvasViewport } from './app/components/GameCanvasViewport';
import { TitleScreenOverlay } from './app/components/TitleScreenOverlay';
import { PlayingHudOverlay } from './app/components/PlayingHudOverlay';
import { GameModalsOverlay } from './app/components/GameModalsOverlay';
import { StandaloneMenuShowcase } from './menu/MenuHost';

export default function App() {
  const isStandaloneMenuRoute =
    typeof window !== 'undefined' &&
    (window.location.pathname === '/menu-only' ||
      window.location.pathname.endsWith('/menu-only') ||
      new URLSearchParams(window.location.search).get('menu-only') === '1' ||
      new URLSearchParams(window.location.search).get('menuOnly') === '1');

  if (isStandaloneMenuRoute) {
    return <StandaloneMenuShowcase />;
  }

  return (
    <GameShellProvider>
      <div className="relative w-screen h-screen overflow-hidden bg-[#18241E] select-none">
        <GameCanvasViewport />
        <TitleScreenOverlay />
        <PlayingHudOverlay />
        <GameModalsOverlay />
      </div>
    </GameShellProvider>
  );
}
