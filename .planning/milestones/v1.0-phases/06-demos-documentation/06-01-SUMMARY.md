---
phase: 06-demos-documentation
plan: 01
subsystem: demos
tags: [react, vitest, css-grid, vite, test-scaffolds]

requires:
  - phase: 05-data-visualization
    provides: All 18 components (StatsPanel, MiniChart, EventLog, HeatmapOverlay, EntityInspector)
provides:
  - RED test scaffolds for DEMO-01 through DEMO-06
  - RED test scaffolds for DOCS-01 through DOCS-06
  - DemoLayout shared component for consistent dashboard layout
  - Dev server entry with pathname-based routing
affects: [06-02-ecosystem, 06-03-particles, 06-04-network, 06-05-storybook, 06-06-readme]

tech-stack:
  added: []
  patterns: [CSS Grid dashboard layout, pathname-based lazy routing, test scaffold RED state pattern]

key-files:
  created:
    - tests/demos/ecosystem.test.tsx
    - tests/demos/particles.test.tsx
    - tests/demos/network.test.tsx
    - tests/docs/readme.test.ts
    - tests/docs/storybook.test.ts
    - src/demos/shared/DemoLayout.tsx
    - dev/index.html
    - dev/main.tsx
    - dev/vite.config.ts
  modified:
    - package.json

key-decisions:
  - "DemoLayout uses CSS Grid with inline styles + CSS custom properties (project convention)"
  - "Dev server uses pathname-based lazy routing with no React Router dependency"
  - "Timeline slot rendered as separate grid row (conditionally) for flexibility"

patterns-established:
  - "DemoLayout: grid-template-columns 1fr 300px, 4-row grid for header/main/timeline/footer"
  - "Test scaffold imports demo modules via dynamic import for proper RED state isolation"

requirements-completed: [DEMO-01, DEMO-02, DEMO-03, DEMO-04, DEMO-05, DEMO-06, DOCS-01, DOCS-06]

duration: 3min
completed: 2026-03-19
---

# Phase 6 Plan 1: Test Scaffolds + Demo Infrastructure Summary

**RED test scaffolds for all 12 Phase 6 requirements plus DemoLayout CSS Grid component and Vite dev server with lazy-loaded demo routing**

## Performance

- **Duration:** 3min
- **Started:** 2026-03-19T09:57:41Z
- **Completed:** 2026-03-19T10:01:11Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- 29 failing tests across 5 test files covering DEMO-01 through DEMO-06 and DOCS-01 through DOCS-06
- DemoLayout component with CSS Grid dashboard layout using --sim-* custom properties
- Dev server entry with pathname-based routing and dynamic imports for all three demos

## Task Commits

Each task was committed atomically:

1. **Task 1: Create test scaffolds for all Phase 6 requirements** - `44e15ac` (test)
2. **Task 2: Create DemoLayout component and dev server entry** - `483f694` (feat)

## Files Created/Modified
- `tests/demos/ecosystem.test.tsx` - DEMO-01/02 test scaffold (renders, components, presets, 3 MiniCharts)
- `tests/demos/particles.test.tsx` - DEMO-03/04 test scaffold (renders, Float32Array, preset trails)
- `tests/demos/network.test.tsx` - DEMO-05/06 test scaffold (renders, opinionTick, mediaNode)
- `tests/docs/readme.test.ts` - DOCS-01-05 README content verification
- `tests/docs/storybook.test.ts` - DOCS-06 story file existence checks for 18 components
- `src/demos/shared/DemoLayout.tsx` - Shared CSS Grid layout (1fr 300px, 4-row)
- `dev/index.html` - Dev server HTML entry
- `dev/main.tsx` - Pathname-based router with lazy demo loading
- `dev/vite.config.ts` - Vite config with react + tailwindcss plugins
- `package.json` - Added dev:demos script

## Decisions Made
- DemoLayout uses CSS Grid with inline styles and CSS custom properties (consistent with project convention of no separate CSS files)
- Dev server uses pathname-based routing with React.lazy and dynamic imports (no React Router as locked decision in CONTEXT.md)
- Timeline slot is a separate conditional grid row to avoid layout shift when absent

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- All test scaffolds in RED state, ready for demo implementation in plans 06-02 through 06-04
- DemoLayout component ready for use by all three demo pages
- Dev server entry ready -- will work once demo modules are implemented
- 219 existing tests remain green

---
*Phase: 06-demos-documentation*
*Completed: 2026-03-19*
