import { createStore } from 'zustand/vanilla';
import type { StoreApi } from 'zustand/vanilla';
import type { TickFn, SpeedPreset, ParameterSchema, ParameterValue, SimEvent, SimConfig } from '../types/index';
import { RingBuffer } from '../utils/history-buffer';

export interface SimStore<TEntities = unknown> {
  // State
  tick: number;
  running: boolean;
  speed: SpeedPreset;
  entities: TEntities;
  parameters: Record<string, ParameterValue>;
  defaultParameters: Record<string, ParameterValue>;
  history: RingBuffer<TEntities>;
  events: SimEvent[];
  tickFn: TickFn<TEntities>;

  // Actions
  play: () => void;
  pause: () => void;
  toggle: () => void;
  step: () => void;
  stepBack: () => void;
  setSpeed: (speed: SpeedPreset) => void;
  setParameter: (key: string, value: ParameterValue) => void;
  resetParameters: () => void;
  seekToTick: (targetTick: number) => void;
  logEvent: (event: Omit<SimEvent, 'id' | 'timestamp'>) => void;
  subscribe: (listener: () => void) => () => void;
}

function extractDefaultParameters(schema?: ParameterSchema): Record<string, ParameterValue> {
  if (!schema) return {};
  const defaults: Record<string, ParameterValue> = {};
  for (const [key, def] of Object.entries(schema)) {
    if (def.type === 'group') {
      const groupDefaults = extractDefaultParameters(def.children);
      Object.assign(defaults, groupDefaults);
    } else {
      defaults[key] = def.default;
    }
  }
  return defaults;
}

let eventCounter = 0;

export function createSimStore<TEntities = unknown>(
  config: SimConfig<TEntities>
): StoreApi<SimStore<TEntities>> {
  const capacity = config.maxHistoryLength ?? 1000;
  const defaultParams = extractDefaultParameters(config.parameters);

  return createStore<SimStore<TEntities>>((set, get, store) => ({
    tick: 0,
    running: false,
    speed: 1,
    entities: config.initialEntities as TEntities,
    parameters: { ...defaultParams },
    defaultParameters: { ...defaultParams },
    history: new RingBuffer<TEntities>(capacity),
    events: [],
    tickFn: config.tickFn,

    play: () => set({ running: true }),
    pause: () => set({ running: false }),
    toggle: () => set((s) => ({ running: !s.running })),

    step: () => {
      const s = get();
      const nextEntities = s.tickFn(s.entities, s.parameters);
      s.history.push(nextEntities);
      set({ entities: nextEntities, tick: s.tick + 1 });
    },

    stepBack: () => {
      const { tick, history } = get();
      if (tick === 0) return;
      const prev = history.get(tick - 1);
      if (prev !== undefined) {
        set({ entities: prev, tick: tick - 1, running: false });
      }
    },

    setSpeed: (speed: SpeedPreset) => set({ speed }),

    setParameter: (key: string, value: ParameterValue) =>
      set((s) => ({ parameters: { ...s.parameters, [key]: value } })),

    resetParameters: () =>
      set((s) => ({ parameters: { ...s.defaultParameters } })),

    seekToTick: (targetTick: number) => {
      const { history } = get();
      const snapshot = history.get(targetTick);
      if (snapshot !== undefined) {
        set({ entities: snapshot, tick: targetTick, running: false });
      }
    },

    logEvent: (event: Omit<SimEvent, 'id' | 'timestamp'>) => {
      const id = `evt-${++eventCounter}`;
      const newEvent: SimEvent = { ...event, id, timestamp: Date.now() };
      set((s) => ({ events: [...s.events.slice(-999), newEvent] }));
    },

    subscribe: (listener: () => void) => store.subscribe(listener),
  }));
}
