# Project Research Summary

**Project:** Simulation Playground UI Kit
**Domain:** React simulation UI component library (Canvas2D, WebGL2, D3-force, Zustand)
**Researched:** 2026-03-18
**Confidence:** HIGH

## Executive Summary

This project is a premium React component library (18 components across 4 layers) for building interactive simulations -- targeting creative coders, educators, game developers, and simulation researchers. The product ships as a tree-shakable npm package with tiered pricing ($29 core / $49 full with demos) on Gumroad. The closest comparisons are Leva (parameter panels) and Theatre.js (timeline), but nothing in the React ecosystem combines a tick-loop engine, parameter controls, canvas/WebGL rendering, and data visualization into a single cohesive kit. The competitive gap is real and the value proposition is clear.

The recommended approach is to build on React 19 + Zustand 5 + Vite 7.3 library mode, using raw Canvas2D/WebGL2 for rendering (no Three.js) and D3-force as a headless layout engine. The critical architectural insight is that the simulation tick loop must run outside React's render cycle entirely -- Zustand's vanilla `getState()`/`setState()` API drives canvas/WebGL rendering via refs and transient subscriptions, while React only handles low-frequency UI controls and data panels. Tailwind v4 is used for internal development but compiled to static CSS at build time, with `--sim-*` CSS custom properties as the consumer theming API. This decouples the library from requiring consumers to use Tailwind.

The primary risks are: (1) Vite library mode silently bundling peer dependencies into the output, which crashes consumers with duplicate React instances -- this must be validated with a test consumer app before any component work begins; (2) Canvas/WebGL resource leaks under React Strict Mode's double-mount behavior, which requires `useLayoutEffect` and explicit GPU resource tracking from day one; (3) Tailwind classes being purged by consumer builds if the library ships utility classes instead of pre-built CSS. All three risks are well-understood and preventable if addressed in the build infrastructure phase before component development starts.

## Key Findings

### Recommended Stack

The stack is mature and well-validated. React 19.2 has been production-stable for 15+ months. Vite 7.3 is the safe choice for library builds -- Vite 8 (Rolldown-powered) shipped days ago with known library-mode failures. Zustand 5 is the right state manager for coherent simulation state accessed at 60fps (Jotai's atom model and Redux's dispatch overhead are wrong fits). Recharts 3 is lighter and more composable than v2, suitable for sparklines. Raw WebGL2 with instanced rendering handles 100k particles without pulling in Three.js's 150KB+ bundle.

**Core technologies:**
- **React 19.2 + TypeScript 5.9:** Stable foundation. Ref cleanup functions are directly useful for Canvas/WebGL teardown. No forwardRef needed.
- **Vite 7.3 (library mode):** ES-only output, 5 entry points (core/rendering/controls/data/demos), `preserveModules` for true tree-shaking. Defer Vite 8 migration to 8.1+.
- **Zustand 5:** Single store with slice pattern. Tick loop uses `getState()`/`setState()` outside React. `subscribeWithSelector` for granular rendering subscriptions.
- **Raw WebGL2:** Instanced rendering for 100k particles in a single draw call. Canvas2D fallback for the 3% without WebGL2 support.
- **D3-force 3 (headless):** Force layout computation only. React renders SVG. D3 never touches the DOM.
- **Recharts 3:** SVG-based sparklines for MiniChart. Throttled to 2-5fps to avoid saturating the main thread.
- **Tailwind v4 (dev only):** Compiled to static CSS at build time. Consumer theming via `--sim-*` CSS custom properties.
- **Storybook 10 + Vitest 4:** Documentation and testing. ESM-only aligns with library output.

### Expected Features

**Must have (table stakes -- missing means product feels broken):**
- SimulationProvider with tick loop, history ring buffer, and playback control
- Play/pause/step/speed/reset controls (PlaybackBar)
- Schema-driven ParameterPanel (auto-generates controls from type definitions)
- GridRenderer with pan/zoom (500x500 at 30fps via dirty-rect optimization)
- StatsPanel with live numeric readouts
- Dark theme by default with CSS custom property overrides
- Full TypeScript types, tree-shakable exports, Storybook documentation

**Should have (differentiators that justify the $49 price):**
- WebGL2 ParticleRenderer (the marketing hero -- "Galaxy spiral" preset)
- Timeline scrubber with history (rare outside professional tools like AnyLogic)
- MiniChart sparklines (transforms static numbers into living data)
- Entity inspector (click-to-inspect, standard in game engines but absent from creative coding libs)
- Event log with filtering
- Built-in scientific color ramps (viridis, inferno, plasma)
- 3 complete demo simulations (predator-prey, particles/flocking, social network)

