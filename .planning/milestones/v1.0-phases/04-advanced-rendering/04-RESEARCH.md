# Phase 4: Advanced Rendering - Research

**Researched:** 2026-03-19
**Domain:** WebGL2 particle rendering, D3-force graph layout, Canvas2D fallbacks
**Confidence:** HIGH

## Summary

Phase 4 implements two major rendering components: a WebGL2-based ParticleRenderer for up to 100k particles at 60fps with trail effects, and a D3-force-powered ForceGraph with React-managed SVG/Canvas rendering. Both components integrate with the existing sim-kit architecture (Zustand store, color ramps, SimCanvas patterns) established in Phases 1-2.

The WebGL2 particle system uses GL_POINTS with instanced attribute data in an interleaved Float32Array, a 1D color ramp texture for GPU-side color mapping, and full-canvas alpha fade for trail effects. The ForceGraph uses d3-force purely for layout computation (position/velocity), with React controlling all DOM rendering via SVG elements (no D3 DOM manipulation). Canvas2D mode for large graphs uses hit-testing for interaction. A shared WebGL utility module (UTIL-03) provides shader compilation, buffer management, and context setup helpers.

**Primary recommendation:** Build UTIL-03 WebGL helpers first, then ParticleRenderer (WebGL2 path, then Canvas2D fallback, then trails), then ForceGraph (SVG mode first, interactions, then Canvas2D large-graph mode).

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Soft circle particles via GL_POINTS with fragment shader discard for circular shape + gaussian edge falloff
- Default point size: 4px, configurable range 1-32px, clamped to GPU max at init
- Color mapping: velocity-based by default, colorMap prop accepting "velocity" or custom function returning 0-1
- Props: colorRamp="viridis", colorMap="velocity" | (particle) => number, pointSize={4}
- Trail rendering: full-canvas alpha fade technique (semi-transparent dark rect each frame)
- Trail props: trails={true}, trailAlpha={0.05}, blendMode="additive" | "normal"
- Silent WebGL2 auto-detection with console.warn fallback to Canvas2D
- onFallback callback, renderer="auto"|"webgl2"|"canvas2d" prop
- Canvas2D: hard circles, ~10k particles at 30fps practical max
- ForceGraph: filled circles, configurable radius, optional text labels, category10 colors
- ForceGraph links: thin straight lines, configurable width/color/opacity/curvature
- ForceGraph large graph mode: auto-switch SVG to Canvas2D at canvasThreshold (default 500)
- ForceGraph drag: fix fx/fy while dragging, unfix on release, Shift+release to pin, click pinned to unpin
- ForceGraph hover: 1.2x scale highlight, dim non-connected to 0.2 opacity
- ForceGraph auto-pause: alpha < 0.001, reheat on drag/data/force change
- ForceGraph props: alphaDecay={0.0228}, alphaMin={0.001}, onStabilize callback

### Claude's Discretion
- WebGL shader compilation and buffer management details (UTIL-03)
- Exact gaussian falloff formula for soft circles
- D3-force tick scheduling (requestAnimationFrame vs setTimeout)
- SVG-to-Canvas2D switch animation/transition
- Tooltip positioning logic and overflow handling
- WebGL context loss recovery strategy
- Interleaved Float32Array layout for particle data
- ForceGraph zoom/pan implementation (if needed beyond node interaction)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REND-05 | ParticleRenderer uses WebGL2 instanced rendering with interleaved Float32Array input, configurable point size, and color ramp texture | WebGL2 instanced drawing API (vertexAttribDivisor, drawArraysInstanced), GL_POINTS with gl_PointSize, 1D texture from getRampLUT |
| REND-06 | ParticleRenderer supports trail effect via alpha fade overlay and additive/normal blending modes | Full-canvas alpha fade (fillRect with low alpha each frame), gl.blendFunc for additive vs normal |
| REND-07 | ParticleRenderer achieves 100k particles at 60fps and falls back to Canvas2D if WebGL2 unavailable | Single draw call for all particles, silent canvas.getContext('webgl2') detection, Canvas2D arc() fallback |
| REND-08 | ForceGraph uses D3-force for layout computation with React-managed SVG rendering (no D3 DOM manipulation) | d3-force simulation.tick() for layout, React renders SVG circle/line elements from node x,y positions |
| REND-09 | ForceGraph supports interactive node dragging, hover/click handlers, configurable forces | simulation.find() for hit-testing, fx/fy for drag pinning, force configuration via props |
| REND-10 | ForceGraph auto-pauses when stable (alpha < 0.001) and supports optional Canvas2D mode for >500 nodes | simulation.on("end") + alphaMin, Canvas2D rendering with manual hit-testing |
| UTIL-03 | WebGL helper utilities for shader compilation, buffer management, and instanced rendering setup | Shader compile/link pattern, VAO setup, buffer helpers, context loss handlers |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| d3-force | 3.0.0 | Force-directed graph layout computation | Already a dependency; provides forceSimulation, forceManyBody, forceLink, forceCenter, forceCollide |
| d3-quadtree | 3.0.1 | Spatial indexing for hit-testing in Canvas2D mode | Already installed; used internally by d3-force, can also use for ForceGraph canvas hit-testing |

