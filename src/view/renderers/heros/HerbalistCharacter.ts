import * as PIXI from 'pixi.js';

/**
 * ============================================================================
 * HERBALIST SUPPORT HERO - CHUNKY CHIBI PIXIJS (v8) COMPONENT
 * ============================================================================
 *
 * Style specifications:
 * - Proportions: Chunky chibi, head is about half the total height (~32px of 64px),
 *   body is a simple rounded block, no visible legs, feet are two small rounded boots.
 * - Outline: One thick dark plum outline (#2a1a2e, about 3px at 64px height), uniform
 *   weight on every part. No thin inner detail lines.
 * - Shading: Flat colors with one soft shade tone per material (base + a lighter inner
 *   area or a darker bottom edge).
 * - Face: Two dark eyes with white specular catchlight, brows, blush on both cheeks.
 *   No nose or mouth.
 * - Scale: High-contrast, readable at 64px, pivot at feet (0, 0), transparent background.
 */

// ============================================================================
// 1. PALETTE (HEX & NUMERIC CONSTANTS FOR RESKINNING)
// ============================================================================

export const HERBALIST_PALETTE = {
  /** Thick uniform outline (#2a1a2e, ~3px at 64px height) */
  plumOutline: '#2a1a2e',

  /** Wide straw hat: pale yellow brim */
  strawYellow: '#fef08a',
  /** Straw hat soft shade tone along bottom rim */
  strawShade: '#fde047',

  /** Golden dome of the hat & flower center */
  goldenYellow: '#f59e0b',
  /** Golden dome soft bottom shade edge */
  goldenShade: '#d97706',

  /** Hat band ribbon */
  bandGreen: '#10b981',

  /** Blooming flower petals on hat */
  flowerPink: '#f472b6',

  /** Peach skin base (face & small hands) */
  peachSkin: '#fed7aa',
  /** Peach soft shade under hat brim */
  peachShadow: '#fbb696',
  /** Rosy cheek blush */
  blushPink: '#f472b6',

  /** Short brown hair tufts at sides of head */
  brownHair: '#78350f',

  /** Green tunic rounded block */
  tunicGreen: '#22c55e',
  /** Green tunic inner light center panel */
  tunicLightGreen: '#86efac',
  /** Green tunic bottom shade edge */
  tunicShadow: '#16a34a',

  /** White curved trim over shoulders & specular sparkles */
  creamWhite: '#fffdf0',

  /** Floating glass orb & detached mint leaves */
  mintOrb: '#5eead4',
  /** Luminous additive glow for orb & heal burst */
  mintGlow: '#99f6e4',

  /** Short wooden staff */
  woodBrown: '#b45309',
  /** Short wooden staff bottom shade */
  woodShadow: '#78350f',

  /** Two small rounded boots */
  bootsBrown: '#78350f',
} as const;

export const HERBALIST_PALETTE_NUM = {
  plumOutline: 0x2a1a2e,
  strawYellow: 0xfef08a,
  strawShade: 0xfde047,
  goldenYellow: 0xf59e0b,
  goldenShade: 0xd97706,
  bandGreen: 0x10b981,
  flowerPink: 0xf472b6,
  peachSkin: 0xfed7aa,
  peachShadow: 0xfbb696,
  blushPink: 0xf472b6,
  brownHair: 0x78350f,
  tunicGreen: 0x22c55e,
  tunicLightGreen: 0x86efac,
  tunicShadow: 0x16a34a,
  creamWhite: 0xfffdf0,
  mintOrb: 0x5eead4,
  mintGlow: 0x99f6e4,
  woodBrown: 0xb45309,
  woodShadow: 0x78350f,
  bootsBrown: 0x78350f,
} as const;

// ============================================================================
// 2. PARTS LIST & Z-ORDER SPECIFICATION
// ============================================================================

export interface HerbalistPartSpec {
  zOrder: number;
  id: string;
  name: string;
  refSize: string;
  anchor: string;
  blendMode: 'normal' | 'add';
  description: string;
}

export const HERBALIST_PARTS_LIST: readonly HerbalistPartSpec[] = [
  {
    zOrder: 0,
    id: 'groundRing',
    name: 'Heal Ground Ring',
    refSize: '0x0 to 64x26px ellipse',
    anchor: 'Bottom Center (0, 0)',
    blendMode: 'normal',
    description: 'Expanding mint wave ring on ground during cast_heal animation',
  },
  {
    zOrder: 10,
    id: 'boots',
    name: 'Rounded Boots',
    refSize: '9x5px each (2 boots)',
    anchor: 'Ground Contact (0, 0)',
    blendMode: 'normal',
    description: 'Two small rounded brown boots with dark plum outline',
  },
  {
    zOrder: 20,
    id: 'staff',
    name: 'Wooden Staff',
    refSize: '5x22px rod',
    anchor: 'Right Hand Pivot (15, -15)',
    blendMode: 'normal',
    description: 'Short wooden rod on right side, tilted ~15 deg with rounded caps',
  },
  {
    zOrder: 30,
    id: 'body',
    name: 'Tunic Block & Hands',
    refSize: 'Tunic 26x21px, Center 14x16px, Hands 6.5px dia',
    anchor: 'Waist Base (0, -6)',
    blendMode: 'normal',
    description: 'Green tunic rounded block, light green center panel, white curved shoulder trims, peach hands',
  },
  {
    zOrder: 40,
    id: 'head',
    name: 'Head & Face',
    refSize: 'Face 26px dia, Hair 7x12px sides',
    anchor: 'Neck Bob Pivot (0, -36)',
    blendMode: 'normal',
    description: 'Peach face, short brown side hair, dark eyes with catchlights, brows, cheek blush',
  },
  {
    zOrder: 50,
    id: 'eyelids',
    name: 'Blinking Eyelids',
    refSize: 'Two 4px curved arcs',
    anchor: 'Eye Centers (±5, -34.5)',
    blendMode: 'normal',
    description: 'Closed eyelid curves visible only during spontaneous blinks every 3-5s',
  },
  {
    zOrder: 60,
    id: 'hat',
    name: 'Wide Straw Sun-Hat',
    refSize: 'Brim 48x15px, Dome 24x13px, Band 24x4.5px, Flower 10px',
    anchor: 'Hat Base (0, -43)',
    blendMode: 'normal',
    description: 'Pale yellow rim, golden dome, green ribbon band, pink daisy with yellow center on right side',
  },
  {
    zOrder: 70,
    id: 'orb',
    name: 'Mint Glass Orb & Glow',
    refSize: 'Orb 13px dia, Soft Glow 28px dia',
    anchor: 'Floating Center (-19, -17)',
    blendMode: 'add',
    description: 'Floating mint glass sphere with white shine and multi-ring additive soft glow',
  },
  {
    zOrder: 80,
    id: 'floatingAccents',
    name: 'Floating Leaves & Stars',
    refSize: 'Leaves 6x3px, Stars 5x5px',
    anchor: 'Detached Offsets around character',
    blendMode: 'normal',
    description: '2-3 detached mint leaves and 1-2 white 4-point sparkle stars drifting organically',
  },
  {
    zOrder: 90,
    id: 'particles',
    name: 'Sparkle Particle Pool',
    refSize: '3px to 6px particles',
    anchor: 'Ground / Orb Center',
    blendMode: 'add',
    description: 'Pre-allocated pool of 32 particles for heal sparkles and harvest leaf bursts',
  },
] as const;

