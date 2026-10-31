import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const OUT_DIR = path.resolve('public/assets/ornaments');
const MANIFEST_PATH = path.resolve('src/ui/ornate/ornaments.manifest.json');
fs.mkdirSync(OUT_DIR, { recursive: true });
fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });

export const ORNAMENT_MANIFEST_DATA = {
  version: '1.0.0',
  totalBudgetKb: 400,
  palette: {
    goldStops: ['#fff1b0', '#e8b84e', '#9a6418', '#d9a441'],
    parchment: ['#fdf8eb', '#f5ebd4', '#e8d8b7'],
    forestGreens: ['#7be6a8', '#32a869', '#144d30'],
    nightPlum: '#120b18',
  },
  assets: {
    cornerVineGold: {
      id: 'cornerVineGold',
      name: 'Gold Vine Corner Filigree',
      webpPath: '/assets/ornaments/corner-vine-gold.webp',
      pngPath: '/assets/ornaments/corner-vine-gold.png',
      width: 160,
      height: 160,
      sliceInsets: { top: 28, right: 28, bottom: 28, left: 28 },
      anchor: { x: 0.12, y: 0.12 },
      prompt:
        'Ornate fantasy game UI corner frame ornament, thick polished antique gold filigree scroll wrapped with lush emerald ivy leaves and a small glowing gem socket, top-left corner piece, hand-painted AAA fantasy RPG UI art style, transparent background',
      seed: 4091821,
    },
    edgeVineHorizontal: {
      id: 'edgeVineHorizontal',
      name: 'Horizontal Gold Vine Strip',
      webpPath: '/assets/ornaments/edge-vine-horizontal.webp',
      pngPath: '/assets/ornaments/edge-vine-horizontal.png',
      width: 320,
      height: 56,
      sliceInsets: { top: 12, right: 40, bottom: 12, left: 40 },
      anchor: { x: 0.5, y: 0.5 },
      prompt:
        'Seamless horizontal fantasy UI frame ornament strip, polished gold rod entwined with delicate emerald creeping vines and tiny leaves, hand-painted game UI art, transparent background',
      seed: 4091822,
    },
    ivyClusterGreen: {
      id: 'ivyClusterGreen',
      name: 'Emerald Ivy Leaf Cluster',
      webpPath: '/assets/ornaments/ivy-cluster-green.webp',
      pngPath: '/assets/ornaments/ivy-cluster-green.png',
      width: 220,
      height: 84,
      sliceInsets: { top: 10, right: 24, bottom: 10, left: 24 },
      anchor: { x: 0.85, y: 0.2 },
      prompt:
        'Lush emerald ivy leaves and curling tendrils growing over the top-right edge of a fantasy game button, vibrant cel-painted highlights, dark forest outline, transparent background',
      seed: 4091823,
    },
    thornVineGold: {
      id: 'thornVineGold',
      name: 'Gilded Briar Thorn Vine Strip',
      webpPath: '/assets/ornaments/thorn-vine-gold.webp',
      pngPath: '/assets/ornaments/thorn-vine-gold.png',
      width: 320,
      height: 76,
      sliceInsets: { top: 14, right: 32, bottom: 14, left: 32 },
      anchor: { x: 0.5, y: 0.5 },
      prompt:
        'Twisting golden-amber and bronze thorny briar vine garlands stretched across top and bottom edges of a luxury RPG button, specular metallic highlights, transparent background',
      seed: 4091824,
    },
    laurelWreathGold: {
      id: 'laurelWreathGold',
      name: 'Polished Gold Laurel Border',
      webpPath: '/assets/ornaments/laurel-wreath-gold.webp',
      pngPath: '/assets/ornaments/laurel-wreath-gold.png',
      width: 280,
      height: 76,
      sliceInsets: { top: 12, right: 36, bottom: 12, left: 36 },
      anchor: { x: 0.5, y: 0.5 },
      prompt:
        'Symmetrical polished antique gold laurel branches framing a dark teal fantasy button border, crisp metallic leaf facets, transparent background',
      seed: 4091825,
    },
    wingedHeartEmblem: {
      id: 'wingedHeartEmblem',
      name: 'Winged Herbal Heart Emblem',
      webpPath: '/assets/ornaments/winged-heart-emblem.webp',
      pngPath: '/assets/ornaments/winged-heart-emblem.png',
      width: 96,
      height: 96,
      sliceInsets: { top: 8, right: 8, bottom: 8, left: 8 },
      anchor: { x: 0.5, y: 0.5 },
      prompt:
        'Glowing mint-emerald crystal heart flanked by delicate golden-feathered wings, restorative herbal blessing icon, AAA mobile RPG quality, transparent background',
      seed: 4091826,
    },
    crystalClusterCorner: {
      id: 'crystalClusterCorner',
      name: 'Faceted Sky Crystal Cluster',
      webpPath: '/assets/ornaments/crystal-cluster-corner.webp',
      pngPath: '/assets/ornaments/crystal-cluster-corner.png',
      width: 96,
      height: 96,
      sliceInsets: { top: 8, right: 8, bottom: 8, left: 8 },
      anchor: { x: 0.8, y: 0.2 },
      prompt:
        'Faceted ice-blue and mint-white crystal cluster perched on the top-right corner of a golden game button, crisp cel-shaded specular facets, transparent background',
      seed: 4091827,
    },
    cardBackSigil: {
      id: 'cardBackSigil',
      name: 'Botanical Tarot Card Back Mandala',
      webpPath: '/assets/ornaments/card-back-sigil.webp',
      pngPath: '/assets/ornaments/card-back-sigil.png',
      width: 360,
      height: 520,
      sliceInsets: { top: 24, right: 24, bottom: 24, left: 24 },
      anchor: { x: 0.5, y: 0.5 },
      prompt:
        'Luxury botanical tarot card back illustration: intricate gold-foil vine mandala, crescent moons, and glowing emerald-gold star sigil embossed on deep plum and dark forest velvet',
      seed: 4091828,
    },
    backdropMushrooms: {
      id: 'backdropMushrooms',
      name: 'Enchanted Bioluminescent Forest Corner Accents',
      webpPath: '/assets/ornaments/backdrop-mushrooms.webp',
      pngPath: '/assets/ornaments/backdrop-mushrooms.png',
      width: 420,
      height: 260,
      sliceInsets: { top: 0, right: 0, bottom: 0, left: 0 },
      anchor: { x: 0.0, y: 1.0 },
      prompt:
        'Enchanted mystic garden night foreground corner: bioluminescent teal and golden mushrooms, dark mossy roots, enchanted fern fronds and glowing spores, transparent background',
      seed: 4091829,
    },
  },
};

