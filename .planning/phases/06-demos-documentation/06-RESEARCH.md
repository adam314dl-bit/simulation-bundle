# Phase 6: Demos + Documentation - Research

**Researched:** 2026-03-19
**Domain:** Demo simulations, Storybook component documentation, README authoring
**Confidence:** HIGH

## Summary

Phase 6 is a pure integration and documentation phase -- no new components are created. It exercises all 18 existing components across three demo simulations (ecosystem, particles, social network), writes Storybook stories for each component, and produces comprehensive README documentation. The core technical challenge is simulation logic (Lotka-Volterra, N-body/Boids, bounded confidence opinion dynamics), not UI framework work.

The demos follow a consistent pattern: a `tickFn` that implements domain math, a `presets.ts` file with parameter configurations, and a layout component that composes existing sim-kit components. Storybook stories wrap components in a lightweight mock SimulationProvider. The README is structured markdown with inline TypeScript code examples.

**Primary recommendation:** Structure work as three demo waves (one per simulation), then a Storybook stories wave, then a documentation wave. Each demo is self-contained and testable independently.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Single-page layout per demo: renderer (left/center), controls sidebar (right), data panels (bottom) -- standard simulation dashboard pattern
- Demo file organization: `src/demos/{name}/` with index.tsx (main component), simulation.ts (tick logic), presets.ts (parameter presets)
- Minimal shared layout component for consistent panel arrangement across demos -- keeps demos self-contained while looking cohesive
- Vite dev server with route-based demo selection (/, /particles, /network) for development
- Stories grouped by layer: Core/, Rendering/, Controls/, Data/ -- mirrors src/ directory structure
- Interactive controls via Storybook argTypes with sensible defaults -- auto-discovers props from TypeScript types
- Lightweight mock SimulationProvider wrapper with canned tick data for stories that need simulation context
- Skip visual regression tests for v1 -- manual visual verification sufficient
- README structure: Quick Start -> Component Reference -> Create Your Own Sim -> Theming -> Performance -- matches DOCS-01 through DOCS-05 requirement order
- Code examples as inline TypeScript snippets with minimal imports -- copy-paste friendly for buyers
- Component reference: props table + single usage example + brief description per component -- concise, not exhaustive
- Performance guide: practical guidelines (grid size limits, particle count recommendations, rAF tips) -- not synthetic benchmarks

### Claude's Discretion
- Exact simulation parameters and formulas for each demo (Lotka-Volterra coefficients, N-body constants, opinion dynamics thresholds)
- Preset tuning -- specific parameter values for each of the 4 presets per demo
- Storybook decorator patterns and mock data specifics
- README prose style and section lengths

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DEMO-01 | Ecosystem demo: Lotka-Volterra predator-prey on 2D grid with 8 params, using SimulationProvider, GridRenderer, ParameterPanel, TimelineControl, StatsPanel, MiniChart x3, EventLog, PresetSelector | Lotka-Volterra simulation patterns, grid entity design, component composition layout |
| DEMO-02 | Ecosystem 4 presets: Stable coexistence, Fox extinction, Overpopulation crash, Chaos | Parameter tuning guidance for each regime |
| DEMO-03 | Particles demo: N-body + Boids flocking with click-to-place attractors, using SimulationProvider, ParticleRenderer, ParameterPanel, PlaybackBar, StatsPanel | N-body/Boids math, Float32Array particle data layout, attractor interaction |
| DEMO-04 | Particles 4 presets: Galaxy spiral, Boids flocking, Orbit chaos, Fireworks -- Galaxy spiral with trails is marketing hero | Preset parameter ranges, trail config for visual impact |
| DEMO-05 | Social network demo: bounded confidence opinion dynamics on scale-free graph, using SimulationProvider, ForceGraph, ParameterPanel, TimelineControl, EventLog, EntityInspector, MiniChart | Deffuant model, Barabasi-Albert graph generation, opinion dynamics math |
| DEMO-06 | Social network 4 presets: Echo chambers, Consensus, Polarization, Media influence | Confidence threshold tuning per regime |
| DOCS-01 | README quick start: npm install to ecosystem demo in <5 min, 10-line minimal example | Dev server setup, minimal SimulationProvider example |
| DOCS-02 | Component reference: props table + usage example + screenshot per component | All 18 component prop interfaces (already documented in types) |
| DOCS-03 | "Creating Your Own Simulation" guide: state types, onTick, ParameterSchema, renderer selection | SimConfig/TickFn/ParameterSchema API patterns |
| DOCS-04 | Theming guide: all --sim-* CSS variables and Tailwind customization | Theme CSS variable catalog (already in src/theme/index.css) |
| DOCS-05 | Performance guide: grid size limits, particle counts, rAF tips | Accumulated performance decisions from Phases 2-5 |
| DOCS-06 | Storybook stories for all 18 components with interactive prop playgrounds | Storybook 10 argTypes patterns, mock provider decorator |
</phase_requirements>

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^19.2.0 | Component framework | Project foundation |
| Storybook | ^10.3.0 | Interactive component docs | Already configured (INFRA-06) |
| Vitest | ^4.1.0 | Test runner | Project standard |
| Vite | 7.x | Dev server + build | Project foundation |

