# Simulation Playground UI Kit

## What This Is

An 18-component React library for building interactive simulation interfaces. Ships with 3 working demo simulations (predator-prey ecosystem, particle physics/flocking, social network opinion dynamics), full TypeScript types, Storybook stories, and documentation. Targets creative coders, gamedevs, educators, and simulation researchers. Sold as a premium UI kit on Gumroad ($49 full / $29 core tier).

## Core Value

Every simulation needs the same UI scaffolding — tick loops, parameter panels, timeline scrubbers, live stats. This kit eliminates that boilerplate so buyers go from idea to interactive sim in minutes, not days.

## Current State

**Shipped:** v1.0 (2026-03-19)
**Codebase:** 6,666 LOC TypeScript across 43 source files, 279 tests passing
**Stack:** React 19, TypeScript 5.9, Tailwind v4, Zustand 5, Vite 7.3, Recharts 3.8, D3-force 3.0, Storybook 10.3

## Requirements

### Validated

- ✓ SimulationProvider with Zustand-based tick loop, history ring buffer, and full playback control — v1.0
- ✓ Canvas rendering with pan/zoom, grid rendering with dirty-rect optimization — v1.0
- ✓ Dark theme by default with CSS custom property theming (`--sim-*` namespace) — v1.0
- ✓ Tree-shakable library build with separate entry points per layer — v1.0
- ✓ 6 built-in color ramps (viridis, inferno, plasma, coolwarm, terrain, category10) — v1.0
- ✓ Auto-generated parameter panel from schema, timeline scrubber, playback bar, preset selector — v1.0
- ✓ WebGL2 particle system (100k particles at 60fps) with Canvas2D fallback — v1.0
- ✓ D3-force graph with React SVG/Canvas2D rendering and interactive node manipulation — v1.0
- ✓ WebGL helper utilities (context creation, shader compilation, buffer management, instanced draw) — v1.0
- ✓ Live stats panel with inline SVG sparklines and change indicators — v1.0
- ✓ Mini sparkline charts via Recharts with rAF-gated updates — v1.0
- ✓ Event log with severity filtering, virtualization, and click-to-seek — v1.0
- ✓ Canvas heatmap overlay with bilinear interpolation and color ramps — v1.0
- ✓ Entity inspector with inline charts, track toggle, and floating positioning — v1.0
- ✓ 3 working demos: ecosystem, particles, social network — v1.0
- ✓ Storybook stories for all 18 components with interactive prop playgrounds — v1.0
- ✓ README with quick start, component reference, create-your-own guide, theming, and performance docs — v1.0

### Active

(None — all v1 requirements shipped. Define v1.1 requirements via `/gsd:new-milestone`.)

### Out of Scope

- Gumroad/UI8 page setup and marketing — code-only scope, marketing handled separately
- GIF/screenshot capture tooling — manual step outside the build
- Mobile-native builds — web only
- Server-side simulation — all client-side
- Real-time multiplayer/sync — single-user simulations only
- CI/CD pipeline — local dev and build only

## Context

- v1.0 shipped with all 53 requirements satisfied, 279 tests passing
- Two pricing tiers ready: $49 full kit (18 components + 3 demos) and $29 core tier (13 components, no demos) — subpath exports support clean tier separation
- Galaxy spiral particle preset produces marketing-quality hero visual with trails + additive blending
- Components ready for reuse across future projects: MLOps Command Center, simulation engine, learning platform
- HeatmapOverlay is built and tested but not showcased in any demo — potential v1.1 enhancement

## Constraints

- **Tech stack**: React 19 + TypeScript 5.9 + Tailwind v4 + Zustand 5 + Vite 7.3
- **Charts**: Recharts 3.8 for MiniChart
- **Canvas**: Canvas2D for grids, WebGL2 for particles (with Canvas2D fallback)
- **Graph**: D3-force 3.0 for layout only, React renders SVG nodes
- **Styling**: Tailwind for layout, CSS custom properties for theming — buyers override `--sim-*` vars
- **Build output**: ES modules, React/Zustand/Recharts/D3 as external peer dependencies
- **License**: MIT

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Code-only scope (no GTM tasks) | Marketing is a separate workflow, keep build focused | ✓ Good — kept velocity high |
| Storybook stories in Phase 6 (not per-phase) | Batch all stories together after components stabilize | ✓ Good — no rework from API changes |
| Research best dependency versions | Optimal choices for React 19 + Vite 7 ecosystem | ✓ Good — zero dep conflicts |
| Structured exports for tier separation | Enables clean $29/$49 split without code duplication | ✓ Good — 7 subpath exports working |
| Reasonable perf over exotic optimizations | Hit targets with core optimizations, defer OffscreenCanvas worker | ✓ Good — all perf targets met |
| Zustand vanilla API for tick loop | getState/setState outside React renders | ✓ Good — zero tick-rate re-renders |
| D3-force layout-only pattern | React owns all SVG/Canvas DOM, D3 only computes positions | ✓ Good — clean React integration |
| Manual EventLog virtualization | No react-window/react-virtuoso — zero extra deps | ✓ Good — 32px fixed rows, simple math |
| structuredClone for input immutability | Prevents D3-force from mutating caller node/link objects | ✓ Good — no mutation bugs |

---
*Last updated: 2026-03-19 after v1.0 milestone*
