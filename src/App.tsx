/**
 * Gardenture: Mystic Garden Roguelite
 * Layer 7 (app): Root Game Shell composing GameShellProvider (React Context),
 * PixiJS v8 WebGL Viewport, Title Screen Overlay, Playing HUD Overlay, and Game Modals.
 */

import React from 'react';
import { GameShellProvider } from './app/context/GameShellContext';
import { GameCanvasViewport } from './app/components/GameCanvasViewport';
import { TitleScreenOverlay } from './app/components/TitleScreenOverlay';
import { PlayingHudOverlay } from './app/components/PlayingHudOverlay';
import { GameModalsOverlay } from './app/components/GameModalsOverlay';

export default function App() {
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
