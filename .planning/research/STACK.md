# Technology Stack

**Project:** Simulation Playground UI Kit
**Researched:** 2026-03-18
**Overall Confidence:** HIGH

## Executive Summary

The React ecosystem has matured significantly since the project spec was drafted. React 19.2.x is production-stable, Vite has reached v8 (Rolldown-powered), Storybook has jumped to v10, Tailwind has moved to v4 with CSS-first configuration, Recharts has shipped v3 with a full rewrite, and TypeScript 5.9/6.0 are current. This research pins specific versions and provides rationale for each choice, with special attention to library authoring concerns (tree-shaking, peer dependencies, CSS distribution, type generation).

The key strategic decisions are:
1. **Vite 7.3.x over Vite 8.0** for library builds -- Vite 8 has known library-mode bugs in its first weeks
2. **Tailwind v4 for internal development, CSS custom properties for consumer theming** -- avoids the Tailwind-in-library distribution headache
3. **Recharts 3.x** over v2 -- better state management, fewer dependencies, custom component support
4. **Storybook 10.x** over v8 -- current stable, ESM-only, better React docgen

---

## Recommended Stack

### Core Framework

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| React | ^19.2.0 | UI framework | Production-stable since Dec 2024. v19.2.4 is latest (Jan 2026). 48% daily users already on v19. Callback ref cleanup functions are valuable for Canvas/WebGL resource management. No forwardRef needed (ref as prop). | HIGH |
| React DOM | ^19.2.0 | DOM rendering | Paired with React 19. | HIGH |
| TypeScript | ~5.9.0 | Type system | TS 5.9 is latest stable release. TS 6.0 RC just shipped (March 6, 2026) but is too fresh for production tooling. Pin to 5.9.x for stability; upgrade to 6.0 after GA. | HIGH |

**Why React 19 over 18:** React 19 is no longer bleeding-edge -- it has been stable for 15+ months. The ref cleanup functions are directly useful for Canvas/WebGL teardown. The removal of forwardRef simplifies the component library API. Strict mode double-invocation of ref callbacks surfaces resource leaks during development. No reason to stay on 18.

### Build Tooling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vite | ~7.3.0 | Dev server + library bundler | Vite 7 is the current LTS-equivalent (receives important fixes + security patches). Vite 8 (released ~March 13, 2026) replaces Rollup with Rolldown -- has known library-mode build failures in early reports. Use Vite 7.3.x for reliable library builds. Upgrade to Vite 8 after 8.1+ stabilizes. | HIGH |
| vite-plugin-dts | ^4.0.0 | .d.ts generation | Standard plugin for generating TypeScript declaration files from library builds. Use `rollupTypes: true` to consolidate per-entry declarations. Prefer vite-plugin-dts over unplugin-dts for a Vite-only project (simpler config). | HIGH |
| vite-plugin-lib-inject-css | ^2.0.0 | CSS-to-JS association | Adds `import './chunk.css'` to generated JS chunks, so consumers get CSS automatically per-entry. Uses import statements (not runtime injection), so it is SSR-safe. Critical for multi-entry library builds with per-layer CSS. | HIGH |

**Why Vite 7 over Vite 8:** Vite 8's Rolldown bundler is a generational leap (10-30x faster builds), but it was released days ago. Multiple reports of library-mode build failures (`missing field 'code'` errors). The Vite team recommends a staged migration for complex projects. Vite 7.3.x is mature, well-tested, and fully supports library mode with Rollup. Plan to migrate to Vite 8.1+ once library-mode bugs are patched.

**Why Vite 7 over Vite 6:** The question asked about Vite 6 -- Vite 6 is no longer receiving patches. Vite 7 is the actively maintained stable line. Vite 7 dropped deprecated features (Sass legacy API, splitVendorChunkPlugin) and updated default browser targets. No reason to use Vite 6.

