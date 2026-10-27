/**
 * High-Resolution Cel-Shaded Sprite Atlas & Catalog Prompt Registry
 * Layer 6 (view): Implements the Master Art Style Guide and every Character, Profession,
 * Enemy Archetype, Special Monster, and Boss prompt from Game Elements Catalog (Sections 2 & 6).
 *
 * Bakes 24 distinct 256x256 top-down 3/4 cartoon sprites onto a single shared 2048x1536
 * GPU Texture atlas (1 draw call for all entities) and provides data-URL portraits for UI modals.
 */

import { Rectangle, Texture } from 'pixi.js';
import type { EnemyArchetypeId, ProfessionId, SpecialMonsterId } from '../content/schema/types';

export type SpriteKey =
  | 'hero_warden'
  | 'hero_seeker'
  | 'hero_herbalist'
  | 'hero_stormcaller'
  | 'skin_warden_zagreus_naruto'
  | 'skin_seeker_hollow_levi'
  | 'skin_herbalist_frieren_strange'
  | 'skin_stormcaller_gojo_killua'
  | 'enemy_chaser_norm'
  | 'enemy_chaser_elite'
  | 'enemy_dasher_norm'
  | 'enemy_dasher_elite'
  | 'enemy_spitter_norm'
  | 'enemy_spitter_elite'
  | 'enemy_brute_norm'
  | 'enemy_brute_elite'
  | 'enemy_splitter_norm'
  | 'enemy_splitter_elite'
  | 'enemy_shielded_norm'
  | 'enemy_shielded_elite'
  | 'special_golden_beast'
  | 'special_bloom_giant'
  | 'special_brood_mother'
  | 'special_mirror_wisp'
  | 'boss_moss_colossus'
  | 'boss_thornheart_p1'
  | 'boss_thornheart_p2'
  | 'boss_thornheart_p3';

/**
 * Exact canonical prompts from Game_Elements_Catalog.md (Sections 2 & 6) + Pop-Culture Arcana Skins.
 */
export const CATALOG_SPRITE_PROMPTS: Readonly<Record<SpriteKey, string>> = {
  hero_warden:
    'Stylized 2D cartoon guardian knight character sprite, top-down 3/4 mobile game view, carved birch wood bark armor, leafy emerald and mint shoulder pauldrons, sturdy stance, holding a leaf-shaped wooden sword, bold dark outlines, pastel green and soft bronze cel-shading, high contrast cute heroic character, isolated on pure white background.',
  hero_seeker:
    'Stylized 2D cartoon scout assassin character sprite, top-down 3/4 mobile game perspective, dynamic agile pose, hooded lavender and soft violet cloak, leather bandolier holding glowing pastel green seed daggers, swift boots, bold dark outlines, smooth cel-shading, high contrast whimsical fantasy rogue, isolated on pure white background.',
  hero_herbalist:
    'Stylized 2D cartoon herbalist apothecary character sprite, top-down 3/4 mobile game perspective, wide-brim straw hat with a blooming pastel pink daisy, sage green apron over cream tunic, pouch filled with glowing mint remedies, holding a small botanical pestle, bold dark outlines, warm pastel cel-shading, isolated on pure white background.',
  hero_stormcaller:
    'Stylized 2D cartoon lightning druid character sprite, top-down 3/4 mobile game view, floating ethereal pose, flowing sky-blue and lilac robes, glowing pastel electric runes on hands, leafy circlet sparking with tiny cartoon lightning sparks, bold dark outlines, vibrant high-contrast cel-shaded vector art, isolated on pure white background.',
  skin_warden_zagreus_naruto:
    'Pop-culture mashup character skin for Warden: Zagreus (Hades) × Naruto Uzumaki (Six Paths Sage Mode). Heterochromia eyes (left blazing Stygian blood-red, right verdant laurel-green with golden Toad-Sage pigment), spiky golden-and-crimson hair, Konoha metal headband entwined with Zagreus golden laurel wreath, three whisker marks on each cheek, chthonic skull pauldron over glowing Six-Paths orange chakra haori coat, leaving disappearing Hellfire footsteps.',
  skin_seeker_hollow_levi:
    'Pop-culture mashup character skin for Seeker: Pure Vessel / The Knight (Hollow Knight) × Levi Ackerman (Attack on Titan). Curved porcelain-white Hollow Knight horned shell mask with crimson Vizard war-stripes, one abyssal void eye and one blazing cyan Ackerman eye, emerald Survey Corps Wings of Freedom cloak over tattered midnight Mothwing coat, dual Pure-Nail Ultrahard Steel blades, leaving disappearing Void-Shade & ODM steam steps.',
  skin_herbalist_frieren_strange:
    'Pop-culture mashup character skin for Herbalist: Frieren (Beyond Journey’s End) × Doctor Strange × Edward Elric (Fullmetal Alchemist). Silver-white Frieren twin-tails and pointed elf ears, heterochromia teal-and-gold alchemist eyes, Doctor Strange crimson Cloak of Levitation with golden arcane collar, glowing emerald Eye of Agamotto amulet, gleaming silver Automail right arm holding a crescent eclipse staff, leaving disappearing Eldritch Transmutation runes.',
  skin_stormcaller_gojo_killua:
    'Pop-culture mashup character skin for Stormcaller (Thander Rein): Raiden (Mortal Kombat) × Thor Odinson (Marvel). Iconic wide conical woven bamboo/straw hat, flowing crimson-red Asgardian cloak with twin silver Mjolnir chest discs, dark blue thunder-god armor and white sash, levitating flight stance, and blazing cyan-white lightning eyes that leave electric light trails on movement.',
  enemy_chaser_norm:
    'Stylized 2D cartoon enemy sprite, top-down 3/4 mobile game perspective, skittering vine beast with four thorny branch legs, a snapping bulb maw with rose-thorn teeth, glowing yellow cartoon eyes, bold dark plum outlines, pastel olive and sage cel-shading, isolated on pure white background.',
  enemy_chaser_elite:
    'Stylized 2D cartoon enemy sprite, top-down 3/4 mobile game perspective, empowered skittering vine beast with floating pastel magenta runic horn crowns, luminous golden outline aura, four thorny branch legs, snapping bulb maw, bold dark plum outlines, isolated on pure white background.',
  enemy_dasher_norm:
    'Stylized 2D cartoon enemy sprite, top-down 3/4 game view, aggressive horned beetle monster with a polished chestnut shell, oversized forward-pointing pastel magenta ram horns, primed in a charging pose, bold dark outlines, smooth cel-shading, isolated on pure white background.',
  enemy_dasher_elite:
    'Stylized 2D cartoon enemy sprite, top-down 3/4 game view, empowered horned beetle monster with floating magenta runic horn crowns, golden aura, polished chestnut shell, oversized forward-pointing pastel magenta ram horns, bold dark outlines, isolated on pure white background.',
  enemy_spitter_norm:
    'Stylized 2D cartoon enemy sprite, top-down 3/4 view, plump pitcher plant monster with swollen cheeks preparing to fire, speckled pastel violet and mint skin, leafy base feet, bold dark plum outlines, vibrant cel-shaded mobile enemy, isolated on pure white background.',
  enemy_spitter_elite:
    'Stylized 2D cartoon enemy sprite, top-down 3/4 view, empowered plump pitcher plant monster with floating magenta runic horn crowns, golden aura, swollen cheeks preparing to fire, speckled pastel violet and mint skin, bold dark plum outlines, isolated on pure white background.',
  enemy_brute_norm:
    'Stylized 2D cartoon heavy enemy sprite, top-down 3/4 perspective, massive gentle-giant moss golem made of rounded river stones and fluffy pastel green moss, giant stone fists, glowing cyan eye slits, bold dark outlines, clean cel-shading, isolated on pure white background.',
  enemy_brute_elite:
    'Stylized 2D cartoon heavy enemy sprite, top-down 3/4 perspective, empowered massive moss golem with floating magenta runic horn crowns, golden aura, rounded river stones and fluffy pastel green moss, giant stone fists, bold dark outlines, isolated on pure white background.',
  enemy_splitter_norm:
    'Stylized 2D cartoon enemy sprite, top-down 3/4 view, bouncy pear-shaped slime bulb with translucent pastel peach jelly body, containing two visible smiling seed cores ready to divide, bold dark outlines, glossy cel-shading, isolated on pure white background.',
  enemy_splitter_elite:
    'Stylized 2D cartoon enemy sprite, top-down 3/4 view, empowered bouncy pear-shaped slime bulb with floating magenta runic horn crowns, golden aura, translucent pastel peach jelly body with two smiling seed cores, bold dark outlines, isolated on pure white background.',
  enemy_shielded_norm:
    'Stylized 2D cartoon enemy sprite, top-down 3/4 perspective, wooden clockwork sentry crouching behind an enormous curved tower shield made of carved oak bark with a carved eye crest, bold dark plum outlines, earthy pastel cel-shading, isolated on pure white background.',
  enemy_shielded_elite:
    'Stylized 2D cartoon enemy sprite, top-down 3/4 perspective, empowered wooden clockwork sentry with floating magenta runic horn crowns, golden aura, crouching behind an enormous curved oak bark tower shield, bold dark plum outlines, isolated on pure white background.',
  special_golden_beast:
    'Stylized 2D cartoon special monster sprite, top-down 3/4 view, swift fleeing magical fox creature made of radiant spun pastel gold wheat, glittering trail of golden sparkles and dropping coins, frightened cute expression, bold dark outlines, vibrant cel-shading, isolated on pure white background.',
  special_bloom_giant:
    'Stylized 2D cartoon special boss enemy sprite, top-down 3/4 view, hulking tree-trunk colossus with a giant blooming pastel sunflower for a head, charging forward with raised root arms, bold dark plum outlines, warm yellow and bark cel-shading, isolated on pure white background.',
  special_brood_mother:
    'Stylized 2D cartoon special monster sprite, top-down 3/4 view, floating maternal floral queen shaped like an elegant carved hanging gourd with orchid wings, tiny cute seedling babies peeking out, bold dark outlines, pastel lavender and mint cel-shading, isolated on pure white background.',
  special_mirror_wisp:
    'Stylized 2D cartoon special monster sprite, top-down 3/4 view, mischievous floating wisp creature with translucent gossamer wings, holding a glowing dewdrop mirror that refracts pastel rainbow light beams, bold dark plum outlines, magical cel-shading, isolated on pure white background.',
  boss_moss_colossus:
    'Stylized 2D cartoon mini-boss sprite, top-down 3/4 mobile game view, colossal ancient moss golem with cracked runic temple pillars embedded in its shoulders, smashing two enormous stone fists downward with shockwave dust clouds, bold dark outlines, rich pastel green and granite cel-shading, isolated on pure white background.',
  boss_thornheart_p1:
    'Stylized 2D cartoon main boss sprite, phase 1, top-down 3/4 mobile view, towering ancient tree god with an exposed glowing pastel emerald heart core, waving four massive thorny vine tentacles, glowing eyes in knotted bark, bold dark plum outlines, dramatic cel-shading, isolated on pure white background.',
  boss_thornheart_p2:
    'Stylized 2D cartoon main boss sprite, phase 2, top-down 3/4 view, enwrapped in glowing pastel magenta petals, radiant exposed crystal core firing a 360-degree burst of glowing botanical energy orbs, furious stylized expression, bold dark outlines, vibrant cel-shading, isolated on pure white background.',
  boss_thornheart_p3:
    'Stylized 2D cartoon main boss sprite, final phase, top-down 3/4 view, apex botanical overlord surrounded by a whirling barrier of glowing crimson thorn walls and dark purple petals, eyes radiating intense yellow light, bold dark plum outlines, extreme contrast cel-shading, isolated on pure white background.',
};

