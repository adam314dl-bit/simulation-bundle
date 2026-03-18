import { useRef, useEffect, useCallback } from 'react';
import type { LayerStackProps, Selection } from './types';

const SVG_NS = 'http://www.w3.org/2000/svg';
const DEFAULT_ACCENT = '#6366f1';
const STROKE_DASH = '6 3';
const STROKE_WIDTH = '1.5';
const FILL_OPACITY = '0.5';

function getAccentColor(el: HTMLElement): string {
  const value = getComputedStyle(el).getPropertyValue('--sim-accent').trim();
  return value || DEFAULT_ACCENT;
}

function hexToRgba(hex: string, alpha: number): string {
  // Handle both #abc and #aabbcc formats
  let r: number, g: number, b: number;
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    r = parseInt(clean[0]! + clean[0]!, 16);
    g = parseInt(clean[1]! + clean[1]!, 16);
    b = parseInt(clean[2]! + clean[2]!, 16);
  } else {
    r = parseInt(clean.slice(0, 2), 16);
    g = parseInt(clean.slice(2, 4), 16);
    b = parseInt(clean.slice(4, 6), 16);
  }
  return `rgba(${r},${g},${b},${alpha})`;
}

function applySelectionStyle(el: SVGElement, accent: string): void {
  el.setAttribute('stroke', accent);
  el.setAttribute('stroke-dasharray', STROKE_DASH);
  el.setAttribute('stroke-width', STROKE_WIDTH);
  el.setAttribute('fill', hexToRgba(accent, parseFloat(FILL_OPACITY)));
}

/**
 * LayerStack -- Compositing container for multiple rendering layers with SVG annotation overlay.
 *
 * Children are stacked in DOM order (first child = bottom, last = top).
 * When selectionMode is 'rect' or 'lasso', an SVG overlay is rendered topmost
 * for drag selection. Selection coordinates are container-relative.
 */
export const LayerStack: React.FC<LayerStackProps> = ({
  children,
  selectionMode = 'none',
  onSelect,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  // Selection state refs (imperative for performance during drag)
  const isDraggingRef = useRef(false);
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lassoPointsRef = useRef<[number, number][]>([]);
  const selectionElRef = useRef<SVGElement | null>(null);
  const onSelectRef = useRef(onSelect);

  // Keep onSelect ref current without triggering re-renders
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // Cleanup on unmount or selectionMode change
  useEffect(() => {
    return () => {
      if (selectionElRef.current && selectionElRef.current.parentNode) {
        selectionElRef.current.parentNode.removeChild(selectionElRef.current);
        selectionElRef.current = null;
      }
      isDraggingRef.current = false;
    };
  }, [selectionMode]);

  const getRelativePos = useCallback((e: React.PointerEvent): { x: number; y: number } => {
    const rect = containerRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = svgRef.current;
    const pos = getRelativePos(e);

    isDraggingRef.current = true;
    startPosRef.current = pos;

    // Set pointer capture on SVG for reliable tracking
    svg.setPointerCapture(e.pointerId);

    const accent = getAccentColor(containerRef.current);

    if (selectionMode === 'rect') {
      const rect = document.createElementNS(SVG_NS, 'rect');
      rect.setAttribute('x', String(pos.x));
      rect.setAttribute('y', String(pos.y));
      rect.setAttribute('width', '0');
      rect.setAttribute('height', '0');
      applySelectionStyle(rect, accent);
      svg.appendChild(rect);
      selectionElRef.current = rect;
    } else if (selectionMode === 'lasso') {
      lassoPointsRef.current = [[pos.x, pos.y]];
      const path = document.createElementNS(SVG_NS, 'path');
      path.setAttribute('d', `M ${pos.x},${pos.y}`);
      applySelectionStyle(path, accent);
      svg.appendChild(path);
      selectionElRef.current = path;
    }
  }, [selectionMode, getRelativePos]);

  const handlePointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDraggingRef.current || !selectionElRef.current) return;

    const pos = getRelativePos(e);

    if (selectionMode === 'rect') {
      const startX = startPosRef.current.x;
      const startY = startPosRef.current.y;
      const x = Math.min(startX, pos.x);
      const y = Math.min(startY, pos.y);
      const width = Math.abs(pos.x - startX);
      const height = Math.abs(pos.y - startY);

      selectionElRef.current.setAttribute('x', String(x));
      selectionElRef.current.setAttribute('y', String(y));
      selectionElRef.current.setAttribute('width', String(width));
      selectionElRef.current.setAttribute('height', String(height));
    } else if (selectionMode === 'lasso') {
      lassoPointsRef.current.push([pos.x, pos.y]);
      const points = lassoPointsRef.current;
      let d = `M ${points[0]![0]},${points[0]![1]}`;
      for (let i = 1; i < points.length; i++) {
        d += ` L ${points[i]![0]},${points[i]![1]}`;
      }
      selectionElRef.current.setAttribute('d', d);
    }
  }, [selectionMode, getRelativePos]);

  const handlePointerUp = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    if (!isDraggingRef.current || !selectionElRef.current) return;

    const svg = svgRef.current;
    if (svg) {
      try {
        svg.releasePointerCapture(e.pointerId);
      } catch {
        // Pointer capture may already be released
      }
    }

    isDraggingRef.current = false;
    const pos = getRelativePos(e);

    let selection: Selection | undefined;

    if (selectionMode === 'rect') {
      const startX = startPosRef.current.x;
      const startY = startPosRef.current.y;
      selection = {
        type: 'rect',
        bounds: {
          x: Math.min(startX, pos.x),
          y: Math.min(startY, pos.y),
          width: Math.abs(pos.x - startX),
          height: Math.abs(pos.y - startY),
        },
      };
    } else if (selectionMode === 'lasso') {
      // Close the path
      selectionElRef.current.setAttribute(
        'd',
        selectionElRef.current.getAttribute('d') + ' Z',
      );
      selection = {
        type: 'lasso',
        vertices: [...lassoPointsRef.current],
      };
      lassoPointsRef.current = [];
    }

    // Remove SVG selection element
    if (selectionElRef.current.parentNode) {
      selectionElRef.current.parentNode.removeChild(selectionElRef.current);
    }
    selectionElRef.current = null;

    if (selection && onSelectRef.current) {
      onSelectRef.current(selection);
    }
  }, [selectionMode, getRelativePos]);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: 'relative', overflow: 'hidden' }}
    >
      {children}
      {selectionMode !== 'none' && (
        <svg
          ref={svgRef}
          data-testid="layer-stack-svg"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'all',
            zIndex: 9999,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        />
      )}
    </div>
  );
};
