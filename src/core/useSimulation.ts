import { useContext } from 'react';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/shallow';
import { SimulationContext } from './SimulationProvider';
import type { SimStore } from './store';
import type { SpeedPreset, ParameterValue, SimEvent } from '../types/index';

/**
 * Primary hook for consuming simulation state.
 * Uses shallow equality by default so object/array selectors don't cause
 * infinite re-render loops.
 *
 * @example
 * const tick = useSimulation(s => s.tick);
 * const { play, pause } = useSimulation(s => ({ play: s.play, pause: s.pause }));
 */
export function useSimulation<T>(selector: (state: SimStore) => T): T {
  const store = useContext(SimulationContext);
  if (!store) {
    throw new Error('useSimulation must be used inside SimulationProvider');
  }
  return useStore(store, useShallow(selector));
}

// Convenience selectors -- minimise re-renders by subscribing to specific slices

/** Subscribe to the running state only. */
export const useIsRunning = (): boolean => useSimulation((s) => s.running);

/** Subscribe to tick count only. */
export const useTick = (): number => useSimulation((s) => s.tick);

/** Subscribe to speed only. */
export const useSpeed = (): SpeedPreset => useSimulation((s) => s.speed);

/** Subscribe to full playback control slice. */
export const usePlayback = () =>
  useSimulation((s) => ({
    running: s.running,
    tick: s.tick,
    speed: s.speed,
    historySize: s.history.size,
    play: s.play,
    pause: s.pause,
    toggle: s.toggle,
    step: s.step,
    stepBack: s.stepBack,
    setSpeed: s.setSpeed,
    seekToTick: s.seekToTick,
  }));

/** Subscribe to current parameter values. */
export const useParameters = (): Record<string, ParameterValue> =>
  useSimulation((s) => s.parameters);

/** Subscribe to simulation events. */
export const useEvents = (): SimEvent[] =>
  useSimulation((s) => s.events);
