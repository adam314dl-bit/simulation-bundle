# sim-kit

18-component React library for building interactive simulation interfaces. From idea to interactive sim in minutes, not days.

## Features

- SimulationProvider with tick loop, playback controls, and history
- Canvas2D grid rendering with dirty-rect optimization (500x500 @ 30fps)
- WebGL2 particle rendering (100k particles @ 60fps) with trails
- D3-force graph visualization with interactive node manipulation
- Auto-generated parameter panels from schema
- Timeline scrubbing, preset selector, playback controls
- Live stats, sparkline charts, event logs, heatmaps, entity inspector
- Dark theme by default with CSS custom properties for full customization
- Three complete demo simulations included

## Quick Start

### 1. Install

```bash
npm install sim-kit react react-dom zustand recharts d3-force
```

### 2. Import the stylesheet

```typescript
import 'sim-kit/style.css';
```

### 3. Create a minimal simulation

```typescript
import { SimulationProvider, useSimulation } from 'sim-kit/core';
import { GridRenderer } from 'sim-kit/rendering';
import { PlaybackBar } from 'sim-kit/controls';

const tickFn = (entities: { grid: Uint8Array; width: number; height: number }) => {
  const next = new Uint8Array(entities.grid.length);
  // Your simulation logic here
  for (let i = 0; i < next.length; i++) next[i] = Math.random() > 0.5 ? 1 : 0;
  return { ...entities, grid: next };
};

const initial = { grid: new Uint8Array(100 * 100), width: 100, height: 100 };

export default function App() {
  return (
    <SimulationProvider tickFn={tickFn} initialEntities={initial}>
      <GridRenderer config={{ data: initial.grid, width: 100, height: 100, cellSize: 5 }} />
      <PlaybackBar />
    </SimulationProvider>
  );
}
```

### 4. Run

```bash
npm run dev
```

Open your browser and you should see a 100x100 random grid updating in real time with playback controls.

### 5. Try a full demo

To see a complete predator-prey simulation with parameter controls, stats, charts, and presets:

```typescript
import { EcosystemDemo } from 'sim-kit/demos';
// Render <EcosystemDemo /> for a complete predator-prey simulation
```

## Component Reference

sim-kit provides 18 components organized into five layers: Core, Rendering, Controls, Data, and Utilities.

### Core

#### SimulationProvider

The root component that creates a Zustand store, wires the tick loop, and provides simulation context to all child components.

```typescript
import { SimulationProvider } from 'sim-kit/core';
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| tickFn | `TickFn<TEntities>` | required | Tick function: receives entities + params, returns next entities |
| initialEntities | `TEntities` | `undefined` | Starting entity state |
| parameters | `ParameterSchema` | `undefined` | Parameter schema for auto-generated UI |
| maxHistoryLength | `number` | `1000` | Ring buffer capacity for history/timeline |
| keepRunning | `boolean` | `false` | Keep running when browser tab loses focus |
| children | `ReactNode` | required | Child components |

```typescript
<SimulationProvider
  tickFn={myTickFn}
  initialEntities={{ grid: new Uint8Array(100 * 100), width: 100, height: 100 }}
  parameters={mySchema}
  maxHistoryLength={500}
>
  {/* child components */}
</SimulationProvider>
```

#### useSimulation

A hook for consuming simulation state. Uses shallow equality by default to prevent unnecessary re-renders.

```typescript
import { useSimulation } from 'sim-kit/core';
```

Returns a selected slice of the simulation store. Available selectors:

| Selector | Type | Description |
|----------|------|-------------|
| `s.tick` | `number` | Current tick count |
| `s.entities` | `TEntities` | Current entity state |
| `s.running` | `boolean` | Whether simulation is playing |
| `s.speed` | `SpeedPreset` | Current speed multiplier (0.25, 0.5, 1, 2, 4, 8, 16) |
| `s.parameters` | `Record<string, ParameterValue>` | Current parameter values |
| `s.events` | `SimEvent[]` | Logged simulation events |
| `s.history` | `RingBuffer<TEntities>` | History ring buffer |
| `s.play` | `() => void` | Start simulation |
| `s.pause` | `() => void` | Pause simulation |
| `s.toggle` | `() => void` | Toggle play/pause |
| `s.step` | `() => void` | Advance one tick |
| `s.stepBack` | `() => void` | Go back one tick |
| `s.setSpeed` | `(speed: SpeedPreset) => void` | Set playback speed |
| `s.setParameter` | `(key: string, value: ParameterValue) => void` | Set a parameter value |
| `s.resetParameters` | `() => void` | Reset all parameters to defaults |
| `s.seekToTick` | `(tick: number) => void` | Seek to a specific tick in history |
| `s.logEvent` | `(event: Omit<SimEvent, 'id' \| 'timestamp'>) => void` | Log a simulation event |

```typescript
// Subscribe to a single value (minimal re-renders)
const tick = useSimulation(s => s.tick);

