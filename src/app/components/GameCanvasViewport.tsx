import React from 'react';
import { useGameShell } from '../context/GameShellContext';

/**
 * Isolated PixiJS v8 WebGL Canvas Mount container.
 */
export function GameCanvasViewport() {
  const { canvasContainerRef } = useGameShell();
  return (
    <div
      ref={canvasContainerRef}
      data-testid="game-canvas-container"
      className="absolute inset-0 w-full h-full"
    />
  );
}
