# Phase 5: Data Visualization - Research

**Researched:** 2026-03-19
**Domain:** React data visualization components (stats, charts, event logs, heatmaps, entity inspection)
**Confidence:** HIGH

## Summary

Phase 5 builds 5 data visualization components that subscribe to the existing Zustand-based SimStore via `useSimulation`. The components are: StatsPanel (live numeric readouts), MiniChart (Recharts sparklines), EventLog (virtualized event feed), HeatmapOverlay (canvas-based heatmap), and EntityInspector (entity property viewer with inline charts). All integration points are well-established from Phases 1-4.

The primary technical considerations are: (1) throttling React re-renders for tick-rate data using rAF gates and Zustand vanilla API, (2) manual virtualized scrolling for EventLog without adding dependencies, (3) canvas-based heatmap with bilinear interpolation using the existing LayerStack compositing infrastructure, and (4) Recharts 3.8 AreaChart configuration for sparkline rendering.

**Primary recommendation:** Follow established codebase patterns -- Zustand getState/setState for tick-rate updates, pointer events for drag, inline styles + CSS custom properties for theming, and barrel exports from src/data/index.ts.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- StatsPanel uses 2-column CSS grid layout, matching ParameterPanel's compact mode pattern from Phase 3
- Stat value formatting via Intl.NumberFormat with configurable options prop for flexibility
- Inline sparklines at 60x20px SVG -- small enough for stat rows, still readable
- Change indicators (up/down arrows) use percentage-based comparison with configurable threshold (default 0 -- any change shows arrow)
- MiniChart throttles updates via requestAnimationFrame gate -- prevents Recharts re-renders from degrading tick loop performance
- EventLog virtualization via manual windowed rendering (calculate visible rows from scroll position + row height) -- zero extra dependencies
- EventLog severity colors mapped to CSS custom properties (--sim-info, --sim-warning, --sim-critical) extending --sim-* theming system
- Click-to-seek in EventLog calls seekToTick() already exposed by useSimulation (CORE-04)
- HeatmapOverlay renders on a separate canvas element layered via LayerStack -- reuses Phase 2 compositing infrastructure
- Bilinear interpolation implemented manually (4-sample weighted average in JS) for predictable cross-browser results
- EntityInspector floating mode drag uses pointer events + CSS transform translate -- matches SimCanvas pan interaction pattern
- EntityInspector positioning driven by CSS via position prop accepting "right" | "bottom" | "floating" -- no layout library needed

### Claude's Discretion
- Internal component decomposition and file organization within the data layer
- Test strategy details (unit vs integration split)
- Recharts configuration specifics for MiniChart (area vs line, color, animation)

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope.

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DATA-01 | StatsPanel: live numeric readout with formatting, inline sparklines, change indicators | Intl.NumberFormat API, inline SVG sparkline pattern, Zustand subscription for live updates |
| DATA-02 | MiniChart: auto-scrolling sparkline/area chart via Recharts 3 with configurable data window | Recharts 3.8 AreaChart/ResponsiveContainer API, rAF throttle pattern |
| DATA-03 | EventLog: scrolling timestamped event feed, color-coded severity, type filtering, auto-scroll, click-to-seek | Manual virtualization pattern, CSS custom properties for severity colors, seekToTick integration |
| DATA-04 | EventLog: virtualized rendering for long event lists | Manual windowed rendering: scrollTop / rowHeight math, translateY positioning |
| DATA-05 | HeatmapOverlay: canvas-based heatmap with color ramp, opacity, bilinear interpolation, legend bar | Canvas2D ImageData, existing color-ramps.ts getRampLUT, LayerStack integration |
| DATA-06 | EntityInspector: entity properties, inline MiniCharts, track toggle, right/bottom/floating positioning | Pointer events drag pattern, CSS transform translate, position prop union type |

</phase_requirements>

## Standard Stack

### Core (already installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | 3.8.0 | MiniChart sparkline/area charts | Already a project dependency, peer dep in package.json |
| zustand | 5.0.12 | State subscription for all data components | Project state management layer |
| react | 19.2.0 | Component rendering | Project framework |

