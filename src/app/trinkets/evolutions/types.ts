import type React from 'react';
import type { TrinketLevel } from '../types';

export interface EvolutionProps {
  level: TrinketLevel;
  uid: string;
}

export type TrinketEvolutionComponent = React.ComponentType<EvolutionProps>;
