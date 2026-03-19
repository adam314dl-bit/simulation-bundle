// src/rendering/ParticleRenderer.tsx
// REND-05, REND-06, REND-07: WebGL2 particle renderer with Canvas2D fallback and trail effects

import React, { useRef, useEffect } from 'react';
import type { ParticleRendererProps } from './types';
import { compileProgram, createParticleVAO, createRampTexture, setupContextLossHandler } from '../utils/webgl-helpers';
import { getRampLUT, colorRamps } from './color-ramps';

// --- GLSL Shaders ---

const VERT_SRC = `#version 300 es
precision highp float;
in vec2 a_position;
in vec2 a_velocity;
uniform mat3 u_transform;
uniform float u_pointSize;
out float v_colorT;
void main() {
  vec3 pos = u_transform * vec3(a_position, 1.0);
  gl_Position = vec4(pos.xy, 0.0, 1.0);
  gl_PointSize = u_pointSize;
  float speed = length(a_velocity);
  v_colorT = clamp(speed, 0.0, 1.0);
}
`;

const FRAG_SRC = `#version 300 es
precision highp float;
in float v_colorT;
uniform sampler2D u_colorRamp;
out vec4 fragColor;
void main() {
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center) * 2.0;
  if (dist > 1.0) discard;
  float alpha = exp(-dist * dist * 4.0);
  vec4 color = texture(u_colorRamp, vec2(v_colorT, 0.5));
  fragColor = vec4(color.rgb, alpha);
}
`;

const FADE_VERT_SRC = `#version 300 es
precision highp float;
const vec2 verts[3] = vec2[3](
  vec2(-1.0, -1.0),
  vec2(3.0, -1.0),
  vec2(-1.0, 3.0)
);
void main() {
  gl_Position = vec4(verts[gl_VertexID], 0.0, 1.0);
}
`;

const FADE_FRAG_SRC = `#version 300 es
precision highp float;
uniform vec4 u_fadeColor;
out vec4 fragColor;
void main() {
  fragColor = u_fadeColor;
}
`;

// Background color components: #0a0a0f
const BG_R = 10 / 255;
const BG_G = 10 / 255;
const BG_B = 15 / 255;

// Periodic full clear interval to fix trail alpha drift
const FULL_CLEAR_INTERVAL = 1000;

