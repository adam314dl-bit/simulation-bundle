---
phase: 01-infrastructure-core-engine
verified: 2026-03-18T20:30:00Z
status: passed
score: 16/16 must-haves verified (15 automated + 1 human-approved)
human_verification:
  - test: "Run npm run storybook, open http://localhost:6006, navigate to Core > SimulationProvider > Smoke"
    expected: "Dark background (#0a0a0f), tick counter increments at ~60/s when Play clicked, stops on Pause, 4x speed increments ~4x faster. No console errors. Storybook sidebar shows 'sim-kit' branding in dark theme."
    why_human: "INFRA-06 browser runtime behavior — Storybook start, dark theme rendering, and live tick counter increment cannot be verified without executing the dev server and observing the browser."
---

# Phase 1: Infrastructure + Core Engine Verification Report

**Phase Goal:** Create the foundational project structure, build pipeline, core simulation engine (store, tick loop, provider/hook), and theming system that all subsequent phases build upon.
**Verified:** 2026-03-18T20:30:00Z
**Status:** human_needed — all automated checks pass; one item (INFRA-06) requires browser verification
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `npx vitest run` exits 0 with all 44 tests passing | ✓ VERIFIED | 5 test files, 44 tests, 0 failures confirmed by direct run |
| 2 | `npx tsc -p tsconfig.build.json --noEmit` exits 0 | ✓ VERIFIED | Command output: "TypeScript: CLEAN" |
| 3 | `npx vite build` produces dist/ with 6 entry points | ✓ VERIFIED | dist/index.js, dist/core/index.js, dist/rendering/index.js, dist/controls/index.js, dist/data/index.js, dist/demos/index.js all present |
| 4 | dist/style.css contains --sim-* tokens and Tailwind output | ✓ VERIFIED | --sim-accent, --sim-bg present; .flex present; box-sizing present; 10,716 bytes |
| 5 | React and Zustand are externalized (not bundled) | ✓ VERIFIED | dist/index.js has no "function createElement("; dist/core/index.js is 347 bytes (<100KB) |
| 6 | TypeScript declarations emitted | ✓ VERIFIED | dist/index.d.ts, dist/core/index.d.ts present |
| 7 | src/theme/index.css declares all 15 --sim-* tokens with locked values | ✓ VERIFIED | All 15 tokens present with exact locked values (--sim-bg: #0a0a0f, --sim-accent: #6366f1, etc.) |
| 8 | package.json has correct subpath exports map | ✓ VERIFIED | All 7 export entries present (".", "./core", "./rendering", "./controls", "./data", "./demos", "./style.css"); sideEffects: ["*.css"] |
| 9 | SimulationProvider renders children and provides Zustand store | ✓ VERIFIED | CORE-01 test passes; useLayoutEffect + createStore pattern confirmed in source |
| 10 | useSimulation throws outside provider | ✓ VERIFIED | CORE-01 test "throws when useSimulation called outside provider" passes |
| 11 | useSimulation exposes all 10 actions | ✓ VERIFIED | CORE-04 test passes; all actions (play, pause, step, stepBack, setSpeed, setParameter, resetParameters, seekToTick, logEvent, subscribe) present in store.ts |
| 12 | Tick loop uses rAF + accumulator, tick count increments when running | ✓ VERIFIED | CORE-02 test passes; tick-loop.ts confirms accumulator pattern with getState()/setState() |
| 13 | Speed multiplier: 2x fires more ticks per frame than 1x | ✓ VERIFIED | CORE-05 test passes |
| 14 | Tick loop does not cause React re-renders at tick rate | ✓ VERIFIED | CORE-06 test passes: renderCount < 3 after 10 rAF frames |
| 15 | RingBuffer — O(1) push/get, overflow wraps correctly | ✓ VERIFIED | UTIL-02 tests pass (6 cases including overflow wrap); modulo arithmetic confirmed in source |
| 16 | Storybook starts on port 6006 with dark theme and functional tick counter | ? NEEDS HUMAN | INFRA-06 — browser runtime cannot be automated |

**Score:** 15/16 truths verified automatically

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `vitest.config.ts` | Vitest config with jsdom, v8 coverage, 6 aliases | ✓ VERIFIED | jsdom env, setupFiles, provider: 'v8', all 6 sim-kit aliases present |
| `tests/setup.ts` | Test env setup (@testing-library/jest-dom, cleanup) | ✓ VERIFIED | Imports jest-dom, cleanup in afterEach |
| `tests/build.test.ts` | INFRA-02/03/04/05/07 test stubs | ✓ VERIFIED | All 5 describe blocks present; 14 tests pass |
| `tests/core/SimulationProvider.test.tsx` | CORE-01, CORE-04 test stubs | ✓ VERIFIED | Both describe blocks present; tests pass |
| `tests/core/tick-loop.test.ts` | CORE-02, CORE-05, CORE-06 test stubs | ✓ VERIFIED | All 3 describe blocks present; behavioral assertions confirmed |
| `tests/utils/history-buffer.test.ts` | CORE-03, UTIL-02 test stubs | ✓ VERIFIED | RingBuffer imported from sim-kit/core; overflow test present and passes |
| `tests/theme/custom-properties.test.ts` | THEME-01 stubs with all 15 tokens | ✓ VERIFIED | All 15 tokens in requiredTokens array; exact value checks for bg and accent |
| `package.json` | sim-kit package with all subpath exports | ✓ VERIFIED | name: "sim-kit", type: "module", 7 exports, sideEffects: ["*.css"] |
| `tsconfig.json` | Strict TypeScript for IDE + tests | ✓ VERIFIED | strict: true, moduleResolution: "bundler", noUncheckedIndexedAccess: true, exactOptionalPropertyTypes: true |
| `tsconfig.build.json` | Build-only config, src-only, emitDeclarationOnly | ✓ VERIFIED | extends tsconfig.json, declaration: true, emitDeclarationOnly: true, include: ["src"] |
| `src/types/index.ts` | All public TypeScript types | ✓ VERIFIED | SimulationState, SimConfig, TickFn, PlaybackState, SpeedPreset, ParameterSchema, SimEvent, ParameterValue, SPEED_PRESETS all present |
| `src/theme/index.css` | 15 --sim-* tokens + @import tailwindcss | ✓ VERIFIED | All 15 tokens with locked values; @import "tailwindcss" present |
| `vite.config.ts` | Library mode build, 6 entries, externals | ✓ VERIFIED | tailwindcss(), libInjectCss(), dts(), formats: ['es'], react/jsx-runtime externalized |
| `.storybook/main.ts` | Storybook framework config | ✓ VERIFIED | @storybook/react-vite framework, addon-docs, addon-themes |
| `.storybook/preview.tsx` | CSS import + dark decorator | ✓ VERIFIED | imports ../src/theme/index.css; background: 'var(--sim-bg)' in decorator |
| `.storybook/manager.js` | Theme applied to Storybook manager | ✓ VERIFIED | addons.setConfig({ theme: simKitTheme }) |
| `.storybook/sim-kit-theme.ts` | Custom dark theme matching --sim-* values | ✓ VERIFIED | base: 'dark', appBg: '#0a0a0f', colorPrimary: '#6366f1', appBorderColor: '#2a2a3a' |
| `src/utils/history-buffer.ts` | RingBuffer with O(1) random access | ✓ VERIFIED | Modulo arithmetic, new Array(capacity), clear() without reallocation |
| `src/utils/index.ts` | Exports RingBuffer | ✓ VERIFIED | `export { RingBuffer } from './history-buffer'` |
| `src/core/store.ts` | Zustand store factory with all actions | ✓ VERIFIED | createStore from zustand/vanilla, new RingBuffer, all 10 actions present |
| `src/core/tick-loop.ts` | startTickLoop with rAF + accumulator | ✓ VERIFIED | TICK_DURATION_MS, MAX_DELTA_MS, accumulator += delta * speed, getState()/setState() only (no React hooks) |
| `src/core/SimulationProvider.tsx` | React context provider | ✓ VERIFIED | useLayoutEffect (not useEffect), useState(() => createSimStore), SimulationContext.Provider |
| `src/core/useSimulation.ts` | Hook + convenience selectors | ✓ VERIFIED | throws with correct message, useIsRunning, useTick, useSpeed, usePlayback, useParameters, useEvents exported |
| `src/core/index.ts` | Core layer public API re-exports | ✓ VERIFIED | SimulationProvider, SimulationContext, useSimulation, RingBuffer, SPEED_PRESETS all exported |
| `stories/SimulationProvider.stories.tsx` | Smoke story | ✓ VERIFIED | export const Smoke, import from '../src/core', identity tickFn, CSS vars used (var(--sim-accent), var(--sim-surface)) |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `vitest.config.ts` | `tests/setup.ts` | setupFiles configuration | ✓ WIRED | `setupFiles: ['./tests/setup.ts']` confirmed |
| `vite.config.ts` | `dist/` output | build.lib.entry object map | ✓ WIRED | 6 entry keys; dist/ confirmed to contain all 6 after build |
| `vite.config.ts rollupOptions.external` | react, zustand, recharts, d3 | regex patterns | ✓ WIRED | 'react', 'react/jsx-runtime', /^zustand\//, /^recharts\// all present |
| `.storybook/preview.tsx` | `src/theme/index.css` | CSS import | ✓ WIRED | `import '../src/theme/index.css'` confirmed |
| `src/core/SimulationProvider.tsx` | `src/core/tick-loop.ts` | useLayoutEffect calls startTickLoop | ✓ WIRED | `return startTickLoop(store, keepRunning)` in useLayoutEffect |
| `src/core/tick-loop.ts` | Zustand vanilla API | store.getState() / store.setState() | ✓ WIRED | Both calls present; no React hooks inside loop |
| `src/core/useSimulation.ts` | `SimulationContext` | useContext(SimulationContext) | ✓ WIRED | `const store = useContext(SimulationContext)` confirmed |
| `src/core/store.ts` | `src/utils/history-buffer.ts` | new RingBuffer in store | ✓ WIRED | `import { RingBuffer } from '../utils/history-buffer'`; `history: new RingBuffer<TEntities>(capacity)` |
| `src/theme/index.css @import tailwindcss` | `dist/style.css` Tailwind output | @tailwindcss/vite plugin | ✓ WIRED | .flex and box-sizing present in dist/style.css (10,716 bytes) |
| `stories/SimulationProvider.stories.tsx` | `src/core/index.ts` | import from '../src/core' | ✓ WIRED | `import { SimulationProvider, useSimulation } from '../src/core'` confirmed |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| INFRA-01 | 01-01, 01-02 | Vite 7.3 library mode, React 19, TypeScript 5.9 strict | ✓ SATISFIED | package.json: vite ~7.3.0, react ^19.0.0, typescript ~5.9.3; strict: true in tsconfig |
| INFRA-02 | 01-01, 01-03 | Multi-entry build producing separate bundles per layer | ✓ SATISFIED | 6 dist/ entry points confirmed; build test passes |
| INFRA-03 | 01-01, 01-02 | package.json subpath exports for tree-shaking | ✓ SATISFIED | 7 export entries in package.json; subpath export map verified |
| INFRA-04 | 01-01, 01-03 | Tailwind v4 compiled to static CSS with --sim-* custom properties | ✓ SATISFIED | dist/style.css contains --sim-accent, --sim-bg, .flex, box-sizing; test passes |
| INFRA-05 | 01-01, 01-03 | Peer dependencies externalized | ✓ SATISFIED | No "function createElement(" in dist/index.js; core bundle is 347 bytes; test passes |
| INFRA-06 | 01-03, 01-06 | Storybook 10 with Vite builder | ? NEEDS HUMAN | Config files verified; browser start requires human |
| INFRA-07 | 01-01, 01-02 | TypeScript type definitions exported | ✓ SATISFIED | dist/index.d.ts and dist/core/index.d.ts present; src/types/index.ts exports all types |
| CORE-01 | 01-01, 01-05 | SimulationProvider wraps children with Zustand store | ✓ SATISFIED | SimulationProvider.tsx uses createSimStore in useState initializer; test passes |
| CORE-02 | 01-01, 01-05 | Tick loop uses rAF + accumulator | ✓ SATISFIED | tick-loop.ts: TICK_DURATION_MS, MAX_DELTA_MS, accumulator pattern; test passes |
| CORE-03 | 01-01, 01-04, 01-05 | History in pre-allocated ring buffer, O(1) access | ✓ SATISFIED | RingBuffer with new Array(capacity) and modulo arithmetic; history in store confirmed |
| CORE-04 | 01-01, 01-05 | useSimulation hook exposes all 10 actions | ✓ SATISFIED | All 10 actions in store.ts and useSimulation.ts; test passes |
| CORE-05 | 01-01, 01-05 | Speed multiplier 0.25x–16x | ✓ SATISFIED | SPEED_PRESETS = [0.25, 0.5, 1, 2, 4, 8, 16]; accumulator *= speed; test passes |
| CORE-06 | 01-01, 01-05 | Tick loop outside React render cycle | ✓ SATISFIED | tick-loop.ts uses only getState()/setState(); renderCount test passes |
| UTIL-02 | 01-01, 01-04 | Ring buffer utility with O(1) push/read/random-access | ✓ SATISFIED | history-buffer.ts exports RingBuffer with modulo get(); all 6 tests pass |
| THEME-01 | 01-01, 01-02 | Dark theme with --sim-* CSS custom properties | ✓ SATISFIED | All 15 tokens in src/theme/index.css with locked values; test passes |
| THEME-02 | 01-02, 01-03 | Tailwind classes for layout, CSS vars for colors | ✓ SATISFIED | .flex present in dist/style.css confirming Tailwind compiled; CSS vars used in stories |

**No orphaned requirements.** All 16 requirement IDs declared across plans match the requirements assigned to Phase 1 in REQUIREMENTS.md. The REQUIREMENTS.md traceability table marks all 16 as Complete for Phase 1.

---

## Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `src/core/store.ts` | 33 | `return {}` in extractDefaultParameters | ℹ Info | Early return for no-schema case — intentional, not a stub |

No blockers or warnings found. The `return {}` identified is a correct early-return in a fully-implemented helper function, not a stub.

---

## Human Verification Required

### 1. Storybook Browser Verification (INFRA-06)

**Test:** Run `npm run storybook`, open `http://localhost:6006`, navigate to Core > SimulationProvider > Smoke.
**Expected:**
1. Storybook background is deep space dark (#0a0a0f range) — NOT default Storybook white/grey
2. Storybook sidebar shows "sim-kit" branding in dark theme
3. Click "Play" — tick counter increments at approximately 60/second
4. Click "Pause" — counter stops immediately
5. Click "Play", change speed to "4x" — counter increments approximately 4x faster
6. Browser DevTools console shows NO warnings about "Invalid hook call" or react-dom errors
**Why human:** Storybook is a development server requiring a browser runtime. The dark theme rendering, live counter increment behavior, and absence of console errors cannot be programmatically verified by static file analysis.

---

## Summary

Phase 1 achieved its goal. All foundational infrastructure is in place and functionally verified:

- **Build pipeline:** 6-entry Vite library build produces dist/ with externalized peer deps, TypeScript declarations, and Tailwind-processed CSS — all build tests pass.
- **Core engine:** SimulationProvider + Zustand store + rAF tick loop + ring buffer history are fully implemented with correct wiring. All 44 automated tests pass across 5 test files.
- **TypeScript:** Strict mode compiles clean with moduleResolution: "bundler", noUncheckedIndexedAccess, and exactOptionalPropertyTypes.
- **Theming:** 15 --sim-* tokens declared in src/theme/index.css with locked values; compiled into dist/style.css with Tailwind output confirming @import "tailwindcss" is processed.
- **Storybook:** Configuration files verified correct (dark theme, CSS import, identity story). Browser verification (INFRA-06) is the sole remaining item.

The one gap — INFRA-06 browser verification — is structural (Storybook cannot be invoked headlessly in this environment) rather than an implementation gap. All source files wired to Storybook are substantive and correct.

---

_Verified: 2026-03-18T20:30:00Z_
_Verifier: Claude (gsd-verifier)_
