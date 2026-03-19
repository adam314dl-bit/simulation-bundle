# Phase 3: Controls - Research

**Researched:** 2026-03-19
**Domain:** React UI components (form controls, keyboard events, drag interaction) consuming Zustand store
**Confidence:** HIGH

## Summary

Phase 3 builds four React components (ParameterPanel, TimelineControl, PlaybackBar, PresetSelector) that provide interactive controls for simulation playback and parameter adjustment. All components consume the existing SimStore via the `useSimulation` hook and its convenience selectors (`usePlayback`, `useIsRunning`, `useTick`, `useSpeed`, `useParameters`, `useEvents`). No new dependencies are required -- the existing stack (React 19, Zustand 5, Tailwind v4, clsx, TypeScript 5.9 strict) provides everything needed.

The core challenge is building responsive, performant form controls that avoid unnecessary re-renders while maintaining the premium "deep space dark" aesthetic established in Phase 1. The ParameterPanel must auto-generate controls from a discriminated union type (`ParameterDef`), the TimelineControl must handle pointer-based drag seeking plus global keyboard shortcuts, and all components must use CSS custom properties for theming consistency.

**Primary recommendation:** Build each component as a self-contained module in `src/controls/`, use `usePlayback` for TimelineControl/PlaybackBar (one selector for all playback state), use `useParameters` with per-control `setParameter` calls for ParameterPanel, and register global keyboard listeners via `useEffect` on `window` with proper cleanup and input-element guards.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Thin 4px track with --sim-accent colored thumb for range sliders
- Numeric value displayed inline to the right of each slider
- Toggle controls: pill-shaped ON/OFF switch with --sim-accent fill when active
- Select controls: custom dropdown styled with --sim-surface background and --sim-border
- Color controls: small swatch + native HTML5 color input (no custom picker)
- Vec2 controls: two horizontal sliders stacked, labeled X/Y
- Width-based auto column switching: single column below 320px, 2 columns above. Override via columns={1|2} prop
- Compact mode: reduced vertical spacing (8px vs 16px gap), labels inline with controls instead of stacked above, forced single column
- Collapsible groups: chevron toggle, all groups start expanded, smooth height transition
- Reset All: ghost/text button at bottom-right, resets to ParameterSchema defaults, no confirmation
- Filled progress bar style scrubber: --sim-accent filled portion, dimmed track for future
- Draggable thumb for seeking, click-to-seek on track
- Transport controls on left: step-back, play/pause, step-forward
- Tick counter (420/1000 format) right-aligned at top
- FPS counter in --sim-text-muted below tick counter, always visible
- Speed badge: clickable cycles through SPEED_PRESETS, Shift+click cycles backward
- Keyframe markers: 4px colored dots below scrubber, colored by severity (accent/warning/danger), tooltip on hover, click seeks
- Global keyboard shortcuts when TimelineControl is mounted (Space, arrows, Shift+arrows)
- Skip capture when activeElement is input/textarea/select
- Buyers can disable via enableShortcuts={false} prop
- PlaybackBar has NO keyboard shortcuts
- PlaybackBar: fixed 40px height, play/pause icon, speed badge, tick counter only
- PresetSelector: default layout is pills, three variants (pills/dropdown/cards)
- Preset API: array of {name, config} objects
- Switching presets: instant parameter swap via setParameter calls

### Claude's Discretion
- Exact slider thumb size, border radius, and shadow styling
- Internal focus ring styling for accessibility
- FPS calculation method (rolling average window size)
- Keyframe marker clustering for dense event regions
- Touch interaction details for mobile scrubber dragging
- Dropdown and cards variant styling details for PresetSelector
- Vec2 control exact layout and label placement

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CTRL-01 | ParameterPanel auto-generates UI controls from ParameterSchema (range, toggle, select, color, vec2, group) | ParameterDef discriminated union already defined in types; switch on `def.type` to render correct control |
| CTRL-02 | ParameterPanel supports reset all, compact mode, 1/2 column layout, real-time values, dark mode | useParameters hook for values, resetParameters action, CSS grid for columns, --sim-* vars for dark mode |
| CTRL-03 | TimelineControl: draggable scrubber, click-to-seek, play/pause, step, speed selector, keyframe markers, FPS counter | usePlayback hook provides all state/actions; PointerEvents for drag; performance.now() for FPS |
| CTRL-04 | TimelineControl keyboard shortcuts: Space, arrows, Shift+arrows | Global useEffect keydown listener on window with activeElement guard |
| CTRL-05 | PlaybackBar: minimal 40px bar with play/pause, speed badge, tick counter | usePlayback hook; subset of TimelineControl UI; no scrubber, no shortcuts |
| CTRL-06 | PresetSelector: switch parameter configs with dropdown/cards/pills variants | Iterate preset.config entries calling setParameter; controlled active state |
</phase_requirements>