### State Management

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Zustand | ^5.0.12 | Simulation state + tick loop | Latest stable. Actively maintained (v5.0.12 released March 2026). Lightweight (~2KB), hook-first API, Flux-inspired without boilerplate. Built-in `subscribeWithSelector` middleware for granular tick subscriptions. `persist` middleware for saving simulation presets. Composable middleware stack. | HIGH |

**Why Zustand 5 over alternatives:**
- **vs Redux Toolkit:** RTK adds ~12KB+ and enforces action/reducer boilerplate that is overkill for simulation tick state. Zustand's `set()` function maps directly to "update state each tick" without dispatching actions.
- **vs Jotai:** Jotai is atom-based (bottom-up), better for forms/independent state. Simulation state is a single coherent blob (tick count, entity positions, parameters, history buffer) -- Zustand's single-store model fits naturally.
- **vs React Context:** Context re-renders all consumers on any state change. A 60fps tick loop updating positions would re-render the entire tree. Zustand's selector-based subscriptions let the Canvas component subscribe only to entity positions while the stats panel subscribes only to aggregate metrics.
- **vs Zustand 4:** Zustand 5.0 has been stable since late 2024. v5.0.10 fixed persist middleware state inconsistencies. No reason to pin v4.

### Styling

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Tailwind CSS | ^4.2.0 | Internal layout utilities | v4.2.1 is latest. CSS-first configuration with `@theme` directive. 5x faster full builds. All theme tokens are CSS custom properties automatically. Use for internal component layout during development. | MEDIUM |
| CSS Custom Properties | -- | Consumer theming API | The `--sim-*` namespace for consumer overrides. This is the public theming contract -- buyers change CSS vars, not Tailwind config. | HIGH |

**Tailwind v4 library distribution strategy:**

This is the most nuanced decision in the stack. Tailwind v4 in a distributed npm library has known pain points:
1. Consumer must also use Tailwind v4 (version lock-in)
2. Consumer must add `@source` directive pointing to node_modules (leaky abstraction)
3. Double Tailwind CSS rules if library ships `@import "tailwindcss"`
4. Preflight styles bleed into consumer components

**Recommended approach:** Use Tailwind v4 during development for rapid layout authoring, but **compile Tailwind classes to static CSS at build time**. The built library ships plain CSS files (not Tailwind utility classes). Consumers import CSS and override `--sim-*` custom properties. This decouples the library from requiring consumers to use Tailwind at all.

