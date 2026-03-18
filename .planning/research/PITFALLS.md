# Domain Pitfalls

**Domain:** React simulation/visualization component library (Canvas2D, WebGL2, D3-force, Zustand, Vite library-mode, Storybook)
**Researched:** 2026-03-18

---

## Critical Pitfalls

Mistakes that cause rewrites, shipping blockers, or fundamental architecture failures.

---

### Pitfall 1: React Strict Mode Double-Mount Destroys Canvas/WebGL State

**What goes wrong:** React 18+ StrictMode intentionally mounts, unmounts, and remounts components in development. Canvas and WebGL contexts get created, destroyed, and recreated. Animation loops started in `useEffect` fire a new `requestAnimationFrame` before the cleanup function runs (cleanup is asynchronous), causing ghost animation frames that reference destroyed contexts. WebGL shader programs, buffers, and textures allocated during the first mount leak because the teardown races with the second mount.

**Why it happens:** `useEffect` cleanup runs asynchronously -- a new rAF callback can be scheduled between the DOM update and cleanup execution. Developers test in production mode where StrictMode double-mount does not occur, so the bug is invisible until someone runs the dev server.

**Consequences:** Ghost animation loops consume CPU. WebGL buffers accumulate. Canvas rendering flickers or crashes in development. Users of the library who run StrictMode (the React default) see broken behavior on first use.

**Prevention:**
- Use `useLayoutEffect` (not `useEffect`) for `requestAnimationFrame` loops -- it runs synchronously after DOM mutation, ensuring `cancelAnimationFrame` fires before a new frame can be scheduled.
- Store animation frame IDs in a `useRef`, not in local variables, so cleanup always cancels the correct frame.
- For WebGL: gate context creation behind a ref flag (`initialized.current`) that survives remount. On cleanup, call `gl.getExtension('WEBGL_lose_context')?.loseContext()` to force GPU resource release.
- For Canvas2D: clear the canvas in cleanup (`ctx.clearRect(0, 0, w, h)`) and nullify the context ref.
- Test every canvas/WebGL component in StrictMode during development. Never disable StrictMode to "fix" flickering.

**Detection:** Enable StrictMode in the Storybook preview. If any canvas component flickers, shows duplicate renders, or leaks memory on story navigation, this pitfall is active.

**Phase relevance:** Must be addressed in Phase 1 (core infrastructure) when building `SimulationProvider` and the base canvas hook. Every rendering component inherits this pattern.

---

### Pitfall 2: D3-Force Simulation Leaks on Data Updates

**What goes wrong:** Each call to `d3.forceSimulation()` creates a new simulation with an internal timer (via `d3-timer`). If a React component creates a new simulation on every data update (e.g., when nodes/links change), the old simulations are not garbage collected -- they keep running their tick handlers in the background. On frequent data updates, leaked simulations pile up and bring the app to a halt.

**Why it happens:** D3's force simulation mutates the dataset it receives (adding `x`, `y`, `vx`, `vy` properties). React developers instinctively create new objects on each render to avoid mutation. This creates new simulations each time instead of reusing the existing one. Additionally, `simulation.stop()` must be called explicitly -- it does not auto-stop when the reference is lost.

**Consequences:** CPU usage grows linearly with data updates. Browser tab becomes unresponsive after a few dozen updates. Memory grows unbounded because each simulation retains references to its node array.

**Prevention:**
- Create the simulation exactly once in a `useRef`. On data changes, call `simulation.nodes(newNodes)` and `simulation.force('link').links(newLinks)` to update in place, then `simulation.alpha(1).restart()`.
- In the `useEffect` cleanup, call `simulation.stop()` unconditionally.
- Never let D3 touch the DOM. Use D3 only for force calculations; React renders SVG elements from the computed `x`/`y` positions. This is the approach specified in PROJECT.md and it is correct.
- Deep-clone node data before passing to D3 if you need immutable state elsewhere -- D3 will mutate whatever array you give it.

**Detection:** Open browser DevTools Performance tab. Run the NetworkGraph story with changing data. If you see multiple concurrent `d3-timer` callbacks in the flame chart, simulations are leaking.

**Phase relevance:** Phase 2 (rendering layer) when building the D3-force NetworkGraph component. Must be baked into the component design from the start.