## Standard Stack

### Core (already installed -- no new dependencies)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react | ^19.2.0 | Component framework | Project peer dependency |
| zustand | ^5.0.12 | State management | SimStore already built on it |
| clsx | ^2.1.0 | Conditional classnames | Already in deps, standard for Tailwind |
| tailwindcss | ^4.2.1 | Utility CSS (layout) | Project standard via @tailwindcss/vite |
| typescript | ~5.9.3 | Type safety | Strict mode with exactOptionalPropertyTypes |

### Supporting (already installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @testing-library/react | ^16.3.2 | Component testing | All control unit tests |
| @testing-library/jest-dom | ^6.6.3 | DOM assertions | toBeInTheDocument, toHaveClass, etc. |
| vitest | ^4.1.0 | Test runner | `vitest run` for CI |
| @storybook/react-vite | ^10.3.0 | Interactive demos | Stories for each control component |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native range input | @radix-ui/react-slider | Adds dependency; native + CSS is sufficient for our styling needs |
| Custom dropdown | @radix-ui/react-select | Adds dependency; we only need basic select styling |
| ResizeObserver for columns | CSS container queries | Container queries need @container support; ResizeObserver is more explicit and testable |

**Installation:** No new packages needed. All dependencies already in package.json.

## Architecture Patterns

### Recommended Project Structure
```
src/controls/
  ParameterPanel.tsx    # CTRL-01, CTRL-02
  TimelineControl.tsx   # CTRL-03, CTRL-04
  PlaybackBar.tsx       # CTRL-05
  PresetSelector.tsx    # CTRL-06
  index.ts              # Barrel exports (currently empty placeholder)
```

### Pattern 1: Discriminated Union Control Rendering
**What:** Switch on `ParameterDef.type` to render the correct control widget.
**When to use:** ParameterPanel iterating over ParameterSchema entries.
**Example:**
```typescript
// Each ParameterDef has a discriminated `type` field
function renderControl(key: string, def: ParameterDef, value: ParameterValue, onChange: (k: string, v: ParameterValue) => void) {
  switch (def.type) {
    case 'range':
      return <RangeControl key={key} paramKey={key} def={def} value={value as number} onChange={onChange} />;
    case 'toggle':
      return <ToggleControl key={key} paramKey={key} def={def} value={value as boolean} onChange={onChange} />;
    case 'select':
      return <SelectControl key={key} paramKey={key} def={def} value={value as string} onChange={onChange} />;
    case 'color':
      return <ColorControl key={key} paramKey={key} def={def} value={value as string} onChange={onChange} />;
    case 'vec2':
      return <Vec2Control key={key} paramKey={key} def={def} value={value as [number, number]} onChange={onChange} />;
    case 'group':
      return <GroupControl key={key} def={def} values={values} onChange={onChange} />;
  }
}
```

### Pattern 2: PointerEvents for Drag Seeking (established in Phase 2)
**What:** Use PointerEvents (onPointerDown/Move/Up + setPointerCapture) for scrubber dragging.
**When to use:** TimelineControl scrubber thumb and track.
**Example:**
```typescript
// Pointer capture ensures moves are tracked even when cursor leaves the element
const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
  e.currentTarget.setPointerCapture(e.pointerId);
  setDragging(true);
  seekToPosition(e);
};
const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
  if (!dragging) return;
  seekToPosition(e);
};
const handlePointerUp = () => {
  setDragging(false);
};
```

### Pattern 3: Global Keyboard Shortcut Registration
**What:** Register keydown listener on `window` in useEffect, guard against active input elements.
**When to use:** TimelineControl keyboard shortcuts (CTRL-04).
**Example:**
```typescript
useEffect(() => {
  if (!enableShortcuts) return;
  const handler = (e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement)?.tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    switch (e.key) {
      case ' ':
        e.preventDefault();
        toggle();
        break;
      case 'ArrowRight':
        e.preventDefault();
        e.shiftKey ? seekToTick(Math.min(tick + 10, historySize - 1)) : step();
        break;
      case 'ArrowLeft':
        e.preventDefault();
        e.shiftKey ? seekToTick(Math.max(tick - 10, 0)) : stepBack();
        break;
    }
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [enableShortcuts, toggle, step, stepBack, seekToTick, tick, historySize]);
```

