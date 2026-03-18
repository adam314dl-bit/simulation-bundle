# Roadmap: Simulation Playground UI Kit

## Overview

This roadmap delivers an 18-component React library for building interactive simulation interfaces, shipped as a premium UI kit with tiered pricing. The journey starts with build infrastructure and the core simulation engine (the architectural backbone everything depends on), progresses through rendering layers (Canvas2D, then WebGL2/D3-force), adds user controls and data visualization, and culminates with three polished demo simulations and full documentation. Each phase delivers a coherent, verifiable capability that unblocks the next.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Infrastructure + Core Engine** - Build system, theming, SimulationProvider, tick loop, history, and shared types
- [ ] **Phase 2: Canvas Rendering** - SimCanvas with pan/zoom, GridRenderer with dirty-rect optimization, color ramps, and layer compositing
- [ ] **Phase 3: Controls** - ParameterPanel, TimelineControl, PlaybackBar, and PresetSelector
- [ ] **Phase 4: Advanced Rendering** - WebGL2 ParticleRenderer and D3-force ForceGraph with all interaction modes
- [ ] **Phase 5: Data Visualization** - StatsPanel, MiniChart, EventLog, HeatmapOverlay, and EntityInspector
- [ ] **Phase 6: Demos + Documentation** - Three complete demo simulations, Storybook stories, and README documentation

## Phase Details

### Phase 1: Infrastructure + Core Engine
**Goal**: A validated build pipeline producing tree-shakable, tier-separated bundles, plus a working SimulationProvider that drives a tick loop with full playback control and history
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-06, INFRA-07, CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-06, UTIL-02, THEME-01, THEME-02
**Success Criteria** (what must be TRUE):
  1. A test consumer app can import from any layer entry point (core, rendering, controls, data, demos) and the resulting bundle contains no copies of React, Zustand, or other peer dependencies
  2. A minimal app using SimulationProvider can play, pause, step forward, step back, and change speed (0.25x through 16x), with the tick loop running at stable intervals independent of frame rate
  3. The history ring buffer stores and retrieves past states with O(1) random access, and seekToTick navigates to any stored tick
  4. All component styling uses --sim-* CSS custom properties with a dark theme by default, and overriding any --sim-* variable changes the corresponding visual token without touching component code
  5. TypeScript strict mode compiles cleanly and all public types are exported from src/types/index.ts
**Plans**: 6 plans

Plans:
- [ ] 01-01-PLAN.md — Test scaffold (vitest config + all test stubs, Wave 0 Nyquist baseline)
- [ ] 01-02-PLAN.md — Project scaffold (package.json, tsconfig, src/ structure, types, theme CSS)
- [ ] 01-03-PLAN.md — Build pipeline + Storybook (vite.config.ts, .storybook/ config with dark theme)
- [ ] 01-04-PLAN.md — RingBuffer utility (TDD: history-buffer.ts, O(1) push/get/random-access)
- [ ] 01-05-PLAN.md — Core engine (SimulationProvider, tick loop, useSimulation hook)
- [ ] 01-06-PLAN.md — Smoke story + phase gate (Storybook story + human verification checkpoint)

### Phase 2: Canvas Rendering
**Goal**: Users can see and interact with 2D canvas visualizations -- grids of colored cells with pan/zoom, layer compositing, and scientific color mapping
**Depends on**: Phase 1
**Requirements**: REND-01, REND-02, REND-03, REND-04, REND-11, UTIL-01
**Success Criteria** (what must be TRUE):
  1. SimCanvas renders a canvas element that supports mouse wheel zoom (centered on cursor), click-drag pan, touch pinch-zoom, and provides accurate screenToWorld/worldToScreen coordinate transforms
  2. GridRenderer displays a 500x500 grid of color-mapped cells at 30fps or higher, with only changed cells redrawn each frame (dirty-rect optimization)
  3. GridRenderer responds to cell click and hover events, supports configurable cell sizes and borders, and cell highlighting
  4. LayerStack composites multiple rendering layers with correct z-ordering, and its SVG annotation overlay supports rect and lasso selection modes
  5. Six built-in color ramps (viridis, inferno, plasma, coolwarm, terrain, category10) are available as 256-entry lookup tables and produce correct color mappings
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD

### Phase 3: Controls
**Goal**: Users can control simulation playback, adjust parameters via auto-generated UI, scrub through simulation history, and switch between parameter presets
**Depends on**: Phase 1
**Requirements**: CTRL-01, CTRL-02, CTRL-03, CTRL-04, CTRL-05, CTRL-06
**Success Criteria** (what must be TRUE):
  1. ParameterPanel auto-generates controls (slider, toggle, select, color, vec2, collapsible group) from a ParameterSchema, displays real-time values, supports reset-all, compact mode, and 1/2-column layouts
  2. TimelineControl provides a draggable scrubber that seeks through simulation history, shows keyframe markers with tooltips, displays an FPS counter, and supports keyboard shortcuts (Space for play/pause, arrows for step, Shift+arrows for +/-10 ticks)
  3. PlaybackBar renders a minimal 40px-tall bar with play/pause, speed badge, and tick counter that works independently of TimelineControl
  4. PresetSelector switches between named parameter configurations and supports dropdown, cards, and pills layout variants
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: Advanced Rendering
**Goal**: Users can visualize particle systems (up to 100k particles at 60fps with trails) and force-directed graphs with interactive node manipulation
**Depends on**: Phase 1
**Requirements**: REND-05, REND-06, REND-07, REND-08, REND-09, REND-10, UTIL-03
**Success Criteria** (what must be TRUE):
  1. ParticleRenderer displays 100k particles at 60fps using WebGL2 instanced rendering, with configurable point sizes and color ramp texture mapping
  2. ParticleRenderer supports trail effects via alpha fade overlay with both additive and normal blending modes, and gracefully falls back to Canvas2D when WebGL2 is unavailable
  3. ForceGraph renders a force-directed graph using D3-force for layout computation and React-managed SVG for node/link rendering, with no D3 DOM manipulation
  4. ForceGraph supports interactive node dragging, hover/click handlers, configurable forces (charge, linkDistance, centerStrength, collisionRadius), auto-pauses when stable (alpha < 0.001), and offers optional Canvas2D mode for graphs with more than 500 nodes
**Plans**: TBD

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

### Phase 5: Data Visualization
**Goal**: Users can monitor simulation state through live stats, sparkline charts, filtered event logs, heatmap overlays, and detailed entity inspection
**Depends on**: Phase 1
**Requirements**: DATA-01, DATA-02, DATA-03, DATA-04, DATA-05, DATA-06
**Success Criteria** (what must be TRUE):
  1. StatsPanel displays live-updating numeric values with configurable formatting, optional inline SVG sparklines, and directional change indicators (up/down arrows with color)
  2. MiniChart renders an auto-scrolling sparkline/area chart via Recharts with configurable data window, auto-scaling Y axis, and last-value overlay, throttled to avoid degrading simulation frame rate
  3. EventLog displays a scrolling, timestamped event feed color-coded by severity (info/warning/critical) with type filtering via pill toggles, auto-scroll, click-to-seek, and virtualized rendering for long lists
  4. HeatmapOverlay renders a canvas-based heatmap with selectable color ramp, adjustable opacity, bilinear interpolation, and a legend bar
  5. EntityInspector shows entity properties with inline MiniCharts for numeric history, a track toggle, and supports right/bottom/floating panel positioning with draggable floating mode
**Plans**: TBD

Plans:
- [ ] 05-01: TBD
- [ ] 05-02: TBD

### Phase 6: Demos + Documentation
**Goal**: Three polished, fully-integrated demo simulations showcase every component in the kit, Storybook provides interactive documentation for all 18 components, and the README enables buyers to go from install to running simulation in under 5 minutes
**Depends on**: Phase 2, Phase 3, Phase 4, Phase 5
**Requirements**: DEMO-01, DEMO-02, DEMO-03, DEMO-04, DEMO-05, DEMO-06, DOCS-01, DOCS-02, DOCS-03, DOCS-04, DOCS-05, DOCS-06
**Success Criteria** (what must be TRUE):
  1. Ecosystem demo runs a Lotka-Volterra predator-prey simulation on a 2D grid with 8 adjustable parameters, 4 presets (Stable coexistence, Fox extinction, Overpopulation crash, Chaos), live stats, MiniCharts, EventLog, and PresetSelector all working together
  2. Particles demo runs an N-body + flocking simulation with click-to-place attractors, 4 presets (Galaxy spiral, Boids flocking, Orbit chaos, Fireworks), and the Galaxy spiral preset with trails produces a visually striking hero image suitable for marketing
  3. Social network demo runs bounded confidence opinion dynamics on a scale-free graph with ForceGraph, EntityInspector, and 4 presets (Echo chambers, Consensus, Polarization, Media influence)
  4. Storybook stories exist for all 18 components with interactive prop playgrounds that let buyers explore every component in isolation
  5. README quick start guide gets a buyer from npm install to seeing the ecosystem demo running in under 5 minutes, with component reference, "create your own sim" guide, theming docs, and performance guide all present
**Plans**: TBD

Plans:
- [ ] 06-01: TBD
- [ ] 06-02: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6
Note: Phases 2, 3, 4, and 5 all depend on Phase 1 but are independent of each other. Phase 6 depends on all previous phases.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Infrastructure + Core Engine | 5/6 | In Progress|  |
| 2. Canvas Rendering | 0/? | Not started | - |
| 3. Controls | 0/? | Not started | - |
| 4. Advanced Rendering | 0/? | Not started | - |
| 5. Data Visualization | 0/? | Not started | - |
| 6. Demos + Documentation | 0/? | Not started | - |
