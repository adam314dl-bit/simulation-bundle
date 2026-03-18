# Phase 2: Canvas Rendering - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

SimCanvas with pan/zoom and coordinate transforms, GridRenderer with dirty-rect optimization for 500x500 grids at 30fps, LayerStack for compositing multiple rendering layers with SVG annotation overlay (rect/lasso selection), and 6 built-in color ramps as 256-entry lookup tables. This phase delivers the 2D canvas rendering foundation that the ecosystem demo (Phase 6) and HeatmapOverlay (Phase 5) build on.

</domain>

<decisions>
## Implementation Decisions

### Canvas interaction feel
- Smooth pan/zoom with lerp-based momentum/inertia on release — polished feel without complexity
- Zoom centered on cursor position (standard UX expectation)
- Zoom range: 0.1x to 20x — wide enough for overview-to-detail on 500x500 grids
- Touch support: pinch-zoom + two-finger pan, no complex gesture recognition
- Viewport exposure: SimCanvas passes a Viewport object (transform matrix, screenToWorld/worldToScreen) via onDraw callback — child renderers receive canvas context + viewport for composition

### Grid cell visuals
- Cells rendered as filled rectangles with optional border (configurable borderWidth, default 0 for max performance)
- Borders drawn on top of fills, not as gaps between cells
- Hover highlight: semi-transparent white overlay (0.3 alpha) on hovered cell — works on any color ramp
- Selection highlight: solid 2px accent-colored border (--sim-accent) around selected cell — distinct from hover
- Cell size configurable via cellSize prop (default 8px, minimum 2px for dense grids)
- Color mapping: continuous values map through color ramp's 256-entry LUT; discrete categories use category10 ramp with modulo indexing

### Layer compositing & selection
- Z-ordering: simple array order — layers render bottom-to-top in children order, absolute positioning handles stacking (no explicit z-index props)
- SVG annotation overlay is always the topmost layer, supports rect and lasso selection modes via prop
- Rect selection: click-drag draws dashed rectangle (--sim-accent color, 50% fill opacity), fires onSelect with world-coordinate bounds on mouse-up
- Lasso selection: click-drag draws freeform path, closes on mouse-up, fires onSelect with polygon vertices in world coordinates
- Selection styling: dashed stroke + translucent fill — matches deep space dark aesthetic without obscuring content

### Color ramp API design
- Pure function API: colorRamps.viridis(normalizedValue) returns CSS color string — stateless, tree-shakable, no class instantiation
- Internal 256-entry Uint8Array (RGBA) LUT per ramp, cached on first call for O(1) lookups
- Performance path: getRampLUT('viridis') returns raw Uint8Array for direct ImageData manipulation in GridRenderer
- Custom ramps: createColorRamp(name, stops) takes {position, color}[] stops, interpolates to 256 entries, returns same API shape
- Built-in 6: viridis, inferno, plasma, coolwarm, terrain (perceptually uniform), category10 (discrete categorical)
- Exported from sim-kit/rendering: import { colorRamps, createColorRamp } from 'sim-kit/rendering'

### Claude's Discretion
- Exact lerp damping constants for pan/zoom momentum
- Canvas devicePixelRatio scaling implementation details
- Dirty-rect optimization algorithm specifics (tracking changed cells)
- Internal LUT interpolation method (linear RGB vs perceptual)
- SVG overlay DOM structure and event handling details
- Touch gesture threshold/dead-zone tuning

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project specs
- `.planning/PROJECT.md` — Product vision, tech stack constraints, performance targets (500x500 grid at 30fps)
- `.planning/REQUIREMENTS.md` — REND-01 through REND-04, REND-11, UTIL-01 are Phase 2 scope
- `.planning/ROADMAP.md` — Phase 2 goal and 5 success criteria

### Phase 1 foundation
- `.planning/phases/01-infrastructure-core-engine/01-CONTEXT.md` — Theme tokens (deep space dark, --sim-* vars), package structure (src/rendering/), tick loop defaults
- `src/types/index.ts` — SimConfig, TickFn, ParameterValue, SimEvent types that renderers consume
- `src/core/store.ts` — SimStore shape (entities, tick, parameters) that renderers read via useSimulation

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/core/SimulationProvider.tsx` + `useSimulation.ts`: Context provider and hook — renderers will consume simulation state through useSimulation
- `src/utils/history-buffer.ts` (RingBuffer): Already exported, used by store — not directly needed by renderers but establishes the utility pattern
- `src/theme/` directory: CSS custom properties foundation — renderers should reference --sim-* vars for accent, border colors

### Established Patterns
- Zustand vanilla API for tick loop (outside React render cycle) — renderers should similarly minimize React re-renders by reading canvas state outside React when possible
- TypeScript strict mode with exactOptionalPropertyTypes — all new types must comply
- useShallow for selector equality — renderers using useSimulation should follow this pattern to avoid infinite re-renders

### Integration Points
- `src/rendering/index.ts`: Empty barrel file — will export SimCanvas, GridRenderer, LayerStack, colorRamps, createColorRamp
- SimCanvas will be used by GridRenderer (Phase 2), ParticleRenderer (Phase 4), HeatmapOverlay (Phase 5), and all demos (Phase 6)
- Color ramps will be consumed by GridRenderer (Phase 2), ParticleRenderer (Phase 4), and HeatmapOverlay (Phase 5)
- LayerStack will be the main composition container in demo simulations (Phase 6)

</code_context>

<specifics>
## Specific Ideas

- User trusts Claude's judgment on all implementation details — recommended defaults selected for every decision area
- Canvas visuals should pop against the near-black (#0a0a0f) backgrounds established in Phase 1
- Color ramps should feel scientifically accurate (viridis et al. are perceptually uniform) — this is a simulation kit, not a generic charting library

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-canvas-rendering*
*Context gathered: 2026-03-18*
