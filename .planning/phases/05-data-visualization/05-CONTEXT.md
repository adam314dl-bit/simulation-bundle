# Phase 5: Data Visualization - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers the 5 data visualization components (StatsPanel, MiniChart, EventLog, HeatmapOverlay, EntityInspector) that let users monitor simulation state through live stats, charts, event feeds, heatmap overlays, and entity inspection. All components integrate with the existing SimulationProvider/useSimulation hook system from Phase 1.

</domain>

<decisions>
## Implementation Decisions

### Data Panel Layout & Density
- StatsPanel uses 2-column CSS grid layout, matching ParameterPanel's compact mode pattern from Phase 3
- Stat value formatting via Intl.NumberFormat with configurable options prop for flexibility
- Inline sparklines at 60×20px SVG — small enough for stat rows, still readable
- Change indicators (▲/▼) use percentage-based comparison with configurable threshold (default 0 — any change shows arrow)

### Chart & Event Rendering
- MiniChart throttles updates via requestAnimationFrame gate — prevents Recharts re-renders from degrading tick loop performance
- EventLog virtualization via manual windowed rendering (calculate visible rows from scroll position + row height) — zero extra dependencies, consistent with codebase pattern of minimal deps
- EventLog severity colors mapped to CSS custom properties (`--sim-info`, `--sim-warning`, `--sim-critical`) extending the existing `--sim-*` theming system
- Click-to-seek in EventLog calls `seekToTick()` already exposed by useSimulation (CORE-04)

### Overlay & Inspector Positioning
- HeatmapOverlay renders on a separate canvas element layered via LayerStack — reuses Phase 2 compositing infrastructure
- Bilinear interpolation implemented manually (4-sample weighted average in JS) for predictable cross-browser results
- EntityInspector floating mode drag uses pointer events + CSS transform translate — matches SimCanvas pan interaction pattern
- EntityInspector positioning driven by CSS via `position` prop accepting "right" | "bottom" | "floating" — no layout library needed

### Claude's Discretion
- Internal component decomposition and file organization within the data layer
- Test strategy details (unit vs integration split)
- Recharts configuration specifics for MiniChart (area vs line, color, animation)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useSimulation` hook (src/core/useSimulation.ts) — exposes play/pause/step/seekToTick/logEvent/subscribe for all data components
- `SimulationContext` + `SimStore` — Zustand store with tick, entities, events, parameters, history
- Color ramps (src/rendering/color-ramps.ts) — 6 built-in ramps reusable for HeatmapOverlay
- `LayerStack` (src/rendering/LayerStack.tsx) — composites multiple canvas/SVG layers, used for HeatmapOverlay integration
- `SimCanvas` (src/rendering/SimCanvas.tsx) — viewport/pan/zoom pattern reusable for HeatmapOverlay canvas
- CSS custom properties (`--sim-*`) — theming system for consistent styling
- `history-buffer.ts` (src/utils/) — ring buffer for historical data access

### Established Patterns
- Zustand vanilla API (getState/setState) for tick-rate updates outside React render cycle
- Pointer events for unified mouse/touch interaction (used in SimCanvas, ForceGraph)
- Inline styles + CSS custom properties for component styling (no separate CSS files per component)
- Barrel exports per layer directory (src/data/index.ts already scaffolded)
- ResizeObserver stub pattern in tests for jsdom compatibility

### Integration Points
- src/data/index.ts — barrel export file (currently empty placeholder)
- src/index.ts — top-level re-export needs data layer additions
- useSimulation hook — all data components subscribe to simulation state
- LayerStack — HeatmapOverlay integrates as a composited layer
- SimEvent type (src/types/) — EventLog renders these events

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. Requirements DATA-01 through DATA-06 provide detailed component specs.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
