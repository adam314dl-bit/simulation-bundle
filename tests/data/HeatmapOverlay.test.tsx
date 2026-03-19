import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

// jsdom does not provide ResizeObserver -- stub it for tests
beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class ResizeObserver {
      observe() { /* noop */ }
      unobserve() { /* noop */ }
      disconnect() { /* noop */ }
    } as unknown as typeof globalThis.ResizeObserver;
  }
});

// Mock canvas getContext since jsdom returns null
const mockCtx = {
  createImageData: vi.fn((w: number, h: number) => ({
    data: new Uint8ClampedArray(w * h * 4),
    width: w,
    height: h,
  })),
  putImageData: vi.fn(),
  getImageData: vi.fn(),
  clearRect: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  setTransform: vi.fn(),
};

beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCtx) as unknown as typeof HTMLCanvasElement.prototype.getContext;
});

// Import after mocks are set up
import { HeatmapOverlay, bilinearSample } from 'sim-kit/data';

describe('DATA-05: HeatmapOverlay', () => {
  it('renders a canvas element', () => {
    const data = new Float64Array([0, 0.5, 0.5, 1]);
    const { container } = render(
      <HeatmapOverlay data={data} gridWidth={2} gridHeight={2} />,
    );
    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeNull();
  });

  it('bilinearSample returns exact value at grid point', () => {
    const data = new Float64Array([0, 1, 2, 3]);
    expect(bilinearSample(data, 2, 2, 0, 0)).toBe(0);
    expect(bilinearSample(data, 2, 2, 1, 0)).toBe(1);
    expect(bilinearSample(data, 2, 2, 0, 1)).toBe(2);
    expect(bilinearSample(data, 2, 2, 1, 1)).toBe(3);
  });

  it('bilinearSample interpolates between neighbors', () => {
    const data = new Float64Array([0, 1, 0, 1]);
    // Midpoint between 0 and 1 on top row
    expect(bilinearSample(data, 2, 2, 0.5, 0)).toBeCloseTo(0.5);
  });

  it('bilinearSample clamps to edges', () => {
    const data = new Float64Array([0, 1, 2, 3]);
    // At (1, 1) should return corner value
    expect(bilinearSample(data, 2, 2, 1, 1)).toBe(3);
  });

  it('renders legend bar by default', () => {
    const data = new Float64Array([0, 0.5, 0.5, 1]);
    render(
      <HeatmapOverlay data={data} gridWidth={2} gridHeight={2} />,
    );
    expect(screen.getByTestId('heatmap-legend')).toBeInTheDocument();
  });

  it('hides legend when showLegend=false', () => {
    const data = new Float64Array([0, 0.5, 0.5, 1]);
    render(
      <HeatmapOverlay data={data} gridWidth={2} gridHeight={2} showLegend={false} />,
    );
    expect(screen.queryByTestId('heatmap-legend')).toBeNull();
  });

  it('legend shows min/max labels', () => {
    const data = new Float64Array([0, 50, 50, 100]);
    render(
      <HeatmapOverlay data={data} gridWidth={2} gridHeight={2} range={[0, 100]} />,
    );
    const legend = screen.getByTestId('heatmap-legend');
    expect(legend.textContent).toContain('0');
    expect(legend.textContent).toContain('100');
  });

  it('applies opacity style to canvas', () => {
    const data = new Float64Array([0, 0.5, 0.5, 1]);
    const { container } = render(
      <HeatmapOverlay data={data} gridWidth={2} gridHeight={2} opacity={0.5} />,
    );
    const canvas = container.querySelector('canvas') as HTMLCanvasElement;
    expect(canvas.style.opacity).toBe('0.5');
  });
});