// Subscribe to multiple values
const { play, pause } = useSimulation(s => ({ play: s.play, pause: s.pause }));
```

Convenience hooks are also available:

```typescript
import { useIsRunning, useTick, useSpeed, usePlayback, useParameters, useEvents } from 'sim-kit/core';

const running = useIsRunning();
const tick = useTick();
const speed = useSpeed();
const playback = usePlayback(); // { running, tick, speed, historySize, play, pause, toggle, step, stepBack, setSpeed, seekToTick }
const params = useParameters();
const events = useEvents();
```

### Rendering

#### SimCanvas

Foundation canvas component with pan/zoom/touch support. Provides a `<canvas>` with DPR-aware sizing, cursor-centered scroll zoom, click-drag pan with momentum, and touch pinch-zoom.

```typescript
import { SimCanvas } from 'sim-kit/rendering';
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| width | `number` | `800` | CSS pixel width |
| height | `number` | `600` | CSS pixel height |
| onDraw | `(ctx: CanvasRenderingContext2D, viewport: ViewportState) => void` | required | Draw callback invoked each animation frame |
| className | `string` | `undefined` | Additional CSS class |

```typescript
import { SimCanvas } from 'sim-kit/rendering';

function MyCanvas() {
  const draw = (ctx: CanvasRenderingContext2D) => {
    ctx.fillStyle = '#6366f1';
    ctx.fillRect(10, 10, 50, 50);
  };
  return <SimCanvas width={400} height={300} onDraw={draw} />;
}
```

#### GridRenderer

Renders a 2D grid of color-mapped cells. Uses a two-tier rendering strategy: full repaint via ImageData for initial paint and zoom changes, and dirty-rect updates via fillRect for incremental cell changes.

```typescript
import { GridRenderer } from 'sim-kit/rendering';
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| config | `GridConfig` | required | Grid configuration object (see below) |
| onCellClick | `(event: CellEvent) => void` | `undefined` | Cell click callback |
| onCellHover | `(event: CellEvent \| null) => void` | `undefined` | Cell hover callback |
| highlightCell | `{ col: number; row: number } \| null` | `undefined` | Cell to highlight with accent border |

**GridConfig:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| width | `number` | required | Grid columns |
| height | `number` | required | Grid rows |
| data | `ArrayLike<number>` | required | Flat array of cell values (0-1) |
| cellSize | `number` | `8` | Cell size in pixels |
| borderWidth | `number` | `0` | Cell border width |
| colorRamp | `string` | `'viridis'` | Color ramp name |

```typescript
import { GridRenderer } from 'sim-kit/rendering';

const config = {
  width: 100,
  height: 100,
  data: new Uint8Array(100 * 100),
  cellSize: 5,
  colorRamp: 'viridis',
};

<GridRenderer config={config} onCellClick={(e) => console.log(e.col, e.row)} />
```

#### LayerStack

Compositing container for stacking multiple rendering layers with an optional SVG annotation overlay for drag selection (rect or lasso).

```typescript
import { LayerStack } from 'sim-kit/rendering';
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| children | `ReactNode` | required | Stacked child layers (first = bottom) |
| selectionMode | `'rect' \| 'lasso' \| 'none'` | `'none'` | Selection interaction mode |
| onSelect | `(selection: Selection) => void` | `undefined` | Callback when selection completes |
| className | `string` | `undefined` | Additional CSS class |

```typescript
import { LayerStack, GridRenderer } from 'sim-kit/rendering';

<LayerStack selectionMode="rect" onSelect={(sel) => console.log(sel)}>
  <GridRenderer config={gridConfig} />
</LayerStack>
```