### Pattern 4: FPS Calculation via Rolling Average
**What:** Use `performance.now()` with a rolling window to calculate smooth FPS.
**When to use:** TimelineControl FPS counter.
**Example:**
```typescript
// Use useRef to avoid re-renders. Update display via DOM manipulation or throttled setState.
const frameTimesRef = useRef<number[]>([]);
const fpsRef = useRef(0);

// Called each tick via store subscription (outside React render cycle)
function measureFps() {
  const now = performance.now();
  const times = frameTimesRef.current;
  times.push(now);
  // Keep last 30 frames for rolling average
  while (times.length > 30) times.shift();
  if (times.length > 1) {
    const elapsed = times[times.length - 1] - times[0];
    fpsRef.current = Math.round(((times.length - 1) / elapsed) * 1000);
  }
}
```

### Pattern 5: Width-Based Column Switching with ResizeObserver
**What:** Observe container width to auto-switch between 1 and 2 columns.
**When to use:** ParameterPanel auto-column layout.
**Example:**
```typescript
const containerRef = useRef<HTMLDivElement>(null);
const [autoColumns, setAutoColumns] = useState(1);

useEffect(() => {
  const el = containerRef.current;
  if (!el) return;
  const observer = new ResizeObserver(([entry]) => {
    setAutoColumns(entry.contentRect.width >= 320 ? 2 : 1);
  });
  observer.observe(el);
  return () => observer.disconnect();
}, []);
```

### Anti-Patterns to Avoid
- **Reading entire store in one selector:** Each control should select only what it needs. ParameterPanel reads `parameters` + `setParameter` + `resetParameters`. TimelineControl reads via `usePlayback`. Never `useSimulation(s => s)`.
- **State in CSS transitions for collapsible groups:** Don't use `max-height: 9999px` hack. Use a measured height approach: measure content height with ref, transition from 0 to measured height, and set `overflow: hidden` during transition.
- **Inline handler re-creation in loops:** When rendering many parameter controls, use `useCallback` or pass stable `setParameter` action (which is already stable from Zustand). The `key` prop handles identity.
- **Attaching multiple global keydown listeners:** Only TimelineControl owns keyboard shortcuts. PlaybackBar explicitly does NOT register them. If multiple TimelineControls mount (unlikely but possible), they would duplicate listeners -- document this as a known constraint.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Color picker | Custom color wheel/spectrum | Native `<input type="color">` | Locked decision; color pickers are maintenance nightmares (per REQUIREMENTS out-of-scope) |
| Pointer capture for drag | Manual mousemove/mouseup on window | `setPointerCapture` + PointerEvents | Established pattern from Phase 2; handles touch + mouse uniformly |
| Conditional classnames | String concatenation | `clsx()` | Already a dependency; cleaner than template literals |
| Stable equality for selectors | Custom shallow compare | `useShallow` from zustand/shallow | Already used throughout codebase via useSimulation wrapper |

**Key insight:** These controls are standard form/playback UI. The complexity is in styling consistency and re-render avoidance, not in algorithm design. Lean on native HTML elements + CSS custom properties.

## Common Pitfalls

### Pitfall 1: Infinite Re-renders from Object Selectors
**What goes wrong:** Selecting `s.parameters` (an object) without shallow comparison causes every tick to re-render ParameterPanel.
**Why it happens:** Zustand uses `Object.is` by default; a new parameters object reference is created on each `setParameter` call.
**How to avoid:** `useSimulation` already wraps all selectors with `useShallow`. This is handled. But be aware: if you destructure inside the selector, each destructured value must be primitive or the same reference.
**Warning signs:** React DevTools showing ParameterPanel re-rendering at tick rate.

### Pitfall 2: Keyboard Events Captured in Input Fields
**What goes wrong:** Space/arrow keys trigger simulation controls while user types in a text input or adjusts a select dropdown.
**Why it happens:** Global `window` keydown listener fires for all key events.
**How to avoid:** Check `document.activeElement?.tagName` and skip handler if it's INPUT, TEXTAREA, or SELECT. Also check `contentEditable`.
**Warning signs:** Parameter inputs (range sliders, selects) behaving erratically during interaction.

