---
phase: 04-advanced-rendering
plan: 03
subsystem: rendering
tags: [d3-force, svg, canvas2d, force-graph, react, vitest, typescript]

# Dependency graph
requires:
  - phase: 04-advanced-rendering
    provides: ForceGraphProps, GraphNode, GraphLink type definitions from plan 01
  - phase: 02-canvas-rendering
    provides: color-ramps.ts colorRamps.category10 for default node coloring
provides:
  - ForceGraph component with SVG + Canvas2D rendering modes
  - Interactive node dragging with simulation reheat
  - Hover highlighting with neighbor detection and opacity dimming
  - Auto-pause with onStabilize callback
  - Updated barrel exports for ForceGraph + types
affects: [phase-06-demos]

# Tech tracking
tech-stack:
  added: ["@types/d3-force"]
  patterns: [d3-force-layout-only, rAF-batched-tick, structuredClone-immutability, adjacency-set-precomputation, synchronous-initial-tick]

key-files:
  created:
    - src/rendering/ForceGraph.tsx
  modified:
    - src/rendering/index.ts
    - tests/rendering/ForceGraph.test.tsx
    - package.json

key-decisions:
  - "Synchronous sim.tick() before rAF handler for immediate node positioning on mount"
  - "Immediate alpha check after simulation creation for fast onStabilize detection"
  - "ParticleRenderer barrel type export only (value export deferred until 04-02 creates the file)"
  - "Canvas2D hover labels use canvas text rendering, SVG tooltips use HTML overlay div"

patterns-established:
  - "D3-force layout-only: forceSimulation for position computation, React owns all DOM elements"
  - "Adjacency precomputation: Set<string> of source-target pairs for O(1) neighbor lookup"
  - "rAF-batched tick updates: cancelAnimationFrame + requestAnimationFrame to coalesce simulation ticks"
  - "structuredClone for input immutability: deep-clone nodes/links to prevent d3-force mutation of caller data"

requirements-completed: [REND-08, REND-09, REND-10]

# Metrics
duration: 7min
completed: 2026-03-19
---

# Phase 4 Plan 3: ForceGraph Summary

**Force-directed graph component with D3-force layout, React SVG/Canvas2D rendering, node dragging with reheat, hover dimming, and auto-pause**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-19T08:22:03Z
- **Completed:** 2026-03-19T08:29:19Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Implemented ForceGraph component (350+ lines) with SVG mode for small graphs and Canvas2D for 500+ nodes
- Node dragging with d3-force alphaTarget reheat, shift+release to pin, click to unpin
- Hover highlighting with 1.2x scale on hovered node and 0.2 opacity dimming of non-connected nodes
- Full test coverage: 12 tests covering REND-08 (SVG rendering, layout, immutability), REND-09 (interactions, forces, dimming), REND-10 (auto-pause, canvas threshold)

## Task Commits

Each task was committed atomically:

1. **Task 1: ForceGraph component + install @types/d3-force** - `068b330` (feat)
2. **Task 2: ForceGraph tests** - `1cb0489` (test)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified
- `src/rendering/ForceGraph.tsx` - Force-directed graph component with SVG + Canvas2D modes, drag, hover, tooltip
- `src/rendering/index.ts` - Updated barrel exports with ForceGraph, ForceGraphProps, GraphNode, GraphLink, ParticleRendererProps
- `tests/rendering/ForceGraph.test.tsx` - 12 tests for REND-08, REND-09, REND-10
- `package.json` - Added @types/d3-force devDependency

## Decisions Made
- Added synchronous `sim.tick()` call before rAF handler so nodes get initial positions immediately on mount (prevents blank initial render)
- Added immediate alpha < alphaMin check after simulation creation for fast onStabilize detection when simulation is already converged
- Exported only ParticleRendererProps type (not value) from barrel since ParticleRenderer.tsx does not exist yet (plan 04-02)
- Used `onStabilizeRef` pattern (ref wrapping callback prop) to avoid stale closure in d3-force 'end' event handler
- Used `exactOptionalPropertyTypes` safe patterns: `node.x ?? null` for fx/fy assignment

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] ParticleRenderer barrel export deferred**
- **Found during:** Task 1 (barrel export update)
- **Issue:** Plan specified `export { ParticleRenderer }` but ParticleRenderer.tsx does not exist (created by plan 04-02 which hasn't run yet)
- **Fix:** Exported only `ParticleRendererProps` type from types.ts; deferred value export until 04-02 creates the file
- **Files modified:** src/rendering/index.ts
- **Verification:** `npx tsc --noEmit` passes, `npx vitest run` all 173 tests pass
- **Committed in:** 068b330 (Task 1 commit)

**2. [Rule 1 - Bug] Added synchronous alpha check for onStabilize**
- **Found during:** Task 2 (testing onStabilize)
- **Issue:** d3-force 'end' event only fires from d3-timer's internal loop, not from manual sim.tick(). When simulation converges immediately (alphaMin > initial alpha), onStabilize was never called
- **Fix:** Added `if (sim.alpha() < alphaMin) onStabilizeRef.current?.()` check after simulation creation in useEffect
- **Files modified:** src/rendering/ForceGraph.tsx
- **Verification:** onStabilize test passes with alphaMin=2 (immediate convergence)
- **Committed in:** 1cb0489 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes necessary for correctness. No scope creep.

## Issues Encountered
- d3-force's internal d3-timer does not advance with vitest fake timers, requiring alternative test strategies: synchronous initial tick for positioning tests, alphaMin > 1.0 trick for stabilize test
- jsdom logs "Not implemented: HTMLCanvasElement's getContext()" for Canvas2D mode tests -- expected behavior, does not affect test correctness

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ForceGraph ready for Social Network demo (Phase 6)
- ParticleRenderer (plan 04-02) still pending -- barrel value export to be added when that plan completes
- All 173 tests passing, TypeScript strict mode clean

---
*Phase: 04-advanced-rendering*
*Completed: 2026-03-19*
