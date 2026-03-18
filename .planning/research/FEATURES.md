# Feature Landscape

**Domain:** Simulation UI Kit / Creative Coding Component Library (React)
**Researched:** 2026-03-18
**Target Market:** Creative coders, gamedevs, educators, simulation researchers
**Pricing Context:** Premium Gumroad product ($49 full / $29 core tier)

---

## Table Stakes

Features users expect. Missing = product feels incomplete or amateurish. These are informed by what lil-gui, Leva, Tweakpane, Theatre.js, and the broader creative coding ecosystem have established as baseline expectations.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| **Play/Pause/Step controls** | Every simulation tool from NetLogo to AnyLogic has this. Users cannot interact with a simulation without basic playback. | Low | Core primitive. Single-step is critical for debugging. |
| **Speed control (tick rate)** | Users need to slow down to observe behavior or speed up to see long-term dynamics. lil-gui/Tweakpane users always add a speed slider. | Low | Slider with presets (0.25x, 0.5x, 1x, 2x, 4x) plus custom input. |
| **Auto-generated parameter panel** | Leva's core value proposition. Users define a schema, controls appear. Manual wiring of every slider is unacceptable in 2026. | Medium | Schema-driven with type inference (number -> slider, boolean -> toggle, string -> text, array -> dropdown). This is what Leva/Tweakpane do and what buyers of a simulation kit will assume exists. |
| **Number input with slider** | The single most common control in any parameter panel. Tweakpane, lil-gui, Leva all have this. | Low | Must support min/max/step, keyboard increment, and direct text entry. |
| **Boolean toggle** | Second most common control type across all GUI libraries. | Low | Simple checkbox or toggle switch. |
| **Dropdown/select** | Required for enum parameters (algorithm selection, species type, boundary conditions). Standard in all GUI libraries. | Low | Support both array and object (label->value) formats. |
| **Color picker** | Expected in any creative coding tool. lil-gui uses native HTML color input; Leva has a custom one. | Low | Native HTML5 color input is fine. Support hex string format at minimum. |
| **Collapsible folders/groups** | All parameter panel libraries (dat.gui, lil-gui, Leva, Tweakpane) organize parameters into folders. Essential once you have more than 5 parameters. | Low | Nested folders with expand/collapse. |
| **Dark theme by default** | Creative coders and simulation researchers overwhelmingly use dark themes. Every comparable tool (Leva, Tweakpane, Theatre.js) defaults dark. | Low | CSS custom properties with `--sim-*` namespace for overrides. |
| **Canvas rendering surface** | The fundamental display surface for grid-based simulations. Users cannot visualize anything without it. | Medium | Canvas2D with proper devicePixelRatio handling. |
| **Pan and zoom** | Standard in any canvas-based visualization. React Flow, D3, and Observable all support this. Users expect to explore spatial simulations. | Medium | Mouse wheel zoom, click-drag pan, touch pinch-zoom. Smooth animated transitions. |
| **Grid visualization** | Grid worlds are the most common simulation topology (Conway's Game of Life, cellular automata, Lotka-Volterra). This is the bread and butter of simulation visualization. | Medium | Color-mapped cells with configurable cell size. Must handle at least 500x500 at 30fps per project requirements. |
| **Live stats display** | Users need to see aggregate numbers (population counts, energy levels, tick count) updating in real-time. AnyLogic, NetLogo, and every simulation IDE has this. | Low | Key-value display with labels and formatted numbers. |
| **Reset/restart** | Users must be able to return to initial state. Every simulation tool has this. | Low | Reset to initial parameters and state. |
| **TypeScript types** | Non-negotiable for a 2026 React component library. Buyers of premium kits expect full type safety and IDE autocomplete. | Low | Strict mode, exported interfaces for all props and state. |
| **Storybook documentation** | Premium component kit buyers expect interactive documentation showing every component with prop playgrounds. This is the primary way buyers evaluate a kit before purchasing. | Medium | Every component needs at least one story with interactive controls. |
| **Tree-shakable exports** | Modern React library standard. Buyers should not pay bundle size cost for components they do not use. | Low | Separate entry points per layer (core, rendering, controls, data). |
| **CSS custom property theming** | Buyers need to match the kit to their project's design. Leva, Tweakpane, and all mature component libraries support theming. Hard-coded styles are a dealbreaker. | Low | `--sim-*` namespace, documented variables, dark theme as default. |

## Differentiators

Features that set this product apart from assembling lil-gui + canvas + D3 yourself. Not expected (buyers might not know these exist), but once seen, they justify the $49 price.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| **Simulation Provider (tick loop engine)** | The core differentiator. No existing React library provides a Zustand-backed tick loop with history ring buffer, playback control, and state subscription all wired together. Buyers get `<SimulationProvider>` and immediately have a working simulation lifecycle. This is weeks of custom work eliminated. | High | Zustand store with configurable tick rate, history buffer, play/pause/step/reset, and React context for child components to subscribe. This is the architectural backbone. |
| **Timeline scrubber with history** | The ability to scrub backward through simulation history is rare outside professional tools (AnyLogic, Theatre.js). Most creative coding setups are fire-and-forget with no rewind. This is a "wow" feature. | High | Ring buffer of N past states, scrubber thumb, visual tick markers. Requires the SimulationProvider history system. |
| **Keyframe markers on timeline** | Theatre.js pioneered this for web animation. Applying it to simulation (mark when a population crashes, when equilibrium is reached) is novel and valuable for researchers/educators. | Medium | Visual markers on the timeline scrubber. User-defined or auto-detected events. |
| **Preset system with save/load** | Leva has basic presets. Going further with named presets, import/export JSON, and potentially URL-encoded state sharing turns a toy into a research tool. Educators can share exact configurations with students. | Medium | JSON serialization of all parameters. Named preset management. Export/import capability. |
| **WebGL2 particle renderer** | Canvas2D cannot handle 100K particles at 60fps. A WebGL2 instanced particle system with Canvas2D fallback is a significant technical differentiator. Most creative coding React libraries do not include GPU-accelerated rendering. | High | WebGL2 with instanced rendering for particles. Point sprites or instanced quads. Canvas2D fallback for compatibility. |
| **D3-force graph with React SVG** | Network/graph simulations (opinion dynamics, social networks, epidemiology) need force-directed layouts. Using D3-force for layout but React for SVG rendering is the correct modern pattern (no D3 DOM manipulation). Few libraries get this right. | High | D3-force for physics, React renders SVG nodes. Interactive drag, hover, selection. |
| **Mini sparkline charts** | Inline sparklines showing population trends, energy curves, or any time-series data at a glance. These are standard in financial dashboards but rare in simulation toolkits. They transform a parameter panel from static numbers to living data. | Medium | SVG or Canvas-based miniature line charts. Auto-scaling. Configurable data window. |
| **Heatmap overlay** | Overlaying density, temperature, or gradient data on top of the simulation canvas. AnyLogic and professional simulation tools have this; creative coding tools generally do not. | Medium | Canvas2D overlay with configurable color ramp. Alpha blending over the main visualization. |
| **Entity inspector** | Click on an entity (a particle, a cell, an agent) and see its full state in a side panel. This is standard in game engines (Unity Inspector) and professional simulation tools but absent from creative coding libraries. | Medium | Click-to-select on canvas, detail panel showing all properties of selected entity. |
| **Event log with filtering** | A timestamped, filterable log of simulation events (births, deaths, collisions, state changes). Professional simulation tools have this; creative coding tools do not. Essential for debugging and understanding emergent behavior. | Medium | Scrolling list with severity/category filters. Auto-scroll to latest. Search/filter by event type. |
| **Built-in color ramps** | Scientific color maps (viridis, inferno, plasma, coolwarm) are expected in data visualization but rarely bundled with creative coding tools. Having 6 built-in ramps with a clean API saves researchers from importing colormap libraries separately. | Low | Array of color ramp functions. Support continuous and discrete mapping. |
| **Dirty-rect grid optimization** | Only redrawing cells that changed between ticks, rather than clearing and redrawing the entire canvas. This is a well-known optimization but implementing it correctly is tricky. It is the difference between 500x500 at 10fps and 500x500 at 30fps. | Medium | Track changed cells per tick, only repaint dirty regions. Significant performance impact for large sparse grids. |
| **Working demo simulations (3)** | Most component libraries ship with trivial examples. Shipping three complete, visually striking, scientifically grounded simulations (predator-prey, particles/flocking, social network) demonstrates the kit's capability and gives buyers starting points. This is a premium differentiator that justifies the $49 tier. | High | Each demo is a complete simulation using the kit's components. Must be well-documented and serve as "create your own" templates. |
| **Tier-separated packaging** | Clean separation between $29 core (13 components) and $49 full (18 components + demos) without code duplication. This is a business differentiator enabling price discrimination. | Low | Structured exports with separate entry points. Build-time tier separation. |

## Anti-Features

Features to explicitly NOT build. These are tempting but would increase scope, confuse the product positioning, or create maintenance burden disproportionate to value.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Custom color picker widget** | lil-gui switched FROM custom to native HTML5 color input. Custom pickers are maintenance nightmares (cross-browser, touch, accessibility). Leva's custom picker is one of its buggiest components. | Use native `<input type="color">`. It works everywhere and is accessible by default. |
| **GIF/video recording/export** | PROJECT.md explicitly excludes this. Libraries like canvas-record and Remotion exist for this purpose. Building capture tooling adds massive scope (codec handling, frame timing, file size) with no clear path to quality. | Document how to use canvas-record or browser-native screen recording. Provide a "screenshot current frame" helper at most. |
| **Mobile-native layouts** | PROJECT.md scope is web-only. Simulation parameter panels are inherently desktop/tablet interactions. Responsive mobile layouts for complex control panels are an anti-pattern that degrades the desktop experience. | Ensure touch events work for pan/zoom on tablets. Do not redesign layouts for phone screens. |
| **Server-side simulation** | PROJECT.md excludes this. Client-side simulation is the core value prop. SSR adds complexity (hydration, state sync) with no value for the target audience. | All simulation runs in the browser. Components should render gracefully in SSR (empty/loading state) but simulation logic is client-only. |
| **Real-time multiplayer/sync** | PROJECT.md excludes this. Multiplayer adds networking, conflict resolution, and state sync complexity that is an entirely different product. | Single-user only. If users need multiplayer, they build it on top. |
| **Node-based visual programming editor** | Tempting to add a "wire components together" visual editor like Rete.js or React Flow. This is a separate product category (see: Cables.gl, vvvv, TouchDesigner) and would dwarf the rest of the library in complexity. | Provide clean component APIs that are easy to compose in JSX. The composition IS the wiring. |
| **Full charting library** | Do not try to compete with Recharts, Victory, or Tremor. The kit needs sparklines and stats, not bar charts, pie charts, scatter plots. | Use Recharts as a peer dependency for MiniChart. Provide sparklines for inline use. Leave full charting to dedicated libraries. |
| **Custom form validation** | Parameter panels should validate ranges (min/max) but should not become a form library with error messages, async validation, required fields. | Clamp values to min/max. Type-check via TypeScript. Leave complex validation to the simulation logic layer. |
| **3D rendering / Three.js integration** | The react-three-fiber ecosystem already has Leva, drei, and Theatre.js. Entering 3D visualization would compete with an established, well-funded ecosystem (pmndrs). | Stay in 2D. Canvas2D for grids, WebGL2 for particles (2D point sprites), SVG for graphs. If users need 3D, they use R3F and can still use this kit's control/data components. |
| **Internationalization (i18n)** | Premium UI kit buyers on Gumroad are developers who read English. Adding i18n to component labels and documentation doubles the content work for negligible revenue impact. | English only. Use CSS custom properties and props for label customization if buyers want to rename things. |
| **Built-in tutorials/onboarding** | Interactive walkthroughs and tooltips are scope creep. The Storybook stories and README documentation serve this purpose. | Good Storybook stories with clear prop documentation. A "create your own sim" guide in the README. |

## Feature Dependencies

```
SimulationProvider (tick loop + state)
  --> ALL other components depend on this
  --> Provides: tick count, parameters, state, history, playback controls

SimulationProvider
  --> PlaybackBar (play/pause/step/speed)
  --> ParameterPanel (reads schema, writes params)
  --> TimelineScrubber (reads history buffer)
      --> KeyframeMarkers (decorates timeline)
  --> PresetSelector (serializes/deserializes params)

SimulationProvider + Canvas infrastructure
  --> GridRenderer (reads grid state per tick)
      --> HeatmapOverlay (composites on top of grid)
      --> DirtyRectOptimization (internal to GridRenderer)
  --> ParticleRenderer (WebGL2, reads particle state per tick)
  --> GraphRenderer (D3-force layout, reads node/edge state)

SimulationProvider + Data subscription
  --> StatsPanel (subscribes to computed aggregates)
  --> MiniChart/Sparkline (subscribes to time-series data)
  --> EventLog (subscribes to event stream)
  --> EntityInspector (reads selected entity state)

Canvas renderers
  --> Pan/Zoom controls (shared interaction layer)
  --> Entity selection / click handling
      --> EntityInspector

Color Ramps (utility, no dependencies)
  --> Used by: GridRenderer, HeatmapOverlay, ParticleRenderer

Theming (CSS custom properties)
  --> Used by: ALL visible components
```

### Critical Path

The dependency chain for the minimum viable product is:

```
1. SimulationProvider (everything depends on this)
2. Canvas infrastructure + GridRenderer (primary visualization)
3. PlaybackBar (minimum user interaction)
4. ParameterPanel (minimum parameter control)
5. StatsPanel (minimum data feedback)
```

Everything else layers on top of these five.

## MVP Recommendation

### Must ship (Table Stakes that cannot be deferred):

1. **SimulationProvider** -- The architectural backbone. Without it, no component works.
2. **PlaybackBar** (play/pause/step/speed/reset) -- Cannot interact with simulation otherwise.
3. **ParameterPanel** (auto-generated from schema) -- The core UX promise of the kit.
4. **GridRenderer** with pan/zoom -- The primary visualization surface for 2 of 3 demos.
5. **StatsPanel** -- Users need numeric feedback on what is happening.
6. **Dark theme with CSS custom properties** -- Visual polish is what sells on Gumroad.
7. **TypeScript types** -- Non-negotiable for credibility.
8. **At least 1 working demo** (predator-prey ecosystem) -- Proves the kit works end-to-end.

### High-value differentiators to include in v1 (justify $49):

9. **WebGL2 ParticleRenderer** -- The "Galaxy spiral" preset is the marketing hero. This MUST look striking.
10. **Timeline scrubber with history** -- The "wow" feature that separates this from "just another lil-gui wrapper."
11. **Mini sparkline charts** -- Transforms the data layer from static numbers to living visualization.
12. **Event log** -- Essential for the simulation researcher audience.
13. **Entity inspector** -- The "click to inspect" pattern that makes simulations explorable.
14. **Built-in color ramps** -- Low effort, high perceived value for scientific users.
15. **All 3 demos** -- The demos sell the product on Gumroad. Buyers need to see predator-prey, particle flocking, and social network in action.

### Defer to v1.1 or v2:

- **Heatmap overlay** -- Valuable but can layer on after GridRenderer ships. Medium complexity for a feature that only some simulations need.
- **Keyframe markers** -- Nice-to-have decoration on the timeline scrubber. Ship the scrubber first, add markers later.
- **URL state serialization** -- Educator-focused feature. Can be a post-launch addition without breaking changes.
- **Preset import/export (JSON files)** -- Basic named presets ship in v1. File import/export is a v1.1 polish feature.
- **Graph renderer (D3-force)** -- Only needed for the social network demo. Can ship as the last component since it has the most complex integration (D3 + React SVG).

## Competitive Landscape Summary

| Competitor/Reference | What They Do Well | What They Lack | Our Opportunity |
|---------------------|-------------------|----------------|-----------------|
| **lil-gui / dat.gui** | Dead simple API, tiny bundle, battle-tested | No React integration, no simulation awareness, no history/playback, no data viz | Full React integration with simulation lifecycle |
| **Leva (pmndrs)** | Beautiful React-first GUI, plugin system, smart type inference | No simulation engine, no timeline, no canvas rendering, no data components | Leva is controls-only. We are controls + rendering + data + engine |
| **Tweakpane** | Clean design, monitoring mode, plugin ecosystem | Not React-native, no simulation awareness, vanilla JS only | React-native with simulation-specific components |
| **Theatre.js** | Professional keyframe timeline, visual editor | Focused on animation, not simulation. Overkill for parameter tweaking. No data viz | Simulation-focused timeline (history scrub, not animation curves) |
| **Observable/D3** | Powerful reactive notebooks, incredible visualization | Not a component library. Cannot drop into a React app. Notebook-only paradigm | Packaged React components that bring Observable-level interactivity to any React project |
| **AnyLogic/NetLogo** | Full simulation IDEs with entity inspection, event logs, parameter sweeps | Desktop apps or proprietary. Not embeddable. Not React. Not for creative coders | Web-native, React-native, open-source (MIT), designed for embedding |

## What Premium UI Kit Buyers Expect (Gumroad/UI8 Context)

Based on research into successful premium React UI kits:

1. **Visual polish** -- Dark theme, smooth animations, consistent spacing. The Storybook and demo screenshots sell the product. If it looks like a dev tool prototype, nobody pays $49.
2. **Complete documentation** -- Storybook stories for every component with interactive prop controls. A "quick start" that works in under 5 minutes. A "build your own" guide.
3. **Copy-paste ready** -- Buyers want to drop components in and have them work. Minimal configuration. Smart defaults. The `<SimulationProvider>` + `<PlaybackBar>` should render something useful with zero props.
4. **TypeScript-first** -- Full type definitions, strict mode, exported interfaces. IDE autocomplete is part of the product experience.
5. **Theming** -- CSS custom properties at minimum. Buyers need to match their project's visual identity.
6. **Working examples** -- Not toy examples. Real, functional demonstrations that show the full capability of the kit. The 3 demos are a major selling point.
7. **Tree-shakable** -- Buyers should not pay bundle cost for components they do not use. Separate entry points per layer.
8. **Active maintenance signal** -- Clean commit history, semantic versioning, a changelog. Buyers need confidence the product is not abandoned.

## Sources

- [lil-gui documentation](https://lil-gui.georgealways.com/) - Feature reference for parameter panels
- [lil-gui GitHub](https://github.com/georgealways/lil-gui) - Migration guide, feature comparison with dat.gui
- [Leva GitHub (pmndrs)](https://github.com/pmndrs/leva) - React-first GUI library features and plugin system
- [Tweakpane documentation](https://tweakpane.github.io/docs/) - Blade types, monitoring, plugin system
- [Theatre.js](https://www.theatrejs.com/) - Keyframe timeline editor, sequence editing
- [AnyLogic features](https://www.anylogic.com/features/) - Professional simulation UI reference
- [react-timeline-editor](https://github.com/xzdarcy/react-timeline-editor) - Timeline animation editor for React
- [canvas-record](https://github.com/dmnsgn/canvas-record) - Canvas recording capabilities (referenced as anti-feature)
- [React Flow MiniMap](https://reactflow.dev/api-reference/components/minimap) - Minimap interaction patterns
- [Chroma.js](https://gka.github.io/chroma.js/) - Color scale/ramp library reference
- [react-sparklines](https://github.com/borisyankov/react-sparklines) - Sparkline component patterns
- [Untitled UI React](https://www.untitledui.com/react) - Premium React UI kit feature expectations
- [Syncfusion React HeatMap](https://www.syncfusion.com/react-components/react-heatmap-chart) - Heatmap visualization patterns
