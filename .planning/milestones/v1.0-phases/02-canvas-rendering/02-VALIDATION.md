---
phase: 2
slug: canvas-rendering
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 2 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 + jsdom |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run tests/rendering/` |
| **Full suite command** | `npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run tests/rendering/`
- **After every plan wave:** Run `npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | UTIL-01 | unit | `npx vitest run tests/rendering/color-ramps.test.ts` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | REND-02 | unit | `npx vitest run tests/rendering/viewport.test.ts` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 1 | REND-01 | unit | `npx vitest run tests/rendering/SimCanvas.test.tsx` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 1 | REND-03, REND-04 | unit | `npx vitest run tests/rendering/GridRenderer.test.tsx` | ❌ W0 | ⬜ pending |
| 02-02-03 | 02 | 2 | REND-11 | unit | `npx vitest run tests/rendering/LayerStack.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/rendering/viewport.test.ts` — stubs for REND-02 (coordinate transform math)
- [ ] `tests/rendering/color-ramps.test.ts` — stubs for UTIL-01 (LUT correctness)
- [ ] `tests/rendering/SimCanvas.test.tsx` — stubs for REND-01 (canvas mount, events)
- [ ] `tests/rendering/GridRenderer.test.tsx` — stubs for REND-03, REND-04 (rendering, dirty-rect)
- [ ] `tests/rendering/LayerStack.test.tsx` — stubs for REND-11 (z-ordering, selection)

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| 30fps rendering of 500x500 grid | REND-04 | jsdom has no Canvas pixel rendering | Open Storybook GridRenderer story, verify devtools Performance tab shows <33ms frame times |
| Smooth lerp momentum on pan release | REND-01 | Requires visual + timing assessment | Pan canvas and release, verify smooth deceleration without snapping |
| Pinch-zoom on touch devices | REND-01 | Requires touch hardware | Test on tablet/phone: two-finger pinch should zoom centered between fingers |
| HiDPI crisp rendering | REND-01 | Requires Retina display | On HiDPI screen, verify grid lines are sharp (no blur from DPR mismatch) |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
