import type { TrinketId } from '../types';
import type { TrinketEvolutionComponent } from './types';
import { AegisLeafEvolution } from './AegisLeafEvolution';
import { CloverCharmEvolution } from './CloverCharmEvolution';
import { MagnetRootEvolution } from './MagnetRootEvolution';
import { WindAnkletEvolution } from './WindAnkletEvolution';

/**
 * Strategy Registry mapping trinket IDs to their visual evolution components.
 */
const EVOLUTION_REGISTRY: Record<string, TrinketEvolutionComponent> = {
  aegis_leaf: AegisLeafEvolution,
  clover_charm: CloverCharmEvolution,
  magnet_root: MagnetRootEvolution,
  wind_anklet: WindAnkletEvolution,
};

/**
 * Resolves the visual evolution component for a given trinket.
 */
export function getTrinketEvolution(
  trinketId: TrinketId
): TrinketEvolutionComponent | null {
  return EVOLUTION_REGISTRY[trinketId] ?? null;
}

/**
 * Allows dynamic registration or overriding of trinket evolution strategies.
 */
export function registerTrinketEvolution(
  trinketId: TrinketId,
  component: TrinketEvolutionComponent
): void {
  EVOLUTION_REGISTRY[trinketId] = component;
}
