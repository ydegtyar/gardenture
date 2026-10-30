import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const OUT_DIR = path.resolve('public/assets/powerups');
fs.mkdirSync(OUT_DIR, { recursive: true });

const POWERUP_IDS = [
  'aegis-orb',
  'frost-flask',
  'ember-guard',
  'clover-magnet',
  'sundial-watch',
  'heal-20hp',
];

const SIZES = [256, 128, 64, 32];

const HTML_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<style>
  body { margin: 0; background: transparent; }
</style>
</head>
<body>
<script>
// Helper drawing utilities for hand-painted mystic garden fantasy icons (1024x1024 master)
function createCanvas(size = 1024) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return c;
}

function drawSparkle(ctx, x, y, r, color, coreColor = '#FFFFFF', rot = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rot);
  const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 1.4);
  grad.addColorStop(0, color + 'CC');
  grad.addColorStop(0.5, color + '44');
  grad.addColorStop(1, color + '00');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.4, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    const rad = i % 2 === 0 ? r : r * 0.24;
    const px = Math.cos(a) * rad;
    const py = Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = coreColor;
  ctx.fill();
  ctx.lineWidth = Math.max(3, r * 0.08);
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.restore();
}

function drawSoftBackdropAura(ctx, cx, cy, r, accentHex, innerHex) {
  ctx.save();
  // Pure luminous magical aura fading smoothly to 0% alpha at the edge
  const outerGlow = ctx.createRadialGradient(cx, cy, r * 0.18, cx, cy, r * 0.98);
  outerGlow.addColorStop(0, innerHex + '66');
  outerGlow.addColorStop(0.55, accentHex + '44');
  outerGlow.addColorStop(0.82, accentHex + '18');
  outerGlow.addColorStop(1, accentHex + '00');
  ctx.fillStyle = outerGlow;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.98, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// 1. AEGIS ORB (teal #4FD1B5, shield absorb, 20s)
function renderAegisOrb(ctx) {
  const cx = 512, cy = 512;
  drawSoftBackdropAura(ctx, cx, cy, 460, '#4FD1B5', '#A8E6CF');

  // Thin dashed orbiting ring of light (tilted 3/4 perspective ellipse)
  ctx.save();
  ctx.translate(cx, cy + 10);
  ctx.rotate(-0.28);
  ctx.beginPath();
  ctx.ellipse(0, 0, 425, 168, 0, 0, Math.PI * 2);
  ctx.strokeStyle = '#241a2b';
  ctx.lineWidth = 34;
  ctx.setLineDash([56, 36]);
  ctx.lineCap = 'round';
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(0, 0, 425, 168, 0, 0, Math.PI * 2);
  ctx.strokeStyle = '#4FD1B5';
  ctx.lineWidth = 18;
  ctx.setLineDash([56, 36]);
  ctx.lineCap = 'round';
  ctx.shadowColor = '#4FD1B5';
  ctx.shadowBlur = 28;
  ctx.stroke();

  ctx.beginPath();
  ctx.ellipse(0, 0, 425, 168, 0, 0, Math.PI * 2);
  ctx.strokeStyle = '#E6FFFA';
  ctx.lineWidth = 7;
  ctx.setLineDash([56, 36]);
  ctx.stroke();
  ctx.restore();

  // Crystalline Orb Body
  const orbR = 315;
  ctx.save();
  // Bold dark plum silhouette outline
  ctx.beginPath();
  ctx.arc(cx, cy, orbR + 18, 0, Math.PI * 2);
  ctx.fillStyle = '#241a2b';
  ctx.fill();

  // Orb inner painted gradient
  const orbGrad = ctx.createRadialGradient(cx - 95, cy - 110, 30, cx, cy, orbR);
  orbGrad.addColorStop(0, '#B8FFF0');
  orbGrad.addColorStop(0.32, '#4FD1B5');
  orbGrad.addColorStop(0.7, '#0F766E');
  orbGrad.addColorStop(0.92, '#114247');
  orbGrad.addColorStop(1, '#1E162B');
  ctx.beginPath();
  ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
  ctx.fillStyle = orbGrad;
  ctx.fill();

  // Crystalline facet polygons inside orb
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
  ctx.clip();
  ctx.strokeStyle = 'rgba(230,255,250,0.22)';
  ctx.lineWidth = 5;
  const facets = [
    [[cx - 260, cy - 80], [cx - 110, cy - 270], [cx + 90, cy - 250], [cx, cy - 90]],
    [[cx + 90, cy - 250], [cx + 270, cy - 90], [cx + 180, cy + 120], [cx, cy - 90]],
    [[cx - 260, cy - 80], [cx - 190, cy + 170], [cx, cy + 250], [cx, cy - 90]],
  ];
  for (const poly of facets) {
    ctx.beginPath();
    poly.forEach(([x, y], idx) => idx === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y));
    ctx.closePath();
    ctx.stroke();
  }

  // Bottom teal rim-light crescent inside orb
  const rimGrad = ctx.createRadialGradient(cx, cy - 55, orbR * 0.72, cx, cy, orbR);
  rimGrad.addColorStop(0, 'rgba(79,209,181,0)');
  rimGrad.addColorStop(0.8, 'rgba(79,209,181,0.35)');
  rimGrad.addColorStop(1, 'rgba(184,255,240,0.85)');
  ctx.fillStyle = rimGrad;
  ctx.beginPath();
  ctx.arc(cx, cy, orbR, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Glowing Emerald-and-Gold Heater Shield Emblem at Core
  ctx.save();
  ctx.shadowColor = '#FBBF24';
  ctx.shadowBlur = 38;
  const drawHeaterPath = (scale) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 195 * scale);
    ctx.quadraticCurveTo(cx + 100 * scale, cy - 190 * scale, cx + 165 * scale, cy - 145 * scale);
    ctx.lineTo(cx + 155 * scale, cy - 10 * scale);
    ctx.quadraticCurveTo(cx + 140 * scale, cy + 135 * scale, cx, cy + 215 * scale);
    ctx.quadraticCurveTo(cx - 140 * scale, cy + 135 * scale, cx - 155 * scale, cy - 10 * scale);
    ctx.lineTo(cx - 165 * scale, cy - 145 * scale);
    ctx.quadraticCurveTo(cx - 100 * scale, cy - 190 * scale, cx, cy - 195 * scale);
    ctx.closePath();
  };

  // Dark plum shield outline
  drawHeaterPath(1.08);
  ctx.fillStyle = '#241a2b';
  ctx.fill();

  // Warm gold metallic shield frame
  const goldGrad = ctx.createLinearGradient(cx - 160, cy - 190, cx + 160, cy + 210);
  goldGrad.addColorStop(0, '#FFFBEB');
  goldGrad.addColorStop(0.28, '#FDE047');
  goldGrad.addColorStop(0.65, '#F59E0B');
  goldGrad.addColorStop(1, '#B45309');
  drawHeaterPath(0.98);
  ctx.fillStyle = goldGrad;
  ctx.fill();

  // Inner emerald shield face
  const emGrad = ctx.createLinearGradient(cx, cy - 150, cx, cy + 170);
  emGrad.addColorStop(0, '#6EE7B7');
  emGrad.addColorStop(0.45, '#10B981');
  emGrad.addColorStop(1, '#065F46');
  drawHeaterPath(0.76);
  ctx.fillStyle = emGrad;
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#064E3B';
  ctx.stroke();

  // Gold heater shield central chevron & vertical rib
  ctx.beginPath();
  ctx.moveTo(cx, cy - 135);
  ctx.lineTo(cx, cy + 145);
  ctx.moveTo(cx - 88, cy - 10);
  ctx.lineTo(cx, cy - 75);
  ctx.lineTo(cx + 88, cy - 10);
  ctx.lineWidth = 22;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#FEF08A';
  ctx.stroke();
  ctx.restore();

  // Front glass orb specular highlights & foreground orbiting arc
  ctx.save();
  ctx.translate(cx - 115, cy - 125);
  ctx.rotate(-0.62);
  const specGrad = ctx.createLinearGradient(0, -55, 0, 55);
  specGrad.addColorStop(0, 'rgba(255,255,255,0.92)');
  specGrad.addColorStop(1, 'rgba(255,255,255,0.08)');
  ctx.fillStyle = specGrad;
  ctx.beginPath();
  ctx.ellipse(0, 0, 96, 46, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(115, 22, 20, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.fill();
  ctx.restore();

  // Floating rune sparks
  drawSparkle(ctx, 210, 235, 38, '#4FD1B5', '#FFFBEB', 0.2);
  drawSparkle(ctx, 825, 250, 32, '#FDE047', '#FFFFFF', -0.3);
  drawSparkle(ctx, 810, 770, 36, '#4FD1B5', '#E6FFFA', 0.15);
  drawSparkle(ctx, 195, 745, 28, '#FDE047', '#FFFFFF', 0.4);
  ctx.restore();
}

// 2. FROST FLASK (ice blue #6FA8FF, freeze enemies, 3.5s)
function renderFrostFlask(ctx) {
  const cx = 512, cy = 545;
  drawSoftBackdropAura(ctx, 512, 512, 460, '#6FA8FF', '#E0F2FE');

  // Cold mist curling from the cork at the top
  ctx.save();
  const mistPaths = [
    [[512, 165], [440, 110], [560, 75], [495, 35]],
    [[545, 175], [645, 130], [590, 75], [665, 45]],
    [[475, 180], [375, 140], [420, 85], [355, 55]],
  ];
  for (const pts of mistPaths) {
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    ctx.bezierCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1], pts[3][0], pts[3][1]);
    ctx.strokeStyle = 'rgba(186, 230, 253, 0.55)';
    ctx.lineWidth = 28;
    ctx.lineCap = 'round';
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 12;
    ctx.stroke();
  }
  ctx.restore();

  // Cork stopper
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(452, 155);
  ctx.lineTo(572, 155);
  ctx.lineTo(556, 250);
  ctx.lineTo(468, 250);
  ctx.closePath();
  ctx.lineWidth = 34;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#241a2b';
  ctx.stroke();
  const corkGrad = ctx.createLinearGradient(452, 155, 572, 250);
  corkGrad.addColorStop(0, '#F59E0B');
  corkGrad.addColorStop(0.5, '#D97706');
  corkGrad.addColorStop(1, '#78350F');
  ctx.fillStyle = corkGrad;
  ctx.fill();
  ctx.restore();

  // Flask neck + rim
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(432, 222, 160, 44, 22);
  ctx.rect(454, 256, 116, 85);
  ctx.lineWidth = 34;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#241a2b';
  ctx.stroke();
  const neckGrad = ctx.createLinearGradient(432, 222, 592, 330);
  neckGrad.addColorStop(0, '#E0F2FE');
  neckGrad.addColorStop(0.5, '#93C5FD');
  neckGrad.addColorStop(1, '#3B82F6');
  ctx.fillStyle = neckGrad;
  ctx.fill();
  ctx.restore();

  // Round-bottomed alchemist flask body
  const bodyR = 290;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy + 40, bodyR + 18, 0, Math.PI * 2);
  ctx.fillStyle = '#241a2b';
  ctx.fill();

  // Glass outer shell
  const glassGrad = ctx.createRadialGradient(cx - 90, cy - 50, 30, cx, cy + 40, bodyR);
  glassGrad.addColorStop(0, '#EFF6FF');
  glassGrad.addColorStop(0.25, '#93C5FD');
  glassGrad.addColorStop(0.65, '#3B82F6');
  glassGrad.addColorStop(0.9, '#1D4ED8');
  glassGrad.addColorStop(1, '#1E1B4B');
  ctx.beginPath();
  ctx.arc(cx, cy + 40, bodyR, 0, Math.PI * 2);
  ctx.fillStyle = glassGrad;
  ctx.fill();

  // Swirling glowing ice-blue liquid inside
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy + 40, bodyR - 22, 0, Math.PI * 2);
  ctx.clip();

  const liqGrad = ctx.createLinearGradient(cx, cy - 160, cx, cy + 320);
  liqGrad.addColorStop(0, '#BAE6FD');
  liqGrad.addColorStop(0.35, '#6FA8FF');
  liqGrad.addColorStop(0.75, '#2563EB');
  liqGrad.addColorStop(1, '#1E1B4B');
  ctx.beginPath();
  ctx.moveTo(cx - 320, cy - 35);
  ctx.bezierCurveTo(cx - 140, cy - 95, cx + 140, cy + 25, cx + 320, cy - 35);
  ctx.lineTo(cx + 320, cy + 360);
  ctx.lineTo(cx - 320, cy + 360);
  ctx.closePath();
  ctx.fillStyle = liqGrad;
  ctx.fill();

  // Swirling internal vortex ribbons
  ctx.strokeStyle = 'rgba(224, 242, 254, 0.55)';
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(cx, cy + 75, 165, 0.2, Math.PI * 1.35);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy + 75, 105, Math.PI * 0.8, Math.PI * 2.1);
  ctx.stroke();

  // Suspended snowflake crystals inside liquid
  const drawSnowflake = (sx, sy, sr) => {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = Math.max(6, sr * 0.14);
    ctx.lineCap = 'round';
    ctx.shadowColor = '#BAE6FD';
    ctx.shadowBlur = 18;
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((i * Math.PI) / 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -sr);
      ctx.moveTo(0, -sr * 0.58);
      ctx.lineTo(-sr * 0.28, -sr * 0.8);
      ctx.moveTo(0, -sr * 0.58);
      ctx.lineTo(sr * 0.28, -sr * 0.8);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  };
  drawSnowflake(cx, cy + 65, 92);
  drawSnowflake(cx - 135, cy + 135, 48);
  drawSnowflake(cx + 135, cy + 25, 52);

  // Frost rime creeping up the bottom/sides of the glass
  ctx.fillStyle = 'rgba(224, 242, 254, 0.72)';
  const rimeSpikes = [
    [cx - 265, cy + 160, cx - 210, cy + 45, cx - 175, cy + 195],
    [cx + 265, cy + 160, cx + 210, cy + 35, cx + 170, cy + 195],
    [cx - 140, cy + 290, cx - 95, cy + 185, cx - 45, cy + 310],
    [cx + 140, cy + 290, cx + 95, cy + 185, cx + 45, cy + 310],
  ];
  for (const [x1, y1, x2, y2, x3, y3] of rimeSpikes) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x3, y3);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Golden ring-clasp on the neck
  ctx.save();
  ctx.beginPath();
  ctx.roundRect(436, 285, 152, 34, 16);
  ctx.lineWidth = 22;
  ctx.strokeStyle = '#241a2b';
  ctx.stroke();
  const claspGrad = ctx.createLinearGradient(436, 285, 588, 319);
  claspGrad.addColorStop(0, '#FEF08A');
  claspGrad.addColorStop(0.5, '#F59E0B');
  claspGrad.addColorStop(1, '#B45309');
  ctx.fillStyle = claspGrad;
  ctx.fill();

  // Small golden ring hanging on right of clasp
  ctx.beginPath();
  ctx.arc(602, 305, 28, 0, Math.PI * 2);
  ctx.lineWidth = 22;
  ctx.strokeStyle = '#241a2b';
  ctx.stroke();
  ctx.lineWidth = 11;
  ctx.strokeStyle = '#FDE047';
  ctx.stroke();
  ctx.restore();

  // Specular highlight on glass flask
  ctx.save();
  ctx.translate(cx - 125, cy - 35);
  ctx.rotate(-0.55);
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 88, 38, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  drawSparkle(ctx, 215, 315, 36, '#6FA8FF', '#FFFFFF', 0.1);
  drawSparkle(ctx, 815, 365, 32, '#BAE6FD', '#FFFFFF', -0.2);
  drawSparkle(ctx, 225, 765, 30, '#6FA8FF', '#FFFFFF', 0.3);
  ctx.restore();
}

