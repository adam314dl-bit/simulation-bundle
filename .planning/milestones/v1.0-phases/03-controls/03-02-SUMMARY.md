---
phase: 03-controls
plan: 02
subsystem: ui
tags: [react, timeline, playback, keyboard-shortcuts, scrubber, pointer-events]

requires:
  - phase: 01-infrastructure
    provides: SimStore actions (toggle, step, stepBack, setSpeed, seekToTick), usePlayback/useEvents hooks, SPEED_PRESETS, CSS custom properties
provides:
  - TimelineControl with scrubber, transport, speed badge, tick counter, FPS counter, keyframe markers, keyboard shortcuts
  - PlaybackBar with play/pause, speed badge, tick counter in 40px compact bar
affects: [03-controls, 06-documentation]

tech-stack:
  added: []
  patterns: [PointerEvents with setPointerCapture for scrubber drag, rAF-based FPS counter with direct DOM update, keyframe marker clustering by severity, inline cycleSpeed helper per component]

key-files:
  created:
    - src/controls/TimelineControl.tsx
    - src/controls/PlaybackBar.tsx
    - tests/controls/TimelineControl.test.tsx
    - tests/controls/PlaybackBar.test.tsx
  modified:
    - src/controls/index.ts

key-decisions:
  - "Identity tickFn tests need non-undefined initialEntities to avoid stepBack/seekToTick no-op (history stores undefined which fails !== undefined check)"
  - "Inline cycleSpeed helper duplicated in both components to keep zero coupling between TimelineControl and PlaybackBar"
  - "FPS counter uses rAF + direct textContent update to avoid React re-render overhead"

patterns-established:
  - "PointerEvents + setPointerCapture for drag interactions in sim-kit controls"
  - "Keyframe marker clustering via Map keyed by rounded pixel position, highest severity wins"
  - "Keyboard shortcut pattern: window keydown listener with activeElement tag guard and enableShortcuts prop"

requirements-completed: [CTRL-03, CTRL-04, CTRL-05]

duration: 5min
completed: 2026-03-19
---

# Phase 03 Plan 02: Timeline and Playback Controls Summary

**TimelineControl with draggable scrubber, transport, keyboard shortcuts, FPS counter, and keyframe markers; PlaybackBar as 40px compact alternative**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-19T07:26:30Z
- **Completed:** 2026-03-19T07:31:30Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- TimelineControl provides full playback interface: scrubber with PointerEvent drag, transport buttons, speed badge cycling, tick counter, FPS counter, severity-colored keyframe markers
- Keyboard shortcuts (Space, arrows, Shift+arrows) work globally with input-element guard and enableShortcuts prop
- PlaybackBar provides minimal 40px compact bar with play/pause, speed badge, and tick counter only
- 20 tests passing across both components (13 TimelineControl + 7 PlaybackBar)

## Task Commits

Each task was committed atomically:

1. **Task 1: TimelineControl** - `956608f` (test), `ef33407` (feat)
2. **Task 2: PlaybackBar** - `498ed71` (test), `527e308` (feat)

_TDD tasks have RED (test) and GREEN (feat) commits._

## Files Created/Modified
- `src/controls/TimelineControl.tsx` - Full-featured timeline with scrubber, transport, shortcuts, FPS, keyframe markers
- `src/controls/PlaybackBar.tsx` - Minimal 40px playback bar with play/pause, speed badge, tick counter
- `tests/controls/TimelineControl.test.tsx` - 13 tests covering CTRL-03 (scrubber, transport, speed) and CTRL-04 (keyboard shortcuts)
- `tests/controls/PlaybackBar.test.tsx` - 7 tests covering CTRL-05 (minimal bar, negative tests for excluded features)
- `src/controls/index.ts` - Added TimelineControl and PlaybackBar exports

## Decisions Made
- Identity tickFn tests require non-undefined initialEntities because stepBack/seekToTick check `prev !== undefined` -- history entries of `undefined` are indistinguishable from out-of-bounds
- Duplicated cycleSpeed helper in both components (5-line function) to maintain zero coupling between TimelineControl and PlaybackBar
- FPS counter uses requestAnimationFrame + direct DOM textContent update to avoid React re-render overhead at measurement frequency

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test initialEntities for stepBack/seekToTick**
- **Found during:** Task 1 (TimelineControl GREEN phase)
- **Issue:** Tests using identity tickFn with no initialEntities stored `undefined` in history, causing stepBack and seekToTick to silently no-op (both check `!== undefined`)
- **Fix:** Added `initialEntities={{ v: 0 }}` to test wrappers
- **Files modified:** tests/controls/TimelineControl.test.tsx, tests/controls/PlaybackBar.test.tsx
- **Verification:** All step/seek keyboard tests pass
- **Committed in:** ef33407 (Task 1 commit)

**2. [Rule 1 - Bug] Fixed input focus guard test approach**
- **Found during:** Task 1 (TimelineControl GREEN phase)
- **Issue:** `fireEvent.keyDown(document, { target: input })` threw "given element does not have a value setter" because testing-library tries to set value on the target
- **Fix:** Used native `input.dispatchEvent(new KeyboardEvent('keydown', ...))` instead
- **Files modified:** tests/controls/TimelineControl.test.tsx
- **Verification:** Input focus guard test passes
- **Committed in:** ef33407 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 bug fixes)
**Impact on plan:** Both fixes necessary for test correctness. No scope creep.

## Issues Encountered
None beyond the auto-fixed test issues above.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- TimelineControl and PlaybackBar ready for integration
- Barrel exports updated in src/controls/index.ts
- PresetSelector (03-03) can proceed independently

---
*Phase: 03-controls*
*Completed: 2026-03-19*

## Self-Check: PASSED