### Required Addition
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @types/d3-force | 3.0.10 | TypeScript definitions for d3-force | Required -- d3-force has no built-in types. Provides SimulationNodeDatum, SimulationLinkDatum, ForceLink, etc. |

### No Additional Libraries Needed
WebGL2 is a browser API -- no library needed. The entire particle renderer is raw WebGL2 calls wrapped in UTIL-03 helpers. ForceGraph uses d3-force for layout + React SVG for rendering.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Raw WebGL2 | regl/twgl.js | Adds dependency for something we control fully; our use case (GL_POINTS + 1 texture) is simple enough |
| d3-force layout-only | react-force-graph | Would fight our "no D3 DOM manipulation" requirement; brings large dependency |
| Manual Canvas2D hit-testing | d3-quadtree (already installed) | quadtree is already available and perfect for spatial point queries |

**Installation:**
```bash
npm install -D @types/d3-force
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  rendering/
    ParticleRenderer.tsx     # React component wrapping WebGL2/Canvas2D particle renderer
    ForceGraph.tsx           # React component for force-directed graph (SVG + Canvas2D modes)
    types.ts                 # Extended with ParticleRendererProps, ForceGraphProps, etc.
    index.ts                 # Barrel exports updated
  utils/
    webgl-helpers.ts         # UTIL-03: shader compilation, buffer mgmt, VAO setup, context loss
```

### Pattern 1: WebGL2 Lifecycle in React
**What:** Manage WebGL2 context, shaders, buffers, and textures within React component lifecycle using refs.
**When to use:** Any WebGL2 rendering component.
**Key principle:** All GL resources are created in useEffect (mount), updated via refs in rAF loop, and cleaned up in useEffect return (unmount).

```typescript
// Pattern: WebGL2 resource management in React
const canvasRef = useRef<HTMLCanvasElement>(null);
const glRef = useRef<WebGL2RenderingContext | null>(null);
const programRef = useRef<WebGLProgram | null>(null);
const vaoRef = useRef<WebGLVertexArrayObject | null>(null);
const bufferRef = useRef<WebGLBuffer | null>(null);
const textureRef = useRef<WebGLTexture | null>(null);
const rafRef = useRef(0);

useEffect(() => {
  const canvas = canvasRef.current;
  if (!canvas) return;

  const gl = canvas.getContext('webgl2');
  if (!gl) {
    // Fallback to Canvas2D
    onFallback?.('WebGL2 not available');
    return;
  }
  glRef.current = gl;

  // Compile shaders, create program, setup VAO, upload texture
  const program = compileProgram(gl, VERT_SRC, FRAG_SRC);
  programRef.current = program;

  // ... setup buffers, VAO, texture

  // rAF loop
  const loop = () => {
    if (!glRef.current) return;
    // Update buffer data, draw
    rafRef.current = requestAnimationFrame(loop);
  };
  rafRef.current = requestAnimationFrame(loop);

  return () => {
    cancelAnimationFrame(rafRef.current);
    // Delete GL resources
    gl.deleteProgram(program);
    gl.deleteBuffer(bufferRef.current);
    gl.deleteVertexArray(vaoRef.current);
    gl.deleteTexture(textureRef.current);
    glRef.current = null;
  };
}, []);
```

### Pattern 2: D3-Force Layout-Only with React Rendering
**What:** Use d3-force purely for position computation. React owns all SVG DOM elements.
**When to use:** ForceGraph component.
**Key principle:** d3-force mutates node objects in-place (x, y, vx, vy). On each tick, copy positions to React state to trigger re-render.

