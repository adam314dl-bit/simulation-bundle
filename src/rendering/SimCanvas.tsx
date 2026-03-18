import { useRef, useEffect, useCallback } from 'react';
import type { SimCanvasProps } from './types';
import { Viewport } from './viewport';

/**
 * SimCanvas — Foundation canvas component with pan/zoom/touch support.
 *
 * Renders a `<canvas>` element with:
 * - DPR-aware sizing for crisp HiDPI rendering
 * - Cursor-centered mouse wheel zoom (non-passive listener)
 * - Click-drag pan with lerp momentum on release
 * - Touch pinch-zoom via PointerEvents
 * - rAF animation loop calling onDraw(ctx, viewport) each frame
 */
export const SimCanvas: React.FC<SimCanvasProps> = ({
  width = 800,
  height = 600,
  onDraw,
  className,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef(new Viewport());
  const rafRef = useRef(0);
  const mountedRef = useRef(true);

  // Pointer tracking refs (avoid re-renders)
  const isPanningRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });
  const velocityRef = useRef<Array<{ dx: number; dy: number }>>([]);
  const activePointersRef = useRef<Map<number, { x: number; y: number }>>(new Map());
  const prevPinchDistRef = useRef(0);

  // DPR + canvas sizing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    viewportRef.current.dpr = dpr;
  }, [width, height]);

  // rAF animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const loop = () => {
      if (!mountedRef.current) return;
      const vp = viewportRef.current;
      vp.applyMomentum();
      ctx.save();
      ctx.setTransform(
        vp.dpr * vp.scale, 0,
        0, vp.dpr * vp.scale,
        vp.dpr * vp.tx, vp.dpr * vp.ty,
      );
      onDraw(ctx, vp);
      ctx.restore();
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [onDraw]);

  // Cleanup mounted flag
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Wheel zoom (non-passive listener for preventDefault)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      viewportRef.current.zoomAt(cx, cy, e.deltaY);
    };

    canvas.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, []);

  // Pinch-zoom helpers
  const getPointerDistance = useCallback((pointers: Map<number, { x: number; y: number }>) => {
    const pts = Array.from(pointers.values());
    if (pts.length < 2) return 0;
    const dx = pts[1]!.x - pts[0]!.x;
    const dy = pts[1]!.y - pts[0]!.y;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  const getPointerMidpoint = useCallback((pointers: Map<number, { x: number; y: number }>) => {
    const pts = Array.from(pointers.values());
    if (pts.length < 2) return { x: 0, y: 0 };
    return {
      x: (pts[0]!.x + pts[1]!.x) / 2,
      y: (pts[0]!.y + pts[1]!.y) / 2,
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.setPointerCapture(e.pointerId);
    activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    if (activePointersRef.current.size === 1) {
      // Single pointer: start pan
      isPanningRef.current = true;
      lastPosRef.current = { x: e.clientX, y: e.clientY };
      velocityRef.current = [];
    } else if (activePointersRef.current.size === 2) {
      // Two pointers: start pinch-zoom
      isPanningRef.current = false;
      prevPinchDistRef.current = getPointerDistance(activePointersRef.current);
    }
  }, [getPointerDistance]);

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    // Update tracked pointer position
    if (activePointersRef.current.has(e.pointerId)) {
      activePointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    }

    if (activePointersRef.current.size === 2) {
      // Pinch-zoom
      const newDist = getPointerDistance(activePointersRef.current);
      const prevDist = prevPinchDistRef.current;

      if (prevDist > 0 && newDist > 0) {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const mid = getPointerMidpoint(activePointersRef.current);
        const cx = mid.x - rect.left;
        const cy = mid.y - rect.top;

        // Compute scale ratio and apply as zoom
        const ratio = newDist / prevDist;
        const vp = viewportRef.current;
        const newScale = Math.max(0.1, Math.min(20, vp.scale * ratio));
        const scaleRatio = newScale / vp.scale;
        vp.tx = cx - scaleRatio * (cx - vp.tx);
        vp.ty = cy - scaleRatio * (cy - vp.ty);
        vp.scale = newScale;
      }

      prevPinchDistRef.current = newDist;
      return;
    }

    if (isPanningRef.current) {
      const dx = e.clientX - lastPosRef.current.x;
      const dy = e.clientY - lastPosRef.current.y;
      viewportRef.current.pan(dx, dy);

      // Track velocity for momentum (keep last 3 frames)
      velocityRef.current.push({ dx, dy });
      if (velocityRef.current.length > 3) {
        velocityRef.current.shift();
      }

      lastPosRef.current = { x: e.clientX, y: e.clientY };
    }
  }, [getPointerDistance, getPointerMidpoint]);

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (canvas) {
      try {
        canvas.releasePointerCapture(e.pointerId);
      } catch {
        // Pointer capture may already be released
      }
    }

    activePointersRef.current.delete(e.pointerId);

    if (isPanningRef.current && activePointersRef.current.size === 0) {
      isPanningRef.current = false;

      // Compute average velocity from last 3 frames for momentum
      const vels = velocityRef.current;
      if (vels.length > 0) {
        let avgDx = 0;
        let avgDy = 0;
        for (const v of vels) {
          avgDx += v.dx;
          avgDy += v.dy;
        }
        avgDx /= vels.length;
        avgDy /= vels.length;
        viewportRef.current.startMomentum(avgDx, avgDy);
      }
      velocityRef.current = [];
    }

    // If one pointer remains after pinch, reset to pan mode
    if (activePointersRef.current.size === 1) {
      isPanningRef.current = true;
      const remaining = Array.from(activePointersRef.current.values())[0]!;
      lastPosRef.current = { x: remaining.x, y: remaining.y };
      velocityRef.current = [];
      prevPinchDistRef.current = 0;
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ touchAction: 'none' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    />
  );
};