---

### Pitfall 3: Vite Library Mode Bundles Peer Dependencies Into Output

**What goes wrong:** Vite's library mode, by default, bundles all dependencies into the output. If `react`, `react-dom`, `zustand`, `recharts`, and `d3-*` are not explicitly externalized, they get included in the library bundle. Consumers then load two copies of React (one from the library, one from their app), which crashes React's hook system ("Invalid hook call" error) or at minimum doubles bundle size.

**Why it happens:** Vite uses Rollup under the hood for library builds, and Rollup bundles everything unless told otherwise. The `build.rollupOptions.external` field must list every peer dependency. Transitive dependencies of peer dependencies are also bundled unless externalized -- for example, D3's sub-modules (`d3-selection`, `d3-transition`, etc.) may get pulled in even when `d3-force` is externalized.

**Consequences:** "Invalid hook call" errors for consumers. Bundle size 5-10x larger than expected. Multiple React instances break context, refs, and hooks. This is a shipping blocker -- buyers cannot use the library.

**Prevention:**
- Explicitly list all peer dependencies in `build.rollupOptions.external` as a regex: `/^react($|\/)/, /^react-dom($|\/)/, /^zustand($|\/)/, /^recharts($|\/)/, /^d3-/`.
- Use `rollup-plugin-peer-deps-external` or manually read `peerDependencies` from `package.json` to auto-externalize.
- After every build, inspect the output with `npx vite-bundle-visualizer` or check the file size. If `dist/index.js` exceeds ~100KB, something is being bundled that should not be.
- Set `"sideEffects": false` in `package.json` to enable consumer-side tree-shaking.
- Verify with a test consumer app: `npm pack`, install locally, import one component, check that React is not duplicated in the consumer's bundle.

**Detection:** Build the library and check `dist/` file sizes. A single component import pulling more than 50KB (excluding CSS) indicates bundled dependencies.

**Phase relevance:** Phase 1 (build infrastructure). The Vite config must be correct before any component is built. Retrofitting externals after 18 components are built is error-prone.

---

### Pitfall 4: Tailwind Classes Purged by Consumer Builds

**What goes wrong:** Tailwind generates CSS by scanning source files for class names. When a library ships Tailwind class names in its JSX, the consumer's Tailwind build does not scan `node_modules` by default. Result: all library styles are purged. Components render with no styling.

**Why it happens:** Tailwind's content scanner only looks at paths configured in `tailwind.config.js`. Library code in `node_modules/` is never included by default. Even if consumers add the library to their content paths, Tailwind v4's CSS-first configuration makes this non-obvious.

**Consequences:** Components appear completely unstyled in consumer apps. Buyers think the library is broken. Support burden is massive.

**Prevention:**
- Use CSS custom properties (`--sim-*` namespace) for theming, not Tailwind utilities for visual styling. This is already the plan per PROJECT.md -- enforce it strictly.
- Use Tailwind only for layout utilities (flex, grid, spacing) that are compiled into a shipped CSS file. Run Tailwind at library build time and emit a `styles.css` that consumers import.
- Do NOT rely on consumers running Tailwind to generate library styles. The library's CSS must be self-contained.
- Ship a pre-built CSS file (`dist/styles.css`) that consumers import: `import 'simulation-bundle/styles.css'`.
- If using Tailwind v4: be aware the Vite plugin scans from `cwd`, which may pick up demo/test files. Configure the `@source` directive to only include `src/`.

**Detection:** Create a test consumer app that does NOT use Tailwind. Import a component. If it has no styling, this pitfall is active.

**Phase relevance:** Phase 1 (build infrastructure). The CSS strategy must be decided before any component is styled.

---

### Pitfall 5: WebGL Context Limit Exhaustion in Storybook

**What goes wrong:** Browsers enforce hard limits on active WebGL contexts: Chrome allows ~16 concurrent contexts (30 on some configurations), Firefox allows ~16. Storybook's Docs view renders multiple stories inline on a single page. Each story with a WebGL component creates a new context. With 5+ WebGL stories visible, older contexts are silently lost. The particle system and any WebGL-based component go blank.

**Why it happens:** Storybook's Docs page renders all stories for a component simultaneously in iframes or inline. Each `<canvas>` with a WebGL context counts toward the browser limit. WebGL contexts are not reclaimed by GC until the canvas element is removed from the DOM, and Storybook keeps story canvases alive.