#### ParticleRenderer

WebGL2 particle renderer with automatic Canvas2D fallback. Supports color ramps, point sizing, trail effects with configurable fade, and additive/normal blending.

```typescript
import { ParticleRenderer } from 'sim-kit/rendering';
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| data | `Float32Array` | required | Interleaved particle data: [x, y, vx, vy] per particle (stride 4) |
| count | `number` | required | Number of active particles |
| width | `number` | `undefined` | CSS pixel width |
| height | `number` | `undefined` | CSS pixel height |
| colorRamp | `string` | `undefined` | Color ramp name from built-in ramps |
| colorMap | `'velocity' \| ((particle) => number)` | `undefined` | Color mapping mode or custom function returning 0-1 |
| pointSize | `number` | `4` | Point size in pixels (clamped to GPU max) |
| trails | `boolean` | `false` | Enable trail effect |
| trailAlpha | `number` | `0.05` | Trail fade alpha (0.02-0.15) |
| blendMode | `'additive' \| 'normal'` | `'additive'` | Blending mode for trails |
| renderer | `'auto' \| 'webgl2' \| 'canvas2d'` | `'auto'` | Renderer selection |
| onFallback | `(reason: string) => void` | `undefined` | Called when WebGL2 unavailable and Canvas2D fallback activates |
| className | `string` | `undefined` | Additional CSS class |

```typescript
import { ParticleRenderer } from 'sim-kit/rendering';

const particles = new Float32Array(1000 * 4); // 1000 particles, stride 4
<ParticleRenderer data={particles} count={1000} trails colorRamp="plasma" />
```

#### ForceGraph

D3-force powered graph visualization. Renders in SVG for small graphs and automatically switches to Canvas2D for large graphs. Supports interactive node dragging, hover tooltips, and configurable force parameters.

```typescript
import { ForceGraph } from 'sim-kit/rendering';
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| nodes | `GraphNode[]` | required | Array of graph nodes |
| links | `GraphLink[]` | required | Array of graph links |
| width | `number` | `undefined` | Container width |
| height | `number` | `undefined` | Container height |
| nodeRadius | `number \| ((node: GraphNode) => number)` | `8` | Node radius in px or function |
| nodeColor | `(node: GraphNode) => string` | category10 by group | Node fill color function |
| nodeLabel | `(node: GraphNode) => string` | `undefined` | Node label function |
| labelSize | `number` | `10` | Label font size |
| linkWidth | `number \| ((link: GraphLink) => number)` | `1` | Link width in px or function |
| linkColor | `string \| ((link: GraphLink) => string)` | `--sim-border` | Link stroke color |
| linkOpacity | `number` | `0.4` | Link opacity |
| linkCurvature | `number` | `0` | Link curvature (0 = straight) |
| charge | `number` | `-30` | Charge force strength |
| linkDistance | `number` | `30` | Link distance |
| centerStrength | `number` | `1` | Center force strength |
| collisionRadius | `number` | `0` | Collision radius (0 = disabled) |
| alphaDecay | `number` | `0.0228` | Alpha decay rate |
| alphaMin | `number` | `0.001` | Alpha threshold for auto-pause |
| canvasThreshold | `number` | `500` | Node count threshold for Canvas2D mode |
| onStabilize | `() => void` | `undefined` | Called when simulation stabilizes |
| onNodeHover | `(node: GraphNode \| null) => void` | `undefined` | Node hover callback |
| onNodeClick | `(node: GraphNode) => void` | `undefined` | Node click callback |
| tooltipContent | `(node: GraphNode) => ReactNode` | `undefined` | Custom tooltip content |
| className | `string` | `undefined` | Additional CSS class |

```typescript
import { ForceGraph } from 'sim-kit/rendering';

const nodes = [{ id: 'a', group: 0 }, { id: 'b', group: 1 }];
const links = [{ source: 'a', target: 'b' }];

<ForceGraph nodes={nodes} links={links} charge={-50} linkDistance={80} />
```

#### ColorRamps

Utility for mapping numeric values (0-1) to colors. Provides 6 built-in ramps and APIs for creating custom ramps.

```typescript
import { colorRamps, getRampLUT, createColorRamp } from 'sim-kit/rendering';
```

**Built-in ramps:** `viridis`, `inferno`, `plasma`, `coolwarm`, `terrain`, `category10`

