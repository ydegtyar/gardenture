import test from 'node:test';
import assert from 'node:assert/strict';

import {
  BALANCE_CONFIG,
  CARDS,
  CURSES,
  ENEMY_ARCHETYPES,
  PALETTE,
  PERSONAS,
  PERSONA_HERO_MAP,
  POWER_UPS,
  PROFESSIONS,
  SPECIAL_MONSTERS,
  STYLE_RANKS,
  THEME_PACKS,
  TRINKETS,
  WAVE_SCRIPT,
  XP_TO_NEXT_LEVEL,
  getXpRequiredForLevel,
  isPersonaRelatedToProfession,
} from './catalog';

import { PALETTE as VIEW_PALETTE } from '../../view/palette';
import { THEME_PACKS as BIOME_THEME_PACKS } from '../../view/renderers/bioms/themePacks';
import { PERSONAS as HERO_PERSONAS } from '../../view/renderers/heros/personas';
import { PROFESSIONS as SIM_PROFESSIONS } from '../../sim/professions';
import { WEAPONS as SIM_WEAPONS } from '../../sim/weapons/weaponCatalog';
import { CARDS as SIM_CARDS } from '../../sim/systems/cardCatalog';
import { ENEMY_ARCHETYPES as SIM_ENEMIES } from '../../sim/enemies/enemyCatalog';
import { POWER_UPS as SIM_POWER_UPS } from '../../sim/powerUps';
import { WAVE_SCRIPT as SIM_WAVES } from '../../sim/waves/waveScript';
import { XP_TO_NEXT_LEVEL as SIM_XP } from '../../sim/rules/xpProgression';
import { STYLE_RANKS as SIM_RANKS } from '../../sim/rules/styleRanks';
import { TRINKETS as APP_TRINKETS } from '../../app/trinkets/trinketCatalog';
import { CURSES as SIM_CURSES } from '../../sim/rules/curses';
import { BALANCE_CONFIG as SIM_BALANCE } from '../../sim/rules/balanceConfig';

test('Catalog Facade: all modular sources match re-exported catalog objects', () => {
  assert.equal(PALETTE, VIEW_PALETTE);
  assert.equal(THEME_PACKS, BIOME_THEME_PACKS);
  assert.equal(PERSONAS, HERO_PERSONAS);
  assert.equal(PROFESSIONS, SIM_PROFESSIONS);
  assert.equal(SIM_CARDS, CARDS);
  assert.equal(ENEMY_ARCHETYPES, SIM_ENEMIES);
  assert.equal(POWER_UPS, SIM_POWER_UPS);
  assert.equal(WAVE_SCRIPT, SIM_WAVES);
  assert.equal(XP_TO_NEXT_LEVEL, SIM_XP);
  assert.equal(STYLE_RANKS, SIM_RANKS);
  assert.equal(TRINKETS, APP_TRINKETS);
  assert.equal(CURSES, SIM_CURSES);
  assert.equal(BALANCE_CONFIG, SIM_BALANCE);
});

test('Catalog content counts and key definitions', () => {
  assert.equal(Object.keys(THEME_PACKS).length, 6);
  assert.equal(PERSONAS.length, 4);
  assert.equal(Object.keys(PROFESSIONS).length, 4);
  assert.equal(Object.keys(SIM_WEAPONS).length, 6);
  assert.equal(CARDS.length, 30);
  assert.equal(Object.keys(ENEMY_ARCHETYPES).length, 6);
  assert.equal(SPECIAL_MONSTERS.length, 4);
  assert.equal(Object.keys(POWER_UPS).length, 6);
  assert.equal(WAVE_SCRIPT.length, 7);
  assert.equal(STYLE_RANKS.length, 7);
  assert.equal(TRINKETS.length, 4);
  assert.equal(CURSES.length, 4);

  // Persona validation
  assert.equal(isPersonaRelatedToProfession('warden_zagreus_naruto', 'warden'), true);
  assert.equal(isPersonaRelatedToProfession('warden_zagreus_naruto', 'seeker'), false);

  // Level curve
  assert.equal(getXpRequiredForLevel(1), 6);
  assert.equal(getXpRequiredForLevel(2), 10);
});
