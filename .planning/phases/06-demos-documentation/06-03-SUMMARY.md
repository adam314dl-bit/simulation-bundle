---
phase: 06-demos-documentation
plan: 03
subsystem: demos
tags: [react, webgl2, n-body, boids, float32array, particle-simulation]

requires:
  - phase: 04-advanced-rendering
    provides: ParticleRenderer with WebGL2 trails and Canvas2D fallback
  - phase: 06-demos-documentation
    provides: DemoLayout shared component, test scaffolds for DEMO-03/04
provides:
  - N-body + Boids particle simulation tick function
  - 4 particle presets (Galaxy spiral with trails, Boids flocking, Orbit chaos, Fireworks)
  - ParticlesDemo composed component with click-to-place attractors
affects: [06-04-barrel-exports, 06-05-storybook]

tech-stack:
  added: []
  patterns: [wrappedTick pattern for injecting ref-based state into tick functions, provider key remount for preset reinitialization, custom preset cards for external selection handlers]

key-files:
  created:
    - src/demos/particles/simulation.ts
    - src/demos/particles/presets.ts
  modified:
    - src/demos/particles/index.tsx
    - tests/demos/particles.test.tsx
    - src/controls/ParameterPanel.tsx

key-decisions:
  - "Wrapped tick function pattern: useRef<Attractor[]> injected into entities via useCallback wrapper, avoiding stale closure"
  - "Provider key remount: increment key to force SimulationProvider remount on preset change (resets entities + params)"
  - "Custom PresetCards instead of PresetSelector: PresetSelector uses internal setParameter which cannot reinitialize entities or update renderer props"
  - "Inter-particle gravity scaled by 0.001 and limited to count <= 2000 for O(n^2) performance budget"

patterns-established:
  - "wrappedTick: useCallback wrapper that injects mutable ref state into immutable tick function"
  - "Provider key remount: setProviderKey(k+1) to reset SimulationProvider when initialEntities change"
  - "data-testid on wrapping div when underlying component lacks testid attribute"

requirements-completed: [DEMO-03, DEMO-04]

duration: 6min
completed: 2026-03-19
---

# Phase 6 Plan 3: Particles Demo Summary

**N-body + Boids particle simulation with 4 presets, click-to-place attractors, and ParticleRenderer trail effects**

## Performance

- **Duration:** 6min
- **Started:** 2026-03-19T10:03:27Z
- **Completed:** 2026-03-19T10:09:30Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Particle simulation with N-body gravity (O(n^2) for count <= 2000) and optional Boids flocking (separation, alignment, cohesion)
- 4 presets covering distinct visual regimes: Galaxy spiral with additive trails, Boids flocking, Orbit chaos with auto-placed attractors, Fireworks burst
- Click-to-place attractors (max 5) with world-space coordinate conversion
- All 9 DEMO-03/DEMO-04 tests passing green

## Task Commits

Each task was committed atomically:

1. **Task 1: Implement particle simulation logic and presets** - `c92c6f8` (feat)
2. **Task 2: Compose ParticlesDemo component with all required UI** - `99d4688` (feat)

## Files Created/Modified
- `src/demos/particles/simulation.ts` - N-body + Boids tick function, createParticles factory, 8-param schema
- `src/demos/particles/presets.ts` - 4 particle presets with renderer metadata (_trails, _blendMode, _pattern)
- `src/demos/particles/index.tsx` - ParticlesDemo component composing SimulationProvider, ParticleRenderer, ParameterPanel, PlaybackBar, StatsPanel with custom preset cards
- `tests/demos/particles.test.tsx` - Fixed test scaffold: Preset.config (not .parameters), added stats to initial entities, getAllByText for multiple matches
- `src/controls/ParameterPanel.tsx` - Added data-testid="parameter-panel" for test discoverability

## Decisions Made
- Wrapped tick function pattern: attractors stored in useRef and injected via useCallback wrapper to avoid stale closures while maintaining immutable tick function signature
- Custom PresetCards component instead of PresetSelector: PresetSelector calls setParameter internally and cannot trigger entity reinitialization or update ParticleRenderer trail/blend props
- Provider key remount: incrementing key forces SimulationProvider remount on preset change, cleanly resetting entities and parameter state
- Inter-particle N-body gravity scaled by 0.001 and gated to count <= 2000 to keep tick under 2ms budget

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Fixed test scaffold to match Preset interface**
- **Found during:** Task 1
- **Issue:** Test used `galaxy!.parameters.trails` but Preset interface uses `config` not `parameters`, and plan specifies `_trails`/`_blendMode` prefixed keys
- **Fix:** Changed test to `galaxy!.config._trails` and `galaxy!.config._blendMode`; added missing `stats` field to test initial entities
- **Files modified:** tests/demos/particles.test.tsx
- **Verification:** All preset tests pass
- **Committed in:** c92c6f8 (Task 1 commit)

**2. [Rule 3 - Blocking] Added data-testid to ParameterPanel**
- **Found during:** Task 1
- **Issue:** Test expects `getByTestId('parameter-panel')` but ParameterPanel lacked data-testid attribute (StatsPanel and PlaybackBar already had them)
- **Fix:** Added `data-testid="parameter-panel"` to ParameterPanel root div
- **Files modified:** src/controls/ParameterPanel.tsx
- **Verification:** ParameterPanel test passes
- **Committed in:** c92c6f8 (Task 1 commit)

**3. [Rule 1 - Bug] Fixed multiple text match in render test**
- **Found during:** Task 2
- **Issue:** `screen.getByText(/particles/i)` found multiple elements (title + "Particle Count" label)
- **Fix:** Changed to `screen.getAllByText(/particles/i).length > 0`
- **Files modified:** tests/demos/particles.test.tsx
- **Verification:** Render test passes
- **Committed in:** 99d4688 (Task 2 commit)

---

**Total deviations:** 3 auto-fixed (1 bug, 2 blocking)
**Impact on plan:** All fixes necessary for tests to pass. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- ParticlesDemo ready for barrel export in plan 06-04
- All 9 DEMO-03/DEMO-04 tests green
- 250 total tests passing (29 RED scaffolds remain for plans 06-05/06-06)

## Self-Check: PASSED

- [x] src/demos/particles/simulation.ts exists
- [x] src/demos/particles/presets.ts exists
- [x] src/demos/particles/index.tsx exists
- [x] Commit c92c6f8 exists (Task 1)
- [x] Commit 99d4688 exists (Task 2)

---
*Phase: 06-demos-documentation*
*Completed: 2026-03-19*