// ============================================================================
// 3. ANIMATION STATES & PARTICLE POOL
// ============================================================================

export type HerbalistAnimationState = 'idle' | 'cast_heal' | 'harvest';

interface SparkleParticle {
  active: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  scale: number;
  rotation: number;
  vRot: number;
  life: number;
  maxLife: number;
  type: 'sparkle' | 'leaf';
  color: number;
}

// ============================================================================
// 4. PIXIJS (v8) HERBALIST CHARACTER CLASS
// ============================================================================

/**
 * Chunky Chibi Herbalist Hero Container for PixiJS (v8).
 * Standalone, modular, zero external game logic dependency.
 */
export class HerbalistCharacter extends PIXI.Container {
  /** Active animation state */
  public currentState: HerbalistAnimationState = 'idle';

  /** Elapsed time in active state (seconds) */
  private stateTimer = 0;

  /** Total elapsed lifetime (seconds) */
  private totalElapsed = 0;

  /** Blink timer (counts down to next blink) */
  private blinkTimer = 3.5;
  private isBlinking = false;
  private blinkDuration = 0.14;

  /** Layered Pixi Display Objects */
  private readonly groundRingGraphic: PIXI.Graphics;
  private readonly bootsGraphic: PIXI.Graphics;
  private readonly staffGraphic: PIXI.Graphics;

  private readonly bodyContainer: PIXI.Container;
  private readonly bodyGraphic: PIXI.Graphics;
  private readonly handsGraphic: PIXI.Graphics;

  private readonly headContainer: PIXI.Container;
  private readonly headGraphic: PIXI.Graphics;
  private readonly eyelidsGraphic: PIXI.Graphics;

  private readonly hatContainer: PIXI.Container;
  private readonly hatGraphic: PIXI.Graphics;

  private readonly orbContainer: PIXI.Container;
  private readonly orbGlowGraphic: PIXI.Graphics;
  private readonly orbGraphic: PIXI.Graphics;

  private readonly floatingAccentsGraphic: PIXI.Graphics;
  private readonly particleGraphic: PIXI.Graphics;
  private readonly gardenBladeGraphic: PIXI.Graphics;

  /** Whether the Herbalist has drafted/equipped the Garden Blade card */
  public hasGardenBlade = false;

  /** Active Garden Blade swing state */
  public gardenBladeState: {
    level: number;
    evolved: boolean;
    phase: string;
    phaseTimer: number;
    swingCounter: number;
  } = {
    level: 1,
    evolved: false,
    phase: 'ready',
    phaseTimer: 0,
    swingCounter: 0,
  };

  /** Attached PIXI Ticker callback if auto-ticker is used */
  private tickerRef: PIXI.Ticker | null = null;
  private tickerCallback: ((ticker: PIXI.Ticker) => void) | null = null;

  /** Pre-allocated particle pool (32 items, zero garbage collection) */
  private readonly particlePool: SparkleParticle[] = [];

  // Base transformation anchors (at 64px reference scale)
  private readonly baseHeadY = 0;
  private readonly baseOrbX = -19;
  private readonly baseOrbY = -17;
  private readonly baseStaffAngle = 0.26; // ~15 degrees

  constructor() {
    super();

    // Pivot at feet (ground contact is at 0, 0; bounds are x: -32..+32, y: -64..0)
    this.pivot.set(0, 0);

    // Initialize display objects
    this.groundRingGraphic = new PIXI.Graphics();
    this.bootsGraphic = new PIXI.Graphics();
    this.staffGraphic = new PIXI.Graphics();

    this.bodyContainer = new PIXI.Container();
    this.bodyGraphic = new PIXI.Graphics();
    this.handsGraphic = new PIXI.Graphics();
    this.bodyContainer.addChild(this.bodyGraphic, this.handsGraphic);

    this.headContainer = new PIXI.Container();
    this.headGraphic = new PIXI.Graphics();
    this.eyelidsGraphic = new PIXI.Graphics();

    this.hatContainer = new PIXI.Container();
    this.hatGraphic = new PIXI.Graphics();
    this.hatContainer.addChild(this.hatGraphic);

    this.headContainer.addChild(this.headGraphic, this.eyelidsGraphic, this.hatContainer);

    this.orbContainer = new PIXI.Container();
    this.orbGlowGraphic = new PIXI.Graphics();
    this.orbGlowGraphic.blendMode = 'add';
    this.orbGraphic = new PIXI.Graphics();
    this.orbContainer.addChild(this.orbGlowGraphic, this.orbGraphic);
    this.orbContainer.position.set(this.baseOrbX, this.baseOrbY);

    this.floatingAccentsGraphic = new PIXI.Graphics();
    this.particleGraphic = new PIXI.Graphics();
    this.particleGraphic.blendMode = 'add';
    this.gardenBladeGraphic = new PIXI.Graphics();

    // Assemble in exact Z-order
    this.addChild(
      this.groundRingGraphic,      // Z: 0
      this.bootsGraphic,           // Z: 10
      this.staffGraphic,           // Z: 20
      this.bodyContainer,          // Z: 30
      this.gardenBladeGraphic,     // Z: 35
      this.headContainer,          // Z: 40 (contains hat & eyelids)
      this.orbContainer,           // Z: 70
      this.floatingAccentsGraphic, // Z: 80
      this.particleGraphic         // Z: 90
    );

    // Pre-allocate 32 particles
    for (let i = 0; i < 32; i++) {
      this.particlePool.push({
        active: false,
        x: 0,
        y: 0,
        vx: 0,
        vy: 0,
        alpha: 0,
        scale: 1,
        rotation: 0,
        vRot: 0,
        life: 0,
        maxLife: 1,
        type: 'sparkle',
        color: HERBALIST_PALETTE_NUM.creamWhite,
      });
    }

    // Draw static graphics layers
    this.drawBoots();
    this.drawStaff(this.baseStaffAngle);
    this.drawBody();
    this.drawHead();
    this.drawEyelids();
    this.drawHat();
    this.drawOrb(1.0);

    // Schedule initial blink interval
    this.resetBlinkTimer();
  }

