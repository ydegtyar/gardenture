import type { TarotMetadata } from './types';

export const TAROT_METADATA: Readonly<Record<string, TarotMetadata>> = {
  // 12 Stat Cards (4.1 - 4.12)
  sharper_edge: { numeral: 'I', arcanaTitle: 'THE WHETSTONE' },
  quick_hands: { numeral: 'II', arcanaTitle: 'THE SWIFT GLOVES' },
  wide_swing: { numeral: 'III', arcanaTitle: 'THE SOLAR CRESCENT' },
  long_reach: { numeral: 'IV', arcanaTitle: 'THE FAR SIGHTBOLT' },
  swift_boots: { numeral: 'V', arcanaTitle: 'THE WINGED HEELS' },
  hardy_bark: { numeral: 'VI', arcanaTitle: 'THE OAK AEGIS' },
  magnet_moss: { numeral: 'VII', arcanaTitle: 'THE LODESTONE' },
  lucky_clover: { numeral: 'VIII', arcanaTitle: 'WHEEL OF CLOVER' },
  keen_eye: { numeral: 'IX', arcanaTitle: 'THE HAWK EYE' },
  iron_bark: { numeral: 'X', arcanaTitle: 'THE IRONWOOD BASTION' },
  regrowth: { numeral: 'XI', arcanaTitle: 'THE SPROUTING SEED' },
  fleet_step: { numeral: 'XII', arcanaTitle: 'THE PHANTOM STEP' },

  // 8 Behavior Cards (4.13 - 4.20)
  echo_swing: { numeral: 'XIII', arcanaTitle: 'THE TWIN ECHO' },
  thorn_trail: { numeral: 'XIV', arcanaTitle: 'THE BRIAR PATH' },
  spore_pop: { numeral: 'XV', arcanaTitle: 'THE SPORE BURST' },
  second_wind: { numeral: 'XVI', arcanaTitle: 'THE PHOENIX PLUME' },
  double_dash: { numeral: 'XVII', arcanaTitle: 'THE DUAL ZEPHYR' },
  vampiric_bloom: { numeral: 'XVIII', arcanaTitle: 'THE NIGHT ORCHID' },
  shockwave: { numeral: 'XIX', arcanaTitle: 'THE EARTH SHAKER' },
  petal_storm: { numeral: 'XX', arcanaTitle: 'THE SAKURA VORTEX' },

  // 6 Synergy Cards (4.21 - 4.26)
  piercing_slash: { numeral: 'XXI', arcanaTitle: 'THE SUNDERED WARD' },
  burning_thorns: { numeral: 'XXII', arcanaTitle: 'THE PYRE THORN' },
  healing_bloom: { numeral: 'XXIII', arcanaTitle: 'THE SACRED LOTUS' },
  chain_bloom: { numeral: 'XXIV', arcanaTitle: 'THE STORM VINE' },
  crit_burst: { numeral: 'XXV', arcanaTitle: 'THE SUPERNOVA' },
  frost_touch: { numeral: 'XXVI', arcanaTitle: 'THE RIME GRASP' },

  // 4 Risk & Reward Cards (4.27 - 4.30)
  glass_blade: { numeral: 'XXVII', arcanaTitle: 'THE GLASS RAPIER' },
  greedy_roots: { numeral: 'XXVIII', arcanaTitle: 'THE AVARICE ROOTS' },
  wild_growth: { numeral: 'XXIX', arcanaTitle: 'THE UNBOUND BLOOM' },
  blood_pact: { numeral: 'XXX', arcanaTitle: 'THE CRIMSON PACT' },

  // 6 Weapons (3.1 - 3.7)
  garden_blade: { numeral: 'I', arcanaTitle: 'BLADE OF THE GROVE' },
  leaf_blade: { numeral: 'I', arcanaTitle: 'BLADE OF THE GROVE' },
  thorn_spear: { numeral: 'II', arcanaTitle: 'THE BRIAR ARBALETE' },
  bloom_hammer: { numeral: 'III', arcanaTitle: 'MAUL OF BLOSSOMS' },
  seed_blades: { numeral: 'IV', arcanaTitle: 'DAGGERS OF WIND' },
  petal_orbit: { numeral: 'V', arcanaTitle: 'RING OF PETALS' },
  chain_lightning: { numeral: 'VI', arcanaTitle: 'SPARK OF THE SKY' },
};

export function getTarotMetadata(targetId: string): TarotMetadata {
  return (
    TAROT_METADATA[targetId] ?? {
      numeral: 'ARCANA',
      arcanaTitle: 'MYSTIC BLESSING',
    }
  );
}
