# Architecture Patterns

**Domain:** React simulation UI component library (18 components, 4 layers)
**Researched:** 2026-03-18

## Recommended Architecture

### High-Level System Diagram

```
+-----------------------------------------------------------------------+
|  SimulationProvider (Zustand store + tick loop)                        |
|                                                                       |
|  +------------------+   +---------------------+   +-----------------+ |
|  |   CORE LAYER     |   |   RENDERING LAYER   |   |  CONTROLS LAYER | |
|  |                   |   |                     |   |                 | |
|  | SimulationProvider|-->| CanvasRenderer      |   | ParameterPanel  | |
|  | useSimulation()   |   | GridCanvas          |   | TimelineScrubber| |
|  |                   |   | ParticleRenderer    |   | PlaybackBar     | |
|  |                   |   | ForceGraph          |   | PresetSelector  | |
|  |                   |   | HeatmapOverlay      |   |                 | |
|  +--------+---------+   +----------+----------+   +--------+--------+ |
|           |                        |                        |          |
|           v                        v                        v          |
|  +---------------------------------------------------------------------+
|  |                        DATA LAYER                                   |
|  |  StatsPanel | MiniChart | EventLog | HeatmapOverlay | Inspector    |
|  +---------------------------------------------------------------------+
+-----------------------------------------------------------------------+

Data flow: Store --> Renderers (read via transient subscribe)
           Store <-- Controls (write via actions)
           Store --> Data Layer (read via selectors)
```

### Layer Architecture

This library uses a **strict 4-layer architecture** with unidirectional data flow. Each layer has a clear responsibility and a well-defined interface to the shared state.

| Layer | Responsibility | Reads Store | Writes Store | Render Target |
|-------|---------------|-------------|-------------|---------------|
| Core | State management, tick loop, history | Owns it | Owns it | None (headless) |
| Rendering | Visual output of simulation state | Transient subscribe | Never | Canvas / WebGL / SVG |
| Controls | User input, playback, parameters | Selectors | Actions | React DOM |
| Data | Derived analytics, charts, logs | Selectors | Never | React DOM / SVG |

**Key invariant:** Rendering components never write to the store. Controls never render to canvas. This separation makes the layers independently testable and tree-shakable.

### Component Boundaries

| Component | Layer | Responsibility | Communicates With |
|-----------|-------|---------------|-------------------|
| `SimulationProvider` | Core | Zustand store creation, tick loop, history ring buffer, playback state | All other components (provides store) |
| `useSimulation` | Core | Hook API for accessing store state and actions | All other components (consumes store) |
| `CanvasRenderer` | Rendering | Generic canvas host with pan/zoom, manages canvas lifecycle | Core (reads entities), HeatmapOverlay (layer compositing) |
| `GridCanvas` | Rendering | 2D grid rendering with dirty-rect optimization | Core (reads grid state) |
| `ParticleRenderer` | Rendering | WebGL2 instanced particle rendering (Canvas2D fallback) | Core (reads particle positions) |
| `ForceGraph` | Rendering | D3-force layout computation + React SVG node rendering | Core (reads graph data) |
| `HeatmapOverlay` | Rendering/Data | Color-mapped overlay on canvas layers | Core (reads density data), CanvasRenderer (compositing) |
| `ParameterPanel` | Controls | Auto-generated form from parameter schema | Core (reads/writes params via actions) |
| `TimelineScrubber` | Controls | Seek through simulation history | Core (reads history, writes seek position) |
| `PlaybackBar` | Controls | Play/pause/step/speed controls | Core (writes playback state) |
| `PresetSelector` | Controls | Load predefined parameter sets | Core (writes params via actions) |
| `StatsPanel` | Data | Live numeric readouts of simulation metrics | Core (reads derived stats) |
| `MiniChart` | Data | Sparkline time-series of a metric | Core (reads history window) |
| `EventLog` | Data | Filterable log of simulation events | Core (reads event buffer) |
| `EntityInspector` | Data | Detail view of a selected entity | Core (reads entity by ID) |

## Core Layer: Tick-Loop State Management with Zustand

### Store Architecture