const CELL_SIZE = 256;
const ATLAS_COLS = 6;
const ATLAS_ROWS = 5;
const PLUM = '#2D1E2F';

const ALL_SPRITE_KEYS: readonly SpriteKey[] = [
  'hero_warden',
  'hero_seeker',
  'hero_herbalist',
  'hero_stormcaller',
  'skin_warden_zagreus_naruto',
  'skin_seeker_hollow_levi',
  'skin_herbalist_frieren_strange',
  'skin_stormcaller_gojo_killua',
  'enemy_chaser_norm',
  'enemy_chaser_elite',
  'enemy_dasher_norm',
  'enemy_dasher_elite',
  'enemy_spitter_norm',
  'enemy_spitter_elite',
  'enemy_brute_norm',
  'enemy_brute_elite',
  'enemy_splitter_norm',
  'enemy_splitter_elite',
  'enemy_shielded_norm',
  'enemy_shielded_elite',
  'special_golden_beast',
  'special_bloom_giant',
  'special_brood_mother',
  'special_mirror_wisp',
  'boss_moss_colossus',
  'boss_thornheart_p1',
  'boss_thornheart_p2',
  'boss_thornheart_p3',
];

let cachedTextures: Map<SpriteKey, Texture> | null = null;
const cachedPortraitUrls = new Map<SpriteKey, string>();
const cachedSilhouetteUrls = new Map<SpriteKey, string>();

// ============================================================================
// LOW-LEVEL CEL-SHADING & CARTOON VECTOR DRAWING PRIMITIVES
// ============================================================================

function fillAndStroke(
  ctx: CanvasRenderingContext2D,
  fillStyle: string,
  lineWidth = 7,
  strokeStyle = PLUM
): void {
  ctx.fillStyle = fillStyle;
  ctx.fill();
  ctx.lineWidth = lineWidth;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.strokeStyle = strokeStyle;
  ctx.stroke();
}

function drawCelCircle(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  baseColor: string,
  shadowColor: string,
  highlightColor: string,
  lineWidth = 7,
  strokeStyle = PLUM
): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = baseColor;
  ctx.fill();

  ctx.clip();
  // Bottom-right crescent shadow
  ctx.beginPath();
  ctx.arc(cx - r * 0.24, cy - r * 0.24, r * 1.05, 0, Math.PI * 2);
  ctx.rect(cx - r * 1.5, cy - r * 1.5, r * 3, r * 3);
  ctx.fillStyle = shadowColor;
  ctx.fill('evenodd');

  // Top-left specular highlight bean
  ctx.beginPath();
  ctx.ellipse(
    cx - r * 0.34,
    cy - r * 0.34,
    r * 0.28,
    r * 0.15,
    -Math.PI / 4,
    0,
    Math.PI * 2
  );
  ctx.fillStyle = highlightColor;
  ctx.fill();
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.lineWidth = lineWidth;
  ctx.strokeStyle = strokeStyle;
  ctx.stroke();
}

function drawStarGlint(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  color = '#FFFDF0'
): void {
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const rad = i % 2 === 0 ? r : r * 0.32;
    const a = (i * Math.PI) / 4;
    const x = cx + Math.cos(a) * rad;
    const y = cy + Math.sin(a) * rad;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawCuteEye(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  irisColor = PLUM,
  angryTilt = 0
): void {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy, r * 0.88, r, 0, 0, Math.PI * 2);
  ctx.fillStyle = irisColor;
  ctx.fill();

  // White specular catchlight
  ctx.beginPath();
  ctx.arc(cx - r * 0.28, cy - r * 0.3, r * 0.36, 0, Math.PI * 2);
  ctx.fillStyle = '#FFFDF0';
  ctx.fill();

  if (angryTilt !== 0) {
    ctx.beginPath();
    ctx.moveTo(cx - r * 1.15, cy - r * 0.95 - angryTilt * r);
    ctx.lineTo(cx + r * 1.15, cy - r * 0.95 + angryTilt * r);
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = PLUM;
    ctx.lineCap = 'round';
    ctx.stroke();
  }
  ctx.restore();
}

function drawLeafShape(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  angle: number,
  len: number,
  width: number,
  baseColor: string,
  veinColor: string,
  lineWidth = 6
): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(len * 0.45, -width, len, 0);
  ctx.quadraticCurveTo(len * 0.45, width, 0, 0);
  ctx.closePath();
  fillAndStroke(ctx, baseColor, lineWidth);

  // Center leaf vein
  ctx.beginPath();
  ctx.moveTo(len * 0.12, 0);
  ctx.lineTo(len * 0.84, 0);
  ctx.lineWidth = 3;
  ctx.strokeStyle = veinColor;
  ctx.stroke();
  ctx.restore();
}