**Consequences:** WebGL stories show blank canvases or "context lost" errors in Storybook Docs view. Developers think the components are broken. The issue is invisible in Canvas (single-story) view.

**Prevention:**
- Add `webglcontextlost` and `webglcontextrestored` event listeners to every WebGL canvas. On context loss, pause rendering. On restore, reinitialize shaders and buffers.
- In Storybook, set WebGL stories to `inline: false` (forces iframe isolation) or limit Docs to show only one WebGL story at a time.
- Implement a WebGL context manager singleton that tracks active contexts and disposes the least-recently-used one when approaching the limit.
- For the particle system component: accept a `paused` prop and release the WebGL context when paused (call `loseContext()` extension).
- In Storybook decorators, add an IntersectionObserver that pauses WebGL components when they scroll out of view.

**Detection:** Open the Storybook Docs page for the particle system. Scroll through multiple stories. Check browser console for "Too many active WebGL contexts" warnings.

**Phase relevance:** Phase 2 (rendering layer) when building WebGLParticles, and Phase 4 (Storybook integration). Must be designed into the WebGL components early.

---

### Pitfall 6: Barrel File Re-exports Break Tree-Shaking

**What goes wrong:** A common pattern in component libraries is a barrel file (`index.ts`) that re-exports everything: `export * from './SimulationProvider'`. When consumers import one component, bundlers (especially webpack) parse the entire barrel, pulling in all components and their dependencies. A consumer who only needs `ParameterPanel` ends up bundling the WebGL particle system, D3-force, and the entire rendering layer.

**Why it happens:** Star re-exports from barrel files create ambiguous export chains that prevent bundlers from safely eliminating unused modules. CSS imports in any module create side effects that further block tree-shaking. If even one module in the barrel has a side effect (e.g., a top-level `console.log`, a polyfill, or a CSS import), the entire barrel is marked as having side effects.

**Consequences:** Bundle size for consumers is 5-20x larger than necessary. Consumers import `ParameterPanel` and get 500KB of WebGL code. This defeats the purpose of the per-layer entry points specified in PROJECT.md.

**Prevention:**
- Use separate entry points per layer as planned: `core`, `rendering`, `controls`, `data`, `demos`. Each gets its own entry in `package.json` `exports` field.
- Within each layer, avoid barrel files. Use direct path imports: `import { ParameterPanel } from 'simulation-bundle/controls'`.
- Set `"sideEffects": ["*.css"]` in `package.json` -- this tells bundlers that only CSS files have side effects, everything else is safe to tree-shake.
- Configure Vite to output individual chunks per component using `rollupOptions.output.preserveModules: true`.
- Verify tree-shaking works: create a test app that imports one component, build it, and check the bundle does not contain unrelated components.

**Detection:** Import a single component from the library in a fresh Vite app. Run `npx vite-bundle-visualizer`. If modules from unrelated layers appear in the bundle, tree-shaking is broken.

**Phase relevance:** Phase 1 (build infrastructure). The `package.json` exports map and Vite config must support per-layer entry points from the start.

---

## Moderate Pitfalls

Issues that cause significant rework or performance problems but are recoverable.

---

### Pitfall 7: Zustand Store Triggers Full Component Tree Re-render on Tick

**What goes wrong:** The simulation tick loop updates state 30-60 times per second. If components subscribe to the entire Zustand store (e.g., `const state = useSimStore()`), every tick re-renders the entire component tree. A 500x500 grid simulation updating at 30fps triggers 30 full re-renders per second across all subscribed components, causing dropped frames and janky UI.

**Why it happens:** Zustand uses shallow comparison by default. `useStore()` without a selector returns the entire state object, which is a new reference on every update. Even `useStore(state => state.entities)` re-renders if the entities array reference changes (which it does on every tick when entities move).

