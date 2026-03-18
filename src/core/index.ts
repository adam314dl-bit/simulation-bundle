// Core layer public API
// Components import from 'sim-kit/core'

// Types (re-exported for convenience -- also available from 'sim-kit' root)
export type {
  SimulationState,
  SimConfig,
  TickFn,
  PlaybackState,
  SpeedPreset,
  ParameterSchema,
  ParameterDef,
  ParameterValue,
  SimEvent,
} from '../types/index';
export { SPEED_PRESETS } from '../types/index';

// Utilities
export { RingBuffer } from '../utils/history-buffer';

// Store
export { createSimStore } from './store';
export type { SimStore } from './store';

// SimulationProvider
export { SimulationProvider, SimulationContext } from './SimulationProvider';
export type { SimulationProviderProps, SimStoreApi } from './SimulationProvider';

// Hooks
export {
  useSimulation,
  useIsRunning,
  useTick,
  useSpeed,
  usePlayback,
  useParameters,
  useEvents,
} from './useSimulation';