### Pitfall 3: Scrubber Drag Losing Pointer Outside Element
**What goes wrong:** User drags scrubber thumb, moves pointer outside the track, and the drag stops tracking.
**Why it happens:** Without pointer capture, pointermove only fires while pointer is over the element.
**How to avoid:** Call `element.setPointerCapture(e.pointerId)` on pointerdown. This routes all subsequent pointer events to that element until pointerup.
**Warning signs:** Scrubber "sticking" when user moves mouse quickly.

### Pitfall 4: FPS Counter Causing High-Frequency Re-renders
**What goes wrong:** Updating FPS state at every animation frame triggers React re-render cascade.
**Why it happens:** `setState` inside requestAnimationFrame or store subscription.
**How to avoid:** Use a ref for the FPS value and update the DOM element directly (via ref), or throttle setState to once per 500ms. Since FPS display only needs ~2Hz update rate, throttling is fine.
**Warning signs:** Performance profiler showing FPS counter as top re-render source.

### Pitfall 5: Collapsible Group Height Transition Janky
**What goes wrong:** CSS `height: auto` cannot be transitioned. Using `max-height` with a large value creates uneven animation speed.
**Why it happens:** CSS transitions require explicit numeric start and end values.
**How to avoid:** Measure content height with a ref on mount and on content change. Transition between `height: 0` and `height: ${measuredHeight}px`. Set `overflow: hidden` during transition, remove after.
**Warning signs:** Groups snapping open/closed or animating at wrong speed.

### Pitfall 6: Speed Badge Shift+Click Not Detected on All Platforms
**What goes wrong:** `e.shiftKey` on click events may not reliably report shift state on some browsers.
**Why it happens:** Rare edge case with accessibility software intercepting shift key.
**How to avoid:** Use standard `MouseEvent.shiftKey` -- this is reliable in all modern browsers. Test with actual Shift+click in stories.
**Warning signs:** Speed cycling only going forward, never backward.

### Pitfall 7: exactOptionalPropertyTypes Gotcha
**What goes wrong:** TypeScript errors when passing `undefined` for optional props.
**Why it happens:** `exactOptionalPropertyTypes` in tsconfig means `prop?: string` does not accept `undefined` explicitly -- only omitting the prop.
**How to avoid:** Don't spread objects with potentially undefined values into props. Use conditional prop inclusion or explicit checks. This was already encountered in Phase 1 (01-05 decision).
**Warning signs:** TS errors like "Type 'undefined' is not assignable to type 'string'".

## Code Examples

### ParameterPanel Props Interface
```typescript
export interface ParameterPanelProps {
  /** ParameterSchema defining the controls to render */
  schema: ParameterSchema;
  /** Force 1 or 2 columns. Omit for auto (width-based) */
  columns?: 1 | 2;
  /** Compact mode: reduced spacing, inline labels, forced single column */
  compact?: boolean;
  /** Additional CSS class */
  className?: string;
}
```

### TimelineControl Props Interface
```typescript
export interface TimelineControlProps {
  /** Enable global keyboard shortcuts. Default: true */
  enableShortcuts?: boolean;
  /** Additional CSS class */
  className?: string;
}
```

### PlaybackBar Props Interface
```typescript
export interface PlaybackBarProps {
  /** Additional CSS class */
  className?: string;
}
```

### PresetSelector Props Interface
```typescript
export interface Preset {
  name: string;
  config: Record<string, ParameterValue>;
  /** Optional description for cards variant */
  description?: string;
}

export interface PresetSelectorProps {
  presets: Preset[];
  /** Layout variant. Default: "pills" */
  variant?: 'pills' | 'dropdown' | 'cards';
  /** Additional CSS class */
  className?: string;
}
```

### Speed Badge Cycling Logic
```typescript
import { SPEED_PRESETS, type SpeedPreset } from '../types/index';

function cycleSpeed(current: SpeedPreset, backward: boolean): SpeedPreset {
  const idx = SPEED_PRESETS.indexOf(current);
  const next = backward
    ? (idx - 1 + SPEED_PRESETS.length) % SPEED_PRESETS.length
    : (idx + 1) % SPEED_PRESETS.length;
  return SPEED_PRESETS[next];
}
```

