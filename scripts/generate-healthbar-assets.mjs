import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const PUBLIC_DIR = path.resolve('public');
const HUD_ASSETS_DIR = path.resolve('public/assets/hud');
fs.mkdirSync(HUD_ASSETS_DIR, { recursive: true });

/**
 * 1. healthbar-frame.png (640 x 108 — Slimmer AAA Botanical Tarot Frame)
 * Center Y = 54 (50%).
 * Left circular gold socket center = (64, 54) -> (10% X, 50% Y), outer r=44, inner hollow r=34.
 * Horizontal cutout track = x:100, y:39, width:510, height:30, rx:15 (centered at y=54).
 * Strictly NO leaves, vines, or foliage near the heart socket.
 */
const frameSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 108" width="640" height="108">
  <defs>
    <linearGradient id="goldMain" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFF6C4" />
      <stop offset="18%" stop-color="#F0C75E" />
      <stop offset="45%" stop-color="#C89128" />
      <stop offset="72%" stop-color="#7B5110" />
      <stop offset="90%" stop-color="#D4A238" />
      <stop offset="100%" stop-color="#533407" />
    </linearGradient>

    <linearGradient id="goldBevelInner" x1="0%" y1="100%" x2="0%" y2="0%">
      <stop offset="0%" stop-color="#FFF2B2" />
      <stop offset="40%" stop-color="#B88222" />
      <stop offset="80%" stop-color="#5A3908" />
      <stop offset="100%" stop-color="#E7BA52" />
    </linearGradient>

    <linearGradient id="darkStoneRim" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#221926" />
      <stop offset="50%" stop-color="#120D16" />
      <stop offset="100%" stop-color="#2E2334" />
    </linearGradient>

    <linearGradient id="glassHighlight" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.15" />
      <stop offset="24%" stop-color="#FFF8DC" stop-opacity="0.03" />
      <stop offset="80%" stop-color="#000000" stop-opacity="0.0" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.07" />
    </linearGradient>

    <radialGradient id="socketRecess" cx="50%" cy="45%" r="52%">
      <stop offset="0%" stop-color="#281520" />
      <stop offset="65%" stop-color="#130910" />
      <stop offset="100%" stop-color="#070307" />
    </radialGradient>

    <filter id="dropShadow" x="-8%" y="-15%" width="116%" height="135%">
      <feDropShadow dx="0" dy="3" stdDeviation="3.5" flood-color="#000000" flood-opacity="0.78" />
    </filter>

    <mask id="frameCutoutMask">
      <rect x="0" y="0" width="640" height="108" fill="white" />
      <rect x="100" y="39" width="510" height="30" rx="15" ry="15" fill="black" />
    </mask>
  </defs>

  <g filter="url(#dropShadow)">
    <!-- Slim Horizontal Track Casing with Cutout Mask -->
    <g mask="url(#frameCutoutMask)">
      <rect x="88" y="30" width="532" height="48" rx="24" ry="24" fill="url(#goldMain)" stroke="#2A1905" stroke-width="2.5" />
      <rect x="94" y="34.5" width="522" height="39" rx="19.5" ry="19.5" fill="url(#darkStoneRim)" stroke="url(#goldBevelInner)" stroke-width="2" />
      <rect x="98" y="37.5" width="514" height="33" rx="16.5" ry="16.5" fill="none" stroke="url(#goldMain)" stroke-width="3" />
    </g>

    <!-- Recessed Glass Rim & Specular Line Over Cutout -->
    <rect x="100" y="39" width="510" height="30" rx="15" ry="15" fill="url(#glassHighlight)" stroke="#3B2609" stroke-width="1.2" stroke-opacity="0.6" />
    <path d="M 118 43.5 H 592" stroke="#FFFDF0" stroke-width="1.8" stroke-linecap="round" stroke-opacity="0.38" />

    <!-- Slim Antique Gold Filigree Rails Along Top & Bottom (Zero green leaves) -->
    <g stroke="url(#goldMain)" fill="none" stroke-linecap="round">
      <path d="M 140 30 C 172 23, 212 23, 244 30" stroke-width="2.2" />
      <path d="M 274 30 C 316 21, 376 21, 418 30" stroke-width="2.6" />
      <path d="M 448 30 C 480 23, 520 23, 552 30" stroke-width="2.2" />

      <path d="M 140 78 C 172 85, 212 85, 244 78" stroke-width="2.2" />
      <path d="M 274 78 C 316 87, 376 87, 418 78" stroke-width="2.6" />
      <path d="M 448 78 C 480 85, 520 85, 552 78" stroke-width="2.2" />
    </g>

    <!-- Gold Tarot Diamond Clasps & Finial Crown -->
    <g fill="url(#goldMain)" stroke="#2A1905" stroke-width="1.5">
      <polygon points="259,25 265,30 259,35 253,30" />
      <polygon points="433,25 439,30 433,35 427,30" />
      <polygon points="259,73 265,78 259,83 253,78" />
      <polygon points="433,73 439,78 433,83 427,78" />
      <polygon points="629,54 617,42 610,54 617,66" />
      <circle cx="618" cy="54" r="3.5" fill="#FFF6C4" />
    </g>

    <!-- Bridge Collar Joining Circular Socket to Slim Track -->
    <path d="M 94 34 L 112 37 L 112 71 L 94 74 Z" fill="url(#goldMain)" stroke="#2A1905" stroke-width="2" />
    <line x1="103" y1="37" x2="103" y2="71" stroke="#4A2F09" stroke-width="1.6" />

    <!-- Clean Circular Gold Socket Centered at (64, 54) — Zero leaves/vines -->
    <g transform="translate(64, 54)">
      <circle cx="0" cy="0" r="44" fill="url(#goldMain)" stroke="#241404" stroke-width="2.8" />
      <circle cx="0" cy="0" r="38.5" fill="url(#darkStoneRim)" stroke="url(#goldBevelInner)" stroke-width="2.4" />
      <circle cx="0" cy="-41.2" r="2.3" fill="#FFF6C4" stroke="#2A1905" stroke-width="1" />
      <circle cx="0" cy="41.2" r="2.3" fill="#FFF6C4" stroke="#2A1905" stroke-width="1" />
      <circle cx="-41.2" cy="0" r="2.3" fill="#FFF6C4" stroke="#2A1905" stroke-width="1" />
      <circle cx="41.2" cy="0" r="2.3" fill="#FFF6C4" stroke="#2A1905" stroke-width="1" />
      <circle cx="-29" cy="-29" r="2" fill="#F0C75E" stroke="#2A1905" stroke-width="0.9" />
      <circle cx="29" cy="-29" r="2" fill="#F0C75E" stroke="#2A1905" stroke-width="0.9" />
      <circle cx="-29" cy="29" r="2" fill="#F0C75E" stroke="#2A1905" stroke-width="0.9" />
      <circle cx="29" cy="29" r="2" fill="#F0C75E" stroke="#2A1905" stroke-width="0.9" />
      <circle cx="0" cy="0" r="34" fill="url(#socketRecess)" stroke="url(#goldMain)" stroke-width="3.2" />
      <circle cx="0" cy="0" r="29.5" fill="none" stroke="#FFF6C4" stroke-width="1" stroke-opacity="0.3" />
    </g>
  </g>
