import { useRef, useCallback, useMemo } from 'react';
import type { GridRendererProps, DrawCallback, ViewportState, CellEvent } from './types';
import { getRampLUT } from './color-ramps';
import { SimCanvas } from './SimCanvas';

/**
 * Finds indices where two ArrayLike<number> differ.
 * Exported for unit testing dirty-rect logic.
 */
export function findDirtyIndices(
  prev: ArrayLike<number>,
  next: ArrayLike<number>,
): Set<number> {
  const dirty = new Set<number>();
  const len = Math.min(prev.length, next.length);
  for (let i = 0; i < len; i++) {
    if (prev[i] !== next[i]) {
      dirty.add(i);
    }
  }
  return dirty;
}

const ACCENT_FALLBACK = '#6366f1';

/**
 * GridRenderer -- Renders a 2D grid of color-mapped cells into a SimCanvas.
 *
 * Uses a two-tier rendering strategy:
 * 1. Full repaint via ImageData for initial paint / zoom / ramp changes
 * 2. Dirty-rect updates via fillRect for incremental cell changes
 *
 * Supports configurable cellSize, borderWidth, hover/selection highlights,
 * and click/hover events with world-coordinate cell info.
 */
export const GridRenderer: React.FC<GridRendererProps> = ({
  config,
  onCellClick,
  onCellHover,
  highlightCell,
}) => {
  // Dirty-rect tracking refs
  const prevDataRef = useRef<ArrayLike<number> | null>(null);
  const offscreenRef = useRef<HTMLCanvasElement | null>(null);
  const needsFullRepaintRef = useRef(true);
  const lastScaleRef = useRef(-1);
  const lastRampRef = useRef('');
  const lastDimsRef = useRef({ w: 0, h: 0 });
  const hoveredCellRef = useRef<{ col: number; row: number } | null>(null);

  // Store viewport from onDraw for hit testing in pointer events
  const viewportRef = useRef<ViewportState>({ scale: 1, tx: 0, ty: 0, dpr: 1 });
  const canvasElRef = useRef<HTMLCanvasElement | null>(null);

  const {
    width: gridW,
    height: gridH,
    data,
    cellSize = 8,
    borderWidth = 0,
    colorRamp = 'viridis',
  } = config;

  const effectiveCellSize = Math.max(2, cellSize);
  const lut = useMemo(() => getRampLUT(colorRamp), [colorRamp]);

  const handleDraw = useCallback<DrawCallback>(
    (ctx, viewport) => {
      // Store viewport for hit testing
      viewportRef.current = viewport;

      const totalW = gridW * effectiveCellSize;
      const totalH = gridH * effectiveCellSize;
      const totalCells = gridW * gridH;

      // Detect when full repaint is needed
      if (
        needsFullRepaintRef.current ||
        viewport.scale !== lastScaleRef.current ||
        colorRamp !== lastRampRef.current ||
        gridW !== lastDimsRef.current.w ||
        gridH !== lastDimsRef.current.h
      ) {
        needsFullRepaintRef.current = true;
      }
      lastScaleRef.current = viewport.scale;
      lastRampRef.current = colorRamp;
      lastDimsRef.current = { w: gridW, h: gridH };

      // Create / resize offscreen canvas
      let offscreen = offscreenRef.current;
      if (!offscreen || offscreen.width !== totalW || offscreen.height !== totalH) {
        offscreen = document.createElement('canvas');
        offscreen.width = totalW;
        offscreen.height = totalH;
        offscreenRef.current = offscreen;
        needsFullRepaintRef.current = true;
      }

      const offCtx = offscreen.getContext('2d', { alpha: false });
      if (!offCtx) return;

      if (needsFullRepaintRef.current) {
        // --- Full repaint via ImageData ---
        const imgData = offCtx.createImageData(totalW, totalH);
        const pixels = imgData.data;

        for (let row = 0; row < gridH; row++) {
          for (let col = 0; col < gridW; col++) {
            const value = data[row * gridW + col] ?? 0;
            const lutIdx = Math.max(0, Math.min(255, Math.round(value * 255))) * 4;
            const r = lut[lutIdx]!;
            const g = lut[lutIdx + 1]!;
            const b = lut[lutIdx + 2]!;
            const a = lut[lutIdx + 3]!;

            // Fill the cellSize x cellSize block
            const startX = col * effectiveCellSize;
            const startY = row * effectiveCellSize;
            for (let py = startY; py < startY + effectiveCellSize; py++) {
              const rowOffset = py * totalW * 4;
              for (let px = startX; px < startX + effectiveCellSize; px++) {
                const idx = rowOffset + px * 4;
                pixels[idx] = r;
                pixels[idx + 1] = g;
                pixels[idx + 2] = b;
                pixels[idx + 3] = a;
              }
            }
          }
        }

        offCtx.putImageData(imgData, 0, 0);

        // Snapshot data for future dirty comparison
        const snapshot = new Float64Array(totalCells);
        for (let i = 0; i < totalCells; i++) {
          snapshot[i] = data[i] ?? 0;
        }
        prevDataRef.current = snapshot;
        needsFullRepaintRef.current = false;
      } else {
        // --- Dirty-rect incremental update ---
        const prev = prevDataRef.current;
        if (prev) {
          const dirty = findDirtyIndices(prev, data);

          if (dirty.size > 0) {
            // If >30% changed, do full repaint instead
            if (dirty.size > totalCells * 0.3) {
              needsFullRepaintRef.current = true;
              // Re-enter on next frame; for now just drawImage what we have
            } else {
              for (const idx of dirty) {
                const col = idx % gridW;
                const row = (idx / gridW) | 0;
                const value = data[idx] ?? 0;
                const lutIdx = Math.max(0, Math.min(255, Math.round(value * 255))) * 4;
                const r = lut[lutIdx]!;
                const g = lut[lutIdx + 1]!;
                const b = lut[lutIdx + 2]!;

                offCtx.fillStyle = `rgb(${r},${g},${b})`;
                offCtx.fillRect(
                  (col * effectiveCellSize) | 0,
                  (row * effectiveCellSize) | 0,
                  effectiveCellSize,
                  effectiveCellSize,
                );
              }

              // Update snapshot
              const snapshot = new Float64Array(totalCells);
              for (let i = 0; i < totalCells; i++) {
                snapshot[i] = data[i] ?? 0;
              }
              prevDataRef.current = snapshot;
            }
          }
        }
      }

      // Draw offscreen canvas to main canvas (drawImage respects transforms)
      ctx.drawImage(offscreen, 0, 0);

      // --- Border rendering (on top of fills) ---
      if (borderWidth > 0) {
        ctx.strokeStyle = 'rgba(255,255,255,0.15)';
        ctx.lineWidth = borderWidth;
        for (let row = 0; row < gridH; row++) {
          for (let col = 0; col < gridW; col++) {
            ctx.strokeRect(
              (col * effectiveCellSize) | 0,
              (row * effectiveCellSize) | 0,
              effectiveCellSize,
              effectiveCellSize,
            );
          }
        }
      }

      // --- Hover highlight ---
      const hovered = hoveredCellRef.current;
      if (hovered && hovered.col >= 0 && hovered.col < gridW && hovered.row >= 0 && hovered.row < gridH) {
        ctx.fillStyle = 'rgba(255,255,255,0.3)';
        ctx.fillRect(
          (hovered.col * effectiveCellSize) | 0,
          (hovered.row * effectiveCellSize) | 0,
          effectiveCellSize,
          effectiveCellSize,
        );
      }

      // --- Selection highlight ---
      if (highlightCell && highlightCell.col >= 0 && highlightCell.col < gridW && highlightCell.row >= 0 && highlightCell.row < gridH) {
        ctx.strokeStyle = ACCENT_FALLBACK;
        ctx.lineWidth = 2;
        ctx.strokeRect(
          (highlightCell.col * effectiveCellSize + 1) | 0,
          (highlightCell.row * effectiveCellSize + 1) | 0,
          effectiveCellSize - 2,
          effectiveCellSize - 2,
        );
      }
    },
    [config, lut, highlightCell, colorRamp, gridW, gridH, data, effectiveCellSize, borderWidth],
  );

  // --- Hit testing helpers ---
  const screenToCell = useCallback(
    (clientX: number, clientY: number): CellEvent | null => {
      const canvas = canvasElRef.current;
      if (!canvas) return null;

      const rect = canvas.getBoundingClientRect();
      const sx = clientX - rect.left;
      const sy = clientY - rect.top;

      const vp = viewportRef.current;
      const worldX = (sx - vp.tx) / vp.scale;
      const worldY = (sy - vp.ty) / vp.scale;

      const col = Math.floor(worldX / effectiveCellSize);
      const row = Math.floor(worldY / effectiveCellSize);

      if (col < 0 || col >= gridW || row < 0 || row >= gridH) return null;

      const value = data[row * gridW + col] ?? 0;
      return { col, row, value, worldX, worldY };
    },
    [gridW, gridH, data, effectiveCellSize],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const cell = screenToCell(e.clientX, e.clientY);
      const prev = hoveredCellRef.current;

      if (cell) {
        if (!prev || prev.col !== cell.col || prev.row !== cell.row) {
          hoveredCellRef.current = { col: cell.col, row: cell.row };
          onCellHover?.(cell);
        }
      } else if (prev) {
        hoveredCellRef.current = null;
        onCellHover?.(null);
      }
    },
    [screenToCell, onCellHover],
  );

  const handlePointerLeave = useCallback(() => {
    if (hoveredCellRef.current) {
      hoveredCellRef.current = null;
      onCellHover?.(null);
    }
  }, [onCellHover]);

  const handleClick = useCallback(
    (e: React.PointerEvent) => {
      const cell = screenToCell(e.clientX, e.clientY);
      if (cell) {
        onCellClick?.(cell);
      }
    },
    [screenToCell, onCellClick],
  );

  // Capture the canvas DOM element ref via a wrapper div
  const handleRef = useCallback((el: HTMLDivElement | null) => {
    if (el) {
      canvasElRef.current = el.querySelector('canvas');
    }
  }, []);

  return (
    <div
      ref={handleRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      onPointerUp={handleClick}
      style={{ display: 'inline-block' }}
    >
      <SimCanvas
        width={gridW * effectiveCellSize}
        height={gridH * effectiveCellSize}
        onDraw={handleDraw}
      />
    </div>
  );
};
