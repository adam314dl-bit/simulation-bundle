// src/demos/particles/presets.ts
// 4 particle simulation presets (DEMO-04)

import type { Preset } from '../../controls/PresetSelector';

/**
 * Four particle presets covering distinct visual/simulation regimes.
 *
 * The _trails and _blendMode keys are metadata consumed by the ParticlesDemo
 * component to configure ParticleRenderer props (not simulation parameters).
 * The _pattern key controls initial particle distribution.
 */
export const particlePresets: Preset[] = [
  {
    name: 'Galaxy spiral',
    description: 'Spiral galaxy with gravitational trails',
    config: {
      gravity: 0.8,
      timeStep: 0.016,
      damping: 0.001,
      particleCount: '1000',
      boidsEnabled: false,
      separation: 0,
      alignment: 0,
      cohesion: 0,
      _trails: true,
      _blendMode: 'additive',
      _pattern: 'ring',
    },
  },
  {
    name: 'Boids flocking',
    description: 'Self-organizing flocking behavior',
    config: {
      gravity: 0,
      timeStep: 0.016,
      damping: 0.01,
      particleCount: '1000',
      boidsEnabled: true,
      separation: 2.0,
      alignment: 1.5,
      cohesion: 1.0,
      _trails: false,
      _blendMode: 'normal',
      _pattern: 'random',
    },
  },
  {
    name: 'Orbit chaos',
    description: 'Chaotic orbits around fixed attractors',
    config: {
      gravity: 3.0,
      timeStep: 0.008,
      damping: 0,
      particleCount: '500',
      boidsEnabled: false,
      separation: 0,
      alignment: 0,
      cohesion: 0,
      _trails: false,
      _blendMode: 'normal',
      _pattern: 'random',
    },
  },
  {
    name: 'Fireworks',
    description: 'Burst patterns that fade',
    config: {
      gravity: 0.5,
      timeStep: 0.016,
      damping: 0.05,
      particleCount: '2000',
      boidsEnabled: false,
      separation: 0,
      alignment: 0,
      cohesion: 0,
      _trails: false,
      _blendMode: 'normal',
      _pattern: 'burst',
    },
  },
];
