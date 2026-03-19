---
phase: 4
slug: advanced-rendering
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 4 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 4.1.0 + @testing-library/react 16.3.2 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run tests/rendering/ tests/utils/webgl-helpers.test.ts` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/rendering/ tests/utils/webgl-helpers.test.ts`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 0 | UTIL-03 | unit | `npx vitest run tests/utils/webgl-helpers.test.ts` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | REND-05 | unit | `npx vitest run tests/rendering/ParticleRenderer.test.tsx -t "REND-05"` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | REND-06 | unit | `npx vitest run tests/rendering/ParticleRenderer.test.tsx -t "REND-06"` | ❌ W0 | ⬜ pending |
| 04-01-04 | 01 | 1 | REND-07 | unit | `npx vitest run tests/rendering/ParticleRenderer.test.tsx -t "REND-07"` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 1 | REND-08 | unit | `npx vitest run tests/rendering/ForceGraph.test.tsx -t "REND-08"` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 1 | REND-09 | unit | `npx vitest run tests/rendering/ForceGraph.test.tsx -t "REND-09"` | ❌ W0 | ⬜ pending |
| 04-02-03 | 02 | 2 | REND-10 | unit | `npx vitest run tests/rendering/ForceGraph.test.tsx -t "REND-10"` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/rendering/ParticleRenderer.test.tsx` — stubs for REND-05, REND-06, REND-07
- [ ] `tests/rendering/ForceGraph.test.tsx` — stubs for REND-08, REND-09, REND-10
- [ ] `tests/utils/webgl-helpers.test.ts` — stubs for UTIL-03
- [ ] WebGL2 mock setup (getContext('webgl2') returns mock GL context object)
- [ ] `@types/d3-force` devDependency installed

*Existing infrastructure covers test framework (vitest) and React testing library.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 100k particles at 60fps | REND-05 | Performance requires real GPU, jsdom has no WebGL2 | Open Storybook ParticleRenderer story with 100k particles, verify Chrome DevTools Performance panel shows ≥60fps |
| Trail visual quality (additive/normal blending) | REND-06 | Visual quality is subjective | Open Storybook, enable trails, compare additive vs normal blending against expected glow effect |
| Canvas2D visual fidelity | REND-07 | Canvas2D fallback rendering needs visual check | Force renderer="canvas2d", verify circles render and trails work |
| ForceGraph layout animation | REND-08 | Layout stabilization is visual | Open ForceGraph story, verify nodes animate from initial to stable positions smoothly |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