### No New Dependencies Required
Phase 6 uses only existing project dependencies. The simulation math (Lotka-Volterra, N-body, Boids, opinion dynamics) is hand-written in TypeScript -- no simulation libraries needed. Graph generation (Barabasi-Albert) is a simple algorithm (~20 lines) that does not need a library.

## Architecture Patterns

### Demo File Organization (Locked Decision)
```
src/demos/
  shared/
    DemoLayout.tsx        # Shared layout: renderer + sidebar + bottom panels
  ecosystem/
    index.tsx             # Main component composing sim-kit components
    simulation.ts         # Lotka-Volterra tickFn + entity types
    presets.ts            # 4 preset parameter configs
  particles/
    index.tsx
    simulation.ts         # N-body + Boids tickFn
    presets.ts
  network/
    index.tsx
    simulation.ts         # Opinion dynamics tickFn + graph generator
    presets.ts
  index.ts                # Barrel: export { EcosystemDemo, ParticlesDemo, NetworkDemo }
```

### Storybook Story Organization (Locked Decision)
```
stories/
  Core/
    SimulationProvider.stories.tsx  # Already exists, enhance
  Rendering/
    SimCanvas.stories.tsx
    GridRenderer.stories.tsx
    LayerStack.stories.tsx
    ParticleRenderer.stories.tsx
    ForceGraph.stories.tsx
  Controls/
    ParameterPanel.stories.tsx
    TimelineControl.stories.tsx
    PlaybackBar.stories.tsx
    PresetSelector.stories.tsx
  Data/
    StatsPanel.stories.tsx
    MiniChart.stories.tsx
    EventLog.stories.tsx
    HeatmapOverlay.stories.tsx
    EntityInspector.stories.tsx
  helpers/
    MockSimulationProvider.tsx     # Lightweight wrapper with canned tick data
```

### Pattern 1: Demo Layout Component
**What:** Shared flex layout with CSS Grid for consistent dashboard appearance across all three demos.
**When to use:** Every demo wraps its content in this layout.
**Example:**
```typescript
// src/demos/shared/DemoLayout.tsx
interface DemoLayoutProps {
  title: string;
  renderer: React.ReactNode;       // Main canvas/graph area
  sidebar: React.ReactNode;        // ParameterPanel + PresetSelector
  bottom: React.ReactNode;         // StatsPanel, MiniCharts, EventLog
  timeline?: React.ReactNode;      // TimelineControl or PlaybackBar
}

export function DemoLayout({ title, renderer, sidebar, bottom, timeline }: DemoLayoutProps) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 300px',
      gridTemplateRows: 'auto 1fr auto',
      height: '100vh',
      background: 'var(--sim-bg)',
      color: 'var(--sim-text)',
      fontFamily: 'var(--sim-font-family)',
    }}>
      <header style={{ gridColumn: '1 / -1', padding: '12px 16px', borderBottom: '1px solid var(--sim-border)' }}>
        <h1 style={{ margin: 0, fontSize: 18 }}>{title}</h1>
      </header>
      <main style={{ overflow: 'hidden', position: 'relative' }}>{renderer}</main>
      <aside style={{ padding: 16, borderLeft: '1px solid var(--sim-border)', overflowY: 'auto' }}>{sidebar}</aside>
      <footer style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--sim-border)' }}>
        {timeline}
        <div style={{ display: 'flex', gap: 16, padding: 16 }}>{bottom}</div>
      </footer>
    </div>
  );
}
```

