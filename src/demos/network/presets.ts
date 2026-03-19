// src/demos/network/presets.ts
// 4 parameter presets for the social network opinion dynamics demo.

import type { Preset } from '../../controls/PresetSelector';
import type { ParameterValue } from '../../types/index';

/** All 8 parameter keys for network presets */
interface NetworkPresetValues {
  nodeCount: string;
  connectionsPerNode: number;
  confidenceThreshold: number;
  convergenceRate: number;
  interactionsPerTick: number;
  mediaNode: boolean;
  mediaBias: number;
  mediaReach: number;
}

/** Extended preset with `parameters` alias for testing convenience */
export interface NetworkPreset extends Preset {
  parameters: Record<string, ParameterValue>;
}

function makePreset(
  name: string,
  description: string,
  values: NetworkPresetValues,
): NetworkPreset {
  const config = values as unknown as Record<string, ParameterValue>;
  return { name, description, config, parameters: config };
}

export const networkPresets: NetworkPreset[] = [
  makePreset('Echo chambers', 'Low confidence creates opinion clusters', {
    nodeCount: '50',
    connectionsPerNode: 3,
    confidenceThreshold: 0.2,
    convergenceRate: 0.1,
    interactionsPerTick: 5,
    mediaNode: false,
    mediaBias: 0.8,
    mediaReach: 0.5,
  }),
  makePreset('Consensus', 'High confidence drives agreement', {
    nodeCount: '50',
    connectionsPerNode: 3,
    confidenceThreshold: 0.8,
    convergenceRate: 0.2,
    interactionsPerTick: 10,
    mediaNode: false,
    mediaBias: 0.8,
    mediaReach: 0.5,
  }),
  makePreset('Polarization', 'Extreme opinions form two poles', {
    nodeCount: '50',
    connectionsPerNode: 3,
    confidenceThreshold: 0.15,
    convergenceRate: 0.3,
    interactionsPerTick: 8,
    mediaNode: false,
    mediaBias: 0.8,
    mediaReach: 0.5,
  }),
  makePreset('Media influence', 'Network shifts toward media bias', {
    nodeCount: '50',
    connectionsPerNode: 3,
    confidenceThreshold: 0.3,
    convergenceRate: 0.1,
    interactionsPerTick: 5,
    mediaNode: true,
    mediaBias: 0.8,
    mediaReach: 0.5,
  }),
];
