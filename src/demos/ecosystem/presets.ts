// src/demos/ecosystem/presets.ts
// 4 named parameter presets producing distinct population dynamics.

import type { Preset } from '../../controls/PresetSelector';

export const ecosystemPresets: Preset[] = [
  {
    name: 'Stable coexistence',
    description: 'Balanced ecosystem with oscillating populations',
    config: {
      grassGrowth: 0.03,
      rabbitBreed: 0.05,
      rabbitStarve: 0.02,
      foxHunt: 0.04,
      foxDeath: 0.08,
      foxBreed: 0.03,
      initialDensity: 0.5,
      gridSize: '100',
    },
  },
  {
    name: 'Fox extinction',
    description: 'Foxes cannot sustain -- rabbits dominate',
    config: {
      grassGrowth: 0.03,
      rabbitBreed: 0.05,
      rabbitStarve: 0.02,
      foxHunt: 0.02,
      foxDeath: 0.15,
      foxBreed: 0.01,
      initialDensity: 0.5,
      gridSize: '100',
    },
  },
  {
    name: 'Overpopulation crash',
    description: 'Rabbits boom then crash from grass depletion',
    config: {
      grassGrowth: 0.01,
      rabbitBreed: 0.15,
      rabbitStarve: 0.04,
      foxHunt: 0.04,
      foxDeath: 0.08,
      foxBreed: 0.03,
      initialDensity: 0.7,
      gridSize: '100',
    },
  },
  {
    name: 'Chaos',
    description: 'High rates produce unpredictable dynamics',
    config: {
      grassGrowth: 0.08,
      rabbitBreed: 0.12,
      rabbitStarve: 0.03,
      foxHunt: 0.10,
      foxDeath: 0.05,
      foxBreed: 0.06,
      initialDensity: 0.6,
      gridSize: '100',
    },
  },
];
