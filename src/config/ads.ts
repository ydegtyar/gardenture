/**
 * Ad & Monetization Configuration
 * Controlled via Vite environment variables:
 * - VITE_NO_ADS: When 'true', completely strips/hides all ad-related UI and unlocks
 *   personas exclusively via in-game Rare Seeds.
 */

export const NO_ADS: boolean =
  typeof import.meta !== 'undefined' && import.meta.env
    ? import.meta.env.VITE_NO_ADS === 'true'
    : false;

/**
 * Big amount of Rare Seeds required to unlock an Arcana Persona skin
 * when ads are disabled (e.g. itch.io publishing).
 */
export const PERSONA_NO_ADS_COST_SEEDS = 50;
