---
phase: 1
slug: infrastructure-core-engine
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-18
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest 4.1.0 |
| **Config file** | `vitest.config.ts` — Wave 0 creates this |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npx vitest run --coverage` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npx vitest run --coverage`
- **Before `/gsd:verify-work`:** Full suite must be green + `npx tsc -p tsconfig.build.json --noEmit` clean
- **Max feedback latency:** ~15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| INFRA-01 | 01 | 0 | INFRA-01 | smoke | `npx tsc -p tsconfig.build.json --noEmit` | ❌ Wave 0 | ⬜ pending |
| INFRA-02 | 01 | 1 | INFRA-02 | integration | `npx vitest run tests/build.test.ts` | ❌ Wave 0 | ⬜ pending |
| INFRA-03 | 01 | 1 | INFRA-03 | integration | `npx vitest run tests/consumer.test.ts` | ❌ Wave 0 | ⬜ pending |
| INFRA-04 | 01 | 1 | INFRA-04 | integration | `npx vitest run tests/build.test.ts` (css-output) | ❌ Wave 0 | ⬜ pending |
| INFRA-05 | 01 | 1 | INFRA-05 | integration | `npx vitest run tests/build.test.ts` (externals) | ❌ Wave 0 | ⬜ pending |
| INFRA-06 | 01 | 1 | INFRA-06 | manual | `npm run storybook` | ❌ Wave 0 | ⬜ pending |
| INFRA-07 | 01 | 1 | INFRA-07 | integration | `npx vitest run tests/build.test.ts` (types) | ❌ Wave 0 | ⬜ pending |
| CORE-01 | 02 | 2 | CORE-01 | unit | `npx vitest run tests/core/SimulationProvider.test.tsx` | ❌ Wave 0 | ⬜ pending |
| CORE-02 | 02 | 2 | CORE-02 | unit | `npx vitest run tests/core/tick-loop.test.ts` | ❌ Wave 0 | ⬜ pending |
| CORE-03 | 02 | 2 | CORE-03 | unit | `npx vitest run tests/utils/history-buffer.test.ts` | ❌ Wave 0 | ⬜ pending |
| CORE-04 | 02 | 2 | CORE-04 | unit | `npx vitest run tests/core/useSimulation.test.tsx` | ❌ Wave 0 | ⬜ pending |
| CORE-05 | 02 | 2 | CORE-05 | unit | `npx vitest run tests/core/tick-loop.test.ts` (speed) | ❌ Wave 0 | ⬜ pending |
| CORE-06 | 02 | 2 | CORE-06 | unit | `npx vitest run tests/core/tick-loop.test.ts` (no-rerender) | ❌ Wave 0 | ⬜ pending |
| UTIL-02 | 02 | 2 | UTIL-02 | unit | `npx vitest run tests/utils/history-buffer.test.ts` | ❌ Wave 0 | ⬜ pending |
| THEME-01 | 01 | 1 | THEME-01 | unit | `npx vitest run tests/theme/custom-properties.test.ts` | ❌ Wave 0 | ⬜ pending |
| THEME-02 | 01 | 1 | THEME-02 | manual | Override `--sim-accent` in consumer CSS, inspect accent element | N/A | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `vitest.config.ts` — shared Vitest config (jsdom environment, React testing)
- [ ] `tests/setup.ts` — test environment setup (jsdom, CSS custom property support)
- [ ] `tests/build.test.ts` — stubs for INFRA-02, INFRA-03, INFRA-04, INFRA-05, INFRA-07
- [ ] `tests/core/SimulationProvider.test.tsx` — stubs for CORE-01, CORE-04
- [ ] `tests/core/tick-loop.test.ts` — stubs for CORE-02, CORE-05, CORE-06
- [ ] `tests/utils/history-buffer.test.ts` — stubs for CORE-03, UTIL-02
- [ ] `tests/theme/custom-properties.test.ts` — stubs for THEME-01

*Framework install: `vitest@^4.1.0`, `@testing-library/react@^16`, `jsdom` to be added in Wave 0.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Storybook starts without error, smoke story renders | INFRA-06 | Browser UI interaction, not automatable headlessly | Run `npm run storybook`, open localhost, verify counter story increments |
| Overriding `--sim-accent` changes accent elements | THEME-02 | Requires browser computed style inspection | Add `--sim-accent: red` to consumer CSS, verify buttons/accents turn red |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 15s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
