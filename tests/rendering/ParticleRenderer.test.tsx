import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, cleanup } from '@testing-library/react';
import { ParticleRenderer } from '../../src/rendering/ParticleRenderer';

// --- Mock WebGL2 context factory ---
function createMockGL() {
  return {
    createShader: vi.fn(() => ({})),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    createProgram: vi.fn(() => ({})),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getShaderInfoLog: vi.fn(() => ''),
    getProgramInfoLog: vi.fn(() => ''),
    deleteShader: vi.fn(),
    deleteProgram: vi.fn(),
    useProgram: vi.fn(),
    getAttribLocation: vi.fn(() => 0),
    getUniformLocation: vi.fn(() => ({})),
    createVertexArray: vi.fn(() => ({})),
    bindVertexArray: vi.fn(),
    createBuffer: vi.fn(() => ({})),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    bufferSubData: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),
    createTexture: vi.fn(() => ({})),
    bindTexture: vi.fn(),
    texStorage2D: vi.fn(),
    texSubImage2D: vi.fn(),
    texParameteri: vi.fn(),
    activeTexture: vi.fn(),
    uniform1f: vi.fn(),
    uniform1i: vi.fn(),
    uniformMatrix3fv: vi.fn(),
    uniform4f: vi.fn(),
    enable: vi.fn(),
    disable: vi.fn(),
    blendFunc: vi.fn(),
    viewport: vi.fn(),
    clear: vi.fn(),
    clearColor: vi.fn(),
    drawArrays: vi.fn(),
    deleteBuffer: vi.fn(),
    deleteVertexArray: vi.fn(),
    deleteTexture: vi.fn(),
    getParameter: vi.fn((param: number) => {
      // ALIASED_POINT_SIZE_RANGE
      if (param === 0x846D) return new Float32Array([1, 64]);
      return null;
    }),
    VERTEX_SHADER: 0x8B31,
    FRAGMENT_SHADER: 0x8B30,
    LINK_STATUS: 0x8B82,
    ARRAY_BUFFER: 0x8892,
    DYNAMIC_DRAW: 0x88E8,
    FLOAT: 0x1406,
    TEXTURE_2D: 0x0DE1,
    RGBA8: 0x8058,
    RGBA: 0x1908,
    UNSIGNED_BYTE: 0x1401,
    TEXTURE_WRAP_S: 0x2802,
    TEXTURE_WRAP_T: 0x2803,
    TEXTURE_MIN_FILTER: 0x2801,
    TEXTURE_MAG_FILTER: 0x2800,
    CLAMP_TO_EDGE: 0x812F,
    LINEAR: 0x2601,
    TEXTURE0: 0x84C0,
    POINTS: 0x0000,
    TRIANGLES: 0x0004,
    BLEND: 0x0BE2,
    SRC_ALPHA: 0x0302,
    ONE_MINUS_SRC_ALPHA: 0x0303,
    ONE: 1,
    COLOR_BUFFER_BIT: 0x4000,
    ALIASED_POINT_SIZE_RANGE: 0x846D,
  };
}

// Mock 2D context
function createMock2D() {
  return {
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    beginPath: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    fillStyle: '',
    globalCompositeOperation: 'source-over',
  };
}

let mockGL: ReturnType<typeof createMockGL>;
let mock2D: ReturnType<typeof createMock2D>;
let getContextSpy: ReturnType<typeof vi.fn>;
let rafCallbacks: Array<FrameRequestCallback>;
let rafIdCounter: number;

beforeEach(() => {
  mockGL = createMockGL();
  mock2D = createMock2D();
  rafCallbacks = [];
  rafIdCounter = 0;

  // Default: return WebGL2 mock for 'webgl2', 2D mock for '2d'
  getContextSpy = vi.fn((contextType: string) => {
    if (contextType === 'webgl2') return mockGL;
    if (contextType === '2d') return mock2D;
    return null;
  });

  HTMLCanvasElement.prototype.getContext = getContextSpy as unknown as typeof HTMLCanvasElement.prototype.getContext;

  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    const id = ++rafIdCounter;
    rafCallbacks.push(cb);
    return id;
  });
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// Helper to flush one rAF cycle
function flushRAF() {
  const cbs = [...rafCallbacks];
  rafCallbacks = [];
  for (const cb of cbs) {
    cb(16);
  }
}