| Function | Signature | Description |
|----------|-----------|-------------|
| `colorRamps.viridis` | `(t: number) => string` | Returns CSS rgb string for value t in [0, 1] |
| `colorRamps.inferno` | `(t: number) => string` | Returns CSS rgb string for value t in [0, 1] |
| `colorRamps.plasma` | `(t: number) => string` | Returns CSS rgb string for value t in [0, 1] |
| `colorRamps.coolwarm` | `(t: number) => string` | Returns CSS rgb string for value t in [0, 1] |
| `colorRamps.terrain` | `(t: number) => string` | Returns CSS rgb string for value t in [0, 1] |
| `colorRamps.category10` | `(t: number) => string` | Returns CSS rgb string for value t in [0, 1] |
| `getRampLUT` | `(name: string) => Uint8Array` | Returns the raw 256x4 RGBA lookup table |
| `createColorRamp` | `(name: string, stops: ColorStop[]) => ColorRampFn` | Creates and registers a custom color ramp |

```typescript
// Use a built-in ramp
const color = colorRamps.viridis(0.5); // "rgb(33,145,140)"

// Get raw LUT for GPU upload
const lut = getRampLUT('plasma'); // Uint8Array(1024)

// Create a custom ramp
const myRamp = createColorRamp('myRamp', [
  { position: 0, color: [0, 0, 0] },
  { position: 0.5, color: [255, 0, 0] },
  { position: 1, color: [255, 255, 255] },
]);
```

### Controls

#### ParameterPanel

Auto-generates a form panel from a ParameterSchema. Supports range sliders, toggles, select dropdowns, color pickers, vec2 controls, and collapsible groups. Auto-detects column layout via ResizeObserver at 320px breakpoint.

```typescript
import { ParameterPanel } from 'sim-kit/controls';
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| schema | `ParameterSchema` | required | Parameter definitions for auto-generation |
| columns | `1 \| 2` | auto | Force column count (auto-detects at 320px) |
| compact | `boolean` | `undefined` | Compact layout mode |
| className | `string` | `undefined` | Additional CSS class |

```typescript
import { ParameterPanel } from 'sim-kit/controls';
import type { ParameterSchema } from 'sim-kit/core';

const schema: ParameterSchema = {
  speed: { type: 'range', min: 0, max: 10, step: 0.1, default: 1, label: 'Speed' },
  wrap: { type: 'toggle', default: true, label: 'Wrap Edges' },
  mode: { type: 'select', options: ['normal', 'chaos'], default: 'normal', label: 'Mode' },
};

<ParameterPanel schema={schema} columns={2} />
```

#### TimelineControl

Full-featured timeline with scrub bar, play/pause, step forward/back, speed control, FPS counter, and event markers. Supports keyboard shortcuts (Space, Arrow keys, +/-).

```typescript
import { TimelineControl } from 'sim-kit/controls';
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| enableShortcuts | `boolean` | `true` | Enable keyboard shortcuts |
| className | `string` | `undefined` | Additional CSS class |

```typescript
import { TimelineControl } from 'sim-kit/controls';

<TimelineControl enableShortcuts />
```

#### PlaybackBar

Compact playback control bar with play/pause toggle, speed control, and tick counter. A lightweight alternative to TimelineControl when scrubbing and event markers are not needed.

```typescript
import { PlaybackBar } from 'sim-kit/controls';
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| className | `string` | `undefined` | Additional CSS class |

```typescript
import { PlaybackBar } from 'sim-kit/controls';

<PlaybackBar />
```

#### PresetSelector

Applies parameter presets to the simulation. Supports three layout variants: pills (default), dropdown, and cards.

```typescript
import { PresetSelector } from 'sim-kit/controls';
import type { Preset } from 'sim-kit/controls';
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| presets | `Preset[]` | required | Array of preset configurations |
| variant | `'pills' \| 'dropdown' \| 'cards'` | `'pills'` | Layout variant |
| className | `string` | `undefined` | Additional CSS class |

**Preset type:**

| Prop | Type | Description |
|------|------|-------------|
| name | `string` | Display name |
| config | `Record<string, ParameterValue>` | Parameter values to apply |
| description | `string` | Optional description (shown in cards variant) |

