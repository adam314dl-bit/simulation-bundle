# Simulation Playground UI Kit

## What This Is

An 18-component React library for building interactive simulation interfaces. Ships with 3 working demo simulations (predator-prey ecosystem, particle physics/flocking, social network opinion dynamics), full TypeScript types, Storybook stories, and documentation. Targets creative coders, gamedevs, educators, and simulation researchers. Sold as a premium UI kit on Gumroad ($49 full / $29 core tier).

## Core Value

Every simulation needs the same UI scaffolding — tick loops, parameter panels, timeline scrubbers, live stats. This kit eliminates that boilerplate so buyers go from idea to interactive sim in minutes, not days.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] 18 components across 4 layers: core (2), rendering (5), controls (4), data (5)
- [ ] SimulationProvider with Zustand-based tick loop, history ring buffer, and full playback control
- [ ] Canvas rendering with pan/zoom, grid rendering with dirty-rect optimization, WebGL2 particle system, D3-force graph with React SVG rendering
- [ ] Auto-generated parameter panel from schema, timeline scrubber with keyframes, playback bar, preset selector
- [ ] Live stats panel, mini sparkline charts, event log with filtering, heatmap overlay, entity inspector
- [ ] 3 working demos: ecosystem (Lotka-Volterra grid), particles (N-body + flocking), social network (opinion dynamics)
- [ ] Full TypeScript types (strict mode) with exported type definitions
- [ ] Storybook 8 stories for all components with interactive prop playgrounds
- [ ] Dark theme by default with CSS custom property theming (`--sim-*` namespace)
- [ ] Tree-shakable library build with separate entry points per layer (core, rendering, controls, data, demos)
- [ ] 6 built-in color ramps (viridis, inferno, plasma, coolwarm, terrain, category10)
- [ ] README with quick start, component reference, "create your own sim" guide, theming docs, performance guide

### Out of Scope

- Gumroad/UI8 page setup and marketing — code-only scope, marketing handled separately
- GIF/screenshot capture tooling — manual step outside the build
- Mobile-native builds — web only
- Server-side simulation — all client-side
- Real-time multiplayer/sync — single-user simulations only
- CI/CD pipeline — local dev and build only

## Context

- This is a commercial product intended for sale on Gumroad (primary) and UI8 (secondary)
- Two pricing tiers planned: $49 full kit (18 components + 3 demos) and $29 core tier (13 components, no demos) — build should structure exports to support clean tier separation
- The particle demo's "Galaxy spiral" preset is the hero visual for marketing — it needs to look striking
- Components will be reused across future projects: MLOps Command Center, simulation engine, learning platform
- The spec provides detailed TypeScript interfaces for every component — these are the API contract
- Performance targets: 500×500 grid at 30fps, 100k particles at 60fps — pursue reasonable optimizations without over-engineering the most exotic paths (OffscreenCanvas worker can be deferred)

## Constraints

- **Tech stack**: React + TypeScript + Tailwind + Zustand + Vite (exact versions to be determined by research)
- **Charts**: Recharts for MiniChart (lightweight, React-native, tree-shakable)
- **Canvas**: Canvas2D for grids, WebGL2 for particles (with Canvas2D fallback)
- **Graph**: D3-force for layout only, React renders SVG nodes (no D3 DOM manipulation)
- **Styling**: Tailwind for layout, CSS custom properties for theming — buyers override `--sim-*` vars
- **Build output**: ES modules + CJS, React/Zustand/Recharts/D3 as external peer dependencies
- **License**: MIT

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Code-only scope (no GTM tasks) | Marketing is a separate workflow, keep build focused | — Pending |
| Storybook timing decided per-phase | Some components benefit from stories during build, others don't | — Pending |
| Research best dependency versions | User wants optimal choices, not just what spec pinned | — Pending |
| Structured exports for tier separation | Enables clean $29/$49 tier split at packaging time without code duplication | — Pending |
| Reasonable perf over exotic optimizations | Hit 80%+ of targets with core optimizations, defer OffscreenCanvas worker | — Pending |

---
*Last updated: 2026-03-18 after initialization*