If this proves too constraining (some internal Tailwind classes don't compile cleanly), fall back to: ship Tailwind classes + document `@source` directive for Tailwind v4 consumers, and provide a pre-built CSS file for non-Tailwind consumers.

**Why Tailwind v4 over v3:** If using Tailwind at all, v4 is the right choice. v3 is in maintenance mode. v4's CSS-first config with `@theme` maps naturally to the `--sim-*` custom property system. The 5x build performance is a nice bonus. v4's `@property` registration enables typed custom properties with fallbacks.

### Charts

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Recharts | ^3.8.0 | MiniChart sparklines + stats panels | v3.8.0 is latest. v3.0 was a full state management rewrite with 3,500+ tests. Removed react-smooth and recharts-scale dependencies (smaller bundle). Added `responsive` prop (no more ResponsiveContainer wrapper). Custom component support. Tree-shakable -- import only LineChart, AreaChart as needed. | HIGH |

**Why Recharts 3 over alternatives:**
- **vs Recharts 2:** Recharts 2 is legacy. v3 has fewer dependencies, better state management, custom component support, and the responsive prop. The migration guide is straightforward.
- **vs Nivo:** Nivo offers more chart types and better pre-built styling, but it is heavier (~50+ packages in the @nivo scope). For sparklines and simple stats, Recharts is lighter and more composable.
- **vs visx:** visx gives raw D3 primitives in React -- maximum control but maximum effort. For the MiniChart sparkline use case, Recharts provides exactly what is needed with 10x less code. visx makes sense only if building a bespoke charting system.
- **vs lightweight alternatives (uPlot, Chart.js):** These are Canvas-based and don't compose with React's rendering model as naturally. Recharts is SVG-based and declarative.

### Graph Layout

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| d3-force | ^3.0.0 | Force-directed graph physics | v3.0.0 is latest (stable since 2021, no updates needed -- the physics algorithm is complete). Use as a headless layout engine only: feed it nodes/links, get back x/y positions. React renders the SVG. | HIGH |
| d3-quadtree | ^3.0.1 | Spatial indexing for force simulation | Dependency of d3-force. Useful for collision detection in the particle demo too. | HIGH |

**Integration pattern (D3-force + React):**

Use D3-force as a **data source**, not a DOM manipulator:

```typescript
// Pattern: D3 computes positions, React renders
const simulation = d3.forceSimulation(nodes)
  .force('charge', d3.forceManyBody())
  .force('link', d3.forceLink(links))
  .on('tick', () => {
    // Update Zustand store or local state with new positions
    setNodePositions(nodes.map(n => ({ id: n.id, x: n.x, y: n.y })));
  });

// React renders SVG from position state
return (
  <svg>
    {nodePositions.map(n => <circle key={n.id} cx={n.x} cy={n.y} r={5} />)}
  </svg>
);
```

**Do NOT** let D3 touch the DOM. D3 is the physics engine; React is the renderer. Store simulation reference in a `useRef` for lifecycle management. Use React 19's ref cleanup to stop the simulation on unmount.

**Why not react-force-graph:** It couples Canvas/WebGL rendering with D3 layout. The project spec requires React SVG rendering with D3 layout only, which gives buyers more control over node/link appearance.

### WebGL / Canvas

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| WebGL2 (native API) | -- | Particle system (100k particles) | Use raw WebGL2 with instanced rendering. No wrapper library needed -- the particle system is a single specialized component, not a general 3D scene. Instanced rendering with `drawArraysInstanced` handles 100k+ particles in a single draw call. | HIGH |
| Canvas 2D (native API) | -- | Grid rendering (500x500) | Use raw Canvas 2D with `getContext('2d')`. Dirty-rect optimization for partial redraws. ImageData for bulk pixel updates on the grid. | HIGH |

**Why raw WebGL2 over Three.js/react-three-fiber:**
- Three.js adds ~150KB+ to the bundle for a single particle component
- react-three-fiber adds a React reconciler on top of that
- The particle system needs: instanced quads, a vertex shader for positions, a fragment shader for colors/alpha. This is ~200 lines of WebGL2 code vs pulling in an entire 3D engine
- The project ships as a lightweight UI kit -- every KB of bundle matters for a $49 product

**WebGL2 React pattern:**

```typescript
// Canvas ref + WebGL lifecycle in useEffect
const canvasRef = useRef<HTMLCanvasElement>(null);
const glRef = useRef<WebGL2RenderingContext | null>(null);
const rafRef = useRef<number>(0);

useEffect(() => {
  const gl = canvasRef.current!.getContext('webgl2');
  glRef.current = gl;
  // Initialize shaders, buffers, instanced attributes
  // ...
  const render = () => {
    // Update instance buffer with new particle positions
    // gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, particleCount);
    rafRef.current = requestAnimationFrame(render);
  };
  render();

  // React 19 ref cleanup: return cleanup from ref callback
  return () => {
    cancelAnimationFrame(rafRef.current);
    // Dispose WebGL resources
  };
}, []);
```

**Key WebGL2 techniques for 100k particles:**
- **Instanced rendering:** One quad geometry, 100k instances. Position/color/size as per-instance attributes via `vertexAttribDivisor`.
- **Transform Feedback (stretch goal):** Compute particle physics on GPU. Can handle 500k-1M particles at 60fps. Defer to post-MVP if CPU-side updates hit performance ceiling.
- **Canvas2D fallback:** For browsers without WebGL2 (rare in 2026, but graceful degradation matters for a commercial product).

### Documentation / Development

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Storybook | ^10.2.0 | Component documentation + interactive playground | v10.2.19 is latest. ESM-only distribution. Uses Vite builder by default. React docgen for fast prop table generation. CSF (Component Story Format) for stories. Tag filtering for sidebar organization. | HIGH |
| @storybook/react-vite | ^10.2.0 | React + Vite framework adapter | First-party integration. Auto-configures Vite for Storybook. | HIGH |
| @storybook/addon-docs | ^10.2.0 | MDX documentation pages | Generates prop tables from TypeScript types. MDX support for component guides. | HIGH |

**Why Storybook 10 over Storybook 8:** The question referenced Storybook 8, but Storybook 10 is now stable (released in the 10.x line through 2025-2026). Storybook 8 is two major versions behind. Storybook 10 adds ESM-only distribution (aligns with the library's ES module output), CSF Factories (preview status), and better React docgen. The `@storybook/react-vite` framework works out of the box with Vite 7.

### Testing

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| Vitest | ^4.1.0 | Unit + component tests | v4.1.0 is latest. Native Vite integration (shares config). Browser Mode graduated to stable in v4.0. 2-5x faster than Jest. | HIGH |
| @testing-library/react | ^16.0.0 | React component test utilities | Standard React testing library. Works with Vitest. | HIGH |

### Supporting Libraries

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| @types/d3-force | ^3.0.0 | TypeScript types for d3-force | Always -- d3-force ships no built-in types | HIGH |
| @types/d3-quadtree | ^3.0.0 | TypeScript types for d3-quadtree | Always | HIGH |
| clsx | ^2.1.0 | Conditional class joining | When composing Tailwind utility classes in components | HIGH |

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Build tool | Vite 7.3 | Vite 8.0 | Library-mode build failures reported in first week of release. Revisit at Vite 8.1+. |
| Build tool | Vite 7.3 | tsup / Rollup standalone | tsup is simpler but lacks Vite's dev server (needed for Storybook + demos). Rollup alone requires more manual config. |
| State | Zustand 5 | Jotai | Atom-based model is wrong fit for coherent simulation state blob. |
| State | Zustand 5 | Redux Toolkit | Too much boilerplate for tick-loop state. Action dispatch overhead at 60fps. |
| Charts | Recharts 3 | visx | Over-engineered for sparklines. Would require building chart components from primitives. |
| Charts | Recharts 3 | Nivo | Heavier ecosystem. 50+ scoped packages. Overkill for MiniChart + sparklines. |
| Graphs | d3-force (headless) | react-force-graph | Couples rendering to Canvas/WebGL. Project needs React SVG rendering. |
| Graphs | d3-force (headless) | @antv/g6 | Enterprise graph viz library -- too heavy for a lightweight UI kit. |
| WebGL | Raw WebGL2 | Three.js / R3F | 150KB+ for a single particle component. Entire 3D engine for 2D instanced quads. |
| WebGL | Raw WebGL2 | PixiJS | Closer to the use case but still adds significant weight (~200KB). Raw WebGL2 for a single component is leaner. |
| Styling | Tailwind v4 + CSS vars | CSS Modules | CSS Modules work but lose the rapid utility-first authoring DX. Tailwind compiled to static CSS gives best of both. |
| Styling | Tailwind v4 + CSS vars | Styled Components / Emotion | Runtime CSS-in-JS adds bundle weight and performance overhead. Wrong direction for a performance-focused simulation library. |
| Storybook | Storybook 10 | Ladle | Ladle is lighter but has a fraction of the addon ecosystem. For a commercial product, Storybook's rich documentation features justify the weight. |
| TypeScript | 5.9 | 6.0 RC | TS 6.0 RC shipped March 6, 2026 -- too fresh. Wait for GA. |

---

## Version Pinning Strategy

```jsonc
// package.json - peer dependencies (consumer must provide)
{
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  }
}
```

```jsonc
// package.json - dependencies (bundled with library or external)
{
  "dependencies": {
    "zustand": "^5.0.0",
    "recharts": "^3.0.0",
    "d3-force": "^3.0.0",
    "d3-quadtree": "^3.0.0",
    "clsx": "^2.0.0"
  }
}
```

**Peer vs regular dependencies decision:**
- **react, react-dom:** Always peer deps. Consumer provides their own React.
- **zustand:** Listed as dependency but externalized in build. Consumer may or may not use Zustand. If they do, they get the library's Zustand store integration. If not, the SimulationProvider still works -- it is the library's internal store. Mark as both `dependency` AND `peerDependency` with the same range, externalize in Vite config.
- **recharts, d3-force, d3-quadtree:** Same pattern as Zustand -- external peer deps so consumers don't get duplicate copies.
- **clsx:** Small enough to bundle (330 bytes). Keep as regular dependency, do NOT externalize.

---

## Build Configuration

```typescript
// vite.config.ts (library mode)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { libInjectCss } from 'vite-plugin-lib-inject-css';

export default defineConfig({
  plugins: [
    react(),
    libInjectCss(),
    dts({
      rollupTypes: false, // Keep per-entry .d.ts files for tree-shaking
      tsconfigPath: './tsconfig.build.json',
    }),
  ],
  build: {
    lib: {
      entry: {
        'core': 'src/core/index.ts',
        'rendering': 'src/rendering/index.ts',
        'controls': 'src/controls/index.ts',
        'data': 'src/data/index.ts',
        'demos': 'src/demos/index.ts',
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'react',
        'react-dom',
        'react/jsx-runtime',
        'zustand',
        'zustand/middleware',
        'recharts',
        'd3-force',
        'd3-quadtree',
      ],
      output: {
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    },
    target: 'es2022',
    minify: false, // Let consumer minify
  },
});
```

**Key build decisions:**
- **ES modules only:** No CJS output. The React ecosystem has moved to ESM. Dual-format builds add complexity for zero benefit in 2026.
- **preserveModules:** Keeps the directory structure in output, enabling true tree-shaking. Consumer imports `@sim-kit/rendering` and only gets rendering code.
- **No minification:** The library ships unminified. Consumer's bundler handles minification. This makes debugging easier for buyers.
- **5 entry points:** core, rendering, controls, data, demos. Maps to the tier structure ($29 = core + rendering + controls + data, $49 = all + demos).

---

## Installation

```bash
# Core build dependencies
npm install -D vite@~7.3.0 @vitejs/plugin-react vite-plugin-dts vite-plugin-lib-inject-css typescript@~5.9.0

# Runtime dependencies (externalized as peer deps)
npm install react@^19.2.0 react-dom@^19.2.0 zustand@^5.0.0 recharts@^3.8.0 d3-force@^3.0.0 d3-quadtree@^3.0.0

# Type definitions
npm install -D @types/d3-force @types/d3-quadtree @types/react @types/react-dom

# Styling (dev only -- compiled out at build time)
npm install -D tailwindcss@^4.2.0

# Utility
npm install clsx@^2.1.0

# Storybook
npm install -D storybook@^10.2.0 @storybook/react-vite@^10.2.0 @storybook/addon-docs@^10.2.0

# Testing
npm install -D vitest@^4.1.0 @testing-library/react@^16.0.0
```

---

## Technology Risk Assessment

| Technology | Risk Level | Risk | Mitigation |
|------------|-----------|------|------------|
| Vite 7.3 | LOW | Vite 7 will eventually stop getting patches | Planned migration path to Vite 8 after 8.1+ stabilizes |
| Tailwind v4 in library | MEDIUM | CSS distribution complexity | Compile to static CSS at build time. Ship CSS files, not utility classes. |
| React 19 | LOW | Mature and stable | 15+ months in production across the ecosystem |
| Zustand 5 | LOW | Stable with regular patches | Well-maintained, large community, simple API surface |
| Recharts 3 | LOW | v3.0 was a major rewrite | Has had 8 minor releases (3.1-3.8) -- early bugs are resolved |
| d3-force 3 | LOW | No updates since 2021 | Physics algorithm is complete. No updates needed. Stable API. |
| Raw WebGL2 | MEDIUM | No library abstractions for error handling | Implement Canvas2D fallback. WebGL2 support is 97%+ in 2026. |
| Storybook 10 | LOW | Major version jump from the spec's "Storybook 8" | Direct path from fresh install. No migration needed since it is greenfield. |
| TypeScript 5.9 | LOW | TS 6.0 is in RC | TS 5.9 is well-tested. Upgrade path to 6.0 is straightforward. |

---

## Sources

### React 19
- [React v19 Official Blog Post](https://react.dev/blog/2024/12/05/react-19)
- [React Versions](https://react.dev/versions)
- [React 19 Upgrade Guide](https://react.dev/blog/2024/04/25/react-19-upgrade-guide)
- [Ref Callbacks, React 19 and the Compiler](https://tkdodo.eu/blog/ref-callbacks-react-19-and-the-compiler)

### Vite
- [Vite 7.0 Announcement](https://vite.dev/blog/announcing-vite7)
- [Vite 8.0 Announcement](https://vite.dev/blog/announcing-vite8)
- [Vite 8 Beta Announcement](https://vite.dev/blog/announcing-vite8-beta)
- [Vite Building for Production](https://vite.dev/guide/build)
- [Storybook Vite 8 Compatibility Issue](https://github.com/storybookjs/storybook/issues/33789)

### Tailwind CSS
- [Tailwind CSS v4.0 Release](https://tailwindcss.com/blog/tailwindcss-v4)
- [Tailwind v4 Component Library Discussion](https://github.com/tailwindlabs/tailwindcss/discussions/17715)
- [Tailwind v4 Library Distribution Best Practices](https://github.com/tailwindlabs/tailwindcss/discussions/18545)
- [Tailwind v4 Style Issues in Built Libraries](https://github.com/tailwindlabs/tailwindcss/discussions/18758)

### Zustand
- [Zustand GitHub Releases](https://github.com/pmndrs/zustand/releases)
- [Zustand npm](https://www.npmjs.com/package/zustand)
- [Zustand Official Documentation](https://zustand-demo.pmnd.rs/)

### Recharts
- [Recharts 3.0 Migration Guide](https://github.com/recharts/recharts/wiki/3.0-migration-guide)
- [Recharts GitHub](https://github.com/recharts/recharts)
- [Best React Chart Libraries 2025 - LogRocket](https://blog.logrocket.com/best-react-chart-libraries-2025/)

### D3-Force
- [d3-force GitHub](https://github.com/d3/d3-force)
- [D3 Force Layout In-Depth](https://www.d3indepth.com/force-layout/)
- [React + D3 Force Graphs + TypeScript Guide](https://medium.com/@qdangdo/visualizing-connections-a-guide-to-react-d3-force-graphs-typescript-74b7af728c90)

### WebGL2
- [GPU-Accelerated Particles with WebGL 2](https://gpfault.net/posts/webgl2-particles.txt.html)
- [Efficient Particle System in JavaScript WebGL](https://webglfundamentals.org/webgl/lessons/webgl-qna-efficient-particle-system-in-javascript---webgl-.html)
- [Rendering 100k Spheres with Instancing](https://velasquezdaniel.com/blog/rendering-100k-spheres-instantianing-and-draw-calls/)

### Storybook
- [Storybook 10 Blog Post](https://storybook.js.org/blog/storybook-10/)
- [Storybook for React with Vite](https://storybook.js.org/docs/get-started/frameworks/react-vite)
- [Storybook Releases](https://github.com/storybookjs/storybook/releases)

### TypeScript
- [TypeScript 5.9 Release Notes](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html)
- [TypeScript 6.0 RC Announcement](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0-rc/)

### Build Plugins
- [vite-plugin-dts](https://www.npmjs.com/package/vite-plugin-dts)
- [vite-plugin-lib-inject-css](https://github.com/emosheeep/vite-plugin-lib-inject-css)
- [Create a React Component Library with Vite](https://dev.to/receter/how-to-create-a-react-component-library-using-vites-library-mode-4lma)
