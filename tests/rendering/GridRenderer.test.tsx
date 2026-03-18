import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { GridRenderer, findDirtyIndices } from '../../src/rendering/GridRenderer';
import type { GridConfig } from '../../src/rendering/types';

// Mock requestAnimationFrame/cancelAnimationFrame
vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
  setTimeout(() => cb(16), 0);
  return 1;
});
vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});

// Mock getContext to return a minimal context object
const mockCtx = {
  save: vi.fn(),
  restore: vi.fn(),
  setTransform: vi.fn(),
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  strokeRect: vi.fn(),
  drawImage: vi.fn(),
  createImageData: vi.fn().mockReturnValue({
    data: new Uint8ClampedArray(100 * 100 * 4),
  }),
  putImageData: vi.fn(),
  get fillStyle() { return ''; },
  set fillStyle(_v: string) {},
  get strokeStyle() { return ''; },
  set strokeStyle(_v: string) {},
  get lineWidth() { return 1; },
  set lineWidth(_v: number) {},
};

HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue(mockCtx) as unknown as typeof HTMLCanvasElement.prototype.getContext;

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

function makeConfig(overrides: Partial<GridConfig> = {}): GridConfig {
  return {
    width: 10,
    height: 10,
    data: new Float32Array(100),
    cellSize: 8,
    ...overrides,
  };
}

describe('GridRenderer', () => {
  it('renders without error with valid config', () => {
    const config = makeConfig();
    expect(() => render(<GridRenderer config={config} />)).not.toThrow();
  });

  it('renders a canvas element (wraps SimCanvas)', () => {
    const config = makeConfig();
    const { container } = render(<GridRenderer config={config} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
  });

  it('accepts onCellClick callback prop without error', () => {
    const config = makeConfig();
    const onClick = vi.fn();
    expect(() => render(<GridRenderer config={config} onCellClick={onClick} />)).not.toThrow();
  });

  it('accepts onCellHover callback prop without error', () => {
    const config = makeConfig();
    const onHover = vi.fn();
    expect(() => render(<GridRenderer config={config} onCellHover={onHover} />)).not.toThrow();
  });

  it('defaults cellSize to 8 when omitted (canvas width = gridW * 8)', () => {
    const config: GridConfig = { width: 10, height: 10, data: new Float32Array(100) };
    const { container } = render(<GridRenderer config={config} />);
    const canvas = container.querySelector('canvas')!;
    // SimCanvas receives width = gridW * cellSize = 10 * 8 = 80
    expect(canvas.style.width).toBe('80px');
    expect(canvas.style.height).toBe('80px');
  });

  it('accepts highlightCell prop without error', () => {
    const config = makeConfig();
    expect(() =>
      render(<GridRenderer config={config} highlightCell={{ col: 0, row: 0 }} />),
    ).not.toThrow();
  });

  it('defaults colorRamp to viridis (mounts without specifying ramp)', () => {
    const config: GridConfig = { width: 5, height: 5, data: new Float32Array(25) };
    // Should not throw -- viridis is the default
    expect(() => render(<GridRenderer config={config} />)).not.toThrow();
  });

  it('applies custom cellSize to canvas dimensions', () => {
    const config = makeConfig({ cellSize: 16 });
    const { container } = render(<GridRenderer config={config} />);
    const canvas = container.querySelector('canvas')!;
    // 10 * 16 = 160
    expect(canvas.style.width).toBe('160px');
    expect(canvas.style.height).toBe('160px');
  });

  it('clamps cellSize to minimum 2', () => {
    const config = makeConfig({ cellSize: 1 });
    const { container } = render(<GridRenderer config={config} />);
    const canvas = container.querySelector('canvas')!;
    // Math.max(2, 1) = 2, so 10 * 2 = 20
    expect(canvas.style.width).toBe('20px');
    expect(canvas.style.height).toBe('20px');
  });
});

describe('findDirtyIndices', () => {
  it('returns indices where arrays differ', () => {
    const prev = [0, 1, 2];
    const next = [0, 3, 2];
    const dirty = findDirtyIndices(prev, next);
    expect(dirty.size).toBe(1);
    expect(dirty.has(1)).toBe(true);
  });

  it('returns empty set for identical arrays', () => {
    const prev = [0, 0, 0];
    const next = [0, 0, 0];
    const dirty = findDirtyIndices(prev, next);
    expect(dirty.size).toBe(0);
  });

  it('detects multiple dirty indices', () => {
    const prev = [1, 2, 3, 4, 5];
    const next = [0, 2, 0, 4, 0];
    const dirty = findDirtyIndices(prev, next);
    expect(dirty.size).toBe(3);
    expect(dirty.has(0)).toBe(true);
    expect(dirty.has(2)).toBe(true);
    expect(dirty.has(4)).toBe(true);
  });

  it('handles Float32Array inputs', () => {
    const prev = new Float32Array([0.1, 0.2, 0.3]);
    const next = new Float32Array([0.1, 0.5, 0.3]);
    const dirty = findDirtyIndices(prev, next);
    expect(dirty.size).toBe(1);
    expect(dirty.has(1)).toBe(true);
  });

  it('handles empty arrays', () => {
    const dirty = findDirtyIndices([], []);
    expect(dirty.size).toBe(0);
  });
});