**Prevention:**
- Never use `useStore()` without a selector. Enforce this with a lint rule or wrapper hook.
- Use transient updates for high-frequency data. The simulation tick should write to a mutable ref (not React state) and imperatively update canvas/WebGL. React state is only for UI controls (play/pause, speed, selected entity).
- Split the store into two layers: a "reactive" store for UI state (triggers re-renders) and a "transient" store for simulation state (read via `subscribe` or `getState()`).
- For components that must read simulation state (e.g., StatsPanel), use `useStore` with a granular selector and `shallow` equality: `useStore(s => s.stats, shallow)`.
- The tick loop should call `store.setState()` for the ring buffer and current tick, but canvas rendering should read from `store.getState()` inside the rAF callback, not from React props.

**Detection:** Open React DevTools Profiler. Run the simulation. If `SimulationProvider` or wrapper components show >10 re-renders per second, selectors are too broad.

**Phase relevance:** Phase 1 (core) when designing `SimulationProvider` and the Zustand store shape. This is an architectural decision, not a fix-later optimization.

---

### Pitfall 8: Canvas/WebGL Memory Leaks on Component Unmount

**What goes wrong:** When a canvas or WebGL component unmounts (e.g., navigating between stories, switching demos), GPU resources (textures, buffers, programs, framebuffers) and CPU resources (ImageData arrays, offscreen canvases, typed arrays for vertex data) are not released. Repeated mount/unmount cycles (common in Storybook and SPAs) cause memory to grow by 40-80MB per WebGL mount.

**Why it happens:** JavaScript garbage collection does not track GPU resources. WebGL buffers, textures, and programs persist until explicitly deleted with `gl.deleteBuffer()`, `gl.deleteTexture()`, `gl.deleteProgram()`. Canvas 2D `ImageData` allocations may be held by closures in animation loops. `OffscreenCanvas` references prevent GC if any callback holds a reference.

**Prevention:**
- Create a `useWebGLCleanup` hook that registers all allocated GL resources and deletes them on unmount:
  ```
  // Track every allocation
  const buffers = useRef<WebGLBuffer[]>([])
  const textures = useRef<WebGLTexture[]>([])
  // On unmount: delete all, then loseContext()
  ```
- For Canvas2D: nullify `ImageData` references and clear the canvas in cleanup.
- Use `WeakRef` for any callback that captures large typed arrays.
- In the rAF loop, check an `isRunning.current` ref before allocating new buffers or ImageData.
- Profile with Chrome DevTools Memory tab: take heap snapshots before and after mounting/unmounting a WebGL component 10 times. Retained size should not grow.

**Detection:** In Storybook, navigate between WebGL stories 20 times. Check browser task manager -- memory should stabilize, not grow linearly.

**Phase relevance:** Phase 2 (rendering layer). Must be part of the WebGLParticles component design. Retrofit is possible but painful.

---

### Pitfall 9: D3-Force Node Position Mutation Conflicts with React Immutability

**What goes wrong:** `d3.forceSimulation` mutates the objects in the array passed to `.nodes()`. It adds `x`, `y`, `vx`, `vy`, and `index` properties directly on each node object. If the same object references are used in React state, React cannot detect changes (the reference is the same), OR if React re-creates the objects on render, D3 loses its computed positions and the graph "resets" to (0,0) on every state update.

**Why it happens:** D3 was designed before React. It assumes full ownership of the data objects it receives. React assumes data is immutable. These two assumptions are fundamentally incompatible.

**Prevention:**
- Maintain two separate data representations: "source data" in React state (immutable, serializable) and "simulation data" in a `useRef` (mutable, owned by D3).
- When source data changes, merge new properties into the existing simulation nodes (preserving `x`, `y`, `vx`, `vy`) rather than replacing the array.
- Use a `nodeId` function to match source nodes to simulation nodes during merges.
- Render SVG elements by reading positions from the simulation ref during the rAF tick callback, not from React state.
- Never store D3-computed positions in React state. They change every tick and would cause 60 re-renders/second.

**Detection:** Update the network graph data (add/remove a node). If the entire graph jumps to the center and re-layouts from scratch, this pitfall is active.

**Phase relevance:** Phase 2 (rendering layer) when building NetworkGraph.

---

### Pitfall 10: Recharts Re-renders Kill Simulation Frame Rate

**What goes wrong:** MiniChart (sparkline) components using Recharts are updated with new data on every simulation tick. Recharts renders SVG, creating DOM nodes for each data point. At 30fps with 100+ data points, React is creating/diffing/destroying hundreds of SVG DOM nodes per frame. The main thread is saturated with DOM work, starving the canvas/WebGL rendering loop of CPU time.