```typescript
// Pattern: d3-force as layout engine, React renders SVG
const simulationRef = useRef<d3.Simulation<NodeType, LinkType>>();

useEffect(() => {
  const sim = d3.forceSimulation<NodeType>(nodes)
    .force('charge', d3.forceManyBody().strength(charge))
    .force('link', d3.forceLink<NodeType, LinkType>(links).distance(linkDistance))
    .force('center', d3.forceCenter(width / 2, height / 2).strength(centerStrength))
    .force('collide', d3.forceCollide<NodeType>(collisionRadius))
    .alphaDecay(alphaDecay)
    .alphaMin(alphaMin);

  sim.on('tick', () => {
    // Trigger React re-render with updated positions
    setNodePositions(nodes.map(n => ({ ...n })));
  });

  sim.on('end', () => {
    onStabilize?.();
  });

  simulationRef.current = sim;
  return () => { sim.stop(); };
}, [nodes, links]);
```

### Pattern 3: Interleaved Float32Array for Particle Data
**What:** Pack particle attributes (x, y, vx, vy or other data) into a single interleaved Float32Array for efficient GPU upload.
**When to use:** ParticleRenderer WebGL2 path.

```typescript
// Layout: [x, y, vx, vy, x, y, vx, vy, ...]
// Stride = 4 floats = 16 bytes per particle
const FLOATS_PER_PARTICLE = 4;
const data = new Float32Array(particleCount * FLOATS_PER_PARTICLE);

// Setup vertex attributes with stride
const stride = FLOATS_PER_PARTICLE * 4; // bytes
gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, stride, 0);   // x, y
gl.vertexAttribPointer(velLoc, 2, gl.FLOAT, false, stride, 8);   // vx, vy
```

### Pattern 4: Canvas2D ForceGraph with Hit-Testing
**What:** For graphs >500 nodes, render to Canvas2D and use spatial indexing for pointer interactions.
**When to use:** ForceGraph canvasThreshold exceeded.

```typescript
// Hit-testing via simulation.find()
const handleClick = (e: React.PointerEvent) => {
  const rect = canvasRef.current!.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const node = simulationRef.current?.find(x, y, hitRadius);
  if (node) onNodeClick?.(node);
};
```

### Anti-Patterns to Avoid
- **D3 DOM manipulation in ForceGraph:** Never use d3.select().append() -- React must own all SVG/DOM elements. D3 is layout-only.
- **Re-creating simulation on every render:** Store simulation in useRef, not useState. Update forces imperatively when props change.
- **Uploading full buffer every frame when data unchanged:** Track dirty flag on particle data; skip bufferSubData when clean.
- **Blocking shader compilation checks:** Never check gl.getShaderParameter(COMPILE_STATUS) after each shader. Batch compile, link, then check link status only.
- **Forgetting to clean up GL resources:** Every createBuffer/createTexture/createProgram must have a matching delete in cleanup.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Force-directed layout | Custom force simulation | d3-force forceSimulation | Barnes-Hut approximation in forceManyBody is O(n log n); hand-rolling is O(n^2) and buggy |
| Spatial point queries | Loop over all nodes | d3-force simulation.find() or d3-quadtree | O(log n) vs O(n) for hit-testing |
| Color ramp textures | Manual RGB interpolation in shader | getRampLUT() + 1D texture lookup | Already built in Phase 2; 256-entry RGBA LUT is exact same format WebGL needs |
| Shader error diagnostics | Manual string parsing | Structured compile/link error extraction in webgl-helpers | Error messages vary by GPU vendor; centralizing extraction handles edge cases |

**Key insight:** The WebGL boilerplate (compile, link, VAO setup, buffer creation) is genuinely repetitive and error-prone. UTIL-03 abstracts exactly this. But the actual rendering logic (shaders, draw loop, trail blending) is specific enough to write directly.

## Common Pitfalls

### Pitfall 1: WebGL2 Context Creation Failure Modes
**What goes wrong:** canvas.getContext('webgl2') returns null on older devices, some mobile browsers, or when too many contexts are active.
**Why it happens:** WebGL2 is not universally available. Browsers limit total GL contexts (typically 8-16).
**How to avoid:** Always check return value before using. Implement Canvas2D fallback as a complete alternative renderer, not an afterthought. Clean up GL contexts on unmount.
**Warning signs:** Null context on mount, context loss events firing.

