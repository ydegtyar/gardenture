import type { CardSymbolComponent } from './types';
import {
  LeafBladeSymbol,
  ThornSpearSymbol,
  SeedBladesSymbol,
  BloomHammerSymbol,
  PetalOrbitSymbol,
  ChainLightningSymbol,
} from './WeaponSymbols';
import {
  SharperEdgeSymbol,
  LongReachSymbol,
  SwiftBootsSymbol,
  HardyBarkSymbol,
  MagnetMossSymbol,
  LuckyCloverSymbol,
  KeenEyeSymbol,
  IronBarkSymbol,
  RegrowthSymbol,
  FleetStepSymbol,
} from './StatSymbols';
import {
  DoubleDashSymbol,
  SporePopSymbol,
  SecondWindSymbol,
  PetalStormSymbol,
} from './BehaviorSymbols';
import {
  EchoSlashSymbol,
  BriarThornsSymbol,
  HealingBloomSymbol,
  ChainBloomSymbol,
  ShockwaveBurstSymbol,
  FrostTouchSymbol,
} from './SynergySymbols';
import {
  VampiricBloomSymbol,
  GlassBladeSymbol,
  GreedyRootsSymbol,
  WildGrowthSymbol,
} from './RiskRewardSymbols';

/**
 * Strategy Registry mapping card target IDs to their dedicated vector symbol renderers.
 */
const SYMBOL_REGISTRY: Record<string, CardSymbolComponent> = {
  // Weapons (3.1 - 3.7)
  leaf_blade: LeafBladeSymbol,
  garden_blade: LeafBladeSymbol,
  thorn_spear: ThornSpearSymbol,
  seed_blades: SeedBladesSymbol,
  bloom_hammer: BloomHammerSymbol,
  petal_orbit: PetalOrbitSymbol,
  chain_lightning: ChainLightningSymbol,

  // Stat Cards (4.1 - 4.12)
  sharper_edge: SharperEdgeSymbol,
  quick_hands: SeedBladesSymbol,
  wide_swing: BloomHammerSymbol,
  long_reach: LongReachSymbol,
  swift_boots: SwiftBootsSymbol,
  hardy_bark: HardyBarkSymbol,
  magnet_moss: MagnetMossSymbol,
  lucky_clover: LuckyCloverSymbol,
  keen_eye: KeenEyeSymbol,
  iron_bark: IronBarkSymbol,
  regrowth: RegrowthSymbol,
  fleet_step: FleetStepSymbol,

  // Behavior Cards (4.13 - 4.20)
  echo_swing: EchoSlashSymbol,
  thorn_trail: BriarThornsSymbol,
  spore_pop: SporePopSymbol,
  second_wind: SecondWindSymbol,
  double_dash: DoubleDashSymbol,
  vampiric_bloom: VampiricBloomSymbol,
  shockwave: ShockwaveBurstSymbol,
  petal_storm: PetalStormSymbol,

  // Synergy Cards (4.21 - 4.26)
  piercing_slash: EchoSlashSymbol,
  burning_thorns: BriarThornsSymbol,
  healing_bloom: HealingBloomSymbol,
  chain_bloom: ChainBloomSymbol,
  crit_burst: ShockwaveBurstSymbol,
  frost_touch: FrostTouchSymbol,

  // Risk & Reward Cards (4.27 - 4.30)
  glass_blade: GlassBladeSymbol,
  greedy_roots: GreedyRootsSymbol,
  wild_growth: WildGrowthSymbol,
  blood_pact: VampiricBloomSymbol,
};

/**
 * Resolves the symbol renderer for a given card ID.
 * Falls back to WildGrowthSymbol if not explicitly registered.
 */
export function getCardSymbol(targetId: string): CardSymbolComponent {
  return SYMBOL_REGISTRY[targetId] ?? WildGrowthSymbol;
}

/**
 * Extensibility hook for dynamically registering or overriding card symbol renderers.
 */
export function registerCardSymbol(
  targetId: string,
  component: CardSymbolComponent
): void {
  SYMBOL_REGISTRY[targetId] = component;
}