**Why it happens:** Recharts is React-native (renders via JSX/SVG), which is great for interactivity but expensive for high-frequency updates. SVG-based charts create one DOM element per data point -- at scale, DOM operations dominate frame time.

**Prevention:**
- Throttle MiniChart updates to 2-5fps (every 200-500ms), not 30fps. Sparklines do not need real-time updates -- the human eye cannot distinguish sparkline changes faster than 5fps.
- Use `React.memo` with a custom comparison function that ignores data changes within the throttle window.
- Limit sparkline data to the last 50-100 points. Use a circular buffer, not an ever-growing array.
- Consider rendering sparklines on a small dedicated `<canvas>` instead of Recharts for the real-time case. Recharts is best for static/interactive charts, not 30fps streaming.
- If sticking with Recharts: isolate each MiniChart in its own React subtree so re-renders do not propagate to sibling components.

**Detection:** Run the Profiler while a simulation with 3+ MiniCharts is active. If Recharts components dominate the flame chart, this pitfall is active.

**Phase relevance:** Phase 3 (data visualization layer) when building MiniChart and StatsPanel. Design the throttle mechanism before integrating Recharts.

---

### Pitfall 11: Vite Library Mode CSS Code-Splitting Bloat

**What goes wrong:** When using `cssCodeSplit: true` (the Vite default for library mode), each component gets its own CSS chunk. If Tailwind is used, duplicate utility classes are emitted in every chunk. A `.flex` class used in 10 components appears in 10 CSS files. Total CSS size grows 3-5x compared to a single bundled stylesheet.

**Why it happens:** Vite/Rollup code-splits CSS per entry point. Tailwind utilities are duplicated because each chunk must be self-contained. There is no shared CSS chunk mechanism in library mode.

**Prevention:**
- Emit a single CSS file (`cssCodeSplit: false`) for the entire library. Consumers import one stylesheet.
- Since the library uses CSS custom properties for theming (not Tailwind utilities for visual design), the CSS payload should be small anyway -- mostly layout utilities and `--sim-*` variable declarations.
- If per-layer CSS is needed for tier separation ($29 vs $49), emit one CSS file per layer entry point, not per component.
- Minimize Tailwind utility usage in library source. Prefer CSS custom properties and a small handwritten stylesheet for component-specific styles.

**Detection:** Build the library and count CSS files in `dist/`. If there are more CSS files than entry points, code-splitting is too granular. Check total CSS size -- if it exceeds 50KB for a 18-component library, duplication is likely.

**Phase relevance:** Phase 1 (build infrastructure). CSS strategy is a build config decision.

---

## Minor Pitfalls

Issues that cause inconvenience or minor bugs but are easily fixable.

---

### Pitfall 12: TypeScript Strict Mode + Generic Component Props

**What goes wrong:** Generic simulation components (e.g., `SimulationProvider<TState>`, `ParameterPanel<TParams>`) require careful TypeScript patterns. With `strict: true`, common issues include: inference failing when generic defaults are used with `React.FC`, `forwardRef` not supporting generics natively, and consumers needing explicit type annotations that feel boilerplate-heavy.

**Prevention:**
- Do not use `React.FC` for generic components. Use plain function declarations: `function ParameterPanel<T extends ParamSchema>(props: PanelProps<T>)`.
- For `forwardRef` with generics, use the "as" pattern or a wrapper function that preserves the generic parameter.
- Provide sensible generic defaults (`<T = DefaultState>`) so consumers can use components without specifying types for simple cases.
- Export all prop types, state types, and utility types from the public API. Consumers will need them for advanced use.
- Test the DX: write a consumer TypeScript file that uses the components with and without explicit generics. If red squiggles appear or inference fails, fix the types.

**Detection:** Write a `test-types.ts` file (not executed, just type-checked) that exercises the public API with and without explicit generic parameters.

**Phase relevance:** All phases, but the generic patterns must be established in Phase 1 (core types) and consistently applied throughout.

---

### Pitfall 13: Storybook Iframe CSS Isolation Breaks Component Styles