Use a single Zustand store created inside `SimulationProvider`, exposed via React context. The store is split into logical slices using the **slice pattern** but composed into one store for atomic updates.

**Confidence: HIGH** -- Zustand's vanilla store API with `getState()`/`setState()` outside React is well-documented and the standard approach for game loops.

```typescript
// Store shape (simplified)
interface SimulationStore {
  // State slices
  config: SimulationConfig;
  entities: Entity[];
  tick: number;
  time: number;
  playback: PlaybackState;
  history: RingBuffer<Snapshot>;
  events: EventBuffer;

  // Actions
  step: () => void;
  play: () => void;
  pause: () => void;
  seek: (tick: number) => void;
  setParam: (key: string, value: unknown) => void;
  reset: () => void;
}
```

### Tick Loop Pattern

The tick loop runs **outside React's render cycle** using `requestAnimationFrame` and Zustand's vanilla API. This is critical: the loop must not trigger React re-renders on every frame.

```typescript
// Tick loop lives in a useEffect inside SimulationProvider
// Uses getState()/setState() -- NOT the hook API
const loop = () => {
  const state = store.getState();
  if (state.playback.running) {
    const nextState = userTickFn(state.entities, state.config);
    store.setState({
      entities: nextState,
      tick: state.tick + 1,
      time: state.time + state.config.dt,
    });
    // Push snapshot to ring buffer (every Nth tick for memory)
    if (state.tick % snapshotInterval === 0) {
      state.history.push(snapshot(nextState));
    }
  }
  rafId = requestAnimationFrame(loop);
};
```

**Why `getState()` instead of hooks:** The tick function fires 30-60 times per second. Using `useStore()` would trigger React re-renders on every tick. Instead, rendering components use **transient subscriptions** (`store.subscribe()`) to read state changes and update canvas/WebGL directly via refs, bypassing React's reconciler entirely.

### History Ring Buffer

Use a fixed-size circular buffer (not zundo) for simulation history. Zundo is designed for undo/redo in form-style apps; a simulation needs:
- Fixed memory ceiling (e.g., 1000 snapshots max)
- Fast random access for timeline scrubbing (`seek(tick)`)
- Configurable snapshot interval (every Nth tick)
- No JSON patch overhead -- store full snapshots since simulation state is small per-frame

```typescript
class RingBuffer<T> {
  private buffer: T[];
  private head = 0;
  private size = 0;

  constructor(private capacity: number) {
    this.buffer = new Array(capacity);
  }

  push(item: T): void { /* O(1) write at head, wrap around */ }
  get(index: number): T | undefined { /* O(1) random access */ }
  get length(): number { return this.size; }
}
```

**Confidence: HIGH** -- Ring buffers are the standard data structure for fixed-size history in simulations/games. Zustand's `getState()` makes this trivial to integrate.

### User-Provided Tick Function

The library does NOT own the simulation logic. Users provide a `tickFn`:

```typescript
<SimulationProvider
  tickFn={(entities, config) => /* return new entities */}
  initialEntities={[...]}
  parameterSchema={schema}
>
  {children}
</SimulationProvider>
```

This makes the library domain-agnostic. The three demo simulations (ecosystem, particles, social network) each supply their own `tickFn`.

## Rendering Layer: Canvas2D, WebGL2, and SVG

### Rendering Strategy Overview

Each rendering component owns its own draw loop and reads state via **transient subscription** (not React re-renders). This is the single most important architectural decision for performance.

| Component | Technology | Why |
|-----------|-----------|-----|
| `GridCanvas` | Canvas2D | 2D grid cells need pixel-level control, dirty-rect optimization |
| `ParticleRenderer` | WebGL2 (Canvas2D fallback) | 100k particles requires GPU instanced rendering |
| `ForceGraph` | D3-force (compute) + React SVG (render) | React controls nodes for interactivity; D3 does math only |
| `HeatmapOverlay` | Canvas2D | Color-mapped overlay is a 2D raster operation |
| `CanvasRenderer` | Canvas2D | Generic host canvas with pan/zoom transform |

### Canvas2D Rendering Pattern

Every Canvas2D component follows the same architectural pattern:

```typescript
function GridCanvas({ width, height }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const storeRef = useRef(useSimulationStore()); // stable ref to store

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    let rafId: number;

    // Transient subscription: read state, draw, never trigger React render
    const unsubscribe = storeRef.current.subscribe((state) => {
      // Mark dirty regions based on changed cells
      drawDirtyRegions(ctx, state.entities, dirtySet);
    });

    // Or: drive from rAF for consistent frame pacing
    const draw = () => {
      const state = storeRef.current.getState();
      renderGrid(ctx, state.entities);
      rafId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      unsubscribe();
      cancelAnimationFrame(rafId);
    };
  }, []);

  return <canvas ref={canvasRef} width={width} height={height} />;
}
```

**Two valid approaches for the draw loop:**
1. **Subscribe-driven:** `store.subscribe()` fires on every `setState()`. Good when tick rate varies.
2. **rAF-driven:** Own `requestAnimationFrame` loop reads `getState()` each frame. Good when you want decoupled render rate (e.g., render at 60fps even if simulation ticks at 30fps).

**Recommendation:** Use **subscribe-driven** for GridCanvas (dirty-rect needs to know what changed). Use **rAF-driven** for ParticleRenderer (GPU wants consistent frame submission).

### Dirty-Rect Optimization for GridCanvas

For a 500x500 grid at 30fps, redrawing 250k cells per frame is wasteful. Dirty-rect optimization only redraws cells that changed.

```
1. Tick function returns new entity array
2. Compare old vs new: build Set<cellIndex> of changed cells
3. For each dirty cell: ctx.clearRect(x, y, cellW, cellH) + ctx.fillRect(...)
4. Skip unchanged cells entirely
```

**Implementation detail:** Store the previous entity state in a ref. On each subscribe callback, diff against previous, build dirty set, draw only dirty cells. For initial render or full reset, draw everything.

**Confidence: HIGH** -- Dirty-rect is the canonical canvas optimization, documented by MDN and used in every performant canvas grid.

### WebGL2 Particle Rendering

For 100k particles at 60fps, WebGL2 with **instanced rendering** is the correct approach. Each particle is a point/quad instance; position data lives in a GPU buffer.

```
Architecture:
  CPU (tick loop) --> Float32Array (positions) --> GPU buffer --> instanced draw call

Per frame:
  1. Tick function computes new positions (CPU)
  2. Copy positions to Float32Array
  3. gl.bufferSubData() to update GPU buffer
  4. gl.drawArraysInstanced() -- one draw call for all particles
```

**Transform feedback** (computing positions on the GPU) is powerful but increases complexity significantly. Since the project spec targets "reasonable optimizations without over-engineering," use CPU-side position updates with GPU instanced rendering. This comfortably hits 100k at 60fps.

**Canvas2D fallback:** Detect WebGL2 support at mount time. If unavailable, fall back to Canvas2D with `ctx.fillRect()` per particle (will handle ~10k particles at 30fps -- acceptable degradation).

```typescript
function ParticleRenderer(props: Props) {
  const [renderer, setRenderer] = useState<'webgl2' | 'canvas2d'>('webgl2');

  useEffect(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2');
    if (!gl) setRenderer('canvas2d');
  }, []);

  return renderer === 'webgl2'
    ? <WebGL2Particles {...props} />
    : <Canvas2DParticles {...props} />;
}
```

**Confidence: HIGH** -- Instanced rendering for particles is the standard WebGL approach. The CPU-to-GPU buffer upload pattern is well-established.

### D3-Force Integration Without DOM Conflicts

The core principle: **D3 computes, React renders.** D3-force never touches the DOM.

```
Architecture:
  1. d3.forceSimulation() runs headlessly (no DOM attachment)
  2. On each simulation tick, positions are written to Zustand store (or local ref)
  3. React renders <svg> with <circle> and <line> elements using those positions
  4. React owns all DOM manipulation -- D3 owns only math
```

