/**
 * @file MenuVisualsSvg.tsx
 * Self-contained bespoke SVG emblems and ornaments for the isolated Menu UI.
 * Zero imports from game logic or shared app components.
 */

import React from 'react';

export const MenuCoinIconSvg: React.FC<{ className?: string }> = ({
  className = 'w-5 h-5',
}) => (
  <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
    <defs>
      <radialGradient id="menu-coin-grad" cx="0.35" cy="0.3" r="0.7">
        <stop offset="0%" stopColor="#FFF7C2" />
        <stop offset="50%" stopColor="#F4C44E" />
        <stop offset="100%" stopColor="#A8741A" />
      </radialGradient>
    </defs>
    <circle
      cx="12"
      cy="12"
      r="10"
      fill="url(#menu-coin-grad)"
      stroke="#3A2608"
      strokeWidth="1.6"
    />
    <circle
      cx="12"
      cy="12"
      r="7.4"
      fill="none"
      stroke="#FFF3B0"
      strokeOpacity="0.65"
      strokeWidth="1"
    />
    <text
      x="12"
      y="16"
      textAnchor="middle"
      fill="#5C3B09"
      fontSize="11.5"
      fontWeight="900"
      fontFamily="serif"
    >
      $
    </text>
  </svg>
);

export const MenuCrystalIconSvg: React.FC<{ className?: string }> = ({
  className = 'w-5 h-5',
}) => (
  <svg viewBox="0 0 24 26" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="menu-crystal-left" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="55%" stopColor="#BCEBFF" />
        <stop offset="100%" stopColor="#63B4E8" />
      </linearGradient>
      <linearGradient id="menu-crystal-right" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#9BDDFB" />
        <stop offset="55%" stopColor="#4EA3DF" />
        <stop offset="100%" stopColor="#26649E" />
      </linearGradient>
    </defs>
    {/* Outer diamond silhouette */}
    <polygon
      points="12,1 21,11 12,25 3,11"
      fill="url(#menu-crystal-right)"
      stroke="#1A2C42"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
    {/* Left sunlit facet */}
    <polygon points="12,1 12,25 3,11" fill="url(#menu-crystal-left)" />
    {/* Top crown facet */}
    <polygon points="12,1 17,11 12,14 7,11" fill="#E8F8FF" fillOpacity="0.8" />
    {/* Specular highlight line */}
    <polyline
      points="7,11 12,14 17,11"
      fill="none"
      stroke="#FFFFFF"
      strokeWidth="1.1"
    />
  </svg>
);