**Defer to v1.1+:**
- Heatmap overlay (can layer on GridRenderer post-launch)
- Keyframe markers on timeline (decoration on top of scrubber)
- URL state serialization (educator feature, no breaking changes to add later)
- JSON preset import/export (basic named presets ship in v1)

**Anti-features (explicitly do not build):**
- Custom color picker (use native HTML5 input)
- GIF/video export, mobile layouts, server-side simulation, multiplayer
- Node-based visual editor, full charting library, 3D rendering
- Internationalization

### Architecture Approach

The library follows a strict 4-layer architecture (Core, Rendering, Controls, Data) with unidirectional data flow through a single Zustand store. Rendering components never write to the store; controls never render to canvas. This separation makes layers independently testable and tree-shakable. The tick loop runs in `requestAnimationFrame` using Zustand's vanilla API, completely outside React's reconciler. Canvas/WebGL components use transient subscriptions (store.subscribe) to read state and draw directly via refs. React components (controls, data panels) use hook selectors for low-frequency updates.

**Major components and their layer assignments:**
1. **SimulationProvider (Core)** -- Creates Zustand store, runs tick loop, manages history ring buffer. Every other component depends on this.
2. **GridCanvas (Rendering)** -- Canvas2D with dirty-rect optimization. Subscribe-driven draw loop for change-aware rendering.
3. **ParticleRenderer (Rendering)** -- WebGL2 instanced rendering with Canvas2D fallback. rAF-driven draw loop for consistent GPU frame submission.
4. **ForceGraph (Rendering)** -- D3-force computes positions headlessly; React renders SVG nodes and links.
5. **ParameterPanel (Controls)** -- Schema-driven auto-generation of sliders, toggles, dropdowns, color pickers.
6. **PlaybackBar (Controls)** -- Play/pause/step/speed/reset. The minimum user interaction surface.
7. **TimelineScrubber (Controls)** -- Seeks through history ring buffer. Enables the "rewind simulation" differentiator.
8. **StatsPanel / MiniChart / EventLog / EntityInspector (Data)** -- Read-only derived analytics, throttled rendering.

### Critical Pitfalls

1. **React Strict Mode double-mount destroys Canvas/WebGL state** -- Use `useLayoutEffect` for rAF loops (synchronous cleanup). Store frame IDs in refs. Gate WebGL context creation behind an `initialized.current` flag. Test every rendering component in Strict Mode.

2. **Vite library mode bundles peer dependencies into output** -- Externalize all peer deps via regex in `build.rollupOptions.external`. Verify with `vite-bundle-visualizer` after every build. Test with a consumer app that imports one component -- if bundle exceeds 50KB, something is wrong.

3. **Tailwind classes purged by consumer builds** -- Compile Tailwind to static CSS at library build time. Ship `dist/styles.css` that consumers import. Never rely on consumers running Tailwind to generate library styles.

4. **D3-force simulation leaks on data updates** -- Create the simulation once in a `useRef`. On data changes, update nodes/links in place and call `restart()`. Always call `simulation.stop()` in cleanup. Never let D3 touch the DOM.

5. **Zustand store triggers full tree re-render on tick** -- Never use `useStore()` without a selector. Rendering components use transient subscriptions (`store.subscribe()` or `store.getState()` in rAF). Split conceptually into "reactive" UI state and "transient" simulation state.

6. **Barrel file re-exports break tree-shaking** -- Use separate entry points per layer with `package.json` exports map. Set `"sideEffects": ["*.css"]`. Verify with a test app importing a single component.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Build Infrastructure + Core Engine
**Rationale:** Every component depends on the Zustand store, tick loop, and history system. The Vite library build config (externals, entry points, CSS strategy) must be validated before any component work -- retrofitting externals across 18 components is error-prone. This phase eliminates the three highest-risk pitfalls (peer dep bundling, CSS purging, tree-shaking).
**Delivers:** SimulationProvider, useSimulation hook, tick loop, ring buffer, Vite library config with 5 entry points, CSS custom property theming system, test consumer app validation.
**Addresses features:** SimulationProvider (the architectural backbone), TypeScript types, tree-shakable exports, CSS custom property theming, dark theme default.
**Avoids pitfalls:** #1 (Strict Mode), #3 (peer dep bundling), #4 (Tailwind purging), #6 (barrel files), #7 (store re-renders), #11 (CSS bloat), #14 (ring buffer memory).

