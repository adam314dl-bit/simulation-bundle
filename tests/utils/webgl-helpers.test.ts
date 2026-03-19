import { describe, it, expect, vi } from 'vitest';
import {
  compileProgram,
  createParticleVAO,
  createRampTexture,
  setupContextLossHandler,
} from '../../src/utils/webgl-helpers';

/** Create a mock WebGL2RenderingContext with vi.fn() stubs */
function createMockGL() {
  const mockShader = { __type: 'shader' };
  const mockProgram = { __type: 'program' };
  const mockVAO = { __type: 'vao' };
  const mockBuffer = { __type: 'buffer' };
  const mockTexture = { __type: 'texture' };

  return {
    // Constants
    VERTEX_SHADER: 0x8b31,
    FRAGMENT_SHADER: 0x8b30,
    LINK_STATUS: 0x8b82,
    ARRAY_BUFFER: 0x8892,
    DYNAMIC_DRAW: 0x88e8,
    FLOAT: 0x1406,
    TEXTURE_2D: 0x0de1,
    RGBA8: 0x8058,
    RGBA: 0x1908,
    UNSIGNED_BYTE: 0x1401,
    TEXTURE_WRAP_S: 0x2802,
    TEXTURE_WRAP_T: 0x2803,
    TEXTURE_MIN_FILTER: 0x2801,
    TEXTURE_MAG_FILTER: 0x2800,
    CLAMP_TO_EDGE: 0x812f,
    LINEAR: 0x2601,

    // Shader methods
    createShader: vi.fn(() => mockShader),
    shaderSource: vi.fn(),
    compileShader: vi.fn(),
    getShaderInfoLog: vi.fn(() => ''),
    deleteShader: vi.fn(),

    // Program methods
    createProgram: vi.fn(() => mockProgram),
    attachShader: vi.fn(),
    linkProgram: vi.fn(),
    getProgramParameter: vi.fn(() => true),
    getProgramInfoLog: vi.fn(() => ''),
    deleteProgram: vi.fn(),
    getAttribLocation: vi.fn((_, name: string) => {
      if (name === 'a_position') return 0;
      if (name === 'a_velocity') return 1;
      return -1;
    }),

    // VAO/Buffer methods
    createVertexArray: vi.fn(() => mockVAO),
    bindVertexArray: vi.fn(),
    createBuffer: vi.fn(() => mockBuffer),
    bindBuffer: vi.fn(),
    bufferData: vi.fn(),
    enableVertexAttribArray: vi.fn(),
    vertexAttribPointer: vi.fn(),

    // Texture methods
    createTexture: vi.fn(() => mockTexture),
    bindTexture: vi.fn(),
    texStorage2D: vi.fn(),
    texSubImage2D: vi.fn(),
    texParameteri: vi.fn(),

    // Expose mocks for assertions
    _mockShader: mockShader,
    _mockProgram: mockProgram,
    _mockVAO: mockVAO,
    _mockBuffer: mockBuffer,
    _mockTexture: mockTexture,
  } as unknown as WebGL2RenderingContext & {
    _mockShader: object;
    _mockProgram: object;
    _mockVAO: object;
    _mockBuffer: object;
    _mockTexture: object;
  };
}

