import React, { useId } from 'react';

export interface MagnetMossIconProps {
  size?: number;
  className?: string;
  glowColor?: string;
  title?: string;
  viewBox?: string;
}

export const MagnetMossIcon = React.memo(function MagnetMossIcon({
  size = 96,
  className,
  glowColor = '#3DDC97',
  title = 'Magnet Moss',
  viewBox = '0 0 180 132',
}: MagnetMossIconProps) {
  const uid = useId().replace(/:/g, '');

  const ids = {
    skyGrad: `${uid}-sky-grad`,
    goldGrad: `${uid}-gold-grad`,
    auraGrad: `${uid}-aura-grad`,
    lodestoneGrad: `${uid}-lodestone-grad`,
    mossDeep: `${uid}-moss-deep`,
    mossBright: `${uid}-moss-bright`,
    mossCore: `${uid}-moss-core`,
    gemGold: `${uid}-gem-gold`,
    gemCyan: `${uid}-gem-cyan`,
    gemRose: `${uid}-gem-rose`,
    gemViolet: `${uid}-gem-violet`,
    archClip: `${uid}-arch-clip`,
  };

  return (
    <svg
      viewBox={viewBox}
      width={size}
      height={size ? Math.round((size * 132) / 180) : undefined}
      role="img"
      aria-label={title ?? 'Magnet Moss'}
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

        {/* Magnetic Glow Aura */}
        <radialGradient id={ids.auraGrad} cx="50%" cy="54%" r="48%">
          <stop offset="0%" stopColor={glowColor} stopOpacity="0.52" />
          <stop offset="52%" stopColor={glowColor} stopOpacity="0.18" />
          <stop offset="100%" stopColor="#150E18" stopOpacity="0" />
        </radialGradient>

        {/* Natural Magnetic Lodestone Mineral Gradient */}
        <linearGradient id={ids.lodestoneGrad} x1="20%" y1="0%" x2="80%" y2="100%">
          <stop offset="0%" stopColor="#4A3B52" />
          <stop offset="40%" stopColor="#2C2133" />
          <stop offset="85%" stopColor="#19121E" />
          <stop offset="100%" stopColor="#0F0A13" />
        </linearGradient>

        {/* Lush Emerald & Mint Moss Gradients */}
        <linearGradient id={ids.mossDeep} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="40%" stopColor="#10B981" />
          <stop offset="80%" stopColor="#047857" />
          <stop offset="100%" stopColor="#064E3B" />
        </linearGradient>
        <linearGradient id={ids.mossBright} x1="10%" y1="0%" x2="90%" y2="100%">
          <stop offset="0%" stopColor="#F0FDF4" />
          <stop offset="30%" stopColor="#A8E6CF" />
          <stop offset="70%" stopColor={glowColor} />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <radialGradient id={ids.mossCore} cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#FDFFB6" />
          <stop offset="35%" stopColor="#A8E6CF" />
          <stop offset="75%" stopColor={glowColor} />
          <stop offset="100%" stopColor="#065F46" />
        </radialGradient>

        {/* Orbiting Attracted Crystal Gem Gradients */}
        <linearGradient id={ids.gemGold} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FEF08A" />
          <stop offset="50%" stopColor="#EAB308" />
          <stop offset="100%" stopColor="#A16207" />
        </linearGradient>
        <linearGradient id={ids.gemCyan} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="45%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id={ids.gemRose} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFE4E6" />
          <stop offset="50%" stopColor="#FB7185" />
          <stop offset="100%" stopColor="#BE123C" />
        </linearGradient>
        <linearGradient id={ids.gemViolet} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FAF5FF" />
          <stop offset="45%" stopColor="#DDD6FE" />
          <stop offset="82%" stopColor="#A855F7" />
          <stop offset="100%" stopColor="#581C87" />
        </linearGradient>

        {/* Arch Clip Path matching other cards */}
        <clipPath id={ids.archClip}>
          <path d="M 10,126 L 10,56 A 80,50 0 0,1 170,56 L 170,126 Z" />
        </clipPath>
      </defs>

      {/* Arched Vintage Tarot Window Background (Exact same shape as other cards use) */}
      <path
        d="M 10,126 L 10,56 A 80,50 0 0,1 170,56 L 170,126 Z"
        fill={`url(#${ids.skyGrad})`}
        stroke="#2D1E2F"
        strokeWidth="3.5"
      />

      {/* Ambient Radial Nebula Halo */}
      <circle cx="90" cy="68" r="56" fill={`url(#${ids.auraGrad})`} />

      {/* Sacred Geometry Rays behind Subject */}
      <g stroke={glowColor} strokeWidth="0.9" opacity="0.24">
        <line x1="90" y1="16" x2="90" y2="120" />
        <line x1="28" y1="68" x2="152" y2="68" />
        <line x1="46" y1="28" x2="134" y2="108" />
        <line x1="134" y1="28" x2="46" y2="108" />
      </g>

      {/* Inner Gilded Tarot Arch Line (Exact same shape and dashed gold border as other cards use) */}
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
      <path d="M 22,114 C 22,102 30,98 38,104 C 30,108 26,112 22,114 Z" fill={`url(#${ids.mossDeep})`} opacity="0.65" />
      <path d="M 158,114 C 158,102 150,98 142,104 C 150,108 154,112 158,114 Z" fill={`url(#${ids.mossDeep})`} opacity="0.65" />
      <polygon points="34,34 36,39 41,41 36,43 34,48 32,43 27,41 32,39" fill={`url(#${ids.goldGrad})`} opacity="0.9" />
      <polygon points="146,34 148,39 153,41 148,43 146,48 144,43 139,41 144,39" fill={`url(#${ids.goldGrad})`} opacity="0.9" />
      <circle cx="26" cy="84" r="1.8" fill="#FFFDF0" opacity="0.65" />
      <circle cx="154" cy="84" r="1.8" fill="#FFFDF0" opacity="0.65" />

      {/* Magnetic Artwork Content Clipped to Arch */}
      <g clipPath={`url(#${ids.archClip})`}>
        {/* Curving Magnetic Dipole Flux Loops (North/South Attraction) */}
        <path
          d="M 68,82 C 38,70 38,36 72,24 C 84,20 96,20 108,24 C 142,36 142,70 112,82"
          fill="none"
          stroke={glowColor}
          strokeWidth="1.6"
          strokeDasharray="4 3.5"
          opacity="0.8"
        />
        <path
          d="M 74,90 C 52,82 50,44 80,34 C 87,31 93,31 100,34 C 130,44 128,82 106,90"
          fill="none"
          stroke={glowColor}
          strokeWidth="1.2"
          strokeDasharray="3 3"
          opacity="0.65"
        />

        {/* Magnetic Sparkle Trails / Tiny Field Dots */}
        <g fill={glowColor} opacity="0.85">
          <circle cx="56" cy="50" r="1.5" />
          <circle cx="64" cy="38" r="1.3" />
          <circle cx="78" cy="27" r="1.4" />
          <circle cx="102" cy="27" r="1.4" />
          <circle cx="116" cy="38" r="1.3" />
          <circle cx="124" cy="50" r="1.5" />
          <circle cx="48" cy="70" r="1.2" />
          <circle cx="132" cy="70" r="1.2" />
        </g>

        {/* Central Subject: Natural Lodestone Mineral Base with Angular Facets */}
        <g stroke="#2D1E2F" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          {/* Lodestone Rock Formations */}
          <polygon points="72,94 90,103 108,93 118,76 110,60 90,55 70,61 62,77" fill={`url(#${ids.lodestoneGrad})`} />
          <polygon points="90,55 70,61 76,80 90,75" fill="#382942" strokeWidth="1.4" />
          <polygon points="90,55 110,60 104,79 90,75" fill="#24192B" strokeWidth="1.4" />
          <polygon points="70,61 62,77 76,80" fill="#1C1322" strokeWidth="1.4" />
          <polygon points="110,60 118,76 104,79" fill="#180F1E" strokeWidth="1.4" />
          <polygon points="76,80 90,75 90,103 72,94" fill="#2E2036" strokeWidth="1.4" />
          <polygon points="104,79 90,75 90,103 108,93" fill="#1B1223" strokeWidth="1.4" />

          {/* Specular Highlights on Lodestone Mineral Ridges */}
          <line x1="90" y1="55" x2="90" y2="75" stroke="#93C5FD" strokeWidth="1.5" opacity="0.65" />
          <line x1="90" y1="75" x2="90" y2="103" stroke={glowColor} strokeWidth="1.4" opacity="0.7" />
          <line x1="90" y1="55" x2="110" y2="60" stroke="#FFFDF0" strokeWidth="1.2" opacity="0.5" />

          {/* Overgrown Velvet Moss Cushions Intertwined on the Lodestone */}
          <path
            d="M 59,81 C 55,72 61,63 71,63 C 74,55 84,53 89,58 C 93,52 104,52 108,59 C 117,56 127,65 124,76 C 130,85 121,97 111,95 C 104,101 94,103 88,98 C 80,102 69,98 65,90 C 57,90 55,83 59,81 Z"
            fill={`url(#${ids.mossDeep})`}
          />
          <path
            d="M 66,77 C 63,70 69,63 77,63 C 80,56 89,54 95,58 C 100,53 110,54 113,61 C 121,61 125,71 121,78 C 124,86 116,93 108,91 C 102,96 92,96 87,91 C 79,94 71,89 70,83 C 63,82 63,78 66,77 Z"
            fill={`url(#${ids.mossBright})`}
          />

          {/* Center Luminescent Moss Nucleus / Spore Nodes */}
          <circle cx="90" cy="71" r="14" fill={`url(#${ids.mossCore})`} />
          <circle cx="78" cy="76" r="9" fill={`url(#${ids.mossBright})`} />
          <circle cx="102" cy="75" r="9.5" fill={`url(#${ids.mossBright})`} />
          <circle cx="89" cy="84" r="8" fill={`url(#${ids.mossDeep})`} />
          <circle cx="84" cy="64" r="7.5" fill={`url(#${ids.mossBright})`} />
          <circle cx="97" cy="65" r="7" fill={`url(#${ids.mossCore})`} />

          {/* Organic Moss Tuft Creases & Botanical Texture */}
          <path d="M 84,67 Q 87,71 90,71" fill="none" stroke="#064E3B" strokeWidth="1.4" />
          <path d="M 93,69 Q 96,73 99,72" fill="none" stroke="#064E3B" strokeWidth="1.3" />
          <path d="M 77,74 Q 80,78 84,77" fill="none" stroke="#064E3B" strokeWidth="1.3" />
          <path d="M 91,78 Q 94,82 98,81" fill="none" stroke="#064E3B" strokeWidth="1.3" />

          {/* Glowing Luminescent Spore Dewdrops */}
          <circle cx="86" cy="66" r="1.8" fill="#FFFDF0" stroke="none" />
          <circle cx="94" cy="68" r="1.6" fill="#FFFDF0" stroke="none" />
          <circle cx="81" cy="74" r="1.4" fill="#FFFDF0" stroke="none" />
          <circle cx="99" cy="72" r="1.4" fill="#FFFDF0" stroke="none" />
          <circle cx="89" cy="80" r="1.2" fill="#FDFFB6" stroke="none" />
          <circle cx="73" cy="70" r="1.1" fill="#FFFDF0" stroke="none" />
          <circle cx="106" cy="69" r="1.1" fill="#FFFDF0" stroke="none" />
          <circle cx="84" cy="89" r="1.1" fill="#FDFFB6" stroke="none" />

          {/* Orbiting Attracted Crystal Gems (Drawn toward the Moss Core) */}
          {/* Top Sacred Rose Crystal */}
          <polygon points="90,19 95,25 90,31 85,25" fill={`url(#${ids.gemRose})`} />
          <circle cx="88.5" cy="23" r="1" fill="#FFFDF0" stroke="none" />

          {/* Left Golden Sun Quartz */}
          <polygon points="46,54 52,60 46,66 40,60" fill={`url(#${ids.gemGold})`} />
          <circle cx="44.5" cy="58" r="1" fill="#FFFDF0" stroke="none" />

          {/* Right Astral Sky Cyan Gem */}
          <polygon points="134,55 140,61 134,67 128,61" fill={`url(#${ids.gemCyan})`} />
          <circle cx="132.5" cy="59" r="1" fill="#FFFDF0" stroke="none" />

          {/* Bottom-Left Emerald Shard */}
          <polygon points="50,92 55,97 50,102 45,97" fill={`url(#${ids.mossBright})`} />
          <circle cx="49" cy="95" r="0.9" fill="#FFFDF0" stroke="none" />

          {/* Bottom-Right Amethyst Crystal */}
          <polygon points="130,93 135,98 130,103 125,98" fill={`url(#${ids.gemViolet})`} />
          <circle cx="128.5" cy="96" r="0.9" fill="#FFFDF0" stroke="none" />
        </g>

        {/* Inward Attraction Sparkle Vectors (Motion Lines) */}
        <g stroke="#FFFDF0" strokeWidth="1" strokeLinecap="round" opacity="0.75">
          <line x1="90" y1="33" x2="90" y2="40" strokeDasharray="1.5 2" />
          <line x1="55" y1="63" x2="62" y2="66" strokeDasharray="1.5 2" />
          <line x1="125" y1="63" x2="118" y2="66" strokeDasharray="1.5 2" />
          <line x1="56" y1="94" x2="62" y2="90" strokeDasharray="1.5 2" />
          <line x1="124" y1="94" x2="118" y2="90" strokeDasharray="1.5 2" />
        </g>
      </g>
    </svg>
  );
});