const HTML_RENDERER = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;background:transparent;">
<script>
function makeCanvas(w, h) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
}

function createGoldGrad(ctx, x0, y0, x1, y1) {
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0.0, '#fff1b0');
  g.addColorStop(0.35, '#e8b84e');
  g.addColorStop(0.72, '#9a6418');
  g.addColorStop(1.0, '#d9a441');
  return g;
}

function drawLeaf(ctx, x, y, angle, scale, fillStart = '#7be6a8', fillEnd = '#1e7a46') {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.scale(scale, scale);

  const g = ctx.createLinearGradient(-12, -18, 12, 18);
  g.addColorStop(0, fillStart);
  g.addColorStop(0.55, '#34b371');
  g.addColorStop(1, fillEnd);

  ctx.beginPath();
  ctx.moveTo(0, -20);
  ctx.bezierCurveTo(14, -12, 16, 8, 0, 20);
  ctx.bezierCurveTo(-16, 8, -14, -12, 0, -20);
  ctx.closePath();
  ctx.fillStyle = g;
  ctx.fill();
  ctx.lineWidth = 2.4;
  ctx.strokeStyle = '#12291c';
  ctx.stroke();

  // Midrib vein
  ctx.beginPath();
  ctx.moveTo(0, -15);
  ctx.quadraticCurveTo(2, 0, 0, 16);
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = '#d9fbee';
  ctx.stroke();
  ctx.restore();
}