describe('UTIL-03: WebGL helpers', () => {
  describe('compileProgram', () => {
    it('compiles shaders and links into a program', () => {
      const gl = createMockGL();
      const program = compileProgram(gl, 'vertex src', 'fragment src');

      expect(gl.createShader).toHaveBeenCalledTimes(2);
      expect(gl.shaderSource).toHaveBeenCalledTimes(2);
      expect(gl.compileShader).toHaveBeenCalledTimes(2);
      expect(gl.createProgram).toHaveBeenCalledTimes(1);
      expect(gl.attachShader).toHaveBeenCalledTimes(2);
      expect(gl.linkProgram).toHaveBeenCalledTimes(1);
      expect(gl.getProgramParameter).toHaveBeenCalledWith(gl._mockProgram, gl.LINK_STATUS);
      expect(program).toBe(gl._mockProgram);
    });

    it('deletes shaders after successful linking', () => {
      const gl = createMockGL();
      compileProgram(gl, 'v', 'f');
      expect(gl.deleteShader).toHaveBeenCalledTimes(2);
    });

    it('throws descriptive error on link failure', () => {
      const gl = createMockGL();
      (gl.getProgramParameter as ReturnType<typeof vi.fn>).mockReturnValue(false);
      (gl.getShaderInfoLog as ReturnType<typeof vi.fn>).mockReturnValueOnce('vertex error');
      (gl.getShaderInfoLog as ReturnType<typeof vi.fn>).mockReturnValueOnce('fragment error');
      (gl.getProgramInfoLog as ReturnType<typeof vi.fn>).mockReturnValue('link error');

      expect(() => compileProgram(gl, 'v', 'f')).toThrow('WebGL program link failed');
      expect(gl.deleteShader).toHaveBeenCalledTimes(2);
      expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
    });
  });

  describe('createParticleVAO', () => {
    it('creates VAO with interleaved buffer for particle data', () => {
      const gl = createMockGL();
      const maxParticles = 1000;
      const result = createParticleVAO(gl, gl._mockProgram as unknown as WebGLProgram, maxParticles);

      expect(gl.createVertexArray).toHaveBeenCalledTimes(1);
      expect(gl.createBuffer).toHaveBeenCalledTimes(1);
      expect(gl.bufferData).toHaveBeenCalledWith(gl.ARRAY_BUFFER, maxParticles * 16, gl.DYNAMIC_DRAW);
      expect(result.vao).toBe(gl._mockVAO);
      expect(result.buffer).toBe(gl._mockBuffer);
    });

    it('sets up position (offset 0) and velocity (offset 8) attributes', () => {
      const gl = createMockGL();
      createParticleVAO(gl, gl._mockProgram as unknown as WebGLProgram, 100);

      expect(gl.vertexAttribPointer).toHaveBeenCalledTimes(2);
      // a_position: loc=0, size=2, FLOAT, stride=16, offset=0
      expect(gl.vertexAttribPointer).toHaveBeenCalledWith(0, 2, gl.FLOAT, false, 16, 0);
      // a_velocity: loc=1, size=2, FLOAT, stride=16, offset=8
      expect(gl.vertexAttribPointer).toHaveBeenCalledWith(1, 2, gl.FLOAT, false, 16, 8);
      expect(gl.enableVertexAttribArray).toHaveBeenCalledTimes(2);
    });

    it('unbinds VAO after setup', () => {
      const gl = createMockGL();
      createParticleVAO(gl, gl._mockProgram as unknown as WebGLProgram, 100);

      // Last bindVertexArray call should be null (unbind)
      const calls = (gl.bindVertexArray as ReturnType<typeof vi.fn>).mock.calls;
      expect(calls[calls.length - 1]![0]).toBeNull();
    });
  });

  describe('createRampTexture', () => {
    it('creates 256x1 RGBA texture from LUT data', () => {
      const gl = createMockGL();
      const lutData = new Uint8Array(1024);
      const tex = createRampTexture(gl, lutData);

      expect(gl.createTexture).toHaveBeenCalledTimes(1);
      expect(gl.texStorage2D).toHaveBeenCalledWith(gl.TEXTURE_2D, 1, gl.RGBA8, 256, 1);
      expect(gl.texSubImage2D).toHaveBeenCalledWith(
        gl.TEXTURE_2D, 0, 0, 0, 256, 1, gl.RGBA, gl.UNSIGNED_BYTE, lutData
      );
      expect(tex).toBe(gl._mockTexture);
    });

    it('sets correct texture parameters (clamp + linear)', () => {
      const gl = createMockGL();
      createRampTexture(gl, new Uint8Array(1024));

      expect(gl.texParameteri).toHaveBeenCalledTimes(4);
      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      expect(gl.texParameteri).toHaveBeenCalledWith(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    });
  });

  describe('setupContextLossHandler', () => {
    it('registers webglcontextlost and webglcontextrestored listeners', () => {
      const canvas = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as HTMLCanvasElement;

      setupContextLossHandler(canvas, vi.fn(), vi.fn());

      expect(canvas.addEventListener).toHaveBeenCalledTimes(2);
      expect(canvas.addEventListener).toHaveBeenCalledWith('webglcontextlost', expect.any(Function));
      expect(canvas.addEventListener).toHaveBeenCalledWith('webglcontextrestored', expect.any(Function));
    });

    it('cleanup function removes both listeners', () => {
      const canvas = {
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      } as unknown as HTMLCanvasElement;

      const cleanup = setupContextLossHandler(canvas, vi.fn(), vi.fn());
      cleanup();

      expect(canvas.removeEventListener).toHaveBeenCalledTimes(2);
      expect(canvas.removeEventListener).toHaveBeenCalledWith('webglcontextlost', expect.any(Function));
      expect(canvas.removeEventListener).toHaveBeenCalledWith('webglcontextrestored', expect.any(Function));
    });

    it('calls onLost when context is lost and prevents default', () => {
      const listeners: Record<string, Function> = {};
      const canvas = {
        addEventListener: vi.fn((event: string, handler: Function) => {
          listeners[event] = handler;
        }),
        removeEventListener: vi.fn(),
      } as unknown as HTMLCanvasElement;

      const onLost = vi.fn();
      setupContextLossHandler(canvas, onLost, vi.fn());

      const mockEvent = { preventDefault: vi.fn() };
      listeners['webglcontextlost']!(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(onLost).toHaveBeenCalled();
    });

    it('calls onRestored when context is restored', () => {
      const listeners: Record<string, Function> = {};
      const canvas = {
        addEventListener: vi.fn((event: string, handler: Function) => {
          listeners[event] = handler;
        }),
        removeEventListener: vi.fn(),
      } as unknown as HTMLCanvasElement;

      const onRestored = vi.fn();
      setupContextLossHandler(canvas, vi.fn(), onRestored);

      listeners['webglcontextrestored']!();

      expect(onRestored).toHaveBeenCalled();
    });
  });
});