### Pattern 2: Demo TickFn Structure
**What:** Each demo's simulation.ts exports a typed tickFn, entity interface, and parameter schema.
**When to use:** Every demo simulation module.
**Example:**
```typescript
// src/demos/ecosystem/simulation.ts
import type { TickFn, ParameterSchema, ParameterValue } from '../../types';

export interface EcosystemEntities {
  grid: Uint8Array;        // 0=empty, 1=grass, 2=rabbit, 3=fox
  width: number;
  height: number;
  stats: { grass: number; rabbits: number; foxes: number; tick: number };
}

export const ecosystemSchema: ParameterSchema = {
  gridSize: { type: 'range', min: 50, max: 200, step: 10, default: 100, label: 'Grid Size' },
  grassGrowth: { type: 'range', min: 0, max: 1, step: 0.01, default: 0.03, label: 'Grass Growth' },
  rabbitBreed: { type: 'range', min: 0, max: 1, step: 0.01, default: 0.05, label: 'Rabbit Breed Rate' },
  // ... 5 more parameters
};

export const ecosystemTick: TickFn<EcosystemEntities> = (entities, params) => {
  // Lotka-Volterra cellular automaton logic
  // Returns new EcosystemEntities (immutable pattern)
};
```

### Pattern 3: Mock SimulationProvider for Stories
**What:** Lightweight wrapper that provides a working SimulationProvider with canned data for isolated story rendering.
**When to use:** Every story that uses useSimulation-dependent components.
**Example:**
```typescript
// stories/helpers/MockSimulationProvider.tsx
import { SimulationProvider } from '../../src/core';

interface MockProps {
  children: React.ReactNode;
  initialEntities?: unknown;
  parameters?: Record<string, import('../../src/types').ParameterValue>;
}

const identityTick = (e: unknown) => e;

export function MockSimulationProvider({ children, initialEntities, parameters }: MockProps) {
  return (
    <SimulationProvider
      tickFn={identityTick}
      initialEntities={initialEntities ?? {}}
      parameters={parameters ? schemaFromValues(parameters) : undefined}
    >
      {children}
    </SimulationProvider>
  );
}
```

### Pattern 4: Storybook Story with ArgTypes (Storybook 10)
**What:** Component stories with auto-generated controls from TypeScript prop types.
**When to use:** Every component story.
**Example:**
```typescript
// stories/Data/StatsPanel.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { StatsPanel } from '../../src/data';
import type { StatConfig } from '../../src/data';

const sampleStats: StatConfig[] = [
  { label: 'Population', value: 1234, unit: 'agents' },
  { label: 'Growth Rate', value: 0.034, format: { style: 'percent' }, sparkline: [0.02, 0.03, 0.034] },
];

const meta: Meta<typeof StatsPanel> = {
  title: 'Data/StatsPanel',
  component: StatsPanel,
  args: {
    stats: sampleStats,
    columns: 2,
    showChange: true,
  },
};
export default meta;

type Story = StoryObj<typeof StatsPanel>;

export const Default: Story = {};
export const SingleColumn: Story = { args: { columns: 1 } };
```

### Pattern 5: Vite Dev Server for Demo Development
**What:** A separate Vite app entry for running demos in development (not part of library build).
**When to use:** During demo development and testing.
**Example:**
```typescript
// dev/main.tsx (separate entry, not included in library build)
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '../src/theme/index.css';

const route = window.location.pathname;
const demos = {
  '/': () => import('../src/demos/ecosystem'),
  '/particles': () => import('../src/demos/particles'),
  '/network': () => import('../src/demos/network'),
};

// Simple hash/path router for demo selection
```