### Supporting (already available)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| color-ramps.ts | (internal) | HeatmapOverlay color mapping | getRampLUT() for Uint8Array LUT access |
| history-buffer.ts | (internal) | Historical data for sparklines | RingBuffer.get() for random access to past ticks |
| LayerStack | (internal) | HeatmapOverlay compositing | Canvas element layered inside LayerStack |

### No New Dependencies Needed
All 5 components can be built with existing dependencies. The decisions explicitly mandate manual virtualization (no react-window/react-virtuoso) and manual drag (no dnd-kit/react-draggable).

## Architecture Patterns

### Recommended Project Structure
```
src/data/
  StatsPanel.tsx        # DATA-01: live stats with inline sparklines
  MiniChart.tsx         # DATA-02: Recharts sparkline wrapper
  EventLog.tsx          # DATA-03, DATA-04: virtualized event feed
  HeatmapOverlay.tsx    # DATA-05: canvas heatmap with legend
  EntityInspector.tsx   # DATA-06: entity property viewer
  types.ts              # Props interfaces for all data components
  index.ts              # Barrel exports (already scaffolded)
```

### Pattern 1: rAF-Gated React Updates (MiniChart, StatsPanel)
**What:** Zustand store fires at tick rate (60+ Hz). React components must not re-render at that rate. Use requestAnimationFrame as a gate to batch updates to display refresh rate.
**When to use:** Any component displaying tick-rate data via React state.
**Example:**
```typescript
// Established pattern from FPS counter in TimelineControl (Phase 3)
const dataRef = useRef<DataPoint[]>([]);
const [displayData, setDisplayData] = useState<DataPoint[]>([]);
const rafPending = useRef(false);

useEffect(() => {
  const unsub = store.subscribe(() => {
    // Accumulate data outside React
    const state = store.getState();
    dataRef.current = [...dataRef.current.slice(-windowSize + 1), {
      tick: state.tick,
      value: selector(state),
    }];

    // Gate React updates to rAF
    if (!rafPending.current) {
      rafPending.current = true;
      requestAnimationFrame(() => {
        rafPending.current = false;
        setDisplayData([...dataRef.current]);
      });
    }
  });
  return unsub;
}, []);
```

### Pattern 2: Manual Virtualized Scrolling (EventLog)
**What:** Render only visible rows by computing window from scrollTop and fixed row height. Uses translateY to position visible rows correctly within a tall sentinel div.
**When to use:** EventLog with potentially thousands of events.
**Example:**
```typescript
const ROW_HEIGHT = 32; // fixed row height in px
const containerRef = useRef<HTMLDivElement>(null);
const [scrollTop, setScrollTop] = useState(0);

const visibleStart = Math.floor(scrollTop / ROW_HEIGHT);
const visibleCount = Math.ceil(containerHeight / ROW_HEIGHT) + 1; // +1 overscan
const visibleEnd = Math.min(visibleStart + visibleCount, events.length);

// Total height sentinel for scrollbar
<div style={{ height: events.length * ROW_HEIGHT }}>
  <div style={{ transform: `translateY(${visibleStart * ROW_HEIGHT}px)` }}>
    {events.slice(visibleStart, visibleEnd).map(event => (
      <EventRow key={event.id} event={event} />
    ))}
  </div>
</div>
```

### Pattern 3: Canvas Heatmap with Bilinear Interpolation (HeatmapOverlay)
**What:** Render a 2D scalar field to canvas using ImageData, mapping values through color ramp LUT. Bilinear interpolation smooths between grid cells.
**When to use:** HeatmapOverlay component.
**Example:**
```typescript
// Bilinear interpolation: 4-sample weighted average
function bilinearSample(data: Float64Array, w: number, h: number, x: number, y: number): number {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, w - 1), y1 = Math.min(y0 + 1, h - 1);
  const fx = x - x0, fy = y - y0;

  const v00 = data[y0 * w + x0]!;
  const v10 = data[y0 * w + x1]!;
  const v01 = data[y1 * w + x0]!;
  const v11 = data[y1 * w + x1]!;

  return v00 * (1 - fx) * (1 - fy) + v10 * fx * (1 - fy) +
         v01 * (1 - fx) * fy + v11 * fx * fy;
}
```

