# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Simulation Playground UI Kit

**Shipped:** 2026-03-19
**Phases:** 6 | **Plans:** 25 | **Commits:** 132

### What Was Built
- SimulationProvider engine with Zustand tick loop, ring buffer history, full playback control
- 5 rendering components: SimCanvas, GridRenderer, LayerStack, ParticleRenderer (WebGL2), ForceGraph (D3-force)
- 4 control components: ParameterPanel, TimelineControl, PlaybackBar, PresetSelector
- 5 data visualization components: StatsPanel, MiniChart, EventLog, HeatmapOverlay, EntityInspector
- 3 demo simulations: Lotka-Volterra ecosystem, N-body/Boids particles, opinion dynamics network
- 18 Storybook stories with interactive prop playgrounds
- 929-line README with 5 documentation sections
- 279 tests across 27 test files, all passing

### What Worked
- Wave-based parallel execution — Phases 2-5 independent after Phase 1 enabled fast iteration
- TDD pattern in later phases (5-6) caught strict-mode issues at test time, not verification
- rAF-gated store subscriptions — consistent pattern across MiniChart, StatsPanel, FPS counters prevented tick-rate re-renders
- Barrel exports per layer with vitest aliases — clean import paths for tests and stories
- structuredClone for D3-force immutability — prevented subtle mutation bugs

### What Was Inefficient
- Phases 2-4 roadmap_complete flags not updated by CLI — had to be treated as incomplete during autonomous mode filtering
- Two TS strict-mode gap closures (Phase 5, Phase 6) could have been caught by running tsc --noEmit in executor before committing
- HeatmapOverlay deferred from Phase 5 demo integration but Phase 6 didn't follow through — fell through the cracks

### Patterns Established
- Inline styles + CSS custom properties (no separate CSS files per component)
- Zustand vanilla API (getState/setState) for performance-critical paths
- D3-force layout-only: D3 computes, React renders
- Pointer events for unified mouse/touch/pen handling
- ResizeObserver stub in tests for jsdom compatibility
- Manual windowed virtualization (fixed row height + scroll math) over library deps

### Key Lessons
- Plan checker catches real dependency and coverage issues — worth the extra agent spawn
- Auto-accepting in autonomous mode works well for infrastructure/backend phases; visual phases benefit from human review
- 18-file plans (stories) work fine when all files follow the same template pattern
- WebGL mocking with vi.fn() stubs is sufficient for unit tests; visual verification is manual

### Cost Observations
- Model mix: ~70% opus (execution), ~20% sonnet (verification/checking), ~10% haiku (none used)
- Autonomous mode completed 2 full phases (5+6) plus lifecycle in a single session
- Research agents cost ~48k tokens each but produce high-quality RESEARCH.md that prevents planning rework

## Cross-Milestone Trends

| Metric | v1.0 |
|--------|------|
| Phases | 6 |
| Plans | 25 |
| Tests | 279 |
| LOC | 6,666 |
| Duration | 1 day |
| Gap closures | 2 (TS strict-mode) |