  /**
   * Getter for ergonomic access if consumer code calls `character.container`
   */
  public get container(): PIXI.Container {
    return this;
  }

  // ==========================================================================
  // GRAPHICS DRAWING METHODS (64px Chunky Chibi Geometry)
  // ==========================================================================

  /**
   * Part 5: Boots
   * Two small rounded boots in wood brown with thick plum outline (#2a1a2e).
   */
  private drawBoots(): void {
    const g = this.bootsGraphic;
    g.clear();
    const P = HERBALIST_PALETTE_NUM;

    // Left boot
    g.roundRect(-10, -5.5, 9, 5.5, 2.5)
      .fill({ color: P.bootsBrown })
      .stroke({ color: P.plumOutline, width: 3, cap: 'round', join: 'round' });
    // Left boot soft bottom shade
    g.roundRect(-9, -2.5, 7, 2, 1)
      .fill({ color: P.plumOutline, alpha: 0.35 });

    // Right boot
    g.roundRect(1, -5.5, 9, 5.5, 2.5)
      .fill({ color: P.bootsBrown })
      .stroke({ color: P.plumOutline, width: 3, cap: 'round', join: 'round' });
    // Right boot soft bottom shade
    g.roundRect(2, -2.5, 7, 2, 1)
      .fill({ color: P.plumOutline, alpha: 0.35 });
  }

  /**
   * Part 4 (Right): Short Wooden Staff
   */
  private drawStaff(angleRad: number, offsetY = 0): void {
    const g = this.staffGraphic;
    g.clear();
    const P = HERBALIST_PALETTE_NUM;

    g.position.set(15, -15 + offsetY);
    g.rotation = angleRad;

    // Wooden shaft (22px long, 5px wide)
    g.roundRect(-2.5, -9, 5, 22, 2.5)
      .fill({ color: P.woodBrown })
      .stroke({ color: P.plumOutline, width: 3, cap: 'round', join: 'round' });

    // Soft shade tone along bottom edge
    g.roundRect(-2, 7, 4, 5, 1.5)
      .fill({ color: P.woodShadow });
  }

  /**
   * Part 3 & 4: Green Tunic Block, Center Panel, Curved Trim, Peach Hands
   */
  private drawBody(): void {
    const g = this.bodyGraphic;
    const gh = this.handsGraphic;
    g.clear();
    gh.clear();
    const P = HERBALIST_PALETTE_NUM;

    // 1. Green tunic rounded block (26x21px, radius 6px)
    g.roundRect(-13, -26, 26, 21, 6)
      .fill({ color: P.tunicGreen })
      .stroke({ color: P.plumOutline, width: 3, cap: 'round', join: 'round' });

    // 2. Soft bottom shadow tone on tunic (three-tone shading)
    g.roundRect(-11, -9, 22, 3.5, 2)
      .fill({ color: P.tunicShadow });

    // 3. Lighter green center panel (14x16px, radius 4px) - no thin inner outline
    g.roundRect(-7, -24, 14, 16, 4)
      .fill({ color: P.tunicLightGreen });

    // 4. White curved shoulder trim over each shoulder
    // Left shoulder trim
    g.moveTo(-13, -21)
      .quadraticCurveTo(-10, -26, -6, -25)
      .lineTo(-6, -22)
      .quadraticCurveTo(-10, -23, -13, -18)
      .closePath()
      .fill({ color: P.creamWhite })
      .stroke({ color: P.plumOutline, width: 1.5, join: 'round' });

    // Right shoulder trim
    g.moveTo(13, -21)
      .quadraticCurveTo(10, -26, 6, -25)
      .lineTo(6, -22)
      .quadraticCurveTo(10, -23, 13, -18)
      .closePath()
      .fill({ color: P.creamWhite })
      .stroke({ color: P.plumOutline, width: 1.5, join: 'round' });

    // 5. Small Peach Hands
    // Left hand holding near orb (always present)
    gh.circle(-13, -16.5, 3.2)
      .fill({ color: P.peachSkin })
      .stroke({ color: P.plumOutline, width: 2.5 });

    // Right hand holding staff:
    // When Garden Blade is equipped, hand with stick is removed!
    if (!this.hasGardenBlade) {
      gh.circle(13, -14.5, 3.2)
        .fill({ color: P.peachSkin })
        .stroke({ color: P.plumOutline, width: 2.5 });
    }
  }