### Pattern 4: Pointer Events Drag (EntityInspector floating mode)
**What:** setPointerCapture for reliable drag tracking, CSS transform translate for positioning. Matches SimCanvas pan pattern from Phase 2.
**When to use:** EntityInspector in floating mode.
**Example:**
```typescript
// Established pattern from SimCanvas, ForceGraph
const posRef = useRef({ x: 100, y: 100 });
const dragStartRef = useRef({ x: 0, y: 0, ox: 0, oy: 0 });

const onPointerDown = (e: React.PointerEvent) => {
  (e.target as HTMLElement).setPointerCapture(e.pointerId);
  dragStartRef.current = { x: e.clientX, y: e.clientY, ox: posRef.current.x, oy: posRef.current.y };
};
const onPointerMove = (e: React.PointerEvent) => {
  if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
  posRef.current = {
    x: dragStartRef.current.ox + (e.clientX - dragStartRef.current.x),
    y: dragStartRef.current.oy + (e.clientY - dragStartRef.current.y),
  };
  (e.currentTarget as HTMLElement).style.transform =
    `translate(${posRef.current.x}px, ${posRef.current.y}px)`;
};
```

### Anti-Patterns to Avoid
- **Re-rendering at tick rate:** Never subscribe to full Zustand state in a React render cycle. Always use selectors or vanilla getState with rAF gate.
- **Separate CSS files per component:** Codebase uses inline styles + CSS custom properties exclusively. No .css or .module.css files.
- **Adding virtualization libraries:** Decision locks manual windowed rendering. Do not add react-window, react-virtuoso, or similar.
- **D3 DOM manipulation:** Recharts handles SVG. For canvas heatmap, use raw Canvas2D API. Never use D3 for DOM in this project.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Sparkline charts | Custom SVG path generator | Recharts AreaChart/LineChart | Already a dependency, handles scaling/axes/animation |
| Color ramp lookup | New color interpolation | `getRampLUT()` from color-ramps.ts | 6 built-in ramps, 256-entry Uint8Array LUTs, already tested |
| Number formatting | Custom format functions | `Intl.NumberFormat` | Browser-native, locale-aware, configurable via options prop |
| State subscription | Custom pub/sub | Zustand `subscribe()` / `getState()` | Already the project's state management pattern |
| Layer compositing | z-index management | LayerStack component | Phase 2 infrastructure, handles absolute positioning and z-index |

**Key insight:** The inline 60x20px sparklines in StatsPanel are simple enough for hand-drawn SVG polyline (no Recharts needed for those). Reserve Recharts for the full MiniChart component which needs auto-scaling axes and data windowing.

## Common Pitfalls

### Pitfall 1: Recharts Re-render Storm
**What goes wrong:** Passing a new array reference to Recharts data prop on every tick causes full chart re-render at 60Hz, dropping frame rate.
**Why it happens:** Recharts performs deep comparison on data prop. New array reference = new render.
**How to avoid:** rAF gate pattern. Only update the data state variable once per animation frame. Keep a mutable ref for accumulation, copy to state only in rAF callback.
**Warning signs:** FPS drops when MiniChart is mounted; profiler shows Recharts components in hot path.

### Pitfall 2: EventLog Scroll Jump on New Events
**What goes wrong:** Adding events shifts scroll position, causing jitter when user is reading older events.
**Why it happens:** New items prepended/appended change total height, and auto-scroll logic conflicts with manual scroll position.
**How to avoid:** Track whether user has manually scrolled away from bottom. Only auto-scroll when user is at or near the bottom (within 1 row height). Use `scrollHeight - scrollTop - clientHeight < ROW_HEIGHT` check.
**Warning signs:** Log content jumps unexpectedly; user can't read older entries.

### Pitfall 3: HeatmapOverlay Canvas Size Mismatch
**What goes wrong:** Canvas CSS size differs from pixel buffer size, causing blurry or misaligned heatmap.
**Why it happens:** devicePixelRatio not accounted for, or canvas not sized to match LayerStack container.
**How to avoid:** Follow SimCanvas DPR pattern: `canvas.width = cssWidth * dpr; canvas.style.width = cssWidth + 'px'`. Use ResizeObserver to track container size changes.
**Warning signs:** Blurry heatmap, misalignment with grid cells below.

