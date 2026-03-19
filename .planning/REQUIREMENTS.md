# Requirements: Simulation Playground UI Kit

**Defined:** 2026-03-18
**Core Value:** Every simulation needs the same UI scaffolding — tick loops, parameter panels, timeline scrubbers, live stats. This kit eliminates that boilerplate so buyers go from idea to interactive sim in minutes.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Infrastructure

- [x] **INFRA-01**: Project scaffolded with Vite 7.3 library mode, React 19, TypeScript 5.9 strict mode
- [x] **INFRA-02**: Multi-entry build producing separate bundles per layer (core, rendering, controls, data, demos)
- [x] **INFRA-03**: Package.json with subpath exports supporting tree-shaking and tier separation ($29/$49)
- [x] **INFRA-04**: Tailwind v4 compiled to static CSS at build time with `--sim-*` CSS custom properties for theming
- [x] **INFRA-05**: Peer dependencies (React, Zustand, Recharts, D3-force) externalized correctly in build output
- [x] **INFRA-06**: Storybook 10 configured with Vite builder for interactive component documentation
- [x] **INFRA-07**: Shared TypeScript type definitions exported from `src/types/index.ts`

### Core

- [x] **CORE-01**: SimulationProvider wraps children with Zustand store providing tick loop, state management, and playback controls
- [x] **CORE-02**: Tick loop uses requestAnimationFrame with accumulator pattern for stable ticks regardless of frame rate
- [x] **CORE-03**: History stored in pre-allocated ring buffer with O(1) random access for timeline scrubbing (configurable max length, default 1000)
- [x] **CORE-04**: useSimulation hook exposes play/pause/toggle/step/stepBack/setSpeed/setParameter/resetParameters/seekToTick/logEvent/subscribe
- [x] **CORE-05**: Speed multiplier supports 0.25x, 0.5x, 1x, 2x, 4x, 8x, 16x
- [x] **CORE-06**: Tick loop runs outside React render cycle via Zustand vanilla API (getState/setState) to avoid re-renders at tick rate

### Rendering

- [x] **REND-01**: SimCanvas provides a base canvas element with mouse wheel zoom (cursor-centered), click-drag pan, touch pinch-zoom, and devicePixelRatio handling
- [x] **REND-02**: SimCanvas exposes Viewport with screenToWorld/worldToScreen coordinate transforms via onDraw callback
- [x] **REND-03**: GridRenderer renders 2D grid of color-mapped cells with configurable cell size, borders, cell highlighting, click and hover handlers
- [x] **REND-04**: GridRenderer achieves 500×500 grid at 30fps via dirty-rect optimization (only redraw changed cells)
- [x] **REND-05**: ParticleRenderer uses WebGL2 instanced rendering with interleaved Float32Array input, configurable point size, and color ramp texture
- [x] **REND-06**: ParticleRenderer supports trail effect via alpha fade overlay and additive/normal blending modes
- [x] **REND-07**: ParticleRenderer achieves 100k particles at 60fps and falls back to Canvas2D if WebGL2 unavailable
- [x] **REND-08**: ForceGraph uses D3-force for layout computation with React-managed SVG rendering (no D3 DOM manipulation)
- [x] **REND-09**: ForceGraph supports interactive node dragging, hover/click handlers, configurable forces (charge, linkDistance, centerStrength, collisionRadius)
- [x] **REND-10**: ForceGraph auto-pauses simulation when stable (alpha < 0.001) and supports optional Canvas2D mode for >500 nodes
- [x] **REND-11**: LayerStack composites multiple rendering layers with absolute positioning and z-index, plus SVG annotation overlay with selection modes (rect, lasso)

### Controls

