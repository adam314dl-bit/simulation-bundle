// src/types/index.ts
// All public types for sim-kit. Imported by all layer implementations.

/** Generic simulation state — buyers extend this with their domain state */
export interface SimulationState<TEntities = unknown> {
  tick: number;
  entities: TEntities;
  running: boolean;
  speed: SpeedPreset;
  parameters: Record<string, ParameterValue>;
  history: {
    capacity: number;
    size: number;
    get(index: number): TEntities | undefined;
    push(item: TEntities): void;
  };
  events: SimEvent[];
}

/** Simulation configuration passed to SimulationProvider */
export interface SimConfig<TEntities = unknown> {
  initialEntities: TEntities;
  tickFn: TickFn<TEntities>;
  parameters?: ParameterSchema;
  maxHistoryLength?: number;  // default: 1000
  keepRunning?: boolean;      // override background-tab auto-pause, default: false
}

/** User-supplied tick function: receives current entities + config, returns next entities */
export type TickFn<TEntities = unknown> = (
  entities: TEntities,
  config: Record<string, ParameterValue>
) => TEntities;

/** Playback state exposed via useSimulation */
export interface PlaybackState {
  tick: number;
  running: boolean;
  speed: SpeedPreset;
  historySize: number;
}

/** Speed multiplier presets (CORE-05) */
export type SpeedPreset = 0.25 | 0.5 | 1 | 2 | 4 | 8 | 16;

/** All valid speed values as a runtime array */
export const SPEED_PRESETS: SpeedPreset[] = [0.25, 0.5, 1, 2, 4, 8, 16];

/** A single parameter definition for ParameterPanel auto-generation */
export type ParameterSchema = Record<string, ParameterDef>;

export type ParameterDef =
  | { type: 'range'; min: number; max: number; step?: number; default: number; label?: string }
  | { type: 'toggle'; default: boolean; label?: string }
  | { type: 'select'; options: string[]; default: string; label?: string }
  | { type: 'color'; default: string; label?: string }
  | { type: 'vec2'; min: number; max: number; default: [number, number]; label?: string }
  | { type: 'group'; label: string; children: ParameterSchema };

/** Runtime parameter value types */
export type ParameterValue = number | boolean | string | [number, number];

/** A logged simulation event */
export interface SimEvent {
  id: string;
  tick: number;
  timestamp: number;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
  data?: Record<string, unknown>;
}