### Anti-Patterns to Avoid
- **Over-engineering demo state:** Demos use SimulationProvider directly -- do not add Redux, context chains, or separate state management. The whole point is demonstrating the kit's built-in state.
- **Heavy simulation math in tickFn:** Keep tick functions fast (<2ms). Use simple neighbor-counting for Lotka-Volterra, not per-cell ODE solvers. N-body uses naive O(n^2) at particle counts under 5000 -- Barnes-Hut is unnecessary.
- **Storybook stories with real simulation loops:** Stories should use static or slowly-ticking data. Auto-play simulations in stories consume CPU and distract from prop exploration.
- **Markdown README with JSX:** README is pure markdown. Do not use MDX or JSX in documentation files.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Scale-free graph generation | Custom graph library | Barabasi-Albert algorithm (~20 LOC) | Simple preferential attachment is 20 lines; no library needed, but also don't invent a novel algorithm |
| Storybook prop controls | Custom control panels | Storybook argTypes auto-discovery | Storybook 10 infers controls from TypeScript types automatically |
| Demo routing | React Router | Simple pathname switch in dev entry | Three routes total; a router library is overkill |
| Markdown rendering | Custom docs site | Plain README.md | Buyers read README on npm/GitHub; no docs site needed for v1 |

**Key insight:** Phase 6 is assembly, not invention. Every building block exists. The work is wiring components together with domain-specific simulation logic and writing clear documentation.

## Common Pitfalls

### Pitfall 1: Simulation Tick Causing React Re-renders
**What goes wrong:** Demo tick function returns a new object reference every frame, causing all subscribed components to re-render at 60fps.
**Why it happens:** Zustand selectors with object returns trigger re-renders even when values haven't changed.
**How to avoid:** Use granular selectors in demo components (e.g., `useSimulation(s => s.tick)` not `useSimulation(s => s)`). The existing `useShallow` pattern from Phase 1 decisions applies.
**Warning signs:** Demo runs at <30fps despite simple simulation logic.

### Pitfall 2: Mutable Entity State in TickFn
**What goes wrong:** TickFn mutates the entities object in place, breaking history/timeline scrubbing.
**Why it happens:** For performance, developers are tempted to mutate arrays directly.
**How to avoid:** Each tick must return a new top-level entity object. For grid demos, create a new Uint8Array each tick (or swap double buffers). For particle demos, create a new Float32Array.
**Warning signs:** Timeline scrubbing shows the same state at every tick.

### Pitfall 3: ParticleRenderer Data Format Mismatch
**What goes wrong:** Particles don't render or appear at wrong positions.
**Why it happens:** ParticleRenderer expects interleaved Float32Array with stride 4: [x, y, vx, vy, x, y, vx, vy, ...]. Getting the stride wrong is silent.
**How to avoid:** Define a constant STRIDE = 4 and use it consistently. Pre-allocate the Float32Array at max particle count.
**Warning signs:** Particles cluster at origin or produce NaN positions.

### Pitfall 4: Storybook Stories Missing SimulationProvider
**What goes wrong:** Components that call `useSimulation` crash with "must be used within SimulationProvider" error.
**Why it happens:** Not all components need the provider (StatsPanel, EntityInspector work with plain props), but MiniChart, EventLog, TimelineControl, PlaybackBar, PresetSelector, GridRenderer do.
**How to avoid:** Catalog which components need the mock provider. Components that take data via props only (StatsPanel, EntityInspector, HeatmapOverlay, ForceGraph) can be storied without it.
**Warning signs:** Storybook shows red error screen for certain stories.

### Pitfall 5: README Quick Start Assumes Dev Environment
**What goes wrong:** Quick start instructions fail for buyers because they assume the sim-kit repo setup, not an external project.
**Why it happens:** Testing README in the mono-repo where everything is already configured.
**How to avoid:** Write quick start from the buyer's perspective: `npm create vite@latest my-sim -- --template react-ts && cd my-sim && npm install sim-kit`. Test in a clean directory.
**Warning signs:** "npm install to demo running" takes >5 minutes.

### Pitfall 6: Grid Entity State vs Grid Config Mismatch
**What goes wrong:** GridRenderer receives `config.data` that doesn't match `config.width * config.height`.
**Why it happens:** Ecosystem demo changes grid size via parameter but doesn't resize the data array.
**How to avoid:** Grid size should be fixed per preset (set at initialization), not adjustable mid-simulation. Or if adjustable, the tick function must reallocate.
**Warning signs:** Canvas renders garbage or throws out-of-bounds.

## Code Examples

