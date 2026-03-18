// src/rendering/types.ts
// All rendering-specific types for Phase 2 canvas rendering.

import type * as React from 'react';

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
  children: React.ReactNode;
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
