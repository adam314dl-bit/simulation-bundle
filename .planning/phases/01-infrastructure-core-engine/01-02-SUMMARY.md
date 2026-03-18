---
phase: 01-infrastructure-core-engine
plan: "02"
subsystem: infra
tags: [typescript, package-json, subpath-exports, css-custom-properties, tailwindcss, zustand, recharts, d3]

# Dependency graph
requires:
  - phase: 01-infrastructure-core-engine/01
    provides: "Vitest test scaffold with path aliases and failing test stubs"
provides:
  - "sim-kit package.json with 7 subpath exports and sideEffects declaration"
  - "Strict TypeScript configs (tsconfig.json + tsconfig.build.json)"
  - "All public type definitions (SimulationState, SimConfig, TickFn, PlaybackState, SpeedPreset, ParameterSchema, SimEvent)"
  - "CSS theme file with 15 --sim-* design tokens and @import tailwindcss"
  - "Layer entry point stubs for core, rendering, controls, data, demos, utils"
  - "Root barrel index re-exporting all layers"
affects: [01-03, 01-04, 01-05, 01-06]

# Tech tracking
tech-stack:
  added: [zustand ^5.0.12, recharts ^3.8.0, d3-force ^3.0.0, d3-quadtree ^3.0.1, clsx ^2.1.0, vite ~7.3.0, tailwindcss ^4.2.1, storybook ^10.3.0, vite-plugin-dts ^4.5.4, vite-plugin-lib-inject-css ^2.0.0]
  patterns: [subpath-exports, strict-typescript, css-custom-properties, barrel-re-exports, layer-architecture]

key-files:
  created:
    - package.json
    - tsconfig.json
    - tsconfig.build.json
    - src/types/index.ts
    - src/theme/index.css
    - src/core/index.ts
    - src/rendering/index.ts
    - src/controls/index.ts
    - src/data/index.ts
    - src/demos/index.ts
    - src/utils/index.ts
    - src/index.ts
  modified:
    - package-lock.json

key-decisions:
  - "Downgraded @vitejs/plugin-react from ^6.0.1 to ^5.2.0 for vite 7.x compatibility (v6 requires vite 8)"
  - "Added jsdom, @csstools/css-parser-algorithms, @csstools/css-tokenizer as devDependencies (missing from plan but required by test scaffold and jsdom)"
  - "Kept repository/bugs/homepage fields from original package.json for GitHub integration"

patterns-established:
  - "Layer architecture: src/{core,rendering,controls,data,demos,utils}/index.ts as entry points"
  - "Type-first contracts: all public types in src/types/index.ts, re-exported through layer indexes"
  - "CSS custom properties: all design tokens as --sim-* variables in :root for buyer override"
  - "Subpath exports: import from 'sim-kit/core', 'sim-kit/rendering' etc. for tree-shaking"

requirements-completed: [INFRA-01, INFRA-03, INFRA-05, INFRA-07, THEME-01, THEME-02]

# Metrics
duration: 5min
completed: 2026-03-18
---

# Phase 01 Plan 02: Project Structure Summary

**sim-kit package.json with 7 subpath exports, strict TypeScript configs, 10 public type definitions, 15 CSS design tokens, and 6 layer entry point stubs**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-18T14:56:14Z
- **Completed:** 2026-03-18T15:01:33Z
- **Tasks:** 3
- **Files modified:** 13

## Accomplishments
- Package.json with sim-kit identity, 7 export entries (. + 5 layers + style.css), sideEffects: ["*.css"], and all production + dev dependencies installed
- Two TypeScript configs: tsconfig.json (strict + bundler moduleResolution) and tsconfig.build.json (src-only, emitDeclarationOnly)
- Complete type system: SimulationState<TEntities>, SimConfig, TickFn, PlaybackState, SpeedPreset (literal union), ParameterSchema/ParameterDef (6 variants), SimEvent
- CSS theme with all 15 --sim-* tokens at locked values plus @import "tailwindcss" for utility classes
- All 6 layer stub indexes created, root barrel wired, tsc --noEmit passes clean
- Theme tests (18/18) now pass GREEN from RED state