**What goes wrong:** Storybook's Docs view renders stories inline (not in iframes by default in Storybook 8). Storybook injects its own CSS (resets, typography) that can conflict with library component styles. The `--sim-*` custom properties may be overridden or not inherited because of Storybook's shadow DOM or iframe boundaries.

**Prevention:**
- Use a Storybook decorator that wraps every story in a container element with the library's CSS custom properties set explicitly.
- For Canvas/WebGL stories, configure `parameters.docs.canvas.sourceState = 'shown'` but consider setting `inline: false` to force iframe rendering for isolation.
- Test stories in both Canvas view (single story) and Docs view (all stories) -- they render differently.
- Include a "Theming" story that demonstrates how to override `--sim-*` variables.

**Detection:** Compare component rendering between Storybook Canvas view and Docs view. If they look different, CSS isolation is broken.

**Phase relevance:** Phase 4 (Storybook). Address when setting up Storybook configuration.

---

### Pitfall 14: Ring Buffer / History Allocation Pressure

**What goes wrong:** The `SimulationProvider` spec calls for a history ring buffer for timeline scrubbing. If each history entry stores a full deep copy of the simulation state (e.g., 250,000 cells for a 500x500 grid), and the buffer holds 1000 frames, that is 250 billion cells in memory. Even with typed arrays, this is ~1GB for a single simulation.

**Prevention:**
- Store state diffs, not full snapshots. Only record cells that changed between ticks.
- For grid simulations: use a `Uint8Array` or `Float32Array` for cell state, not objects. A 500x500 grid is 250KB as a `Uint8Array` vs ~50MB as an array of objects.
- Limit ring buffer capacity based on available memory. Start with 100-300 frames, not 1000.
- For timeline scrubbing: reconstruct intermediate states by replaying diffs from the nearest full snapshot (periodic keyframing).
- Consider structural sharing (copy-on-write) if using object-based state.

**Detection:** Run a 500x500 grid simulation for 60 seconds. Check browser task manager memory. If it exceeds 500MB, the ring buffer is too large or storing full copies.

**Phase relevance:** Phase 1 (core) when designing the SimulationProvider's history mechanism. This is an architecture decision.

---

### Pitfall 15: Pan/Zoom Transform Conflicts Between React Events and Canvas Coordinates

**What goes wrong:** The CanvasRenderer supports pan/zoom via mouse events. When CSS transforms or canvas transforms are used for zoom, mouse event coordinates (`clientX`/`clientY`) no longer correspond to canvas pixel coordinates. Click targets, entity selection, and hover tooltips all break because the coordinate transformation is not applied consistently.

**Prevention:**
- Maintain a single transform matrix (scale + translation) in the Zustand store or a ref.
- Create utility functions `screenToCanvas(x, y, transform)` and `canvasToScreen(x, y, transform)` used by ALL mouse event handlers.
- Apply the transform via `ctx.setTransform()` for rendering, but always convert mouse events through the inverse transform for hit-testing.
- Do not mix CSS transforms (on the `<canvas>` element) with canvas context transforms (`ctx.scale()`). Pick one. Canvas context transforms are more precise and avoid sub-pixel rendering issues.

**Detection:** Zoom into a simulation and click on an entity. If the click registers at the wrong position, coordinate transformation is inconsistent.