### Phase 2: Canvas Rendering Foundation
**Rationale:** Visual output is needed to verify that the core engine works. GridCanvas is the primary visualization surface for 2 of 3 demos and the most common simulation topology. Pan/zoom is table stakes for any canvas visualization.
**Delivers:** CanvasRenderer (generic host with pan/zoom), GridCanvas (dirty-rect optimized), color ramp utilities.
**Addresses features:** Canvas rendering surface, grid visualization (500x500 at 30fps), pan/zoom, built-in color ramps.
**Avoids pitfalls:** #1 (Strict Mode canvas cleanup), #8 (Canvas memory leaks), #15 (coordinate transform conflicts).

### Phase 3: Core Controls
**Rationale:** Users cannot interact with a simulation without playback controls and parameter inputs. Controls are standard React components (no canvas/WebGL complexity) and depend only on the core store.
**Delivers:** PlaybackBar, ParameterPanel (schema-driven), PresetSelector (named presets).
**Addresses features:** Play/pause/step/speed/reset, auto-generated parameter panel, number slider, boolean toggle, dropdown, color picker, collapsible folders, preset system.
**Avoids pitfalls:** #12 (TypeScript generics for schema-driven components).

### Phase 4: Advanced Rendering
**Rationale:** WebGL2 particles and D3-force graphs are isolated, high-complexity components that enable the remaining 2 demos. They can be built independently since they only depend on the core store. The WebGL2 particle renderer is the marketing hero and must look striking.
**Delivers:** ParticleRenderer (WebGL2 + Canvas2D fallback), ForceGraph (D3-force + React SVG).
**Addresses features:** WebGL2 particle renderer (100k particles), D3-force graph with React SVG, entity selection/click handling.
**Avoids pitfalls:** #2 (D3-force simulation leaks), #5 (WebGL context limit), #8 (WebGL memory leaks), #9 (D3 mutation conflicts).

### Phase 5: Data Layer + Timeline
**Rationale:** Data components are read-only (they never write to the store, so nothing depends on them). The timeline scrubber is the highest-value differentiator and depends on the history ring buffer from Phase 1. Recharts integration needs throttling design before it touches the main thread.
**Delivers:** StatsPanel, MiniChart (Recharts sparklines), EventLog, EntityInspector, TimelineScrubber, HeatmapOverlay.
**Addresses features:** Live stats display, sparkline charts, event log with filtering, entity inspector, timeline scrubber with history, heatmap overlay.
**Avoids pitfalls:** #10 (Recharts re-renders killing frame rate -- throttle to 2-5fps).

### Phase 6: Demos + Storybook + Polish
**Rationale:** The three demo simulations are integration work requiring all layers. They are the primary sales tool on Gumroad -- buyers need to see predator-prey, particle flocking, and social network in action before paying $49. Storybook documentation is how buyers evaluate the kit. This phase is where tier separation ($29 vs $49) is finalized.
**Delivers:** 3 complete demo simulations, Storybook stories for all 18 components, tier-separated packaging, final build validation.
**Addresses features:** Working demos (3), Storybook documentation, tier-separated packaging.
**Avoids pitfalls:** #5 (WebGL context limits in Storybook Docs view), #13 (Storybook CSS isolation).

### Phase Ordering Rationale