// 3. EMBER GUARD (orange #FF8A3D, flame barrier and fire cone, 3s)
function renderEmberGuard(ctx) {
  const cx = 512, cy = 548;
  drawSoftBackdropAura(ctx, 512, 512, 460, '#FF8A3D', '#FDE047');

  // Living fire licking up from the top edge
  ctx.save();
  const drawFlameCrown = (scale, color, yOff = 0) => {
    ctx.beginPath();
    ctx.moveTo(cx - 245 * scale, cy - 160 + yOff);
    ctx.quadraticCurveTo(cx - 270 * scale, cy - 310 * scale + yOff, cx - 155 * scale, cy - 395 * scale + yOff);
    ctx.quadraticCurveTo(cx - 115 * scale, cy - 300 * scale + yOff, cx - 85 * scale, cy - 265 * scale + yOff);
    ctx.quadraticCurveTo(cx - 60 * scale, cy - 420 * scale + yOff, cx, cy - 495 * scale + yOff);
    ctx.quadraticCurveTo(cx + 65 * scale, cy - 410 * scale + yOff, cx + 85 * scale, cy - 265 * scale + yOff);
    ctx.quadraticCurveTo(cx + 125 * scale, cy - 315 * scale + yOff, cx + 165 * scale, cy - 390 * scale + yOff);
    ctx.quadraticCurveTo(cx + 265 * scale, cy - 300 * scale + yOff, cx + 245 * scale, cy - 160 + yOff);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
  };
  ctx.lineWidth = 36;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#241a2b';
  drawFlameCrown(1.04, '#241a2b', -4);
  ctx.stroke();
  drawFlameCrown(1.0, '#EA580C', 0);
  drawFlameCrown(0.82, '#FB923C', 18);
  drawFlameCrown(0.62, '#FDE047', 38);
  ctx.restore();

  // Hexagonal bronze shield-badge
  const drawHexShield = (r) => {
    ctx.beginPath();
    const pts = [
      [cx, cy - r * 1.06],
      [cx + r * 0.94, cy - r * 0.52],
      [cx + r * 0.88, cy + r * 0.52],
      [cx, cy + r * 1.12],
      [cx - r * 0.88, cy + r * 0.52],
      [cx - r * 0.94, cy - r * 0.52],
    ];
    pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
    ctx.closePath();
  };

  ctx.save();
  // Dark plum outer silhouette
  drawHexShield(332);
  ctx.fillStyle = '#241a2b';
  ctx.lineWidth = 28;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#241a2b';
  ctx.fill();
  ctx.stroke();

  // Bronze metallic rim with molten orange glow on the metal edges
  const bronzeGrad = ctx.createLinearGradient(cx - 300, cy - 320, cx + 300, cy + 340);
  bronzeGrad.addColorStop(0, '#FDBA74');
  bronzeGrad.addColorStop(0.25, '#EA580C');
  bronzeGrad.addColorStop(0.55, '#9A3412');
  bronzeGrad.addColorStop(0.85, '#B45309');
  bronzeGrad.addColorStop(1, '#FF8A3D');
  drawHexShield(310);
  ctx.fillStyle = bronzeGrad;
  ctx.fill();

  // Molten edge bevel highlight
  drawHexShield(296);
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#FED7AA';
  ctx.stroke();

  // Inner dark crimson/charcoal recessed shield plate
  const innerGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 255);
  innerGrad.addColorStop(0, '#991B1B');
  innerGrad.addColorStop(0.65, '#450A0A');
  innerGrad.addColorStop(1, '#1C090B');
  drawHexShield(250);
  ctx.fillStyle = innerGrad;
  ctx.fill();
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#241a2b';
  ctx.stroke();

  // Corner bronze rivets
  const rivetR = 268;
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 2 + (i * Math.PI) / 3;
    const rx = cx + Math.cos(a) * rivetR * (i % 3 === 0 ? 0.98 : 0.88);
    const ry = cy + Math.sin(a) * rivetR * (i % 3 === 0 ? 1.02 : 0.92);
    ctx.beginPath();
    ctx.arc(rx, ry, 14, 0, Math.PI * 2);
    ctx.fillStyle = '#FDE047';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#241a2b';
    ctx.stroke();
  }

  // Bright orange-yellow flame emblem at center with hot white-yellow core
  const drawCoreFlame = (s, col, yShift = 0) => {
    ctx.beginPath();
    ctx.moveTo(cx, cy - 185 * s + yShift);
    ctx.bezierCurveTo(cx + 135 * s, cy - 70 * s + yShift, cx + 165 * s, cy + 95 * s + yShift, cx, cy + 175 * s + yShift);
    ctx.bezierCurveTo(cx - 165 * s, cy + 95 * s + yShift, cx - 135 * s, cy - 70 * s + yShift, cx, cy - 185 * s + yShift);
    ctx.closePath();
    ctx.fillStyle = col;
    ctx.fill();
  };
  ctx.save();
  ctx.shadowColor = '#FF8A3D';
  ctx.shadowBlur = 36;
  drawCoreFlame(1.08, '#241a2b', 0);
  drawCoreFlame(1.0, '#F97316', 0);
  drawCoreFlame(0.76, '#FACC15', 18);
  drawCoreFlame(0.48, '#FEF9C3', 38);
  ctx.restore();

  // Floating glowing embers
  const embers = [
    [185, 310, 18], [835, 285, 22], [175, 690, 15], [840, 705, 19], [315, 145, 16], [710, 150, 16]
  ];
  for (const [ex, ey, er] of embers) {
    drawSparkle(ctx, ex, ey, er * 1.4, '#FF8A3D', '#FEF08A', 0.2);
  }
  ctx.restore();
}