```typescript
import { PresetSelector } from 'sim-kit/controls';

const presets = [
  { name: 'Default', config: { speed: 1, gravity: 9.8 } },
  { name: 'Low Gravity', config: { speed: 1, gravity: 1.6 }, description: 'Moon-like' },
];

<PresetSelector presets={presets} variant="cards" />
```

### Data

#### StatsPanel

Displays a grid of labeled statistics with optional change indicators and inline SVG sparklines.

```typescript
import { StatsPanel } from 'sim-kit/data';
import type { StatConfig } from 'sim-kit/data';
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| stats | `StatConfig[]` | required | Array of stat configurations |
| columns | `1 \| 2` | `2` | Number of display columns |
| showChange | `boolean` | `true` | Show up/down change arrows |
| changeThreshold | `number` | `0` | Percentage change threshold for arrows |
| className | `string` | `undefined` | Additional CSS class |

**StatConfig:**

| Prop | Type | Description |
|------|------|-------------|
| label | `string` | Stat label |
| value | `number` | Current value |
| format | `Intl.NumberFormatOptions` | Number formatting options |
| sparkline | `number[]` | Historical values for inline sparkline |
| unit | `string` | Optional suffix (e.g. "%", "fps") |

```typescript
import { StatsPanel } from 'sim-kit/data';

<StatsPanel
  stats={[
    { label: 'Population', value: 1234, unit: 'agents', sparkline: [1100, 1150, 1200, 1234] },
    { label: 'Growth', value: 0.034, format: { style: 'percent' } },
  ]}
  columns={2}
/>
```

#### MiniChart

Real-time line chart powered by Recharts. Subscribes to the simulation store via a selector and buffers values over a configurable time window. Uses rAF gating to avoid degrading the tick loop.

```typescript
import { MiniChart } from 'sim-kit/data';
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| selector | `(state: Record<string, unknown>) => number` | required | Zustand selector returning the numeric value to chart |
| windowSize | `number` | `60` | Number of data points to display |
| width | `number` | `200` | Chart width in px |
| height | `number` | `80` | Chart height in px |
| color | `string` | `var(--sim-accent)` | Line/fill color |
| showLastValue | `boolean` | `true` | Show last value overlay |
| label | `string` | `undefined` | Label text above chart |
| className | `string` | `undefined` | Additional CSS class |

```typescript
import { MiniChart } from 'sim-kit/data';

<MiniChart
  selector={(s) => (s.entities as { stats: { population: number } }).stats.population}
  label="Population"
  windowSize={120}
  color="#22c55e"
/>
```

#### EventLog

Virtualized scrollable event log with severity filtering, auto-scroll, and click handling. Uses manual virtualization with translateY positioning for efficient rendering of large event lists.

```typescript
import { EventLog } from 'sim-kit/data';
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| maxHeight | `number` | `300` | Maximum visible height in px |
| severityFilter | `Array<'info' \| 'warning' \| 'critical'>` | all shown | Filter by severity types |
| autoScroll | `boolean` | `true` | Auto-scroll to newest events |
| rowHeight | `number` | `32` | Row height in px for virtualization |
| onEventClick | `(event: SimEvent) => void` | `undefined` | Event row click callback |
| className | `string` | `undefined` | Additional CSS class |

```typescript
import { EventLog } from 'sim-kit/data';

<EventLog maxHeight={200} severityFilter={['warning', 'critical']} />
```

#### HeatmapOverlay

Canvas-based heatmap visualization for 2D scalar fields. Supports bilinear interpolation, configurable color ramps, opacity control, and an optional color legend.

```typescript
import { HeatmapOverlay } from 'sim-kit/data';
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| data | `Float64Array` | required | 2D scalar field as flat Float64Array (row-major) |
| gridWidth | `number` | required | Grid width (columns) |
| gridHeight | `number` | required | Grid height (rows) |
| colorRamp | `string` | `'viridis'` | Color ramp name from built-in ramps |
| opacity | `number` | `0.7` | Overall opacity (0-1) |
| interpolate | `boolean` | `true` | Enable bilinear interpolation |
| showLegend | `boolean` | `true` | Show color legend bar |
| range | `[number, number]` | `[0, 1]` | Value range [min, max] for normalization |
| className | `string` | `undefined` | Additional CSS class |