  /**
   * Equips or unequips the Garden Blade card on the Herbalist.
   * If equipped:
   * - The hand with the wooden stick is removed.
   * - The Garden Blade hand is attached to the exact place (13, -14.5) where the hand with the stick was!
   */
  public setGardenBlade(
    hasBlade: boolean,
    state?: Partial<{
      level: number;
      evolved: boolean;
      phase: string;
      phaseTimer: number;
      swingCounter: number;
    }>
  ): void {
    this.hasGardenBlade = hasBlade;
    if (state) {
      this.gardenBladeState = {
        ...this.gardenBladeState,
        ...state,
      };
    }

    this.staffGraphic.visible = !hasBlade;
    this.gardenBladeGraphic.visible = hasBlade;
    this.drawBody();

    if (hasBlade) {
      this.drawGardenBladeAttachment(0);
    } else {
      this.gardenBladeGraphic.clear();
      this.drawStaff(this.baseStaffAngle);
    }
  }

  /** Convenience alias for setGardenBlade */
  public equipGardenBlade(
    hasBlade = true,
    state?: Partial<{
      level: number;
      evolved: boolean;
      phase: string;
      phaseTimer: number;
      swingCounter: number;
    }>
  ): void {
    this.setGardenBlade(hasBlade, state);
  }

  /**
   * Renders the Garden Blade and its gripping hand attached to the exact place
   * where the hand with the stick was placed (x: 13, y: -14.5).
   */
  private drawGardenBladeAttachment(timeSec: number): void {
    const g = this.gardenBladeGraphic;
    g.clear();
    if (!this.hasGardenBlade) return;

    const P = HERBALIST_PALETTE_NUM;
    const sword = this.gardenBladeState;
    const isEvolved = sword.evolved;
    const bladeColor = isEvolved ? 0xfbbf24 : P.mintOrb;

    // Hand socket position (exact place where hand with stick was placed)
    const socketX = 13.0;
    const socketY = -14.5;
    const shoulderX = 6.0;
    const shoulderY = -21.0;

    // Idle breathing & swing phase animation
    const swingDir = sword.swingCounter % 2 === 0 ? 1 : -1;
    let localAngle = 0.85 + Math.sin(timeSec * 3.5) * 0.08; // Resting upright angle
    let handX = socketX + Math.cos(timeSec * 3.5) * 0.4;
    let handY = socketY + Math.sin(timeSec * 3.5) * 0.6;

    if (sword.phase === 'windup') {
      const t = Math.min(1, Math.max(0, 1 - sword.phaseTimer / 0.06));
      localAngle = 0.85 + swingDir * -0.6 * t;
      handX = socketX - 2.0 * t;
    } else if (sword.phase === 'active') {
      const t = Math.min(1, Math.max(0, 1 - sword.phaseTimer / 0.08));
      const ease = 1 - Math.pow(1 - t, 2);
      localAngle = (0.85 - swingDir * 0.6) + swingDir * 1.5 * ease;
      handX = socketX + 4.0 * ease;
    } else if (sword.phase === 'recovery') {
      const t = Math.min(1, Math.max(0, 1 - sword.phaseTimer / 0.05));
      localAngle = (0.85 + swingDir * 0.9) - swingDir * 0.9 * t;
      handX = socketX + 4.0 * (1 - t);
    }

    // 1. Arm connecting shoulder to the hand socket
    const midX = (shoulderX + handX) * 0.5 + 2.0;
    const midY = (shoulderY + handY) * 0.5;

    g.moveTo(shoulderX, shoulderY)
      .lineTo(midX, midY)
      .lineTo(handX, handY)
      .stroke({ color: P.plumOutline, width: 6.5, cap: 'round', join: 'round' });
    g.moveTo(shoulderX, shoulderY)
      .lineTo(midX, midY)
      .stroke({ color: P.tunicGreen, width: 3.8, cap: 'round' });
    g.moveTo(midX, midY)
      .lineTo(handX, handY)
      .stroke({ color: P.creamWhite, width: 3.4, cap: 'round' });

    // 2. Garden Blade transformed to hand socket
    const m = new PIXI.Matrix();
    m.rotate(localAngle);
    m.translate(handX, handY);
    g.setTransform(m);

    const bladeLen = 15 + Math.min(6, sword.level) * 0.9 + (isEvolved ? 3 : 0);
    const bladeHalfW = (isEvolved ? 4.8 : 3.8);
    const mainMintColor = isEvolved ? 0xfbbf24 : 0x7be0a8;
    const shadedEdgeColor = isEvolved ? 0xeab308 : 0x4fb67f;

    // 1. Pommel
    g.circle(0, 4.8, 2.2)
      .fill({ color: P.goldenYellow })
      .stroke({ color: P.plumOutline, width: 1.8 });

    // 2. Wrapped grip
    g.roundRect(-1.5, 0.8, 3, 4, 1)
      .fill({ color: 0x7a482b })
      .stroke({ color: P.plumOutline, width: 1.8 });
    g.moveTo(-1.2, 2.2)
      .lineTo(1.2, 3.0)
      .stroke({ color: 0x4a2612, width: 1.2, cap: 'round' });

    // 3. Golden crossguard with tiny leaf gem
    g.moveTo(-4.5, 0.8)
      .lineTo(-1.8, -0.6)
      .lineTo(0, -1.2)
      .lineTo(1.8, -0.6)
      .lineTo(4.5, 0.8)
      .lineTo(1.8, 1.8)
      .lineTo(0, 1.2)
      .lineTo(-1.8, 1.8)
      .closePath()
      .fill({ color: P.goldenYellow })
      .stroke({ color: P.plumOutline, width: 1.8, join: 'round' });

    // Tiny center leaf gem
    g.circle(0, -0.2, 1.1)
      .fill({ color: 0x7be0a8 })
      .stroke({ color: P.plumOutline, width: 0.9 });

    // 4. Chunky Chibi Leaf Blade: smooth curved broad leaf pointing to -bladeLen
    // Left half (shaded #4fb67f)
    g.moveTo(0, -1.2)
      .bezierCurveTo(-bladeHalfW * 1.05, -bladeLen * 0.35, -bladeHalfW * 0.85, -bladeLen * 0.72, 0, -bladeLen)
      .lineTo(0, -1.2)
      .closePath()
      .fill({ color: shadedEdgeColor });

    // Right half (main mint #7be0a8)
    g.moveTo(0, -1.2)
      .bezierCurveTo(bladeHalfW * 1.05, -bladeLen * 0.35, bladeHalfW * 0.85, -bladeLen * 0.72, 0, -bladeLen)
      .lineTo(0, -1.2)
      .closePath()
      .fill({ color: mainMintColor });

    // Outline
    g.moveTo(0, -1.2)
      .bezierCurveTo(-bladeHalfW * 1.05, -bladeLen * 0.35, -bladeHalfW * 0.85, -bladeLen * 0.72, 0, -bladeLen)
      .bezierCurveTo(bladeHalfW * 0.85, -bladeLen * 0.72, bladeHalfW * 1.05, -bladeLen * 0.35, 0, -1.2)
      .closePath()
      .stroke({ color: P.plumOutline, width: 2.0, join: 'round' });

    // Pale midrib line (#e2f8eb) & short side veins
    g.moveTo(0, -2)
      .lineTo(0, -bladeLen + 1.5)
      .stroke({ color: 0xe2f8eb, width: 1.2, alpha: 0.95, cap: 'round' });
    g.moveTo(0, -bladeLen * 0.4)
      .lineTo(bladeHalfW * 0.5, -bladeLen * 0.52)
      .stroke({ color: 0xe2f8eb, width: 1.0, alpha: 0.85, cap: 'round' });
    g.moveTo(0, -bladeLen * 0.55)
      .lineTo(-bladeHalfW * 0.48, -bladeLen * 0.66)
      .stroke({ color: 0xe2f8eb, width: 1.0, alpha: 0.85, cap: 'round' });

    g.setTransform(new PIXI.Matrix());

    // 3. Peach hand gripping the Garden Blade hilt (placed right at socket)
    g.circle(handX, handY, 3.2)
      .fill({ color: P.peachSkin })
      .stroke({ color: P.plumOutline, width: 2.5 });
  }

