---
phase: 6
slug: demos-documentation
status: draft
nyquist_compliant: true
wave_0_complete: true
created: 2026-03-19
---

# Phase 6 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest 3.1.3 |
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

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 06-01-01 | 01 | 1 | DEMO-01, DEMO-02 | unit | `npx vitest run tests/demos/ecosystem.test.tsx` | pending |
| 06-02-01 | 02 | 1 | DEMO-03, DEMO-04 | unit | `npx vitest run tests/demos/particles.test.tsx` | pending |
| 06-03-01 | 03 | 1 | DEMO-05, DEMO-06 | unit | `npx vitest run tests/demos/network.test.tsx` | pending |
| 06-04-01 | 04 | 2 | DOCS-06 | build | `npx storybook build --quiet 2>&1` | pending |
| 06-05-01 | 05 | 3 | DOCS-01..05 | unit | `npx vitest run tests/docs/readme.test.ts` | pending |
| 06-05-02 | 05 | 3 | barrel exports | integration | `npx vitest run tests/build.test.ts && npx tsc --noEmit` | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

No separate Wave 0 plan needed. Each plan task creates tests alongside implementation using TDD pattern. Test files created within the same task that creates the component.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Ecosystem demo runs with all components visually working | DEMO-01 | Full integration visual check | Open dev server, run ecosystem demo, verify GridRenderer + Stats + EventLog display |
| Galaxy spiral preset is visually striking | DEMO-04 | Marketing quality assessment | Open particles demo, select Galaxy spiral, enable trails, screenshot |
| Social network graph is interactive | DEMO-05 | Drag/click interaction | Open network demo, drag nodes, click to inspect entities |
| Quick start guide works from clean install | DOCS-01 | End-to-end buyer experience | Follow README from scratch in empty project |
| Storybook prop playgrounds are usable | DOCS-06 | Interactive UX check | Open Storybook, test each component's controls |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify commands
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] No separate Wave 0 needed — tests created alongside components
- [x] No watch-mode flags
- [x] Feedback latency < 10s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