function renderCornerVineGold() {
  const c = makeCanvas(160, 160);
  const ctx = c.getContext('2d');
  const gold = createGoldGrad(ctx, 0, 0, 140, 140);

  // Outer dark contour shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.65)';
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 3;

  // L-shaped ornate gold corner bracket with scroll curls
  ctx.beginPath();
  ctx.moveTo(12, 132);
  ctx.bezierCurveTo(8, 72, 10, 34, 16, 16);
  ctx.bezierCurveTo(34, 10, 72, 8, 132, 12);
  ctx.bezierCurveTo(116, 24, 62, 24, 34, 34);
  ctx.bezierCurveTo(24, 62, 24, 116, 12, 132);
  ctx.closePath();
  ctx.fillStyle = gold;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#2a1a08';
  ctx.stroke();

  // Inner filigree spiral curl
  ctx.beginPath();
  ctx.moveTo(28, 86);
  ctx.bezierCurveTo(44, 52, 52, 44, 86, 28);
  ctx.lineWidth = 4.5;
  ctx.strokeStyle = gold;
  ctx.stroke();
  ctx.restore();

  // Wrapping emerald ivy leaves
  drawLeaf(ctx, 48, 22, 0.9, 0.85);
  drawLeaf(ctx, 84, 18, 1.25, 0.72);
  drawLeaf(ctx, 22, 48, 0.35, 0.85);
  drawLeaf(ctx, 18, 84, 0.15, 0.72);
  drawLeaf(ctx, 42, 42, 0.78, 0.95);

  // Corner gold bezel gem socket
  ctx.save();
  ctx.translate(26, 26);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = gold;
  ctx.strokeStyle = '#2a1a08';
  ctx.lineWidth = 2.5;
  ctx.fillRect(-10, -10, 20, 20);
  ctx.strokeRect(-10, -10, 20, 20);

  const gemG = ctx.createRadialGradient(-2, -2, 1, 0, 0, 8);
  gemG.addColorStop(0, '#ffffff');
  gemG.addColorStop(0.4, '#6ee7b7');
  gemG.addColorStop(1, '#047857');
  ctx.fillStyle = gemG;
  ctx.fillRect(-6, -6, 12, 12);
  ctx.restore();

  return c;
}

function renderEdgeVineHorizontal() {
  const c = makeCanvas(320, 56);
  const ctx = c.getContext('2d');
  const gold = createGoldGrad(ctx, 0, 8, 320, 48);

  // Gold horizontal bar with central jewel clasp
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(16, 28);
  ctx.bezierCurveTo(90, 16, 230, 40, 304, 28);
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#2a1a08';
  ctx.stroke();
  ctx.lineWidth = 3;
  ctx.strokeStyle = gold;
  ctx.stroke();

  // Creeping green vine wave
  ctx.beginPath();
  ctx.moveTo(24, 28);
  ctx.bezierCurveTo(85, 42, 140, 12, 160, 28);
  ctx.bezierCurveTo(180, 44, 235, 14, 296, 28);
  ctx.lineWidth = 3.2;
  ctx.strokeStyle = '#2e9458';
  ctx.stroke();
  ctx.restore();

  drawLeaf(ctx, 76, 26, 1.1, 0.65);
  drawLeaf(ctx, 122, 22, -0.9, 0.62);
  drawLeaf(ctx, 198, 32, 1.2, 0.62);
  drawLeaf(ctx, 244, 24, -1.1, 0.65);

  // Center gold diamond clasp
  ctx.save();
  ctx.translate(160, 28);
  ctx.rotate(Math.PI / 4);
  ctx.fillStyle = gold;
  ctx.strokeStyle = '#2a1a08';
  ctx.lineWidth = 2;
  ctx.fillRect(-7, -7, 14, 14);
  ctx.strokeRect(-7, -7, 14, 14);
  ctx.restore();

  return c;
}