**Phase relevance:** Phase 2 (rendering layer) when building CanvasRenderer with pan/zoom.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Build infrastructure (Vite config) | Peer deps bundled (#3), CSS bloat (#11), tree-shaking broken (#6) | Configure externals, exports map, and CSS strategy first. Validate with a test consumer app before building components. |
| Core (SimulationProvider, Zustand) | StrictMode double-mount (#1), store re-renders (#7), ring buffer memory (#14) | Use transient updates pattern. Test in StrictMode. Profile memory with large grids. |
| Rendering (Canvas, WebGL, D3) | D3 simulation leaks (#2), WebGL memory leaks (#8), D3 mutation conflicts (#9), WebGL context limits (#5), coordinate transforms (#15) | Create shared cleanup hooks. Keep D3 data separate from React state. Add context lost/restored handlers. |
| Data visualization (Recharts) | Recharts frame rate (#10) | Throttle MiniChart updates. Consider canvas-based sparklines. |
| Storybook integration | WebGL context limits (#5), CSS isolation (#13) | Use iframe mode for WebGL stories. Add decorator for CSS custom properties. |
| TypeScript DX | Generic component inference (#12) | Establish generic patterns in Phase 1. Test DX with a `test-types.ts` file. |
| Tailwind styling | Consumer purge (#4), CSS duplication (#11) | Ship pre-built CSS. Minimize Tailwind utility usage in components. |

---

## Sources

### React + Canvas/WebGL Lifecycle
- [React Strict Mode double-render with useEffect](https://dev.to/andyb1979/what-is-react-strict-mode-and-why-is-my-application-double-re-rendering-5akj) -- MEDIUM confidence
- [requestAnimationFrame and useLayoutEffect vs useEffect](https://blog.jakuba.net/request-animation-frame-and-use-effect-vs-use-layout-effect/) -- HIGH confidence
- [React Three Fiber WebGLRenderer leak on unmount](https://github.com/pmndrs/react-three-fiber/issues/514) -- HIGH confidence (GitHub issue)
- [MDN: Canvas optimization](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) -- HIGH confidence

### D3 + React Integration
- [D3.js, React, and the struggle for the DOM](https://medium.com/@ecccs_FCC/d3-js-react-and-the-struggle-for-the-dom-116dd1045f22) -- MEDIUM confidence
- [D3 force simulation official docs](https://d3js.org/d3-force/simulation) -- HIGH confidence
- [D3-timer memory leak issue](https://github.com/d3/d3-timer/issues/24) -- HIGH confidence (GitHub issue)

### Zustand Performance
- [Breaking the Re-render Chain: Migration to Zustand (Trendyol)](https://medium.com/trendyol-tech/breaking-the-re-render-chain-our-migration-from-context-to-zustand-76d4998806d2) -- MEDIUM confidence
- [Zustand transient updates documentation](https://awesomedevin.github.io/zustand-vue/en/docs/advanced/transiend-updates) -- HIGH confidence
- [Zustand unexpected re-renders discussion](https://github.com/pmndrs/zustand/discussions/2642) -- MEDIUM confidence

### Vite Library Mode
- [Vite library mode bundles dependencies (critical blog post)](https://cmdcolin.github.io/posts/2025-02-23-vitelibrarymode/) -- HIGH confidence
- [Vite issue: dependencies of peer deps included in build](https://github.com/vitejs/vite/issues/6780) -- HIGH confidence (GitHub issue)
- [How to build a tree-shakable library with Vite](https://dev.to/morewings/how-to-build-a-tree-shakable-library-with-vite-and-rollup-16cb) -- MEDIUM confidence

### Tailwind in Libraries
- [Tailwind discussion: removing Tailwind from component library](https://github.com/tailwindlabs/tailwindcss/discussions/10774) -- HIGH confidence (official discussion)
- [Tailwind discussion: library mode CSS output](https://github.com/tailwindlabs/tailwindcss/discussions/17025) -- HIGH confidence (official discussion)

### Tree-Shaking
- [Practical guide against barrel files for library authors](https://dev.to/thepassle/a-practical-guide-against-barrel-files-for-library-authors-118c) -- HIGH confidence
- [How to make React component library tree shakeable](https://carlrippon.com/how-to-make-your-react-component-library-tree-shakeable/) -- MEDIUM confidence

### WebGL Context Limits
- [Chromium: 16 WebGL context limit](https://issues.chromium.org/issues/40939743) -- HIGH confidence (Chromium issue tracker)
- [OpenLayers: Too many active WebGL contexts](https://github.com/openlayers/openlayers/issues/16118) -- HIGH confidence (GitHub issue)

### Recharts Performance
- [Recharts performance guide](https://recharts.github.io/en-US/guide/performance/) -- HIGH confidence (official docs)
- [Recharts vs Chart.js for big data](https://www.oreateai.com/blog/recharts-vs-chartjs-navigating-the-performance-maze-for-big-data-visualizations/cf527fb7ad5dcb1d746994de18bdea30) -- MEDIUM confidence

### Storybook Issues
- [Storybook: preview iframe performance issues](https://github.com/storybookjs/storybook/issues/7859) -- HIGH confidence (GitHub issue)
- [Storybook: Docs page iframe limits](https://github.com/storybookjs/storybook/issues/25046) -- HIGH confidence (GitHub issue)