```typescript
import { HeatmapOverlay } from 'sim-kit/data';

const field = new Float64Array(50 * 50);
<HeatmapOverlay data={field} gridWidth={50} gridHeight={50} colorRamp="coolwarm" />
```

#### EntityInspector

Detail panel for inspecting a single entity's properties. Supports multiple positioning modes and optional inline sparkline charts for numeric properties.

```typescript
import { EntityInspector } from 'sim-kit/data';
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| entity | `Record<string, unknown>` | required | Entity object to inspect |
| title | `string` | `undefined` | Entity display name/title |
| position | `'right' \| 'bottom' \| 'floating'` | `'right'` | Panel position |
| onTrack | `(tracked: boolean) => void` | `undefined` | Track toggle callback |
| tracked | `boolean` | `false` | Whether entity is being tracked |
| chartKeys | `string[]` | `undefined` | Numeric property keys that should show inline charts |
| chartData | `Record<string, number[]>` | `undefined` | Historical data for chartKeys |
| className | `string` | `undefined` | Additional CSS class |

```typescript
import { EntityInspector } from 'sim-kit/data';

<EntityInspector
  entity={{ id: 'agent-42', health: 85, position: [10, 20] }}
  title="Agent 42"
  position="right"
  chartKeys={['health']}
  chartData={{ health: [90, 88, 85] }}
/>
```

### Utilities

#### RingBuffer

Pre-allocated ring buffer with O(1) push and random access. Used internally for simulation history storage, but available for any fixed-size circular data needs.

```typescript
import { RingBuffer } from 'sim-kit/core';
```

| Method/Property | Type | Description |
|-----------------|------|-------------|
| `constructor` | `(capacity: number)` | Create buffer with fixed capacity |
| `push` | `(item: T) => void` | Add item, overwriting oldest when full |
| `get` | `(index: number) => T \| undefined` | Random access (0 = oldest) |
| `latest` | `T \| undefined` | Most recently pushed item |
| `size` | `number` | Current number of valid entries |
| `capacity` | `number` | Maximum capacity |
| `isFull` | `boolean` | True when size equals capacity |
| `clear` | `() => void` | Reset to empty (keeps allocation) |

```typescript
import { RingBuffer } from 'sim-kit/core';

const buf = new RingBuffer<number>(100);
buf.push(42);
buf.push(43);
console.log(buf.size);   // 2
console.log(buf.get(0)); // 42
console.log(buf.latest); // 43
```

## Creating Your Own Simulation

Follow these steps to build a custom simulation from scratch using sim-kit.

### 1. Define your state type

Define a TypeScript interface for your simulation entities. This is the data that your tick function will read and produce.

```typescript
interface MyEntities {
  grid: Uint8Array;        // Cell values
  width: number;
  height: number;
  stats: { population: number; generation: number };
}
```

### 2. Write your tick function

A `TickFn` receives the current entities and parameter values, and returns the **next** entities. Always return new objects -- never mutate the input.

```typescript
import type { TickFn, ParameterValue } from 'sim-kit/core';

const tickFn: TickFn<MyEntities> = (entities, params) => {
  const { grid, width, height } = entities;
  const next = new Uint8Array(grid.length); // Always allocate new
  const rate = params.growthRate as number;

  let population = 0;
  for (let i = 0; i < grid.length; i++) {
    // Your simulation logic here
    next[i] = Math.random() < rate ? 1 : grid[i];
    if (next[i] > 0) population++;
  }

  return {
    grid: next,
    width,
    height,
    stats: { population, generation: entities.stats.generation + 1 },
  };
};
```

### 3. Define your parameter schema

A `ParameterSchema` describes the controls that ParameterPanel auto-generates. Supported types: `range`, `toggle`, `select`, `color`, `vec2`, and `group`.

```typescript
import type { ParameterSchema } from 'sim-kit/core';