function renderIvyClusterGreen() {
  const c = makeCanvas(220, 84);
  const ctx = c.getContext('2d');

  // Trailing vine stem along top-right edge
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(20, 22);
  ctx.bezierCurveTo(78, 8, 148, 10, 202, 34);
  ctx.bezierCurveTo(212, 42, 210, 62, 194, 72);
  ctx.lineWidth = 5;
  ctx.strokeStyle = '#10291a';
  ctx.stroke();
  ctx.lineWidth = 2.8;
  ctx.strokeStyle = '#6be8a8';
  ctx.stroke();
  ctx.restore();

  drawLeaf(ctx, 64, 18, -1.15, 0.72);
  drawLeaf(ctx, 108, 16, 1.22, 0.82);
  drawLeaf(ctx, 152, 18, -0.85, 0.92);
  drawLeaf(ctx, 186, 28, 0.65, 1.0);
  drawLeaf(ctx, 200, 54, 1.45, 0.78);

  return c;
}

function renderThornVineGold() {
  const c = makeCanvas(320, 76);
  const ctx = c.getContext('2d');
  const gold = createGoldGrad(ctx, 0, 0, 320, 76);

  const drawThornyBranch = (yBase, flip) => {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(14, yBase);
    ctx.bezierCurveTo(90, yBase + flip * 10, 230, yBase - flip * 10, 306, yBase);
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#2d1c08';
    ctx.stroke();
    ctx.lineWidth = 3.4;
    ctx.strokeStyle = gold;
    ctx.stroke();

    // Thorns along the branch
    const xs = [46, 88, 134, 182, 228, 272];
    xs.forEach((x, idx) => {
      const dir = (idx % 2 === 0 ? 1 : -1) * flip;
      ctx.beginPath();
      ctx.moveTo(x - 5, yBase);
      ctx.lineTo(x + 2, yBase + dir * 11);
      ctx.lineTo(x + 6, yBase);
      ctx.closePath();
      ctx.fillStyle = gold;
      ctx.fill();
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = '#2d1c08';
      ctx.stroke();
    });
    ctx.restore();
  };

  drawThornyBranch(14, 1);
  drawThornyBranch(62, -1);
  return c;
}

function renderLaurelWreathGold() {
  const c = makeCanvas(280, 76);
  const ctx = c.getContext('2d');
  const gold = createGoldGrad(ctx, 0, 0, 280, 76);

  const drawSideLaurel = (cx, dir) => {
    ctx.save();
    ctx.translate(cx, 38);
    ctx.scale(dir, 1);
    ctx.beginPath();
    ctx.arc(0, 0, 26, Math.PI * 0.62, Math.PI * 1.38);
    ctx.lineWidth = 3;
    ctx.strokeStyle = gold;
    ctx.stroke();

    for (let i = -2; i <= 2; i++) {
      drawLeaf(ctx, -22 + Math.abs(i) * 4, i * 10, -0.35 + i * 0.25, 0.48, '#fff1b0', '#b87d1e');
    }
    ctx.restore();
  };

  drawSideLaurel(36, 1);
  drawSideLaurel(244, -1);
  return c;
}

function renderWingedHeartEmblem() {
  const c = makeCanvas(96, 96);
  const ctx = c.getContext('2d');
  const gold = createGoldGrad(ctx, 10, 16, 86, 80);

  // Golden wings left and right
  const drawWing = (dir) => {
    ctx.save();
    ctx.translate(48 + dir * 12, 48);
    ctx.scale(dir, 1);
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.bezierCurveTo(18, -24, 34, -20, 32, -8);
    ctx.bezierCurveTo(28, -2, 22, 0, 28, 4);
    ctx.bezierCurveTo(24, 12, 14, 12, 20, 16);
    ctx.bezierCurveTo(12, 22, 2, 18, 0, 10);
    ctx.closePath();
    ctx.fillStyle = gold;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#1f1508';
    ctx.stroke();
    ctx.restore();
  };
  drawWing(-1);
  drawWing(1);

  // Glowing Mint-Emerald Heart Core
  ctx.save();
  ctx.translate(48, 50);
  ctx.beginPath();
  ctx.moveTo(0, 20);
  ctx.bezierCurveTo(-24, 6, -26, -16, -12, -20);
  ctx.bezierCurveTo(-4, -22, 0, -14, 0, -10);
  ctx.bezierCurveTo(0, -14, 4, -22, 12, -20);
  ctx.bezierCurveTo(26, -16, 24, 6, 0, 20);
  ctx.closePath();

  const hg = ctx.createRadialGradient(-5, -8, 2, 0, 0, 24);
  hg.addColorStop(0, '#ffffff');
  hg.addColorStop(0.35, '#a7f3d0');
  hg.addColorStop(0.75, '#10b981');
  hg.addColorStop(1, '#064e3b');
  ctx.fillStyle = hg;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = gold;
  ctx.stroke();
  ctx.restore();

  return c;
}