- **Core first** because every component subscribes to the Zustand store. The tick loop and history buffer are the architectural backbone.
- **Build infrastructure in Phase 1** (not deferred) because the three highest-risk pitfalls (#3, #4, #6) are all build config issues. Validating with a test consumer app before building 18 components prevents late-stage discovery of bundling failures.
- **Canvas rendering before controls** because visual feedback is needed to verify controls work correctly. You cannot test PlaybackBar without seeing the simulation run.
- **Controls before advanced rendering** because PlaybackBar is needed to test any renderer interactively.
- **Advanced rendering (WebGL2, D3-force) in its own phase** because these are the highest-complexity components with the most pitfalls. Isolating them prevents their complexity from blocking simpler components.
- **Data layer late** because it only reads state -- no other component depends on it. It can be built and tested independently.
- **Demos last** because they are pure integration work requiring all layers. They also serve as the final validation that everything works together.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 1 (Build Infrastructure):** Tailwind v4 compiled-to-static-CSS workflow needs validation. The Vite 7 + vite-plugin-lib-inject-css + Tailwind v4 interaction is not widely documented for library builds. Prototype the CSS pipeline early.
- **Phase 4 (Advanced Rendering - WebGL2):** WebGL2 instanced rendering with React lifecycle management is a niche integration. The shader code, buffer management, and context loss/restore handling will benefit from a spike/prototype before full implementation.
- **Phase 4 (Advanced Rendering - D3-force):** The "two data representations" pattern (immutable React state + mutable D3 simulation data) requires careful design to handle node additions/removals without graph reset.

Phases with standard patterns (skip deep research):
- **Phase 2 (Canvas Rendering):** Canvas2D dirty-rect optimization is a well-documented, canonical pattern. MDN and AG Grid blog posts provide complete implementation guidance.
- **Phase 3 (Controls):** Schema-driven form generation is a solved problem (Leva, Tweakpane, JSON Schema Form). Standard React component patterns apply.
- **Phase 5 (Data Layer):** Recharts sparklines are straightforward. The throttling pattern is the only non-trivial aspect.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies are production-stable with 12+ months of ecosystem adoption. Versions pinned to current stable releases. Only uncertainty is Tailwind v4 library distribution workflow. |
| Features | HIGH | Feature landscape is well-mapped against existing tools (Leva, Tweakpane, Theatre.js, AnyLogic). MVP vs differentiator vs anti-feature boundaries are clear. Competitive gap is validated. |
| Architecture | HIGH | Zustand transient updates + Canvas/WebGL rendering via refs is the established pattern for high-frequency React applications. 4-layer separation with unidirectional data flow is clean and testable. |
| Pitfalls | HIGH | 15 pitfalls identified with specific prevention strategies. Sources include official GitHub issues, library documentation, and community post-mortems. All critical pitfalls have concrete detection methods. |

**Overall confidence:** HIGH

### Gaps to Address

- **Tailwind v4 compiled-to-static-CSS build pipeline:** The recommended approach (use Tailwind during development, compile to plain CSS at build time) is sound in theory but not widely documented for Vite library mode. Needs a prototype in Phase 1 to validate the workflow. Fallback: ship Tailwind utility classes with `@source` directive documentation for Tailwind consumers + pre-built CSS for non-Tailwind consumers.
- **Ring buffer memory sizing for large grids:** A 500x500 grid at 30fps with 300 history snapshots using `Uint8Array` is ~75MB. Acceptable, but the snapshot interval and buffer capacity need to be configurable and documented. Consider diffing vs full snapshots -- full snapshots are simpler and fast enough with typed arrays.
- **WebGL2 Transform Feedback for 500k+ particles:** Deferred as a stretch goal. CPU-side position updates handle 100k at 60fps. If buyers need 500k+, transform feedback computes physics on the GPU. This is a post-v1 optimization that does not affect architecture.
- **Vite 8 migration timeline:** Vite 7.3 is the safe choice today. Monitor Vite 8.1+ for library-mode bug fixes. Plan migration for v1.1 or v1.2 timeframe. No architectural impact -- it is a build tool swap.
- **Storybook 10 + Vite 7 compatibility:** Storybook 10 uses Vite builder by default, but there is one tracked GitHub issue about Vite 8 compatibility. Vite 7 should work cleanly. Validate during Phase 1 setup.

## Sources

### Primary (HIGH confidence)
- [React v19 Official Blog](https://react.dev/blog/2024/12/05/react-19) -- ref cleanup, forwardRef removal
- [Vite 7.0 / 8.0 Announcements](https://vite.dev/blog/) -- library mode, Rolldown migration
- [Zustand GitHub](https://github.com/pmndrs/zustand) -- vanilla store API, transient subscriptions
- [D3-force Official Docs](https://d3js.org/d3-force/simulation) -- simulation lifecycle, tick events
- [MDN Canvas Optimization](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) -- dirty-rect, layering
- [Chromium WebGL Context Limit](https://issues.chromium.org/issues/40939743) -- 16 context hard limit
- [Vite Library Mode Dependencies Issue](https://github.com/vitejs/vite/issues/6780) -- peer dep bundling
- [Tailwind v4 Library Distribution Discussion](https://github.com/tailwindlabs/tailwindcss/discussions/17715) -- CSS strategy

### Secondary (MEDIUM confidence)
- [Recharts 3.0 Migration Guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide) -- v3 rewrite details
- [GPU-Accelerated Particles with WebGL 2](https://gpfault.net/posts/webgl2-particles.txt.html) -- instanced rendering
- [Tree-shakable library with Vite](https://dev.to/morewings/how-to-build-a-tree-shakable-library-with-vite-and-rollup-16cb) -- preserveModules, sideEffects
- [Zustand Re-render Discussion](https://github.com/pmndrs/zustand/discussions/2642) -- selector patterns

### Tertiary (LOW confidence)
- Vite 8 library-mode stability -- based on early user reports within days of release. Needs monitoring as patches ship.

---
*Research completed: 2026-03-18*
*Ready for roadmap: yes*