### Pitfall 4: Intl.NumberFormat Created Per Render
**What goes wrong:** Creating new Intl.NumberFormat instance on every render is expensive (~10-50x slower than reusing).
**Why it happens:** Format options passed as prop object, developer creates formatter inline.
**How to avoid:** Memoize the Intl.NumberFormat instance with useMemo keyed on the format options. Or cache at module scope if options are static.
**Warning signs:** GC pressure from formatter objects, sluggish stats updates.

### Pitfall 5: EntityInspector Floating Drag on Touch Devices
**What goes wrong:** Drag interferes with page scroll on touch devices.
**Why it happens:** Pointer events don't automatically prevent scrolling.
**How to avoid:** Call `e.preventDefault()` in onPointerDown for the drag handle. Use touch-action: none CSS on the drag handle element.
**Warning signs:** Panel scrolls page instead of dragging on mobile/tablet.

## Code Examples

### Recharts 3.8 MiniChart Sparkline
```typescript
// Recharts 3 API -- AreaChart with minimal chrome for sparkline use
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';

<ResponsiveContainer width="100%" height={80}>
  <AreaChart data={displayData} margin={{ top: 2, right: 0, left: 0, bottom: 2 }}>
    <YAxis hide domain={['auto', 'auto']} />
    <Area
      type="monotone"
      dataKey="value"
      stroke="var(--sim-accent, #6366f1)"
      fill="var(--sim-accent, #6366f1)"
      fillOpacity={0.15}
      strokeWidth={1.5}
      isAnimationActive={false}  // Critical: disable animation for live data
      dot={false}
    />
  </AreaChart>
</ResponsiveContainer>
```

### StatsPanel Inline SVG Sparkline (60x20px)
```typescript
// Hand-drawn SVG polyline -- simpler than Recharts for tiny inline sparklines
function InlineSparkline({ data, width = 60, height = 20 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((v, i) =>
    `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * height}`
  ).join(' ');

  return (
    <svg width={width} height={height} style={{ display: 'inline-block', verticalAlign: 'middle' }}>
      <polyline points={points} fill="none" stroke="var(--sim-accent, #6366f1)" strokeWidth="1.5" />
    </svg>
  );
}
```

### Severity Color Mapping via CSS Custom Properties
```typescript
// Extends existing --sim-* theming system
const SEVERITY_COLORS: Record<string, string> = {
  info: 'var(--sim-info, #60a5fa)',
  warning: 'var(--sim-warning, #fbbf24)',
  critical: 'var(--sim-critical, #f87171)',
};
```