</svg>`;

/**
 * 2. heart-emblem.png (160 x 160 — Smooth, Crack-Free Sculpted Ruby Heart Centered at 80,80)
 * Bounding box of heart: x in [24, 136] (center = 80), y in [28, 132] (center = 80).
 * Smooth ruby-red gem surface with warm inner glow, soft curved gloss highlight, and clean gold bezel.
 * Strictly NO cracks, fracture lines, or extra background rings.
 */
const heartSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" width="160" height="160">
  <defs>
    <linearGradient id="bezelGold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFF7C8" />
      <stop offset="28%" stop-color="#F2C964" />
      <stop offset="60%" stop-color="#B87E1E" />
      <stop offset="85%" stop-color="#6B440B" />
      <stop offset="100%" stop-color="#E2B24A" />
    </linearGradient>

    <radialGradient id="rubySmoothCore" cx="44%" cy="38%" r="58%">
      <stop offset="0%" stop-color="#FF8DA9" />
      <stop offset="22%" stop-color="#FF2A55" />
      <stop offset="58%" stop-color="#C80832" />
      <stop offset="85%" stop-color="#78021C" />
      <stop offset="100%" stop-color="#42000E" />
    </radialGradient>

    <radialGradient id="warmInnerGlow" cx="50%" cy="52%" r="42%">
      <stop offset="0%" stop-color="#FF5E7E" stop-opacity="0.55" />
      <stop offset="60%" stop-color="#FF1E4D" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#FF1E4D" stop-opacity="0" />
    </radialGradient>

    <linearGradient id="rimLight" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#FF9BB3" stop-opacity="0.42" />
      <stop offset="50%" stop-color="#FF2A55" stop-opacity="0.0" />
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0.25" />
    </linearGradient>

    <filter id="heartDropShadow" x="-15%" y="-15%" width="130%" height="130%">
      <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="#000000" flood-opacity="0.68" />
    </filter>
  </defs>

  <g filter="url(#heartDropShadow)">
    <!-- Outer Clean Gold Heart Bezel (Centered at 80, 80: y spans 28 to 132, x spans 24 to 136) -->
    <path
      d="M 80 132
         C 45 108, 24 82, 24 55
         C 24 37, 38 28, 54 28
         C 66 28, 75 34, 80 43
         C 85 34, 94 28, 106 28
         C 122 28, 136 37, 136 55
         C 136 82, 115 108, 80 132 Z"
      fill="url(#bezelGold)"
      stroke="#2B1804"
      stroke-width="3.2"
    />

    <!-- Smooth Sculpted Ruby-Red Crystal Heart Core (Zero cracks or fracture lines) -->
    <path
      d="M 80 124
         C 49 102, 31 79, 31 56
         C 31 41, 43 34, 55 34
         C 66 34, 74 40, 80 49
         C 86 40, 94 34, 105 34
         C 117 34, 129 41, 129 56
         C 129 79, 111 102, 80 124 Z"
      fill="url(#rubySmoothCore)"
      stroke="#520214"
      stroke-width="1.8"
    />

    <!-- Soft Warm Inner Radiance -->
    <path
      d="M 80 120
         C 52 100, 35 78, 35 56
         C 35 43, 45 37, 56 37
         C 66 37, 74 43, 80 51
         C 86 43, 94 37, 104 37
         C 115 37, 125 43, 125 56
         C 125 78, 108 100, 80 120 Z"
      fill="url(#warmInnerGlow)"
    />

    <!-- Subtle Smooth Rim Contour Highlight -->
    <path
      d="M 80 121
         C 51 100, 34 78, 34 56
         C 34 43, 44 36, 55 36
         C 65 36, 74 42, 80 50
         C 86 42, 95 36, 105 36
         C 116 36, 126 43, 126 56
         C 126 78, 109 100, 80 121 Z"
      fill="none"
      stroke="url(#rimLight)"
      stroke-width="2.5"
    />

    <!-- Smooth Glossy Specular Cabochon Highlights -->
    <ellipse cx="55" cy="51" rx="13" ry="7.5" transform="rotate(-26 55 51)" fill="#FFFFFF" fill-opacity="0.62" />
    <circle cx="46" cy="62" r="3.2" fill="#FFFFFF" fill-opacity="0.78" />
    <ellipse cx="104" cy="49" rx="8" ry="4.5" transform="rotate(22 104 49)" fill="#FFD1DE" fill-opacity="0.38" />
  </g>
</svg>`;

const shieldSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 64" width="512" height="64">
  <defs>
    <linearGradient id="crystalFacet" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.55" />
      <stop offset="35%" stop-color="#E2E8F0" stop-opacity="0.28" />
      <stop offset="70%" stop-color="#38BDF8" stop-opacity="0.42" />
      <stop offset="100%" stop-color="#BAE6FD" stop-opacity="0.6" />
    </linearGradient>

    <filter id="runeGlow" x="-10%" y="-20%" width="120%" height="140%">
      <feGaussianBlur stdDeviation="1.8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>

  <g stroke="#E2E8F0" stroke-opacity="0.55" stroke-width="1.2" fill="url(#crystalFacet)">
    <polygon points="0,0 64,0 44,32 8,32" />
    <polygon points="64,0 136,0 112,32 44,32" />
    <polygon points="136,0 216,0 188,32 112,32" />
    <polygon points="216,0 296,0 268,32 188,32" />
    <polygon points="296,0 376,0 348,32 268,32" />
    <polygon points="376,0 448,0 424,32 348,32" />
    <polygon points="448,0 512,0 512,32 424,32" />

    <polygon points="8,32 44,32 64,64 0,64" />
    <polygon points="44,32 112,32 136,64 64,64" />
    <polygon points="112,32 188,32 216,64 136,64" />
    <polygon points="188,32 268,32 296,64 216,64" />
    <polygon points="268,32 348,32 376,64 296,64" />
    <polygon points="348,32 424,32 448,64 376,64" />
    <polygon points="424,32 512,32 512,64 448,64" />
  </g>

  <g filter="url(#runeGlow)" stroke="#FFFFFF" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0.88">
    <path d="M 48 16 L 38 32 L 48 48 L 58 32 Z M 48 22 L 48 42" />
    <path d="M 122 14 L 134 26 L 122 38 L 134 50 M 116 26 L 138 26" />
    <path d="M 204 14 L 194 32 L 204 50 M 204 14 L 214 32 L 204 50 M 190 32 L 218 32" />
    <path d="M 284 15 L 284 49 M 274 24 L 284 15 L 294 24 M 274 40 L 284 49 L 294 40" />
    <path d="M 364 16 L 354 32 L 364 48 L 374 32 Z M 359 32 H 369" />
    <path d="M 442 15 L 432 49 M 432 15 L 442 49 M 428 32 H 446" />
  </g>

  <line x1="0" y1="2" x2="512" y2="2" stroke="#FFFFFF" stroke-width="2.5" stroke-opacity="0.8" />
  <line x1="0" y1="62" x2="512" y2="62" stroke="#7DD3FC" stroke-width="2" stroke-opacity="0.7" />
