// src/utils/webgl-helpers.ts
// UTIL-03: WebGL helper utilities for shader compilation, buffer management, and instanced rendering setup

/**
 * Compile vertex + fragment shaders and link into a WebGLProgram.
 * Throws descriptive error on compile/link failure.
 */
export function compileProgram(
  gl: WebGL2RenderingContext,
  vertexSrc: string,
  fragmentSrc: string
): WebGLProgram {
  const vs = gl.createShader(gl.VERTEX_SHADER)!;
  gl.shaderSource(vs, vertexSrc);
  gl.compileShader(vs);

  const fs = gl.createShader(gl.FRAGMENT_SHADER)!;
  gl.shaderSource(fs, fragmentSrc);
  gl.compileShader(fs);

  const program = gl.createProgram()!;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const vsLog = gl.getShaderInfoLog(vs) || '';
    const fsLog = gl.getShaderInfoLog(fs) || '';
    const pLog = gl.getProgramInfoLog(program) || '';
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    gl.deleteProgram(program);
    throw new Error(
      `WebGL program link failed.\nVertex: ${vsLog}\nFragment: ${fsLog}\nProgram: ${pLog}`
    );
  }

  // Shaders can be deleted after linking -- GPU retains compiled code
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return program;
}

/**
 * Create a VAO with an interleaved buffer for particle data.
 * Layout: [x, y, vx, vy] per particle = 4 floats = 16 bytes stride.
 * Sets up two vertex attributes: a_position (vec2, offset 0) and a_velocity (vec2, offset 8).
 */
export function createParticleVAO(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  maxParticles: number
): { vao: WebGLVertexArrayObject; buffer: WebGLBuffer } {
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);

  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  const FLOATS_PER_PARTICLE = 4;
  const stride = FLOATS_PER_PARTICLE * 4; // 16 bytes
  gl.bufferData(gl.ARRAY_BUFFER, maxParticles * stride, gl.DYNAMIC_DRAW);

  const posLoc = gl.getAttribLocation(program, 'a_position');
  const velLoc = gl.getAttribLocation(program, 'a_velocity');

  if (posLoc >= 0) {
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, stride, 0);
  }
  if (velLoc >= 0) {
    gl.enableVertexAttribArray(velLoc);
    gl.vertexAttribPointer(velLoc, 2, gl.FLOAT, false, stride, 8);
  }

  gl.bindVertexArray(null);
  return { vao, buffer };
}

/**
 * Create a 256x1 RGBA texture from a color ramp LUT (Uint8Array of 1024 bytes).
 * Uses texStorage2D for optimal GPU allocation.
 */
export function createRampTexture(
  gl: WebGL2RenderingContext,
  lutData: Uint8Array
): WebGLTexture {
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, 256, 1);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 256, 1, gl.RGBA, gl.UNSIGNED_BYTE, lutData);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  return tex;
}

/**
 * Setup context loss/restore handlers on a canvas element.
 * Returns a cleanup function to remove event listeners.
 *
 * onLost: called when context is lost (stop rendering).
 * onRestored: called when context is restored (re-create all GL resources).
 */
export function setupContextLossHandler(
  canvas: HTMLCanvasElement,
  onLost: () => void,
  onRestored: () => void
): () => void {
  const handleLost = (e: Event) => {
    e.preventDefault(); // Allow context restoration
    onLost();
  };
  const handleRestored = () => {
    onRestored();
  };
  canvas.addEventListener('webglcontextlost', handleLost);
  canvas.addEventListener('webglcontextrestored', handleRestored);
  return () => {
    canvas.removeEventListener('webglcontextlost', handleLost);
    canvas.removeEventListener('webglcontextrestored', handleRestored);
  };
}