export const MenuStarIconSvg: React.FC<{ className?: string }> = ({
  className = 'w-3.5 h-3.5',
}) => (
  <svg
    viewBox="0 0 24 24"
    className={className}
    fill="currentColor"
    aria-hidden="true"
  >
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

/**
 * Faceted ice-blue crystal cluster perched on the top-right corner of the Start Run button.
 */
export const MenuStartCornerCrystalSvg: React.FC<{ className?: string }> = ({
  className = 'w-8 h-8',
}) => (
  <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
    <defs>
      <linearGradient id="corner-crys-main" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="45%" stopColor="#B8E8FF" />
        <stop offset="100%" stopColor="#4998D4" />
      </linearGradient>
      <linearGradient id="corner-crys-shade" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#8ED4F8" />
        <stop offset="100%" stopColor="#245C8F" />
      </linearGradient>
    </defs>
    {/* Secondary angled crystal shard */}
    <g transform="translate(22, 19) rotate(28)">
      <polygon
        points="0,-11 6,-2 3,9 -4,9 -6,-2"
        fill="url(#corner-crys-shade)"
        stroke="#1E2D3D"
        strokeWidth="1.4"
      />
      <polygon points="0,-11 -6,-2 -2,9 0,9" fill="#E0F6FF" fillOpacity="0.85" />
    </g>
    {/* Primary crystal spire */}
    <g transform="translate(15, 17) rotate(-12)">
      <polygon
        points="0,-14 8,-3 5,12 -5,12 -8,-3"
        fill="url(#corner-crys-main)"
        stroke="#1A2838"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <polygon points="0,-14 8,-3 2,12 0,12" fill="url(#corner-crys-shade)" />
      <polygon points="0,-14 4,-3 0,2 -4,-3" fill="#FFFFFF" fillOpacity="0.9" />
    </g>
  </svg>
);

/**
 * Decorative emerald leaves & vine frame for the Resume Run button.
 */
export const MenuResumeVineOverlaySvg: React.FC = () => (
  <svg
    viewBox="0 0 220 68"
    preserveAspectRatio="none"
    className="absolute inset-0 w-full h-full pointer-events-none overflow-visible"
    aria-hidden="true"
  >
    {/* Top-left leaf cluster */}
    <g transform="translate(8, 6)">
      <path
        d="M-6 12 C-8 2, 2 -6, 14 -4 C10 4, 2 10, -6 12 Z"
        fill="#44B869"
        stroke="#11331F"
        strokeWidth="1.6"
      />
      <path d="M-4 10 C2 4, 7 0, 12 -2" stroke="#9BF5B4" strokeWidth="1" fill="none" />
    </g>
    {/* Top-right leaf cluster */}
    <g transform="translate(196, 4)">
      <path
        d="M0 -4 C12 -6, 22 2, 20 14 C10 12, 4 4, 0 -4 Z"
        fill="#44B869"
        stroke="#11331F"
        strokeWidth="1.6"
      />
      <path
        d="M18 10 C24 12, 26 20, 20 26 C14 20, 14 14, 18 10 Z"
        fill="#2E9450"
        stroke="#11331F"
        strokeWidth="1.4"
      />
    </g>
    {/* Bottom-left leaf cluster */}
    <g transform="translate(6, 54)">
      <path
        d="M-6 -8 C-10 2, -2 12, 12 10 C6 2, 0 -2, -6 -8 Z"
        fill="#39A35B"
        stroke="#11331F"
        strokeWidth="1.6"
      />
      <path
        d="M8 8 C14 14, 24 14, 28 8 C20 4, 14 4, 8 8 Z"
        fill="#4CC472"
        stroke="#11331F"
        strokeWidth="1.4"
      />
    </g>
    {/* Bottom-right leaf cluster */}
    <g transform="translate(202, 54)">
      <path
        d="M16 -6 C20 4, 12 12, -2 10 C4 4, 10 -2, 16 -6 Z"
        fill="#39A35B"
        stroke="#11331F"
        strokeWidth="1.6"
      />
    </g>
  </svg>
);

/**
 * Ornate Vine-Wrapped Botanical Crest Lockup for "GARDENTURE: Mystic Garden Adventure!"
 * - Uses generated PNG background with leaves, thorns, carved stone C-scrolls, and dashed emerald stitching (`/assets/menu/gardenture_crest_bg.png`)
 * - Renders `GARDENTURE` in an opaque, ultra-bold, soft-rounded serif with multi-layer soft 3D extrusion & pillow bevels
 * - Renders an arched coral-pink ribbon container and arched `"Mystic Garden Adventure!"` `<textPath>`
 * - Places a radiant glowing CSS/SVG 3D star above the crest arch
 */
export const MenuTitleCrestSvg: React.FC<{ className?: string }> = ({
  className = 'w-full max-w-[540px]',
}) => (
  <svg
    viewBox="0 -44 1272 436"
    className={`${className} overflow-visible`}
    style={{ overflow: 'visible' }}
    role="img"
    aria-label="Gardenture: Mystic Garden Adventure!"
  >
    <defs>
      {/* Radiant multi-stop glow behind and around the top star */}
      <radialGradient id="menu-star-glow-outer" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor="#FFFDE6" stopOpacity="0.95" />
        <stop offset="35%" stopColor="#FFE875" stopOpacity="0.62" />
        <stop offset="68%" stopColor="#86EFAC" stopOpacity="0.24" />
        <stop offset="100%" stopColor="#86EFAC" stopOpacity="0" />
      </radialGradient>

      {/* Soft golden-lime light cast by the star onto the top of the plaque & D/E letters */}
      <radialGradient id="menu-star-plaque-wash" cx="0.5" cy="0.38" r="0.48">
        <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.42" />
        <stop offset="50%" stopColor="#6EE7B7" stopOpacity="0.16" />
        <stop offset="100%" stopColor="#34D399" stopOpacity="0" />
      </radialGradient>

      {/* 3D Star Facet Gradients */}
      <linearGradient id="menu-star-main-fill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="42%" stopColor="#FFF59E" />
        <stop offset="100%" stopColor="#F2B829" />
      </linearGradient>
      <linearGradient id="menu-star-shade-facet" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#FDE047" />
        <stop offset="100%" stopColor="#CA8A04" />
      </linearGradient>

      {/* Opaque Creamy-White to Soft-Mint Face Gradient for GARDENTURE */}
      <linearGradient id="menu-title-face-grad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="52%" stopColor="#F8FFF5" />
        <stop offset="84%" stopColor="#E6F8E3" />
        <stop offset="100%" stopColor="#D3EED0" />
      </linearGradient>

      {/* Soft 3D Lower Bevel / Extrusion Gradient for GARDENTURE */}
      <linearGradient id="menu-title-3d-bevel" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#9EC4A4" />
        <stop offset="55%" stopColor="#689173" />
        <stop offset="100%" stopColor="#3B5B45" />
      </linearGradient>

      {/* Arched Coral-Pink Ribbon Fill & 3D Bevel Gradients */}
      <linearGradient id="menu-ribbon-fill" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#F09399" />
        <stop offset="20%" stopColor="#FAA6AC" />
        <stop offset="50%" stopColor="#FFB5B9" />
        <stop offset="80%" stopColor="#FAA6AC" />
        <stop offset="100%" stopColor="#F09399" />
      </linearGradient>
      <linearGradient id="menu-ribbon-3d-edge" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#C86871" />
        <stop offset="50%" stopColor="#E07E86" />
        <stop offset="100%" stopColor="#C86871" />
      </linearGradient>

      {/* Soft 3D Drop Shadow Filter for GARDENTURE Letters */}
      <filter id="menu-title-soft-shadow" x="-10%" y="-15%" width="120%" height="140%">
        <feDropShadow dx="0" dy="9" stdDeviation="4.5" floodColor="#0A1910" floodOpacity="0.72" />
      </filter>

      {/* Soft 3D Inner Pillow Blur Filter for Star & Letters */}
      <filter id="menu-soft-3d-inner" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="2.8" />
      </filter>

      {/* Drop shadow for the Arched Ribbon Banner */}
      <filter id="menu-ribbon-shadow" x="-20%" y="-20%" width="140%" height="180%">
        <feDropShadow dx="0" dy="8" stdDeviation="5" floodColor="#08030C" floodOpacity="0.78" />
      </filter>

      {/* Upward Convex Arc Path for "Mystic Garden Adventure!" Text */}
      <path id="menu-mystic-arc-path" d="M 346 316 Q 630 280 914 316" fill="none" />
    </defs>

    {/* 1. Generated PNG Botanical Background with Leaves, Thorns, Stone C-Scrolls & Dashed Plaque */}
    <image
      href="/assets/menu/gardenture_crest_bg.png"
      x="0"
      y="6"
      width="1272"
      height="366"
      preserveAspectRatio="xMidYMid meet"
    />

    {/* Subtle warm starlight wash over the top-center of the emerald plaque */}
    <ellipse cx="631" cy="112" rx="175" ry="76" fill="url(#menu-star-plaque-wash)" />

    {/* 2. Opaque Ultra-Bold "GARDENTURE" Title with Soft 3D Effect */}
    <g filter="url(#menu-title-soft-shadow)" className="font-gardenture-3d">
      {/* Deep dark-forest 3D outer contour & bottom block shadow */}
      <text
        x="628"
        y="206.5"
        textAnchor="middle"
        fill="#142219"
        stroke="#142219"
        strokeWidth="19"
        strokeLinejoin="round"
        strokeLinecap="round"
        paintOrder="stroke fill"
        fontSize="102"
        fontWeight="900"
        letterSpacing="6.8"
      >
        GARDENTURE
      </text>
      <text
        x="628"
        y="200.5"
        textAnchor="middle"
        fill="#16261C"
        stroke="#16261C"
        strokeWidth="18"
        strokeLinejoin="round"
        strokeLinecap="round"
        paintOrder="stroke fill"
        fontSize="102"
        fontWeight="900"
        letterSpacing="6.8"
      >
        GARDENTURE
      </text>

      {/* Soft 3D Lower Extrusion Bevel (soft sage-emerald depth under every letter) */}
      <text
        x="628"
        y="205"
        textAnchor="middle"
        fill="url(#menu-title-3d-bevel)"
        stroke="url(#menu-title-3d-bevel)"
        strokeWidth="4.2"
        strokeLinejoin="round"
        strokeLinecap="round"
        paintOrder="stroke fill"
        fontSize="102"
        fontWeight="900"
        letterSpacing="6.8"
      >
        GARDENTURE
      </text>
      <text
        x="628"
        y="202"
        textAnchor="middle"
        fill="#B5D8BA"
        stroke="#92BC9A"
        strokeWidth="3.6"
        strokeLinejoin="round"
        strokeLinecap="round"
        paintOrder="stroke fill"
        fontSize="102"
        fontWeight="900"
        letterSpacing="6.8"
      >
        GARDENTURE
      </text>

      {/* Opaque Soft-Mint Cushion Rim of Letter Face */}
      <text
        x="628"
        y="198.5"
        textAnchor="middle"
        fill="url(#menu-title-face-grad)"
        stroke="#DCEFD9"
        strokeWidth="2.8"
        strokeLinejoin="round"
        strokeLinecap="round"
        paintOrder="stroke fill"
        fontSize="102"
        fontWeight="900"
        letterSpacing="6.8"
      >
        GARDENTURE
      </text>

      {/* Soft 3D Pillow Core Highlight (pure creamy-white raised center on every stem) */}
      <text
        x="628"
        y="197.2"
        textAnchor="middle"
        fill="#FFFFFF"
        fontSize="102"
        fontWeight="900"
        letterSpacing="6.8"
      >
        GARDENTURE
      </text>
    </g>


    {/* 3. Arched Coral-Pink Ribbon Container & Arched "Mystic Garden Adventure!" Text */}
    <g filter="url(#menu-ribbon-shadow)">
      {/* Dark 3D outer border & lower extrusion of the arched capsule */}
      <path
        d="M 366 311 Q 630 275 894 311"
        fill="none"
        stroke="#1E1019"
        strokeWidth="84"
        strokeLinecap="round"
      />
      <path
        d="M 366 306 Q 630 270 894 306"
        fill="none"
        stroke="#271420"
        strokeWidth="80"
        strokeLinecap="round"
      />

      {/* Soft 3D lower inner bevel of the arched coral-pink container */}
      <path
        d="M 366 308 Q 630 272 894 308"
        fill="none"
        stroke="url(#menu-ribbon-3d-edge)"
        strokeWidth="67"
        strokeLinecap="round"
      />

      {/* Main Arched Coral-Pink Ribbon Body */}
      <path
        d="M 366 304 Q 630 268 894 304"
        fill="none"
        stroke="url(#menu-ribbon-fill)"
        strokeWidth="64"
        strokeLinecap="round"
      />

      {/* Subtle Soft-3D Top Arch Specular Highlight */}
      <path
        d="M 372 275 Q 630 240 888 275"
        fill="none"
        stroke="#FFDCE0"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeOpacity="0.78"
      />

      {/* Soft 3D Extrusion Highlight Under Arched Text */}
      <text
        fill="#FFD8DC"
        fillOpacity="0.55"
        fontSize="33.5"
        fontWeight="800"
        fontFamily='"Plus Jakarta Sans", sans-serif'
        letterSpacing="1.1"
        dy="2"
      >
        <textPath href="#menu-mystic-arc-path" startOffset="50%" textAnchor="middle">
          Mystic Garden Adventure!
        </textPath>
      </text>

      {/* Main Arched "Mystic Garden Adventure!" Text */}
      <text
        fill="#2B1924"
        stroke="#2B1924"
        strokeWidth="0.8"
        strokeLinejoin="round"
        fontSize="33.5"
        fontWeight="800"
        fontFamily='"Plus Jakarta Sans", sans-serif'
        letterSpacing="1.1"
      >
        <textPath href="#menu-mystic-arc-path" startOffset="50%" textAnchor="middle">
          Mystic Garden Adventure!
        </textPath>
      </text>
    </g>

    {/* Olive Vine Tendrils Flanking the Star Arch (matches the vine curve in reference) */}
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      <path
        d="M 555 58 C 578 52, 600 58, 616 68"
        stroke="#1C2217"
        strokeWidth="12"
      />
      <path
        d="M 555 58 C 578 52, 600 58, 616 68"
        stroke="#86A34B"
        strokeWidth="6.5"
      />
      <path
        d="M 652 62 C 674 68, 692 84, 712 94"
        stroke="#1C2217"
        strokeWidth="13"
      />
      <path
        d="M 652 62 C 674 68, 692 84, 712 94"
        stroke="#86A34B"
        strokeWidth="7"
      />
    </g>

    {/* 4. Glowing CSS/SVG Soft-3D Star Above the Crest */}
    <g transform="translate(631, 58)">
      {/* Pulsing CSS/SVG Radial Aura Halo */}
      <circle
        cx="0"
        cy="0"
        r="82"
        fill="url(#menu-star-glow-outer)"
        className="animate-menu-star-halo"
      />

      {/* Soft Starlight Cross-Flare Rays */}
      <g className="animate-menu-star-halo" opacity="0.68">
        <ellipse cx="0" cy="0" rx="62" ry="6" fill="#FFFBEB" opacity="0.45" />
        <ellipse cx="0" cy="0" rx="6" ry="58" fill="#FFFBEB" opacity="0.45" />
      </g>

      {/* Soft-3D Golden 5-Point Star */}
      <g className="animate-menu-star-core">
        {/* Outer Soft Bronze-Charcoal Border */}
        <polygon
          points="0,-53 15,-17 53,-14 23,10 33,47 0,26 -33,47 -23,10 -53,-14 -15,-17"
          fill="#33261A"
          stroke="#33261A"
          strokeWidth="6.5"
          strokeLinejoin="round"
        />

        {/* Lower Soft 3D Golden Bevel */}
        <polygon
          points="0,-49 14,-15 50,-12 21,11 31,45 0,25 -31,45 -21,11 -50,-12 -14,-15"
          fill="url(#menu-star-shade-facet)"
          stroke="#D99B1E"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />

        {/* Main Warm Golden-Cream 3D Star Cushion */}
        <polygon
          points="0,-51 14,-16.5 50,-14 21,9 31,43 0,23 -31,43 -21,9 -50,-14 -14,-16.5"
          fill="url(#menu-star-main-fill)"
          stroke="#FFF59E"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {/* Soft 3D Raised Inner Pillow Star Highlight */}
        <polygon
          points="0,-36 10,-11 35,-9 15,6 21,30 0,16 -21,30 -15,6 -35,-9 -10,-11"
          fill="#FFFFF2"
          opacity="0.88"
          filter="url(#menu-soft-3d-inner)"
        />

        {/* Radiant White-Gold Center Bloom */}
        <circle cx="0" cy="1" r="17" fill="#FFFFFF" opacity="0.92" filter="url(#menu-soft-3d-inner)" />
      </g>
    </g>
  </svg>
);