// 4. CLOVER MAGNET (pink and blue horseshoe #FF5C8A, pull gems and drops, 0.5s)
function renderCloverMagnet(ctx) {
  const cx = 512, cy = 512;
  drawSoftBackdropAura(ctx, cx, cy, 460, '#FF5C8A', '#60A5FA');

  // Curved magnetic field lines & sparkle trails of gems/coins pulled toward poles
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 92, 138, 0.55)';
  ctx.lineWidth = 10;
  ctx.setLineDash([22, 18]);
  ctx.beginPath();
  ctx.arc(cx, 250, 195, Math.PI * 1.1, Math.PI * 1.9);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(96, 165, 250, 0.65)';
  ctx.beginPath();
  ctx.arc(cx, 230, 260, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
  ctx.restore();

  // Classic U-shaped horseshoe magnet (tilted slightly for dynamic 3/4 view)
  ctx.save();
  ctx.translate(cx, cy + 40);
  ctx.rotate(-0.12);

  const outerR = 285;
  const innerR = 135;
  const legTopY = -235;

  const traceHorseshoe = () => {
    ctx.beginPath();
    ctx.moveTo(-outerR, legTopY);
    ctx.lineTo(-outerR, 20);
    ctx.arc(0, 20, outerR, Math.PI, 0, true);
    ctx.lineTo(outerR, legTopY);
    ctx.lineTo(innerR, legTopY);
    ctx.lineTo(innerR, 20);
    ctx.arc(0, 20, innerR, 0, Math.PI, false);
    ctx.lineTo(-innerR, legTopY);
    ctx.closePath();
  };

  // Bold dark plum silhouette
  traceHorseshoe();
  ctx.lineWidth = 42;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#241a2b';
  ctx.stroke();

  // Red-pink glossy enamel body
  const magGrad = ctx.createLinearGradient(-outerR, -180, outerR, 300);
  magGrad.addColorStop(0, '#FF85A9');
  magGrad.addColorStop(0.35, '#FF5C8A');
  magGrad.addColorStop(0.75, '#E11D48');
  magGrad.addColorStop(1, '#881337');
  ctx.fillStyle = magGrad;
  ctx.fill();

  // Clip inside horseshoe for blue tips, silver pole caps, and glossy rim light
  ctx.save();
  traceHorseshoe();
  ctx.clip();

  // Blue tips on upper poles
  const blueGrad = ctx.createLinearGradient(-outerR, legTopY, outerR, -60);
  blueGrad.addColorStop(0, '#60A5FA');
  blueGrad.addColorStop(0.5, '#2563EB');
  blueGrad.addColorStop(1, '#1D4ED8');
  ctx.fillStyle = blueGrad;
  ctx.fillRect(-outerR - 20, legTopY - 20, (outerR + 20) * 2, 165);

  // Silver pole caps at the very top of the poles
  const silverGrad = ctx.createLinearGradient(-outerR, legTopY, outerR, legTopY + 65);
  silverGrad.addColorStop(0, '#F8FAFC');
  silverGrad.addColorStop(0.5, '#CBD5E1');
  silverGrad.addColorStop(1, '#64748B');
  ctx.fillStyle = silverGrad;
  ctx.fillRect(-outerR - 20, legTopY - 20, (outerR + 20) * 2, 62);

  // Divider lines on poles
  ctx.strokeStyle = '#241a2b';
  ctx.lineWidth = 14;
  ctx.beginPath();
  ctx.moveTo(-outerR - 10, legTopY + 42);
  ctx.lineTo(outerR + 10, legTopY + 42);
  ctx.moveTo(-outerR - 10, legTopY + 145);
  ctx.lineTo(outerR + 10, legTopY + 145);
  ctx.stroke();

  // Glossy white enamel highlight curve along horseshoe
  ctx.beginPath();
  ctx.arc(0, 20, (outerR + innerR) * 0.5 + 28, Math.PI * 0.15, Math.PI * 0.85, false);
  ctx.strokeStyle = 'rgba(255,255,255,0.42)';
  ctx.lineWidth = 22;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.restore();

  // Re-stroke inner/outer border for crisp silhouette
  traceHorseshoe();
  ctx.lineWidth = 16;
  ctx.strokeStyle = '#241a2b';
  ctx.stroke();

  // Four-leaf clover engraved on the bottom curve
  ctx.save();
  ctx.translate(0, 228);
  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 2 + Math.PI / 4);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.bezierCurveTo(-36, -28, -42, -74, 0, -56);
    ctx.bezierCurveTo(42, -74, 36, -28, 0, 0);
    ctx.closePath();
    ctx.lineWidth = 12;
    ctx.strokeStyle = '#241a2b';
    ctx.stroke();
    const leafGrad = ctx.createLinearGradient(0, -70, 0, 0);
    leafGrad.addColorStop(0, '#A7F3D0');
    leafGrad.addColorStop(0.5, '#34D399');
    leafGrad.addColorStop(1, '#059669');
    ctx.fillStyle = leafGrad;
    ctx.fill();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fillStyle = '#FDE047';
  ctx.fill();
  ctx.restore();

  ctx.restore(); // end horseshoe transform

  // Floating gold coins & gems being pulled toward poles
  const drawCoin = (x, y, r) => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#241a2b';
    ctx.stroke();
    ctx.fillStyle = '#FACC15';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, r * 0.65, 0, Math.PI * 2);
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.restore();
  };
  const drawGem = (x, y, r) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(0.35);
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.8, 0);
    ctx.lineTo(0, r);
    ctx.lineTo(-r * 0.8, 0);
    ctx.closePath();
    ctx.lineWidth = 14;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#241a2b';
    ctx.stroke();
    ctx.fillStyle = '#A8E6CF';
    ctx.fill();
    ctx.restore();
  };
  drawCoin(405, 165, 36);
  drawGem(605, 150, 42);
  drawCoin(515, 235, 28);
  drawSparkle(ctx, 265, 195, 34, '#FF5C8A', '#FFFFFF', 0.15);
  drawSparkle(ctx, 765, 210, 34, '#60A5FA', '#FFFFFF', -0.2);
}

