# Phase 1: Infrastructure + Core Engine - Context

**Gathered:** 2026-03-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Build system (Vite 7.3 library mode, multi-entry, tier-separated bundles), dark theme foundation with CSS custom properties, SimulationProvider with Zustand-based tick loop and full playback control, history ring buffer, shared TypeScript types, and Storybook 10 configuration. This phase produces the architectural backbone that all subsequent phases build on.

</domain>

<decisions>
## Implementation Decisions

### Theme token design
- Deep space dark aesthetic: near-black backgrounds (#0a0a0f range), high contrast text, vibrant accent colors — Linear/Raycast premium dev-tool feel
- Palette: --sim-bg: #0a0a0f, --sim-surface: #141420, --sim-border: #2a2a3a, --sim-text: #e8e8ed, --sim-text-muted: #8888a0, --sim-accent: #6366f1 (indigo), --sim-danger: #ef4444, --sim-success: #22c55e
- Essential token set (~15 tokens): bg, surface, surface-raised, border, text, text-muted, accent, danger, warning, success, font-family, font-mono, radius-sm/md, spacing unit — not overwhelming for buyers
- Single accent color (indigo) — buyers override one var to rebrand
- Tailwind for layout (spacing, flexbox, grid, sizing), CSS custom properties (--sim-*) for all colors, borders, radius, fonts — clean separation, buyers don't need Tailwind to retheme

### Import paths & package structure
- Package name: `sim-kit` — short and memorable
- Subpath exports: sim-kit/core, sim-kit/rendering, sim-kit/controls, sim-kit/data, sim-kit/demos
- Root import (from 'sim-kit') re-exports all layers — convenient for prototyping, subpath imports for production tree-shaking
- Single package with gated exports for tier split: $29 tier excludes demos/ folder, $49 tier includes everything. Gumroad download zips handle the split, not the build
- src/ organized by layer folders mirroring subpath exports: src/core/, src/rendering/, src/controls/, src/data/, src/demos/, src/types/, src/utils/, src/theme/

### Tick loop defaults & edge cases
- Default tick rate: 60 ticks/sec (matches display refresh, 1 tick per frame at 1x speed)
- Background tab behavior: auto-pause when tab loses focus, resume on return. Prevents accumulator buildup and catch-up jank. Buyers can override with keepRunning option
- Default history ring buffer size: 1000 ticks (~16 seconds at 60 tps). Configurable via SimulationProvider props
- History storage: full state deep clones per tick. Simple, predictable O(1) random access. Buyers with large state reduce buffer size

### Storybook initial scope
- Configure Storybook 10 with Vite builder + one smoke story (SimulationProvider + useSimulation counter that ticks up)
- Full component stories deferred to Phase 6 (DOCS-06)
- Storybook theme matches sim-kit deep space dark aesthetic (cohesive premium feel)
- Storybook serves as primary dev playground (npm run storybook) — no separate dev app needed

### Claude's Discretion
- Exact Tailwind v4 library mode configuration (compile to static CSS strategy)
- Vite library mode entry point configuration details
- TypeScript strict mode config specifics
- Zustand store internal structure and vanilla API patterns
- Ring buffer implementation details (pre-allocation strategy)
- Storybook addon selection

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project specs
- `.planning/PROJECT.md` — Product vision, tech stack constraints, performance targets, key decisions
- `.planning/REQUIREMENTS.md` — Full requirement definitions (INFRA-01 through INFRA-07, CORE-01 through CORE-06, UTIL-02, THEME-01, THEME-02 are Phase 1 scope)
- `.planning/ROADMAP.md` — Phase 1 goal and success criteria (5 criteria covering build output, tick loop, history, theming, types)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- None — greenfield project, no existing code

### Established Patterns
- None yet — Phase 1 establishes the foundational patterns that all subsequent phases follow

### Integration Points
- Build output must produce separate bundles per layer for subpath exports
- SimulationProvider will be consumed by every rendering, controls, and data component in later phases
- --sim-* CSS custom properties will be referenced by every component's styling
- src/types/index.ts exports will be imported across all layers

</code_context>

<specifics>
## Specific Ideas

- The dark theme should evoke premium dev tools (Linear, Raycast) — simulation visuals should pop against near-black backgrounds
- Import ergonomics matter: `import { SimulationProvider } from 'sim-kit/core'` should feel clean
- Storybook should feel like part of the product, not an afterthought — matching dark theme reinforces quality

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-infrastructure-core-engine*
*Context gathered: 2026-03-18*
