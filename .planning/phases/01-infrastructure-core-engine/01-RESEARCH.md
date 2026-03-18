# Phase 1: Infrastructure + Core Engine - Research

**Researched:** 2026-03-18
**Domain:** Vite library mode build pipeline, Zustand vanilla API tick loop, ring buffer, CSS custom property theming, Storybook 10 dark theme
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Theme token design**
- Deep space dark aesthetic: near-black backgrounds (#0a0a0f range), high contrast text, vibrant accent colors — Linear/Raycast premium dev-tool feel
- Palette: --sim-bg: #0a0a0f, --sim-surface: #141420, --sim-border: #2a2a3a, --sim-text: #e8e8ed, --sim-text-muted: #8888a0, --sim-accent: #6366f1 (indigo), --sim-danger: #ef4444, --sim-success: #22c55e
- Essential token set (~15 tokens): bg, surface, surface-raised, border, text, text-muted, accent, danger, warning, success, font-family, font-mono, radius-sm/md, spacing unit — not overwhelming for buyers
- Single accent color (indigo) — buyers override one var to rebrand
- Tailwind for layout (spacing, flexbox, grid, sizing), CSS custom properties (--sim-*) for all colors, borders, radius, fonts — clean separation, buyers don't need Tailwind to retheme

**Import paths & package structure**
- Package name: `sim-kit` — short and memorable
- Subpath exports: sim-kit/core, sim-kit/rendering, sim-kit/controls, sim-kit/data, sim-kit/demos
- Root import (from 'sim-kit') re-exports all layers — convenient for prototyping, subpath imports for production tree-shaking
- Single package with gated exports for tier split: $29 tier excludes demos/ folder, $49 tier includes everything. Gumroad download zips handle the split, not the build
- src/ organized by layer folders mirroring subpath exports: src/core/, src/rendering/, src/controls/, src/data/, src/demos/, src/types/, src/utils/, src/theme/

**Tick loop defaults & edge cases**
- Default tick rate: 60 ticks/sec (matches display refresh, 1 tick per frame at 1x speed)
- Background tab behavior: auto-pause when tab loses focus, resume on return. Prevents accumulator buildup and catch-up jank. Buyers can override with keepRunning option
- Default history ring buffer size: 1000 ticks (~16 seconds at 60 tps). Configurable via SimulationProvider props
- History storage: full state deep clones per tick. Simple, predictable O(1) random access. Buyers with large state reduce buffer size

**Storybook initial scope**
- Configure Storybook 10 with Vite builder + one smoke story (SimulationProvider + useSimulation counter that ticks up)
- Full component stories deferred to Phase 6 (DOCS-06)
- Storybook theme matches sim-kit deep space dark aesthetic (cohesive premium feel)
- Storybook serves as primary dev playground (npm run storybook) — no separate dev app needed

### Claude's Discretion
- Exact Tailwind v4 library mode configuration (compile to static CSS strategy)
- Vite library mode entry point configuration details
- TypeScript strict mode config specifics
- Zustand store internal structure and vanilla API patterns
- Ring buffer implementation details (pre-allocation strategy)
- Storybook addon selection

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INFRA-01 | Project scaffolded with Vite 7.3 library mode, React 19, TypeScript 5.9 strict mode | Vite 7.3 library mode config, TypeScript strict tsconfig, @vitejs/plugin-react 6.x |
| INFRA-02 | Multi-entry build producing separate bundles per layer (core, rendering, controls, data, demos) | Vite build.lib.entry as object map, formats: ['es'], preserveModules pattern |
| INFRA-03 | Package.json with subpath exports supporting tree-shaking and tier separation ($29/$49) | package.json exports field, sideEffects: false, types/import/require per entry |
| INFRA-04 | Tailwind v4 compiled to static CSS at build time with --sim-* CSS custom properties for theming | @tailwindcss/vite plugin, compile-to-static-CSS strategy, CSS custom property declaration |
| INFRA-05 | Peer dependencies (React, Zustand, Recharts, D3-force) externalized correctly in build output | rollupOptions.external regex, peerDependencies in package.json, vite-bundle-visualizer verification |
| INFRA-06 | Storybook 10 configured with Vite builder for interactive component documentation | @storybook/react-vite, custom dark theme via create() + manager.js, preview.ts CSS vars decorator |
| INFRA-07 | Shared TypeScript type definitions exported from src/types/index.ts | vite-plugin-dts, tsconfig paths, exported interface patterns |
| CORE-01 | SimulationProvider wraps children with Zustand store providing tick loop, state management, and playback controls | createStore from zustand/vanilla, React.createContext, useStore bridge hook |
| CORE-02 | Tick loop uses requestAnimationFrame with accumulator pattern for stable ticks regardless of frame rate | rAF + accumulator, delta clamping, useLayoutEffect cleanup, visibilitychange pause |
| CORE-03 | History stored in pre-allocated ring buffer with O(1) random access for timeline scrubbing (configurable max length, default 1000) | Fixed-size Array pre-allocation, head/write pointer, modulo arithmetic |
| CORE-04 | useSimulation hook exposes play/pause/toggle/step/stepBack/setSpeed/setParameter/resetParameters/seekToTick/logEvent/subscribe | Zustand store actions, useStore with selector, vanilla API in loop |
| CORE-05 | Speed multiplier supports 0.25x, 0.5x, 1x, 2x, 4x, 8x, 16x | accumulator scaling, SPEED_PRESETS array, setSpeed action |
| CORE-06 | Tick loop runs outside React render cycle via Zustand vanilla API (getState/setState) to avoid re-renders at tick rate | getState()/setState() in rAF callback, no useStore inside loop body |
| UTIL-02 | Ring buffer utility (history-buffer.ts) with pre-allocated fixed-size array, O(1) push/read/random-access | Pre-allocated new Array(capacity), head pointer, size counter, modulo wrapping |
| THEME-01 | Dark theme by default with all visual tokens exposed as --sim-* CSS custom properties | :root CSS variable declarations, ~15 tokens covering bg/surface/border/text/accent/danger/warning/success/fonts/radius |
| THEME-02 | Tailwind classes used for layout, CSS vars for colors — buyers override vars to match their brand without touching component code | Tailwind v4 @tailwindcss/vite, static CSS output, --sim-* namespace separation from layout utilities |
</phase_requirements>

---

## Summary

Phase 1 is the architectural backbone of sim-kit. It produces two independent deliverables: (1) a validated build pipeline that emits tree-shakable, tier-separated ES bundles with externalized peer dependencies and pre-compiled static CSS, and (2) a working SimulationProvider built on Zustand's vanilla API that runs a fixed-timestep rAF tick loop, stores playback-navigable history in a ring buffer, and exposes the full playback control API.

The most critical build decision for this phase is that Tailwind v4 must be compiled to static CSS at build time — library consumers must not need Tailwind installed to use sim-kit. The recommended strategy is to use `@tailwindcss/vite` during development, which auto-scans and compiles used utility classes into the emitted `dist/style.css`. The `--sim-*` CSS custom properties live in a separate theme declaration block; Tailwind only generates layout utilities. This completely decouples consumer theming from Tailwind.

The most critical engine decision is that the tick loop must call `store.getState()` and `store.setState()` directly (Zustand vanilla API) inside the `requestAnimationFrame` callback. Using the React hook API inside the loop would trigger component tree re-renders at 60fps. The `SimulationProvider` creates a scoped Zustand store via `createStore` (from `zustand/vanilla`), stores it in a ref, and passes it via React context. This is the canonical "Zustand + React Context" provider pattern and enables per-instance stores, essential for embedding multiple simulations on one page.

**Primary recommendation:** Build the Vite config first and validate with a test consumer import before writing a single component. The three highest-risk pitfalls (peer dep bundling, CSS purging, barrel file tree-shaking) are all build configuration failures that are cheap to fix on day 1 and expensive to retrofit across 18 components.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| vite | ~7.3.0 | Dev server + library bundler | Vite 7.3 is the current stable line (Vite 8 has known library-mode failures days after release). Well-tested for multi-entry library builds with Rollup. |
| @vitejs/plugin-react | ^6.0.1 | React JSX transform + Fast Refresh | First-party plugin, current stable version. Handles React 19 JSX transform (automatic runtime). |
| react | ^19.2.0 | UI framework | Production-stable since Dec 2024. Ref cleanup functions are directly useful for Canvas/WebGL teardown in later phases. No forwardRef needed. |
| react-dom | ^19.2.0 | DOM rendering | Paired with React 19. |
| typescript | ~5.9.3 | Type system | TS 5.9 is latest stable. TS 6.0 RC shipped March 6, 2026 — too fresh for tooling. Pin 5.9.x. |
| zustand | ^5.0.12 | Simulation state + tick loop | Vanilla `createStore` API enables getState/setState outside React. ~2KB. subscribeWithSelector for granular subscriptions. |
| tailwindcss | ^4.2.1 | Layout utilities (dev-only) | v4.2 is current stable. CSS-first config, automatic content scanning. Compiled to static CSS at build. |
| @tailwindcss/vite | ^4.2.1 | Vite plugin for Tailwind v4 | First-party plugin, better performance than PostCSS approach. |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| vite-plugin-dts | ^4.5.4 | TypeScript .d.ts generation | Always — Vite does not emit declarations without it. Use `rollupTypes: false` for per-entry .d.ts. |
| vite-plugin-lib-inject-css | ^2.0.0 | Inject CSS import into JS chunks | Required when using multi-entry builds with CSS so each entry gets its own CSS import. |
| clsx | ^2.1.0 | Conditional className joining | Whenever composing Tailwind utility strings in component JSX. |
| @types/react | ^19.0.0 | TypeScript types for React | Always. |
| @types/react-dom | ^19.0.0 | TypeScript types for ReactDOM | Always. |

### Development Only

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| storybook | ^10.3.0 | Storybook CLI + core | Phase 1 Storybook setup. |
| @storybook/react-vite | ^10.3.0 | React + Vite framework adapter | First-party integration, auto-configures Vite for Storybook. |
| @storybook/addon-docs | ^10.3.0 | Prop table generation from TypeScript types | Needed for Phase 6 docs. Install now so Storybook is ready. |
| @storybook/addon-themes | ^10.3.0 | Theme switching decorator in Storybook | Enables CSS custom property toggling in stories. |
| vitest | ^4.1.0 | Unit test runner | Native Vite integration, shared config. Test ring buffer and store logic. |
| @testing-library/react | ^16.3.2 | React component test utilities | Testing SimulationProvider in isolation. |
| @vitest/coverage-v8 | ^4.1.0 | Coverage reporting | Standard coverage provider for Vitest. |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Vite 7.3 | Vite 8.0 | Vite 8 (Rolldown) is 10-30x faster but has known library-mode build failures in first weeks. Use 7.3, migrate to 8.1+. |
| createStore (zustand/vanilla) | Global create (zustand) | Global store means one simulation per page. Vanilla createStore + Context enables multiple independent simulations. |
| tailwindcss @tailwindcss/vite | postcss + tailwindcss | PostCSS approach works but @tailwindcss/vite is the v4 standard: faster, simpler, better incremental builds. |
| vite-plugin-dts | tsc --emitDeclarationOnly | tsc separate step is slower and harder to integrate with Vite watch mode. vite-plugin-dts runs in the same build. |

**Installation:**
```bash
# Build tooling
npm install -D vite@~7.3.0 @vitejs/plugin-react@^6.0.1 vite-plugin-dts@^4.5.4 vite-plugin-lib-inject-css@^2.0.0

# TypeScript
npm install -D typescript@~5.9.3 @types/react@^19.0.0 @types/react-dom@^19.0.0

# Styling
npm install -D tailwindcss@^4.2.1 @tailwindcss/vite@^4.2.1

# Runtime (externalized peer deps)
npm install react@^19.2.0 react-dom@^19.2.0 zustand@^5.0.12

# Utility (bundled)
npm install clsx@^2.1.0

# Storybook
npm install -D storybook@^10.3.0 @storybook/react-vite@^10.3.0 @storybook/addon-docs@^10.3.0 @storybook/addon-themes@^10.3.0

# Testing
npm install -D vitest@^4.1.0 @testing-library/react@^16.3.2 @vitest/coverage-v8@^4.1.0
```

---

## Architecture Patterns

### Recommended Project Structure

```
sim-kit/
├── src/
│   ├── core/
│   │   ├── SimulationProvider.tsx    # Provider + store factory
│   │   ├── useSimulation.ts          # Public hook API
│   │   ├── store.ts                  # Zustand store shape + actions
│   │   ├── tick-loop.ts              # rAF + accumulator logic
│   │   └── index.ts                  # Layer public API
│   ├── rendering/                    # Phase 2
│   ├── controls/                     # Phase 3
│   ├── data/                         # Phase 5
│   ├── demos/                        # Phase 6
│   ├── utils/
│   │   ├── history-buffer.ts         # Ring buffer (UTIL-02)
│   │   └── index.ts
│   ├── theme/
│   │   └── index.css                 # --sim-* custom property declarations
│   ├── types/
│   │   └── index.ts                  # All exported public types (INFRA-07)
│   └── index.ts                      # Root re-export (all layers)
├── .storybook/
│   ├── main.ts                       # Framework, addons config
│   ├── preview.ts                    # Decorators, globals, CSS import
│   ├── manager.js                    # Custom dark theme for Storybook UI
│   └── sim-kit-theme.ts              # Theme object created with create()
├── stories/
│   └── SimulationProvider.stories.tsx  # Smoke story (Phase 1)
├── dist/                             # Build output
├── vite.config.ts                    # Library mode config
├── vite.config.dev.ts                # Dev server config (optional)
├── tsconfig.json                     # Base TypeScript config (for IDEs)
├── tsconfig.build.json               # Build-only config (strict, no test files)
├── vitest.config.ts                  # Test config (extends vite.config)
└── package.json
```

### Pattern 1: Vite Multi-Entry Library Mode

**What:** Configure `build.lib.entry` as an object mapping layer names to entry files. Each key becomes a separate output file. Rollup's `preserveModules` is NOT used here — explicit named entries produce cleaner public API while Rollup optimizes internals within each bundle.

**When to use:** Always, for tree-shakable multi-layer library.

**Example:**
```typescript
// Source: https://vite.dev/guide/build
// vite.config.ts
import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { libInjectCss } from 'vite-plugin-lib-inject-css';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    libInjectCss(),
    dts({
      rollupTypes: false,           // Per-entry .d.ts files for per-layer types
      tsconfigPath: './tsconfig.build.json',
      include: ['src'],
    }),
  ],
  build: {
    lib: {
      entry: {
        index:              resolve(__dirname, 'src/index.ts'),
        'core/index':       resolve(__dirname, 'src/core/index.ts'),
        'rendering/index':  resolve(__dirname, 'src/rendering/index.ts'),
        'controls/index':   resolve(__dirname, 'src/controls/index.ts'),
        'data/index':       resolve(__dirname, 'src/data/index.ts'),
        'demos/index':      resolve(__dirname, 'src/demos/index.ts'),
      },
      formats: ['es'],              // ES modules only — ecosystem has moved to ESM
    },
    rollupOptions: {
      external: [
        'react',
        'react/jsx-runtime',
        'react-dom',
        /^react-dom\//,
        'zustand',
        /^zustand\//,
        'recharts',
        /^recharts\//,
        'd3-force',
        'd3-quadtree',
      ],
    },
    target: 'es2022',
    minify: false,                  // Let consumer bundler minify
    cssCodeSplit: false,            // Single CSS file to avoid duplication
  },
});
```

### Pattern 2: Package.json Subpath Exports

**What:** The `exports` field in package.json defines the public API surface. Each subpath maps to a compiled JS file and its type declarations. `sideEffects: false` enables consumer-side tree-shaking; `"*.css"` exceptions mark CSS files as having side effects (they set global custom properties).

**Example:**
```json
{
  "name": "sim-kit",
  "version": "1.0.0",
  "type": "module",
  "files": ["dist"],
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "sideEffects": ["*.css"],
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    },
    "./core": {
      "types": "./dist/core/index.d.ts",
      "import": "./dist/core/index.js"
    },
    "./rendering": {
      "types": "./dist/rendering/index.d.ts",
      "import": "./dist/rendering/index.js"
    },
    "./controls": {
      "types": "./dist/controls/index.d.ts",
      "import": "./dist/controls/index.js"
    },
    "./data": {
      "types": "./dist/data/index.d.ts",
      "import": "./dist/data/index.js"
    },
    "./demos": {
      "types": "./dist/demos/index.d.ts",
      "import": "./dist/demos/index.js"
    },
    "./style.css": "./dist/style.css"
  },
  "peerDependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0"
  },
  "dependencies": {
    "zustand": "^5.0.12",
    "recharts": "^3.8.0",
    "d3-force": "^3.0.0",
    "d3-quadtree": "^3.0.1",
    "clsx": "^2.1.0"
  }
}
```

### Pattern 3: Zustand createStore + React Context Provider

**What:** Create a scoped Zustand store with `createStore` (from `zustand/vanilla`) inside `SimulationProvider` using `React.useState(() => createStore(...))` (initializer form ensures it runs once). Pass the store instance via `React.createContext`. Components consume it with `useStore(store, selector)` from `zustand`. This enables multiple independent simulations on the same page — each `SimulationProvider` gets its own isolated store.

**When to use:** Always for SimulationProvider. Never use a global `create()` store.

**Example:**
```typescript
// Source: https://tkdodo.eu/blog/zustand-and-react-context
// Verified against: https://github.com/pmndrs/zustand (vanilla docs)
import { createStore, useStore } from 'zustand';
import { createContext, useContext, useState, type ReactNode } from 'react';

// Store shape
interface SimStore {
  tick: number;
  running: boolean;
  speed: number;
  // ... other state
  play: () => void;
  pause: () => void;
  step: () => void;
}

type SimStoreApi = ReturnType<typeof createStore<SimStore>>;
const SimulationContext = createContext<SimStoreApi | null>(null);

// Provider creates a store per instance
export function SimulationProvider({ children, ...props }: SimProviderProps) {
  const [store] = useState(() =>
    createStore<SimStore>((set, get) => ({
      tick: 0,
      running: false,
      speed: 1,
      play: () => set({ running: true }),
      pause: () => set({ running: false }),
      step: () => {
        // Runs tick logic once via getState()
        const s = get();
        if (!s.running) {
          // call user's tickFn, update state
        }
      },
    }))
  );

  // Start/stop tick loop
  useEffect(() => {
    return startTickLoop(store, props.tickFn);
  }, [store]);

  return (
    <SimulationContext.Provider value={store}>
      {children}
    </SimulationContext.Provider>
  );
}

// Hook for consuming components
export function useSimulation<T>(selector: (s: SimStore) => T): T {
  const store = useContext(SimulationContext);
  if (!store) throw new Error('useSimulation must be used inside SimulationProvider');
  return useStore(store, selector);
}
```

### Pattern 4: Fixed-Timestep rAF Tick Loop with Accumulator

**What:** The tick loop uses `requestAnimationFrame`, accumulates elapsed time, and fires fixed-duration ticks. The delta is clamped to prevent accumulator explosion after background tab resume. Speed multiplier scales the accumulator drain rate. Loop uses `store.getState()` / `store.setState()` directly — no React hooks inside the callback.

**When to use:** Always for the core tick loop. Never drive ticks from `useEffect` with `setInterval`.

**Example:**
```typescript
// Pattern: Glenn Fiedler's "Fix Your Timestep" adapted for browser
// Verified: MDN requestAnimationFrame + accumulator pattern
const TICK_DURATION_MS = 1000 / 60; // 60 ticks/sec at 1x
const MAX_DELTA_MS = 250;           // Clamp: prevents spiral-of-death after tab unfocus

function startTickLoop(store: SimStoreApi, tickFn: TickFn): () => void {
  let rafId: number;
  let lastTime: number | null = null;
  let accumulator = 0;

  const loop = (timestamp: number) => {
    if (lastTime === null) { lastTime = timestamp; }

    const rawDelta = timestamp - lastTime;
    lastTime = timestamp;

    // Clamp to prevent catchup spiral after tab was backgrounded
    const delta = Math.min(rawDelta, MAX_DELTA_MS);
    const { running, speed } = store.getState();

    if (running) {
      accumulator += delta * speed;

      while (accumulator >= TICK_DURATION_MS) {
        const state = store.getState();
        const nextEntities = tickFn(state.entities, state.config);
        store.setState({
          entities: nextEntities,
          tick: state.tick + 1,
        });
        // Push to ring buffer
        state.history.push(deepClone(nextEntities));
        accumulator -= TICK_DURATION_MS;
      }
    }

    rafId = requestAnimationFrame(loop);
  };

  rafId = requestAnimationFrame(loop);

  // Background tab pause via Page Visibility API
  const onVisibility = () => {
    if (document.hidden) {
      lastTime = null; // Reset: prevents large delta on return
      accumulator = 0;
    }
  };
  document.addEventListener('visibilitychange', onVisibility);

  return () => {
    cancelAnimationFrame(rafId);
    document.removeEventListener('visibilitychange', onVisibility);
  };
}
```

### Pattern 5: Pre-Allocated Ring Buffer

**What:** A class with a fixed-size `Array(capacity)` pre-allocated at construction. Tracks a `head` pointer (next write position) and `size` (number of valid entries). All operations are O(1). Random access by logical index converts to physical index with modulo arithmetic.

**When to use:** UTIL-02 (history-buffer.ts). Never use a growing array for the history store.

**Example:**
```typescript
// Implementation verified against standard ring buffer theory
// Source: https://www.tuckerleach.com/blog/ring-buffer
export class RingBuffer<T> {
  private readonly buffer: (T | undefined)[];
  private head = 0;     // Next write position
  private _size = 0;

  constructor(readonly capacity: number) {
    // Pre-allocate: avoids GC reallocation pressure during simulation
    this.buffer = new Array(capacity);
  }

  push(item: T): void {
    this.buffer[this.head] = item;
    this.head = (this.head + 1) % this.capacity;
    if (this._size < this.capacity) this._size++;
  }

  /** O(1) random access. Index 0 = oldest item. */
  get(index: number): T | undefined {
    if (index < 0 || index >= this._size) return undefined;
    const oldest = this._size < this.capacity ? 0 : this.head;
    const physical = (oldest + index) % this.capacity;
    return this.buffer[physical];
  }

  /** Most recent item. */
  get latest(): T | undefined {
    if (this._size === 0) return undefined;
    const lastPhysical = (this.head - 1 + this.capacity) % this.capacity;
    return this.buffer[lastPhysical];
  }

  get size(): number { return this._size; }
  get isFull(): boolean { return this._size === this.capacity; }

  clear(): void {
    this.head = 0;
    this._size = 0;
    // Do NOT reallocate buffer — keep pre-allocated memory
  }
}
```

### Pattern 6: CSS Custom Properties Theme Declaration

**What:** All visual tokens declared as CSS custom properties on `:root`. Tailwind layout classes handle spacing/flex/grid. The `--sim-*` namespace is the consumer's theming API — change one variable to rebrand. Storybook adds a decorator that wraps all stories in a container div with the CSS loaded.

**Example:**
```css
/* src/theme/index.css */
@import "tailwindcss";

:root {
  /* Backgrounds */
  --sim-bg: #0a0a0f;
  --sim-surface: #141420;
  --sim-surface-raised: #1e1e2e;

  /* Borders */
  --sim-border: #2a2a3a;

  /* Text */
  --sim-text: #e8e8ed;
  --sim-text-muted: #8888a0;

  /* Accent (rebrand by changing this one) */
  --sim-accent: #6366f1;

  /* State colors */
  --sim-danger: #ef4444;
  --sim-warning: #f59e0b;
  --sim-success: #22c55e;

  /* Typography */
  --sim-font-family: system-ui, -apple-system, sans-serif;
  --sim-font-mono: 'JetBrains Mono', 'Fira Code', ui-monospace, monospace;

  /* Shape */
  --sim-radius-sm: 4px;
  --sim-radius-md: 8px;

  /* Spacing unit (multiply for consistent scale) */
  --sim-spacing: 4px;
}
```

### Pattern 7: Storybook Dark Theme Configuration

**What:** Use `create()` from `storybook/theming` to build a custom theme object, apply it via `addons.setConfig({ theme })` in `.storybook/manager.js`, and set it on docs in `preview.ts`. The `base: 'dark'` property is mandatory.

**Example:**
```typescript
// .storybook/sim-kit-theme.ts
import { create } from 'storybook/theming';

export const simKitTheme = create({
  base: 'dark',                          // Required
  brandTitle: 'sim-kit',
  brandUrl: 'https://example.com',

  // Match --sim-* palette exactly
  colorPrimary: '#6366f1',               // --sim-accent
  colorSecondary: '#6366f1',

  appBg: '#0a0a0f',                      // --sim-bg
  appContentBg: '#141420',               // --sim-surface
  appPreviewBg: '#0a0a0f',
  appBorderColor: '#2a2a3a',             // --sim-border
  appBorderRadius: 8,

  textColor: '#e8e8ed',                  // --sim-text
  textInverseColor: '#0a0a0f',

  barTextColor: '#8888a0',               // --sim-text-muted
  barSelectedColor: '#6366f1',
  barHoverColor: '#6366f1',
  barBg: '#141420',

  inputBg: '#1e1e2e',                    // --sim-surface-raised
  inputBorder: '#2a2a3a',
  inputTextColor: '#e8e8ed',
  inputBorderRadius: 4,

  fontBase: 'system-ui, -apple-system, sans-serif',
  fontCode: "'JetBrains Mono', 'Fira Code', ui-monospace, monospace",
});
```

```javascript
// .storybook/manager.js
import { addons } from 'storybook/manager-api';
import { simKitTheme } from './sim-kit-theme';

addons.setConfig({ theme: simKitTheme });
```

```typescript
// .storybook/preview.ts
import type { Preview } from '@storybook/react';
import { simKitTheme } from './sim-kit-theme';
import '../src/theme/index.css';        // Load --sim-* vars into story canvas

const preview: Preview = {
  parameters: {
    docs: { theme: simKitTheme },
    backgrounds: { disable: true },     // Use --sim-bg instead
  },
  decorators: [
    (Story) => (
      // Ensure --sim-* vars are in scope for every story canvas
      <div style={{ background: 'var(--sim-bg)', minHeight: '100vh', padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
};

export default preview;
```

### Pattern 8: TypeScript Strict Mode tsconfig

**What:** Two tsconfig files: `tsconfig.json` (for IDE support, includes everything) and `tsconfig.build.json` (for actual compilation, excludes test/story files). `moduleResolution: "bundler"` is the correct setting for Vite projects.

**Example:**
```jsonc
// tsconfig.json (IDE base)
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "baseUrl": ".",
    "paths": {
      "sim-kit/*": ["src/*"]
    }
  },
  "include": ["src", "stories", "vitest.config.ts"]
}
```

```jsonc
// tsconfig.build.json (build only)
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "declaration": true,
    "declarationMap": true,
    "emitDeclarationOnly": true,
    "outDir": "dist"
  },
  "include": ["src"],
  "exclude": ["src/**/*.test.*", "src/**/*.stories.*"]
}
```

### Anti-Patterns to Avoid

- **Global Zustand store:** `create(() => ...)` from `zustand` creates a module-singleton store. Multiple `SimulationProvider` instances share the same state. Use `createStore` from `zustand/vanilla` + React Context.
- **useEffect for rAF loop:** `useEffect` cleanup is asynchronous. In React Strict Mode this causes ghost animation frames. Use `useLayoutEffect` for rAF registration so cleanup fires synchronously.
- **setInterval for tick cadence:** `setInterval` drifts, cannot be paused cheaply, and does not sync with display refresh. Use rAF + accumulator.
- **Storing entities in React useState:** Causes 60fps React reconciler work. Store entities in Zustand, read via `getState()` in rendering callbacks.
- **Barrel re-export with `export * from`:** Prevents tree-shaking. Use direct named exports per layer entry point.
- **CJS format output:** ES modules only for 2026. CJS adds build complexity with zero benefit for the React ecosystem.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| TypeScript declaration emit | Custom tsc script watcher | vite-plugin-dts | Integrates with Vite watch mode, handles multiple entries and source maps correctly |
| CSS-in-JS runtime | Style objects at runtime | Tailwind (compiled) + CSS vars | Zero runtime overhead, consumer can override without any JS |
| Conditional classname joining | String concatenation or ternary chains | clsx | Handles falsy values, arrays, objects correctly. 330 bytes. |
| Store outside React | Manual event emitter | zustand/vanilla createStore | Already provides getState/setState/subscribe with TypeScript support |
| Per-tick deep clone | JSON.parse(JSON.stringify(x)) | structuredClone() | Browser native, faster than JSON round-trip, handles typed arrays |

**Key insight:** For a Phase 1 build, the temptation is to hand-roll everything "for control." Resist it. vite-plugin-dts and vite-plugin-lib-inject-css solve genuinely hairy Vite internals (d.ts bundling across entry points, CSS chunk injection) that are not worth reimplementing.

---

## Common Pitfalls

### Pitfall 1: Vite Bundles Peer Dependencies Into Output
**What goes wrong:** If `react`, `zustand`, `recharts`, `d3-force` are not in `rollupOptions.external`, they get inlined into `dist/index.js`. Consumers load two React instances, which crashes all hooks with "Invalid hook call."
**Why it happens:** Rollup bundles everything unless explicitly told not to. Transitive dependencies (e.g., `react/jsx-runtime`) must also be listed.
**How to avoid:** Use regex patterns in external: `/^react($|\/)/, /^zustand($|\/)/, /^d3-/`. Run `npx vite-bundle-visualizer` after every build. If `dist/index.js` > 100KB, something is bundled that should not be.
**Warning signs:** Consumer app shows "Invalid hook call." `dist/index.js` file is unexpectedly large.

### Pitfall 2: Tailwind Classes Purged in Consumer Apps
**What goes wrong:** Consumer's Tailwind build does not scan `node_modules/`. All Tailwind utility classes used in sim-kit components are absent in production consumer builds. Components render unstyled.
**Why it happens:** Tailwind only scans configured content paths. Library code in `node_modules/` is excluded by default.
**How to avoid:** Compile Tailwind to static CSS at library build time. Ship `dist/style.css`. Consumer imports it once. Never require consumers to add `@source` directives. Test with a consumer app that has NO Tailwind installed.
**Warning signs:** Components look fine in Storybook but are unstyled in a consumer test app.

### Pitfall 3: useEffect rAF Loop in React Strict Mode
**What goes wrong:** StrictMode double-mounts components. A new rAF frame can be scheduled before the cleanup function runs (cleanup is asynchronous with useEffect). Ghost animation loops run against destroyed context references.
**Why it happens:** `useEffect` cleanup is deferred. `useLayoutEffect` cleanup is synchronous (runs before the next paint).
**How to avoid:** Use `useLayoutEffect` for registering the rAF loop and `visibilitychange` listener. Store the rAF ID in a `useRef`. In cleanup, call `cancelAnimationFrame(rafIdRef.current)` before the next frame fires.
**Warning signs:** Storybook story with SimulationProvider ticks twice as fast in development. Console shows duplicate tick events.

### Pitfall 4: Global createStore Instead of Per-Instance
**What goes wrong:** Using `create()` from `zustand` creates a module-level singleton. Two `<SimulationProvider>` on the same page share the same tick state. Pausing one pauses both.
**Why it happens:** This is Zustand's default usage pattern — fine for global app state, wrong for a reusable library component.
**How to avoid:** Always use `createStore` from `zustand/vanilla` inside `SimulationProvider`. Wrap in `useState(() => createStore(...))` to ensure single creation.
**Warning signs:** Embedding two demo simulations side by side causes both to play/pause together.

### Pitfall 5: Ring Buffer Overflow on Large State
**What goes wrong:** Default 1000-tick buffer with full deep clones. A 500x500 grid at ~250KB/snapshot = 250MB of ring buffer history. Page runs out of memory or GC pauses cause frame drops.
**Why it happens:** The default buffer size is calibrated for small state objects. Large grid state multiplies memory consumption.
**How to avoid:** Document that buyers with large state should reduce `maxHistoryLength`. Recommend typed arrays (`Uint8Array`, `Float32Array`) for grid state. Consider a configurable `snapshotInterval` (only store every Nth tick). The default 1000 ticks is fine for small demo state (< 1KB per tick).
**Warning signs:** Memory grows linearly in Task Manager during a grid simulation.

### Pitfall 6: Barrel Files Breaking Tree-Shaking
**What goes wrong:** `export * from './SimulationProvider'` in a root index.ts causes bundlers to pull in everything, even if the consumer only imports one component.
**Why it happens:** Star re-exports create ambiguous dependency chains. Bundlers cannot safely eliminate modules they cannot statically analyze.
**How to avoid:** Use named exports in each layer's `index.ts`. Set `"sideEffects": ["*.css"]` in package.json. Validate with a test consumer that imports one component and uses `vite-bundle-visualizer` to check output.
**Warning signs:** A consumer import of `SimulationProvider` alone pulls in WebGL code and D3.

### Pitfall 7: Storybook 10 Requires Node.js 20.16+ (ESM-only)
**What goes wrong:** Storybook 10 dropped CJS support entirely. On Node 18 or older Node 20, `npm create storybook@latest` may error or produce unexpected output.
**Why it happens:** Storybook 10 is ESM-only for its distribution, which requires Node.js 20.16+, 22.19+, or 24+.
**How to avoid:** Verify Node version before setup. `node --version` must be >= 20.16.0. This aligns well with Vite 7's requirements.
**Warning signs:** `ERR_REQUIRE_ESM` errors during Storybook startup.

---

## Code Examples

Verified patterns from official sources and prior project research:

### Tick Loop Step Function (with speed and stepBack)
```typescript
// stepBack restores the previous ring buffer snapshot
stepBack: () => {
  const { tick, history } = store.getState();
  if (tick === 0) return;
  const prev = history.get(tick - 1);
  if (prev) {
    store.setState({ entities: prev, tick: tick - 1, running: false });
  }
},

// seekToTick navigates to arbitrary ring buffer position
seekToTick: (targetTick: number) => {
  const { history } = store.getState();
  const snapshot = history.get(targetTick);
  if (snapshot) {
    store.setState({ entities: snapshot, tick: targetTick, running: false });
  }
},
```

### useSimulation Convenience Selectors
```typescript
// Individual selectors to minimize re-renders
export const useIsRunning = () => useSimulation(s => s.running);
export const useTick = () => useSimulation(s => s.tick);
export const useSpeed = () => useSimulation(s => s.speed);
export const usePlayback = () => useSimulation(s => ({
  running: s.running,
  tick: s.tick,
  speed: s.speed,
  play: s.play,
  pause: s.pause,
  step: s.step,
  stepBack: s.stepBack,
  setSpeed: s.setSpeed,
}));
```

### Storybook Smoke Story
```tsx
// stories/SimulationProvider.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { SimulationProvider } from '../src/core';
import { useSimulation } from '../src/core';

function TickCounter() {
  const tick = useSimulation(s => s.tick);
  const { play, pause, running } = useSimulation(s => ({
    play: s.play,
    pause: s.pause,
    running: s.running,
  }));

  return (
    <div style={{ color: 'var(--sim-text)', fontFamily: 'var(--sim-font-mono)' }}>
      <p>Tick: {tick}</p>
      <button onClick={running ? pause : play}>
        {running ? 'Pause' : 'Play'}
      </button>
    </div>
  );
}

const meta: Meta<typeof SimulationProvider> = {
  title: 'Core/SimulationProvider',
  component: SimulationProvider,
};
export default meta;

export const Smoke: StoryObj = {
  render: () => (
    <SimulationProvider tickFn={(entities) => entities}>
      <TickCounter />
    </SimulationProvider>
  ),
};
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Vite `rollupOptions` | Vite `rolldownOptions` (deprecated rollupOptions) | Vite 8 (March 2026) | Use `rollupOptions` on Vite 7.3 — it still works. Plan migration to `rolldownOptions` when upgrading to Vite 8.1+. |
| `tailwind.config.js` | `@theme {}` block in CSS | Tailwind v4 (Jan 2025) | No JS config file needed. All theme tokens go in CSS. Generates CSS custom properties automatically. |
| `React.forwardRef` | ref as a regular prop | React 19 (Dec 2024) | Simpler component API. No forwardRef wrapper needed for ref forwarding. |
| `useEffect` for rAF | `useLayoutEffect` for rAF | React 18+ / StrictMode | `useLayoutEffect` cleanup fires synchronously, preventing ghost frames in Strict Mode. |
| CJS + ESM dual output | ESM only | 2024+ ecosystem | React ecosystem has moved to ESM. CJS output adds build complexity with zero practical benefit in 2026. |
| `preserveModules: true` | Named entry points object | Vite 3.2+ | Explicit entry points give cleaner public API; `preserveModules` leaks internal module paths. |
| Storybook `.storybook/main.js` | `.storybook/main.ts` | Storybook 7+ | TypeScript config is now first-class. Type-safe Storybook configuration. |
| `storybook/theming` (old import) | `storybook/theming` (unchanged) | Storybook 7 | Import path is stable. `create()` and `themes` export remain the same API. |

**Deprecated/outdated:**
- `react/jsx-runtime` must be explicitly externalized — it is NOT covered by externalizing `react` alone
- Storybook `@storybook/addon-essentials` is no longer needed in v10 — docs/controls are built in
- `build.lib.formats: ['es', 'cjs']` — drop CJS; ESM-only simplifies the build

---

## Open Questions

1. **Tailwind compile-to-static-CSS produces what exactly in multi-entry builds?**
   - What we know: `@tailwindcss/vite` compiles Tailwind at build time. `cssCodeSplit: false` emits a single CSS file. `vite-plugin-lib-inject-css` injects a CSS import into each JS chunk.
   - What's unclear: Whether a single `dist/style.css` is emitted or whether the theme CSS (`--sim-*` declarations) gets merged into the Tailwind output. Needs a test build to verify the exact output structure.
   - Recommendation: Run a minimal build with one component early in Wave 0 and inspect `dist/`. Adjust CSS file strategy based on output.

2. **Ring buffer: deep clone cost for default-size state**
   - What we know: `structuredClone()` is native and faster than JSON round-trip. Default buffer is 1000 entries.
   - What's unclear: What's the target "typical" state object size for the three demos? Ecosystem demo: grid array of numbers. Particles demo: Float32Array of positions. Social network: array of node objects with opinion values.
   - Recommendation: Use `structuredClone()` for the default. If a specific demo's state snapshot proves expensive, add an optional `snapshotFn` prop to SimulationProvider that lets users provide their own (cheaper) clone strategy.

3. **useLayoutEffect + SSR compatibility**
   - What we know: `useLayoutEffect` throws a warning in SSR environments (Next.js server components, etc.). The tick loop is client-only.
   - What's unclear: Whether the project needs SSR safety for the SimulationProvider.
   - Recommendation: Per REQUIREMENTS.md, "components render gracefully in SSR but sim logic is client-only." Use a `typeof window !== 'undefined'` guard around the tick loop, or use `useIsomorphicLayoutEffect` (fallback to useEffect in SSR). Log a clear warning if SimulationProvider is rendered on the server.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 |
| Config file | `vitest.config.ts` — Wave 0 creates this |
| Quick run command | `npx vitest run --reporter=verbose` |
| Full suite command | `npx vitest run --coverage` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | Project compiles with `tsc --noEmit` | smoke | `npx tsc -p tsconfig.build.json --noEmit` | ❌ Wave 0 |
| INFRA-02 | `dist/` contains core/index.js, rendering/index.js, controls/index.js, data/index.js, demos/index.js after `vite build` | integration | `npx vitest run tests/build.test.ts` | ❌ Wave 0 |
| INFRA-03 | Consumer app can `import { SimulationProvider } from 'sim-kit/core'` without error | integration | `npx vitest run tests/consumer.test.ts` | ❌ Wave 0 |
| INFRA-04 | `dist/style.css` exists and contains `--sim-accent` variable | integration | `npx vitest run tests/build.test.ts::css-output` | ❌ Wave 0 |
| INFRA-05 | Built `dist/index.js` does not contain the string `"createElement"` (React is externalized) | integration | `npx vitest run tests/build.test.ts::externals` | ❌ Wave 0 |
| INFRA-06 | `npm run storybook` starts without error, smoke story renders | manual | N/A | ❌ Wave 0 |
| INFRA-07 | `dist/types/index.d.ts` exists and exports `SimulationState` type | integration | `npx vitest run tests/build.test.ts::types` | ❌ Wave 0 |
| CORE-01 | SimulationProvider renders children without crash | unit | `npx vitest run tests/core/SimulationProvider.test.tsx` | ❌ Wave 0 |
| CORE-02 | Tick count increments over time when running | unit | `npx vitest run tests/core/tick-loop.test.ts` | ❌ Wave 0 |
| CORE-03 | RingBuffer push/get/random-access returns correct values; `.get(0)` after 1001 pushes returns item 2 | unit | `npx vitest run tests/utils/history-buffer.test.ts` | ❌ Wave 0 |
| CORE-04 | `useSimulation` hook returns play/pause/step/stepBack/setSpeed | unit | `npx vitest run tests/core/useSimulation.test.tsx` | ❌ Wave 0 |
| CORE-05 | Speed 0.25x fires ~1 tick per 4 frames; speed 4x fires ~4 ticks per frame | unit | `npx vitest run tests/core/tick-loop.test.ts::speed` | ❌ Wave 0 |
| CORE-06 | Setting store state in tick loop does not trigger React re-render of parent component | unit | `npx vitest run tests/core/tick-loop.test.ts::no-rerender` | ❌ Wave 0 |
| UTIL-02 | RingBuffer capacity=5: push 6 items, get(0) returns item 2 (oldest is overwritten) | unit | `npx vitest run tests/utils/history-buffer.test.ts` | ❌ Wave 0 |
| THEME-01 | DOM has `--sim-bg` CSS custom property set after SimulationProvider renders | unit | `npx vitest run tests/theme/custom-properties.test.ts` | ❌ Wave 0 |
| THEME-02 | Overriding `--sim-accent` in consumer CSS changes button/accent element color | manual | N/A | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run --reporter=verbose`
- **Per wave merge:** `npx vitest run --coverage`
- **Phase gate:** Full suite green + `tsc --noEmit` clean before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `tests/core/SimulationProvider.test.tsx` — covers CORE-01, CORE-04
- [ ] `tests/core/tick-loop.test.ts` — covers CORE-02, CORE-05, CORE-06
- [ ] `tests/utils/history-buffer.test.ts` — covers CORE-03, UTIL-02
- [ ] `tests/theme/custom-properties.test.ts` — covers THEME-01
- [ ] `tests/build.test.ts` — covers INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-07 (runs `vite build` then inspects `dist/`)
- [ ] `vitest.config.ts` — shared Vitest config
- [ ] `tests/setup.ts` — test environment setup (jsdom, CSS custom property support)
- [ ] Framework install is already handled: `vitest@^4.1.0` listed in devDependencies

---

## Sources

### Primary (HIGH confidence)

- [Vite Build docs — library mode](https://vite.dev/guide/build) — multi-entry lib config, externals, formats
- [Vite Build options — build.lib](https://vite.dev/config/build-options) — entry object, cssCodeSplit, cssFileName
- [Zustand GitHub README — vanilla store](https://github.com/pmndrs/zustand) — createStore, getState, setState, useStore
- [TkDodo — Zustand and React Context](https://tkdodo.eu/blog/zustand-and-react-context) — createStore + useState initializer + useContext pattern
- [Storybook 10 release blog](https://storybook.js.org/blog/storybook-10/) — ESM-only, Node requirement, React docgen
- [Storybook — React Vite framework](https://storybook.js.org/docs/get-started/frameworks/react-vite) — install steps, Vite ≥ 5 support
- [Storybook — theming API](https://storybook.js.org/docs/configure/user-interface/theming) — create(), manager.js, preview.ts, all theme properties
- [Tailwind CSS v4.0 release blog](https://tailwindcss.com/blog/tailwindcss-v4) — @tailwindcss/vite, CSS-first config, @theme directive
- [Tailwind — library distribution discussion](https://github.com/tailwindlabs/tailwindcss/discussions/18545) — @source directive, pre-built CSS strategy
- .planning/research/STACK.md — version analysis, Vite 7 vs 8 decision, Zustand rationale
- .planning/research/ARCHITECTURE.md — SimulationProvider pattern, tick loop, ring buffer, layer separation
- .planning/research/PITFALLS.md — 15 pitfalls with prevention strategies, phase relevance

### Secondary (MEDIUM confidence)

- [TypeScript TSConfig cheat sheet — Total TypeScript](https://www.totaltypescript.com/tsconfig-cheat-sheet) — moduleResolution: bundler, strictness flags
- [vite-plugin-dts npm](https://www.npmjs.com/package/vite-plugin-dts) — rollupTypes, tsconfigPath options
- [Tailwind library distribution discussion #18758](https://github.com/tailwindlabs/tailwindcss/discussions/18758) — consumer CSS scanning behavior
- [MDN — Page Visibility API](https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API) — visibilitychange event for background tab pause

### Tertiary (LOW confidence)

- vite-plugin-lib-inject-css behavior with multi-entry builds — based on npm readme and community reports. Needs validation in Wave 0 build test.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — versions verified against npm registry (2026-03-18). Vite 7 vs 8 decision validated against official blog and community reports.
- Architecture: HIGH — SimulationProvider/createStore/rAF patterns sourced from official Zustand docs and TkDodo's authoritative post. Vite multi-entry pattern sourced from official Vite docs.
- Build configuration: HIGH — Vite build.lib multi-entry pattern is official documentation. Peer dep externalization is a well-documented requirement.
- Tailwind v4 library CSS: MEDIUM — recommended strategy (compile to static CSS) is sound and recommended by Tailwind team, but the exact interaction with vite-plugin-lib-inject-css in a multi-entry build requires a validation prototype in Wave 0.
- Pitfalls: HIGH — sourced from official GitHub issues, Chromium bug tracker, and .planning/research/PITFALLS.md with documented sources.
- Testing approach: HIGH — Vitest 4.1 + @testing-library/react 16 is the standard Vite testing stack.

**Research date:** 2026-03-18
**Valid until:** 2026-04-17 (30 days — stack is stable, Tailwind v4 minor updates possible)