```typescript
function ForceGraph({ nodes, links }: Props) {
  const [positions, setPositions] = useState<NodePosition[]>([]);
  const simulationRef = useRef<d3.Simulation<Node, Link>>();

  useEffect(() => {
    const sim = d3.forceSimulation(nodes)
      .force('link', d3.forceLink(links).id(d => d.id))
      .force('charge', d3.forceManyBody().strength(-30))
      .force('center', d3.forceCenter(width / 2, height / 2));

    sim.on('tick', () => {
      // D3 mutates node objects in-place with x, y positions
      // Copy to React state (triggers re-render of SVG)
      setPositions(nodes.map(n => ({ id: n.id, x: n.x!, y: n.y! })));
    });

    simulationRef.current = sim;
    return () => { sim.stop(); };
  }, [nodes, links]);

  return (
    <svg width={width} height={height}>
      {links.map(link => <line key={...} x1={...} y1={...} x2={...} y2={...} />)}
      {positions.map(node => <circle key={node.id} cx={node.x} cy={node.y} r={5} />)}
    </svg>
  );
}
```

**Performance note:** D3-force's tick callback fires rapidly during initial stabilization (~300 ticks). Use `requestAnimationFrame` throttling or batch updates to avoid flooding React with re-renders. Once stabilized, the simulation cools and ticks stop.

**Why not let D3 manage DOM:** If D3 manipulates SVG elements directly, React's virtual DOM gets out of sync. This causes crashes, stale renders, and makes React DevTools useless. Keeping D3 headless avoids all of this.

**Confidence: HIGH** -- "D3 for math, React for DOM" is the established best practice, documented across multiple authoritative sources.

### Layered Canvas Compositing

When multiple rendering layers need to overlap (e.g., GridCanvas + HeatmapOverlay), use **stacked canvas elements** with CSS positioning:

```typescript
function SimulationViewport({ width, height, children }: Props) {
  return (
    <div style={{ position: 'relative', width, height }}>
      {/* Each canvas child is absolutely positioned, stacked via z-index */}
      {children}
    </div>
  );
}

// Usage:
<SimulationViewport width={800} height={600}>
  <GridCanvas zIndex={1} />      {/* Base layer: simulation grid */}
  <HeatmapOverlay zIndex={2} />  {/* Overlay: density heatmap */}
</SimulationViewport>
```

**Why not one canvas:** Separate canvases allow independent update rates. The grid redraws on tick; the heatmap may update less frequently. Compositing happens in the browser's compositor (free).

## Controls Layer: User Input

Controls are standard React components using Zustand's **hook API with selectors**. They render infrequently (on user interaction or playback state change), so React re-renders are fine.

### ParameterPanel: Schema-Driven Generation

```typescript
// User provides a schema; ParameterPanel auto-generates controls
const schema: ParameterSchema = {
  speed: { type: 'number', min: 0, max: 10, step: 0.1, default: 1 },
  population: { type: 'number', min: 10, max: 1000, step: 10, default: 100 },
  rule: { type: 'select', options: ['flocking', 'nbody'], default: 'flocking' },
  showTrails: { type: 'boolean', default: false },
};

// ParameterPanel iterates schema keys, renders appropriate input for each type
// Calls store.setParam(key, value) on change
```

### TimelineScrubber: History Navigation

Reads from the ring buffer's length and current position. On drag, calls `store.seek(tick)` which loads a historical snapshot.

## Data Layer: Derived Analytics

Data components use Zustand **selectors** to derive values from raw state. They render as React components (DOM/SVG).

### MiniChart with Recharts

Recharts `<LineChart>` wrapped minimally for sparkline use. Key pattern: maintain a **sliding window** of data points in a ref, append on each tick, and re-render the chart on a throttled schedule (not every tick).

```typescript
function MiniChart({ metric, windowSize = 100 }: Props) {
  const [data, setData] = useState<DataPoint[]>([]);

  useEffect(() => {
    const store = useSimulationStore.getState();
    // Subscribe to tick updates, throttle chart re-render
    const unsubscribe = useSimulationStore.subscribe(
      (state) => state.tick,
      throttle((tick) => {
        const value = computeMetric(metric, store.getState());
        setData(prev => [...prev.slice(-windowSize), { tick, value }]);
      }, 100) // Re-render chart at 10fps max, not 60
    );
    return unsubscribe;
  }, [metric, windowSize]);

  return (
    <LineChart width={200} height={40} data={data}>
      <Line type="monotone" dataKey="value" stroke="var(--sim-accent)" dot={false} />
    </LineChart>
  );
}
```