  /**
   * Part 2: Head, Hair, Face, Blush, Eyes, Brows
   */
  private drawHead(): void {
    const g = this.headGraphic;
    g.clear();
    const P = HERBALIST_PALETTE_NUM;

    // 1. Short brown hair showing at the sides of the head
    // Left hair tuft
    g.ellipse(-12, -37, 3.8, 6.2)
      .fill({ color: P.brownHair })
      .stroke({ color: P.plumOutline, width: 3, cap: 'round', join: 'round' });

    // Right hair tuft
    g.ellipse(12, -37, 3.8, 6.2)
      .fill({ color: P.brownHair })
      .stroke({ color: P.plumOutline, width: 3, cap: 'round', join: 'round' });

    // 2. Peach Skin Face under the brim (diameter 26px)
    g.circle(0, -36, 13)
      .fill({ color: P.peachSkin })
      .stroke({ color: P.plumOutline, width: 3, cap: 'round', join: 'round' });

    // 3. Soft shadow under hat brim over upper half of face
    g.moveTo(-12.8, -37)
      .arc(0, -36, 12.8, Math.PI, 0)
      .quadraticCurveTo(0, -32, -12.8, -37)
      .closePath()
      .fill({ color: P.peachShadow, alpha: 0.9 });

    // 4. Rosy blush on both cheeks
    g.ellipse(-6.5, -31.5, 2.5, 1.4)
      .fill({ color: P.blushPink, alpha: 0.65 });
    g.ellipse(6.5, -31.5, 2.5, 1.4)
      .fill({ color: P.blushPink, alpha: 0.65 });

    // 5. Dark Eyes with small white specular highlight dot
    // Left eye
    g.ellipse(-5, -35, 1.8, 2.2)
      .fill({ color: P.plumOutline });
    g.circle(-5.7, -35.7, 0.7)
      .fill({ color: 0xffffff });

    // Right eye
    g.ellipse(5, -35, 1.8, 2.2)
      .fill({ color: P.plumOutline });
    g.circle(4.3, -35.7, 0.7)
      .fill({ color: 0xffffff });

    // 6. Cute Brows (short curved strokes)
    g.moveTo(-7, -39)
      .lineTo(-3, -39)
      .stroke({ color: P.plumOutline, width: 2, cap: 'round' });
    g.moveTo(3, -39)
      .lineTo(7, -39)
      .stroke({ color: P.plumOutline, width: 2, cap: 'round' });
  }

  /**
   * Eyelids Overlay for Spontaneous Blinking
   */
  private drawEyelids(): void {
    const g = this.eyelidsGraphic;
    g.clear();
    const P = HERBALIST_PALETTE_NUM;

    // Left eyelid closed curve
    g.moveTo(-7, -34.5)
      .quadraticCurveTo(-5, -33, -3, -34.5)
      .stroke({ color: P.plumOutline, width: 2.5, cap: 'round' });

    // Right eyelid closed curve
    g.moveTo(3, -34.5)
      .quadraticCurveTo(5, -33, 7, -34.5)
      .stroke({ color: P.plumOutline, width: 2.5, cap: 'round' });

    this.eyelidsGraphic.visible = false;
  }