### Lotka-Volterra Cellular Automaton Tick
```typescript
// Simplified grid-based predator-prey
// Each cell is: 0=empty, 1=grass, 2=rabbit, 3=fox
// Rules per tick (stochastic cellular automaton):
//   - Empty cell: grows grass with probability grassGrowth
//   - Grass cell: rabbit moves in from neighbor with probability rabbitBreed
//   - Rabbit cell: fox moves in from neighbor (rabbit consumed) with probability foxHunt
//   - Fox cell: fox dies with probability foxDeath (starvation)
//   - Rabbit cell (no adjacent fox): rabbit reproduces with probability rabbitBreed
// Stats: count of each cell type per tick

export function ecosystemTick(entities: EcosystemEntities, params: Record<string, ParameterValue>): EcosystemEntities {
  const { grid, width, height } = entities;
  const next = new Uint8Array(grid.length);
  const grassGrowth = params.grassGrowth as number;
  const rabbitBreed = params.rabbitBreed as number;
  const foxHunt = params.foxHunt as number;
  const foxDeath = params.foxDeath as number;

  let grass = 0, rabbits = 0, foxes = 0;

  for (let i = 0; i < grid.length; i++) {
    const cell = grid[i];
    // ... neighbor counting and stochastic rules ...
    next[i] = newCellValue;
  }

  return {
    grid: next,
    width, height,
    stats: { grass, rabbits, foxes, tick: entities.stats.tick + 1 },
  };
}
```

### N-Body + Boids Particle Tick
```typescript
// Particles stored as Float32Array: [x, y, vx, vy] per particle (stride 4)
// N-body: gravitational attraction between all pairs (O(n^2), n < 5000)
// Boids: separation, alignment, cohesion within neighborhood radius
// Attractors: user-placed click points that pull particles

export function particleTick(entities: ParticleEntities, params: Record<string, ParameterValue>): ParticleEntities {
  const { particles, count, attractors } = entities;
  const next = new Float32Array(particles.length);
  const G = params.gravity as number;
  const dt = params.timeStep as number;

  for (let i = 0; i < count; i++) {
    const ix = i * 4;
    let ax = 0, ay = 0;
    // Sum forces from other particles + attractors
    // Update velocity and position
    next[ix] = particles[ix] + particles[ix + 2] * dt;     // x += vx * dt
    next[ix + 1] = particles[ix + 1] + particles[ix + 3] * dt; // y += vy * dt
    next[ix + 2] = particles[ix + 2] + ax * dt;             // vx += ax * dt
    next[ix + 3] = particles[ix + 3] + ay * dt;             // vy += ay * dt
  }

  return { ...entities, particles: next };
}
```

### Barabasi-Albert Scale-Free Graph Generator
```typescript
// Generate scale-free network for social network demo
// Preferential attachment: new nodes connect to existing nodes
// with probability proportional to their degree

export function generateScaleFreeGraph(n: number, m: number): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const degree: number[] = [];

  // Seed: complete graph of m+1 nodes
  for (let i = 0; i <= m; i++) {
    nodes.push({ id: `${i}`, group: 0, opinion: Math.random() });
    degree.push(m);
    for (let j = 0; j < i; j++) {
      links.push({ source: `${i}`, target: `${j}` });
    }
  }

  // Preferential attachment
  for (let i = m + 1; i < n; i++) {
    nodes.push({ id: `${i}`, group: 0, opinion: Math.random() });
    degree.push(0);
    const totalDegree = degree.reduce((a, b) => a + b, 0);
    const targets = new Set<number>();
    while (targets.size < m) {
      let r = Math.random() * totalDegree, cumulative = 0;
      for (let j = 0; j < i; j++) {
        cumulative += degree[j];
        if (cumulative > r) { targets.add(j); break; }
      }
    }
    for (const t of targets) {
      links.push({ source: `${i}`, target: `${t}` });
      degree[i]++;
      degree[t]++;
    }
  }

  return { nodes, links };
}
```