// 5. SUNDIAL WATCH (lavender & gold #B9A6FF, slow enemies 60%, 4s)
function renderSundialWatch(ctx) {
  const cx = 512, cy = 560;
  drawSoftBackdropAura(ctx, 512, 512, 460, '#B9A6FF', '#FDE68A');

  // Delicate antique brass chain curling at the top + crown bow
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(cx + 45, 145);
  ctx.bezierCurveTo(cx + 195, 70, cx + 310, 145, cx + 260, 235);
  ctx.lineWidth = 28;
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#241a2b';
  ctx.stroke();
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#FBBF24';
  ctx.setLineDash([20, 14]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Watch crown bow ring & stem
  ctx.beginPath();
  ctx.arc(cx, 165, 58, 0, Math.PI * 2);
  ctx.lineWidth = 34;
  ctx.strokeStyle = '#241a2b';
  ctx.stroke();
  ctx.lineWidth = 18;
  ctx.strokeStyle = '#FDE047';
  ctx.stroke();

  ctx.beginPath();
  ctx.roundRect(cx - 42, 200, 84, 58, 16);
  ctx.lineWidth = 28;
  ctx.strokeStyle = '#241a2b';
  ctx.stroke();
  ctx.fillStyle = '#D97706';
  ctx.fill();
  ctx.restore();

  // Ornate antique brass pocket watch body
  const outerR = 320;
  const faceR = 252;
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, outerR + 20, 0, Math.PI * 2);
  ctx.fillStyle = '#241a2b';
  ctx.fill();

  const brassGrad = ctx.createLinearGradient(cx - outerR, cy - outerR, cx + outerR, cy + outerR);
  brassGrad.addColorStop(0, '#FEF08A');
  brassGrad.addColorStop(0.3, '#F59E0B');
  brassGrad.addColorStop(0.7, '#B45309');
  brassGrad.addColorStop(1, '#78350F');
  ctx.beginPath();
  ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
  ctx.fillStyle = brassGrad;
  ctx.fill();

  // Inner brass bezel ring
  ctx.beginPath();
  ctx.arc(cx, cy, faceR + 22, 0, Math.PI * 2);
  ctx.strokeStyle = '#FEF9C3';
  ctx.lineWidth = 10;
  ctx.stroke();

  // Etched sundial face with lavender-purple time-magic glow
  const faceGrad = ctx.createRadialGradient(cx, cy, 20, cx, cy, faceR);
  faceGrad.addColorStop(0, '#F3E8FF');
  faceGrad.addColorStop(0.45, '#B9A6FF');
  faceGrad.addColorStop(0.8, '#5B21B6');
  faceGrad.addColorStop(1, '#2E1065');
  ctx.beginPath();
  ctx.arc(cx, cy, faceR, 0, Math.PI * 2);
  ctx.fillStyle = faceGrad;
  ctx.fill();
  ctx.lineWidth = 14;
  ctx.strokeStyle = '#241a2b';
  ctx.stroke();

  // Etched sundial radial ticks & concentric rings
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = 'rgba(254, 240, 138, 0.72)';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(0, 0, 185, 0, Math.PI * 2);
  ctx.stroke();
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const r1 = i % 3 === 0 ? 170 : 192;
    const r2 = 225;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r1, Math.sin(a) * r1);
    ctx.lineTo(Math.cos(a) * r2, Math.sin(a) * r2);
    ctx.lineWidth = i % 3 === 0 ? 12 : 7;
    ctx.strokeStyle = i % 3 === 0 ? '#FEF08A' : '#DDD6FE';
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  // Faint swirling lavender clock-hand trails
  ctx.beginPath();
  ctx.arc(0, 0, 138, -Math.PI * 0.75, Math.PI * 0.45);
  ctx.strokeStyle = 'rgba(233, 213, 255, 0.78)';
  ctx.lineWidth = 18;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Sundial triangular gnomon & ornate hands at center
  ctx.beginPath();
  ctx.moveTo(0, 18);
  ctx.lineTo(-26, 18);
  ctx.lineTo(0, -165);
  ctx.lineTo(68, -68);
  ctx.closePath();
  ctx.lineWidth = 16;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#241a2b';
  ctx.stroke();
  const gnomonGrad = ctx.createLinearGradient(-26, -165, 68, 18);
  gnomonGrad.addColorStop(0, '#FFFBEB');
  gnomonGrad.addColorStop(0.5, '#FACC15');
  gnomonGrad.addColorStop(1, '#B45309');
  ctx.fillStyle = gnomonGrad;
  ctx.fill();

  // Second hand pointing right-down
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(135, 72);
  ctx.lineWidth = 20;
  ctx.strokeStyle = '#241a2b';
  ctx.stroke();
  ctx.lineWidth = 10;
  ctx.strokeStyle = '#FDE047';
  ctx.stroke();

  // Center jewel cap
  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.fillStyle = '#241a2b';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fillStyle = '#E9D5FF';
  ctx.fill();
  ctx.restore();

  // Glass crystal cover specular reflection
  ctx.save();
  ctx.translate(cx - 95, cy - 105);
  ctx.rotate(-0.6);
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.beginPath();
  ctx.ellipse(0, 0, 92, 42, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Floating hourglass sand particles & time sparkles
  drawSparkle(ctx, 180, 315, 36, '#B9A6FF', '#FFFFFF', 0.2);
  drawSparkle(ctx, 845, 350, 32, '#FDE047', '#FFFFFF', -0.25);
  drawSparkle(ctx, 195, 780, 30, '#B9A6FF', '#FFFFFF', 0.1);
  drawSparkle(ctx, 825, 795, 34, '#B9A6FF', '#FFFFFF', 0.35);
  ctx.restore();
}

