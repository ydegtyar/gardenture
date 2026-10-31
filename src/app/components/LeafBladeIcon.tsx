import React, { useId } from 'react';

export interface LeafBladeIconProps {
  size?: number;
  className?: string;
  glowColor?: string;
  title?: string;
  viewBox?: string;
}

export const LeafBladeIcon = React.memo(function LeafBladeIcon({
  size = 96,
  className,
  glowColor = '#7be0a8',
  title = 'Leaf Blade',
  viewBox = '0 0 180 132',
}: LeafBladeIconProps) {
  const uid = useId().replace(/:/g, '');

  const ids = {
    skyGrad: `${uid}-sky-grad`,
    goldGrad: `${uid}-gold-grad`,
    auraGrad: `${uid}-aura-grad`,
    archClip: `${uid}-arch-clip`,
  };

  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size ? Math.round((size * 132) / 180) : undefined}
      role="img"
      aria-label={title ?? 'Leaf Blade'}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        {/* Background Arch Sky Gradient (Matching Card Sky) */}
        <linearGradient id={ids.skyGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#342539" />
          <stop offset="55%" stopColor="#221827" />
          <stop offset="100%" stopColor="#150E18" />
        </linearGradient>

        {/* Sunlit Gold Gradient for Frame & Highlights */}
        <linearGradient id={ids.goldGrad} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFDF5" />
          <stop offset="38%" stopColor="#FDE047" />
          <stop offset="78%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>

        {/* Soft Pastel Radial Glow Aura matching other cards */}
        <radialGradient id={ids.auraGrad} cx="50%" cy="52%" r="48%">
          <stop offset="0%" stopColor={glowColor} stopOpacity="0.52" />
          <stop offset="52%" stopColor={glowColor} stopOpacity="0.18" />
          <stop offset="100%" stopColor="#150E18" stopOpacity="0" />
        </radialGradient>

        {/* Arch Clip Path matching other cards */}
        <clipPath id={ids.archClip}>
          <path d="M 10,126 L 10,56 A 80,50 0 0,1 170,56 L 170,126 Z" />
        </clipPath>
      </defs>

      {/* Arched Vintage Tarot Window Background */}
      <path
        d="M 10,126 L 10,56 A 80,50 0 0,1 170,56 L 170,126 Z"
        fill={`url(#${ids.skyGrad})`}
        stroke="#2D1E2F"
        strokeWidth="3.5"
      />

      {/* Ambient Radial Nebula Halo Backdrop */}
      <circle cx="90" cy="68" r="56" fill={`url(#${ids.auraGrad})`} />

      {/* Sacred Geometry Rays behind Subject */}
      <g stroke={glowColor} strokeWidth="0.9" opacity="0.24">
        <line x1="90" y1="16" x2="90" y2="120" />
        <line x1="28" y1="68" x2="152" y2="68" />
        <line x1="46" y1="28" x2="134" y2="108" />
        <line x1="134" y1="28" x2="46" y2="108" />
      </g>

      {/* Inner Gilded Tarot Arch Line */}
      <path
        d="M 16,120 L 16,58 A 74,44 0 0,1 164,58 L 164,120 Z"
        fill="none"
        stroke={`url(#${ids.goldGrad})`}
        strokeWidth="1.35"
        strokeDasharray="4 2.5"
        opacity="0.78"
      />

      {/* Concentric Celestial Halo Rings */}
      <circle cx="90" cy="68" r="39" fill="none" stroke={`url(#${ids.goldGrad})`} strokeWidth="1.2" opacity="0.45" />
      <circle cx="90" cy="68" r="29" fill={glowColor} opacity="0.16" />
      <circle cx="90" cy="68" r="29" fill="none" stroke={glowColor} strokeWidth="1" strokeDasharray="2 3" opacity="0.5" />

      {/* Corner Botanical Filigree & Four-Point Stars */}
      <path d="M 22,114 C 22,102 30,98 38,104 C 30,108 26,112 22,114 Z" fill="#4fb67f" opacity="0.65" />
      <path d="M 158,114 C 158,102 150,98 142,104 C 150,108 154,112 158,114 Z" fill="#4fb67f" opacity="0.65" />
      <polygon points="34,34 36,39 41,41 36,43 34,48 32,43 27,41 32,39" fill={`url(#${ids.goldGrad})`} opacity="0.9" />
      <polygon points="146,34 148,39 153,41 148,43 146,48 144,43 139,41 144,39" fill={`url(#${ids.goldGrad})`} opacity="0.9" />

      {/* Artwork Content Clipped to Arch Window */}
      <g clipPath={`url(#${ids.archClip})`}>
        {/* Soft circular pastel glow backdrop */}
        <circle cx="90" cy="66" r="34" fill={glowColor} opacity="0.28" stroke="none" />

        {/* =============================================================== */}
        {/* LEAF BLADE: Shown at slight diagonal (~26°), centered in window */}
        {/* Thick dark plum-navy outline (#2a1f33), flat cel-shaded fills   */}
        {/* =============================================================== */}
        <g transform="translate(90, 68) rotate(26) scale(0.68) translate(-90, -68)">
          {/* Golden Pommel */}
          <circle cx="90" cy="116" r="6" fill="#f8d558" stroke="#2a1f33" strokeWidth="2.8" />
          <circle cx="88" cy="114" r="2" fill="#FFFDF0" />

          {/* Brown Wrapped Handle */}
          <rect x="85" y="96" width="10" height="15" rx="3" fill="#7a482b" stroke="#2a1f33" strokeWidth="2.8" />
          <line x1="85" y1="100" x2="95" y2="103" stroke="#4a2612" strokeWidth="2" strokeLinecap="round" />
          <line x1="85" y1="105" x2="95" y2="108" stroke="#4a2612" strokeWidth="2" strokeLinecap="round" />

          {/* Golden Crossguard with Tiny Leaf Gem */}
          <path
            d="M 68 96
               C 76 91 85 93 90 95
               C 95 93 104 91 112 96
               C 109 101 98 100 90 99
               C 82 100 71 101 68 96 Z"
            fill="#f8d558"
            stroke="#2a1f33"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          {/* Tiny Center Leaf Gem */}
          <path
            d="M 90 93 C 92 95 92 97 90 98 C 88 97 88 95 90 93 Z"
            fill="#7be0a8"
            stroke="#2a1f33"
            strokeWidth="1.4"
          />

          {/* Single Broad Leaf Blade (Smooth curves, no serrations) */}
          {/* Right / Shaded Lower Edge (#4fb67f) */}
          <path
            d="M 90 22
               C 106 38 116 56 116 72
               C 116 88 103 94 90 97
               Z"
            fill="#4fb67f"
            stroke="#2a1f33"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          {/* Left / Main Mint Green Fill (#7be0a8) */}
          <path
            d="M 90 22
               C 74 38 64 56 64 72
               C 64 88 77 94 90 97
               Z"
            fill="#7be0a8"
            stroke="#2a1f33"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />

          {/* Highlight stripe along upper mint facet */}
          <path
            d="M 88 32
               C 78 44 72 58 72 72
               C 72 79 74 85 78 90
               C 75 84 74 78 74 72
               C 74 60 79 48 88 32 Z"
            fill="#e2f8eb"
            opacity="0.6"
          />

          {/* Central Pale-Green Midrib Line (#e2f8eb) */}
          <line x1="90" y1="26" x2="90" y2="94" stroke="#e2f8eb" strokeWidth="2.4" strokeLinecap="round" />

          {/* Short Side Veins (#e2f8eb) */}
          <path d="M 90 48 C 95 44 100 42 105 40" stroke="#e2f8eb" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M 90 66 C 85 62 80 60 75 58" stroke="#e2f8eb" strokeWidth="1.8" strokeLinecap="round" />
        </g>
      </g>
    </svg>
  );
});