### HeatmapOverlay Canvas Rendering
```typescript
// Reuses getRampLUT from color-ramps.ts for pixel-level color mapping
import { getRampLUT } from '../rendering/color-ramps';

function renderHeatmap(
  ctx: CanvasRenderingContext2D,
  data: Float64Array,
  gridW: number, gridH: number,
  canvasW: number, canvasH: number,
  rampName: string, opacity: number
) {
  const lut = getRampLUT(rampName);
  const imageData = ctx.createImageData(canvasW, canvasH);
  const pixels = imageData.data;

  for (let py = 0; py < canvasH; py++) {
    for (let px = 0; px < canvasW; px++) {
      // Map canvas pixel to data grid coordinate
      const gx = (px / canvasW) * (gridW - 1);
      const gy = (py / canvasH) * (gridH - 1);
      const value = bilinearSample(data, gridW, gridH, gx, gy);
      const t = Math.max(0, Math.min(1, value));
      const lutIdx = Math.round(t * 255) * 4;
      const pIdx = (py * canvasW + px) * 4;
      pixels[pIdx] = lut[lutIdx]!;
      pixels[pIdx + 1] = lut[lutIdx + 1]!;
      pixels[pIdx + 2] = lut[lutIdx + 2]!;
      pixels[pIdx + 3] = Math.round(opacity * 255);
    }
  }
  ctx.putImageData(imageData, 0, 0);
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Recharts 2.x with animation | Recharts 3.8 with `isAnimationActive={false}` for live data | Recharts 3.0 (2024) | accessibilityLayer true by default, react-smooth removed |
| react-window for virtualization | Manual windowed rendering | Project decision | Zero additional dependencies, simpler for fixed-height rows |
| D3 heatmap rendering | Raw Canvas2D with ImageData | Project decision | No D3 DOM, consistent with canvas-first rendering approach |

**Deprecated/outdated:**
- Recharts 2.x `activeIndex` prop: removed in 3.0, use hooks instead
- Recharts `blendStroke` prop: removed in 3.0, use `stroke="none"` instead
- Recharts `animateNewValues` prop: removed in 3.0

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 + @testing-library/react 16.3.2 |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run tests/data/` |
| Full suite command | `npx vitest run` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DATA-01 | StatsPanel renders formatted values, sparklines, change indicators | unit | `npx vitest run tests/data/StatsPanel.test.tsx -t "DATA-01"` | Wave 0 |
| DATA-02 | MiniChart renders Recharts area chart, respects data window, last-value overlay | unit | `npx vitest run tests/data/MiniChart.test.tsx -t "DATA-02"` | Wave 0 |
| DATA-03 | EventLog renders events, filters by severity, color-codes, click-to-seek | unit | `npx vitest run tests/data/EventLog.test.tsx -t "DATA-03"` | Wave 0 |
| DATA-04 | EventLog virtualizes long lists (only renders visible rows) | unit | `npx vitest run tests/data/EventLog.test.tsx -t "DATA-04"` | Wave 0 |
| DATA-05 | HeatmapOverlay renders canvas heatmap, color ramp, opacity, legend | unit | `npx vitest run tests/data/HeatmapOverlay.test.tsx -t "DATA-05"` | Wave 0 |
| DATA-06 | EntityInspector shows properties, inline charts, track toggle, positioning | unit | `npx vitest run tests/data/EntityInspector.test.tsx -t "DATA-06"` | Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/data/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] `tests/data/StatsPanel.test.tsx` -- covers DATA-01
- [ ] `tests/data/MiniChart.test.tsx` -- covers DATA-02
- [ ] `tests/data/EventLog.test.tsx` -- covers DATA-03, DATA-04
- [ ] `tests/data/HeatmapOverlay.test.tsx` -- covers DATA-05
- [ ] `tests/data/EntityInspector.test.tsx` -- covers DATA-06

Note: Recharts components in jsdom need mock/stub for ResponsiveContainer (no layout engine). Use `width={200} height={80}` directly on AreaChart in tests instead of ResponsiveContainer wrapper. ResizeObserver stub already established in test setup pattern (see ParameterPanel.test.tsx beforeAll block).

## Open Questions

1. **HeatmapOverlay performance at high resolution**
   - What we know: putImageData is synchronous and scales with pixel count. For a 500x500 canvas, that's 250k pixel operations per frame.
   - What's unclear: Whether per-frame full-canvas redraw is fast enough at high resolutions without OffscreenCanvas.
   - Recommendation: Start with synchronous putImageData. Add a dirty flag to skip redraw when data hasn't changed. OffscreenCanvas is explicitly v2 (ADV-04).

2. **EventLog maximum event count**
   - What we know: Store keeps last 1000 events (slice(-999) in logEvent). Virtualization handles display.
   - What's unclear: Whether 1000 events with virtualization is sufficient for all demo scenarios.
   - Recommendation: 1000 is fine for v1. The ring buffer pattern in logEvent already caps memory.

## Sources

### Primary (HIGH confidence)
- Project codebase: src/core/store.ts, src/core/useSimulation.ts, src/rendering/*.tsx -- established patterns
- package.json: recharts 3.8.0 confirmed installed
- Recharts 3.0 migration guide (https://github.com/recharts/recharts/wiki/3.0-migration-guide) -- API changes verified

### Secondary (MEDIUM confidence)
- Recharts API docs (https://recharts.github.io/en-US/api/) -- AreaChart/ResponsiveContainer props
- MDN Web Docs: Intl.NumberFormat, Canvas2D ImageData, PointerEvents -- browser API references

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all dependencies already installed, no new packages needed
- Architecture: HIGH -- all patterns directly derived from existing codebase (Phases 1-4)
- Pitfalls: HIGH -- based on known React rendering performance patterns and project-specific decisions

**Research date:** 2026-03-19
**Valid until:** 2026-04-19 (stable -- no moving targets, all deps locked)
