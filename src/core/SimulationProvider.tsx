import {
  createContext,
  useState,
  useLayoutEffect,
  type ReactNode,
} from 'react';
import type { StoreApi } from 'zustand';
import type { SimConfig, TickFn, ParameterSchema } from '../types/index';
import { createSimStore, type SimStore } from './store';
import { startTickLoop } from './tick-loop';

// Per-instance store context -- enables multiple independent simulations on the same page
export type SimStoreApi<TEntities = unknown> = StoreApi<SimStore<TEntities>>;
export const SimulationContext = createContext<SimStoreApi | null>(null);

export interface SimulationProviderProps<TEntities = unknown> {
  /** User's tick function: receives entities + params, returns next entities */
  tickFn: TickFn<TEntities>;
  /** Starting entity state. Defaults to undefined (buyer sets via initialEntities). */
  initialEntities?: TEntities;
  /** Parameter schema for auto-generated UI (ParameterPanel, Phase 3) */
  parameters?: ParameterSchema;
  /** Ring buffer capacity. Default: 1000 ticks (~16s at 60fps). */
  maxHistoryLength?: number;
  /** Keep running when tab loses focus. Default: false (auto-pause). */
  keepRunning?: boolean;
  children: ReactNode;
}

export function SimulationProvider<TEntities = unknown>({
  tickFn,
  initialEntities,
  parameters,
  maxHistoryLength,
  keepRunning,
  children,
}: SimulationProviderProps<TEntities>) {
  // useState initializer form: createSimStore runs exactly once per mount
  const [store] = useState(() => {
    const storeConfig: SimConfig<TEntities> = {
      tickFn,
      initialEntities: initialEntities as TEntities,
    };
    if (parameters !== undefined) storeConfig.parameters = parameters;
    if (maxHistoryLength !== undefined) storeConfig.maxHistoryLength = maxHistoryLength;
    if (keepRunning !== undefined) storeConfig.keepRunning = keepRunning;
    return createSimStore<TEntities>(storeConfig);
  });

  // useLayoutEffect: cleanup fires synchronously -- prevents ghost rAF frames in React StrictMode
  useLayoutEffect(() => {
    return startTickLoop(store, keepRunning);
  }, [store, keepRunning]);

  // Cast: SimulationContext holds SimStore<unknown> but each provider is typed at instantiation
  return (
    <SimulationContext.Provider value={store as SimStoreApi}>
      {children}
    </SimulationContext.Provider>
  );
}