## Task Commits

Each task was committed atomically:

1. **Task 1: Create package.json and install dependencies** - `86336e9` (feat)
2. **Task 2: Create TypeScript configs** - `8bd29eb` (chore)
3. **Task 3: Create src/ directory structure, types, theme, and layer stubs** - `d312c1f` (feat)

## Files Created/Modified
- `package.json` - sim-kit package with subpath exports, dependencies, scripts
- `tsconfig.json` - Strict TypeScript config for IDE and Vitest
- `tsconfig.build.json` - Build config extending base, src-only, declaration output
- `src/types/index.ts` - All 10 public type exports (SimulationState, SimConfig, TickFn, etc.)
- `src/theme/index.css` - 15 --sim-* CSS custom properties + @import tailwindcss
- `src/core/index.ts` - Re-exports types as placeholder for plan 01-05
- `src/rendering/index.ts` - Empty stub for Phase 2
- `src/controls/index.ts` - Empty stub for Phase 3
- `src/data/index.ts` - Empty stub for Phase 5
- `src/demos/index.ts` - Empty stub for Phase 6
- `src/utils/index.ts` - Empty stub for plan 01-04
- `src/index.ts` - Root barrel re-exporting core, rendering, controls, data (not demos)

## Decisions Made
- Downgraded @vitejs/plugin-react from ^6.0.1 to ^5.2.0 because v6 requires vite ^8.0.0 while plan specifies vite ~7.3.0
- Added jsdom ^29.0.0 as devDependency (required by vitest.config.ts from plan 01-01 but missing from plan 01-02 spec)
- Added @csstools/css-parser-algorithms and @csstools/css-tokenizer as devDependencies (peer deps of @csstools/css-calc used by jsdom)
- Preserved repository/bugs/homepage fields from the npm-init package.json created in plan 01-01

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Downgraded @vitejs/plugin-react to ^5.2.0**
- **Found during:** Task 1 (npm install)
- **Issue:** @vitejs/plugin-react ^6.0.1 requires vite ^8.0.0 as peer dependency, conflicting with plan-specified vite ~7.3.0
- **Fix:** Changed version to ^5.2.0 which supports vite ^7.0.0
- **Files modified:** package.json
- **Verification:** npm install completes without errors
- **Committed in:** 86336e9 (Task 1 commit)

**2. [Rule 3 - Blocking] Added jsdom as devDependency**
- **Found during:** Task 3 (theme test verification)
- **Issue:** Plan 01-02 spec did not include jsdom in devDependencies, but vitest.config.ts (from plan 01-01) uses jsdom environment
- **Fix:** Added jsdom ^29.0.0 to devDependencies
- **Files modified:** package.json, package-lock.json
- **Verification:** vitest runs theme tests successfully
- **Committed in:** d312c1f (Task 3 commit)

**3. [Rule 3 - Blocking] Added @csstools peer dependencies**
- **Found during:** Task 3 (theme test verification)
- **Issue:** @csstools/css-calc (transitive dep of jsdom) missing peer dependencies @csstools/css-parser-algorithms and @csstools/css-tokenizer
- **Fix:** Added both as devDependencies
- **Files modified:** package.json, package-lock.json
- **Verification:** vitest runs theme tests successfully (18/18 pass)
- **Committed in:** d312c1f (Task 3 commit)

---

**Total deviations:** 3 auto-fixed (3 blocking)
**Impact on plan:** All fixes necessary for dependency resolution and test execution. No scope creep.

## Issues Encountered
None beyond the dependency resolution issues documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All import contracts established: downstream plans can import from sim-kit/core, sim-kit/rendering, etc.
- Type definitions ready: plan 01-05 (SimulationProvider) can implement against SimulationState, SimConfig, TickFn
- Theme tokens locked: plan 01-03 (Vite build) can wire @import tailwindcss through the build pipeline
- Plan 01-04 (RingBuffer) can implement in src/utils/ and export through src/core/index.ts

---
*Phase: 01-infrastructure-core-engine*
*Completed: 2026-03-18*