  /**
   * Part 1: Wide Straw Sun-Hat
   * Improved silhouette matching reference art:
   * - Rounded cloche/boater golden dome with soft warm highlight
   * - Wide, gently curved pale yellow brim with soft underside depth
   * - 3D perspective curved green ribbon band wrapping the crown base
   * - Cute 5-petal pink blossom with golden center and leaf sprig on right
   */
  private drawHat(): void {
    const g = this.hatGraphic;
    g.clear();
    const P = HERBALIST_PALETTE_NUM;

    // 1. Golden Crown Dome (rounded cloche silhouette rising from y: -43.5 up to y: -57.5)
    g.moveTo(-13, -43)
      .quadraticCurveTo(-12, -52, -8, -56)
      .quadraticCurveTo(0, -58.5, 8, -56)
      .quadraticCurveTo(12, -52, 13, -43)
      .closePath()
      .fill({ color: P.goldenYellow })
      .stroke({ color: P.plumOutline, width: 3, cap: 'round', join: 'round' });

    // Soft warm dome shadow edge along the base
    g.moveTo(-12.5, -43)
      .quadraticCurveTo(0, -40.5, 12.5, -43)
      .quadraticCurveTo(0, -44.5, -12.5, -43)
      .closePath()
      .fill({ color: P.goldenShade, alpha: 0.6 });

    // Soft sun highlight on upper-left dome
    g.moveTo(-7, -55)
      .quadraticCurveTo(0, -57, 5, -55)
      .stroke({ color: P.strawYellow, width: 1.5, cap: 'round', alpha: 0.85 });

    // 2. Wide Straw Rim / Brim (52x16.5px, softly curved oval)
    g.ellipse(0, -42, 26, 8.2)
      .fill({ color: P.strawYellow })
      .stroke({ color: P.plumOutline, width: 3, cap: 'round', join: 'round' });

    // Soft underside depth tone along bottom rim curve (three-tone shading)
    g.moveTo(-24.5, -42)
      .quadraticCurveTo(0, -34.8, 24.5, -42)
      .quadraticCurveTo(0, -37.2, -24.5, -42)
      .closePath()
      .fill({ color: P.strawShade, alpha: 0.85 });

    // 3. 3D Perspective Curved Green Ribbon Band
    // Follows the cylindrical round curve of the dome base across the brim
    g.moveTo(-13, -43.5)
      .quadraticCurveTo(0, -40.8, 13, -43.5)
      .lineTo(13, -47.2)
      .quadraticCurveTo(0, -44.5, -13, -47.2)
      .closePath()
      .fill({ color: P.bandGreen })
      .stroke({ color: P.plumOutline, width: 2.5, cap: 'round', join: 'round' });

    // Ribbon subtle top highlight line
    g.moveTo(-12, -46.5)
      .quadraticCurveTo(0, -43.8, 12, -46.5)
      .stroke({ color: 0x6ee7b7, width: 1.0, alpha: 0.75, cap: 'round' });

    // 4. Blooming Pink Blossom on the Right Side of the Band
    const fx = 11.2;
    const fy = -45.5;

    // Tiny botanical leaf sprig peeking out behind flower
    g.moveTo(fx - 4, fy - 2)
      .quadraticCurveTo(fx - 7, fy - 6, fx - 5, fy - 7)
      .quadraticCurveTo(fx - 3, fy - 4, fx - 4, fy - 2)
      .closePath()
      .fill({ color: P.bandGreen })
      .stroke({ color: P.plumOutline, width: 1.5 });

    // 5 plump rounded pink petals with uniform plum outline
    const petalCount = 5;
    for (let i = 0; i < petalCount; i++) {
      const a = (i * Math.PI * 2) / petalCount - 0.28;
      const px = fx + Math.cos(a) * 3.8;
      const py = fy + Math.sin(a) * 3.8;
      g.circle(px, py, 2.9)
        .fill({ color: P.flowerPink })
        .stroke({ color: P.plumOutline, width: 1.8, join: 'round' });
    }

    // Golden pollen button center
    g.circle(fx, fy, 2.2)
      .fill({ color: P.goldenYellow })
      .stroke({ color: P.plumOutline, width: 1.5 });
  }

  /**
   * Part 4 (Left): Mint Glass Orb with Additive Soft Glow
   */
  private drawOrb(glowMultiplier = 1.0): void {
    const gg = this.orbGlowGraphic;
    const g = this.orbGraphic;
    gg.clear();
    g.clear();
    const P = HERBALIST_PALETTE_NUM;

    // Advanced: Multi-ring soft additive glow
    const baseGlowR = 14 * glowMultiplier;
    gg.circle(0, 0, baseGlowR * 1.4).fill({ color: P.mintGlow, alpha: 0.08 * glowMultiplier });
    gg.circle(0, 0, baseGlowR * 1.0).fill({ color: P.mintGlow, alpha: 0.18 * glowMultiplier });
    gg.circle(0, 0, baseGlowR * 0.7).fill({ color: P.mintGlow, alpha: 0.35 * glowMultiplier });
    gg.circle(0, 0, baseGlowR * 0.4).fill({ color: 0xffffff, alpha: 0.45 * glowMultiplier });

    // Mint glass circle (diameter 13px)
    g.circle(0, 0, 6.5)
      .fill({ color: P.mintOrb })
      .stroke({ color: P.plumOutline, width: 3, cap: 'round', join: 'round' });

    // White specular shine crescent / dot in top-left
    g.circle(-2.2, -2.2, 1.8)
      .fill({ color: 0xffffff });
  }

  /**
   * Part 6: Floating Mint Leaves & Sparkles
   */
  private updateFloatingAccents(time: number): void {
    const g = this.floatingAccentsGraphic;
    g.clear();
    const P = HERBALIST_PALETTE_NUM;

    // Accent 1: Mint leaf (left side)
    const l1x = -22 + Math.cos(time * 1.8) * 1.2;
    const l1y = -34 + Math.sin(time * 2.2) * 2.0;
    this.drawLeafIcon(g, l1x, l1y, -0.4 + Math.sin(time * 1.5) * 0.2, 6.5, 3.2);

    // Accent 2: Mint leaf (right side)
    const l2x = 21 + Math.sin(time * 1.6) * 1.2;
    const l2y = -28 + Math.cos(time * 2.0) * 1.8;
    this.drawLeafIcon(g, l2x, l2y, 0.6 + Math.cos(time * 1.4) * 0.2, 6.0, 3.0);

    // Accent 3: Small mint leaf (lower left)
    const l3x = -17 + Math.sin(time * 2.4) * 1.0;
    const l3y = -6 + Math.sin(time * 1.7) * 1.5;
    this.drawLeafIcon(g, l3x, l3y, 0.2 + Math.sin(time * 1.9) * 0.15, 5.0, 2.5);

    // Sparkle 1: White 4-point star glint (near orb)
    const s1Alpha = 0.5 + 0.5 * Math.sin(time * 5.5);
    const s1x = -20;
    const s1y = -10 + Math.sin(time * 2.0) * 1.2;
    this.drawSparkleStar(g, s1x, s1y, 4.5, s1Alpha);

    // Sparkle 2: White 4-point star glint (upper right)
    const s2Alpha = 0.5 + 0.5 * Math.sin(time * 4.8 + 1.2);
    const s2x = 22;
    const s2y = -40 + Math.cos(time * 2.2) * 1.5;
    this.drawSparkleStar(g, s2x, s2y, 4.0, s2Alpha);
  }