const minData = new Float32Array(16); // 4 particles, all zeros

describe('REND-05: WebGL2 instanced rendering', () => {
  it('renders a canvas element', () => {
    const { container } = render(<ParticleRenderer data={minData} count={4} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
    expect(canvas).toBeInstanceOf(HTMLCanvasElement);
  });

  it('accepts data Float32Array and count props', () => {
    expect(() => {
      render(<ParticleRenderer data={minData} count={4} />);
    }).not.toThrow();
  });

  it('configures point size clamped to GPU max', () => {
    render(<ParticleRenderer data={minData} count={4} pointSize={100} />);
    expect(mockGL.getParameter).toHaveBeenCalledWith(0x846D);
  });

  it('uses color ramp for color mapping', () => {
    expect(() => {
      render(<ParticleRenderer data={minData} count={4} colorRamp="inferno" />);
    }).not.toThrow();
  });
});

describe('REND-06: Trail effects', () => {
  it('enables trail rendering when trails=true', () => {
    render(<ParticleRenderer data={minData} count={4} trails={true} />);
    flushRAF();
    expect(mockGL.blendFunc).toHaveBeenCalled();
  });

  it('supports additive blending mode', () => {
    render(<ParticleRenderer data={minData} count={4} trails={true} blendMode="additive" />);
    flushRAF();
    // Additive: SRC_ALPHA, ONE
    expect(mockGL.blendFunc).toHaveBeenCalledWith(0x0302, 1);
  });

  it('supports normal blending mode', () => {
    render(<ParticleRenderer data={minData} count={4} trails={true} blendMode="normal" />);
    flushRAF();
    // Normal: SRC_ALPHA, ONE_MINUS_SRC_ALPHA (used for both fade and particles)
    expect(mockGL.blendFunc).toHaveBeenCalledWith(0x0302, 0x0303);
  });
});

describe('REND-07: Fallback + performance', () => {
  it('falls back to Canvas2D when WebGL2 unavailable', () => {
    getContextSpy.mockImplementation((contextType: string) => {
      if (contextType === 'webgl2') return null;
      if (contextType === '2d') return mock2D;
      return null;
    });

    const { container } = render(<ParticleRenderer data={minData} count={4} />);
    const canvas = container.querySelector('canvas');
    expect(canvas).toBeTruthy();
    // 2D context should have been requested
    expect(getContextSpy).toHaveBeenCalledWith('2d');
  });

  it('calls onFallback callback on fallback', () => {
    getContextSpy.mockImplementation((contextType: string) => {
      if (contextType === 'webgl2') return null;
      if (contextType === '2d') return mock2D;
      return null;
    });

    const onFallback = vi.fn();
    render(<ParticleRenderer data={minData} count={4} onFallback={onFallback} />);
    expect(onFallback).toHaveBeenCalledWith(expect.stringContaining('not available'));
  });

  it('renders with canvas2d renderer prop', () => {
    render(<ParticleRenderer data={minData} count={4} renderer="canvas2d" />);
    // When renderer='canvas2d', webgl2 should NOT be requested
    const webglCalls = getContextSpy.mock.calls.filter(
      (call: unknown[]) => call[0] === 'webgl2'
    );
    expect(webglCalls.length).toBe(0);
    // 2D should be requested
    expect(getContextSpy).toHaveBeenCalledWith('2d');
  });

  it('cleans up resources on unmount', () => {
    const { unmount } = render(<ParticleRenderer data={minData} count={4} />);
    unmount();
    expect(window.cancelAnimationFrame).toHaveBeenCalled();
  });
});