**Confidence: MEDIUM** -- Recharts handles this use case but is SVG-based; at very high data volumes (1000+ points visible), may need data decimation. For sparklines with ~100 points, performance is fine.

## Component Composition Pattern

### SimulationProvider as Root

All simulation components must be descendants of `SimulationProvider`. The provider creates the Zustand store and passes it via React context.

```tsx
<SimulationProvider tickFn={ecosystemTick} initialEntities={...} schema={...}>
  <div className="sim-layout">
    <SimulationViewport width={800} height={600}>
      <GridCanvas />
      <HeatmapOverlay />
    </SimulationViewport>

    <aside>
      <PlaybackBar />
      <ParameterPanel />
      <StatsPanel />
      <MiniChart metric="population" />
      <EventLog />
    </aside>
  </div>
</SimulationProvider>
```

### Compound Component Pattern

Components are designed to be **composed, not configured**. Instead of one monolithic `<Simulation>` component with 50 props, users compose the specific pieces they need. This enables:
- Tree-shaking of unused components
- Custom layouts without library constraints
- Mix-and-match across tiers ($29 core tier has fewer components)

### Hook-First API

Every component's logic is also available as a hook for advanced users:
- `useSimulation()` -- full store access
- `usePlayback()` -- playback state + actions
- `useParameters()` -- parameter values + setters
- `useHistory()` -- timeline/history access
- `useStats(metric)` -- derived metric value

## Build Architecture: Tree-Shakable Library with Vite

### Multiple Entry Points

Use Vite's library mode with **per-layer entry points** mapping to `package.json` subpath exports:

```
src/
  core/
    index.ts          --> exports SimulationProvider, useSimulation, types
  rendering/
    index.ts          --> exports CanvasRenderer, GridCanvas, ParticleRenderer, ForceGraph, HeatmapOverlay
  controls/
    index.ts          --> exports ParameterPanel, TimelineScrubber, PlaybackBar, PresetSelector
  data/
    index.ts          --> exports StatsPanel, MiniChart, EventLog, EntityInspector
  demos/
    index.ts          --> exports EcosystemDemo, ParticleDemo, SocialNetworkDemo
  index.ts            --> re-exports everything (convenience)
```

```json
// package.json exports
{
  "exports": {
    ".": { "types": "./dist/index.d.ts", "import": "./dist/index.js", "require": "./dist/index.cjs" },
    "./core": { "types": "./dist/core/index.d.ts", "import": "./dist/core/index.js" },
    "./rendering": { "types": "./dist/rendering/index.d.ts", "import": "./dist/rendering/index.js" },
    "./controls": { "types": "./dist/controls/index.d.ts", "import": "./dist/controls/index.js" },
    "./data": { "types": "./dist/data/index.d.ts", "import": "./dist/data/index.js" },
    "./demos": { "types": "./dist/demos/index.d.ts", "import": "./dist/demos/index.js" }
  },
  "sideEffects": false
}
```

### Vite Library Configuration

```typescript
// vite.config.ts (library build)
import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [react(), dts({ rollupTypes: true })],
  build: {
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'core/index': resolve(__dirname, 'src/core/index.ts'),
        'rendering/index': resolve(__dirname, 'src/rendering/index.ts'),
        'controls/index': resolve(__dirname, 'src/controls/index.ts'),
        'data/index': resolve(__dirname, 'src/data/index.ts'),
        'demos/index': resolve(__dirname, 'src/demos/index.ts'),
      },
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'zustand', 'recharts', 'd3-force', 'd3-scale'],
      output: {
        preserveModules: false, // explicit entry points are enough
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});
```

**Why multiple explicit entries (not preserveModules):** `preserveModules` emits one file per module, which creates deep import paths that leak internal structure. Explicit entry points give clean public API (`import { GridCanvas } from 'sim-kit/rendering'`) while letting Rollup optimize internals within each chunk.

**`sideEffects: false`** tells bundlers every module is safe to tree-shake. Critical for consumers who import only `core` + one rendering component.