### Preset Application Logic
```typescript
function applyPreset(preset: Preset, setParameter: (key: string, value: ParameterValue) => void) {
  for (const [key, value] of Object.entries(preset.config)) {
    setParameter(key, value);
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| onChange on range input fires on every pixel | onInput for live updates, onChange for commit | Long-standing | Use onInput for real-time value display on sliders |
| Mouse events + touch events separately | PointerEvents unified API | Widely supported since 2020 | Single code path for drag interactions (established in Phase 2) |
| CSS `max-height` for collapse animation | Measured height transition or `<details>` + `content-visibility` | 2024+ | More predictable animation timing |
| `requestAnimationFrame` for FPS | `performance.now()` rolling average | Standard practice | Decoupled from render cycle |

**Deprecated/outdated:**
- `SyntheticEvent.persist()`: Not needed in React 19 (events are not pooled since React 17)
- `componentDidMount` for keyboard listeners: Use `useEffect` cleanup pattern

## Open Questions

1. **Keyframe marker clustering for dense events**
   - What we know: Events can accumulate heavily at certain ticks; rendering 1000 dots on a 400px track is useless
   - What's unclear: Exact clustering algorithm and threshold
   - Recommendation: Simple approach -- if multiple events share the same pixel position (round tick-to-pixel), merge into one dot with highest severity color. Tooltip shows count. This is Claude's discretion per CONTEXT.md.

2. **Touch interaction details for mobile scrubber**
   - What we know: PointerEvents handle touch natively via setPointerCapture
   - What's unclear: Whether thumb size needs to increase on touch devices for accessibility
   - Recommendation: Use a minimum 44x44px touch target (WCAG), but the visible thumb can be smaller. This is Claude's discretion per CONTEXT.md.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | vitest 4.1.0 + @testing-library/react 16.3.2 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run tests/controls/` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CTRL-01 | ParameterPanel renders controls from schema (range, toggle, select, color, vec2, group) | unit | `npx vitest run tests/controls/ParameterPanel.test.tsx -t "auto-generates"` | Wave 0 |
| CTRL-02 | ParameterPanel reset-all, compact mode, column layout | unit | `npx vitest run tests/controls/ParameterPanel.test.tsx -t "reset\|compact\|column"` | Wave 0 |
| CTRL-03 | TimelineControl scrubber, transport buttons, speed badge, keyframe markers, FPS | unit | `npx vitest run tests/controls/TimelineControl.test.tsx` | Wave 0 |
| CTRL-04 | TimelineControl keyboard shortcuts | unit | `npx vitest run tests/controls/TimelineControl.test.tsx -t "keyboard"` | Wave 0 |
| CTRL-05 | PlaybackBar renders play/pause, speed, tick counter in 40px | unit | `npx vitest run tests/controls/PlaybackBar.test.tsx` | Wave 0 |
| CTRL-06 | PresetSelector switches presets with pills/dropdown/cards variants | unit | `npx vitest run tests/controls/PresetSelector.test.tsx` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/controls/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `tests/controls/ParameterPanel.test.tsx` -- covers CTRL-01, CTRL-02
- [ ] `tests/controls/TimelineControl.test.tsx` -- covers CTRL-03, CTRL-04
- [ ] `tests/controls/PlaybackBar.test.tsx` -- covers CTRL-05
- [ ] `tests/controls/PresetSelector.test.tsx` -- covers CTRL-06

*(Test infrastructure (vitest, testing-library, jsdom, setup.ts) already exists from Phase 1. No framework install needed.)*

## Sources

### Primary (HIGH confidence)
- Project source code: `src/types/index.ts`, `src/core/store.ts`, `src/core/useSimulation.ts`, `src/core/SimulationProvider.tsx` -- direct inspection of types, hooks, and store actions
- Project config: `package.json`, `vitest.config.ts`, `src/theme/index.css` -- verified all dependencies and theming tokens
- CONTEXT.md decisions -- locked implementation details for all four components

### Secondary (MEDIUM confidence)
- Phase 1 and Phase 2 established patterns (from STATE.md): useShallow, PointerEvents, Zustand vanilla API, Tailwind + CSS vars

### Tertiary (LOW confidence)
- None -- all research is based on existing codebase and locked decisions

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all libraries already installed and proven in Phases 1-2
- Architecture: HIGH -- patterns (useShallow, PointerEvents, Zustand selectors) established in prior phases
- Pitfalls: HIGH -- based on direct experience with React + Zustand + keyboard events; verified against codebase patterns

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable domain, no fast-moving dependencies)