### Bounded Confidence Opinion Dynamics (Deffuant Model)
```typescript
// Each node has an opinion in [0, 1]
// At each tick, random pairs of connected nodes interact:
//   If |opinion_i - opinion_j| < confidence_threshold:
//     Both opinions move toward each other by convergence_rate
// This produces clustering, consensus, or polarization depending on threshold

export function opinionTick(entities: NetworkEntities, params: Record<string, ParameterValue>): NetworkEntities {
  const { nodes, links } = entities;
  const threshold = params.confidenceThreshold as number;
  const mu = params.convergenceRate as number;
  const interactions = params.interactionsPerTick as number;

  const nextNodes = nodes.map(n => ({ ...n }));

  for (let k = 0; k < interactions; k++) {
    const link = links[Math.floor(Math.random() * links.length)];
    const i = nextNodes.find(n => n.id === (typeof link.source === 'string' ? link.source : link.source.id))!;
    const j = nextNodes.find(n => n.id === (typeof link.target === 'string' ? link.target : link.target.id))!;

    if (Math.abs((i.opinion as number) - (j.opinion as number)) < threshold) {
      const diff = (j.opinion as number) - (i.opinion as number);
      (i as Record<string, unknown>).opinion = (i.opinion as number) + mu * diff;
      (j as Record<string, unknown>).opinion = (j.opinion as number) - mu * diff;
    }
  }

  return { ...entities, nodes: nextNodes };
}
```

## Simulation Design Reference

### Ecosystem Demo -- Recommended Parameters (8 total)
| Parameter | Type | Range | Default | Purpose |
|-----------|------|-------|---------|---------|
| grassGrowth | range | 0-0.1 | 0.03 | Probability empty cell becomes grass |
| rabbitBreed | range | 0-0.2 | 0.05 | Probability rabbit reproduces |
| rabbitStarve | range | 0-0.1 | 0.02 | Probability rabbit dies without grass |
| foxHunt | range | 0-0.15 | 0.04 | Probability fox catches adjacent rabbit |
| foxDeath | range | 0-0.2 | 0.08 | Probability fox dies (starvation) |
| foxBreed | range | 0-0.1 | 0.03 | Probability fox reproduces after eating |
| initialDensity | range | 0.1-0.9 | 0.5 | Initial fill ratio |
| gridSize | select | [50,100,150,200] | 100 | Grid dimension (width=height) |

### Ecosystem Presets
| Preset | Key Parameters | Expected Behavior |
|--------|---------------|-------------------|
| Stable coexistence | grassGrowth=0.03, rabbitBreed=0.05, foxHunt=0.04, foxDeath=0.08 | Oscillating populations, all three species persist |
| Fox extinction | foxHunt=0.02, foxDeath=0.15 | Foxes die out, rabbits overpopulate then oscillate with grass |
| Overpopulation crash | rabbitBreed=0.15, grassGrowth=0.01 | Rabbits boom, deplete grass, then crash |
| Chaos | rabbitBreed=0.12, foxHunt=0.10, foxDeath=0.05, grassGrowth=0.08 | High rates cause unpredictable dynamics |

### Particles Demo -- Recommended Parameters
| Parameter | Type | Range | Default | Purpose |
|-----------|------|-------|---------|---------|
| gravity | range | 0-5 | 1.0 | Gravitational constant |
| timeStep | range | 0.001-0.05 | 0.016 | Simulation dt |
| damping | range | 0-0.1 | 0.001 | Velocity damping |
| particleCount | select | [500,1000,2000,5000] | 1000 | Number of particles |
| boidsEnabled | toggle | - | false | Enable flocking behavior |
| separation | range | 0-5 | 1.5 | Boids separation strength |
| alignment | range | 0-5 | 1.0 | Boids alignment strength |
| cohesion | range | 0-5 | 1.0 | Boids cohesion strength |

### Particles Presets
| Preset | Key Parameters | Expected Behavior |
|--------|---------------|-------------------|
| Galaxy spiral | gravity=0.8, damping=0.001, initial tangential velocity, trails=true, blendMode=additive | Particles spiral inward forming galaxy arms -- hero visual |
| Boids flocking | boidsEnabled=true, gravity=0, separation=2, alignment=1.5, cohesion=1 | Particles self-organize into flocks |
| Orbit chaos | gravity=3, 3 fixed attractors, damping=0 | Chaotic three-body-like orbits |
| Fireworks | gravity=0.5, initial radial burst, high damping=0.05 | Burst patterns that fade |

