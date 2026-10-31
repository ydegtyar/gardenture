import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const WEAPONS_OUT_DIR = path.resolve('public/assets/weapons');
fs.mkdirSync(WEAPONS_OUT_DIR, { recursive: true });

// ============================================================================
// 1. GAME ASSET SPRITE (1024 x 1024 Square, Transparent, 45° Diagonal)
// ============================================================================
// Style constraints:
// - Chibi garden adventure weapon matching straw hat hero
// - Thick plum-navy outline: #2a1f33 (stroke ~32px)
// - Flat cel-shaded fills:
//     - Main mint-green fill: #7be0a8
//     - One shade darker leafy green on lower edge: #4fb67f
// - Pale green central midrib: #e2f8eb with 2 short side veins
// - Smooth curved leaf edges (no serrations, no tiny teeth)
// - Short stubby handle: brown wrapped grip (#7a482b with #4a2612 wraps)
// - Rounded golden crossguard (#f8d558) with tiny leaf gem (#7be0a8)
// - Smooth round golden pommel (#f8d558)
// - Proportions: blade ~2/3 of total length, chunky and readable at 64x64
// - Shown diagonally at 45 degrees (handle bottom-left, tip top-right)
// - Centered with 10% padding on 1024x1024 canvas
// ============================================================================