function renderCrystalClusterCorner() {
  const c = makeCanvas(96, 96);
  const ctx = c.getContext('2d');

  const drawShard = (x, y, rot, scale) => {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rot);
    ctx.scale(scale, scale);
    ctx.beginPath();
    ctx.moveTo(0, -28);
    ctx.lineTo(14, -6);
    ctx.lineTo(9, 22);
    ctx.lineTo(-9, 22);
    ctx.lineTo(-14, -6);
    ctx.closePath();
    const cg = ctx.createLinearGradient(-14, -28, 14, 22);
    cg.addColorStop(0, '#ffffff');
    cg.addColorStop(0.45, '#bae6fd');
    cg.addColorStop(1, '#0284c7');
    ctx.fillStyle = cg;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();
    ctx.restore();
  };

  drawShard(60, 48, 0.45, 0.78);
  drawShard(36, 52, -0.35, 0.72);
  drawShard(48, 44, -0.12, 1.05);
  return c;
}

function renderCardBackSigil() {
  const c = makeCanvas(360, 520);
  const ctx = c.getContext('2d');
  const gold = createGoldGrad(ctx, 0, 0, 360, 520);

  // Deep plum-emerald velvet background
  const bg = ctx.createRadialGradient(180, 260, 20, 180, 260, 300);
  bg.addColorStop(0, '#2c1d36');
  bg.addColorStop(0.6, '#1a1122');
  bg.addColorStop(1, '#0e0914');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.roundRect(8, 8, 344, 504, 22);
  ctx.fill();

  // Double gold border
  ctx.lineWidth = 6;
  ctx.strokeStyle = gold;
  ctx.stroke();

  ctx.beginPath();
  ctx.roundRect(22, 22, 316, 476, 14);
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = gold;
  ctx.stroke();

  // Central esoteric sun-vine mandala
  ctx.save();
  ctx.translate(180, 260);
  for (const r of [112, 92, 68]) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.lineWidth = r === 92 ? 1.5 : 2.5;
    ctx.strokeStyle = gold;
    if (r === 92) ctx.setLineDash([6, 6]);
    else ctx.setLineDash([]);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // 8-point star burst
  for (let i = 0; i < 8; i++) {
    ctx.save();
    ctx.rotate((i * Math.PI) / 4);
    ctx.beginPath();
    ctx.moveTo(0, -64);
    ctx.lineTo(10, -16);
    ctx.lineTo(0, 0);
    ctx.lineTo(-10, -16);
    ctx.closePath();
    ctx.fillStyle = i % 2 === 0 ? gold : '#6ee7b7';
    ctx.fill();
    ctx.restore();
  }

  ctx.beginPath();
  ctx.arc(0, 0, 16, 0, Math.PI * 2);
  ctx.fillStyle = '#a7f3d0';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#1a1122';
  ctx.stroke();
  ctx.restore();

  drawLeaf(ctx, 180, 88, 0, 1.2);
  drawLeaf(ctx, 180, 432, Math.PI, 1.2);
  return c;
}