- [x] **CTRL-01**: ParameterPanel auto-generates UI controls from a ParameterSchema supporting range (slider + numeric display), toggle, select, color, vec2 (two-handle), and group (collapsible) types
- [x] **CTRL-02**: ParameterPanel supports reset all, compact mode, 1 or 2 column layout, real-time value display, and dark mode
- [x] **CTRL-03**: TimelineControl provides draggable scrubber, click-to-seek, play/pause, step forward/back, speed selector, keyframe markers with tooltips, and FPS counter
- [x] **CTRL-04**: TimelineControl supports keyboard shortcuts: Space (play/pause), ←/→ (step), Shift+←/→ (±10 ticks)
- [x] **CTRL-05**: PlaybackBar provides minimal 40px-tall bar with play/pause button, speed badge, and tick counter (no scrubber)
- [x] **CTRL-06**: PresetSelector switches between saved parameter configurations with dropdown, cards, or pills layout options

### Data

- [x] **DATA-01**: StatsPanel displays live-updating numeric readout with configurable formatting, optional inline sparklines (SVG), and change indicators (▲/▼ with color)
- [x] **DATA-02**: MiniChart renders auto-scrolling sparkline/area chart (via Recharts 3) with configurable data window, auto-scaling, and last-value overlay
- [ ] **DATA-03**: EventLog displays scrolling timestamped event feed color-coded by severity (info/warning/critical) with type filtering via pill toggles, auto-scroll, and click-to-seek
- [ ] **DATA-04**: EventLog uses virtualized rendering for long event lists (only render visible rows)
- [ ] **DATA-05**: HeatmapOverlay renders canvas-based heatmap with configurable color ramp, opacity, bilinear interpolation, and legend bar
- [ ] **DATA-06**: EntityInspector shows entity properties, inline MiniCharts for numeric history, track toggle, and supports right/bottom/floating positioning with draggable floating mode

### Utilities

- [x] **UTIL-01**: Six built-in color ramps (viridis, inferno, plasma, coolwarm, terrain, category10) implemented as 256-entry lookup tables returning CSS color strings
- [x] **UTIL-02**: Ring buffer utility (history-buffer.ts) with pre-allocated fixed-size array, O(1) push/read/random-access
- [x] **UTIL-03**: WebGL helper utilities for shader compilation, buffer management, and instanced rendering setup

### Theming

- [x] **THEME-01**: Dark theme by default with all visual tokens exposed as `--sim-*` CSS custom properties (bg, surface, border, text, accent, danger, warning, success, fonts, radius, padding)
- [x] **THEME-02**: Tailwind classes used for layout, CSS vars for colors — buyers override vars to match their brand without touching component code

### Demos

- [ ] **DEMO-01**: Ecosystem demo implements Lotka-Volterra predator-prey on a 2D grid (grass/rabbits/foxes) with 8 configurable parameters using SimulationProvider, GridRenderer, ParameterPanel, TimelineControl, StatsPanel, MiniChart ×3, EventLog, and PresetSelector
- [ ] **DEMO-02**: Ecosystem demo ships with 4 presets: "Stable coexistence", "Fox extinction", "Overpopulation crash", "Chaos"
- [ ] **DEMO-03**: Particles demo implements N-body with configurable attractors and optional Boids flocking using SimulationProvider, ParticleRenderer, ParameterPanel, PlaybackBar, StatsPanel with click-to-place attractor interaction
- [ ] **DEMO-04**: Particles demo ships with 4 presets: "Galaxy spiral", "Boids flocking", "Orbit chaos", "Fireworks" — Galaxy spiral with trails is the marketing hero visual
- [ ] **DEMO-05**: Social network demo implements bounded confidence opinion dynamics on a scale-free graph using SimulationProvider, ForceGraph, ParameterPanel, TimelineControl, EventLog, EntityInspector, MiniChart
- [ ] **DEMO-06**: Social network demo ships with 4 presets: "Echo chambers", "Consensus", "Polarization", "Media influence"

### Documentation

- [ ] **DOCS-01**: README with quick start (npm install → see ecosystem demo in under 5 minutes), 10-line minimal example
- [ ] **DOCS-02**: Component reference section with props table, usage example, and screenshot per component
- [ ] **DOCS-03**: "Creating Your Own Simulation" guide covering state type definition, onTick function, ParameterSchema, and renderer selection
- [ ] **DOCS-04**: Theming guide documenting all `--sim-*` CSS variables and Tailwind customization
- [ ] **DOCS-05**: Performance guide covering grid size limits, particle count guidelines, and when to use OffscreenCanvas/Web Workers
- [ ] **DOCS-06**: Storybook stories for all 18 components with interactive prop playgrounds

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Advanced Features

