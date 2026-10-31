import type { TrinketDef } from '../../content/schema/types';

export const TRINKETS: TrinketDef[] = [
  {
    id: 'aegis_leaf',
    name: 'Aegis Leaf Brooch',
    description: 'Start every run with an Aegis Shield power-up and +10 Max HP per level (+10 / +20 / +30 HP).',
    costCoins: 120,
    upgradeCostCoinsLv2: 180,
    upgradeCostSeedsLv3: 4,
    levelDescriptions: [
      'Lv 1: Start every run with an Aegis Shield and +10 Max HP.',
      'Lv 2: Start every run with an Aegis Shield and +20 Max HP.',
      'Lv 3: Start every run with an Aegis Shield and +30 Max HP.',
    ],
  },
  {
    id: 'clover_charm',
    name: 'Gilded Clover Charm',
    description: '+12 starting Luck and +1 extra free Card Reroll per level (up to 3 free rerolls).',
    costCoins: 160,
    upgradeCostCoinsLv2: 240,
    upgradeCostSeedsLv3: 5,
    levelDescriptions: [
      'Lv 1: +12 starting Luck and 1 free Card Reroll per run.',
      'Lv 2: +12 starting Luck and 2 free Card Rerolls per run.',
      'Lv 3: +12 starting Luck and 3 free Card Rerolls per run.',
    ],
  },
  {
    id: 'magnet_root',
    name: 'Amber Magnet Root',
    description: '+20% base Gem Pickup Radius (+10% per upgrade level) & +15% Coin rewards.',
    costCoins: 140,
    upgradeCostCoinsLv2: 210,
    upgradeCostSeedsLv3: 4,
    levelDescriptions: [
      'Lv 1: +20% Gem Pickup Radius & +15% Coin rewards.',
      'Lv 2: +30% Gem Pickup Radius & +15% Coin rewards.',
      'Lv 3: +40% Gem Pickup Radius & +15% Coin rewards.',
    ],
  },
  {
    id: 'wind_anklet',
    name: 'Sylph Feather Anklet',
    description: '+3% Move Speed per level (+3% / +6% / +9%), +5% Dodge at Lv 2, and +1 extra Dash at Lv 3.',
    costCoins: 200,
    upgradeCostCoinsLv2: 280,
    upgradeCostSeedsLv3: 6,
    levelDescriptions: [
      'Lv 1: +3% Move Speed and -0.25 s Dash Cooldown.',
      'Lv 2: +6% Move Speed, +5% Dodge Chance, and -0.25 s Dash Cooldown.',
      'Lv 3: +9% Move Speed, +5% Dodge Chance, +1 Extra Dash, and -0.25 s Dash Cooldown.',
    ],
  },
];
