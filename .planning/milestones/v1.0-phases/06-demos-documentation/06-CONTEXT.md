# Phase 6: Demos + Documentation - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

This phase delivers three fully-integrated demo simulations (ecosystem, particles, social network), Storybook stories for all 18 components, and comprehensive README documentation. Every component from Phases 1-5 is exercised in at least one demo. This is the integration and polish phase — no new components are created.

</domain>

<decisions>
## Implementation Decisions

### Demo Simulation Design
- Single-page layout per demo: renderer (left/center), controls sidebar (right), data panels (bottom) — standard simulation dashboard pattern
- Demo file organization: `src/demos/{name}/` with index.tsx (main component), simulation.ts (tick logic), presets.ts (parameter presets)
- Minimal shared layout component for consistent panel arrangement across demos — keeps demos self-contained while looking cohesive
- Vite dev server with route-based demo selection (/, /particles, /network) for development

### Storybook Strategy
- Stories grouped by layer: Core/, Rendering/, Controls/, Data/ — mirrors src/ directory structure
- Interactive controls via Storybook argTypes with sensible defaults — auto-discovers props from TypeScript types
- Lightweight mock SimulationProvider wrapper with canned tick data for stories that need simulation context
- Skip visual regression tests for v1 — manual visual verification sufficient

### README & Documentation
- README structure: Quick Start → Component Reference → Create Your Own Sim → Theming → Performance — matches DOCS-01 through DOCS-05 requirement order
- Code examples as inline TypeScript snippets with minimal imports — copy-paste friendly for buyers
- Component reference: props table + single usage example + brief description per component — concise, not exhaustive
- Performance guide: practical guidelines (grid size limits, particle count recommendations, rAF tips) — not synthetic benchmarks

### Claude's Discretion
- Exact simulation parameters and formulas for each demo (Lotka-Volterra coefficients, N-body constants, opinion dynamics thresholds)
- Preset tuning — specific parameter values for each of the 4 presets per demo
- Storybook decorator patterns and mock data specifics
- README prose style and section lengths

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- All 18 components from Phases 1-5: SimulationProvider, useSimulation, SimCanvas, GridRenderer, LayerStack, ParticleRenderer, ForceGraph, ParameterPanel, TimelineControl, PlaybackBar, PresetSelector, StatsPanel, MiniChart, EventLog, HeatmapOverlay, EntityInspector
- Color ramps (6 built-in) for heatmap and particle demos
- WebGL helpers for particle demo
- History ring buffer for timeline scrubbing in demos
- CSS custom properties (`--sim-*`) for consistent theming across all demos

### Established Patterns
- SimulationProvider wraps each demo with tickFn + initialEntities + parameters
- useSimulation hook for all component-to-simulation wiring
- Barrel exports from each layer (core, rendering, controls, data)
- Inline styles + CSS custom properties (no separate CSS per component)
- Vitest + React Testing Library for tests
- Storybook 10 already configured (INFRA-06)

### Integration Points
- src/demos/index.ts — barrel export for demo tier ($49 full kit)
- src/index.ts — already re-exports all layers, demos layer needs addition
- .storybook/ — already configured, needs story files per component
- README.md — top-level project documentation
- package.json — may need storybook scripts update

</code_context>

<specifics>
## Specific Ideas

- Galaxy spiral preset with trails must produce a visually striking hero image suitable for marketing (per PROJECT.md)
- Ecosystem demo uses Lotka-Volterra predator-prey on a 2D grid (grass/rabbits/foxes) — classic cellular automaton
- Social network demo uses bounded confidence opinion dynamics on a scale-free graph — demonstrates ForceGraph + EntityInspector
- Quick start must get buyer from `npm install` to seeing ecosystem demo in under 5 minutes

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