const schema: ParameterSchema = {
  growthRate: { type: 'range', min: 0, max: 1, step: 0.01, default: 0.05, label: 'Growth Rate' },
  wrapEdges: { type: 'toggle', default: true, label: 'Wrap Edges' },
  colorScheme: { type: 'select', options: ['viridis', 'inferno', 'plasma'], default: 'viridis', label: 'Colors' },
};
```

### 4. Choose your renderer

| Data Shape | Renderer | When to Use |
|-----------|----------|-------------|
| 2D grid (`Uint8Array`) | GridRenderer | Cellular automata, game of life, heatmaps |
| Particle positions (`Float32Array`) | ParticleRenderer | Physics sims, flocking, particle systems |
| Graph (nodes + links) | ForceGraph | Networks, social sims, dependency graphs |
| Custom drawing | SimCanvas + onDraw | Anything else |

### 5. Wire it up

Compose `SimulationProvider` with your chosen renderer, a `ParameterPanel`, and playback controls:

```typescript
import { SimulationProvider } from 'sim-kit/core';
import { GridRenderer } from 'sim-kit/rendering';
import { ParameterPanel, PlaybackBar } from 'sim-kit/controls';
import { StatsPanel } from 'sim-kit/data';

const initial: MyEntities = {
  grid: new Uint8Array(100 * 100),
  width: 100,
  height: 100,
  stats: { population: 0, generation: 0 },
};

export function MySim() {
  return (
    <SimulationProvider tickFn={tickFn} initialEntities={initial} parameters={schema}>
      <div style={{ display: 'flex', gap: 16 }}>
        <GridRenderer config={{ data: initial.grid, width: 100, height: 100, cellSize: 5 }} />
        <ParameterPanel schema={schema} />
      </div>
      <PlaybackBar />
      <StatsPanel stats={[{ label: 'Population', value: 0 }]} />
    </SimulationProvider>
  );
}
```

### 6. Add presets

Define preset parameter configurations and render a `PresetSelector`:

```typescript
import { PresetSelector } from 'sim-kit/controls';
import type { Preset } from 'sim-kit/controls';

const presets: Preset[] = [
  { name: 'Slow Growth', config: { growthRate: 0.02, wrapEdges: true } },
  { name: 'Fast Growth', config: { growthRate: 0.15, wrapEdges: true } },
  { name: 'No Wrap', config: { growthRate: 0.05, wrapEdges: false } },
];

<PresetSelector presets={presets} variant="pills" />
```

### Complete example

Here is a full working simulation in ~30 lines:

```typescript
import 'sim-kit/style.css';
import { SimulationProvider } from 'sim-kit/core';
import type { TickFn, ParameterSchema } from 'sim-kit/core';
import { GridRenderer } from 'sim-kit/rendering';
import { ParameterPanel, PlaybackBar } from 'sim-kit/controls';

interface Entities { grid: Uint8Array; width: number; height: number }

const schema: ParameterSchema = {
  density: { type: 'range', min: 0, max: 1, step: 0.01, default: 0.5, label: 'Density' },
};

const tickFn: TickFn<Entities> = (e, params) => {
  const next = new Uint8Array(e.grid.length);
  const d = params.density as number;
  for (let i = 0; i < next.length; i++) next[i] = Math.random() < d ? 1 : 0;
  return { ...e, grid: next };
};

const init: Entities = { grid: new Uint8Array(80 * 80), width: 80, height: 80 };

export default function App() {
  return (
    <SimulationProvider tickFn={tickFn} initialEntities={init} parameters={schema}>
      <GridRenderer config={{ data: init.grid, width: 80, height: 80, cellSize: 6, colorRamp: 'inferno' }} />
      <ParameterPanel schema={schema} />
      <PlaybackBar />
    </SimulationProvider>
  );
}
```

## Theming

sim-kit uses CSS custom properties for all visual styling. Override them once to re-theme the entire kit.

### CSS Variables

All components reference these `--sim-*` variables:

| Variable | Default | What It Controls |
|----------|---------|------------------|
| `--sim-bg` | `#0a0a0f` | Page/container background |
| `--sim-surface` | `#141420` | Panel and card backgrounds |
| `--sim-surface-raised` | `#1e1e2e` | Elevated surface (buttons, dropdowns) |
| `--sim-border` | `#2a2a3a` | Borders and dividers |
| `--sim-text` | `#e8e8ed` | Primary text color |
| `--sim-text-muted` | `#8888a0` | Secondary/label text color |
| `--sim-accent` | `#6366f1` | Primary accent (buttons, highlights, charts) |
| `--sim-danger` | `#ef4444` | Error/danger state |
| `--sim-warning` | `#f59e0b` | Warning state |
| `--sim-success` | `#22c55e` | Success state |
| `--sim-info` | `#60a5fa` | Info state |
| `--sim-critical` | `#f87171` | Critical event severity |
| `--sim-font-family` | `system-ui, -apple-system, sans-serif` | Body font |
| `--sim-font-mono` | `'JetBrains Mono', 'Fira Code', ui-monospace, monospace` | Monospace font |
| `--sim-radius-sm` | `4px` | Small border radius |
| `--sim-radius-md` | `8px` | Medium border radius |
| `--sim-spacing` | `4px` | Base spacing unit |