</svg>`;

const HTML_RENDERER = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /></head>
<body style="margin:0;background:transparent;">
<script>
async function svgToPngDataUrl(svgString, width, height) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

window.renderAllHealthBarAssets = async function() {
  return {
    'healthbar-frame.png': await svgToPngDataUrl(${JSON.stringify(frameSvg)}, 640, 108),
    'heart-emblem.png': await svgToPngDataUrl(${JSON.stringify(heartSvg)}, 160, 160),
    'shield-overlay.png': await svgToPngDataUrl(${JSON.stringify(shieldSvg)}, 512, 64),
  };
};
</script>
</body>
</html>`;

function writeDataUrl(filePath, dataUrl) {
  const base64 = dataUrl.split(',')[1];
  fs.writeFileSync(filePath, Buffer.from(base64, 'base64'));
}

execFileSync('playwright-cli', ['open', 'about:blank'], { stdio: 'inherit' });
const evalOut = execFileSync(
  'playwright-cli',
  [
    'run-code',
    `async (page) => {
      const html = ${JSON.stringify(HTML_RENDERER)};
      await page.setContent(html);
      const res = await page.evaluate(() => window.renderAllHealthBarAssets());
      return JSON.stringify(res);
    }`,
  ],
  { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }
);
execFileSync('playwright-cli', ['close'], { stdio: 'inherit' });

const match = evalOut.match(/### Result\s+([\s\S]+?)(?:\n###|\s*$)/);
const rawStr = match ? match[1].trim() : evalOut.trim();
const parsedStr = rawStr.startsWith('"') ? JSON.parse(rawStr) : rawStr;
const result = typeof parsedStr === 'string' ? JSON.parse(parsedStr) : parsedStr;

for (const [fileName, dataUrl] of Object.entries(result)) {
  const rootOut = path.join(PUBLIC_DIR, fileName);
  const hudOut = path.join(HUD_ASSETS_DIR, fileName);
  writeDataUrl(rootOut, dataUrl);
  writeDataUrl(hudOut, dataUrl);
  const sizeKb = (fs.statSync(rootOut).size / 1024).toFixed(1);
  console.log(`Generated ${fileName} (${sizeKb} KB) -> /public/${fileName} & /public/assets/hud/${fileName}`);
}
