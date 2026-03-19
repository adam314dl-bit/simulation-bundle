// src/rendering/types.ts
// All rendering-specific types for Phase 2 canvas rendering.

import type { ReactNode } from 'react';

export interface ViewportState {
  scale: number;
  tx: number;
  ty: number;
  dpr: number;
}

export type DrawCallback = (ctx: CanvasRenderingContext2D, viewport: ViewportState) => void;

export interface GridConfig {
  width: number;          // grid columns
  height: number;         // grid rows
  data: ArrayLike<number>;  // flat array of cell values
  cellSize?: number;      // default 8
  borderWidth?: number;   // default 0
  colorRamp?: string;     // ramp name, default 'viridis'
}

export interface CellEvent {
  col: number;
  row: number;
  value: number;
  worldX: number;
  worldY: number;
}

export type SelectionMode = 'rect' | 'lasso' | 'none';

export interface RectSelection {
  type: 'rect';
  bounds: { x: number; y: number; width: number; height: number };
}

export interface LassoSelection {
  type: 'lasso';
  vertices: [number, number][];
}

export type Selection = RectSelection | LassoSelection;

export interface LayerStackProps {
  children: ReactNode;
  selectionMode?: SelectionMode;
  onSelect?: (selection: Selection) => void;
  className?: string;
}

export interface SimCanvasProps {
  width?: number;
  height?: number;
  onDraw: DrawCallback;
  className?: string;
}

export interface GridRendererProps {
  config: GridConfig;
  onCellClick?: (event: CellEvent) => void;
  onCellHover?: (event: CellEvent | null) => void;
  highlightCell?: { col: number; row: number } | null;
}

// --- Phase 4: Advanced Rendering types ---

/** Particle data input: interleaved Float32Array [x, y, vx, vy, x, y, vx, vy, ...] */
export interface ParticleRendererProps {
  /** Interleaved Float32Array: [x, y, vx, vy] per particle, stride=4 floats */
  data: Float32Array;
  /** Number of active particles (may be less than data.length/4) */
  count: number;
  /** CSS pixel width */
  width?: number;
  /** CSS pixel height */
  height?: number;
  /** Color ramp name from built-in ramps */
  colorRamp?: string;
  /** Color mapping mode or custom function returning 0-1 */
  colorMap?: 'velocity' | ((particle: { x: number; y: number; vx: number; vy: number }) => number);
  /** Point size in pixels, clamped to GPU max. Default 4 */
  pointSize?: number;
  /** Enable trail effect. Default false */
  trails?: boolean;
  /** Trail fade alpha (0.02-0.15). Default 0.05 */
  trailAlpha?: number;
  /** Blending mode for trails. Default "additive" */
  blendMode?: 'additive' | 'normal';
  /** Renderer selection. Default "auto" */
  renderer?: 'auto' | 'webgl2' | 'canvas2d';
  /** Called when WebGL2 is unavailable and Canvas2D fallback activates */
  onFallback?: (reason: string) => void;
  /** Additional CSS class */
  className?: string;
}

/** ForceGraph node type extending d3-force SimulationNodeDatum */
export interface GraphNode {
  id: string;
  group?: number;
  label?: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  index?: number;
  [key: string]: unknown;
}

/** ForceGraph link type */
export interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  [key: string]: unknown;
}

export interface ForceGraphProps {
  nodes: GraphNode[];
  links: GraphLink[];
  width?: number;
  height?: number;
  /** Node radius in px or function. Default 8 */
  nodeRadius?: number | ((node: GraphNode) => number);
  /** Node fill color function. Default: category10 by group */
  nodeColor?: (node: GraphNode) => string;
  /** Node label function. Default: no labels */
  nodeLabel?: (node: GraphNode) => string;
  /** Label font size. Default 10 */
  labelSize?: number;
  /** Link width in px or function. Default 1 */
  linkWidth?: number | ((link: GraphLink) => number);
  /** Link color. Default: --sim-border */
  linkColor?: string | ((link: GraphLink) => string);
  /** Link opacity. Default 0.4 */
  linkOpacity?: number;
  /** Link curvature (0=straight). Default 0 */
  linkCurvature?: number;
  /** Charge force strength. Default -30 */
  charge?: number;
  /** Link distance. Default 30 */
  linkDistance?: number;
  /** Center force strength. Default 1 */
  centerStrength?: number;
  /** Collision radius. Default 0 (disabled) */
  collisionRadius?: number;
  /** Alpha decay rate. Default 0.0228 */
  alphaDecay?: number;
  /** Alpha threshold for auto-pause. Default 0.001 */
  alphaMin?: number;
  /** Node count threshold for Canvas2D mode. Default 500 */
  canvasThreshold?: number;
  /** Called when simulation stabilizes (alpha < alphaMin) */
  onStabilize?: () => void;
  /** Node hover callback */
  onNodeHover?: (node: GraphNode | null) => void;
  /** Node click callback */
  onNodeClick?: (node: GraphNode) => void;
  /** Custom tooltip content */
  tooltipContent?: (node: GraphNode) => ReactNode;
  /** Additional CSS class */
  className?: string;
}
