# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run build            # Vite library build → dist/ (7 entry points + style.css)
npm run test             # Vitest single run (279 tests)
npm run test:watch       # Vitest watch mode
npm run typecheck        # TypeScript strict check (tsconfig.build.json)
npm run dev:demos        # Demo dev server at localhost:5173
npm run storybook        # Storybook at localhost:6006
npm run build-storybook  # Static Storybook export
```

Run a single test file: `npx vitest run tests/data/StatsPanel.test.tsx`

Test aliases resolve `sim-kit/core`, `sim-kit/rendering`, etc. to `src/` directories (see `vitest.config.ts`).

## Architecture

**sim-kit** is an 18-component React library for simulation interfaces. It separates into 5 layers with independent subpath exports (`sim-kit/core`, `sim-kit/rendering`, `sim-kit/controls`, `sim-kit/data`, `sim-kit/demos`).

### Core principle: tick loop runs outside React

The Zustand store (`src/core/store.ts`) is created via `zustand/vanilla`. The tick loop (`src/core/tick-loop.ts`) uses `requestAnimationFrame` with a fixed-timestep accumulator and calls `store.setState()` directly — never triggers React re-renders at tick rate. Components opt-in to state changes via `useSimulation(selector)` with shallow equality.

### Layer dependency flow

```
core → rendering, controls, data → demos
         (all consume useSimulation)
```

- **core** — SimulationProvider, useSimulation hook, tick loop, Zustand store, RingBuffer history
- **rendering** — SimCanvas (pan/zoom), GridRenderer, ParticleRenderer (WebGL2), ForceGraph (D3-force layout, React renders SVG), LayerStack, color ramps
- **controls** — ParameterPanel (auto-generated from schema), TimelineControl, PlaybackBar, PresetSelector
- **data** — StatsPanel (inline SVG sparklines), MiniChart (Recharts, rAF-gated), EventLog (manual virtualization), HeatmapOverlay (canvas, bilinear interpolation), EntityInspector (floating/dockable)
- **demos** — 3 simulations: ecosystem (Lotka-Volterra grid), particles (N-body/Boids), network (opinion dynamics graph)

### Build output

Vite library mode produces ES modules. Peer dependencies (React, Zustand, Recharts, d3-force) are externalized. CSS compiles to a single `dist/style.css` with `--sim-*` custom properties. Demos are intentionally excluded from the root barrel (`src/index.ts`) for tier separation ($29 core / $49 full).

## Key Conventions

### TypeScript strict mode with exactOptionalPropertyTypes

`tsconfig.json` enables `exactOptionalPropertyTypes: true` and `noUncheckedIndexedAccess: true`. This means:
- Array index access returns `T | undefined` — always nullish-coalesce or guard
- Optional props passed as `undefined` explicitly fail type-checking — use conditional spread: `...(value !== undefined ? { prop: value } : {})`

### Styling: inline styles + CSS custom properties

All components use inline `style={}` objects referencing `var(--sim-*)` tokens. No CSS modules, no separate CSS files per component. Consumers retheme by overriding `--sim-*` on any ancestor element.

### Selector stability for useSimulation

Inline object selectors cause infinite re-renders. Define selectors outside components or use `useShallow`:
```typescript
// Good: primitive selector
const tick = useSimulation(s => s.tick);
// Good: selector defined outside component
const selectPlayback = (s: SimStore) => ({ running: s.running, tick: s.tick });
```

### Canvas components follow rAF-loop pattern

SimCanvas, GridRenderer, ParticleRenderer, ForceGraph all maintain their own `requestAnimationFrame` loops for rendering, separate from the simulation tick loop. Viewport pan/zoom uses pointer events with `setPointerCapture` for unified mouse/touch/pen handling.

### MiniChart and StatsPanel use rAF-gated store subscription

To prevent Recharts re-render storms at tick rate, MiniChart subscribes to the raw Zustand store and batches updates behind a `requestAnimationFrame` gate (`rafPending` ref pattern).

## Testing Patterns

- **Environment**: jsdom via vitest, `@testing-library/react`
- **Test location**: `tests/` directory mirrors `src/` structure
- **WebGL**: Not available in jsdom — ParticleRenderer falls back to Canvas2D. Tests mock the GL context with `vi.fn()` stubs when needed
- **Build tests**: `tests/build.test.ts` runs `vite build` in `beforeAll` and verifies dist/ outputs, externalization, and CSS content
- **ResizeObserver**: Stub in tests if needed — jsdom doesn't support it