### Pitfall 2: gl_PointSize Clamped by GPU
**What goes wrong:** Requesting point sizes >64px (or even >32px on some GPUs) silently clamps to the GPU maximum.
**Why it happens:** GL_POINTS has hardware-dependent maximum size (query via gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)).
**How to avoid:** Query max point size at initialization, clamp requested pointSize to [1, maxPointSize]. Document in props that actual max depends on hardware.
**Warning signs:** Particles appear smaller than expected on certain devices.

### Pitfall 3: D3-Force Mutates Input Data
**What goes wrong:** d3.forceSimulation(nodes) mutates the node objects in place, adding x, y, vx, vy, index properties. If React state holds these same objects, unexpected mutations occur.
**Why it happens:** D3-force is designed for imperative use; it assumes ownership of node objects.
**How to avoid:** Either (a) accept mutation and use a ref-based approach where React reads positions via ref, or (b) create lightweight proxy objects for the simulation and sync back to React state on tick. Option (a) is more performant -- use useRef for the simulation data and trigger re-renders via a tick counter.
**Warning signs:** Stale renders, positions not updating, React warnings about state mutations.

### Pitfall 4: ForceGraph Re-render Thrashing
**What goes wrong:** Updating React state on every d3-force tick (300+ ticks to stabilize) causes excessive re-renders.
**Why it happens:** Each tick fires ~60 times/second, each triggering a full SVG re-render.
**How to avoid:** Use requestAnimationFrame to batch tick updates. Only update React state once per animation frame, not once per simulation tick. For Canvas2D mode, skip React state entirely and draw directly.
**Warning signs:** Dropped frames, laggy initial layout animation.