### Override example

Switch to a light theme by overriding the color variables:

```css
:root {
  --sim-bg: #ffffff;
  --sim-surface: #f8f9fa;
  --sim-surface-raised: #e9ecef;
  --sim-border: #dee2e6;
  --sim-text: #111827;
  --sim-text-muted: #6b7280;
  --sim-accent: #2563eb;
}
```

### Scoped theming

Apply a different theme to a specific section by scoping variables to a container:

```css
.my-sim-container {
  --sim-accent: #10b981;
  --sim-bg: #0f172a;
}
```

### Tailwind compatibility

Layout uses Tailwind utility classes. Colors use CSS custom properties. You can use both. The `sim-kit/style.css` import includes Tailwind preflight and the `--sim-*` variable definitions.

## Performance

Practical guidelines for getting the best performance from sim-kit.

### Grid rendering

- **Up to 500x500 cells at 30fps** with dirty-rect optimization. GridRenderer automatically detects which cells changed between ticks and only repaints those.
- Above 250,000 cells, consider OffscreenCanvas (planned for v2).
- Set `cellSize` to at least 2px. Smaller values produce a grid larger than the viewport without zoom.
- GridRenderer's dirty-rect tracking automatically triggers a full repaint when more than 30% of cells change in a single tick.

### Particle rendering

- **Up to 100k particles at 60fps** via WebGL2 instanced rendering.
- Falls back to Canvas2D automatically when WebGL2 is unavailable (capped at ~10k particles for Canvas2D).
- Use `Float32Array` with stride 4 (`[x, y, vx, vy]` per particle). Pre-allocate at your maximum particle count to avoid GC pressure.
- Trail effects use a fullscreen fade overlay. Set `trailAlpha` between 0.02 (long trails) and 0.15 (short trails).

### Force graphs

- **SVG mode for fewer than 500 nodes**, Canvas2D mode for 500+ nodes. ForceGraph switches automatically based on `canvasThreshold`.
- Set `canvasThreshold` to match your expected node count for best performance.
- Use `alphaDecay` to control how quickly the layout stabilizes. Higher values settle faster but may produce less optimal layouts.

### Tick function performance

- **Keep your tick function under 2ms.** The rAF loop runs at 60fps, leaving ~16ms per frame. The tick function shares this budget with rendering.
- Avoid allocating large arrays every tick. Pre-allocate buffers and swap them (double-buffer pattern).
- Return new top-level objects but reuse unchanged sub-objects:

```typescript
// Good: new top-level, reuse unchanged sub-objects
return { ...entities, grid: newGrid };

// Bad: deep clone everything
return JSON.parse(JSON.stringify(entities));
```

### React re-renders

- Use **granular selectors** with `useSimulation`:

```typescript
// Good: subscribe to one value
const tick = useSimulation(s => s.tick);

// Bad: subscribe to entire store (re-renders on every tick)
const everything = useSimulation(s => s);
```

- Use `useShallow` for object selectors (already built into `useSimulation`).
- For data components, prefer `useTick()`, `useIsRunning()`, `useSpeed()` convenience hooks over manual selectors when subscribing to a single value.

### rAF loop architecture

- The tick loop runs in Zustand's vanilla API **outside React**. Components subscribe to specific store slices and only re-render when their selected values change.
- MiniChart uses an rAF gate to batch updates and avoid degrading the tick loop.
- Avoid subscribing to `entities` directly in React components. Instead, derive the values you need in the selector:

```typescript
// Good: derive in selector
const population = useSimulation(s => (s.entities as MyState).stats.population);

// Bad: subscribe to entire entities, derive in render
const entities = useSimulation(s => s.entities);
const population = (entities as MyState).stats.population; // re-renders on every tick
```

## License

MIT
