// Props interfaces for all Phase 5 data visualization components

export interface StatConfig {
  label: string;
  value: number;
  format?: Intl.NumberFormatOptions;  // passed to Intl.NumberFormat
  sparkline?: number[];               // historical values for inline SVG sparkline
  unit?: string;                      // optional suffix (e.g. "%", "fps")
}

export interface StatsPanelProps {
  stats: StatConfig[];
  columns?: 1 | 2;                   // default 2 (matching ParameterPanel compact mode)
  showChange?: boolean;               // show up/down arrows, default true
  changeThreshold?: number;           // percentage change threshold, default 0 (any change)
  className?: string;
}

export interface MiniChartProps {
  /** Zustand selector returning the numeric value to chart */
  selector: (state: Record<string, unknown>) => number;
  /** Number of data points to display. Default 60 */
  windowSize?: number;
  /** Chart width in px. Default 200 */
  width?: number;
  /** Chart height in px. Default 80 */
  height?: number;
  /** Line/fill color. Default var(--sim-accent) */
  color?: string;
  /** Show last value overlay. Default true */
  showLastValue?: boolean;
  /** Label text shown above chart */
  label?: string;
  className?: string;
}

export interface EventLogProps {
  /** Maximum visible height in px. Default 300 */
  maxHeight?: number;
  /** Filter by severity types. Default: all shown */
  severityFilter?: Array<'info' | 'warning' | 'critical'>;
  /** Enable auto-scroll to newest events. Default true */
  autoScroll?: boolean;
  /** Row height in px for virtualization. Default 32 */
  rowHeight?: number;
  /** Called when user clicks an event row */
  onEventClick?: (event: import('../types/index').SimEvent) => void;
  className?: string;
}

export interface HeatmapOverlayProps {
  /** 2D scalar field data as flat Float64Array, row-major */
  data: Float64Array;
  /** Grid width (columns) */
  gridWidth: number;
  /** Grid height (rows) */
  gridHeight: number;
  /** Color ramp name from built-in ramps. Default 'viridis' */
  colorRamp?: string;
  /** Overall opacity 0-1. Default 0.7 */
  opacity?: number;
  /** Enable bilinear interpolation. Default true */
  interpolate?: boolean;
  /** Show color legend bar. Default true */
  showLegend?: boolean;
  /** Value range [min, max] for normalization. Default [0, 1] */
  range?: [number, number];
  className?: string;
}

export interface EntityInspectorProps {
  /** Entity object to inspect */
  entity: Record<string, unknown>;
  /** Entity display name/title */
  title?: string;
  /** Panel position. Default 'right' */
  position?: 'right' | 'bottom' | 'floating';
  /** Track toggle callback. Called with true/false when user toggles tracking */
  onTrack?: (tracked: boolean) => void;
  /** Whether entity is currently being tracked. Default false */
  tracked?: boolean;
  /** Numeric property keys that should show inline MiniCharts */
  chartKeys?: string[];
  /** Historical data for chartKeys: { [key]: number[] } */
  chartData?: Record<string, number[]>;
  className?: string;
}
