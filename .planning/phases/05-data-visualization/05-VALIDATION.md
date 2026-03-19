---
phase: 5
slug: data-visualization
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-19
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.1.3 |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~8 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --reporter=verbose`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 10 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 05-01-01 | 01 | 1 | DATA-01 | unit | `npx vitest run tests/data/StatsPanel.test.tsx` | pending |
| 05-01-02 | 01 | 1 | DATA-02 | unit | `npx vitest run tests/data/MiniChart.test.tsx` | pending |
| 05-02-01 | 02 | 1 | DATA-03, DATA-04 | unit | `npx vitest run tests/data/EventLog.test.tsx` | pending |
| 05-02-02 | 02 | 1 | DATA-05 | unit | `npx vitest run tests/data/HeatmapOverlay.test.tsx` | pending |
| 05-03-01 | 03 | 2 | DATA-06 | unit | `npx vitest run tests/data/EntityInspector.test.tsx` | pending |
| 05-03-02 | 03 | 2 | barrel exports | integration | `npx vitest run tests/data/ && npx tsc --noEmit` | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

No separate Wave 0 plan needed. Each plan task creates tests alongside components using the TDD pattern established in prior phases. Test files are created within the same task that creates the component:

- Plan 01 Task 1 creates `tests/data/StatsPanel.test.tsx`
- Plan 01 Task 2 creates `tests/data/MiniChart.test.tsx`
- Plan 02 Task 1 creates `tests/data/EventLog.test.tsx`
- Plan 02 Task 2 creates `tests/data/HeatmapOverlay.test.tsx`
- Plan 03 Task 1 creates `tests/data/EntityInspector.test.tsx`

*Existing vitest infrastructure covers all framework needs — test files are created inline with components.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| MiniChart renders auto-scrolling sparkline | DATA-02 | Visual rendering verification | Open Storybook, feed data, observe scroll |
| HeatmapOverlay bilinear interpolation visual quality | DATA-05 | Visual smoothness assessment | Compare grid vs interpolated canvas output |
| EntityInspector draggable floating mode | DATA-06 | Pointer interaction UX | Drag floating panel, verify smooth repositioning |
| EventLog auto-scroll behavior | DATA-03 | Scroll UX timing | Generate events rapidly, verify auto-scroll follows |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] No separate Wave 0 needed -- tests created alongside components
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
