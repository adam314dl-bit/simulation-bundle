---
phase: 01-infrastructure-core-engine
plan: "05"
subsystem: core
tags: [zustand, react-context, raf, tick-loop, simulation-engine, hooks]

# Dependency graph
requires:
  - phase: 01-03
    provides: Vite build pipeline, Tailwind theme CSS, barrel exports
  - phase: 01-04
    provides: RingBuffer utility for history storage
provides:
  - SimStore interface with full playback control API (11 actions)
  - createSimStore factory using zustand/vanilla (per-instance stores)
  - Fixed-timestep rAF tick loop with accumulator pattern and speed scaling
  - SimulationProvider React component with per-instance store context
  - useSimulation hook with shallow equality and convenience selectors
  - Core barrel exports (src/core/index.ts)
affects: [rendering, controls, data, demos]

# Tech tracking
tech-stack:
  added: [zustand/vanilla createStore, zustand useStore, zustand/shallow useShallow]
  patterns: [per-instance-store-via-context, fixed-timestep-accumulator, vanilla-zustand-in-raf, useLayoutEffect-for-raf-registration]

key-files:
  created:
    - src/core/store.ts
    - src/core/tick-loop.ts
    - src/core/SimulationProvider.tsx
    - src/core/useSimulation.ts
  modified:
    - src/core/index.ts

key-decisions:
  - "useShallow for selector equality: prevents infinite re-render when selectors return object literals"
  - "lastTime initialized to 0 instead of null: first rAF frame produces real delta, MAX_DELTA_MS clamp handles browser startup"
  - "exactOptionalPropertyTypes: manually construct SimConfig to avoid passing undefined for optional fields"

patterns-established:
  - "Per-instance store: createSimStore returns StoreApi, SimulationProvider wraps in Context -- no global store"
  - "Vanilla Zustand in rAF: tick loop uses store.getState()/setState() to bypass React rendering"
  - "useLayoutEffect for rAF: prevents ghost frames in React StrictMode (synchronous cleanup)"
  - "Shallow equality hook: useSimulation wraps useShallow(selector) for safe object selectors"

requirements-completed: [CORE-01, CORE-02, CORE-03, CORE-04, CORE-05, CORE-06]

# Metrics
duration: 3min
completed: 2026-03-18
---

# Phase 1 Plan 5: Core Simulation Engine Summary

**Zustand store factory + rAF tick loop + SimulationProvider + useSimulation hook with full CORE-01 through CORE-06 playback API**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-18T15:13:59Z
- **Completed:** 2026-03-18T15:17:24Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- SimStore with 11 actions: play, pause, toggle, step, stepBack, setSpeed, setParameter, resetParameters, seekToTick, logEvent, subscribe
- Fixed-timestep accumulator tick loop with speed scaling (0.25x-16x) and visibilitychange background-tab pause
- Per-instance Zustand store via React Context (no global store, multiple sims per page)
- All 44 tests pass (6 core + 6 history + 18 theme + 14 build)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create store.ts and tick-loop.ts** - `1ef90f3` (feat)
2. **Task 2: Create SimulationProvider.tsx, useSimulation.ts, wire core exports** - `10c555c` (feat)

## Files Created/Modified
- `src/core/store.ts` - SimStore interface, createSimStore factory, extractDefaultParameters helper
- `src/core/tick-loop.ts` - startTickLoop with rAF accumulator, speed scaling, visibilitychange handler
- `src/core/SimulationProvider.tsx` - React provider creating per-instance store, useLayoutEffect for tick loop
- `src/core/useSimulation.ts` - Primary hook with useShallow, convenience selectors (useIsRunning, useTick, useSpeed, usePlayback, useParameters, useEvents)
- `src/core/index.ts` - Updated barrel exports for full core public API

## Decisions Made
- Used `useShallow` from zustand/shallow in useSimulation to prevent infinite re-render loops when selectors return new object references (e.g., `s => ({ play: s.play, pause: s.pause })`)
- Initialized tick loop `lastTime = 0` instead of `null` so first rAF frame produces real delta; MAX_DELTA_MS (250ms) clamp prevents excessive catchup ticks in real browser startup
- Manually constructed SimConfig object in SimulationProvider to satisfy TypeScript exactOptionalPropertyTypes (avoids passing `undefined` for optional fields)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed infinite re-render in useSimulation with object selectors**
- **Found during:** Task 2 (useSimulation implementation)
- **Issue:** CORE-04 test uses `(s) => ({...})` selector creating new object reference each render, causing Zustand's default Object.is equality check to trigger infinite re-renders
- **Fix:** Wrapped selector with `useShallow` from zustand/shallow for shallow equality comparison
- **Files modified:** src/core/useSimulation.ts
- **Verification:** CORE-04 test passes without Maximum update depth error
- **Committed in:** 10c555c (Task 2 commit)

**2. [Rule 3 - Blocking] Fixed exactOptionalPropertyTypes TypeScript error in SimulationProvider**
- **Found during:** Task 2 (SimulationProvider implementation)
- **Issue:** Passing `parameters`, `maxHistoryLength`, `keepRunning` directly to createSimStore caused TS2379 because `undefined` is not assignable to optional properties under exactOptionalPropertyTypes
- **Fix:** Manually construct SimConfig object, only setting properties when not undefined
- **Files modified:** src/core/SimulationProvider.tsx
- **Verification:** `npx tsc -p tsconfig.build.json --noEmit` exits 0
- **Committed in:** 10c555c (Task 2 commit)

**3. [Rule 1 - Bug] Fixed tick loop first-frame zero delta preventing test ticks**
- **Found during:** Task 2 (CORE-05 test verification)
- **Issue:** `lastTime = null` caused first rAF frame to record timestamp and produce 0 delta, so single-frame test advances produced 0 ticks
- **Fix:** Initialize `lastTime = 0` so first frame gets real delta; MAX_DELTA_MS clamp prevents spiral in real browsers
- **Files modified:** src/core/tick-loop.ts
- **Verification:** CORE-05 test passes (2x speed fires 2 ticks vs 1 at 1x)
- **Committed in:** 10c555c (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (2 bugs, 1 blocking)
**Impact on plan:** All fixes necessary for correctness and test compliance. No scope creep.

## Issues Encountered
None beyond the auto-fixed deviations above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Core simulation engine complete -- all components in Phases 2-5 can consume SimulationProvider and useSimulation
- Full playback API exposed: play, pause, toggle, step, stepBack, setSpeed, setParameter, resetParameters, seekToTick, logEvent, subscribe
- Remaining Phase 1 plan: 01-06 (Storybook configuration)

---
*Phase: 01-infrastructure-core-engine*
*Completed: 2026-03-18*