  private drawLeafIcon(
    g: PIXI.Graphics,
    x: number,
    y: number,
    rotRad: number,
    length: number,
    width: number
  ): void {
    const P = HERBALIST_PALETTE_NUM;
    const cosR = Math.cos(rotRad);
    const sinR = Math.sin(rotRad);
    const perpX = -sinR * width;
    const perpY = cosR * width;
    const fwdX = cosR * length;
    const fwdY = sinR * length;

    g.moveTo(x - fwdX * 0.5, y - fwdY * 0.5)
      .quadraticCurveTo(x + perpX * 0.8, y + perpY * 0.8, x + fwdX * 0.5, y + fwdY * 0.5)
      .quadraticCurveTo(x - perpX * 0.8, y - perpY * 0.8, x - fwdX * 0.5, y - fwdY * 0.5)
      .closePath()
      .fill({ color: P.mintOrb })
      .stroke({ color: P.plumOutline, width: 2 });
  }

  private drawSparkleStar(
    g: PIXI.Graphics,
    x: number,
    y: number,
    size: number,
    alpha: number
  ): void {
    const P = HERBALIST_PALETTE_NUM;
    const h = size * 0.5;
    g.moveTo(x, y - size)
      .quadraticCurveTo(x, y, x + size, y)
      .quadraticCurveTo(x, y, x, y + size)
      .quadraticCurveTo(x, y, x - size, y)
      .quadraticCurveTo(x, y, x, y - size)
      .closePath()
      .fill({ color: P.creamWhite, alpha });
  }

  // ==========================================================================
  // PARTICLE POOL METHODS (Zero Allocations on Frame Ticks)
  // ==========================================================================

  private spawnParticle(
    x: number,
    y: number,
    vx: number,
    vy: number,
    type: 'sparkle' | 'leaf',
    maxLife: number,
    color: number
  ): void {
    for (const p of this.particlePool) {
      if (!p.active) {
        p.active = true;
        p.x = x;
        p.y = y;
        p.vx = vx;
        p.vy = vy;
        p.alpha = 1.0;
        p.scale = type === 'leaf' ? 1.0 : 0.8 + Math.random() * 0.4;
        p.rotation = Math.random() * Math.PI * 2;
        p.vRot = (Math.random() - 0.5) * 8.0;
        p.life = 0;
        p.maxLife = maxLife;
        p.type = type;
        p.color = color;
        return;
      }
    }
  }

  private updateParticles(dtSec: number): void {
    const g = this.particleGraphic;
    g.clear();

    for (const p of this.particlePool) {
      if (!p.active) continue;

      p.life += dtSec;
      if (p.life >= p.maxLife) {
        p.active = false;
        continue;
      }

      const progress = p.life / p.maxLife;
      p.x += p.vx * dtSec;
      p.y += p.vy * dtSec;
      p.vy += (p.type === 'leaf' ? 25 : -10) * dtSec; // Leaves drift down, sparkles drift up
      p.rotation += p.vRot * dtSec;
      p.alpha = 1.0 - progress;

      if (p.type === 'sparkle') {
        const s = (4 * p.scale) * (1 - progress * 0.5);
        this.drawSparkleStar(g, p.x, p.y, s, p.alpha);
      } else {
        // Falling leaf particle
        const s = 5 * p.scale;
        this.drawLeafIcon(g, p.x, p.y, p.rotation, s, s * 0.5);
      }
    }
  }

  // ==========================================================================
  // ANIMATION STATE TRIGGERS & TICKER
  // ==========================================================================

