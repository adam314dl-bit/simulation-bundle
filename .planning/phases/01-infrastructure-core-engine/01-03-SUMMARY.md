---
phase: 01-infrastructure-core-engine
plan: "03"
subsystem: infra
tags: [vite, library-mode, multi-entry, tailwindcss, storybook, dark-theme, css-custom-properties]

# Dependency graph
requires:
  - phase: 01-infrastructure-core-engine/02
    provides: "Package.json with dependencies, TypeScript configs, src/ layer stubs, theme CSS"
provides:
  - "vite.config.ts producing 6 ES module entry points with externalized peer deps"
  - "dist/style.css with Tailwind preflight + --sim-* custom properties"
  - "Storybook 10 configured with deep space dark theme matching --sim-* palette"
  - "vite-plugin-lib-inject-css auto-injecting style.css import in dist/index.js"
affects: [01-04, 01-05, 01-06]

# Tech tracking
tech-stack:
  added: []
  patterns: [vite-library-mode, multi-entry-build, rollup-externals, asset-filename-config, storybook-custom-theme, css-inject-via-plugin]

key-files:
  created:
    - vite.config.ts
    - .storybook/main.ts
    - .storybook/preview.tsx
    - .storybook/manager.js
    - .storybook/sim-kit-theme.ts
  modified:
    - src/index.ts

key-decisions:
  - "Added theme CSS import to src/index.ts so build pipeline includes dist/style.css"
  - "Configured rollupOptions.output.assetFileNames to emit style.css (matching package.json exports) instead of default index.css"
  - "vite-plugin-lib-inject-css auto-injects import './style.css' in dist/index.js so consumers get CSS automatically"

patterns-established:
  - "Vite library mode: multi-entry object map with resolve(__dirname, 'src/...') paths"
  - "External deps: explicit strings for exact matches, regex patterns for subpath imports (e.g. /^zustand\\//)"
  - "CSS output: single dist/style.css via cssCodeSplit: false + assetFileNames: 'style[extname]'"
  - "Storybook theme: create() from storybook/theming with --sim-* values, applied via manager.js addons.setConfig"
  - "Storybook preview decorator: wraps stories in div with var(--sim-bg) background"

requirements-completed: [INFRA-02, INFRA-04, INFRA-05, INFRA-06, THEME-02]

# Metrics
duration: 3min
completed: 2026-03-18
---

# Phase 01 Plan 03: Vite Build + Storybook Summary

**Vite library-mode config producing 6 ES entry points with externalized React/Zustand/Recharts/D3, Tailwind-compiled dist/style.css, and Storybook 10 with deep space dark theme**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-18T15:03:57Z
- **Completed:** 2026-03-18T15:07:35Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- vite.config.ts with 6 multi-entry points, ES2022 target, all peer deps externalized via regex patterns
- dist/style.css (10.72KB) contains Tailwind v4.2.1 preflight/properties/theme/base layers plus all 15 --sim-* custom properties
- vite-plugin-lib-inject-css auto-injects `import './style.css'` into dist/index.js -- consumers importing from 'sim-kit' get CSS automatically
- All 14 build integration tests pass (INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-07)
- Storybook 10.3.0 configured with 4 files: custom dark theme, manager config, framework setup, preview decorators

## Task Commits

Each task was committed atomically:

1. **Task 1: Create vite.config.ts (library mode, multi-entry, externals)** - `8292710` (feat)
2. **Task 2: Configure Storybook 10 with custom dark theme** - `4aa719d` (feat)

## Files Created/Modified
- `vite.config.ts` - Library mode build config with 6 entry points, externals, dts/tailwind/libInjectCss plugins
- `src/index.ts` - Added `import './theme/index.css'` so theme CSS is included in build output
- `.storybook/sim-kit-theme.ts` - Custom dark theme matching --sim-* palette (appBg #0a0a0f, accent #6366f1)
- `.storybook/manager.js` - Applies sim-kit theme to Storybook UI chrome via addons.setConfig
- `.storybook/main.ts` - Storybook config: react-vite framework, addon-docs, addon-themes, stories glob
- `.storybook/preview.tsx` - Global decorator loading theme CSS, wrapping stories in --sim-bg container

## Decisions Made
- Added `import './theme/index.css'` to src/index.ts so the build pipeline includes the theme CSS in dist/style.css. Without this import, Tailwind 4 and the CSS custom properties would not be emitted since no entry point referenced the CSS file.
- Configured `rollupOptions.output.assetFileNames: 'style[extname]'` to force the CSS output filename to `style.css` rather than the default `index.css`. This matches the `./style.css` export path in package.json.
- vite-plugin-lib-inject-css behavior confirmed: it injects `import './style.css'` at the top of dist/index.js, so consumers importing from 'sim-kit' automatically load the CSS without a separate import statement.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added theme CSS import to src/index.ts**
- **Found during:** Task 1 (vite build)
- **Issue:** First build produced no dist/style.css because no entry point imported the theme CSS file
- **Fix:** Added `import './theme/index.css'` to src/index.ts so the theme enters the module graph
- **Files modified:** src/index.ts
- **Verification:** Rebuild produces dist/style.css (10.72KB) with --sim-accent and Tailwind preflight
- **Committed in:** 8292710 (Task 1 commit)

**2. [Rule 1 - Bug] Configured CSS asset filename to style.css**
- **Found during:** Task 1 (vite build)
- **Issue:** Vite emitted CSS as dist/index.css but package.json exports map references ./dist/style.css
- **Fix:** Added `output.assetFileNames: 'style[extname]'` to rollupOptions
- **Files modified:** vite.config.ts
- **Verification:** Build emits dist/style.css, all 14 build tests pass
- **Committed in:** 8292710 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both fixes were necessary for correct build output matching package.json exports. No scope creep.

## dist/style.css Contents (for downstream plans)

The dist/style.css (10.72KB gzipped 2.67KB) contains:
- Tailwind v4.2.1 `@layer properties` (CSS property fallbacks for older browsers)
- Tailwind v4.2.1 `@layer theme` (--font-sans, --font-mono, --spacing, etc.)
- Tailwind v4.2.1 `@layer base` (preflight: box-sizing, margin/padding reset)
- `:root` block with all 15 --sim-* custom properties at locked values
- `.flex` selector IS present (Tailwind emits base utility classes)

Tailwind is fully wired and will emit additional utility classes as components use them in Phases 2-6.

## Issues Encountered
None beyond the deviations documented above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Build pipeline fully operational: `npx vite build` produces complete dist/ with all 6 entry points
- Storybook ready for stories: `npm run storybook` will serve on port 6006 (manual verification for INFRA-06)
- Plan 01-04 (RingBuffer) can implement in src/utils/ and the build will include it automatically
- Plan 01-05 (SimulationProvider) can implement in src/core/ with full build pipeline validation
- Plan 01-06 (smoke story + integration tests) can add stories to stories/ directory

## Self-Check: PASSED

All created files verified present. Both task commits (8292710, 4aa719d) verified in git log. 14/14 build tests pass.

---
*Phase: 01-infrastructure-core-engine*
*Completed: 2026-03-18*