export function buildLeafBladeSpriteSvg() {
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <defs>
    <!-- Filter for crisp cel rendering -->
  </defs>

  <!-- 45-degree rotation around center (512, 512): Handle bottom-left, tip top-right -->
  <g transform="rotate(45 512 512)">
    <!-- ================================================================= -->
    <!-- 1. POMMEL: Smooth round golden pommel (#f8d558)                   -->
    <!-- ================================================================= -->
    <circle
      cx="512"
      cy="856"
      r="44"
      fill="#f8d558"
      stroke="#2a1f33"
      stroke-width="32"
    />
    <!-- Golden pommel inner soft cel highlight -->
    <circle
      cx="498"
      cy="842"
      r="16"
      fill="#fffdf0"
    />

    <!-- ================================================================= -->
    <!-- 2. HILT / HANDLE: Brown wrapped grip (#7a482b) with dark wraps   -->
    <!-- ================================================================= -->
    <!-- Handle Base -->
    <rect
      x="474"
      y="696"
      width="76"
      height="124"
      rx="24"
      fill="#7a482b"
      stroke="#2a1f33"
      stroke-width="32"
      stroke-linejoin="round"
    />
    <!-- Diagonal leather wrap bands (#4a2612) -->
    <path
      d="M 476 724 L 548 748"
      stroke="#4a2612"
      stroke-width="22"
      stroke-linecap="round"
    />
    <path
      d="M 476 766 L 548 790"
      stroke="#4a2612"
      stroke-width="22"
      stroke-linecap="round"
    />

    <!-- ================================================================= -->
    <!-- 3. CROSSGUARD: Rounded golden wings (#f8d558) with tiny leaf gem  -->
    <!-- ================================================================= -->
    <!-- Guard Golden Body with thick plum-navy outline -->
    <path
      d="M 374 694
         C 416 660 472 674 512 682
         C 552 674 608 660 650 694
         C 630 732 570 726 512 724
         C 454 726 394 732 374 694 Z"
      fill="#f8d558"
      stroke="#2a1f33"
      stroke-width="32"
      stroke-linejoin="round"
      stroke-linecap="round"
    />
    <!-- Guard inner upper crest contour -->
    <path
      d="M 432 684
         C 468 668 496 662 512 660
         C 528 662 556 668 592 684"
      fill="none"
      stroke="#2a1f33"
      stroke-width="20"
      stroke-linecap="round"
    />
    <!-- Tiny center leaf gem (#7be0a8 with dark contour) -->
    <path
      d="M 512 674
         C 526 690 526 702 512 710
         C 498 702 498 690 512 674 Z"
      fill="#7be0a8"
      stroke="#2a1f33"
      stroke-width="14"
      stroke-linejoin="round"
    />

    <!-- ================================================================= -->
    <!-- 4. BLADE: Single broad leaf with pointed tip (2/3 of total length) -->
    <!-- Smooth edges, no serrations, two-tone cel fills:                  -->
    <!-- Left / upper side: #7be0a8 (soft mint green)                      -->
    <!-- Right / lower shaded side: #4fb67f (one shade darker leafy green) -->
    <!-- ================================================================= -->
    
    <!-- Full Leaf Blade Outline Base -->
    <!-- Tip at (512, 148), broad hips at y=430 (width ~290px), base at y=662 -->
    <g stroke="#2a1f33" stroke-width="34" stroke-linejoin="round" stroke-linecap="round">
      <!-- Right Half / Shaded Lower Edge (#4fb67f) -->
      <path
        d="M 512 148
           C 592 232 662 334 662 436
           C 662 538 594 624 512 662
           Z"
        fill="#4fb67f"
      />
      <!-- Left Half / Main Mint-Green Fill (#7be0a8) -->
      <path
        d="M 512 148
           C 432 232 362 334 362 436
           C 362 538 430 624 512 662
           Z"
        fill="#7be0a8"
      />
    </g>

    <!-- Clean Outline Stroke Around Entire Leaf Perimeter -->
    <path
      d="M 512 148
         C 592 232 662 334 662 436
         C 662 538 594 624 512 662
         C 430 624 362 538 362 436
         C 362 334 432 232 512 148 Z"
      fill="none"
      stroke="#2a1f33"
      stroke-width="34"
      stroke-linejoin="round"
      stroke-linecap="round"
    />

    <!-- ================================================================= -->
    <!-- 5. VEINS & HIGHLIGHT STRIPE                                       -->
    <!-- One pale-green midrib line (#e2f8eb) & two short side veins       -->
    <!-- One highlight stripe along the upper blade                        -->
    <!-- ================================================================= -->
    <!-- Subtle pale cel highlight stripe on upper mint facet -->
    <path
      d="M 502 210
         C 450 286 406 364 406 436
         C 406 480 422 528 450 572
         C 432 524 424 476 424 436
         C 424 372 462 298 502 210 Z"
      fill="#e2f8eb"
      opacity="0.55"
    />

    <!-- Central Pale-Green Midrib Line (#e2f8eb) -->
    <path
      d="M 512 178 L 512 642"
      stroke="#e2f8eb"
      stroke-width="26"
      stroke-linecap="round"
    />

    <!-- Two Short Side Veins (#e2f8eb) -->
    <!-- Upper right side vein -->
    <path
      d="M 512 360 C 536 342 566 332 590 326"
      stroke="#e2f8eb"
      stroke-width="20"
      stroke-linecap="round"
    />
    <!-- Lower left side vein -->
    <path
      d="M 512 470 C 486 450 456 440 432 436"
      stroke="#e2f8eb"
      stroke-width="20"
      stroke-linecap="round"
    />
  </g>
</svg>`;
}

// ============================================================================
// 2. TAROT CARD FOR "LEAF BLADE" WEAPON
// ============================================================================
// Exact same card frame, border thickness, corner radius, background pattern,
// title banner, text style, icon placement, rarity indicator, padding.
// Replaced only artwork and text:
// - Title: "Leaf Blade"
// - Illustration: single leaf-shaped sword, mint-to-leaf-green blade with simple
//   pale midrib, small golden crossguard with tiny leaf gem, brown wrapped handle.
//   Shown at slight diagonal, centered in art area, with soft pastel circular glow.
// - Description line: "Slashes nearby weeds in a swift emerald cutting arc."
// - Stat/tag: "MELEE"
// ============================================================================

export function buildLeafBladeTarotCardSvg() {
  // Dimensions: 720 x 1040 (matches 180:260 Tarot card aspect ratio 9:13)
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 1040" width="720" height="1040">
  <defs>
    <!-- Outer Card Frame Gradient (Rare/Celestial weapon frame) -->
    <linearGradient id="card-outer-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#FFFDF7" />
      <stop offset="45%" stopColor="#EFF6FF" />
      <stop offset="100%" stopColor="#DBEAFE" />
    </linearGradient>

    <!-- Inner Parchment Ground Gradient -->
    <linearGradient id="card-parchment-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#FFFDF7" />
      <stop offset="50%" stopColor="#FAF4E4" />
      <stop offset="100%" stopColor="#F3EAD3" />
    </linearGradient>

    <!-- Ribbon Banner Gradient -->
    <linearGradient id="card-ribbon-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#352438" />
      <stop offset="100%" stopColor="#241827" />
    </linearGradient>

    <!-- Arched Tarot Window Sky Gradient -->
    <linearGradient id="window-sky-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stopColor="#342539" />
      <stop offset="55%" stopColor="#221827" />
      <stop offset="100%" stopColor="#150E18" />
    </linearGradient>

    <!-- Gilded Arch Gold Gradient -->
    <linearGradient id="window-gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stopColor="#FFFDF5" />
      <stop offset="40%" stopColor="#FDE047" />
      <stop offset="80%" stopColor="#F59E0B" />
      <stop offset="100%" stopColor="#B45309" />
    </linearGradient>

    <!-- Soft Pastel Radial Glow Aura -->
    <radialGradient id="pastel-glow-grad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#A8E6CF" stopOpacity="0.45" />
      <stop offset="60%" stopColor="#7be0a8" stopOpacity="0.18" />
      <stop offset="100%" stopColor="#150E18" stopOpacity="0" />
    </radialGradient>
  </defs>

  <!-- =================================================================== -->
  <!-- 1. CARD OUTER FRAME (Rounded 32px, 12px outer padding)              -->
  <!-- =================================================================== -->
  <rect
    x="12"
    y="12"
    width="696"
    height="1016"
    rx="32"
    fill="url(#card-outer-grad)"
    stroke="#7DD3FC"
    stroke-width="10"
  />

  <!-- =================================================================== -->
  <!-- 2. INNER VINTAGE INK TAROT FRAME (Ink outline #2D1E2F, Parchment)   -->
  <!-- =================================================================== -->
  <rect
    x="32"
    y="32"
    width="656"
    height="976"
    rx="22"
    fill="url(#card-parchment-grad)"
    stroke="#2D1E2F"
    stroke-width="8"
  />

  <!-- =================================================================== -->
  <!-- 3. TOP HEADER: Roman Numeral Cartouche, Arcana Rarity & Gem         -->
  <!-- =================================================================== -->
  <!-- Roman Numeral Pill [I] -->
  <rect
    x="56"
    y="56"
    width="54"
    height="36"
    rx="8"
    fill="#2D1E2F"
  />
  <text
    x="83"
    y="80"
    fill="#FDFFB6"
    font-family="Georgia, serif"
    font-size="18"
    font-weight="bold"
    text-anchor="middle"
    letter-spacing="2"
  >I</text>

  <!-- Arcana Subtitle & Rarity Gem -->
  <g transform="translate(636, 74)">
    <!-- Cyan Diamond Gem -->
    <polygon
      points="0,-10 10,0 0,10 -10,0"
      fill="#38BDF8"
      stroke="#2D1E2F"
      stroke-width="4"
    />
    <text
      x="-22"
      y="6"
      fill="#5C4760"
      font-family="system-ui, -apple-system, sans-serif"
      font-size="16"
      font-weight="bold"
      letter-spacing="2"
      text-anchor="end"
    >WEAPON</text>
  </g>

  <!-- Top Divider Line -->
  <line
    x1="56"
    y1="108"
    x2="664"
    y2="108"
    stroke="#2D1E2F"
    stroke-opacity="0.22"
    stroke-width="4"
  />

  <!-- =================================================================== -->
  <!-- 4. CENTRAL ARCHED TAROT ALCOVE ILLUSTRATION                         -->
  <!-- =================================================================== -->
  <g transform="translate(80, 130)">
    <!-- Arched Vintage Tarot Window (Width: 560, Height: 410) -->
    <!-- Arch: L 30,410 L 30,175 A 250,160 0 0,1 530,175 L 530,410 Z -->
    <path
      d="M 30,410 L 30,175 A 250,155 0 0,1 530,175 L 530,410 Z"
      fill="url(#window-sky-grad)"
      stroke="#2D1E2F"
      stroke-width="9"
      stroke-linejoin="round"
    />

    <!-- Ambient Pastel Halo Glow behind weapon -->
    <circle
      cx="280"
      cy="215"
      r="175"
      fill="url(#pastel-glow-grad)"
    />

    <!-- Sacred Geometry Rays behind Subject -->
    <g stroke="#7be0a8" stroke-width="2.5" opacity="0.24">
      <line x1="280" y1="50" x2="280" y2="380" />
      <line x1="90" y1="215" x2="470" y2="215" />
      <line x1="145" y1="80" x2="415" y2="350" />
      <line x1="415" y1="80" x2="145" y2="350" />
    </g>

    <!-- Inner Gilded Dashed Arch -->
    <path
      d="M 48,390 L 48,180 A 232,138 0 0,1 512,180 L 512,390"
      fill="none"
      stroke="url(#window-gold-grad)"
      stroke-width="4"
      stroke-dasharray="12 8"
      opacity="0.8"
    />

    <!-- Celestial Concentric Rings -->
    <circle
      cx="280"
      cy="215"
      r="120"
      fill="none"
      stroke="url(#window-gold-grad)"
      stroke-width="3"
      opacity="0.45"
    />
    <circle
      cx="280"
      cy="215"
      r="90"
      fill="#A8E6CF"
      opacity="0.14"
    />
    <circle
      cx="280"
      cy="215"
      r="90"
      fill="none"
      stroke="#A8E6CF"
      stroke-width="2.5"
      stroke-dasharray="6 8"
      opacity="0.5"
    />

    <!-- Corner Filigree Leaves & Gold Stars -->
    <polygon points="105,105 111,118 124,124 111,130 105,143 99,130 86,124 99,118" fill="url(#window-gold-grad)" opacity="0.9" />
    <polygon points="455,105 461,118 474,124 461,130 455,143 449,130 436,124 449,118" fill="url(#window-gold-grad)" opacity="0.9" />

    <!-- ================================================================= -->
    <!-- 5. CARD ILLUSTRATION: LEAF BLADE AT SLIGHT DIAGONAL (~28°)        -->
    <!-- Thick dark plum-navy outline (#2a1f33), flat cel fills            -->
    <!-- ================================================================= -->
    <g transform="translate(280, 215) rotate(28) scale(0.68) translate(-512, -512)">
      <!-- Golden Pommel -->
      <circle cx="512" cy="740" r="32" fill="#f8d558" stroke="#2a1f33" stroke-width="20" />
      <circle cx="502" cy="730" r="10" fill="#fffdf0" />

      <!-- Brown Wrapped Grip -->
      <rect x="484" y="628" width="56" height="88" rx="16" fill="#7a482b" stroke="#2a1f33" stroke-width="20" />
      <line x1="486" y1="652" x2="538" y2="668" stroke="#4a2612" stroke-width="15" stroke-linecap="round" />
      <line x1="486" y1="680" x2="538" y2="696" stroke="#4a2612" stroke-width="15" stroke-linecap="round" />

      <!-- Golden Crossguard with Tiny Leaf Gem -->
      <path
        d="M 405 628
           C 438 602 482 612 512 618
           C 542 612 586 602 619 628
           C 604 654 558 650 512 648
           C 466 650 420 654 405 628 Z"
        fill="#f8d558"
        stroke="#2a1f33"
        stroke-width="20"
        stroke-linejoin="round"
      />
      <!-- Tiny Leaf Gem -->
      <path
        d="M 512 612 C 522 622 522 630 512 636 C 502 630 502 622 512 612 Z"
        fill="#7be0a8"
        stroke="#2a1f33"
        stroke-width="10"
      />

      <!-- Leaf Blade (Two-Tone Cel Fills) -->
      <!-- Lower/Right Shaded Edge (#4fb67f) -->
      <path
        d="M 512 250
           C 572 312 624 388 624 464
           C 624 540 574 602 512 632
           Z"
        fill="#4fb67f"
        stroke="#2a1f33"
        stroke-width="22"
        stroke-linejoin="round"
      />
      <!-- Upper/Left Main Mint Fill (#7be0a8) -->
      <path
        d="M 512 250
           C 452 312 400 388 400 464
           C 400 540 450 602 512 632
           Z"
        fill="#7be0a8"
        stroke="#2a1f33"
        stroke-width="22"
        stroke-linejoin="round"
      />

      <!-- Pale Midrib Highlight Line (#e2f8eb) & Side Veins -->
      <line x1="512" y1="272" x2="512" y2="616" stroke="#e2f8eb" stroke-width="16" stroke-linecap="round" />
      <path d="M 512 408 C 530 395 552 388 570 384" stroke="#e2f8eb" stroke-width="13" stroke-linecap="round" />
      <path d="M 512 490 C 494 476 472 468 454 464" stroke="#e2f8eb" stroke-width="13" stroke-linecap="round" />
    </g>
  </g>

  <!-- =================================================================== -->
  <!-- 6. VINTAGE RIBBON SCROLL TITLE BANNER                                -->
  <!-- =================================================================== -->
  <g transform="translate(100, 580)">
    <!-- Ribbon Box (Width: 520, Height: 94) -->
    <rect
      x="0"
      y="0"
      width="520"
      height="94"
      rx="18"
      fill="url(#card-ribbon-grad)"
      stroke="#8C5A3C"
      stroke-width="6"
    />
    <!-- Arcana Subtitle -->
    <text
      x="260"
      y="34"
      fill="#FDFFB6"
      opacity="0.9"
      font-family="system-ui, -apple-system, sans-serif"
      font-size="14"
      font-weight="bold"
      letter-spacing="4"
      text-anchor="middle"
    >BLADE OF THE GROVE</text>
    <!-- Card Title -->
    <text
      x="260"
      y="74"
      fill="#FFFDF0"
      font-family="Georgia, serif"
      font-size="36"
      font-weight="bold"
      letter-spacing="1"
      text-anchor="middle"
    >Leaf Blade</text>
  </g>

  <!-- =================================================================== -->
  <!-- 7. PARCHMENT SCRIPTURE EFFECT DESCRIPTION BOX                       -->
  <!-- =================================================================== -->
  <g transform="translate(100, 715)">
    <text
      x="260"
      y="40"
      fill="#3D2B40"
      font-family="system-ui, -apple-system, sans-serif"
      font-size="24"
      font-weight="600"
      text-anchor="middle"
    >Slashes nearby weeds in a</text>
    <text
      x="260"
      y="74"
      fill="#3D2B40"
      font-family="system-ui, -apple-system, sans-serif"
      font-size="24"
      font-weight="600"
      text-anchor="middle"
    >swift emerald cutting arc.</text>
  </g>

  <!-- =================================================================== -->
  <!-- 8. BOTTOM FOOTER: Stat / Tag (MELEE) & Level Badge                  -->
  <!-- =================================================================== -->
  <line
    x1="56"
    y1="910"
    x2="664"
    y2="910"
    stroke="#2D1E2F"
    stroke-opacity="0.18"
    stroke-width="4"
  />

  <g transform="translate(56, 946)">
    <!-- Stat / Tag: MELEE -->
    <text
      x="10"
      y="18"
      fill="#5C4760"
      font-family="system-ui, -apple-system, sans-serif"
      font-size="22"
      font-weight="bold"
      letter-spacing="3"
    >MELEE</text>

    <!-- Level Badge: Lv 1 -->
    <rect
      x="524"
      y="-8"
      width="84"
      height="38"
      rx="8"
      fill="#2D1E2F"
    />
    <text
      x="566"
      y="17"
      fill="#FDFFB6"
      font-family="system-ui, monospace"
      font-size="18"
      font-weight="bold"
      text-anchor="middle"
    >Lv 1</text>
  </g>
</svg>`;
}

// ============================================================================
// MAIN GENERATION RUNNER
// ============================================================================

async function main() {
  console.log('Writing Leaf Blade vector SVGs...');
  const spriteSvgPath = path.join(WEAPONS_OUT_DIR, 'leaf-blade-1024.svg');
  const cardSvgPath = path.join(WEAPONS_OUT_DIR, 'leaf-blade-card.svg');

  const spriteSvg = buildLeafBladeSpriteSvg();
  const cardSvg = buildLeafBladeTarotCardSvg();

  fs.writeFileSync(spriteSvgPath, spriteSvg, 'utf8');
  fs.writeFileSync(cardSvgPath, cardSvg, 'utf8');
  console.log(`Saved: ${spriteSvgPath}`);
  console.log(`Saved: ${cardSvgPath}`);

  // Rasterize to high-resolution PNG using resvg-js-cli
  console.log('Rasterizing SVG assets to crisp PNGs...');
  const spritePngPath = path.join(WEAPONS_OUT_DIR, 'leaf-blade-1024.png');
  const cardPngPath = path.join(WEAPONS_OUT_DIR, 'leaf-blade-card.png');

  try {
    execFileSync('npx', ['--yes', '@resvg/resvg-js-cli', spriteSvgPath, spritePngPath], {
      stdio: 'inherit',
    });
    console.log(`Successfully generated: ${spritePngPath}`);

    execFileSync('npx', ['--yes', '@resvg/resvg-js-cli', cardSvgPath, cardPngPath], {
      stdio: 'inherit',
    });
    console.log(`Successfully generated: ${cardPngPath}`);
  } catch (err) {
    console.error('Failed to rasterize with resvg-js-cli:', err);
    process.exit(1);
  }

  // Also create a copy in the artifact directory so the user can easily view and inspect both
  const ARTIFACT_DIR = path.resolve('/Users/degtyar/.gemini/antigravity/brain/b8b6024d-fbec-4a18-89b8-b06d4f84611a');
  fs.copyFileSync(spritePngPath, path.join(ARTIFACT_DIR, 'leaf-blade-1024.png'));
  fs.copyFileSync(cardPngPath, path.join(ARTIFACT_DIR, 'leaf-blade-card.png'));
  console.log('Copied rendered PNGs to artifact directory for presentation.');
}

if (process.argv[1] && process.argv[1].endsWith('generate-leaf-blade-assets.mjs')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