- **ADV-01**: Keyframe markers on timeline scrubber (auto-detected events, colored dots with tooltips)
- **ADV-02**: URL state serialization for shareable simulation configurations
- **ADV-03**: Preset import/export via JSON files
- **ADV-04**: OffscreenCanvas in web worker for grids >250k cells
- **ADV-05**: Measurement/ruler tool in LayerStack

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Gumroad/UI8 page setup and marketing | Code-only scope — marketing handled separately |
| GIF/video recording/export | Use canvas-record or browser screen recording |
| Mobile-native layouts | Web-only; simulation panels are desktop/tablet interactions |
| Server-side simulation | All client-side; components render gracefully in SSR but sim logic is client-only |
| Real-time multiplayer/sync | Entirely different product category |
| 3D rendering / Three.js | react-three-fiber ecosystem already owns this |
| Node-based visual programming | Separate product category (Rete.js, React Flow) |
| Full charting library | Recharts as peer dep; kit provides sparklines only |
| Custom color picker widget | Native HTML5 color input; custom pickers are maintenance nightmares |
| Internationalization (i18n) | English only; CSS vars and props for label customization |
| CI/CD pipeline | Local dev and build only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 1 | Complete |
| INFRA-04 | Phase 1 | Complete |
| INFRA-05 | Phase 1 | Complete |
| INFRA-06 | Phase 1 | Complete |
| INFRA-07 | Phase 1 | Complete |
| CORE-01 | Phase 1 | Complete |
| CORE-02 | Phase 1 | Complete |
| CORE-03 | Phase 1 | Complete |
| CORE-04 | Phase 1 | Complete |
| CORE-05 | Phase 1 | Complete |
| CORE-06 | Phase 1 | Complete |
| UTIL-02 | Phase 1 | Complete |
| THEME-01 | Phase 1 | Complete |
| THEME-02 | Phase 1 | Complete |
| REND-01 | Phase 2 | Complete |
| REND-02 | Phase 2 | Complete |
| REND-03 | Phase 2 | Complete |
| REND-04 | Phase 2 | Complete |
| REND-11 | Phase 2 | Complete |
| UTIL-01 | Phase 2 | Complete |
| CTRL-01 | Phase 3 | Complete |
| CTRL-02 | Phase 3 | Complete |
| CTRL-03 | Phase 3 | Complete |
| CTRL-04 | Phase 3 | Complete |
| CTRL-05 | Phase 3 | Complete |
| CTRL-06 | Phase 3 | Complete |
| REND-05 | Phase 4 | Complete |
| REND-06 | Phase 4 | Complete |
| REND-07 | Phase 4 | Complete |
| REND-08 | Phase 4 | Complete |
| REND-09 | Phase 4 | Complete |
| REND-10 | Phase 4 | Complete |
| UTIL-03 | Phase 4 | Complete |
| DATA-01 | Phase 5 | Complete |
| DATA-02 | Phase 5 | Complete |
| DATA-03 | Phase 5 | Pending |
| DATA-04 | Phase 5 | Pending |
| DATA-05 | Phase 5 | Pending |
| DATA-06 | Phase 5 | Pending |
| DEMO-01 | Phase 6 | Pending |
| DEMO-02 | Phase 6 | Pending |
| DEMO-03 | Phase 6 | Pending |
| DEMO-04 | Phase 6 | Pending |
| DEMO-05 | Phase 6 | Pending |
| DEMO-06 | Phase 6 | Pending |
| DOCS-01 | Phase 6 | Pending |
| DOCS-02 | Phase 6 | Pending |
| DOCS-03 | Phase 6 | Pending |
| DOCS-04 | Phase 6 | Pending |
| DOCS-05 | Phase 6 | Pending |
| DOCS-06 | Phase 6 | Pending |

**Coverage:**
- v1 requirements: 53 total
- Mapped to phases: 53
- Unmapped: 0

---
*Requirements defined: 2026-03-18*
*Last updated: 2026-03-18 after roadmap creation*
