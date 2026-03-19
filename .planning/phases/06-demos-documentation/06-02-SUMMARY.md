---
phase: 06-demos-documentation
plan: 02
subsystem: demos
tags: [react, lotka-volterra, cellular-automaton, grid-renderer, minichart]

requires:
  - phase: 06-demos-documentation
    provides: DemoLayout shared component, test scaffolds for DEMO-01/DEMO-02
  - phase: 05-data-visualization
    provides: StatsPanel, MiniChart, EventLog components
  - phase: 03-controls-interaction
    provides: ParameterPanel, TimelineControl, PresetSelector components
  - phase: 02-canvas-rendering
    provides: GridRenderer, color ramps
provides:
  - Ecosystem demo with Lotka-Volterra predator-prey simulation
  - ecosystemTick function, EcosystemEntities type, ecosystemSchema
  - 4 ecosystem presets (Stable coexistence, Fox extinction, Overpopulation crash, Chaos)
  - EcosystemDemo composed component with full sim-kit dashboard
affects: [06-04-barrel-exports, 06-05-storybook, 06-06-readme]

tech-stack:
  added: []
  patterns: [Stochastic cellular automaton with Fisher-Yates shuffle, immutable Uint8Array grid per tick, MiniChart stable selector pattern]

key-files:
  created:
    - src/demos/ecosystem/simulation.ts
    - src/demos/ecosystem/presets.ts
    - src/demos/ecosystem/index.tsx
  modified:
    - tests/demos/ecosystem.test.tsx
    - src/controls/ParameterPanel.tsx

key-decisions:
  - "category10 color ramp for discrete grid values (0-3 mapped to distinct colors)"
  - "Stable selector references defined outside component for MiniChart performance"
  - "data-testid wrapper divs for GridRenderer, TimelineControl, PresetSelector in demo (native components lack testids)"
  - "Event logging thresholds: extinction on zero, boom on 2x in 10 ticks, snapshot every 100 ticks"

patterns-established:
  - "Demo composition: SimulationProvider wrapping DemoLayout with slot-based component wiring"
  - "MiniChart selectors as module-level const to avoid re-subscription on every render"
  - "Type casting for MiniChart selector: (s: Record<string, unknown>) => number to satisfy generic prop type"

requirements-completed: [DEMO-01, DEMO-02]

duration: 5min
completed: 2026-03-19
---

# Phase 6 Plan 2: Ecosystem Demo Summary

**Lotka-Volterra predator-prey cellular automaton on 100x100 grid with 3 MiniCharts, 8 parameters, 4 presets, and full dashboard UI**

## Performance

- **Duration:** 5min
- **Started:** 2026-03-19T10:03:26Z
- **Completed:** 2026-03-19T10:09:10Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Stochastic cellular automaton implementing Lotka-Volterra dynamics with grass/rabbits/foxes
- 4 ecosystem presets producing distinct population dynamics (stable, extinction, crash, chaos)
- Complete dashboard with GridRenderer, 3 MiniCharts, StatsPanel, EventLog, ParameterPanel, TimelineControl, PresetSelector
- All 12 DEMO-01/DEMO-02 tests passing green

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement ecosystem simulation logic and presets** - `d510b75` (feat)
2. **Task 2: Compose EcosystemDemo component with all required UI including 3 MiniCharts** - `bf13034` (feat)

## Files Created/Modified
- `src/demos/ecosystem/simulation.ts` - Lotka-Volterra tickFn, EcosystemEntities type, ecosystemSchema (8 params), createEcosystem factory
- `src/demos/ecosystem/presets.ts` - 4 presets: Stable coexistence, Fox extinction, Overpopulation crash, Chaos
- `src/demos/ecosystem/index.tsx` - EcosystemDemo component composing all sim-kit UI in DemoLayout
- `tests/demos/ecosystem.test.tsx` - Fixed test expectations (preset.config, minichart testid, event-log-container testid)
- `src/controls/ParameterPanel.tsx` - Added data-testid="parameter-panel" for test compatibility

## Decisions Made
- Used category10 color ramp for discrete grid cell types (0=empty, 1=grass, 2=rabbit, 3=fox) -- better visual distinction than continuous ramps
- Defined MiniChart selectors as module-level constants outside the component to prevent re-subscription on re-renders (performance pattern from Phase 5 decisions)
- Wrapped components lacking native data-testid (GridRenderer, TimelineControl, PresetSelector) in div wrappers with testids for test compatibility
- Event logging: extinction events fire on species reaching zero, boom events fire when species doubles in 10 ticks, periodic snapshots every 100 ticks

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed test expectations to match actual component interfaces**
- **Found during:** Task 1
- **Issue:** Test scaffold (06-01) used `preset.parameters` but Preset interface uses `config`; used `mini-chart` but MiniChart uses `minichart`; used `event-log` but EventLog uses `event-log-container`
- **Fix:** Updated test expectations to match actual component interfaces and testid values
- **Files modified:** tests/demos/ecosystem.test.tsx
- **Verification:** All 12 tests pass
- **Committed in:** d510b75 (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Test scaffold corrections were necessary for tests to validate actual component behavior. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Ecosystem demo fully functional, ready for barrel export in plan 06-04
- Pattern established for remaining demos (particles 06-03, network 06-04)
- 12 DEMO-01/DEMO-02 tests green, existing test suite unaffected

## Self-Check: PASSED

All created files verified present. All commit hashes found in git log.

---
*Phase: 06-demos-documentation*
*Completed: 2026-03-19*