function renderBackdropMushrooms() {
  const c = makeCanvas(420, 260);
  const ctx = c.getContext('2d');

  // Dark mossy mound silhouette at bottom-left
  ctx.fillStyle = '#091310';
  ctx.beginPath();
  ctx.moveTo(0, 260);
  ctx.lineTo(0, 130);
  ctx.bezierCurveTo(90, 125, 220, 175, 390, 260);
  ctx.closePath();
  ctx.fill();

  const drawMushroom = (x, y, capR, h, hueHex) => {
    ctx.save();
    // Bioluminescent aura
    const aura = ctx.createRadialGradient(x, y - h, 4, x, y - h, capR * 2.2);
    aura.addColorStop(0, hueHex + '88');
    aura.addColorStop(0.5, hueHex + '28');
    aura.addColorStop(1, hueHex + '00');
    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(x, y - h, capR * 2.2, 0, Math.PI * 2);
    ctx.fill();

    // Stem
    ctx.strokeStyle = '#d1fae5';
    ctx.lineWidth = Math.max(6, capR * 0.28);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.quadraticCurveTo(x - 6, y - h * 0.5, x, y - h);
    ctx.stroke();

    // Glowing Cap
    ctx.beginPath();
    ctx.arc(x, y - h, capR, Math.PI, 0, false);
    ctx.closePath();
    const capG = ctx.createRadialGradient(x - capR * 0.2, y - h - capR * 0.4, 2, x, y - h, capR);
    capG.addColorStop(0, '#ffffff');
    capG.addColorStop(0.45, hueHex);
    capG.addColorStop(1, '#064e3b');
    ctx.fillStyle = capG;
    ctx.fill();
    ctx.restore();
  };

  drawMushroom(74, 235, 38, 78, '#34d399');
  drawMushroom(138, 242, 26, 54, '#5eead4');
  drawMushroom(42, 246, 20, 42, '#fde047');
  drawMushroom(210, 248, 22, 44, '#38bdf8');
  return c;
}

window.renderAllOrnaments = function() {
  const map = {
    'corner-vine-gold': renderCornerVineGold(),
    'edge-vine-horizontal': renderEdgeVineHorizontal(),
    'ivy-cluster-green': renderIvyClusterGreen(),
    'thorn-vine-gold': renderThornVineGold(),
    'laurel-wreath-gold': renderLaurelWreathGold(),
    'winged-heart-emblem': renderWingedHeartEmblem(),
    'crystal-cluster-corner': renderCrystalClusterCorner(),
    'card-back-sigil': renderCardBackSigil(),
    'backdrop-mushrooms': renderBackdropMushrooms(),
  };
  const out = {};
  for (const [key, canvas] of Object.entries(map)) {
    out[key] = {
      png: canvas.toDataURL('image/png'),
      webp: canvas.toDataURL('image/webp', 0.9),
    };
  }
  return out;
};
</script>
</body>
</html>`;

function writeDataUrl(filePath, dataUrl) {
  const base64 = dataUrl.split(',')[1];
  fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(ORNAMENT_MANIFEST_DATA, null, 2) + '\n');
  execFileSync('npx', ['playwright-cli', 'open', 'about:blank'], { stdio: 'inherit' });
  const evalOut = execFileSync(
    'npx',
    [
      'playwright-cli',
      'run-code',
      `async (page) => {
        const html = ${JSON.stringify(HTML_RENDERER)};
        await page.setContent(html);
        const res = await page.evaluate(() => window.renderAllOrnaments());
        return JSON.stringify(res);
      }`,
    ],
    { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
  );
  execFileSync('npx', ['playwright-cli', 'close'], { stdio: 'inherit' });

  const match = evalOut.match(/### Result\s+([\s\S]+?)(?:\n###|\s*$)/);
  const rawStr = match ? match[1].trim() : evalOut.trim();
  const parsedStr = rawStr.startsWith('"') ? JSON.parse(rawStr) : rawStr;
  const result = typeof parsedStr === 'string' ? JSON.parse(parsedStr) : parsedStr;

  let totalWebpBytes = 0;
  for (const [key, data] of Object.entries(result)) {
    const pngPath = path.join(OUT_DIR, `${key}.png`);
    const webpPath = path.join(OUT_DIR, `${key}.webp`);
    writeDataUrl(pngPath, data.png);
    writeDataUrl(webpPath, data.webp);
    totalWebpBytes += fs.statSync(webpPath).size;
  }
  console.log(
    `Generated ${Object.keys(result).length} ornament assets in ${OUT_DIR} (Total WebP size: ${(
      totalWebpBytes / 1024
    ).toFixed(1)} KB <= 400 KB budget)`
  );
}