  /**
   * Trigger any of the defined animation states.
   * Durations:
   * - idle: continuous
   * - cast_heal: 1.2s (orb brightens, mint ground ring expands, sparkles/leaves rise)
   * - harvest: 0.8s (small crouch, staff tap, mint leaves pop up from ground)
   */
  public playState(state: HerbalistAnimationState): void {
    this.currentState = state;
    this.stateTimer = 0;

    if (state === 'cast_heal') {
      // Immediate burst of particles from the orb
      for (let i = 0; i < 8; i++) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.4;
        const speed = 25 + Math.random() * 35;
        this.spawnParticle(
          this.baseOrbX + (Math.random() - 0.5) * 6,
          this.baseOrbY + (Math.random() - 0.5) * 6,
          Math.cos(angle) * speed,
          Math.sin(angle) * speed,
          i % 3 === 0 ? 'leaf' : 'sparkle',
          0.9 + Math.random() * 0.5,
          i % 3 === 0 ? HERBALIST_PALETTE_NUM.mintOrb : HERBALIST_PALETTE_NUM.mintGlow
        );
      }
    } else if (state === 'harvest') {
      // Staff taps downward
      this.drawStaff(0.55, 3);
    }
  }

  /** Convenience alias for cast_heal */
  public castHeal(): void {
    this.playState('cast_heal');
  }

  /** Convenience alias for harvest */
  public harvest(): void {
    this.playState('harvest');
  }

  private resetBlinkTimer(): void {
    // Spontaneous blink every 3 to 5 seconds
    this.blinkTimer = 3.0 + Math.random() * 2.0;
  }

  /**
   * Main animation tick update.
   * Can be driven manually or via attached PIXI Ticker.
   */
  public update(dtSec: number): void {
    this.totalElapsed += dtSec;
    this.stateTimer += dtSec;
    const t = this.totalElapsed;

    // 1. Spontaneous Blinking (every 3-5 s for 0.14 s)
    if (!this.isBlinking) {
      this.blinkTimer -= dtSec;
      if (this.blinkTimer <= 0) {
        this.isBlinking = true;
        this.eyelidsGraphic.visible = true;
      }
    } else {
      this.blinkDuration -= dtSec;
      if (this.blinkDuration <= 0) {
        this.isBlinking = false;
        this.eyelidsGraphic.visible = false;
        this.blinkDuration = 0.14;
        this.resetBlinkTimer();
      }
    }

    // 2. Idle Harmonic Oscillations
    // Body breathing (scaleY 1.0 to 1.02)
    const breath = 1.0 + Math.sin(t * 3.2) * 0.015;
    // Head & hat bob
    const headBob = Math.sin(t * 3.2 - 0.4) * 0.75;
    // Orb floating drift
    const orbDriftY = Math.sin(t * 2.6) * 1.8;
    const orbDriftX = Math.cos(t * 1.9) * 0.6;

    // 3. State-Specific Overrides
    if (this.currentState === 'cast_heal') {
      const duration = 1.2;
      const progress = Math.min(1, this.stateTimer / duration);

      // Expanding mint ring on the ground beneath feet
      const ringG = this.groundRingGraphic;
      ringG.clear();
      const ringRadiusX = progress * 34;
      const ringRadiusY = progress * 14;
      const ringAlpha = (1 - progress) * 0.85;
      ringG.ellipse(0, 0, ringRadiusX, ringRadiusY).stroke({
        color: HERBALIST_PALETTE_NUM.mintOrb,
        width: 2.5 * (1 - progress * 0.4),
        alpha: ringAlpha,
      });

      // Orb brightens and surges
      const glowSurge = 1.0 + Math.sin(progress * Math.PI) * 1.5;
      this.drawOrb(glowSurge);
      this.orbContainer.position.set(this.baseOrbX + orbDriftX, this.baseOrbY + orbDriftY - progress * 4);

      // Continuous particle emission during cast
      if (Math.random() < 0.45) {
        const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
        this.spawnParticle(
          this.baseOrbX + (Math.random() - 0.5) * 4,
          this.baseOrbY - 2,
          Math.cos(angle) * (20 + Math.random() * 25),
          Math.sin(angle) * (20 + Math.random() * 25),
          Math.random() < 0.3 ? 'leaf' : 'sparkle',
          0.8 + Math.random() * 0.4,
          HERBALIST_PALETTE_NUM.mintGlow
        );
      }

      // Hero tilt back slightly in spellcasting pose
      this.bodyContainer.scale.set(1.0, breath * 1.01);
      this.headContainer.position.set(0, this.baseHeadY + headBob - 1);
      this.staffGraphic.rotation = this.baseStaffAngle - 0.12;

      if (progress >= 1.0) {
        ringG.clear();
        this.playState('idle');
      }
    } else if (this.currentState === 'harvest') {
      const duration = 0.8;
      const progress = Math.min(1, this.stateTimer / duration);

      // Small crouch -> Spring -> Settle
      let crouchScaleY = 1.0;
      let crouchOffsetY = 0;
      if (progress < 0.3) {
        // Crouch anticipation (drops 2.5px, scaleY 0.88)
        const p = progress / 0.3;
        crouchScaleY = 1.0 - p * 0.12;
        crouchOffsetY = p * 2.5;
      } else if (progress < 0.6) {
        // Spring up (scaleY 1.05)
        const p = (progress - 0.3) / 0.3;
        crouchScaleY = 0.88 + p * 0.18;
        crouchOffsetY = 2.5 - p * 3.5;

        // Pop leaves up from the ground once at spring transition
        if (this.stateTimer - dtSec < 0.24 && this.stateTimer >= 0.24) {
          for (let i = 0; i < 6; i++) {
            const spreadX = (Math.random() - 0.5) * 22;
            const vy = -45 - Math.random() * 30;
            const vx = (Math.random() - 0.5) * 28;
            this.spawnParticle(
              spreadX,
              0,
              vx,
              vy,
              'leaf',
              0.8 + Math.random() * 0.4,
              HERBALIST_PALETTE_NUM.mintOrb
            );
          }
        }
      } else {
        // Settle back to 1.0
        const p = (progress - 0.6) / 0.4;
        crouchScaleY = 1.06 - p * 0.06;
        crouchOffsetY = -1.0 + p * 1.0;
      }

      this.bodyContainer.scale.set(1.0, crouchScaleY);
      this.bodyContainer.position.set(0, crouchOffsetY);
      this.headContainer.position.set(0, this.baseHeadY + crouchOffsetY);
      this.orbContainer.position.set(this.baseOrbX + orbDriftX, this.baseOrbY + crouchOffsetY + orbDriftY);

      if (progress >= 1.0) {
        this.drawStaff(this.baseStaffAngle, 0);
        this.playState('idle');
      }
    } else {
      // Idle state
      this.groundRingGraphic.clear();
      this.bodyContainer.scale.set(1.0, breath);
      this.bodyContainer.position.set(0, 0);
      this.headContainer.position.set(0, this.baseHeadY + headBob);
      this.orbContainer.position.set(this.baseOrbX + orbDriftX, this.baseOrbY + orbDriftY);
      this.drawOrb(1.0);
    }

    // 4. Update Detached Accents & Particles
    this.updateFloatingAccents(t);
    this.updateParticles(dtSec);

    // 5. Update Garden Blade if equipped (replaces hand with stick)
    if (this.hasGardenBlade) {
      this.drawGardenBladeAttachment(t);
    }
  }

  /**
   * Bind directly to a PixiJS Ticker for automatic frame updates.
   */
  public attachTicker(ticker?: PIXI.Ticker): void {
    this.detachTicker();
    const t = ticker ?? PIXI.Ticker.shared;
    this.tickerRef = t;
    this.tickerCallback = (tick: PIXI.Ticker) => {
      this.update(tick.deltaTime / 60);
    };
    t.add(this.tickerCallback);
  }

  /**
   * Detach from the PixiJS Ticker.
   */
  public detachTicker(): void {
    if (this.tickerRef && this.tickerCallback) {
      this.tickerRef.remove(this.tickerCallback);
      this.tickerRef = null;
      this.tickerCallback = null;
    }
  }

  /**
   * Cleanup resources upon removal.
   */
  public override destroy(options?: PIXI.DestroyOptions): void {
    this.detachTicker();
    super.destroy(options);
  }
}