### Pitfall 5: Trail Alpha Accumulation Drift
**What goes wrong:** Over many frames, the alpha fade overlay doesn't fully clear the canvas -- old trails leave permanent ghost artifacts.
**Why it happens:** Floating-point precision in alpha blending means fillRect(0,0,w,h) with rgba(10,10,15, 0.05) never fully erases to background color.
**How to avoid:** Periodically (every ~1000 frames or when trails are disabled) do a full clear. Also, use the exact background color (#0a0a0f = rgb(10,10,15)) for the fade rectangle.
**Warning signs:** Canvas gradually brightens or shows ghost trails that never fully disappear.

### Pitfall 6: WebGL Context Loss During Tab Switch
**What goes wrong:** Browser reclaims WebGL context when tab is backgrounded. On return, all GL resources are invalid.
**Why it happens:** Browsers aggressively manage GPU memory, especially on mobile.
**How to avoid:** Listen for 'webglcontextlost' and 'webglcontextrestored' events on the canvas. On loss: preventDefault() to allow recovery, set a flag to skip rendering. On restore: re-create all GL resources (shaders, buffers, textures, VAO). Keep shader source strings and initialization params in refs for re-creation.
**Warning signs:** Black canvas after tab switching, GL errors in console.

### Pitfall 7: ForceGraph Drag Without Simulation Reheat
**What goes wrong:** Dragging a node doesn't move connected nodes because the simulation has already stopped.
**Why it happens:** Once alpha < alphaMin, the simulation timer stops. Setting fx/fy on a node doesn't restart it.
**How to avoid:** On drag start, call simulation.alphaTarget(0.3).restart(). On drag end, call simulation.alphaTarget(0).
**Warning signs:** Dragged node moves but graph doesn't react; springs don't pull connected nodes.

## Code Examples

### WebGL2 Shader: Soft Circle Particle with Color Ramp
```glsl
// Vertex shader
#version 300 es
precision highp float;

in vec2 a_position;
in vec2 a_velocity;

uniform mat3 u_transform;    // projection/view matrix
uniform float u_pointSize;
uniform sampler2D u_colorRamp;

out float v_colorT;

void main() {
  // Transform position
  vec3 pos = u_transform * vec3(a_position, 1.0);
  gl_Position = vec4(pos.xy, 0.0, 1.0);
  gl_PointSize = u_pointSize;

  // Compute color lookup from velocity magnitude
  float speed = length(a_velocity);
  v_colorT = clamp(speed, 0.0, 1.0); // normalized by caller
}

// Fragment shader
#version 300 es
precision highp float;

in float v_colorT;
uniform sampler2D u_colorRamp;
out vec4 fragColor;

void main() {
  // Soft circle: distance from center of GL_POINT
  vec2 center = gl_PointCoord - 0.5;
  float dist = length(center) * 2.0;

  // Discard outside circle
  if (dist > 1.0) discard;

  // Gaussian falloff for soft glow: exp(-dist^2 * k)
  float alpha = exp(-dist * dist * 4.0);

  // Sample color ramp texture (1D lookup)
  vec4 color = texture(u_colorRamp, vec2(v_colorT, 0.5));
  fragColor = vec4(color.rgb, alpha);
}
```

### WebGL2 Buffer Setup for Interleaved Particle Data
```typescript
// Source: MDN WebGL2 best practices + webgl2fundamentals instanced drawing
function setupParticleVAO(
  gl: WebGL2RenderingContext,
  program: WebGLProgram,
  particleCount: number
): { vao: WebGLVertexArrayObject; buffer: WebGLBuffer } {
  const vao = gl.createVertexArray()!;
  gl.bindVertexArray(vao);

  const buffer = gl.createBuffer()!;
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

  // Allocate for interleaved [x, y, vx, vy] per particle
  const FLOATS_PER_PARTICLE = 4;
  const stride = FLOATS_PER_PARTICLE * 4; // 16 bytes
  gl.bufferData(gl.ARRAY_BUFFER, particleCount * stride, gl.DYNAMIC_DRAW);

  const posLoc = gl.getAttribLocation(program, 'a_position');
  const velLoc = gl.getAttribLocation(program, 'a_velocity');

  gl.enableVertexAttribArray(posLoc);
  gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, stride, 0);

  gl.enableVertexAttribArray(velLoc);
  gl.vertexAttribPointer(velLoc, 2, gl.FLOAT, false, stride, 8);

  gl.bindVertexArray(null);
  return { vao, buffer };
}
```

### Color Ramp as 1D WebGL Texture
```typescript
// Upload existing getRampLUT() data as a 256x1 RGBA texture
function createRampTexture(
  gl: WebGL2RenderingContext,
  rampName: string
): WebGLTexture {
  const lut = getRampLUT(rampName); // Uint8Array of 256*4 = 1024 bytes
  const tex = gl.createTexture()!;
  gl.bindTexture(gl.TEXTURE_2D, tex);

  // Use texStorage for optimal allocation (WebGL2 best practice)
  gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA8, 256, 1);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 256, 1, gl.RGBA, gl.UNSIGNED_BYTE, lut);

  // Clamp and linear filter for smooth color interpolation
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  return tex;
}
```

### Trail Effect via Alpha Fade
```typescript
// WebGL2 trail: draw semi-transparent quad over entire viewport before particles
function drawTrailFade(gl: WebGL2RenderingContext, trailAlpha: number, bgColor: [number, number, number]) {
  // Disable depth test, enable blending
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // Draw fullscreen quad with background color at trailAlpha opacity
  // (uses a separate simple shader program for the fade quad)
  // bgColor = [10/255, 10/255, 15/255] for #0a0a0f
  // trailAlpha = 0.05 for long dreamy trails
}

// Canvas2D trail equivalent:
function drawTrailFadeCanvas(ctx: CanvasRenderingContext2D, trailAlpha: number) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = `rgba(10, 10, 15, ${trailAlpha})`;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
}
```

### D3-Force with React SVG (ForceGraph pattern)
```typescript
// Source: d3js.org/d3-force/simulation
import { forceSimulation, forceManyBody, forceLink, forceCenter, forceCollide } from 'd3-force';
import type { SimulationNodeDatum, SimulationLinkDatum } from 'd3-force';

interface GraphNode extends SimulationNodeDatum {
  id: string;
  group?: number;
  label?: string;
}

interface GraphLink extends SimulationLinkDatum<GraphNode> {
  source: string | GraphNode;
  target: string | GraphNode;
}

// In component:
const simulationRef = useRef<d3.Simulation<GraphNode, GraphLink>>();
const [tick, setTick] = useState(0); // trigger re-render

useEffect(() => {
  const sim = forceSimulation<GraphNode>(nodesCopy)
    .force('charge', forceManyBody<GraphNode>().strength(charge))
    .force('link', forceLink<GraphNode, GraphLink>(linksCopy).id(d => d.id).distance(linkDistance))
    .force('center', forceCenter(width / 2, height / 2).strength(centerStrength))
    .force('collide', forceCollide<GraphNode>(collisionRadius))
    .alphaDecay(alphaDecay)
    .alphaMin(alphaMin);

  // Batch ticks to rAF for smooth animation
  let frameId = 0;
  sim.on('tick', () => {
    cancelAnimationFrame(frameId);
    frameId = requestAnimationFrame(() => setTick(t => t + 1));
  });

  sim.on('end', () => onStabilize?.());

  simulationRef.current = sim;
  return () => { sim.stop(); cancelAnimationFrame(frameId); };
}, [nodes, links]);

// SVG rendering reads positions directly from mutated node objects
return (
  <svg width={width} height={height}>
    {linksCopy.map(link => (
      <line
        key={`${(link.source as GraphNode).id}-${(link.target as GraphNode).id}`}
        x1={(link.source as GraphNode).x}
        y1={(link.source as GraphNode).y}
        x2={(link.target as GraphNode).x}
        y2={(link.target as GraphNode).y}
      />
    ))}
    {nodesCopy.map(node => (
      <circle
        key={node.id}
        cx={node.x}
        cy={node.y}
        r={nodeRadius}
      />
    ))}
  </svg>
);
```

### Node Drag with Simulation Reheat
```typescript
// Source: d3js.org/d3-force/simulation (find, fx/fy, alphaTarget)
const handleDragStart = (node: GraphNode, e: React.PointerEvent) => {
  const sim = simulationRef.current!;
  sim.alphaTarget(0.3).restart(); // Reheat
  node.fx = node.x;
  node.fy = node.y;
  dragNodeRef.current = node;
};

const handleDragMove = (e: React.PointerEvent) => {
  const node = dragNodeRef.current;
  if (!node) return;
  const [wx, wy] = screenToSVG(e.clientX, e.clientY);
  node.fx = wx;
  node.fy = wy;
};

const handleDragEnd = (e: React.PointerEvent) => {
  const node = dragNodeRef.current;
  if (!node) return;
  const sim = simulationRef.current!;
  sim.alphaTarget(0);

  if (e.shiftKey) {
    // Shift+release: pin permanently (keep fx/fy)
  } else {
    // Normal release: unfix
    node.fx = null;
    node.fy = null;
  }
  dragNodeRef.current = null;
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| WebGL1 + extensions for instancing | WebGL2 native vertexAttribDivisor + drawArraysInstanced | WebGL2 baseline (2019+) | No extension detection needed; cleaner API |
| D3 owns DOM (enter/update/exit) | D3 for math only, React for DOM | ~2020+ consensus | Clean separation; no D3/React DOM conflicts |
| texImage2D for texture allocation | texStorage2D + texSubImage2D (WebGL2) | WebGL2 spec | More efficient GPU memory allocation |
| Transform feedback for GPU particles | Simple bufferSubData with CPU positions | N/A | For 100k particles, CPU-side position updates are fast enough; transform feedback adds complexity without benefit at this scale |

**Deprecated/outdated:**
- gl.VERTEX_ATTRIB_ARRAY_DIVISOR_ANGLE extension: replaced by native WebGL2 vertexAttribDivisor
- D3 v3/v4 force layout API: v7+ uses forceSimulation with composable forces

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.0 + @testing-library/react 16.3.2 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run tests/rendering/` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REND-05 | ParticleRenderer renders canvas, accepts props, WebGL2 setup | unit | `npx vitest run tests/rendering/ParticleRenderer.test.tsx -t "REND-05"` | No -- Wave 0 |
| REND-06 | Trail effect props (trailAlpha, blendMode) accepted and applied | unit | `npx vitest run tests/rendering/ParticleRenderer.test.tsx -t "REND-06"` | No -- Wave 0 |
| REND-07 | Canvas2D fallback when WebGL2 unavailable, onFallback called | unit | `npx vitest run tests/rendering/ParticleRenderer.test.tsx -t "REND-07"` | No -- Wave 0 |
| REND-08 | ForceGraph renders SVG with nodes and links, no D3 DOM manipulation | unit | `npx vitest run tests/rendering/ForceGraph.test.tsx -t "REND-08"` | No -- Wave 0 |
| REND-09 | ForceGraph drag handlers, hover/click callbacks, force props | unit | `npx vitest run tests/rendering/ForceGraph.test.tsx -t "REND-09"` | No -- Wave 0 |
| REND-10 | ForceGraph auto-pause, Canvas2D mode activation | unit | `npx vitest run tests/rendering/ForceGraph.test.tsx -t "REND-10"` | No -- Wave 0 |
| UTIL-03 | WebGL helpers compile shaders, create buffers, handle errors | unit | `npx vitest run tests/utils/webgl-helpers.test.ts` | No -- Wave 0 |

### Testing Constraints for WebGL2 in jsdom
jsdom does not support WebGL2. Tests for ParticleRenderer must:
- Mock `canvas.getContext('webgl2')` to return a mock GL context object
- Test component mounting, prop passing, fallback behavior, and cleanup
- Performance testing (100k at 60fps) requires manual browser verification or Storybook visual inspection
- Shader source correctness can be unit-tested as string matching

### Sampling Rate
- **Per task commit:** `npx vitest run tests/rendering/ tests/utils/webgl-helpers.test.ts`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] `tests/rendering/ParticleRenderer.test.tsx` -- covers REND-05, REND-06, REND-07
- [ ] `tests/rendering/ForceGraph.test.tsx` -- covers REND-08, REND-09, REND-10
- [ ] `tests/utils/webgl-helpers.test.ts` -- covers UTIL-03
- [ ] WebGL2 mock setup in tests/setup.ts or test-local mocks (getContext('webgl2') returns mock object)
- [ ] `@types/d3-force` devDependency install