### Social Network Demo -- Recommended Parameters
| Parameter | Type | Range | Default | Purpose |
|-----------|------|-------|---------|---------|
| nodeCount | select | [30,50,100,200] | 50 | Network size |
| connectionsPerNode | range | 1-5 | 3 | Barabasi-Albert m parameter |
| confidenceThreshold | range | 0.05-1.0 | 0.3 | Deffuant confidence bound |
| convergenceRate | range | 0.01-0.5 | 0.1 | How fast opinions converge |
| interactionsPerTick | range | 1-20 | 5 | Random pair interactions per tick |
| mediaNode | toggle | - | false | Enable a fixed-opinion "media" node |
| mediaBias | range | 0-1 | 0.8 | Media node's fixed opinion value |
| mediaReach | range | 0.1-1.0 | 0.5 | Fraction of nodes connected to media |

### Social Network Presets
| Preset | Key Parameters | Expected Behavior |
|--------|---------------|-------------------|
| Echo chambers | confidenceThreshold=0.2, convergenceRate=0.1 | Opinions cluster into distinct groups |
| Consensus | confidenceThreshold=0.8, convergenceRate=0.2 | All opinions converge to center |
| Polarization | confidenceThreshold=0.15, convergenceRate=0.3 | Two extreme opinion poles form |
| Media influence | mediaNode=true, mediaBias=0.8, mediaReach=0.5, confidenceThreshold=0.3 | Network opinion shifts toward media bias |

## Component-to-Story Mapping

All 18 components that need Storybook stories:

| Component | Layer | Needs Provider | Key Props for Args |
|-----------|-------|---------------|-------------------|
| SimulationProvider | Core | N/A (IS the provider) | tickFn, initialEntities |
| useSimulation | Core | Yes | N/A (hook, demo via wrapper) |
| SimCanvas | Rendering | No | width, height, onDraw |
| GridRenderer | Rendering | No (takes config prop) | config, highlightCell |
| LayerStack | Rendering | No | selectionMode, children |
| ParticleRenderer | Rendering | No | data, count, colorRamp, trails, pointSize |
| ForceGraph | Rendering | No | nodes, links, charge, linkDistance |
| ParameterPanel | Controls | Yes | schema, columns, compact |
| TimelineControl | Controls | Yes | (reads from store) |
| PlaybackBar | Controls | Yes | (reads from store) |
| PresetSelector | Controls | Yes | presets, variant |
| StatsPanel | Data | No | stats, columns, showChange |
| MiniChart | Data | Yes | selector, windowSize, color, label |
| EventLog | Data | Yes | maxHeight, severityFilter, autoScroll |
| HeatmapOverlay | Data | No | data, gridWidth, gridHeight, colorRamp, opacity |
| EntityInspector | Data | No | entity, title, position, chartKeys, chartData |
| colorRamps | Utils | No | N/A (utility, skip or minimal story) |
| RingBuffer | Utils | No | N/A (utility, skip or minimal story) |

**Note:** "18 components" in the requirements refers to all UI-facing exports. The utilities (colorRamps, RingBuffer, WebGL helpers) are not visual components. Stories should cover 15 visual components + the existing SimulationProvider story (enhanced) + useSimulation hook demo + a color ramps visual catalog = 18 stories total.

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Storybook 7/8 CSF2 | Storybook 10 CSF3 with auto-generated controls | Storybook 10 (2025) | Use `satisfies Meta<typeof Component>` pattern; args inferred from TS types |
| MDX stories | TypeScript CSF3 stories | Storybook 8+ | Pure .tsx story files; MDX only for doc pages |
| storiesOf API | Default export meta pattern | Storybook 7+ | Never use storiesOf |