export function ParticleRenderer({
  data,
  count,
  width = 600,
  height = 400,
  colorRamp = 'viridis',
  colorMap = 'velocity',
  pointSize = 4,
  trails = false,
  trailAlpha = 0.05,
  blendMode = 'additive',
  renderer = 'auto',
  onFallback,
  className,
}: ParticleRendererProps): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const fadeProgRef = useRef<WebGLProgram | null>(null);
  const vaoRef = useRef<WebGLVertexArrayObject | null>(null);
  const bufferRef = useRef<WebGLBuffer | null>(null);
  const textureRef = useRef<WebGLTexture | null>(null);
  const fadeVaoRef = useRef<WebGLVertexArrayObject | null>(null);
  const rafRef = useRef<number>(0);
  const contextLostRef = useRef<boolean>(false);
  const modeRef = useRef<'webgl2' | 'canvas2d'>('webgl2');
  const frameCountRef = useRef<number>(0);
  const scratchRef = useRef<Float32Array | null>(null);
  const cleanupContextLossRef = useRef<(() => void) | null>(null);

  const dpr = typeof window !== 'undefined' ? (window.devicePixelRatio || 1) : 1;

  // --- WebGL2 rendering path ---
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Size the canvas for DPR
    canvas.width = width * dpr;
    canvas.height = height * dpr;

    // Determine rendering mode
    if (renderer === 'canvas2d') {
      modeRef.current = 'canvas2d';
      return; // Canvas2D path handled by separate effect
    }

    const gl = canvas.getContext('webgl2');
    if (!gl) {
      modeRef.current = 'canvas2d';
      onFallback?.('WebGL2 not available');
      console.warn('sim-kit: WebGL2 unavailable, using Canvas2D fallback');
      return;
    }

    modeRef.current = 'webgl2';
    glRef.current = gl;

    // Query max point size and clamp
    const sizeRange = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array;
    const maxPointSize = sizeRange[1] ?? 64;
    const clampedPointSize = Math.max(1, Math.min(pointSize, maxPointSize));

    // Compile shaders
    const program = compileProgram(gl, VERT_SRC, FRAG_SRC);
    programRef.current = program;

    const fadeProg = compileProgram(gl, FADE_VERT_SRC, FADE_FRAG_SRC);
    fadeProgRef.current = fadeProg;

    // Create particle VAO + buffer
    const maxParticles = Math.max(count, Math.floor(data.length / 4));
    const { vao, buffer } = createParticleVAO(gl, program, maxParticles);
    vaoRef.current = vao;
    bufferRef.current = buffer;

    // Create fade quad VAO (uses gl_VertexID, no attributes needed)
    const fadeVao = gl.createVertexArray()!;
    fadeVaoRef.current = fadeVao;

    // Upload color ramp texture
    const texture = createRampTexture(gl, getRampLUT(colorRamp));
    textureRef.current = texture;

    // Set clear color to background
    gl.clearColor(BG_R, BG_G, BG_B, 1.0);

    // Initial clear
    gl.clear(gl.COLOR_BUFFER_BIT);

    // Context loss handling
    const cleanupCL = setupContextLossHandler(
      canvas,
      () => { contextLostRef.current = true; },
      () => { contextLostRef.current = false; },
    );
    cleanupContextLossRef.current = cleanupCL;

    // Uniform locations
    const uTransform = gl.getUniformLocation(program, 'u_transform');
    const uPointSize = gl.getUniformLocation(program, 'u_pointSize');
    const uColorRamp = gl.getUniformLocation(program, 'u_colorRamp');
    const uFadeColor = gl.getUniformLocation(fadeProg, 'u_fadeColor');

    // Build orthographic projection matrix (mat3): maps [0,width]x[0,height] to [-1,1]x[-1,1]
    // x' = x * 2/w - 1, y' = y * 2/h - 1
    const projMatrix = new Float32Array([
      2 / width, 0, 0,
      0, 2 / height, 0,
      -1, -1, 1,
    ]);

    frameCountRef.current = 0;

    const loop = () => {
      if (contextLostRef.current) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      const currentGl = glRef.current;
      if (!currentGl) return;

      currentGl.viewport(0, 0, canvas.width, canvas.height);

      if (trails) {
        frameCountRef.current++;
        // Periodic full clear to fix alpha drift
        if (frameCountRef.current % FULL_CLEAR_INTERVAL === 0) {
          currentGl.clear(currentGl.COLOR_BUFFER_BIT);
        } else {
          // Draw fade overlay
          currentGl.enable(currentGl.BLEND);
          currentGl.blendFunc(currentGl.SRC_ALPHA, currentGl.ONE_MINUS_SRC_ALPHA);
          currentGl.useProgram(fadeProg);
          currentGl.bindVertexArray(fadeVao);
          currentGl.uniform4f(uFadeColor, BG_R, BG_G, BG_B, trailAlpha);
          currentGl.drawArrays(currentGl.TRIANGLES, 0, 3);
        }

        // Set particle blending
        if (blendMode === 'additive') {
          currentGl.blendFunc(currentGl.SRC_ALPHA, currentGl.ONE);
        } else {
          currentGl.blendFunc(currentGl.SRC_ALPHA, currentGl.ONE_MINUS_SRC_ALPHA);
        }
      } else {
        currentGl.clear(currentGl.COLOR_BUFFER_BIT);
        currentGl.enable(currentGl.BLEND);
        currentGl.blendFunc(currentGl.SRC_ALPHA, currentGl.ONE_MINUS_SRC_ALPHA);
      }

      currentGl.enable(currentGl.BLEND);
      currentGl.useProgram(program);
      currentGl.bindVertexArray(vao);

      // Handle custom colorMap: replace velocity data with custom values in scratch buffer
      let uploadData: Float32Array;
      if (typeof colorMap === 'function') {
        const needed = count * 4;
        if (!scratchRef.current || scratchRef.current.length < needed) {
          scratchRef.current = new Float32Array(needed);
        }
        const scratch = scratchRef.current;
        scratch.set(data.subarray(0, needed));
        for (let i = 0; i < count; i++) {
          const off = i * 4;
          const colorT = colorMap({
            x: data[off]!,
            y: data[off + 1]!,
            vx: data[off + 2]!,
            vy: data[off + 3]!,
          });
          scratch[off + 2] = colorT;
          scratch[off + 3] = 0;
        }
        uploadData = scratch.subarray(0, needed);
      } else {
        uploadData = data.subarray(0, count * 4);
      }

      currentGl.bindBuffer(currentGl.ARRAY_BUFFER, buffer);
      currentGl.bufferSubData(currentGl.ARRAY_BUFFER, 0, uploadData);

      // Set uniforms
      currentGl.uniformMatrix3fv(uTransform, false, projMatrix);
      currentGl.uniform1f(uPointSize, clampedPointSize * dpr);
      currentGl.activeTexture(currentGl.TEXTURE0);
      currentGl.bindTexture(currentGl.TEXTURE_2D, texture);
      currentGl.uniform1i(uColorRamp, 0);

      currentGl.drawArrays(currentGl.POINTS, 0, count);

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      cleanupCL();
      cleanupContextLossRef.current = null;
      gl.deleteProgram(program);
      gl.deleteProgram(fadeProg);
      gl.deleteVertexArray(vao);
      gl.deleteVertexArray(fadeVao);
      gl.deleteBuffer(buffer);
      gl.deleteTexture(texture);
      glRef.current = null;
      programRef.current = null;
      fadeProgRef.current = null;
      vaoRef.current = null;
      fadeVaoRef.current = null;
      bufferRef.current = null;
      textureRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Canvas2D fallback rendering path ---
  useEffect(() => {
    if (modeRef.current !== 'canvas2d') return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resolve color ramp function for Canvas2D path
    const rampName = colorRamp as keyof typeof colorRamps;
    const rampFn = colorRamps[rampName];

    let frameCount = 0;
    const w = canvas.width;
    const h = canvas.height;

    const loop = () => {
      if (trails) {
        frameCount++;
        if (frameCount % FULL_CLEAR_INTERVAL === 0) {
          ctx.fillStyle = `rgb(10, 10, 15)`;
          ctx.fillRect(0, 0, w, h);
        } else {
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = `rgba(10, 10, 15, ${trailAlpha})`;
          ctx.fillRect(0, 0, w, h);
        }
        ctx.globalCompositeOperation = blendMode === 'additive' ? 'lighter' : 'source-over';
      } else {
        ctx.clearRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
      }

      const radius = pointSize * dpr * 0.5;

      for (let i = 0; i < count; i++) {
        const off = i * 4;
        const x = data[off]!;
        const y = data[off + 1]!;
        const vx = data[off + 2]!;
        const vy = data[off + 3]!;

        let colorT: number;
        if (typeof colorMap === 'function') {
          colorT = colorMap({ x, y, vx, vy });
        } else {
          const speed = Math.sqrt(vx * vx + vy * vy);
          colorT = Math.max(0, Math.min(1, speed));
        }

        const color = rampFn ? rampFn(colorT) : `rgb(255,255,255)`;
        ctx.beginPath();
        ctx.arc(x * dpr, y * dpr, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        background: '#0a0a0f',
      }}
    />
  );
}