function drawEliteCrownAndAura(ctx: CanvasRenderingContext2D): void {
  ctx.save();
  // Luminous golden/magenta outer aura ring
  ctx.beginPath();
  ctx.arc(128, 134, 96, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(251, 191, 36, 0.55)';
  ctx.lineWidth = 8;
  ctx.setLineDash([14, 10]);
  ctx.stroke();
  ctx.setLineDash([]);

  // Floating pastel magenta runic horn crowns above head (Section 6.7)
  for (const dir of [-1, 1]) {
    ctx.save();
    ctx.translate(128 + dir * 34, 34);
    ctx.rotate(dir * 0.25);
    ctx.beginPath();
    ctx.moveTo(0, 12);
    ctx.quadraticCurveTo(dir * 18, -6, dir * 8, -24);
    ctx.quadraticCurveTo(-dir * 4, -8, -dir * 8, 8);
    ctx.closePath();
    fillAndStroke(ctx, '#FFAAA6', 5, PLUM);
    ctx.restore();
  }

  // Center floating golden diamond sigil
  ctx.beginPath();
  ctx.moveTo(128, 12);
  ctx.lineTo(138, 26);
  ctx.lineTo(128, 40);
  ctx.lineTo(118, 26);
  ctx.closePath();
  fillAndStroke(ctx, '#FDFFB6', 4.5, PLUM);
  drawStarGlint(ctx, 128, 26, 7);
  ctx.restore();
}

// ============================================================================
// 2. CHARACTERS & PROFESSIONS (Sections 2.1 - 2.5)
// ============================================================================

function paintHeroWarden(ctx: CanvasRenderingContext2D, includeStaticLegs = true): void {
  // 2.2 Warden: Carved birch wood bark armor, leafy emerald/mint shoulder pauldrons,
  // hooded sage traveler cloak, holding leaf-shaped wooden broadsword
  if (includeStaticLegs) {
    // Boots
    for (const dx of [-24, 24]) {
      ctx.beginPath();
      ctx.roundRect(128 + dx - 14, 184, 28, 26, 12);
      fillAndStroke(ctx, '#8C5A3C', 6.5);
    }
  }

  // Birch-bark armored torso & sage cloak skirt
  ctx.beginPath();
  ctx.moveTo(82, 188);
  ctx.quadraticCurveTo(74, 132, 92, 108);
  ctx.lineTo(164, 108);
  ctx.quadraticCurveTo(182, 132, 174, 188);
  ctx.closePath();
  fillAndStroke(ctx, '#D9A066', 7.5);

  // Carved bark vertical armor plates + emerald heart tabard
  ctx.beginPath();
  ctx.roundRect(108, 124, 40, 56, 10);
  fillAndStroke(ctx, '#88D49E', 5.5);

  // Utility belt with golden buckle & seed pouches
  ctx.beginPath();
  ctx.roundRect(82, 162, 92, 14, 6);
  fillAndStroke(ctx, '#5C3A21', 5.5);
  ctx.beginPath();
  ctx.roundRect(118, 159, 20, 20, 5);
  fillAndStroke(ctx, '#FDFFB6', 5);

  // Leafy emerald & mint shoulder pauldrons
  drawLeafShape(ctx, 94, 124, Math.PI * 0.82, 54, 24, '#88D49E', '#A8E6CF', 6.5);
  drawLeafShape(ctx, 162, 124, Math.PI * 0.18, 54, 24, '#88D49E', '#A8E6CF', 6.5);
  drawLeafShape(ctx, 96, 116, Math.PI * 0.92, 42, 18, '#A8E6CF', '#FFFDF0', 5.5);
  drawLeafShape(ctx, 160, 116, Math.PI * 0.08, 42, 18, '#A8E6CF', '#FFFDF0', 5.5);

  // Held Garden Blade (right hand) in static portrait mode; in-game uses HeroRenderer's articulated swinging arm
  if (includeStaticLegs) {
    ctx.save();
    ctx.translate(188, 136);
    ctx.rotate(-0.48);
    drawLeafShape(ctx, 0, 0, -Math.PI / 2, 76, 22, '#A8E6CF', '#FFFDF0', 6.5);
    ctx.beginPath();
    ctx.roundRect(-16, -6, 32, 10, 5);
    fillAndStroke(ctx, '#D9A066', 5);
    ctx.beginPath();
    ctx.arc(0, 12, 7, 0, Math.PI * 2);
    fillAndStroke(ctx, '#FFAAA6', 4.5);
    ctx.restore();
  }

  // Chibi Head & Sage Traveler Hood
  drawCelCircle(ctx, 128, 86, 46, '#88D49E', '#6BB384', '#A8E6CF', 7.5);
  // Warm Peach Face inside hood opening
  drawCelCircle(ctx, 128, 92, 33, '#FFD3B6', '#F3B692', '#FFFDF0', 6.5);

  // Rosy cheeks & cute heroic eyes
  ctx.fillStyle = '#FFAAA6';
  ctx.beginPath();
  ctx.ellipse(106, 100, 6.5, 4, 0, 0, Math.PI * 2);
  ctx.ellipse(150, 100, 6.5, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  drawCuteEye(ctx, 114, 92, 6.5, PLUM, 0.15);
  drawCuteEye(ctx, 142, 92, 6.5, PLUM, -0.15);

  // Sprouting twin leaf crest on top of hood
  drawLeafShape(ctx, 128, 42, -Math.PI * 0.68, 34, 14, '#A8E6CF', '#FFFDF0', 5.5);
  drawLeafShape(ctx, 128, 42, -Math.PI * 0.32, 30, 12, '#88D49E', '#A8E6CF', 5.5);
  drawStarGlint(ctx, 198, 84, 11);
}

function paintHeroSeeker(ctx: CanvasRenderingContext2D, includeStaticLegs = true): void {
  // 2.3 Seeker: Hooded lavender & soft violet wind-cloak, leather bandolier holding
  // glowing pastel green seed daggers, swift boots, agile pose
  if (includeStaticLegs) {
    // Swift boots
    for (const dx of [-22, 22]) {
      ctx.beginPath();
      ctx.roundRect(128 + dx - 12, 186, 24, 26, 10);
      fillAndStroke(ctx, '#4A3556', 6.5);
    }
  }

  // Fluttering Lavender Wind-Cloak
  ctx.beginPath();
  ctx.moveTo(70, 186);
  ctx.quadraticCurveTo(64, 134, 92, 104);
  ctx.lineTo(164, 104);
  ctx.quadraticCurveTo(192, 134, 186, 186);
  ctx.lineTo(158, 176);
  ctx.lineTo(128, 190);
  ctx.lineTo(98, 176);
  ctx.closePath();
  fillAndStroke(ctx, '#DED2F9', 7.5);

  // Inner tunic & Diagonal Leather Bandolier with 3 glowing seed daggers
  ctx.beginPath();
  ctx.roundRect(96, 118, 64, 62, 14);
  fillAndStroke(ctx, '#5E4B75', 6.5);

  ctx.beginPath();
  ctx.moveTo(96, 122);
  ctx.lineTo(160, 174);
  ctx.lineWidth = 12;
  ctx.strokeStyle = '#8C5A3C';
  ctx.stroke();
  ctx.lineWidth = 4;
  ctx.strokeStyle = PLUM;
  ctx.stroke();

  // 3 glowing mint seed daggers on bandolier
  for (let i = 0; i < 3; i++) {
    drawLeafShape(
      ctx,
      110 + i * 16,
      134 + i * 13,
      -Math.PI / 4,
      22,
      8,
      '#A8E6CF',
      '#FFFDF0',
      4
    );
  }

  // Dual held aerodynamic Seed Blades in left & right hands
  drawLeafShape(ctx, 68, 142, Math.PI * 0.78, 52, 16, '#A8E6CF', '#FFFDF0', 6);
  drawLeafShape(ctx, 188, 142, Math.PI * 0.22, 52, 16, '#A8E6CF', '#FFFDF0', 6);

  // Pointed Assassin Hood in Lavender & Violet
  drawCelCircle(ctx, 128, 86, 45, '#DED2F9', '#B8A4E8', '#FFFDF0', 7.5);
  // Hood peak
  ctx.beginPath();
  ctx.moveTo(104, 52);
  ctx.quadraticCurveTo(128, 22, 152, 52);
  fillAndStroke(ctx, '#DED2F9', 6.5);

  // Face & violet scarf mask covering lower chin
  drawCelCircle(ctx, 128, 92, 32, '#FFD3B6', '#F3B692', '#FFFDF0', 6);
  ctx.beginPath();
  ctx.arc(128, 96, 31, 0.15, Math.PI - 0.15);
  ctx.closePath();
  fillAndStroke(ctx, '#7E659E', 5.5);

  drawCuteEye(ctx, 114, 88, 6.5, PLUM, 0.22);
  drawCuteEye(ctx, 142, 88, 6.5, PLUM, -0.22);
  drawStarGlint(ctx, 52, 126, 9);
  drawStarGlint(ctx, 204, 126, 9);
}

function paintHeroHerbalist(ctx: CanvasRenderingContext2D, includeStaticLegs = true): void {
  // 2.4 Herbalist: Wide-brim straw hat with blooming pastel pink daisy,
  // sage green apron over cream tunic, glowing mint potion pouch, botanical pestle
  if (includeStaticLegs) {
    for (const dx of [-20, 20]) {
      ctx.beginPath();
      ctx.roundRect(128 + dx - 12, 186, 24, 24, 10);
      fillAndStroke(ctx, '#9C6B46', 6);
    }
  }

  // Cream tunic + Sage Green botanical apron
  ctx.beginPath();
  ctx.roundRect(86, 116, 84, 72, 22);
  fillAndStroke(ctx, '#FFFDF0', 7.5);

  ctx.beginPath();
  ctx.roundRect(98, 128, 60, 60, 14);
  fillAndStroke(ctx, '#88D49E', 6.5);

  // Glowing mint potion flask on hip + wooden pestle in right hand
  drawCelCircle(ctx, 84, 162, 18, '#A8E6CF', '#6BB384', '#FFFDF0', 5.5);
  ctx.save();
  ctx.translate(182, 148);
  ctx.rotate(0.45);
  ctx.beginPath();
  ctx.roundRect(-8, -32, 16, 56, 8);
  fillAndStroke(ctx, '#D9A066', 6);
  ctx.restore();

  // Head
  drawCelCircle(ctx, 128, 94, 34, '#FFD3B6', '#F3B692', '#FFFDF0', 6.5);
  drawCuteEye(ctx, 114, 96, 6.5, PLUM, 0);
  drawCuteEye(ctx, 142, 96, 6.5, PLUM, 0);

  // Wide-brimmed buttercream straw sun-hat
  ctx.beginPath();
  ctx.ellipse(128, 66, 74, 28, -0.06, 0, Math.PI * 2);
  fillAndStroke(ctx, '#FDFFB6', 7.5);

  // Hat crown & sage ribbon
  ctx.beginPath();
  ctx.arc(128, 62, 38, Math.PI, 0);
  ctx.closePath();
  fillAndStroke(ctx, '#FDE68A', 6.5);
  ctx.beginPath();
  ctx.roundRect(90, 56, 76, 11, 5);
  fillAndStroke(ctx, '#88D49E', 5);

  // Blooming pastel pink daisy on hat brim
  const fx = 162;
  const fy = 52;
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.arc(fx + Math.cos(a) * 11, fy + Math.sin(a) * 11, 8, 0, Math.PI * 2);
    fillAndStroke(ctx, '#FFAAA6', 4.5);
  }
  ctx.beginPath();
  ctx.arc(fx, fy, 7, 0, Math.PI * 2);
  fillAndStroke(ctx, '#FDFFB6', 4.5);
}

function paintHeroStormcaller(ctx: CanvasRenderingContext2D, includeStaticLegs = true): void {
  // 2.5 Stormcaller: Floating ethereal pose, flowing sky-blue & lilac robes,
  // glowing pastel electric runes on hands, leafy circlet sparking with lightning
  if (includeStaticLegs) {
    // Floating lilac feathers & electric ground rings
    ctx.beginPath();
    ctx.ellipse(128, 198, 48, 14, 0, 0, Math.PI * 2);
    fillAndStroke(ctx, '#A0C4FF', 5);
  }

  // Flowing Sky-Blue & Lilac Robes
  ctx.beginPath();
  ctx.moveTo(76, 186);
  ctx.quadraticCurveTo(72, 128, 96, 108);
  ctx.lineTo(160, 108);
  ctx.quadraticCurveTo(184, 128, 180, 186);
  ctx.quadraticCurveTo(128, 200, 76, 186);
  ctx.closePath();
  fillAndStroke(ctx, '#A0C4FF', 7.5);

  // Lilac center stole with golden lightning rune
  ctx.beginPath();
  ctx.roundRect(108, 116, 40, 72, 12);
  fillAndStroke(ctx, '#DED2F9', 6);

  // Glowing electric orbs in both hands
  drawCelCircle(ctx, 68, 144, 18, '#A0C4FF', '#60A5FA', '#FFFDF0', 5.5);
  drawCelCircle(ctx, 188, 144, 18, '#FDFFB6', '#FBBF24', '#FFFDF0', 5.5);
  drawStarGlint(ctx, 68, 144, 10);
  drawStarGlint(ctx, 188, 144, 10);

  // Head & Lilac hair/hood
  drawCelCircle(ctx, 128, 86, 42, '#DED2F9', '#C4B5FD', '#FFFDF0', 7.5);
  drawCelCircle(ctx, 128, 90, 32, '#FFD3B6', '#F3B692', '#FFFDF0', 6);

  // Glowing sky-blue druid eyes
  drawCuteEye(ctx, 114, 90, 6.5, '#2563EB', 0.1);
  drawCuteEye(ctx, 142, 90, 6.5, '#2563EB', -0.1);

  // Leafy circlet sparking with cartoon lightning bolt crest
  drawLeafShape(ctx, 104, 58, Math.PI * 1.1, 30, 11, '#A8E6CF', '#FFFDF0', 5);
  drawLeafShape(ctx, 152, 58, -0.1, 30, 11, '#A8E6CF', '#FFFDF0', 5);
  ctx.beginPath();
  ctx.moveTo(132, 26);
  ctx.lineTo(118, 50);
  ctx.lineTo(130, 50);
  ctx.lineTo(122, 72);
  ctx.lineTo(142, 44);
  ctx.lineTo(130, 44);
  ctx.closePath();
  fillAndStroke(ctx, '#FDFFB6', 5);
}

// ============================================================================
// 6. ENEMY ARCHETYPES, SPECIAL MONSTERS & BOSSES (Sections 6.1 - 6.15)
// ============================================================================

function paintEnemyChaser(
  ctx: CanvasRenderingContext2D,
  isElite: boolean,
  includeStaticLegs = true
): void {
  if (isElite) drawEliteCrownAndAura(ctx);
  // 6.1 Chaser (Thorn-Vine Swarmer): 4 thorny branch legs, snapping bulb maw with rose-thorn teeth, glowing yellow eyes
  if (includeStaticLegs) {
    const legAngles = [-0.65, -2.5, 0.65, 2.5];
    for (const a of legAngles) {
      ctx.save();
      ctx.translate(128, 138);
      ctx.rotate(a);
      ctx.beginPath();
      ctx.moveTo(28, 0);
      ctx.lineTo(68, -14);
      ctx.lineTo(86, 8);
      ctx.lineWidth = 12;
      ctx.strokeStyle = PLUM;
      ctx.stroke();
      ctx.lineWidth = 6;
      ctx.strokeStyle = '#6B8E6E';
      ctx.stroke();
      ctx.restore();
    }
  }

  // Rose-thorn ears/horns
  drawLeafShape(ctx, 96, 86, -Math.PI * 0.72, 46, 18, '#FFAAA6', '#FFFDF0', 6.5);
  drawLeafShape(ctx, 160, 86, -Math.PI * 0.28, 46, 18, '#FFAAA6', '#FFFDF0', 6.5);

  // Bulb body
  drawCelCircle(ctx, 128, 134, 58, '#88D49E', '#5F9E77', '#A8E6CF', 8);

  // Glowing amber-yellow cartoon eyes
  drawCelCircle(ctx, 104, 118, 14, '#FDFFB6', '#FBBF24', '#FFFDF0', 5.5);
  drawCelCircle(ctx, 152, 118, 14, '#FDFFB6', '#FBBF24', '#FFFDF0', 5.5);
  ctx.fillStyle = PLUM;
  ctx.beginPath();
  ctx.ellipse(104, 118, 4, 9, 0, 0, Math.PI * 2);
  ctx.ellipse(152, 118, 4, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Snapping bulb maw with 4 white rose-thorn fangs
  ctx.beginPath();
  ctx.arc(128, 146, 28, 0.1, Math.PI - 0.1);
  ctx.closePath();
  fillAndStroke(ctx, '#4A2538', 6);

  for (const fx of [112, 123, 133, 144]) {
    ctx.beginPath();
    ctx.moveTo(fx - 5, 148);
    ctx.lineTo(fx, 162);
    ctx.lineTo(fx + 5, 148);
    ctx.closePath();
    fillAndStroke(ctx, '#FFFDF0', 3.5);
  }
}

function paintEnemyDasher(
  ctx: CanvasRenderingContext2D,
  isElite: boolean,
  includeStaticLegs = true
): void {
  if (isElite) drawEliteCrownAndAura(ctx);
  // 6.2 Dasher (Briar Charger): Horned beetle monster with polished chestnut/rosewood shell & oversized magenta ram horns
  if (includeStaticLegs) {
    // 6 beetle legs
    for (const dy of [-24, 0, 24]) {
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(128 + dir * 48, 138 + dy);
        ctx.lineTo(128 + dir * 78, 132 + dy * 1.15);
        ctx.lineWidth = 10;
        ctx.strokeStyle = PLUM;
        ctx.stroke();
      }
    }
  }

  // Polished chestnut & blush-rose beetle carapace
  drawCelCircle(ctx, 128, 142, 62, '#E07A74', '#B85450', '#FFAAA6', 8);
  // Wing seam line
  ctx.beginPath();
  ctx.moveTo(128, 92);
  ctx.lineTo(128, 200);
  ctx.lineWidth = 6;
  ctx.strokeStyle = PLUM;
  ctx.stroke();

  // Oversized forward-pointing pastel magenta battering-ram horns
  for (const dir of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(128 + dir * 22, 92);
    ctx.quadraticCurveTo(128 + dir * 72, 54, 128 + dir * 32, 24);
    ctx.quadraticCurveTo(128 + dir * 40, 62, 128 + dir * 8, 86);
    ctx.closePath();
    fillAndStroke(ctx, '#FFAAA6', 7);
  }

  // Furious charging eyes
  drawCelCircle(ctx, 104, 114, 12, '#FDFFB6', '#FBBF24', '#FFFDF0', 5);
  drawCelCircle(ctx, 152, 114, 12, '#FDFFB6', '#FBBF24', '#FFFDF0', 5);
  drawCuteEye(ctx, 104, 114, 6, PLUM, 0.35);
  drawCuteEye(ctx, 152, 114, 6, PLUM, -0.35);
}

function paintEnemySpitter(
  ctx: CanvasRenderingContext2D,
  isElite: boolean,
  includeStaticLegs = true
): void {
  if (isElite) drawEliteCrownAndAura(ctx);
  // 6.3 Spitter (Spore Spitter): Plump pitcher plant with leafy base feet, speckled lavender skin, swollen cheeks & funnel mouth
  if (includeStaticLegs) {
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 2 + Math.PI / 4;
      drawLeafShape(ctx, 128, 168, a, 68, 22, '#88D49E', '#A8E6CF', 6);
    }
  }

  // Pitcher plant body
  drawCelCircle(ctx, 128, 138, 58, '#DED2F9', '#B69EE8', '#FFFDF0', 8);

  // Swollen puffing cheek pouches
  drawCelCircle(ctx, 82, 146, 26, '#FFAAA6', '#E58A86', '#FFFDF0', 6.5);
  drawCelCircle(ctx, 174, 146, 26, '#FFAAA6', '#E58A86', '#FFFDF0', 6.5);

  // Speckled dots
  ctx.fillStyle = '#A8E6CF';
  for (const [sx, sy] of [
    [102, 172],
    [154, 172],
    [128, 180],
  ]) {
    ctx.beginPath();
    ctx.arc(sx, sy, 6, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eyes
  drawCuteEye(ctx, 106, 112, 8.5, PLUM, 0);
  drawCuteEye(ctx, 150, 112, 8.5, PLUM, 0);

  // Funnel spore cannon mouth with glowing green/violet spore orb
  drawCelCircle(ctx, 128, 144, 24, '#88D49E', '#5F9E77', '#A8E6CF', 6.5);
  drawCelCircle(ctx, 128, 144, 13, PLUM, PLUM, '#A8E6CF', 4);
}

function paintEnemyBrute(ctx: CanvasRenderingContext2D, isElite: boolean): void {
  if (isElite) drawEliteCrownAndAura(ctx);
  // 6.4 Brute (Moss Golem): Massive river-stone golem covered in fluffy pastel moss, giant boulder fists, cyan eye slits
  // Giant stone shoulder boulders
  drawCelCircle(ctx, 74, 124, 38, '#94A3B8', '#64748B', '#CBD5E1', 7.5);
  drawCelCircle(ctx, 182, 124, 38, '#94A3B8', '#64748B', '#CBD5E1', 7.5);

  // Core granite torso
  ctx.beginPath();
  ctx.roundRect(68, 72, 120, 116, 36);
  fillAndStroke(ctx, '#94A3B8', 8.5);

  // Fluffy pastel green moss cap & shoulder drape
  ctx.beginPath();
  ctx.arc(128, 92, 54, Math.PI, 0);
  ctx.arc(166, 102, 24, -Math.PI / 2, Math.PI / 2);
  ctx.arc(128, 108, 32, 0, Math.PI);
  ctx.arc(90, 102, 24, Math.PI / 2, -Math.PI / 2);
  ctx.closePath();
  fillAndStroke(ctx, '#A8E6CF', 7);

  // Glowing cyan eye slits in stone face
  for (const ex of [104, 152]) {
    ctx.beginPath();
    ctx.roundRect(ex - 14, 122, 28, 12, 6);
    fillAndStroke(ctx, '#A0C4FF', 5);
  }

  // Giant foreground boulder fists
  drawCelCircle(ctx, 76, 176, 30, '#CBD5E1', '#94A3B8', '#FFFDF0', 7.5);
  drawCelCircle(ctx, 180, 176, 30, '#CBD5E1', '#94A3B8', '#FFFDF0', 7.5);
}

function paintEnemySplitter(ctx: CanvasRenderingContext2D, isElite: boolean): void {
  if (isElite) drawEliteCrownAndAura(ctx);
  // 6.5 Splitter (Bulb Mitotic): Bouncy double-lobed peach jelly bulb with two visible smiling seed cores ready to divide
  drawCelCircle(ctx, 98, 138, 52, '#FFD3B6', '#F4B183', '#FFFDF0', 8);
  drawCelCircle(ctx, 158, 138, 52, '#FFD3B6', '#F4B183', '#FFFDF0', 8);

  // Seamless jelly bridge in center
  ctx.beginPath();
  ctx.arc(128, 138, 42, 0, Math.PI * 2);
  ctx.fillStyle = '#FFD3B6';
  ctx.fill();

  // Two smiling green seed nuclei inside
  for (const cx of [98, 158]) {
    drawCelCircle(ctx, cx, 140, 22, '#88D49E', '#5F9E77', '#A8E6CF', 5.5);
    drawCuteEye(ctx, cx - 8, 136, 4.5, PLUM, 0);
    drawCuteEye(ctx, cx + 8, 136, 4.5, PLUM, 0);
    ctx.beginPath();
    ctx.arc(cx, 142, 7, 0.2, Math.PI - 0.2);
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = PLUM;
    ctx.stroke();
  }
  drawStarGlint(ctx, 76, 106, 9);
  drawStarGlint(ctx, 142, 106, 8);
}

function paintEnemyShielded(ctx: CanvasRenderingContext2D, isElite: boolean): void {
  if (isElite) drawEliteCrownAndAura(ctx);
  // 6.6 Shielded (Bark Sentinel): Wooden clockwork sentry crouching behind enormous curved oak bark tower shield with eye crest
  // Clockwork wind-up key at top
  ctx.beginPath();
  ctx.arc(106, 56, 12, 0, Math.PI * 2);
  ctx.arc(150, 56, 12, 0, Math.PI * 2);
  fillAndStroke(ctx, '#FDFFB6', 5.5);

  // Wooden sentry body
  drawCelCircle(ctx, 128, 124, 52, '#D9A066', '#B37B44', '#FDFFB6', 7.5);
  drawCuteEye(ctx, 110, 110, 7.5, '#FDFFB6', 0.2);
  drawCuteEye(ctx, 146, 110, 7.5, '#FDFFB6', -0.2);

  // Enormous curved oak bark tower shield in front (bottom half + right arc)
  ctx.beginPath();
  ctx.roundRect(58, 126, 140, 72, 24);
  fillAndStroke(ctx, '#8C5A3C', 8);

  // Mintjade & gold eye-rune crest on shield
  ctx.beginPath();
  ctx.roundRect(70, 138, 116, 48, 16);
  fillAndStroke(ctx, '#A8E6CF', 5.5);
  drawCelCircle(ctx, 128, 162, 16, '#FDFFB6', '#FBBF24', '#FFFDF0', 5);
  ctx.fillStyle = PLUM;
  ctx.beginPath();
  ctx.arc(128, 162, 6, 0, Math.PI * 2);
  ctx.fill();
}

function paintSpecialMonster(ctx: CanvasRenderingContext2D, id: SpecialMonsterId): void {
  if (id === 'golden_beast') {
    // 6.8 Golden Beast: Radiant spun pastel gold wheat fox with coin trail
    drawLeafShape(ctx, 74, 152, Math.PI * 0.85, 68, 28, '#FDFFB6', '#FBBF24', 7);
    drawLeafShape(ctx, 96, 82, -Math.PI * 0.68, 48, 20, '#FDFFB6', '#FBBF24', 6.5);
    drawLeafShape(ctx, 160, 82, -Math.PI * 0.32, 48, 20, '#FDFFB6', '#FBBF24', 6.5);
    drawCelCircle(ctx, 128, 136, 52, '#FDFFB6', '#FBBF24', '#FFFDF0', 8);
    drawCuteEye(ctx, 108, 128, 8, PLUM, 0);
    drawCuteEye(ctx, 148, 128, 8, PLUM, 0);
    drawStarGlint(ctx, 64, 102, 12);
    drawStarGlint(ctx, 192, 114, 12);
  } else if (id === 'bloom_giant') {
    // 6.9 Bloom Giant: Hulking tree-trunk colossus with giant 12-petal sunflower head
    for (let i = 0; i < 12; i++) {
      const a = (i * Math.PI) / 6;
      drawLeafShape(
        ctx,
        128 + Math.cos(a) * 36,
        128 + Math.sin(a) * 36,
        a,
        52,
        20,
        '#FDFFB6',
        '#FBBF24',
        5.5
      );
    }
    drawCelCircle(ctx, 128, 128, 48, '#8C5A3C', '#5C3A21', '#D9A066', 8);
    drawCuteEye(ctx, 108, 122, 8.5, '#FDFFB6', 0.25);
    drawCuteEye(ctx, 148, 122, 8.5, '#FDFFB6', -0.25);
  } else if (id === 'brood_mother') {
    // 6.10 Brood Mother: Carved hanging gourd queen with pastel lavender orchid wings
    drawLeafShape(ctx, 84, 128, Math.PI * 0.9, 74, 34, '#DED2F9', '#FFFDF0', 6.5);
    drawLeafShape(ctx, 172, 128, Math.PI * 0.1, 74, 34, '#DED2F9', '#FFFDF0', 6.5);
    drawCelCircle(ctx, 128, 98, 38, '#A8E6CF', '#6BB384', '#FFFDF0', 7);
    drawCelCircle(ctx, 128, 152, 50, '#88D49E', '#5F9E77', '#A8E6CF', 7.5);
    drawCuteEye(ctx, 112, 96, 7.5, PLUM, 0);
    drawCuteEye(ctx, 144, 96, 7.5, PLUM, 0);
  } else {
    // 6.11 Mirror Wisp: Gossamer fairy wisp with dewdrop prism mirror
    drawLeafShape(ctx, 92, 116, Math.PI * 0.85, 68, 26, '#A0C4FF', '#FFFDF0', 5.5);
    drawLeafShape(ctx, 164, 116, Math.PI * 0.15, 68, 26, '#A0C4FF', '#FFFDF0', 5.5);
    drawCelCircle(ctx, 128, 128, 46, '#FFFDF0', '#A0C4FF', '#FFFFFF', 7);
    drawCelCircle(ctx, 128, 128, 28, '#A0C4FF', '#60A5FA', '#FFFDF0', 5);
    drawStarGlint(ctx, 128, 128, 16);
  }
}

function paintBossSprite(
  ctx: CanvasRenderingContext2D,
  variant: 'moss_colossus' | 'p1' | 'p2' | 'p3'
): void {
  if (variant === 'moss_colossus') {
    // 6.12 Ancient Moss Colossus: Runic temple pillars on shoulders + colossal boulder fists
    paintEnemyBrute(ctx, true);
    ctx.beginPath();
    ctx.roundRect(44, 68, 34, 64, 8);
    ctx.roundRect(178, 68, 34, 64, 8);
    fillAndStroke(ctx, '#CBD5E1', 6.5);
    return;
  }

  // 6.13 - 6.15 Final Boss: Primordial Thornheart (Phases 1, 2, 3)
  const coreColor =
    variant === 'p1' ? '#A8E6CF' : variant === 'p2' ? '#FFAAA6' : '#F43F5E';
  const petalColor =
    variant === 'p1' ? '#88D49E' : variant === 'p2' ? '#DED2F9' : '#9F1239';

  // 4 Whipping thorny vine tentacles + radial petal crown
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    drawLeafShape(
      ctx,
      128 + Math.cos(a) * 42,
      128 + Math.sin(a) * 42,
      a,
      68,
      24,
      petalColor,
      coreColor,
      6.5
    );
  }

  // Ancient knotted redwood tree-god trunk
  drawCelCircle(ctx, 128, 128, 66, '#6D4534', '#4A2C20', '#9C6B46', 9);

  // Exposed glowing crystal heart core in chest
  drawCelCircle(ctx, 128, 148, 28, coreColor, petalColor, '#FFFDF0', 6.5);
  drawStarGlint(ctx, 128, 148, 14);

  // Blazing boss eyes in knotted bark
  drawCelCircle(ctx, 102, 104, 13, '#FDFFB6', '#FBBF24', '#FFFDF0', 5.5);
  drawCelCircle(ctx, 154, 104, 13, '#FDFFB6', '#FBBF24', '#FFFDF0', 5.5);
  drawCuteEye(ctx, 102, 104, 6.5, PLUM, 0.35);
  drawCuteEye(ctx, 154, 104, 6.5, PLUM, -0.35);
}

// ============================================================================
// POP-CULTURE MASHUP ARCANA SKINS (AD-UNLOCKED ONLY)
// ============================================================================

function paintSkinWardenZagreusNaruto(
  ctx: CanvasRenderingContext2D,
  includeStaticLegs = true
): void {
  // Warden Skin: Zagreus (Hades) × Naruto Uzumaki (Six Paths Sage Mode)
  // Blazing Hellfire steps, Six-Paths Truth-Seeking Orbs, Chthonic Skull Pauldron,
  // Konoha Laurel Headband, Whisker Marks, and Heterochromia Eyes (Left Red #F43F5E, Right Green #22C55E).
  if (includeStaticLegs) {
    // Blazing Stygian-Chakra Flame Footsteps under boots
    for (const dx of [-24, 24]) {
      ctx.beginPath();
      ctx.ellipse(128 + dx, 206, 22, 9, 0, 0, Math.PI * 2);
      fillAndStroke(ctx, '#F97316', 4, '#F43F5E');
      ctx.beginPath();
      ctx.ellipse(128 + dx, 206, 13, 5, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#FDFFB6';
      ctx.fill();

      // Shinobi-Stygian greaves
      ctx.beginPath();
      ctx.roundRect(128 + dx - 13, 182, 26, 24, 10);
      fillAndStroke(ctx, '#1E1B2E', 6);
    }
  }

  // Flowing Six-Paths Golden-Orange Chakra Haori Coat tails
  ctx.beginPath();
  ctx.moveTo(68, 192);
  ctx.quadraticCurveTo(62, 132, 88, 106);
  ctx.lineTo(168, 106);
  ctx.quadraticCurveTo(194, 132, 188, 192);
  ctx.lineTo(162, 178);
  ctx.lineTo(128, 194);
  ctx.lineTo(94, 178);
  ctx.closePath();
  fillAndStroke(ctx, '#FB923C', 7.5);

  // Inner Stygian Obsidian Chiton + Blood-Crimson Underworld Sash (Zagreus)
  ctx.beginPath();
  ctx.roundRect(94, 114, 68, 66, 12);
  fillAndStroke(ctx, '#1E1B2E', 6.5);

  ctx.beginPath();
  ctx.moveTo(94, 120);
  ctx.lineTo(156, 176);
  ctx.lineTo(162, 152);
  ctx.lineTo(114, 114);
  ctx.closePath();
  fillAndStroke(ctx, '#E11D48', 5.5);

  // Six-Paths Black Magatama Tomoe markings across chest/collar
  for (const mx of [110, 128, 146]) {
    ctx.beginPath();
    ctx.arc(mx, 128, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = '#FDFFB6';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(mx, 128, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = PLUM;
    ctx.fill();
  }

  // Golden Hades Skull Belt Buckle
  ctx.beginPath();
  ctx.roundRect(84, 160, 88, 13, 6);
  fillAndStroke(ctx, '#27272A', 5.5);
  drawCelCircle(ctx, 128, 166, 11, '#FBBF24', '#D97706', '#FFFDF0', 4.5);

  // Left Shoulder: Zagreus Chthonic Skull Pauldron with blazing red eye sockets
  drawCelCircle(ctx, 86, 122, 22, '#E2E8F0', '#94A3B8', '#FFFDF0', 6);
  ctx.fillStyle = '#F43F5E';
  ctx.beginPath();
  ctx.arc(80, 122, 4, 0, Math.PI * 2);
  ctx.arc(92, 122, 4, 0, Math.PI * 2);
  ctx.fill();

  // Right Shoulder: Swirling Kurama Chakra Flame Pauldron
  drawLeafShape(ctx, 168, 122, -0.35, 52, 22, '#F97316', '#FDFFB6', 6);
  drawLeafShape(ctx, 166, 112, 0.15, 42, 16, '#FDFFB6', '#FFFDF0', 5);

  // Orbiting Six-Paths Truth-Seeking Orbs (Black spheres with golden chakra halo)
  for (const [ox, oy] of [
    [54, 96],
    [202, 96],
    [60, 148],
  ] as const) {
    drawCelCircle(ctx, ox, oy, 10, '#18181B', '#09090B', '#FBBF24', 4, '#F97316');
  }

  // Static Portrait Weapon: Stygius × Kurama Chakra Great-Blade
  if (includeStaticLegs) {
    ctx.save();
    ctx.translate(192, 138);
    ctx.rotate(-0.42);
    drawLeafShape(ctx, 0, 0, -Math.PI / 2, 82, 24, '#F43F5E', '#FDFFB6', 6.5);
    drawLeafShape(ctx, 0, -6, -Math.PI / 2, 62, 13, '#1E1B2E', '#F97316', 4.5);
    ctx.beginPath();
    ctx.roundRect(-18, -6, 36, 11, 5);
    fillAndStroke(ctx, '#FBBF24', 5);
    ctx.restore();
  }

  // Spiky Naruto Golden-Yellow & Zagreus Flame-Crimson Hair Crown
  const hairSpikes: ReadonlyArray<readonly [number, number, number, string]> = [
    [92, 68, -2.4, '#1E1B2E'],
    [104, 52, -1.9, '#FACC15'],
    [120, 44, -1.6, '#F97316'],
    [136, 44, -1.4, '#FACC15'],
    [152, 52, -1.1, '#F43F5E'],
    [164, 68, -0.7, '#1E1B2E'],
  ];
  for (const [sx, sy, ang, col] of hairSpikes) {
    drawLeafShape(ctx, sx, sy, ang, 44, 18, col, '#FDFFB6', 6);
  }

  // Head & Face
  drawCelCircle(ctx, 128, 90, 35, '#FFD3B6', '#F3B692', '#FFFDF0', 6.5);

  // Naruto's 3 Iconic Whisker Marks on both cheeks
  ctx.lineWidth = 3.2;
  ctx.strokeStyle = PLUM;
  ctx.lineCap = 'round';
  for (let w = 0; w < 3; w++) {
    const wy = 95 + w * 5.5;
    ctx.beginPath();
    ctx.moveTo(96, wy - 1);
    ctx.lineTo(107, wy);
    ctx.moveTo(149, wy);
    ctx.lineTo(160, wy - 1);
    ctx.stroke();
  }

  // HETEROCHROMIA EYES (Zagreus × Naruto Sage Mode):
  // Left Eye (113, 90): Blazing Stygian Blood-Red (#F43F5E)
  // Right Eye (143, 90): Verdant Laurel-Green (#22C55E) with Golden Toad-Sage pigment (#FBBF24)
  ctx.beginPath();
  ctx.arc(113, 90, 10.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(244, 63, 94, 0.35)';
  ctx.fill();
  ctx.beginPath();
  ctx.arc(143, 90, 10.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(251, 191, 36, 0.55)';
  ctx.fill();

  drawCuteEye(ctx, 113, 90, 7.5, '#F43F5E', 0.22);
  drawCuteEye(ctx, 143, 90, 7.5, '#22C55E', -0.22);

  // Konoha Forehead Protector Headband + Zagreus Golden-Emerald Laurel Wreath
  ctx.beginPath();
  ctx.roundRect(92, 62, 72, 15, 6);
  fillAndStroke(ctx, '#334155', 5.5);
  ctx.beginPath();
  ctx.roundRect(108, 64, 40, 11, 4);
  fillAndStroke(ctx, '#CBD5E1', 4);
  // Zagreus Burning Laurel Leaves flanking headband
  drawLeafShape(ctx, 94, 68, -Math.PI * 0.78, 30, 11, '#FBBF24', '#FFFDF0', 4.5);
  drawLeafShape(ctx, 162, 68, -Math.PI * 0.22, 30, 11, '#22C55E', '#FDFFB6', 4.5);

  drawStarGlint(ctx, 113, 86, 6, '#FFAAA6');
  drawStarGlint(ctx, 143, 86, 6, '#A8E6CF');
}

function paintSkinSeekerHollowLevi(
  ctx: CanvasRenderingContext2D,
  includeStaticLegs = true
): void {
  // Seeker Skin: Pure Vessel / The Knight (Hollow Knight) × Levi Ackerman (Attack on Titan)
  if (includeStaticLegs) {
    // Abyssal Void puddles & ODM steam rings under boots
    for (const dx of [-22, 22]) {
      ctx.beginPath();
      ctx.ellipse(128 + dx, 204, 18, 7, 0, 0, Math.PI * 2);
      fillAndStroke(ctx, '#0F172A', 4, '#38BDF8');
      ctx.beginPath();
      ctx.roundRect(128 + dx - 12, 184, 24, 24, 9);
      fillAndStroke(ctx, '#1E293B', 6);
    }
  }

  // Tattered Midnight Mothwing Under-Cloak (Hollow Knight)
  ctx.beginPath();
  ctx.moveTo(64, 194);
  ctx.lineTo(84, 108);
  ctx.lineTo(172, 108);
  ctx.lineTo(192, 194);
  ctx.lineTo(166, 178);
  ctx.lineTo(146, 194);
  ctx.lineTo(128, 178);
  ctx.lineTo(110, 194);
  ctx.lineTo(90, 178);
  ctx.closePath();
  fillAndStroke(ctx, '#0F172A', 7.5);

  // Survey Corps Emerald "Wings of Freedom" Cloak & Levi White Cravat
  ctx.beginPath();
  ctx.moveTo(76, 176);
  ctx.quadraticCurveTo(72, 126, 94, 106);
  ctx.lineTo(162, 106);
  ctx.quadraticCurveTo(184, 126, 180, 176);
  ctx.quadraticCurveTo(128, 166, 76, 176);
  ctx.closePath();
  fillAndStroke(ctx, '#15803D', 7);

  // ODM Gear Crossed Harness Straps & Levi's White Cravat
  ctx.beginPath();
  ctx.moveTo(118, 112);
  ctx.lineTo(138, 112);
  ctx.lineTo(133, 138);
  ctx.lineTo(123, 138);
  ctx.closePath();
  fillAndStroke(ctx, '#F8FAFC', 4.5);

  // Dual Pure-Nail / ODM Ultrahard Steel Blades in Left & Right Hands
  drawLeafShape(ctx, 64, 144, Math.PI * 0.78, 60, 15, '#E2E8F0', '#38BDF8', 6);
  drawLeafShape(ctx, 192, 144, Math.PI * 0.22, 60, 15, '#E2E8F0', '#38BDF8', 6);

  // Iconic Curved Porcelain-White Hollow Knight Horned Shell Mask
  for (const dir of [-1, 1] as const) {
    ctx.beginPath();
    ctx.moveTo(128 + dir * 18, 72);
    ctx.quadraticCurveTo(128 + dir * 64, 34, 128 + dir * 26, 12);
    ctx.quadraticCurveTo(128 + dir * 36, 44, 128 + dir * 6, 66);
    ctx.closePath();
    fillAndStroke(ctx, '#F8FAFC', 7);
  }

  // Porcelain Mask Head with Crimson Vizard War-Stripe on Left
  drawCelCircle(ctx, 128, 88, 36, '#F8FAFC', '#CBD5E1', '#FFFFFF', 7);
  ctx.beginPath();
  ctx.moveTo(102, 62);
  ctx.quadraticCurveTo(98, 88, 108, 114);
  ctx.lineWidth = 6;
  ctx.strokeStyle = '#E11D48';
  ctx.stroke();

  // Asymmetrical Eyes: Left Abyssal Void Socket (#0F172A), Right Blazing Ackerman Cyan (#38BDF8)
  ctx.beginPath();
  ctx.ellipse(113, 90, 8.5, 11, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#09090B';
  ctx.fill();
  drawCuteEye(ctx, 143, 90, 7.5, '#38BDF8', -0.25);
  drawStarGlint(ctx, 143, 88, 8, '#E0F2FE');
}

function paintSkinHerbalistFrierenStrange(
  ctx: CanvasRenderingContext2D,
  includeStaticLegs = true
): void {
  // Herbalist Skin: Frieren (Beyond Journey's End) × Doctor Strange × Edward Elric (FMA)
  if (includeStaticLegs) {
    // Glowing Golden Eldritch Mandala Ring under feet
    ctx.beginPath();
    ctx.ellipse(128, 200, 52, 15, 0, 0, Math.PI * 2);
    fillAndStroke(ctx, 'rgba(251, 191, 36, 0.35)', 5, '#FBBF24');
    for (const dx of [-20, 20]) {
      ctx.beginPath();
      ctx.roundRect(128 + dx - 11, 184, 22, 22, 9);
      fillAndStroke(ctx, '#7F1D1D', 6);
    }
  }

  // Doctor Strange's High-Collared Crimson Cloak of Levitation + Gold Arcane Trim
  ctx.beginPath();
  ctx.moveTo(66, 190);
  ctx.quadraticCurveTo(58, 118, 84, 72);
  ctx.lineTo(172, 72);
  ctx.quadraticCurveTo(198, 118, 190, 190);
  ctx.closePath();
  fillAndStroke(ctx, '#DC2626', 7.5);

  // Frieren's Crisp White & Gold Mage Capelet over tunic
  ctx.beginPath();
  ctx.roundRect(88, 114, 80, 70, 20);
  fillAndStroke(ctx, '#F8FAFC', 7);
  ctx.beginPath();
  ctx.roundRect(96, 114, 64, 34, 12);
  fillAndStroke(ctx, '#FEF08A', 5.5);

  // Glowing Emerald Eye of Agamotto Time-Stone Amulet on chest
  drawCelCircle(ctx, 128, 134, 13, '#FBBF24', '#D97706', '#FFFDF0', 5);
  drawCelCircle(ctx, 128, 134, 6.5, '#10B981', '#059669', '#A8E6CF', 3);

  // Left Hand: Rotating Golden Eldritch Mandala Spell Shield
  drawCelCircle(ctx, 68, 148, 20, 'rgba(251, 191, 36, 0.45)', '#F59E0B', '#FEF08A', 5, '#FBBF24');
  drawStarGlint(ctx, 68, 148, 11, '#FEF08A');

  // Right Arm: Edward Elric Silver Automail Arm gripping Frieren's Crescent Staff
  drawCelCircle(ctx, 184, 146, 15, '#CBD5E1', '#64748B', '#F8FAFC', 5.5);
  if (includeStaticLegs) {
    ctx.save();
    ctx.translate(192, 136);
    ctx.rotate(0.28);
    ctx.beginPath();
    ctx.roundRect(-5, -48, 10, 86, 5);
    fillAndStroke(ctx, '#78350F', 5);
    drawCelCircle(ctx, 0, -52, 16, '#FBBF24', '#D97706', '#FFFDF0', 5);
    drawCelCircle(ctx, 0, -52, 9, '#EF4444', '#B91C1C', '#FCA5A5', 3.5);
    ctx.restore();
  }

  // Frieren's Iconic Long Silver-White Twin-Tails & Pointed Elf Ears
  drawLeafShape(ctx, 84, 86, Math.PI * 0.72, 78, 22, '#F1F5F9', '#CBD5E1', 6.5);
  drawLeafShape(ctx, 172, 86, Math.PI * 0.28, 78, 22, '#F1F5F9', '#CBD5E1', 6.5);
  // Pointed Elf Ears
  drawLeafShape(ctx, 94, 92, Math.PI * 0.95, 32, 11, '#FFD3B6', '#F3B692', 5);
  drawLeafShape(ctx, 162, 92, Math.PI * 0.05, 32, 11, '#FFD3B6', '#F3B692', 5);

  // Silver Hair & Face
  drawCelCircle(ctx, 128, 84, 38, '#F1F5F9', '#CBD5E1', '#FFFFFF', 7);
  drawCelCircle(ctx, 128, 92, 32, '#FFD3B6', '#F3B692', '#FFFDF0', 6);

  // Heterochromia Eyes: Left Frieren Mana-Teal (#2DD4BF), Right Fullmetal Gold (#FBBF24)
  drawCuteEye(ctx, 114, 92, 7, '#0D9488', 0);
  drawCuteEye(ctx, 142, 92, 7, '#D97706', 0);
  // Third-Eye Golden Transmutation Sigil on Forehead
  drawStarGlint(ctx, 128, 74, 8, '#FBBF24');
}

function paintSkinStormcallerGojoKillua(
  ctx: CanvasRenderingContext2D,
  includeStaticLegs = true
): void {
  // Stormcaller Skin: THANDER REIN — Raiden (Mortal Kombat) × Thor Odinson (Marvel)
  // 1. Flowing Marvel Thor Crimson-Red Cloak billowing wide behind the body
  ctx.beginPath();
  ctx.moveTo(82, 102);
  ctx.quadraticCurveTo(42, 146, 48, 206);
  ctx.quadraticCurveTo(88, 218, 128, 212);
  ctx.quadraticCurveTo(168, 218, 208, 206);
  ctx.quadraticCurveTo(214, 146, 174, 102);
  ctx.closePath();
  fillAndStroke(ctx, '#DC2626', 7.5);

  // Crimson Cloak inner folds & highlight pleats
  ctx.beginPath();
  ctx.moveTo(78, 114);
  ctx.quadraticCurveTo(60, 158, 66, 200);
  ctx.lineTo(94, 204);
  ctx.quadraticCurveTo(92, 156, 98, 114);
  ctx.closePath();
  fillAndStroke(ctx, '#EF4444', 5);

  ctx.beginPath();
  ctx.moveTo(178, 114);
  ctx.quadraticCurveTo(196, 158, 190, 200);
  ctx.lineTo(162, 204);
  ctx.quadraticCurveTo(164, 156, 158, 114);
  ctx.closePath();
  fillAndStroke(ctx, '#B91C1C', 5);

  if (includeStaticLegs) {
    // Levitating Thunder-God Hover Cushion & Levitating Asgardian Boots (not walking on ground)
    ctx.beginPath();
    ctx.ellipse(128, 214, 46, 11, 0, 0, Math.PI * 2);
    fillAndStroke(ctx, '#38BDF8', 4.5);

    // Poised levitating boots tucked in mid-air flight
    drawCelCircle(ctx, 112, 194, 11, '#1E293B', '#0F172A', '#64748B', 5.5);
    drawCelCircle(ctx, 144, 190, 11, '#1E293B', '#0F172A', '#64748B', 5.5);
  }

  // 2. Raiden × Thor Dark Thunder-God Armor Tunic & White Mortal Kombat Tabard
  ctx.beginPath();
  ctx.moveTo(82, 184);
  ctx.quadraticCurveTo(78, 126, 94, 104);
  ctx.lineTo(162, 104);
  ctx.quadraticCurveTo(178, 126, 174, 184);
  ctx.quadraticCurveTo(128, 194, 82, 184);
  ctx.closePath();
  fillAndStroke(ctx, '#1E293B', 7.5);

  // Raiden's Iconic White & Blue Mortal Kombat Thunder Tabard / Sash
  ctx.beginPath();
  ctx.moveTo(106, 108);
  ctx.lineTo(150, 108);
  ctx.lineTo(144, 184);
  ctx.lineTo(112, 184);
  ctx.closePath();
  fillAndStroke(ctx, '#F8FAFC', 5.5);

  // Golden Asgardian Belt & Thunder Clasp
  ctx.beginPath();
  ctx.roundRect(88, 152, 80, 14, 5);
  fillAndStroke(ctx, '#F59E0B', 5.5);
  drawCelCircle(ctx, 128, 159, 8, '#38BDF8', '#0284C7', '#E0F2FE', 4.5);

  // Twin Silver Asgardian Cloak Discs (Marvel Thor chest clasps)
  drawCelCircle(ctx, 98, 118, 12, '#E2E8F0', '#94A3B8', '#FFFFFF', 5.5);
  drawCelCircle(ctx, 158, 118, 12, '#E2E8F0', '#94A3B8', '#FFFFFF', 5.5);

  // Armored Thunder-God Gauntlets crackling with electricity (NO spinning orbs)
  drawCelCircle(ctx, 72, 148, 13, '#334155', '#1E293B', '#94A3B8', 6);
  drawCelCircle(ctx, 184, 148, 13, '#334155', '#1E293B', '#94A3B8', 6);

  // 3. Shadowed Thunder-God Cowl & Face beneath Raiden's Hat
  drawCelCircle(ctx, 128, 88, 32, '#0F172A', '#020617', '#1E293B', 6.5);

  // Blazing Cyan-White Lightning Eyes with Electric Arcs
  ctx.beginPath();
  ctx.moveTo(100, 88);
  ctx.lineTo(114, 84);
  ctx.lineTo(121, 90);
  ctx.lineTo(106, 94);
  ctx.closePath();
  fillAndStroke(ctx, '#38BDF8', 4.5);

  ctx.beginPath();
  ctx.moveTo(156, 88);
  ctx.lineTo(142, 84);
  ctx.lineTo(135, 90);
  ctx.lineTo(150, 94);
  ctx.closePath();
  fillAndStroke(ctx, '#E0F2FE', 4.5);

  drawStarGlint(ctx, 111, 88, 9, '#E0F2FE');
  drawStarGlint(ctx, 145, 88, 9, '#38BDF8');

  // Crackling lightning whiskers / eye-sparks flaring outward from eyes
  ctx.save();
  ctx.strokeStyle = '#7DD3FC';
  ctx.lineWidth = 3.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(104, 88);
  ctx.lineTo(84, 80);
  ctx.lineTo(72, 86);
  ctx.moveTo(152, 88);
  ctx.lineTo(172, 80);
  ctx.lineTo(184, 86);
  ctx.stroke();
  ctx.restore();

  // 4. Raiden's Iconic Wide Conical Woven Bamboo / Straw Hat (Mortal Kombat)
  // Under-brim shadow rim
  ctx.beginPath();
  ctx.ellipse(128, 72, 74, 16, 0, 0, Math.PI * 2);
  fillAndStroke(ctx, '#78350F', 6.5);

  // Main Conical Bamboo Hat Dome
  ctx.beginPath();
  ctx.moveTo(50, 72);
  ctx.quadraticCurveTo(92, 42, 128, 24);
  ctx.quadraticCurveTo(164, 42, 206, 72);
  ctx.quadraticCurveTo(128, 84, 50, 72);
  ctx.closePath();
  fillAndStroke(ctx, '#F59E0B', 7);

  // Woven straw ribs & golden bamboo rings on Raiden's conical hat
  ctx.save();
  ctx.strokeStyle = '#92400E';
  ctx.lineWidth = 3.2;
  for (const ribX of [78, 102, 128, 154, 178]) {
    ctx.beginPath();
    ctx.moveTo(128, 26);
    ctx.lineTo(ribX, 74);
    ctx.stroke();
  }
  ctx.restore();

  // Hat top finial cap
  ctx.beginPath();
  ctx.ellipse(128, 26, 14, 5, 0, 0, Math.PI * 2);
  fillAndStroke(ctx, '#FDE68A', 5);
}

function paintSpriteCell(
  ctx: CanvasRenderingContext2D,
  key: SpriteKey,
  includeStaticLegs = true
): void {
  switch (key) {
    case 'hero_warden':
      paintHeroWarden(ctx, includeStaticLegs);
      break;
    case 'hero_seeker':
      paintHeroSeeker(ctx, includeStaticLegs);
      break;
    case 'hero_herbalist':
      paintHeroHerbalist(ctx, includeStaticLegs);
      break;
    case 'hero_stormcaller':
      paintHeroStormcaller(ctx, includeStaticLegs);
      break;
    case 'skin_warden_zagreus_naruto':
      paintSkinWardenZagreusNaruto(ctx, includeStaticLegs);
      break;
    case 'skin_seeker_hollow_levi':
      paintSkinSeekerHollowLevi(ctx, includeStaticLegs);
      break;
    case 'skin_herbalist_frieren_strange':
      paintSkinHerbalistFrierenStrange(ctx, includeStaticLegs);
      break;
    case 'skin_stormcaller_gojo_killua':
      paintSkinStormcallerGojoKillua(ctx, includeStaticLegs);
      break;
    case 'enemy_chaser_norm':
      paintEnemyChaser(ctx, false, includeStaticLegs);
      break;
    case 'enemy_chaser_elite':
      paintEnemyChaser(ctx, true, includeStaticLegs);
      break;
    case 'enemy_dasher_norm':
      paintEnemyDasher(ctx, false, includeStaticLegs);
      break;
    case 'enemy_dasher_elite':
      paintEnemyDasher(ctx, true, includeStaticLegs);
      break;
    case 'enemy_spitter_norm':
      paintEnemySpitter(ctx, false, includeStaticLegs);
      break;
    case 'enemy_spitter_elite':
      paintEnemySpitter(ctx, true, includeStaticLegs);
      break;
    case 'enemy_brute_norm':
      paintEnemyBrute(ctx, false);
      break;
    case 'enemy_brute_elite':
      paintEnemyBrute(ctx, true);
      break;
    case 'enemy_splitter_norm':
      paintEnemySplitter(ctx, false);
      break;
    case 'enemy_splitter_elite':
      paintEnemySplitter(ctx, true);
      break;
    case 'enemy_shielded_norm':
      paintEnemyShielded(ctx, false);
      break;
    case 'enemy_shielded_elite':
      paintEnemyShielded(ctx, true);
      break;
    case 'special_golden_beast':
      paintSpecialMonster(ctx, 'golden_beast');
      break;
    case 'special_bloom_giant':
      paintSpecialMonster(ctx, 'bloom_giant');
      break;
    case 'special_brood_mother':
      paintSpecialMonster(ctx, 'brood_mother');
      break;
    case 'special_mirror_wisp':
      paintSpecialMonster(ctx, 'mirror_wisp');
      break;
    case 'boss_moss_colossus':
      paintBossSprite(ctx, 'moss_colossus');
      break;
    case 'boss_thornheart_p1':
      paintBossSprite(ctx, 'p1');
      break;
    case 'boss_thornheart_p2':
      paintBossSprite(ctx, 'p2');
      break;
    case 'boss_thornheart_p3':
      paintBossSprite(ctx, 'p3');
      break;
  }
}

/**
 * Builds (or returns cached) shared single-atlas PixiJS Textures for all characters, skins & enemies.
 * Uses includeStaticLegs = false so PixiRenderer can animate articulated feet & legs at 60fps.
 */
export function getSharedSpriteAtlasTextures(): Map<SpriteKey, Texture> {
  if (cachedTextures) return cachedTextures;

  const atlasCanvas = document.createElement('canvas');
  atlasCanvas.width = CELL_SIZE * ATLAS_COLS;
  atlasCanvas.height = CELL_SIZE * ATLAS_ROWS;
  const atlasCtx = atlasCanvas.getContext('2d')!;

  const baseTexture = Texture.from(atlasCanvas);
  const map = new Map<SpriteKey, Texture>();

  ALL_SPRITE_KEYS.forEach((key, index) => {
    const col = index % ATLAS_COLS;
    const row = Math.floor(index / ATLAS_COLS);
    const ox = col * CELL_SIZE;
    const oy = row * CELL_SIZE;

    atlasCtx.save();
    atlasCtx.translate(ox, oy);
    paintSpriteCell(atlasCtx, key, false);
    atlasCtx.restore();

    const subTex = new Texture({
      source: baseTexture.source,
      frame: new Rectangle(ox, oy, CELL_SIZE, CELL_SIZE),
    });
    map.set(key, subTex);
  });

  baseTexture.source.update();
  cachedTextures = map;
  return map;
}

/**
 * Generates and caches a crisp 256x256 PNG Data-URL for UI portraits (Loadout & Bestiary).
 */
export function getSpritePortraitDataUrl(key: SpriteKey): string {
  const existing = cachedPortraitUrls.get(key);
  if (existing) return existing;

  if (typeof document === 'undefined') return '';
  const c = document.createElement('canvas');
  c.width = CELL_SIZE;
  c.height = CELL_SIZE;
  const ctx = c.getContext('2d');
  if (!ctx) return '';

  paintSpriteCell(ctx, key, true);
  const url = c.toDataURL('image/png');
  cachedPortraitUrls.set(key, url);
  return url;
}

/**
 * Generates and caches a mysterious dark shadow silhouette 256x256 PNG Data-URL
 * for locked Ad-Arcana skins in the Store until they are opened by the player.
 */
export function getSpriteSilhouetteDataUrl(key: SpriteKey): string {
  const existing = cachedSilhouetteUrls.get(key);
  if (existing) return existing;

  if (typeof document === 'undefined') return '';
  const c = document.createElement('canvas');
  c.width = CELL_SIZE;
  c.height = CELL_SIZE;
  const ctx = c.getContext('2d');
  if (!ctx) return '';

  paintSpriteCell(ctx, key, true);
  // Mask all non-transparent pixels into a deep pitch-shadow silhouette (#0B0711)
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = '#0B0711';
  ctx.fillRect(0, 0, CELL_SIZE, CELL_SIZE);
  ctx.globalCompositeOperation = 'source-over';

  const url = c.toDataURL('image/png');
  cachedSilhouetteUrls.set(key, url);
  return url;
}

export function resolvePersonaSkinSpriteKey(personaId?: string | null): SpriteKey | null {
  switch (personaId) {
    case 'warden_zagreus_naruto':
      return 'skin_warden_zagreus_naruto';
    case 'seeker_hollow_levi':
      return 'skin_seeker_hollow_levi';
    case 'herbalist_frieren_strange':
      return 'skin_herbalist_frieren_strange';
    case 'stormcaller_gojo_killua':
      return 'skin_stormcaller_gojo_killua';
    default:
      return null;
  }
}

export function resolveHeroSpriteKey(
  professionId: ProfessionId,
  personaId?: string | null
): SpriteKey {
  const skinKey = resolvePersonaSkinSpriteKey(personaId);
  if (skinKey) {
    return skinKey;
  }
  switch (professionId) {
    case 'warden':
      return 'hero_warden';
    case 'seeker':
      return 'hero_seeker';
    case 'herbalist':
      return 'hero_herbalist';
    case 'stormcaller':
      return 'hero_stormcaller';
  }
}

export function resolveEnemySpriteKey(enemy: {
  archetypeId: EnemyArchetypeId;
  isElite: boolean;
  isSpecial: boolean;
  specialId?: SpecialMonsterId | null;
  isMiniBoss: boolean;
  isFinalBoss: boolean;
  bossPhase: 1 | 2 | 3;
}): SpriteKey {
  if (enemy.isFinalBoss) {
    return enemy.bossPhase === 3
      ? 'boss_thornheart_p3'
      : enemy.bossPhase === 2
        ? 'boss_thornheart_p2'
        : 'boss_thornheart_p1';
  }
  if (enemy.isMiniBoss) {
    return 'boss_moss_colossus';
  }
  if (enemy.isSpecial && enemy.specialId) {
    return `special_${enemy.specialId}` as SpriteKey;
  }
  const suffix = enemy.isElite ? 'elite' : 'norm';
  return `enemy_${enemy.archetypeId}_${suffix}` as SpriteKey;
}
