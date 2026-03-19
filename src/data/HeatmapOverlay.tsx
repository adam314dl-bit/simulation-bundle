import { useRef, useEffect, useMemo } from 'react';
import { getRampLUT, colorRamps } from '../rendering/color-ramps';
import type { HeatmapOverlayProps } from './types';

/**
 * Bilinear sampling of a 2D grid stored in a flat Float64Array.
 * Exported as named function for testability.
 */
export function bilinearSample(
  data: Float64Array,
  w: number,
  h: number,
  x: number,
  y: number,
): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, w - 1);
  const y1 = Math.min(y0 + 1, h - 1);
  const fx = x - x0;
  const fy = y - y0;
  const v00 = data[y0 * w + x0]!;
  const v10 = data[y0 * w + x1]!;
  const v01 = data[y1 * w + x0]!;
  const v11 = data[y1 * w + x1]!;
  return v00 * (1 - fx) * (1 - fy) + v10 * fx * (1 - fy) + v01 * (1 - fx) * fy + v11 * fx * fy;
}

const DEFAULT_WIDTH = 256;
const DEFAULT_HEIGHT = 256;

export function HeatmapOverlay({
  data,
  gridWidth,
  gridHeight,
  colorRamp = 'viridis',
  opacity = 0.7,
  interpolate = true,
  showLegend = true,
  range = [0, 1],
  className,
}: HeatmapOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [rangeMin, rangeMax] = range;
  const rangeSpan = rangeMax - rangeMin || 1;

  // Render heatmap to canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const lut = getRampLUT(colorRamp);
    const cw = canvas.width;
    const ch = canvas.height;

    if (cw === 0 || ch === 0) return;

    const imageData = ctx.createImageData(cw, ch);
    const pixels = imageData.data;

    for (let py = 0; py < ch; py++) {
      for (let px = 0; px < cw; px++) {
        const gx = (px / cw) * (gridWidth - 1);
        const gy = (py / ch) * (gridHeight - 1);
        const raw = interpolate
          ? bilinearSample(data, gridWidth, gridHeight, gx, gy)
          : data[Math.round(gy) * gridWidth + Math.round(gx)]!;
        const t = Math.max(0, Math.min(1, (raw - rangeMin) / rangeSpan));
        const lutIdx = Math.round(t * 255) * 4;
        const pIdx = (py * cw + px) * 4;
        pixels[pIdx] = lut[lutIdx]!;
        pixels[pIdx + 1] = lut[lutIdx + 1]!;
        pixels[pIdx + 2] = lut[lutIdx + 2]!;
        pixels[pIdx + 3] = Math.round(opacity * 255);
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }, [data, gridWidth, gridHeight, colorRamp, opacity, interpolate, rangeMin, rangeMax, rangeSpan]);

  // Build CSS linear-gradient for legend by sampling color ramp at 10 points
  const legendGradient = useMemo(() => {
    const rampFn = colorRamps[colorRamp as keyof typeof colorRamps];
    if (!rampFn) return 'linear-gradient(to right, #000, #fff)';
    const stops: string[] = [];
    for (let i = 0; i <= 10; i++) {
      const t = i / 10;
      stops.push(`${rampFn(t)} ${t * 100}%`);
    }
    return `linear-gradient(to right, ${stops.join(', ')})`;
  }, [colorRamp]);

  return (
    <div ref={containerRef} className={className} style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={DEFAULT_WIDTH}
        height={DEFAULT_HEIGHT}
        style={{
          width: '100%',
          height: 'auto',
          display: 'block',
          opacity,
        }}
      />
      {showLegend && (
        <div
          data-testid="heatmap-legend"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 0',
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: 'var(--sim-text-muted)',
              fontFamily: 'var(--sim-font-mono)',
            }}
          >
            {rangeMin}
          </span>
          <div
            style={{
              flex: 1,
              height: 12,
              borderRadius: 2,
              background: legendGradient,
            }}
          />
          <span
            style={{
              fontSize: 10,
              color: 'var(--sim-text-muted)',
              fontFamily: 'var(--sim-font-mono)',
            }}
          >
            {rangeMax}
          </span>
        </div>
      )}
    </div>
  );
}
