---
phase: 3
slug: controls
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-19
---

# Phase 3 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest |
| **Config file** | vitest.config.ts |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --reporter=verbose` |
| **Estimated runtime** | ~10 seconds |

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
| 03-01-01 | 01 | 1 | CTRL-01 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | CTRL-02 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 1 | CTRL-03 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 1 | CTRL-04 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 03-02-03 | 02 | 1 | CTRL-05 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |
| 03-02-04 | 02 | 1 | CTRL-06 | unit | `npx vitest run` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `src/controls/__tests__/ParameterPanel.test.tsx` — stubs for CTRL-01, CTRL-02
- [ ] `src/controls/__tests__/TimelineControl.test.tsx` — stubs for CTRL-03
- [ ] `src/controls/__tests__/PlaybackBar.test.tsx` — stubs for CTRL-04
- [ ] `src/controls/__tests__/PresetSelector.test.tsx` — stubs for CTRL-05, CTRL-06

*If none: "Existing infrastructure covers all phase requirements."*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Scrubber drag interaction | CTRL-03 | PointerEvent drag requires browser | Drag scrubber thumb, verify tick updates |
| Keyboard shortcuts | CTRL-03 | Global key listeners need DOM focus context | Press Space/arrows, verify playback responds |
| Color picker rendering | CTRL-01 | Native HTML5 color input | Click swatch, verify color picker opens |
| Collapsible group animation | CTRL-01 | Visual transition smoothness | Toggle group, verify smooth height animation |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 10s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
