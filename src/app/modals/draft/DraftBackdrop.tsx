/**
 * @file DraftBackdrop.tsx
 * Enchanted forest backdrop rendered over the live paused PixiJS game arena.
 * Features a dark emerald/plum gradient, subtle blur with solid high-opacity fallback,
 * lazy-loaded bioluminescent corner mushrooms/foliage, and drifting firefly motes.
 */

import React from 'react';
import { GlowingMushrooms } from './GlowingMushrooms';

export interface DraftBackdropProps {
  reducedMotion?: boolean;
  children?: React.ReactNode;
}

const FIREFLY_MOTES = [
  { left: '8%', top: '18%', size: 6, color: '#fde047', dx: '28px', dy: '-36px', dur: '16.5s', delay: '-3.8s' },
  { left: '16%', top: '72%', size: 5, color: '#6ee7b7', dx: '-26px', dy: '-32px', dur: '18.6s', delay: '-8.2s' },
  { left: '28%', top: '12%', size: 4, color: '#fde047', dx: '22px', dy: '28px', dur: '17.2s', delay: '-1.9s' },
  { left: '74%', top: '14%', size: 6, color: '#6ee7b7', dx: '-30px', dy: '-30px', dur: '15.4s', delay: '-10.3s' },
  { left: '88%', top: '26%', size: 5, color: '#fde047', dx: '-32px', dy: '24px', dur: '19.8s', delay: '-5.0s' },
  { left: '82%', top: '76%', size: 6, color: '#6ee7b7', dx: '24px', dy: '-38px', dur: '16.8s', delay: '-12.1s' },
  { left: '6%', top: '48%', size: 4, color: '#a7f3d0', dx: '28px', dy: '-24px', dur: '18.2s', delay: '-4.5s' },
  { left: '93%', top: '54%', size: 5, color: '#fde047', dx: '-26px', dy: '-28px', dur: '17.6s', delay: '-7.7s' },
] as const;

export const DraftBackdrop: React.FC<DraftBackdropProps> = ({
  reducedMotion = false,
  children,
}) => {
  return (
    <div
      data-testid="draft-backdrop"
      onClick={(e) => {
        // Clicking the backdrop must never dismiss or trigger random actions
        e.stopPropagation();
      }}
      className="ornate-draft-backdrop fixed inset-0 z-40 flex flex-col items-center justify-center p-2.5 sm:p-5 overflow-y-auto overflow-x-hidden pointer-events-auto select-none"
    >
      {/* Radial Dark Forest Vignette — keep game arena clearly visible through the center */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_50%_46%,transparent_48%,rgba(5,3,9,0.52)_100%)]"
      />

      {/* CSS/SVG Generated Bioluminescent Mushrooms Sprouting from Out of the Screen */}
      <GlowingMushrooms side="left" reducedMotion={reducedMotion} />
      <GlowingMushrooms side="right" reducedMotion={reducedMotion} />

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
