---
phase: 02-canvas-rendering
plan: 02
subsystem: rendering
tags: [react, canvas, pan-zoom, pointer-events, hidpi, raf]

# Dependency graph
requires:
  - phase: 02-01
    provides: "Viewport class, ViewportState/SimCanvasProps/DrawCallback types"
provides:
  - "SimCanvas React component with canvas, pan/zoom, rAF loop"
  - "onDraw(ctx, viewport) callback pattern for child renderers"
affects: [02-03-GridRenderer, 02-04-LayerStack, phase-4-particles, phase-5-heatmap]

# Tech tracking
tech-stack:
  added: []
  patterns: [rAF-loop-via-useRef, non-passive-wheel-listener, pointer-events-pan-zoom, dpr-canvas-scaling]

key-files:
  created:
    - src/rendering/SimCanvas.tsx
  modified:
    - tests/rendering/SimCanvas.test.tsx

key-decisions:
  - "PointerEvents for unified mouse/touch/pen -- single code path for pan, pinch-zoom"
  - "Viewport in useRef (not state) -- avoids re-renders on every pointer move"
  - "Non-passive wheel addEventListener -- React onWheel uses passive listeners, preventing preventDefault"

patterns-established:
  - "rAF loop pattern: useEffect + requestAnimationFrame + mountedRef guard + cancelAnimationFrame cleanup"
  - "Canvas DPR pattern: canvas.width = css_width * dpr, style.width = css_width, setTransform includes dpr"
  - "Momentum pattern: track last 3 velocity frames, average on pointerUp, apply via viewport.startMomentum"

requirements-completed: [REND-01, REND-02]

# Metrics
duration: 3min
completed: 2026-03-18
---

# Phase 2 Plan 02: SimCanvas Summary

**SimCanvas component with DPR-aware canvas, cursor-centered wheel zoom, pointer-event pan with momentum, touch pinch-zoom, and rAF animation loop calling onDraw(ctx, viewport)**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-18T16:03:28Z
- **Completed:** 2026-03-18T16:06:09Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- SimCanvas renders a canvas element with devicePixelRatio-aware sizing for crisp HiDPI displays
- Cursor-centered wheel zoom via non-passive addEventListener (prevents page scroll)
- Click-drag pan via PointerEvents with lerp momentum on release (averaged last 3 velocity frames)
- Touch pinch-zoom via dual pointer tracking with midpoint-centered scaling
- rAF animation loop applies viewport transform and calls onDraw(ctx, viewport) each frame
- 7 tests covering DOM structure, event wiring, prop passing, and clean unmount

## Task Commits

Each task was committed atomically:

1. **Task 1: SimCanvas component implementation** - `8e1279b` (feat)
2. **Task 2: Update SimCanvas tests for full coverage** - `455791f` (test)

**Auto-fix:** `4b257ab` (fix: remove unused rafSpy variable in tests)

## Files Created/Modified
- `src/rendering/SimCanvas.tsx` - SimCanvas React component with canvas, pan/zoom, touch, rAF loop
- `tests/rendering/SimCanvas.test.tsx` - 7 tests for DOM structure, events, props, cleanup

## Decisions Made
- PointerEvents for unified mouse/touch/pen handling -- single code path for pan and pinch-zoom
- Viewport stored in useRef (not useState) to avoid re-renders on every pointer move
- Non-passive wheel addEventListener instead of React onWheel -- React uses passive listeners that prevent preventDefault
- getContext('2d', { alpha: false }) for opaque canvas performance optimization

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Unused variable TS error in test file**
- **Found during:** Task 2 (SimCanvas tests)
- **Issue:** `rafSpy` variable declared but never read, causing `noUnusedLocals` TS error
- **Fix:** Removed variable assignment, kept spy call as statement
- **Files modified:** tests/rendering/SimCanvas.test.tsx
- **Verification:** `npx tsc --noEmit` shows no SimCanvas errors
- **Committed in:** 4b257ab

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor lint fix, no scope creep.

## Issues Encountered
- Test import path `sim-kit/rendering/SimCanvas` not aliased in vitest config -- used relative import `../../src/rendering/SimCanvas` instead (consistent with how the barrel export will work once SimCanvas is exported from index.ts)

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- SimCanvas ready for GridRenderer (plan 03) to use as rendering target via onDraw callback
- LayerStack (plan 04) can compose SimCanvas with SVG overlays
- Viewport class provides coordinate transforms for cell hit-testing in GridRenderer

---
*Phase: 02-canvas-rendering*
*Completed: 2026-03-18*