**Confidence: HIGH** -- Vite library mode with multiple entries and subpath exports is the documented approach for tree-shakable component libraries.

### Tier Separation ($29 vs $49)

The entry point architecture directly supports tier separation:
- **$29 Core tier:** Ships `core/`, `rendering/`, `controls/`, `data/` (13 components)
- **$49 Full tier:** Ships everything including `demos/` (18 components)

Build script can produce two npm packs by including/excluding the `demos/` entry point and adjusting `package.json` exports.

## Theming Architecture

### CSS Custom Properties with Tailwind

Use `--sim-*` namespaced CSS custom properties as the theming API. Tailwind handles layout; custom properties handle colors/visual identity.

```css
/* Default dark theme (ships with library) */
:root, [data-theme="dark"] {
  --sim-bg: #0f0f0f;
  --sim-surface: #1a1a2e;
  --sim-border: #2a2a3e;
  --sim-text: #e0e0e0;
  --sim-text-muted: #888;
  --sim-accent: #4fc3f7;
  --sim-success: #66bb6a;
  --sim-warning: #ffa726;
  --sim-danger: #ef5350;
}
```

**Buyer customization:** Override `--sim-*` variables in their own CSS. No Tailwind config needed. Works with any framework.

**Tailwind in the library build:** Use Tailwind for internal layout utility classes. The build should inline only the classes actually used (Tailwind's purge handles this). Alternatively, ship a small CSS file that consumers include.

## Anti-Patterns to Avoid

### Anti-Pattern 1: React State for Per-Frame Data
**What:** Storing particle positions or grid cells in `useState` / triggering re-renders every frame.
**Why bad:** React's reconciler is optimized for UI updates (~10-20 per second), not 60fps animation. Causes frame drops and GC pressure from creating objects.
**Instead:** Store fast-changing state in Zustand (accessed via `getState()`), render to canvas/WebGL via refs. React never sees per-frame data.

### Anti-Pattern 2: D3 DOM Manipulation Inside React
**What:** Letting D3 call `selection.append()`, `.attr()`, `.style()` on elements React owns.
**Why bad:** React's virtual DOM and D3's direct DOM manipulation fight over the same elements. Causes stale renders, event handler loss, and crashes after React re-renders.
**Instead:** D3 computes layout data; React renders SVG elements from that data.

### Anti-Pattern 3: Single Monolithic Canvas
**What:** One canvas element for grid + heatmap + overlays + UI.
**Why bad:** Everything redraws every frame even if only one layer changed. No independent update rates.
**Instead:** Stacked canvas elements with CSS absolute positioning. Each layer owns its draw cycle.

### Anti-Pattern 4: Prop-Drilling Simulation State
**What:** Passing simulation state as props through component tree.
**Why bad:** Every intermediate component re-renders when state changes. Defeats the purpose of a state store.
**Instead:** Components subscribe directly to the Zustand store via hooks/selectors. No prop drilling.

### Anti-Pattern 5: Bundling Peer Dependencies
**What:** Including React, Zustand, D3, Recharts in the library bundle.
**Why bad:** Consumers get duplicate copies. Bundle size explodes. Version conflicts.
**Instead:** Mark as `external` in Vite config and `peerDependencies` in package.json.

## Scalability Considerations

| Concern | 1k entities | 100k entities | 500k+ entities |
|---------|------------|---------------|----------------|
| Tick computation | Inline JS, no concern | May need typed arrays | Consider Web Worker |
| Grid rendering | Full redraw fine | Dirty-rect required | Dirty-rect + viewport culling |
| Particle rendering | Canvas2D fine | WebGL2 instanced required | Transform feedback (deferred) |
| History storage | 1000 snapshots trivial | Snapshot every 10th tick | Structural sharing or patches |
| State updates | `setState()` fine | Typed arrays as state | Avoid object spread, mutate in place |

## Data Flow Summary

```
User tick function
       |
       v
[Zustand Store] ---getState()--> [Tick Loop (rAF)]
       |                                |
       |                         setState(newEntities)
       |                                |
       v                                v
  [subscribe()]                  [Store Updated]
       |                                |
       +----> Renderers (canvas/WebGL/SVG draw directly via refs)
       |
       +----> Data components (React re-render via selectors, throttled)
       |
  [Hook selectors]
       |
       +----> Controls (React re-render on user interaction)
                    |
                    +----> store.play() / store.setParam() / store.seek()
```

## Suggested Build Order (Dependencies)

Build order is constrained by component dependencies. Each phase should produce testable, usable output.

```
Phase 1: Core Layer
  SimulationProvider + useSimulation + tick loop + ring buffer
  (No visual output yet, but fully testable with unit tests)
  Dependencies: Zustand only

Phase 2: Canvas Rendering Foundation
  CanvasRenderer (pan/zoom host) + GridCanvas (dirty-rect)
  Dependencies: Core layer
  (First visual demo possible: grid simulation)

Phase 3: Controls
  PlaybackBar + ParameterPanel + PresetSelector
  Dependencies: Core layer
  (Users can now interact with simulations)

Phase 4: Advanced Rendering
  ParticleRenderer (WebGL2 + fallback) + ForceGraph (D3-force + SVG)
  Dependencies: Core layer + CanvasRenderer (for viewport)
  (Enables all three demo types)

Phase 5: Data Layer
  StatsPanel + MiniChart + EventLog + EntityInspector + HeatmapOverlay
  Dependencies: Core layer + Recharts
  (Analytics and monitoring)

Phase 6: Demos + Build
  Three demo simulations + Vite library build + Storybook
  Dependencies: All layers
  (Shipping artifact)
```

**Phase ordering rationale:**
- Core first because everything depends on the store and tick loop
- Canvas rendering before controls because you need visual feedback to verify controls work
- Controls before advanced rendering because PlaybackBar is needed to test any renderer
- Advanced rendering (WebGL2, D3-force) is isolated complexity -- can be built independently
- Data layer last because it only reads state (no other component depends on it)
- Demos and build are integration work requiring all components

## Sources

- [Zustand GitHub](https://github.com/pmndrs/zustand) -- vanilla store API, subscribe, getState
- [Zustand transient updates](https://awesomedevin.github.io/zustand-vue/en/docs/advanced/transiend-updates) -- subscribe without re-render
- [MDN Canvas Optimization](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) -- dirty-rect, layering
- [AG Grid Canvas Best Practices](https://blog.ag-grid.com/optimising-html5-canvas-rendering-best-practices-and-techniques/) -- dirty regions, offscreen canvas
- [GPU-Accelerated Particles with WebGL 2](https://gpfault.net/posts/webgl2-particles.txt.html) -- instanced rendering, transform feedback
- [WebGL2 Particles (pwambach)](https://github.com/pwambach/webgl2-particles) -- transform feedback implementation
- [D3 + React Integration (Alex Johnson)](https://gist.github.com/alexcjohnson/a4b714eee8afd2123ee00cb5b3278a5f) -- "D3 for math, React for DOM"
- [Force Graph with React and D3](https://dev.to/gilfink/creating-a-force-graph-using-react-and-d3-76c) -- tick event pattern
- [Vite Library Mode (receter)](https://dev.to/receter/how-to-create-a-react-component-library-using-vites-library-mode-4lma) -- multiple entries, tree-shaking
- [Tree-shakable library with Vite (morewings)](https://dev.to/morewings/how-to-build-a-tree-shakable-library-with-vite-and-rollup-16cb) -- preserveModules, sideEffects
- [Vite multiple entry points discussion](https://github.com/vitejs/vite/discussions/1736) -- subpath exports pattern
- [Zundo](https://github.com/charkour/zundo) -- evaluated, not recommended for simulation (designed for form undo/redo)
- [IBM Canvas Layering Tutorial](https://developer.ibm.com/tutorials/wa-canvashtml5layering/) -- stacked canvas pattern
- [Recharts Performance Guide](https://recharts.github.io/en-US/guide/performance/) -- optimization strategies
- [Tailwind CSS 4 @theme](https://medium.com/@sureshdotariya/tailwind-css-4-theme-the-future-of-design-tokens-at-2025-guide-48305a26af06) -- CSS custom property theming