// 6. HEAL +20HP (emerald green #2ECC8F, +20 HP over 4 pulses, 1.05s)
function renderHeal20Hp(ctx) {
  const cx = 512, cy = 512;
  drawSoftBackdropAura(ctx, cx, cy, 470, '#2ECC8F', '#A7F3D0');

  // 4 concentric healing aura pulse rings fading outward
  ctx.save();
  const rings = [
    { r: 435, alpha: 0.28, w: 12 },
    { r: 375, alpha: 0.45, w: 15 },
    { r: 315, alpha: 0.65, w: 18 },
    { r: 255, alpha: 0.85, w: 22 },
  ];
  for (const ring of rings) {
    ctx.beginPath();
    ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
    ctx.strokeStyle = \`rgba(46, 204, 143, \${ring.alpha})\`;
    ctx.lineWidth = ring.w;
    ctx.stroke();
  }

  // Soft circular healing aura disc behind the cross
  const auraGrad = ctx.createRadialGradient(cx, cy, 40, cx, cy, 285);
  auraGrad.addColorStop(0, '#D1FAE5');
  auraGrad.addColorStop(0.55, '#2ECC8F');
  auraGrad.addColorStop(0.9, '#065F46');
  auraGrad.addColorStop(1, '#241a2b');
  ctx.beginPath();
  ctx.arc(cx, cy, 275, 0, Math.PI * 2);
  ctx.fillStyle = auraGrad;
  ctx.fill();
  ctx.lineWidth = 22;
  ctx.strokeStyle = '#241a2b';
  ctx.stroke();
  ctx.restore();

  // Glowing rounded-square emerald medical cross in bright white and green
  const traceRoundedCross = (armHalf, lenHalf, r) => {
    ctx.beginPath();
    ctx.moveTo(cx - armHalf + r, cy - lenHalf);
    ctx.lineTo(cx + armHalf - r, cy - lenHalf);
    ctx.quadraticCurveTo(cx + armHalf, cy - lenHalf, cx + armHalf, cy - lenHalf + r);
    ctx.lineTo(cx + armHalf, cy - armHalf);
    ctx.lineTo(cx + lenHalf - r, cy - armHalf);
    ctx.quadraticCurveTo(cx + lenHalf, cy - armHalf, cx + lenHalf, cy - armHalf + r);
    ctx.lineTo(cx + lenHalf, cy + armHalf - r);
    ctx.quadraticCurveTo(cx + lenHalf, cy + armHalf, cx + lenHalf - r, cy + armHalf);
    ctx.lineTo(cx + armHalf, cy + armHalf);
    ctx.lineTo(cx + armHalf, cy + lenHalf - r);
    ctx.quadraticCurveTo(cx + armHalf, cy + lenHalf, cx + armHalf - r, cy + lenHalf);
    ctx.lineTo(cx - armHalf + r, cy + lenHalf);
    ctx.quadraticCurveTo(cx - armHalf, cy + lenHalf, cx - armHalf, cy + lenHalf - r);
    ctx.lineTo(cx - armHalf, cy + armHalf);
    ctx.lineTo(cx - lenHalf + r, cy + armHalf);
    ctx.quadraticCurveTo(cx - lenHalf, cy + armHalf, cx - lenHalf, cy + armHalf - r);
    ctx.lineTo(cx - lenHalf, cy - armHalf + r);
    ctx.quadraticCurveTo(cx - lenHalf, cy - armHalf, cx - lenHalf + r, cy - armHalf);
    ctx.lineTo(cx - armHalf, cy - armHalf);
    ctx.lineTo(cx - armHalf, cy - lenHalf + r);
    ctx.quadraticCurveTo(cx - armHalf, cy - lenHalf, cx - armHalf + r, cy - lenHalf);
    ctx.closePath();
  };

  ctx.save();
  // Outer dark plum silhouette of the cross
  traceRoundedCross(118, 295, 42);
  ctx.fillStyle = '#241a2b';
  ctx.lineWidth = 32;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#241a2b';
  ctx.fill();
  ctx.stroke();

  // Outer bright white & mint bevel frame
  const bevelGrad = ctx.createLinearGradient(cx - 280, cy - 280, cx + 280, cy + 280);
  bevelGrad.addColorStop(0, '#FFFFFF');
  bevelGrad.addColorStop(0.5, '#D1FAE5');
  bevelGrad.addColorStop(1, '#6EE7B7');
  traceRoundedCross(108, 282, 36);
  ctx.fillStyle = bevelGrad;
  ctx.fill();

  // Inner glossy gem-like emerald cross
  const gemGrad = ctx.createLinearGradient(cx - 220, cy - 240, cx + 220, cy + 240);
  gemGrad.addColorStop(0, '#6EE7B7');
  gemGrad.addColorStop(0.35, '#2ECC8F');
  gemGrad.addColorStop(0.75, '#059669');
  gemGrad.addColorStop(1, '#064E3B');
  traceRoundedCross(82, 246, 28);
  ctx.fillStyle = gemGrad;
  ctx.fill();
  ctx.lineWidth = 8;
  ctx.strokeStyle = '#047857';
  ctx.stroke();

  // Glossy gem facet highlight at top-left of cross
  ctx.beginPath();
  ctx.roundRect(cx - 64, cy - 224, 128, 72, 20);
  ctx.fillStyle = 'rgba(255,255,255,0.68)';
  ctx.fill();
  ctx.restore();

  // Rising tiny green leaf sparkles
  const drawLeafSpark = (lx, ly, scale, rot) => {
    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.moveTo(0, -36);
    ctx.bezierCurveTo(32, -20, 32, 20, 0, 36);
    ctx.bezierCurveTo(-32, 20, -32, -20, 0, -36);
    ctx.closePath();
    ctx.lineWidth = 10;
    ctx.strokeStyle = '#241a2b';
    ctx.stroke();
    ctx.fillStyle = '#6EE7B7';
    ctx.fill();
    ctx.restore();
  };
  drawLeafSpark(225, 255, 1.0, -0.45);
  drawLeafSpark(795, 240, 0.95, 0.45);
  drawLeafSpark(215, 755, 0.85, -0.35);
  drawLeafSpark(805, 745, 0.9, 0.4);
  drawSparkle(ctx, 320, 165, 32, '#2ECC8F', '#FFFFFF', 0.15);
  drawSparkle(ctx, 710, 175, 32, '#2ECC8F', '#FFFFFF', -0.2);
}

window.renderAllPowerUps = function() {
  const renderers = {
    'aegis-orb': renderAegisOrb,
    'frost-flask': renderFrostFlask,
    'ember-guard': renderEmberGuard,
    'clover-magnet': renderCloverMagnet,
    'sundial-watch': renderSundialWatch,
    'heal-20hp': renderHeal20Hp,
  };
  const sizes = [256, 128, 64, 32];
  const output = { icons: {}, atlasPng: '', atlasJson: null };

  const masterCanvases = {};
  for (const [id, fn] of Object.entries(renderers)) {
    const master = createCanvas(1024);
    const mctx = master.getContext('2d');
    fn(mctx);
    masterCanvases[id] = master;
    output.icons[id] = {};

    for (const sz of sizes) {
      const c = createCanvas(sz);
      const ctx = c.getContext('2d');
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(master, 0, 0, sz, sz);
      output.icons[id][sz] = {
        png: c.toDataURL('image/png'),
        webp: c.toDataURL('image/webp', 0.94),
      };
    }
  }

  const sheetW = 768;
  const sheetH = 192;
  const sheetCanvas = createCanvas(sheetW);
  sheetCanvas.height = sheetH;
  const sctx = sheetCanvas.getContext('2d');
  sctx.imageSmoothingEnabled = true;
  sctx.imageSmoothingQuality = 'high';

  const frames = {};
  const ids = Object.keys(renderers);
  ids.forEach((id, idx) => {
    const master = masterCanvases[id];
    const x128 = idx * 128;
    const y128 = 0;
    sctx.drawImage(master, x128, y128, 128, 128);
    frames[\`\${id}@128.png\`] = {
      frame: { x: x128, y: y128, w: 128, h: 128 },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 128, h: 128 },
      sourceSize: { w: 128, h: 128 },
    };

    const x64 = idx * 64;
    const y64 = 128;
    sctx.drawImage(master, x64, y64, 64, 64);
    frames[\`\${id}@64.png\`] = {
      frame: { x: x64, y: y64, w: 64, h: 64 },
      rotated: false,
      trimmed: false,
      spriteSourceSize: { x: 0, y: 0, w: 64, h: 64 },
      sourceSize: { w: 64, h: 64 },
    };
  });

  output.atlasPng = sheetCanvas.toDataURL('image/png');
  output.atlasJson = {
    frames,
    meta: {
      app: 'gardenture-powerup-packer',
      version: '1.0',
      image: 'powerups.png',
      format: 'RGBA8888',
      size: { w: sheetW, h: sheetH },
      scale: '1',
    },
  };

  return output;
};
</script>
</body>
</html>`;

const tmpHtml = '/tmp/powerup-gen.html';
fs.writeFileSync(tmpHtml, HTML_TEMPLATE);

function writeDataUrl(filePath, dataUrl) {
  const base64 = dataUrl.split(',')[1];
  fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
}

execFileSync('npx', ['playwright-cli', 'open', 'http://localhost:3000'], { stdio: 'inherit' });
const evalOut = execFileSync(
  'npx',
  [
    'playwright-cli',
    'run-code',
    `async (page) => {
      const html = ${JSON.stringify(HTML_TEMPLATE)};
      await page.setContent(html);
      const res = await page.evaluate(() => window.renderAllPowerUps());
      return JSON.stringify(res);
    }`,
  ],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
);
execFileSync('npx', ['playwright-cli', 'close'], { stdio: 'inherit' });

// Extract JSON string from playwright-cli output
const match = evalOut.match(/### Result\s+([\s\S]+?)(?:\n###|\s*$)/);
const rawStr = match ? match[1].trim() : evalOut.trim();
const parsedStr = rawStr.startsWith('"') ? JSON.parse(rawStr) : rawStr;
const result = typeof parsedStr === 'string' ? JSON.parse(parsedStr) : parsedStr;

for (const id of POWERUP_IDS) {
  for (const sz of SIZES) {
    const { png, webp } = result.icons[id][sz];
    writeDataUrl(path.join(OUT_DIR, `${id}@${sz}.png`), png);
    writeDataUrl(path.join(OUT_DIR, `${id}@${sz}.webp`), webp);
  }
  writeDataUrl(path.join(OUT_DIR, `${id}.png`), result.icons[id][256].png);
  writeDataUrl(path.join(OUT_DIR, `${id}.webp`), result.icons[id][256].webp);
}

writeDataUrl(path.join(OUT_DIR, 'powerups.png'), result.atlasPng);
fs.writeFileSync(
  path.join(OUT_DIR, 'powerups.json'),
  JSON.stringify(result.atlasJson, null, 2)
);
console.log('Successfully generated all power-up icons and spritesheet in', OUT_DIR);
