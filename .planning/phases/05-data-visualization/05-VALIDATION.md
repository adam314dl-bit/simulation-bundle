---
phase: 5
slug: data-visualization
status: draft
nyquist_compliant: false
wave_0_complete: false
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

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 05-01-01 | 01 | 1 | DATA-01 | unit | `npx vitest run src/data/__tests__/StatsPanel.test.tsx` | ❌ W0 | ⬜ pending |
| 05-01-02 | 01 | 1 | DATA-02 | unit | `npx vitest run src/data/__tests__/MiniChart.test.tsx` | ❌ W0 | ⬜ pending |
| 05-02-01 | 02 | 1 | DATA-03 | unit | `npx vitest run src/data/__tests__/EventLog.test.tsx` | ❌ W0 | ⬜ pending |
| 05-02-02 | 02 | 1 | DATA-04 | unit | `npx vitest run src/data/__tests__/EventLog.test.tsx` | ❌ W0 | ⬜ pending |
| 05-03-01 | 03 | 1 | DATA-05 | unit | `npx vitest run src/data/__tests__/HeatmapOverlay.test.tsx` | ❌ W0 | ⬜ pending |
| 05-03-02 | 03 | 1 | DATA-06 | unit | `npx vitest run src/data/__tests__/EntityInspector.test.tsx` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/data/__tests__/StatsPanel.test.tsx` — stubs for DATA-01
- [ ] `src/data/__tests__/MiniChart.test.tsx` — stubs for DATA-02
- [ ] `src/data/__tests__/EventLog.test.tsx` — stubs for DATA-03, DATA-04
- [ ] `src/data/__tests__/HeatmapOverlay.test.tsx` — stubs for DATA-05
- [ ] `src/data/__tests__/EntityInspector.test.tsx` — stubs for DATA-06

*Existing vitest infrastructure covers all framework needs — only test file stubs required.*

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

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