**Note on Storybook 10:** The project already has Storybook 10.3.0 configured with `@storybook/react-vite`. The story discovery pattern is `../stories/**/*.stories.{ts,tsx}`. Addon-docs and addon-themes are configured. The sim-kit dark theme is applied globally via preview.tsx decorator.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 + React Testing Library 16.3.2 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DEMO-01 | Ecosystem demo renders all components, tick advances state | integration | `npx vitest run tests/demos/ecosystem.test.tsx -x` | Wave 0 |
| DEMO-02 | 4 ecosystem presets produce distinct parameter configs | unit | `npx vitest run tests/demos/ecosystem-presets.test.ts -x` | Wave 0 |
| DEMO-03 | Particles demo renders, tick advances Float32Array state | integration | `npx vitest run tests/demos/particles.test.tsx -x` | Wave 0 |
| DEMO-04 | 4 particle presets produce distinct configs, galaxy uses trails | unit | `npx vitest run tests/demos/particles-presets.test.ts -x` | Wave 0 |
| DEMO-05 | Network demo renders ForceGraph + EntityInspector, tick updates opinions | integration | `npx vitest run tests/demos/network.test.tsx -x` | Wave 0 |
| DEMO-06 | 4 network presets produce distinct parameter configs | unit | `npx vitest run tests/demos/network-presets.test.ts -x` | Wave 0 |
| DOCS-01 | README exists with Quick Start section | unit | `npx vitest run tests/docs/readme.test.ts -x` | Wave 0 |
| DOCS-02 | README contains component reference for all 18 components | unit | `npx vitest run tests/docs/readme.test.ts -x` | Wave 0 |
| DOCS-03 | README contains "Creating Your Own Simulation" section | unit | `npx vitest run tests/docs/readme.test.ts -x` | Wave 0 |
| DOCS-04 | README contains theming section with --sim-* variables | unit | `npx vitest run tests/docs/readme.test.ts -x` | Wave 0 |
| DOCS-05 | README contains performance guide section | unit | `npx vitest run tests/docs/readme.test.ts -x` | Wave 0 |
| DOCS-06 | Story files exist for all 18 components | unit | `npx vitest run tests/docs/storybook.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/demos/ -x`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/demos/` directory -- does not exist yet
- [ ] `tests/demos/ecosystem.test.tsx` -- covers DEMO-01, DEMO-02
- [ ] `tests/demos/particles.test.tsx` -- covers DEMO-03, DEMO-04
- [ ] `tests/demos/network.test.tsx` -- covers DEMO-05, DEMO-06
- [ ] `tests/docs/readme.test.ts` -- covers DOCS-01 through DOCS-05
- [ ] `tests/docs/storybook.test.ts` -- covers DOCS-06

## Open Questions

1. **Dev server entry point location**
   - What we know: Demos need a Vite dev server with route-based selection. The library build uses vite.config.ts in library mode.
   - What's unclear: Whether to add a separate vite config for dev (e.g., vite.dev.config.ts) or use Vite's built-in dev server mode alongside library config.
   - Recommendation: Create a `dev/` directory with index.html + main.tsx + vite.config.ts for demo development. Keep it separate from the library build config. This is a common pattern for library repos.

2. **Component count for "18 components"**
   - What we know: There are 15 distinct visual components, plus utilities (colorRamps, RingBuffer, WebGL helpers).
   - What's unclear: Whether "18 components" means 18 stories or 18 visual components exactly.
   - Recommendation: Count as: SimulationProvider, useSimulation (hook demo), SimCanvas, GridRenderer, LayerStack, ParticleRenderer, ForceGraph, ParameterPanel, TimelineControl, PlaybackBar, PresetSelector, StatsPanel, MiniChart, EventLog, HeatmapOverlay, EntityInspector, colorRamps (visual catalog), RingBuffer (utility demo) = 18 stories.

## Sources

### Primary (HIGH confidence)
- Project source code: all component prop types, barrel exports, existing Storybook config
- CONTEXT.md: locked decisions from user discussion
- REQUIREMENTS.md: all 12 phase requirements (DEMO-01 through DOCS-06)
- STATE.md: accumulated project decisions and patterns

### Secondary (MEDIUM confidence)
- Lotka-Volterra predator-prey model: well-established mathematical model, parameters based on standard cellular automaton implementations
- Deffuant bounded confidence model: standard opinion dynamics model from computational social science
- N-body simulation: classical physics simulation, standard Euler integration
- Boids flocking: Reynolds (1987) separation/alignment/cohesion model

### Tertiary (LOW confidence)
- Specific preset parameter values: these are recommendations that require tuning during implementation. The exact values for "visually striking" galaxy spiral or "chaos" ecosystem behavior will need manual adjustment.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- no new dependencies, all existing
- Architecture: HIGH -- patterns directly derived from existing codebase and locked decisions
- Simulation math: MEDIUM -- classical models, but parameter tuning is empirical
- Pitfalls: HIGH -- derived from accumulated project decisions in STATE.md

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable -- no external dependencies changing)
