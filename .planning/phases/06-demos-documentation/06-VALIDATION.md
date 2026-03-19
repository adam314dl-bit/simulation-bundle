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
| 06-01-01 | 01 | 1 | DEMO-01..06, DOCS-01, DOCS-06 | unit | `npx vitest run tests/demos/ tests/docs/ --reporter=verbose` | pending |
| 06-01-02 | 01 | 1 | (infra) | build | `npx tsc --noEmit src/demos/shared/DemoLayout.tsx` | pending |
| 06-02-01 | 02 | 2 | DEMO-01, DEMO-02 | unit | `npx vitest run tests/demos/ecosystem.test.tsx` | pending |
| 06-02-02 | 02 | 2 | DEMO-01, DEMO-02 | unit | `npx vitest run tests/demos/ecosystem.test.tsx` | pending |
| 06-03-01 | 03 | 2 | DEMO-03, DEMO-04 | unit | `npx vitest run tests/demos/particles.test.tsx` | pending |
| 06-03-02 | 03 | 2 | DEMO-03, DEMO-04 | unit | `npx vitest run tests/demos/particles.test.tsx` | pending |
| 06-04-01 | 04 | 2 | DEMO-05, DEMO-06 | unit | `npx vitest run tests/demos/network.test.tsx` | pending |
| 06-04-02 | 04 | 2 | DEMO-05, DEMO-06 | unit+barrel | `npx vitest run tests/demos/network.test.tsx` | pending |
| 06-05-01 | 05 | 3 | DOCS-06 | unit | `npx vitest run tests/docs/storybook.test.ts` | pending |
| 06-05-02 | 05 | 3 | DOCS-06 | unit | `npx vitest run tests/docs/storybook.test.ts` | pending |
| 06-06-01 | 06 | 3 | DOCS-01, DOCS-02 | unit | `npx vitest run tests/docs/readme.test.ts` | pending |
| 06-06-02 | 06 | 3 | DOCS-03, DOCS-04, DOCS-05 | unit | `npx vitest run tests/docs/readme.test.ts` | pending |

*Status: pending / green / red / flaky*

---

## Wave 0 Requirements

No separate Wave 0 plan needed. Plan 06-01 (Wave 1) creates test scaffolds alongside shared infrastructure. Test files created within Task 1 of plan 06-01.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Ecosystem demo runs with all components visually working | DEMO-01 | Full integration visual check | Open dev server, run ecosystem demo, verify GridRenderer + Stats + 3 MiniCharts + EventLog display |
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
- [x] Per-task map lists both tasks for each plan

**Approval:** pending