## Open Questions

1. **Particle data format contract**
   - What we know: Interleaved Float32Array with [x, y, vx, vy] per particle. User provides this as prop.
   - What's unclear: Should the component accept a typed particles array of objects and internally pack it, or require the caller to provide pre-packed Float32Array?
   - Recommendation: Accept `Float32Array` directly (performance-critical path) plus document the expected layout. The Particles demo (Phase 6) will own the packing logic.

2. **ForceGraph data immutability**
   - What we know: D3-force mutates node objects (adds x, y, vx, vy, index).
   - What's unclear: Should ForceGraph deep-clone input nodes/links on mount, or require caller to pass mutable data?
   - Recommendation: Deep-clone nodes and links internally on mount and when data prop changes. This protects callers from mutation surprises. Use structuredClone or manual spread.

3. **ForceGraph Canvas2D label rendering**
   - What we know: Labels are hover-only in Canvas2D mode per user decision.
   - What's unclear: Should hover labels be HTML overlays (positioned via CSS) or drawn on canvas?
   - Recommendation: Use a single HTML div overlay (absolute-positioned, pointer-events:none) for tooltip/label. This matches the tooltipContent prop pattern and avoids canvas text rendering complexity.

## Sources

### Primary (HIGH confidence)
- [D3-force simulation API](https://d3js.org/d3-force/simulation) -- complete forceSimulation API, node mutation behavior, alpha/decay model, find() method
- [MDN WebGL best practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices) -- shader compilation patterns, buffer management, context loss, texStorage2D
- [WebGL2Fundamentals instanced drawing](https://webgl2fundamentals.org/webgl/lessons/webgl-instanced-drawing.html) -- vertexAttribDivisor, drawArraysInstanced API pattern
- [Khronos WebGL Context Loss Wiki](https://www.khronos.org/webgl/wiki/HandlingContextLost) -- context loss/restore event handling protocol
- Project codebase: `src/rendering/color-ramps.ts` (getRampLUT returns Uint8Array 256*4), `src/rendering/SimCanvas.tsx` (rAF loop + DPR pattern), `src/rendering/viewport.ts` (coordinate transforms)

### Secondary (MEDIUM confidence)
- [MDN WEBGL_lose_context](https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_lose_context) -- loseContext/restoreContext for testing
- [WebGL2Fundamentals textures](https://webgl2fundamentals.org/webgl/lessons/webgl-3d-textures.html) -- texture setup patterns
- [D3-force GitHub](https://github.com/d3/d3-force) -- SimulationNodeDatum interface reference

### Tertiary (LOW confidence)
- [WebKit instanced rendering bug #222731](https://bugs.webkit.org/show_bug.cgi?id=222731) -- Safari had slow instanced rendering (may be fixed in 2026 Safari, needs validation if Safari performance matters)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- d3-force already installed, WebGL2 is browser-native, @types/d3-force is the standard typing
- Architecture: HIGH -- patterns verified against official docs and project codebase conventions
- Pitfalls: HIGH -- well-documented issues in WebGL and d3-force ecosystems, verified via multiple sources
- Validation: MEDIUM -- jsdom WebGL2 mocking approach needs validation during implementation

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable technologies, minimal churn)
