/**
 * @file DraftBackdrop.tsx
 * Enchanted forest backdrop rendered over the live paused PixiJS game arena.
 * Features a dark emerald/plum gradient, subtle blur with solid high-opacity fallback,
 * lazy-loaded bioluminescent corner mushrooms/foliage, and drifting firefly motes.
 */

import React, { useState } from 'react';
import { getOrnamentAsset } from '../../../ui/ornate';

export interface DraftBackdropProps {
  reducedMotion?: boolean;
  children?: React.ReactNode;
}

const FIREFLY_MOTES = [
  { left: '8%', top: '18%', size: 6, color: '#fde047', dx: '22px', dy: '-28px', dur: '4.2s', delay: '0s' },
  { left: '16%', top: '72%', size: 5, color: '#6ee7b7', dx: '-18px', dy: '-24px', dur: '5.1s', delay: '0.6s' },
  { left: '28%', top: '12%', size: 4, color: '#fde047', dx: '14px', dy: '20px', dur: '4.8s', delay: '1.1s' },
  { left: '74%', top: '14%', size: 6, color: '#6ee7b7', dx: '-20px', dy: '-22px', dur: '4.5s', delay: '0.3s' },
  { left: '88%', top: '26%', size: 5, color: '#fde047', dx: '-24px', dy: '18px', dur: '5.4s', delay: '0.9s' },
  { left: '82%', top: '76%', size: 6, color: '#6ee7b7', dx: '16px', dy: '-30px', dur: '4.3s', delay: '1.4s' },
  { left: '6%', top: '48%', size: 4, color: '#a7f3d0', dx: '20px', dy: '-16px', dur: '4.9s', delay: '0.4s' },
  { left: '93%', top: '54%', size: 5, color: '#fde047', dx: '-18px', dy: '-22px', dur: '4.7s', delay: '1.7s' },
] as const;

export const DraftBackdrop: React.FC<DraftBackdropProps> = ({
  reducedMotion = false,
  children,
}) => {
  const [mushroomsFailed, setMushroomsFailed] = useState(false);
  const mushroomAsset = getOrnamentAsset('backdropMushrooms');

  return (
    <div
      data-testid="draft-backdrop"
      onClick={(e) => {
        // Clicking the backdrop must never dismiss or trigger random actions
        e.stopPropagation();
      }}
      className="ornate-draft-backdrop fixed inset-0 z-40 flex flex-col items-center justify-center p-2.5 sm:p-5 overflow-y-auto overflow-x-hidden pointer-events-auto select-none"
    >
      {/* Radial Dark Forest Vignette */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_50%_46%,transparent_28%,rgba(5,3,9,0.72)_100%)]"
      />

      {/* Lazy-Loaded Glowing Mushrooms & Foliage at Bottom Corners */}
      {!mushroomsFailed && (
        <>
          <img
            src={mushroomAsset.webpPath}
            alt=""
            loading="eager"
            decoding="sync"
            aria-hidden="true"
            onError={() => setMushroomsFailed(true)}
            className="pointer-events-none fixed bottom-0 left-0 z-0 w-44 sm:w-64 md:w-80 opacity-75 select-none object-contain object-left-bottom"
          />
          <img
            src={mushroomAsset.webpPath}
            alt=""
            loading="eager"
            decoding="sync"
            aria-hidden="true"
            onError={() => setMushroomsFailed(true)}
            className="pointer-events-none fixed bottom-0 right-0 z-0 w-44 sm:w-64 md:w-80 opacity-75 -scale-x-100 select-none object-contain object-left-bottom"
          />
        </>
      )}

      {/* Drifting Firefly Particles (Pure CSS, outside PixiJS renderer) */}
      {!reducedMotion && (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          {FIREFLY_MOTES.map((mote, i) => (
            <span
              key={i}
              className="ornate-firefly-mote absolute rounded-full"
              style={
                {
                  left: mote.left,
                  top: mote.top,
                  width: `${mote.size}px`,
                  height: `${mote.size}px`,
                  backgroundColor: mote.color,
                  boxShadow: `0 0 10px 3px ${mote.color}`,
                  '--ff-dx': mote.dx,
                  '--ff-dy': mote.dy,
                  '--ff-dur': mote.dur,
                  '--ff-delay': mote.delay,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      {children}
    </div>
  );
};

export default DraftBackdrop;
