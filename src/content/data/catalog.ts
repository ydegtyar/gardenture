/**
 * Complete Validated Content Catalog: Swipe Roguelite (Mystic Garden & Dungeon Packs)
 * Layer 2 (content): Facade re-exporting modular constants moved closer to their usage domains:
 *
 * - PALETTE: view color definitions (src/view/palette)
 * - THEME_PACKS: biome theme specifications (src/view/renderers/bioms/themePacks)
 * - PERSONAS: hero skins & persona logic (src/view/renderers/heros/personas)
 * - PROFESSIONS: hero classes & base stats (src/sim/professions)
 * - WEAPONS: weapon specifications & level-ups (src/sim/weapons/weaponCatalog)
 * - CARDS: 30-card upgrade catalog (src/sim/systems/cardCatalog)
 * - ENEMY_ARCHETYPES & SPECIAL_MONSTERS: enemy combat stats (src/sim/enemies/enemyCatalog)
 * - POWER_UPS: tactical arena power-ups (src/sim/powerUps)
 * - WAVE_SCRIPT: spawn wave director phases (src/sim/waves/waveScript)
 * - XP_TO_NEXT_LEVEL & getXpRequiredForLevel: player leveling curve (src/sim/rules/xpProgression)
 * - STYLE_RANKS: Devil May Cry rank definitions (src/sim/rules/styleRanks)
 * - TRINKETS: permanent shop relics (src/app/trinkets/trinketCatalog)
 * - CURSES: risk/reward curse sigils (src/sim/rules/curses)
 * - BALANCE_CONFIG: tuned game balance parameters (src/sim/rules/balanceConfig)
 */

export * from '../../view/palette';
export * from '../../view/renderers/bioms/themePacks';
export * from '../../view/renderers/heros/personas';
export * from '../../sim/professions';
export * from '../../sim/weapons/weaponCatalog';
export * from '../../sim/systems/cardCatalog';
export * from '../../sim/enemies/enemyCatalog';
export * from '../../sim/powerUps';
export * from '../../sim/waves/waveScript';
export * from '../../sim/rules/xpProgression';
export * from '../../sim/rules/styleRanks';
export * from '../../app/trinkets/trinketCatalog';
export * from '../../sim/rules/curses';
export * from '../../sim/rules/balanceConfig';
