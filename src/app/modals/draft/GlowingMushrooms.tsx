/**
 * @file GlowingMushrooms.tsx
 * Pure CSS/SVG generated bioluminescent mushrooms & mossy forest floor corner accents.
 * Features:
 * - Distinct mushroom species, colors, and foliage between left and right sides.
 * - Smooth seamless ground terrain leveling to zero-cliff at screen edges.
 * - Naturally scattered wild grass with varied blade curvatures, lengths, and depths.
 * - Staggered entrance animation where background terrain appears first, followed by
 *   individual mushrooms sprouting independently with organic delays out of the soil.
 * - Animated drifting bioluminescent fireflies and spores.
 */

import React, { useId } from 'react';

export interface Props {
  side?: 'left' | 'right';
  reducedMotion?: boolean;
  className?: string;
}

// Helper to generate a unique natural curved grass blade with wind-sway physics
const renderBlade = (
  key: string,
  bx: number,
  by: number,
  length: number,
  archX: number,
  widthBase: number,
  fillUrl: string,
  opacity: number = 1,
  side: 'left' | 'right' = 'left',
) => {
  const tipX = bx + archX;
  const tipY = by - length;
  const c1x = bx + archX * 0.3;
  const c1y = by - length * 0.55;
  const c2x = bx + archX * 0.75;
  const c2y = by - length * 0.85;

  const w2 = widthBase / 2;
  const d = `M ${bx - w2},${by} Q ${c1x - w2 * 0.6},${c1y} ${tipX},${tipY} Q ${c2x + w2 * 0.5},${c2y} ${bx + w2},${by} Z`;

  // Natural wind response based on blade length: taller blades bow deeper and sway slower
  const windTier = length >= 80 ? 'tall' : length >= 50 ? 'mid' : 'short';
  const windClass = `draft-grass-wind-${side}-${windTier}`;

  // Traveling wave phase delay based on terrain position across the 420px span
  const waveDelay = side === 'left'
    ? -((bx * 0.009 + (length % 7) * 0.35) % 4.8).toFixed(2)
    : -(((420 - bx) * 0.009 + (length % 7) * 0.35) % 4.8).toFixed(2);

  const durOffset = (length % 5) * 0.18 - 0.36;
  const baseDur = windTier === 'tall' ? 4.5 : windTier === 'mid' ? 3.7 : 2.9;
  const windDur = (baseDur + durOffset).toFixed(2);

  return (
    <path
      key={key}
      d={d}
      fill={fillUrl}
      opacity={opacity}
      className={`draft-grass-blade ${windClass}`}
      style={{
        transformOrigin: `${bx}px ${by}px`,
        animationDuration: `${windDur}s`,
        animationDelay: `${waveDelay}s`,
      }}
    />
  );
};

/**
 * Natural organic wild grass clusters for the left slope.
 * Highly varied blade lengths, natural criss-crossing curves, and layered depths.
 */
const renderLeftWildGrass = (uid: string) => {
  const deep = `url(#grass-deep-${uid})`;
  const tall1 = `url(#grass-tall-1-${uid})`;
  const tall2 = `url(#grass-tall-2-${uid})`;
  const lime = `url(#grass-left-lime-${uid})`;

  return [
    // Cluster 1: Far left corner (behind inkcap)
    renderBlade('lw-1', 14, 138, 88, 32, 3.8, deep, 0.85, 'left'),
    renderBlade('lw-2', 20, 142, 65, 18, 3.0, tall1, 0.9, 'left'),
    renderBlade('lw-3', 8, 140, 52, -12, 2.8, deep, 0.8, 'left'),
    renderBlade('lw-4', 26, 145, 96, 42, 3.2, tall2, 0.95, 'left'),
    renderBlade('lw-5', 32, 148, 72, 22, 2.5, lime, 0.9, 'left'),
    renderBlade('lw-6', 16, 144, 42, 8, 2.0, tall1, 0.85, 'left'),

    // Cluster 2: Between inkcap and hero emerald parasol
    renderBlade('lw-7', 54, 154, 98, 48, 3.5, deep, 0.85, 'left'),
    renderBlade('lw-8', 62, 156, 78, 28, 2.8, tall1, 0.9, 'left'),
    renderBlade('lw-9', 48, 152, 60, -14, 2.6, tall2, 0.85, 'left'),
    renderBlade('lw-10', 70, 160, 108, 54, 3.6, tall1, 0.95, 'left'),
    renderBlade('lw-11', 78, 164, 82, 34, 2.4, lime, 0.9, 'left'),

    // Cluster 3: Behind and around emerald parasol stem
    renderBlade('lw-12', 106, 172, 92, 42, 3.2, deep, 0.85, 'left'),
    renderBlade('lw-13', 114, 176, 74, 20, 2.6, tall1, 0.9, 'left'),
    renderBlade('lw-14', 124, 180, 86, 36, 3.0, tall2, 0.9, 'left'),
    renderBlade('lw-15', 132, 184, 62, -16, 2.4, deep, 0.8, 'left'),

    // Cluster 4: Slope behind golden bonnet
    renderBlade('lw-16', 160, 192, 88, 38, 3.2, tall1, 0.9, 'left'),
    renderBlade('lw-17', 168, 196, 68, 18, 2.5, lime, 0.85, 'left'),
    renderBlade('lw-18', 176, 200, 94, 46, 3.0, deep, 0.85, 'left'),
    renderBlade('lw-19', 188, 206, 72, -18, 2.6, tall2, 0.85, 'left'),
    renderBlade('lw-20', 196, 210, 82, 30, 2.8, tall1, 0.9, 'left'),

    // Cluster 5: Gentle slope trailing toward center
    renderBlade('lw-21', 220, 218, 76, 32, 2.8, tall2, 0.85, 'left'),
    renderBlade('lw-22', 232, 224, 58, 14, 2.2, lime, 0.85, 'left'),
    renderBlade('lw-23', 244, 230, 70, 26, 2.6, deep, 0.8, 'left'),
    renderBlade('lw-24', 260, 236, 52, -12, 2.2, tall1, 0.8, 'left'),
    renderBlade('lw-25', 278, 242, 48, 18, 2.0, tall2, 0.75, 'left'),
    renderBlade('lw-26', 302, 248, 38, 14, 1.8, lime, 0.7, 'left'),
    renderBlade('lw-27', 330, 253, 28, 10, 1.6, tall1, 0.65, 'left'),
    renderBlade('lw-28', 360, 256, 20, 8, 1.4, deep, 0.6, 'left'),
  ];
};

/**
 * Natural organic wild grass clusters for the right slope.
 * Scattered blades wind-swept and gracefully bowing inward to the left.
 */
const renderRightWildGrass = (uid: string) => {
  const shadow = `url(#grass-right-shadow-${uid})`;
  const tall = `url(#grass-right-tall-${uid})`;
  const lime = `url(#grass-right-lime-${uid})`;

  return [
    // Cluster 1: Far right corner (behind amethyst toadstool)
    renderBlade('rw-1', 410, 134, 92, -36, 3.8, shadow, 0.85, 'right'),
    renderBlade('rw-2', 402, 138, 68, -20, 3.0, lime, 0.9, 'right'),
    renderBlade('rw-3', 414, 136, 56, 12, 2.6, shadow, 0.8, 'right'),
    renderBlade('rw-4', 392, 144, 102, -48, 3.4, tall, 0.95, 'right'),
    renderBlade('rw-5', 384, 148, 76, -26, 2.6, lime, 0.9, 'right'),
    renderBlade('rw-6', 376, 152, 54, -14, 2.2, tall, 0.85, 'right'),

    // Cluster 2: Between amethyst toadstool and chanterelles
    renderBlade('rw-7', 358, 158, 100, -52, 3.5, shadow, 0.85, 'right'),
    renderBlade('rw-8', 350, 162, 78, -30, 2.8, tall, 0.9, 'right'),
    renderBlade('rw-9', 364, 160, 62, 16, 2.4, lime, 0.85, 'right'),
    renderBlade('rw-10', 338, 168, 106, -58, 3.6, lime, 0.95, 'right'),
    renderBlade('rw-11', 328, 172, 84, -36, 2.6, tall, 0.9, 'right'),

    // Cluster 3: Behind and around chanterelles
    renderBlade('rw-12', 304, 180, 94, -46, 3.2, shadow, 0.85, 'right'),
    renderBlade('rw-13', 294, 184, 72, -22, 2.6, tall, 0.9, 'right'),
    renderBlade('rw-14', 282, 190, 86, -38, 3.0, lime, 0.9, 'right'),
    renderBlade('rw-15', 274, 194, 60, 16, 2.4, shadow, 0.8, 'right'),

    // Cluster 4: Slope behind pixie lantern
    renderBlade('rw-16', 248, 202, 88, -40, 3.2, tall, 0.9, 'right'),
    renderBlade('rw-17', 238, 206, 68, -20, 2.5, lime, 0.85, 'right'),
    renderBlade('rw-18', 228, 212, 92, -48, 3.0, shadow, 0.85, 'right'),
    renderBlade('rw-19', 216, 218, 70, 18, 2.6, tall, 0.85, 'right'),
    renderBlade('rw-20', 204, 222, 80, -32, 2.8, lime, 0.9, 'right'),

    // Cluster 5: Gentle slope trailing toward center (leveling down to ground)
    renderBlade('rw-21', 178, 228, 74, -34, 2.8, tall, 0.85, 'right'),
    renderBlade('rw-22', 162, 234, 56, -16, 2.2, lime, 0.85, 'right'),
    renderBlade('rw-23', 146, 238, 68, -28, 2.6, shadow, 0.8, 'right'),
    renderBlade('rw-24', 128, 244, 50, 14, 2.2, tall, 0.8, 'right'),
    renderBlade('rw-25', 108, 248, 44, -20, 2.0, lime, 0.75, 'right'),
    renderBlade('rw-26', 84, 252, 34, -14, 1.8, tall, 0.7, 'right'),
    renderBlade('rw-27', 58, 255, 26, -10, 1.6, shadow, 0.65, 'right'),
    renderBlade('rw-28', 30, 258, 18, -8, 1.4, lime, 0.6, 'right'),
  ];
};

export const GlowingMushrooms: React.FC<Props> = ({
  side = 'left',
  reducedMotion = false,
  className = '',
}) => {
  const uid = useId().replace(/:/g, '');
  const delayMs = side === 'right' ? 80 : 0;

  return (
    <div
      data-testid={`glowing-mushrooms-${side}`}
      aria-hidden="true"
      className={`portrait:hidden pointer-events-none fixed bottom-[-10px] z-0 select-none overflow-visible ${
        side === 'left' ? 'left-0' : 'right-0'
      } ${className}`}
      style={{
        width: 'clamp(220px, 30vw, 420px)',
        height: 'clamp(140px, 19vw, 260px)',
      }}
    >
      <div className="w-full h-full relative">
        <svg
          viewBox="0 0 420 260"
          className="w-full h-full block overflow-visible draft-mushroom-glow-pulse"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <style>{`
            ${
              reducedMotion
                ? `
              .draft-terrain-layer,
              .draft-foreground-layer,
              .draft-shroom,
              .draft-grass-blade,
              .draft-fern-frond,
              .draft-fern-fiddlehead,
              .draft-ivy-flutter,
              .draft-clover-bob,
              .draft-fireflies-layer,
              .draft-firefly-wander,
              .draft-firefly-flutter {
                animation: none !important;
                opacity: 1 !important;
                transform: none !important;
              }
            `
                : `
              /* Background terrain appears first */
              .draft-terrain-layer {
                transform-origin: bottom center;
                animation: draft-terrain-rise 650ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms both;
              }
              .draft-foreground-layer {
                transform-origin: bottom center;
                animation: draft-terrain-rise 650ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs}ms both;
              }

              /* Mushrooms sprout independently with minor delays after background */
              .draft-shroom {
                transform-box: fill-box;
                transform-origin: bottom center;
              }
              .draft-shroom-l1 {
                animation: draft-shroom-sprout 720ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs + 220}ms both;
              }
              .draft-shroom-l2 {
                animation: draft-shroom-sprout 680ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs + 280}ms both;
              }
              .draft-shroom-l3 {
                animation: draft-shroom-sprout 660ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs + 340}ms both;
              }
              .draft-shroom-l4 {
                animation: draft-shroom-sprout 620ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs + 400}ms both;
              }
              .draft-shroom-r1 {
                animation: draft-shroom-sprout 720ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs + 220}ms both;
              }
              .draft-shroom-r23 {
                animation: draft-shroom-sprout 680ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs + 280}ms both;
              }
              .draft-shroom-r4 {
                animation: draft-shroom-sprout 660ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs + 340}ms both;
              }
              .draft-shroom-r56 {
                animation: draft-shroom-sprout 620ms cubic-bezier(0.16, 1, 0.3, 1) ${delayMs + 400}ms both;
              }

              /* Wind flow for wild grass blades (anchored at individual blade roots) */
              .draft-grass-blade {
                will-change: transform;
              }
              .draft-grass-wind-left-tall {
                animation-name: draft-grass-wind-left-tall;
                animation-timing-function: ease-in-out;
                animation-iteration-count: infinite;
              }
              .draft-grass-wind-left-mid {
                animation-name: draft-grass-wind-left-mid;
                animation-timing-function: ease-in-out;
                animation-iteration-count: infinite;
              }
              .draft-grass-wind-left-short {
                animation-name: draft-grass-wind-left-short;
                animation-timing-function: ease-in-out;
                animation-iteration-count: infinite;
              }
              .draft-grass-wind-right-tall {
                animation-name: draft-grass-wind-right-tall;
                animation-timing-function: ease-in-out;
                animation-iteration-count: infinite;
              }
              .draft-grass-wind-right-mid {
                animation-name: draft-grass-wind-right-mid;
                animation-timing-function: ease-in-out;
                animation-iteration-count: infinite;
              }
              .draft-grass-wind-right-short {
                animation-name: draft-grass-wind-right-short;
                animation-timing-function: ease-in-out;
                animation-iteration-count: infinite;
              }

              /* Foliage wind rustling */
              .draft-fern-frond {
                will-change: transform;
                animation: draft-fern-wind-sway 5.6s ease-in-out infinite;
              }
              .draft-fern-fiddlehead {
                will-change: transform;
                animation: draft-fiddlehead-sway 4.2s ease-in-out -1.5s infinite;
              }
              .draft-ivy-flutter {
                will-change: transform;
                animation: draft-ivy-wind-flutter 4.8s ease-in-out -2.0s infinite;
              }
              .draft-clover-bob {
                will-change: transform;
                animation: draft-clover-bob 3.8s ease-in-out -1.2s infinite;
              }

              /* Fireflies layer entrance */
              .draft-fireflies-layer {
                animation: draft-fireflies-fadein 900ms ease-out ${delayMs + 450}ms both;
              }

              /* Firefly Macro-Wander (autonomous paths across glade - slow ambient drift) */
              .draft-firefly-wander {
                will-change: transform;
              }
              .draft-wander-1 { animation: draft-wander-1 var(--wander-dur, 26s) ease-in-out var(--wander-delay, 0s) infinite; }
              .draft-wander-2 { animation: draft-wander-2 var(--wander-dur, 30s) ease-in-out var(--wander-delay, 0s) infinite; }
              .draft-wander-3 { animation: draft-wander-3 var(--wander-dur, 22s) ease-in-out var(--wander-delay, 0s) infinite; }
              .draft-wander-4 { animation: draft-wander-4 var(--wander-dur, 24s) ease-in-out var(--wander-delay, 0s) infinite; }
              .draft-wander-5 { animation: draft-wander-5 var(--wander-dur, 32s) ease-in-out var(--wander-delay, 0s) infinite; }
              .draft-wander-6 { animation: draft-wander-6 var(--wander-dur, 25s) ease-in-out var(--wander-delay, 0s) infinite; }

              /* Firefly Micro-Flutter & Bioluminescent flash (gentle, relaxed hovering) */
              .draft-firefly-flutter {
                will-change: transform, opacity;
                filter: drop-shadow(0 0 3px currentColor);
              }
              .draft-flutter-glow-1 { animation: draft-flutter-glow-1 var(--flutter-dur, 9.2s) ease-in-out var(--flutter-delay, 0s) infinite; }
              .draft-flutter-glow-2 { animation: draft-flutter-glow-2 var(--flutter-dur, 10.4s) ease-in-out var(--flutter-delay, 0s) infinite; }
              .draft-flutter-glow-3 { animation: draft-flutter-glow-3 var(--flutter-dur, 9.6s) ease-in-out var(--flutter-delay, 0s) infinite; }
              .draft-flutter-glow-4 { animation: draft-flutter-glow-4 var(--flutter-dur, 11.0s) ease-in-out var(--flutter-delay, 0s) infinite; }
              .draft-flutter-glow-5 { animation: draft-flutter-glow-5 var(--flutter-dur, 9.0s) ease-in-out var(--flutter-delay, 0s) infinite; }
              .draft-flutter-glow-6 { animation: draft-flutter-glow-6 var(--flutter-dur, 10.0s) ease-in-out var(--flutter-delay, 0s) infinite; }
            `
            }
          `}</style>

          {side === 'left' ? (
            /* =================================================================
               LEFT SIDE: EMERALD & AZURE GLADE
               ================================================================= */
            <>
              <defs>
                {/* Bioluminescent Auras */}
                <radialGradient id={`aura-emerald-${uid}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.8" />
                  <stop offset="45%" stopColor="#34d399" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                </radialGradient>

                <radialGradient id={`aura-blue-${uid}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.75" />
                  <stop offset="50%" stopColor="#38bdf8" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                </radialGradient>

                <radialGradient id={`aura-gold-${uid}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fde047" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#fde047" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#fde047" stopOpacity="0" />
                </radialGradient>

                <radialGradient id={`aura-teal-${uid}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#5eead4" stopOpacity="0.7" />
                  <stop offset="50%" stopColor="#5eead4" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#5eead4" stopOpacity="0" />
                </radialGradient>

                {/* Cap Volumetric Gradients */}
                <radialGradient id={`cap-emerald-${uid}`} cx="44%" cy="24%" r="72%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="26%" stopColor="#6ee7b7" />
                  <stop offset="68%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#064e3b" />
                </radialGradient>

                <radialGradient id={`cap-blue-${uid}`} cx="40%" cy="22%" r="74%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="28%" stopColor="#bae6fd" />
                  <stop offset="66%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#082f49" />
                </radialGradient>

                <radialGradient id={`cap-gold-${uid}`} cx="42%" cy="24%" r="74%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="30%" stopColor="#fef08a" />
                  <stop offset="68%" stopColor="#eab308" />
                  <stop offset="100%" stopColor="#713f12" />
                </radialGradient>

                <radialGradient id={`cap-teal-${uid}`} cx="40%" cy="24%" r="74%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="32%" stopColor="#99f6e4" />
                  <stop offset="68%" stopColor="#14b8a6" />
                  <stop offset="100%" stopColor="#0f4a41" />
                </radialGradient>

                {/* Gills Cavities */}
                <radialGradient id={`gills-emerald-${uid}`} cx="50%" cy="25%" r="65%">
                  <stop offset="0%" stopColor="#064e3b" />
                  <stop offset="60%" stopColor="#032e22" />
                  <stop offset="100%" stopColor="#011711" />
                </radialGradient>

                <radialGradient id={`gills-blue-${uid}`} cx="50%" cy="25%" r="65%">
                  <stop offset="0%" stopColor="#0369a1" />
                  <stop offset="60%" stopColor="#082f49" />
                  <stop offset="100%" stopColor="#021422" />
                </radialGradient>

                <radialGradient id={`gills-gold-${uid}`} cx="50%" cy="25%" r="65%">
                  <stop offset="0%" stopColor="#854d0e" />
                  <stop offset="60%" stopColor="#422006" />
                  <stop offset="100%" stopColor="#1c0c02" />
                </radialGradient>

                {/* Stems */}
                <linearGradient id={`stem-emerald-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f0fdf4" />
                  <stop offset="30%" stopColor="#d1fae5" />
                  <stop offset="70%" stopColor="#6ee7b7" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>

                <linearGradient id={`stem-blue-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f0f9ff" />
                  <stop offset="30%" stopColor="#e0f2fe" />
                  <stop offset="70%" stopColor="#7dd3fc" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>

                <linearGradient id={`stem-gold-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fefce8" />
                  <stop offset="30%" stopColor="#fef08a" />
                  <stop offset="70%" stopColor="#facc15" />
                  <stop offset="100%" stopColor="#ca8a04" />
                </linearGradient>

                <linearGradient id={`stem-teal-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f0fdfa" />
                  <stop offset="30%" stopColor="#ccfbf1" />
                  <stop offset="70%" stopColor="#5eead4" />
                  <stop offset="100%" stopColor="#0f766e" />
                </linearGradient>

                {/* Ground Soil & Mounds with smooth edge fade */}
                <linearGradient id={`ground-back-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0d261b" />
                  <stop offset="45%" stopColor="#071912" />
                  <stop offset="85%" stopColor="#030c08" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#010503" stopOpacity="0" />
                </linearGradient>

                <linearGradient id={`ground-fore-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#143627" />
                  <stop offset="50%" stopColor="#0a1f16" />
                  <stop offset="85%" stopColor="#040e0a" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#020705" stopOpacity="0" />
                </linearGradient>

                <linearGradient id={`contour-fade-left-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1a4732" stopOpacity="0.9" />
                  <stop offset="70%" stopColor="#1a4732" stopOpacity="0.7" />
                  <stop offset="90%" stopColor="#1a4732" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#1a4732" stopOpacity="0" />
                </linearGradient>

                <linearGradient id={`contour-glow-left-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.75" />
                  <stop offset="65%" stopColor="#34d399" stopOpacity="0.5" />
                  <stop offset="88%" stopColor="#34d399" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                </linearGradient>

                {/* Grass & Foliage Gradients */}
                <linearGradient id={`grass-tall-1-${uid}`} x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#064e3b" />
                  <stop offset="50%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#6ee7b7" />
                </linearGradient>

                <linearGradient id={`grass-tall-2-${uid}`} x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#022c22" />
                  <stop offset="55%" stopColor="#047857" />
                  <stop offset="100%" stopColor="#34d399" />
                </linearGradient>

                <linearGradient id={`grass-deep-${uid}`} x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#021f18" />
                  <stop offset="60%" stopColor="#064e3b" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>

                <linearGradient id={`grass-left-lime-${uid}`} x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#064e3b" />
                  <stop offset="50%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#a7f3d0" />
                </linearGradient>

                <linearGradient id={`fern-grad-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#34d399" />
                  <stop offset="45%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#064e3b" />
                </linearGradient>
              </defs>

              {/* LAYER A: BACKGROUND TERRAIN & FOLIAGE (Appears First) */}
              <g className="draft-terrain-layer">
                {/* Deep background mound: levels smoothly to y=260 at x=420 with zero cliff */}
                <path
                  d="M 0,260 L 0,72 Q 85,68 195,115 Q 310,180 390,240 Q 405,255 420,260 Z"
                  fill={`url(#ground-back-${uid})`}
                />

                {/* Tall Distant Fern on Left Edge waving in the wind */}
                <g opacity="0.9" className="draft-fern-frond" style={{ transformOrigin: '4px 155px' }}>
                  <path
                    d="M 4,155 Q 22,85 72,42"
                    stroke="#10b981"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path d="M 10,140 Q 2,130 -2,134 Q 4,142 12,142 Z" fill={`url(#fern-grad-${uid})`} />
                  <path d="M 14,124 Q 4,112 0,118 Q 8,127 17,126 Z" fill={`url(#fern-grad-${uid})`} />
                  <path d="M 20,108 Q 9,95 6,101 Q 14,111 23,110 Z" fill={`url(#fern-grad-${uid})`} />
                  <path d="M 28,92 Q 17,78 15,85 Q 23,95 32,94 Z" fill={`url(#fern-grad-${uid})`} />
                  <path d="M 37,76 Q 27,62 26,69 Q 33,78 41,78 Z" fill={`url(#fern-grad-${uid})`} />
                  <path d="M 48,60 Q 39,48 40,54 Q 46,63 52,62 Z" fill={`url(#fern-grad-${uid})`} />
                  <path d="M 60,48 Q 54,38 56,42 Q 62,49 65,49 Z" fill={`url(#fern-grad-${uid})`} />
                  <path d="M 14,138 Q 26,130 26,136 Q 20,142 15,141 Z" fill={`url(#fern-grad-${uid})`} />
                  <path d="M 19,122 Q 32,112 34,118 Q 26,126 21,125 Z" fill={`url(#fern-grad-${uid})`} />
                  <path d="M 25,106 Q 39,94 42,101 Q 33,110 27,109 Z" fill={`url(#fern-grad-${uid})`} />
                  <path d="M 33,90 Q 48,78 52,85 Q 42,94 36,93 Z" fill={`url(#fern-grad-${uid})`} />
                  <path d="M 43,74 Q 58,62 61,69 Q 52,78 46,77 Z" fill={`url(#fern-grad-${uid})`} />
                  <path d="M 54,58 Q 67,48 70,54 Q 62,62 57,61 Z" fill={`url(#fern-grad-${uid})`} />
                  <path d="M 68,44 Q 78,36 74,42 Q 70,46 68,44 Z" fill="#6ee7b7" />
                </g>

                {/* Fern Fiddlehead nodding in breeze */}
                <path
                  className="draft-fern-fiddlehead"
                  style={{ transformOrigin: '112px 175px' }}
                  d="M 112,175 Q 116,145 122,132 Q 128,120 137,124 Q 142,128 139,135 Q 135,139 131,136 Q 128,132 131,129"
                  stroke="#34d399"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.8"
                />

                {/* Midground forest knoll: slopes gently down to y=260 at x=420 */}
                <path
                  d="M 0,260 L 0,126 Q 95,116 230,170 Q 330,225 390,252 Q 405,258 420,260 Z"
                  fill={`url(#ground-fore-${uid})`}
                />
                <path
                  d="M 0,128 Q 95,118 230,172 Q 330,227 410,258"
                  stroke={`url(#contour-fade-left-${uid})`}
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 8,134 Q 100,126 225,178 Q 320,228 395,255"
                  stroke={`url(#contour-glow-left-${uid})`}
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Gnarled mossy tree root */}
                <path
                  d="M 0,175 Q 38,180 80,212 Q 120,232 170,248"
                  stroke="#27180e"
                  strokeWidth="7.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 2,173 Q 39,178 78,210 Q 118,230 168,246"
                  stroke="#4a301a"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
                <path d="M 28,177 Q 42,172 54,182 Q 44,187 30,183 Z" fill="#2d6a4f" />
                <path d="M 88,214 Q 102,212 114,224 Q 103,227 90,220 Z" fill="#2d6a4f" />

                {/* Natural Wild Grass Clusters */}
                <g>{renderLeftWildGrass(uid)}</g>
              </g>

              {/* LAYER B: MUSHROOMS (Sprout independently after background) */}
              {/* MUSHROOM L2: SLENDER AZURE BELL INKCAP */}
              <g className="draft-shroom draft-shroom-l2">
                <circle cx="42" cy="154" r="62" fill={`url(#aura-blue-${uid})`} />
                <path
                  d="M 19,162 C 20,122 35,112 42,112 C 49,112 64,122 65,162 Q 42,156 19,162 Z"
                  fill={`url(#cap-blue-${uid})`}
                />
                <path d="M 35,118 Q 30,138 25,158" stroke="#e0f2fe" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6" />
                <path d="M 40,114 Q 39,136 36,158" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.8" />
                <path d="M 44,114 Q 45,136 48,158" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.8" />
                <path d="M 49,118 Q 54,138 59,158" stroke="#e0f2fe" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.6" />
                <path
                  d="M 19,162 Q 42,156 65,162 Q 42,168 19,162 Z"
                  fill={`url(#gills-blue-${uid})`}
                />
                <path d="M 26,163 L 40,158 M 32,165 L 41,159 M 58,163 L 44,158 M 52,165 L 43,159" stroke="#38bdf8" strokeWidth="1.2" opacity="0.65" />
                <path
                  d="M 43,248 Q 48,205 36,156 Q 42,152 48,156 Q 51,205 51,248 Z"
                  fill={`url(#stem-blue-${uid})`}
                />
                <path
                  d="M 45,245 Q 49,205 38,158"
                  stroke="#f0f9ff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.85"
                />
                <path
                  d="M 19,162 Q 42,168 65,162 Q 42,165 19,162 Z"
                  fill="#38bdf8"
                  opacity="0.8"
                />
                <path
                  d="M 35,165 Q 42,169 49,165"
                  stroke="#bae6fd"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="19" cy="162" r="1.6" fill="#ffffff" opacity="0.95" />
                <circle cx="29" cy="165" r="1.5" fill="#bae6fd" opacity="0.85" />
                <circle cx="42" cy="167" r="1.8" fill="#ffffff" opacity="0.95" />
                <circle cx="55" cy="165" r="1.5" fill="#bae6fd" opacity="0.85" />
                <circle cx="65" cy="162" r="1.6" fill="#ffffff" opacity="0.95" />
              </g>

              {/* MUSHROOM L1: GRAND EMERALD PARASOL (Hero Center-Left) */}
              <g className="draft-shroom draft-shroom-l1">
                <circle cx="94" cy="130" r="95" fill={`url(#aura-emerald-${uid})`} />
                <path
                  d="M 38,134 C 38,70 150,70 150,134 Q 94,122 38,134 Z"
                  fill={`url(#cap-emerald-${uid})`}
                />
                <path
                  d="M 50,112 C 68,80 120,80 138,112"
                  stroke="#ffffff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.45"
                />
                <circle cx="94" cy="92" r="4.8" fill="#ffffff" opacity="0.95" />
                <circle cx="94" cy="92" r="7.0" fill="#a7f3d0" opacity="0.35" />
                <circle cx="70" cy="106" r="4.0" fill="#ffffff" opacity="0.9" />
                <circle cx="70" cy="106" r="5.8" fill="#6ee7b7" opacity="0.3" />
                <circle cx="118" cy="104" r="3.8" fill="#ffffff" opacity="0.9" />
                <circle cx="118" cy="104" r="5.5" fill="#6ee7b7" opacity="0.3" />
                <circle cx="52" cy="121" r="3.0" fill="#d1fae5" opacity="0.85" />
                <circle cx="82" cy="116" r="2.6" fill="#d1fae5" opacity="0.85" />
                <circle cx="108" cy="118" r="3.2" fill="#d1fae5" opacity="0.85" />
                <circle cx="134" cy="122" r="2.8" fill="#d1fae5" opacity="0.8" />

                <path
                  d="M 38,134 Q 94,122 150,134 Q 94,144 38,134 Z"
                  fill={`url(#gills-emerald-${uid})`}
                />
                <path
                  d="M 46,133 L 84,128 M 54,138 L 86,129 M 66,141 L 88,130 M 80,143 L 90,131
                     M 142,133 L 104,128 M 134,138 L 102,129 M 122,141 L 100,130 M 108,143 L 98,131"
                  stroke="#6ee7b7"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  opacity="0.55"
                />
                <path
                  d="M 85,246 Q 80,188 78,125 Q 94,121 110,125 Q 102,188 103,246 Z"
                  fill={`url(#stem-emerald-${uid})`}
                />
                <path
                  d="M 88,242 Q 83,188 82,127"
                  stroke="#ffffff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.85"
                />
                <path
                  d="M 38,134 Q 94,144 150,134 Q 94,139 38,134 Z"
                  fill="#10b981"
                  opacity="0.85"
                />
                <path
                  d="M 40,134 Q 94,143 148,134"
                  stroke="#6ee7b7"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.9"
                />
                <path
                  d="M 77,141 Q 94,147 111,141 Q 94,144 77,141 Z"
                  fill="#d1fae5"
                  stroke="#10b981"
                  strokeWidth="1.4"
                />
                <path
                  d="M 79,142 Q 94,146 109,142"
                  stroke="#ffffff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.9"
                />
              </g>

              {/* MUSHROOM L3: GOLDEN SUN BONNET */}
              <g className="draft-shroom draft-shroom-l3">
                <circle cx="154" cy="178" r="58" fill={`url(#aura-gold-${uid})`} />
                <path
                  d="M 123,184 C 123,142 185,142 185,184 Q 154,176 123,184 Z"
                  fill={`url(#cap-gold-${uid})`}
                />
                <circle cx="154" cy="156" r="3.4" fill="#ffffff" opacity="0.95" />
                <circle cx="140" cy="166" r="2.6" fill="#fef9c3" opacity="0.85" />
                <circle cx="168" cy="165" r="2.8" fill="#fef9c3" opacity="0.85" />
                <circle cx="147" cy="173" r="2.0" fill="#fef9c3" opacity="0.8" />
                <circle cx="161" cy="173" r="2.2" fill="#fef9c3" opacity="0.8" />

                <path
                  d="M 123,184 Q 154,176 185,184 Q 154,190 123,184 Z"
                  fill={`url(#gills-gold-${uid})`}
                />
                <path
                  d="M 129,183 L 148,179 M 136,186 L 150,180 M 179,183 L 160,179 M 172,186 L 158,180"
                  stroke="#fde047"
                  strokeWidth="1.2"
                  opacity="0.55"
                />
                <path
                  d="M 144,250 Q 141,215 143,177 Q 154,174 165,177 Q 154,215 155,250 Z"
                  fill={`url(#stem-gold-${uid})`}
                />
                <path
                  d="M 146,248 Q 143,215 147,179"
                  stroke="#ffffff"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.85"
                />
                <path
                  d="M 123,184 Q 154,190 185,184 Q 154,186 123,184 Z"
                  fill="#eab308"
                  opacity="0.8"
                />
                <path
                  d="M 144,187 Q 154,192 164,187"
                  stroke="#fef08a"
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />
              </g>

              {/* MUSHROOM L4: SEAFOAM SPORE SPROUT */}
              <g className="draft-shroom draft-shroom-l4">
                <circle cx="226" cy="216" r="40" fill={`url(#aura-teal-${uid})`} />
                <path
                  d="M 209,218 C 209,196 243,196 243,218 Q 226,213 209,218 Z"
                  fill={`url(#cap-teal-${uid})`}
                />
                <path d="M 209,218 Q 226,213 243,218 Q 226,223 209,218 Z" fill="#042f2c" />
                <path
                  d="M 221,254 Q 220,233 222,216 Q 226,214 230,216 Q 229,233 228,254 Z"
                  fill={`url(#stem-teal-${uid})`}
                />
                <path d="M 223,252 L 224,217" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
                <path d="M 209,218 Q 226,223 243,218 Q 226,220 209,218 Z" fill="#14b8a6" />
                <circle cx="226" cy="207" r="2.4" fill="#ffffff" opacity="0.95" />
                <circle cx="218" cy="213" r="1.8" fill="#ccfbf1" opacity="0.85" />
                <circle cx="234" cy="213" r="1.8" fill="#ccfbf1" opacity="0.85" />
              </g>

              {/* LAYER C: FOREGROUND ROOTING GRASS & CLOVERS */}
              <g className="draft-foreground-layer">
                <g opacity="0.95" className="draft-clover-bob" style={{ transformOrigin: '60px 246px' }}>
                  <path d="M 62,246 Q 60,234 58,224" stroke="#10b981" strokeWidth="1.6" fill="none" />
                  <circle cx="53" cy="221" r="4.5" fill="#22c55e" />
                  <circle cx="62" cy="221" r="4.5" fill="#22c55e" />
                  <circle cx="58" cy="215" r="4.5" fill="#4ade80" />
                  <circle cx="58" cy="220" r="1.6" fill="#14532d" />

                  <path d="M 190,250 Q 192,239 194,231" stroke="#10b981" strokeWidth="1.6" fill="none" />
                  <circle cx="189" cy="228" r="4.0" fill="#22c55e" />
                  <circle cx="198" cy="228" r="4.0" fill="#22c55e" />
                  <circle cx="194" cy="222" r="4.0" fill="#4ade80" />
                  <circle cx="194" cy="227" r="1.5" fill="#14532d" />
                </g>

                <path d="M 32,254 Q 38,228 46,224 Q 42,242 38,256 Z" fill="#10b981" className="draft-grass-blade draft-grass-wind-left-tall" style={{ transformOrigin: '35px 255px', animationDuration: '4.3s', animationDelay: '-1.4s' }} />
                <path d="M 42,256 Q 48,232 56,228 Q 51,245 47,256 Z" fill="#34d399" className="draft-grass-blade draft-grass-wind-left-mid" style={{ transformOrigin: '45px 256px', animationDuration: '3.6s', animationDelay: '-2.8s' }} />
                <path d="M 50,256 Q 55,236 64,234 Q 58,246 54,256 Z" fill="#059669" className="draft-grass-blade draft-grass-wind-left-short" style={{ transformOrigin: '53px 256px', animationDuration: '2.9s', animationDelay: '-0.7s' }} />

                <path d="M 75,252 Q 82,224 92,220 Q 88,240 82,254 Z" fill="#10b981" className="draft-grass-blade draft-grass-wind-left-tall" style={{ transformOrigin: '78px 253px', animationDuration: '4.6s', animationDelay: '-3.1s' }} />
                <path d="M 86,254 Q 93,226 104,222 Q 98,244 92,256 Z" fill="#34d399" className="draft-grass-blade draft-grass-wind-left-mid" style={{ transformOrigin: '89px 255px', animationDuration: '3.8s', animationDelay: '-1.9s' }} />
                <path d="M 96,256 Q 102,230 112,226 Q 106,244 100,256 Z" fill="#6ee7b7" className="draft-grass-blade draft-grass-wind-left-mid" style={{ transformOrigin: '98px 256px', animationDuration: '3.5s', animationDelay: '-4.0s' }} />
                <path d="M 104,256 Q 110,234 120,232 Q 114,246 108,256 Z" fill="#047857" className="draft-grass-blade draft-grass-wind-left-short" style={{ transformOrigin: '106px 256px', animationDuration: '3.0s', animationDelay: '-2.2s' }} />

                <path d="M 136,254 Q 143,232 152,228 Q 147,245 142,256 Z" fill="#10b981" className="draft-grass-blade draft-grass-wind-left-mid" style={{ transformOrigin: '139px 255px', animationDuration: '3.7s', animationDelay: '-0.5s' }} />
                <path d="M 147,256 Q 154,230 165,226 Q 158,245 152,256 Z" fill="#34d399" className="draft-grass-blade draft-grass-wind-left-tall" style={{ transformOrigin: '150px 256px', animationDuration: '4.4s', animationDelay: '-2.6s' }} />
                <path d="M 156,256 Q 163,236 172,234 Q 165,247 160,256 Z" fill="#059669" className="draft-grass-blade draft-grass-wind-left-short" style={{ transformOrigin: '158px 256px', animationDuration: '2.8s', animationDelay: '-3.8s' }} />

                <path d="M 213,256 Q 220,236 229,232 Q 224,247 219,258 Z" fill="#10b981" className="draft-grass-blade draft-grass-wind-left-mid" style={{ transformOrigin: '216px 257px', animationDuration: '3.6s', animationDelay: '-1.1s' }} />
                <path d="M 224,258 Q 231,234 242,230 Q 235,247 229,258 Z" fill="#34d399" className="draft-grass-blade draft-grass-wind-left-mid" style={{ transformOrigin: '227px 258px', animationDuration: '3.9s', animationDelay: '-3.4s' }} />
                <path d="M 233,258 Q 242,238 252,236 Q 244,249 238,258 Z" fill="#047857" className="draft-grass-blade draft-grass-wind-left-short" style={{ transformOrigin: '236px 258px', animationDuration: '3.1s', animationDelay: '-0.9s' }} />
                <path d="M 248,260 Q 259,242 272,240 Q 262,253 253,260 Z" fill="#10b981" className="draft-grass-blade draft-grass-wind-left-short" style={{ transformOrigin: '251px 260px', animationDuration: '2.7s', animationDelay: '-2.3s' }} />

                <circle cx="46" cy="224" r="1.6" fill="#a7f3d0" />
                <circle cx="104" cy="222" r="1.8" fill="#ecfdf5" />
                <circle cx="165" cy="226" r="1.6" fill="#fef08a" />
                <circle cx="242" cy="230" r="1.6" fill="#ccfbf1" />
              </g>

              {/* LAYER D: ANIMATED BIOLUMINESCENT FIREFLIES (Compound Non-repeating Flight - Slow Ambient Drift) */}
              <g className="draft-fireflies-layer">
                {/* Firefly L1: Emerald Canopy Roamer */}
                <g className="draft-firefly-wander draft-wander-1" style={{ '--wander-dur': '26.5s', '--wander-delay': '-7.5s' } as React.CSSProperties}>
                  <circle className="draft-firefly-flutter draft-flutter-glow-2" cx="96" cy="70" r="2.2" fill="#6ee7b7" style={{ '--flutter-dur': '8.8s', '--flutter-delay': '-2.6s' } as React.CSSProperties} />
                </g>

                {/* Firefly L2: Azure Inkcap Companion */}
                <g className="draft-firefly-wander draft-wander-2" style={{ '--wander-dur': '29.8s', '--wander-delay': '-13.2s' } as React.CSSProperties}>
                  <circle className="draft-firefly-flutter draft-flutter-glow-1" cx="36" cy="142" r="1.8" fill="#7dd3fc" style={{ '--flutter-dur': '10.2s', '--flutter-delay': '-5.8s' } as React.CSSProperties} />
                </g>

                {/* Firefly L3: Golden Glade Explorer */}
                <g className="draft-firefly-wander draft-wander-4" style={{ '--wander-dur': '23.4s', '--wander-delay': '-4.1s' } as React.CSSProperties}>
                  <circle className="draft-firefly-flutter draft-flutter-glow-6" cx="142" cy="115" r="1.9" fill="#fef08a" style={{ '--flutter-dur': '8.0s', '--flutter-delay': '-1.7s' } as React.CSSProperties} />
                </g>

                {/* Firefly L4: Golden Bonnet Hoverer */}
                <g className="draft-firefly-wander draft-wander-3" style={{ '--wander-dur': '20.6s', '--wander-delay': '-10.4s' } as React.CSSProperties}>
                  <circle className="draft-firefly-flutter draft-flutter-glow-5" cx="178" cy="148" r="1.5" fill="#fde047" style={{ '--flutter-dur': '9.6s', '--flutter-delay': '-6.6s' } as React.CSSProperties} />
                </g>

                {/* Firefly L5: Meadow Grass Skimmer */}
                <g className="draft-firefly-wander draft-wander-6" style={{ '--wander-dur': '25.2s', '--wander-delay': '-16.0s' } as React.CSSProperties}>
                  <circle className="draft-firefly-flutter draft-flutter-glow-4" cx="64" cy="105" r="1.7" fill="#a7f3d0" style={{ '--flutter-dur': '11.2s', '--flutter-delay': '-3.2s' } as React.CSSProperties} />
                </g>

                {/* Firefly L6: Teal Slope Spore */}
                <g className="draft-firefly-wander draft-wander-5" style={{ '--wander-dur': '30.6s', '--wander-delay': '-4.8s' } as React.CSSProperties}>
                  <circle className="draft-firefly-flutter draft-flutter-glow-4" cx="232" cy="182" r="1.5" fill="#5eead4" style={{ '--flutter-dur': '9.9s', '--flutter-delay': '-8.6s' } as React.CSSProperties} />
                </g>

                {/* Firefly L7: High Twilight Floater */}
                <g className="draft-firefly-wander draft-wander-2" style={{ '--wander-dur': '32.4s', '--wander-delay': '-19.5s' } as React.CSSProperties}>
                  <circle className="draft-firefly-flutter draft-flutter-glow-2" cx="118" cy="52" r="1.4" fill="#a7f3d0" style={{ '--flutter-dur': '8.4s', '--flutter-delay': '-0.9s' } as React.CSSProperties} />
                </g>
              </g>
            </>
          ) : (
            /* =================================================================
               RIGHT SIDE: AMETHYST & CORAL GROVE
               ================================================================= */
            <>
              <defs>
                {/* Bioluminescent Auras */}
                <radialGradient id={`aura-amethyst-${uid}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#c084fc" stopOpacity="0.8" />
                  <stop offset="45%" stopColor="#a855f7" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </radialGradient>

                <radialGradient id={`aura-coral-${uid}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fb923c" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#f97316" stopOpacity="0.28" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
                </radialGradient>

                <radialGradient id={`aura-pixie-${uid}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0.75" />
                  <stop offset="50%" stopColor="#14b8a6" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity="0" />
                </radialGradient>

                <radialGradient id={`aura-pin-${uid}`} cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#fde047" stopOpacity="0.75" />
                  <stop offset="50%" stopColor="#eab308" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                </radialGradient>

                {/* Cap Gradients */}
                <radialGradient id={`cap-amethyst-${uid}`} cx="44%" cy="24%" r="72%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="26%" stopColor="#e9d5ff" />
                  <stop offset="65%" stopColor="#9333ea" />
                  <stop offset="100%" stopColor="#3b0764" />
                </radialGradient>

                <radialGradient id={`cap-coral-${uid}`} cx="44%" cy="24%" r="72%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="28%" stopColor="#fed7aa" />
                  <stop offset="66%" stopColor="#ea580c" />
                  <stop offset="100%" stopColor="#7c2d12" />
                </radialGradient>

                <radialGradient id={`cap-pixie-${uid}`} cx="42%" cy="22%" r="74%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="30%" stopColor="#99f6e4" />
                  <stop offset="68%" stopColor="#0d9488" />
                  <stop offset="100%" stopColor="#042f2e" />
                </radialGradient>

                {/* Gills Cavities */}
                <radialGradient id={`gills-amethyst-${uid}`} cx="50%" cy="25%" r="65%">
                  <stop offset="0%" stopColor="#581c87" />
                  <stop offset="60%" stopColor="#2e1065" />
                  <stop offset="100%" stopColor="#140428" />
                </radialGradient>

                {/* Stems */}
                <linearGradient id={`stem-amethyst-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#faf5ff" />
                  <stop offset="30%" stopColor="#e9d5ff" />
                  <stop offset="70%" stopColor="#c084fc" />
                  <stop offset="100%" stopColor="#7e22ce" />
                </linearGradient>

                <linearGradient id={`stem-coral-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#fff7ed" />
                  <stop offset="30%" stopColor="#ffedd5" />
                  <stop offset="70%" stopColor="#fdba74" />
                  <stop offset="100%" stopColor="#ea580c" />
                </linearGradient>

                <linearGradient id={`stem-pixie-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#f0fdfa" />
                  <stop offset="30%" stopColor="#ccfbf1" />
                  <stop offset="70%" stopColor="#5eead4" />
                  <stop offset="100%" stopColor="#0f766e" />
                </linearGradient>

                {/* Ground Soil & Mounds with smooth edge fade toward x=0 */}
                <linearGradient id={`ground-back-r-${uid}`} x1="100%" y1="0%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#1a0f26" />
                  <stop offset="50%" stopColor="#0c1218" />
                  <stop offset="85%" stopColor="#030806" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#010403" stopOpacity="0" />
                </linearGradient>

                <linearGradient id={`ground-fore-r-${uid}`} x1="100%" y1="0%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#241530" />
                  <stop offset="50%" stopColor="#0e1f1a" />
                  <stop offset="85%" stopColor="#040b08" stopOpacity="0.9" />
                  <stop offset="100%" stopColor="#010403" stopOpacity="0" />
                </linearGradient>

                <linearGradient id={`contour-fade-right-${uid}`} x1="100%" y1="0%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#274029" stopOpacity="0.9" />
                  <stop offset="70%" stopColor="#274029" stopOpacity="0.7" />
                  <stop offset="90%" stopColor="#274029" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="#274029" stopOpacity="0" />
                </linearGradient>

                <linearGradient id={`contour-glow-right-${uid}`} x1="100%" y1="0%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#84cc16" stopOpacity="0.75" />
                  <stop offset="65%" stopColor="#84cc16" stopOpacity="0.5" />
                  <stop offset="88%" stopColor="#84cc16" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#84cc16" stopOpacity="0" />
                </linearGradient>

                {/* Ivy & Broad Leaf Gradients */}
                <linearGradient id={`ivy-leaf-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#bef264" />
                  <stop offset="45%" stopColor="#4d7c0f" />
                  <stop offset="100%" stopColor="#1a2e05" />
                </linearGradient>

                {/* Right Grass Blade Gradients */}
                <linearGradient id={`grass-right-tall-${uid}`} x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#14532d" />
                  <stop offset="50%" stopColor="#22c55e" />
                  <stop offset="100%" stopColor="#86efac" />
                </linearGradient>

                <linearGradient id={`grass-right-lime-${uid}`} x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#365314" />
                  <stop offset="50%" stopColor="#84cc16" />
                  <stop offset="100%" stopColor="#bef264" />
                </linearGradient>

                <linearGradient id={`grass-right-shadow-${uid}`} x1="0%" y1="100%" x2="0%" y2="0%">
                  <stop offset="0%" stopColor="#1e1b4b" />
                  <stop offset="50%" stopColor="#166534" />
                  <stop offset="100%" stopColor="#4ade80" />
                </linearGradient>
              </defs>

              {/* LAYER A: BACKGROUND TERRAIN & FOLIAGE (Appears First) */}
              <g className="draft-terrain-layer">
                {/* Deep background hillock: slopes down smoothly to y=260 at x=0 with ZERO vertical cliff */}
                <path
                  d="M 420,260 L 420,68 Q 335,65 225,112 Q 110,180 30,240 Q 15,255 0,260 Z"
                  fill={`url(#ground-back-r-${uid})`}
                />

                {/* Broad Forest Leaves on Far Right rustling in the breeze */}
                <g opacity="0.9" className="draft-ivy-flutter" style={{ transformOrigin: '420px 130px' }}>
                  <path
                    d="M 420,125 Q 375,92 344,106 Q 360,132 405,145 Z"
                    fill={`url(#ivy-leaf-${uid})`}
                  />
                  <path d="M 418,126 Q 378,98 346,107" stroke="#bef264" strokeWidth="1.4" fill="none" opacity="0.7" />
                  <path
                    d="M 412,150 Q 362,118 332,135 Q 350,162 396,172 Z"
                    fill={`url(#ivy-leaf-${uid})`}
                  />
                  <path d="M 410,151 Q 365,125 334,136" stroke="#bef264" strokeWidth="1.4" fill="none" opacity="0.7" />
                </g>

                {/* Creeping Wild Ivy Vine with Lobed Leaves & Tendrils */}
                <g opacity="0.95" className="draft-ivy-flutter" style={{ transformOrigin: '420px 145px' }}>
                  <path
                    d="M 420,145 Q 380,165 335,190 Q 290,212 240,228"
                    stroke="#365314"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M 374,168 Q 366,155 372,148 Q 380,145 380,153 Q 376,158 371,155"
                    stroke="#84cc16"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    fill="none"
                  />
                  <path
                    d="M 280,212 Q 272,200 278,194 Q 286,192 285,200 Q 281,204 276,202"
                    stroke="#84cc16"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                    fill="none"
                  />

                  <path
                    d="M 390,160 C 385,150 371,150 370,160 C 363,162 365,172 373,174 C 380,182 390,176 391,168 Z"
                    fill={`url(#ivy-leaf-${uid})`}
                  />
                  <path
                    d="M 346,180 C 341,170 328,171 327,180 C 320,182 322,192 329,194 C 336,201 346,195 347,188 Z"
                    fill={`url(#ivy-leaf-${uid})`}
                  />
                  <path
                    d="M 298,200 C 293,191 281,192 280,200 C 274,202 276,211 282,213 C 288,219 297,214 298,207 Z"
                    fill={`url(#ivy-leaf-${uid})`}
                  />
                  <path
                    d="M 252,220 C 248,212 237,213 236,220 C 231,222 233,230 238,232 C 243,237 251,233 252,227 Z"
                    fill={`url(#ivy-leaf-${uid})`}
                  />
                </g>

                {/* Midground forest knoll: slopes gently down to y=260 at x=0 with NO vertical cliff */}
                <path
                  d="M 420,260 L 420,122 Q 325,112 190,166 Q 90,225 30,252 Q 15,258 0,260 Z"
                  fill={`url(#ground-fore-r-${uid})`}
                />
                <path
                  d="M 420,124 Q 325,114 190,168 Q 90,227 10,258"
                  stroke={`url(#contour-fade-right-${uid})`}
                  strokeWidth="4"
                  strokeLinecap="round"
                  fill="none"
                />
                <path
                  d="M 412,130 Q 320,122 195,174 Q 100,228 25,255"
                  stroke={`url(#contour-glow-right-${uid})`}
                  strokeWidth="2"
                  strokeLinecap="round"
                  fill="none"
                />

                {/* Ancient Forest Boulder */}
                <path
                  d="M 285,210 Q 315,198 345,208 Q 355,223 342,238 Q 315,246 288,240 Q 278,226 285,210 Z"
                  fill="#1e1b24"
                  stroke="#2e2738"
                  strokeWidth="2"
                />
                <path
                  d="M 288,212 Q 315,200 342,210 Q 335,220 315,218 Q 295,222 288,212 Z"
                  fill="#3f6212"
                />

                {/* Natural Wild Grass Clusters */}
                <g>{renderRightWildGrass(uid)}</g>
              </g>

              {/* LAYER B: MUSHROOMS (Sprout independently after background) */}
              {/* MUSHROOM R4: SLENDER TEAL PIXIE LANTERN */}
              <g className="draft-shroom draft-shroom-r4">
                <circle cx="168" cy="170" r="54" fill={`url(#aura-pixie-${uid})`} />
                <path
                  d="M 146,176 C 148,140 165,130 169,130 C 173,130 190,140 192,176 Q 169,170 146,176 Z"
                  fill={`url(#cap-pixie-${uid})`}
                />
                <path
                  d="M 146,176 Q 169,170 192,176 Q 169,182 146,176 Z"
                  fill="#042f2e"
                />
                <path
                  d="M 183,252 Q 186,210 164,170 Q 170,167 176,170 Q 192,210 189,252 Z"
                  fill={`url(#stem-pixie-${uid})`}
                />
                <path
                  d="M 185,248 Q 187,210 167,172"
                  stroke="#f0fdfa"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.85"
                />
                <path
                  d="M 146,176 Q 169,182 192,176 Q 169,179 146,176 Z"
                  fill="#0d9488"
                />
                <path
                  d="M 162,179 Q 169,183 176,179"
                  stroke="#99f6e4"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  fill="none"
                />
                <circle cx="150" cy="176" r="1.6" fill="#ffffff" />
                <circle cx="160" cy="180" r="1.8" fill="#ccfbf1" />
                <circle cx="169" cy="181" r="2.0" fill="#ffffff" />
                <circle cx="178" cy="180" r="1.8" fill="#ccfbf1" />
                <circle cx="188" cy="176" r="1.6" fill="#ffffff" />
              </g>

              {/* MUSHROOM R2 & R3: TWIN RADIANT CORAL TRUMPETS (Chanterelles) */}
              <g className="draft-shroom draft-shroom-r23">
                <circle cx="256" cy="170" r="78" fill={`url(#aura-coral-${uid})`} />

                {/* Sister Chanterelle R3 */}
                <g>
                  <path
                    d="M 264,192 Q 272,212 274,250 Q 278,252 284,250 Q 284,212 296,192
                       Q 288,196 280,196 Q 272,196 264,192 Z"
                    fill={`url(#cap-coral-${uid})`}
                  />
                  <path d="M 270,195 Q 276,212 277,242" stroke="#fed7aa" strokeWidth="1.2" opacity="0.65" />
                  <path d="M 290,195 Q 284,212 281,242" stroke="#fed7aa" strokeWidth="1.2" opacity="0.65" />
                  <ellipse cx="280" cy="192" rx="16" ry="4.5" fill="#7c2d12" />
                  <ellipse cx="280" cy="191" rx="14" ry="3.5" fill="#ea580c" opacity="0.8" />
                  <path d="M 264,192 Q 280,188 296,192" stroke="#fff7ed" strokeWidth="1.6" fill="none" opacity="0.8" />
                </g>

                {/* Hero Chanterelle R2 */}
                <g>
                  <path
                    d="M 218,162 Q 235,190 240,250 Q 246,253 254,250 Q 256,190 280,162
                       Q 264,168 249,168 Q 234,168 218,162 Z"
                    fill={`url(#cap-coral-${uid})`}
                  />
                  <path
                    d="M 242,246 Q 240,194 229,170"
                    stroke="#fff7ed"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.85"
                  />
                  <path d="M 228,166 Q 238,193 242,238" stroke="#fed7aa" strokeWidth="1.5" opacity="0.75" />
                  <path d="M 249,168 L 247,242" stroke="#ffffff" strokeWidth="1.6" opacity="0.8" />
                  <path d="M 270,166 Q 259,193 252,238" stroke="#fed7aa" strokeWidth="1.5" opacity="0.75" />

                  <ellipse cx="249" cy="162" rx="31" ry="8" fill="#7c2d12" />
                  <ellipse cx="249" cy="161" rx="27" ry="6.5" fill="#ea580c" opacity="0.85" />
                  <path
                    d="M 218,162 Q 228,157 240,163 Q 253,156 266,162 Q 274,158 280,162"
                    stroke="#ffffff"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    fill="none"
                    opacity="0.95"
                  />
                </g>
              </g>

              {/* MUSHROOM R1: GIANT MYSTIC AMETHYST TOADSTOOL */}
              <g className="draft-shroom draft-shroom-r1">
                <circle cx="326" cy="126" r="98" fill={`url(#aura-amethyst-${uid})`} />
                <path
                  d="M 268,132 C 268,66 384,66 384,132 Q 326,120 268,132 Z"
                  fill={`url(#cap-amethyst-${uid})`}
                />
                <path
                  d="M 280,108 C 300,76 354,76 372,108"
                  stroke="#ffffff"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.45"
                />

                <circle cx="326" cy="88" r="5.0" fill="#ffffff" opacity="0.95" />
                <circle cx="326" cy="88" r="7.5" fill="#e9d5ff" opacity="0.35" />
                <circle cx="298" cy="103" r="4.0" fill="#ffffff" opacity="0.9" />
                <circle cx="298" cy="103" r="6.0" fill="#c084fc" opacity="0.3" />
                <circle cx="354" cy="101" r="4.2" fill="#ffffff" opacity="0.9" />
                <circle cx="354" cy="101" r="6.2" fill="#c084fc" opacity="0.3" />
                <circle cx="280" cy="120" r="3.2" fill="#e9d5ff" opacity="0.85" />
                <circle cx="314" cy="114" r="3.0" fill="#e9d5ff" opacity="0.85" />
                <circle cx="340" cy="116" r="3.4" fill="#e9d5ff" opacity="0.85" />
                <circle cx="370" cy="120" r="3.2" fill="#e9d5ff" opacity="0.8" />

                <path
                  d="M 268,132 Q 326,120 384,132 Q 326,142 268,132 Z"
                  fill={`url(#gills-amethyst-${uid})`}
                />
                <path
                  d="M 276,131 L 318,126 M 286,136 L 320,127 M 298,139 L 322,128 M 312,141 L 324,129
                     M 376,131 L 334,126 M 366,136 L 332,127 M 354,139 L 330,128 M 340,141 L 328,129"
                  stroke="#c084fc"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  opacity="0.6"
                />
                <path
                  d="M 315,248 Q 320,188 308,124 Q 326,120 342,124 Q 341,188 333,248 Z"
                  fill={`url(#stem-amethyst-${uid})`}
                />
                <path
                  d="M 322,244 Q 326,188 315,126"
                  stroke="#ffffff"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.85"
                />
                <path
                  d="M 268,132 Q 326,142 384,132 Q 326,136 268,132 Z"
                  fill="#9333ea"
                  opacity="0.85"
                />
                <path
                  d="M 270,132 Q 326,140 382,132"
                  stroke="#c084fc"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.9"
                />
                <path
                  d="M 305,140 Q 326,150 347,140 Q 326,144 305,140 Z"
                  fill="#e9d5ff"
                  stroke="#9333ea"
                  strokeWidth="1.4"
                  opacity="0.85"
                />
                <path
                  d="M 307,141 Q 326,148 345,141"
                  stroke="#ffffff"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  fill="none"
                  opacity="0.9"
                />
              </g>

              {/* MUSHROOM R5 & R6: GOLDEN FAIRY PINS */}
              <g className="draft-shroom draft-shroom-r56">
                <circle cx="384" cy="224" r="26" fill={`url(#aura-pin-${uid})`} />
                <path d="M 386,246 L 384,226" stroke="#fef08a" strokeWidth="2" strokeLinecap="round" />
                <circle cx="384" cy="224" r="3.5" fill="#ffffff" />
                <circle cx="384" cy="224" r="2.4" fill="#facc15" />

                <path d="M 395,248 L 393,231" stroke="#fef08a" strokeWidth="1.6" strokeLinecap="round" />
                <circle cx="393" cy="229" r="2.8" fill="#ffffff" />
                <circle cx="393" cy="229" r="2.0" fill="#facc15" />
              </g>

              {/* LAYER C: FOREGROUND ROOTING GRASS & STAR MOSS */}
              <g className="draft-foreground-layer">
                <g opacity="0.9" className="draft-clover-bob" style={{ transformOrigin: '368px 238px' }}>
                  <path d="M 358,238 Q 368,232 378,238 Q 368,242 358,238 Z" fill="#65a30d" />
                  <path d="M 268,244 Q 278,238 288,244 Q 278,248 268,244 Z" fill="#65a30d" />
                </g>

                <path d="M 172,256 Q 178,234 187,230 Q 182,246 178,258 Z" fill="#22c55e" className="draft-grass-blade draft-grass-wind-right-mid" style={{ transformOrigin: '175px 257px', animationDuration: '3.6s', animationDelay: '-1.4s' }} />
                <path d="M 182,258 Q 189,230 198,226 Q 192,244 187,258 Z" fill="#86efac" className="draft-grass-blade draft-grass-wind-right-tall" style={{ transformOrigin: '185px 258px', animationDuration: '4.4s', animationDelay: '-2.8s' }} />
                <path d="M 191,258 Q 197,236 206,234 Q 199,246 195,258 Z" fill="#15803d" className="draft-grass-blade draft-grass-wind-right-short" style={{ transformOrigin: '193px 258px', animationDuration: '2.9s', animationDelay: '-0.7s' }} />

                <path d="M 231,256 Q 238,232 248,228 Q 243,244 238,258 Z" fill="#22c55e" className="draft-grass-blade draft-grass-wind-right-mid" style={{ transformOrigin: '234px 257px', animationDuration: '3.8s', animationDelay: '-3.2s' }} />
                <path d="M 242,258 Q 249,228 260,224 Q 253,244 247,258 Z" fill="#84cc16" className="draft-grass-blade draft-grass-wind-right-tall" style={{ transformOrigin: '245px 258px', animationDuration: '4.5s', animationDelay: '-1.8s' }} />
                <path d="M 253,258 Q 259,234 270,230 Q 263,246 258,258 Z" fill="#bef264" className="draft-grass-blade draft-grass-wind-right-mid" style={{ transformOrigin: '256px 258px', animationDuration: '3.7s', animationDelay: '-4.1s' }} />
                <path d="M 265,258 Q 272,230 282,226 Q 275,244 270,258 Z" fill="#22c55e" className="draft-grass-blade draft-grass-wind-right-mid" style={{ transformOrigin: '268px 258px', animationDuration: '3.5s', animationDelay: '-2.1s' }} />
                <path d="M 276,258 Q 283,234 292,232 Q 285,246 281,258 Z" fill="#15803d" className="draft-grass-blade draft-grass-wind-right-short" style={{ transformOrigin: '279px 258px', animationDuration: '3.0s', animationDelay: '-0.9s' }} />

                <path d="M 303,254 Q 312,226 322,222 Q 317,240 310,256 Z" fill="#22c55e" className="draft-grass-blade draft-grass-wind-right-tall" style={{ transformOrigin: '307px 255px', animationDuration: '4.6s', animationDelay: '-3.5s' }} />
                <path d="M 315,256 Q 323,224 334,220 Q 327,242 321,258 Z" fill="#86efac" className="draft-grass-blade draft-grass-wind-right-tall" style={{ transformOrigin: '318px 257px', animationDuration: '4.3s', animationDelay: '-1.2s' }} />
                <path d="M 325,258 Q 332,230 342,226 Q 335,244 330,258 Z" fill="#bef264" className="draft-grass-blade draft-grass-wind-right-mid" style={{ transformOrigin: '328px 258px', animationDuration: '3.8s', animationDelay: '-2.6s' }} />
                <path d="M 335,258 Q 342,234 350,232 Q 343,246 339,258 Z" fill="#166534" className="draft-grass-blade draft-grass-wind-right-short" style={{ transformOrigin: '337px 258px', animationDuration: '2.8s', animationDelay: '-0.4s' }} />

                <path d="M 374,256 Q 380,238 389,234 Q 384,246 380,258 Z" fill="#84cc16" className="draft-grass-blade draft-grass-wind-right-mid" style={{ transformOrigin: '377px 257px', animationDuration: '3.6s', animationDelay: '-3.0s' }} />
                <path d="M 384,258 Q 391,236 400,232 Q 395,246 390,258 Z" fill="#bef264" className="draft-grass-blade draft-grass-wind-right-mid" style={{ transformOrigin: '387px 258px', animationDuration: '3.9s', animationDelay: '-1.5s' }} />
                <path d="M 396,258 Q 403,240 412,238 Q 405,250 401,260 Z" fill="#15803d" className="draft-grass-blade draft-grass-wind-right-short" style={{ transformOrigin: '399px 259px', animationDuration: '2.7s', animationDelay: '-2.3s' }} />

                <circle cx="187" cy="230" r="1.6" fill="#ccfbf1" />
                <circle cx="260" cy="224" r="1.8" fill="#fed7aa" />
                <circle cx="334" cy="220" r="1.8" fill="#f5f3ff" />
                <circle cx="400" cy="232" r="1.5" fill="#fef08a" />
              </g>

              {/* LAYER D: ANIMATED BIOLUMINESCENT FIREFLIES (Compound Non-repeating Flight - Slow Ambient Drift) */}
              <g className="draft-fireflies-layer">
                {/* Firefly R1: Amethyst Crown Floater */}
                <g className="draft-firefly-wander draft-wander-1" style={{ '--wander-dur': '27.6s', '--wander-delay': '-11.0s' } as React.CSSProperties}>
                  <circle className="draft-firefly-flutter draft-flutter-glow-3" cx="326" cy="64" r="2.2" fill="#e9d5ff" style={{ '--flutter-dur': '9.5s', '--flutter-delay': '-3.9s' } as React.CSSProperties} />
                </g>

                {/* Firefly R2: Coral Trumpet Dancer */}
                <g className="draft-firefly-wander draft-wander-4" style={{ '--wander-dur': '24.2s', '--wander-delay': '-5.2s' } as React.CSSProperties}>
                  <circle className="draft-firefly-flutter draft-flutter-glow-5" cx="248" cy="135" r="2.0" fill="#fed7aa" style={{ '--flutter-dur': '8.6s', '--flutter-delay': '-7.1s' } as React.CSSProperties} />
                </g>

                {/* Firefly R3: Sister Chanterelle Sprite */}
                <g className="draft-firefly-wander draft-wander-3" style={{ '--wander-dur': '21.2s', '--wander-delay': '-14.8s' } as React.CSSProperties}>
                  <circle className="draft-firefly-flutter draft-flutter-glow-1" cx="278" cy="156" r="1.6" fill="#fb923c" style={{ '--flutter-dur': '8.2s', '--flutter-delay': '-1.9s' } as React.CSSProperties} />
                </g>

                {/* Firefly R4: Teal Pixie Companion */}
                <g className="draft-firefly-wander draft-wander-2" style={{ '--wander-dur': '28.8s', '--wander-delay': '-9.3s' } as React.CSSProperties}>
                  <circle className="draft-firefly-flutter draft-flutter-glow-4" cx="172" cy="148" r="1.6" fill="#5eead4" style={{ '--flutter-dur': '10.5s', '--flutter-delay': '-4.5s' } as React.CSSProperties} />
                </g>

                {/* Firefly R5: Ivy Frond Rustler */}
                <g className="draft-firefly-wander draft-wander-5" style={{ '--wander-dur': '31.2s', '--wander-delay': '-17.2s' } as React.CSSProperties}>
                  <circle className="draft-firefly-flutter draft-flutter-glow-3" cx="362" cy="82" r="1.8" fill="#c084fc" style={{ '--flutter-dur': '9.0s', '--flutter-delay': '-3.0s' } as React.CSSProperties} />
                </g>

                {/* Firefly R6: Fairy Pin Sparkler */}
                <g className="draft-firefly-wander draft-wander-6" style={{ '--wander-dur': '22.8s', '--wander-delay': '-7.9s' } as React.CSSProperties}>
                  <circle className="draft-firefly-flutter draft-flutter-glow-6" cx="386" cy="196" r="1.5" fill="#fef08a" style={{ '--flutter-dur': '11.6s', '--flutter-delay': '-9.7s' } as React.CSSProperties} />
                </g>

                {/* Firefly R7: Twilight Glade Drifter */}
                <g className="draft-firefly-wander draft-wander-1" style={{ '--wander-dur': '32.8s', '--wander-delay': '-23.6s' } as React.CSSProperties}>
                  <circle className="draft-firefly-flutter draft-flutter-glow-2" cx="290" cy="50" r="1.5" fill="#e9d5ff" style={{ '--flutter-dur': '10.1s', '--flutter-delay': '-1.3s' } as React.CSSProperties} />
                </g>
              </g>
            </>
          )}
        </svg>
      </div>
    </div>
  );
};

export default GlowingMushrooms;
