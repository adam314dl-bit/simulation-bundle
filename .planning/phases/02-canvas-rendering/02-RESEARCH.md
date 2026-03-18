# Phase 2: Canvas Rendering - Research

**Researched:** 2026-03-18
**Domain:** Canvas 2D rendering, color mapping, coordinate transforms, layer compositing
**Confidence:** HIGH

## Summary

Phase 2 delivers the 2D canvas rendering foundation for sim-kit: a pan/zoom-capable SimCanvas component, a GridRenderer optimized for 500x500 grids at 30fps via dirty-rect updates, a LayerStack for compositing with SVG annotation overlays, and 6 built-in perceptually uniform color ramps. All components are pure Canvas 2D (no WebGL) and must integrate with the Phase 1 Zustand store and theme system.

The core performance challenge is rendering 250,000 cells at 30fps. The approach is a two-tier strategy: (1) use ImageData with a pre-built Uint8Array color LUT for bulk rendering of the full grid on initial paint, and (2) use dirty-rect tracking with fillRect for incremental updates of only changed cells. This avoids the overhead of 250K individual fillRect calls on full repaints while keeping incremental updates cheap. DevicePixelRatio handling, cursor-centered zoom with lerp momentum, and SVG-based selection overlays are well-established patterns that need careful but straightforward implementation.

**Primary recommendation:** Build SimCanvas as a self-contained React component managing its own canvas element and animation loop via requestAnimationFrame, passing Viewport objects to child renderers via onDraw callback. Use ImageData + putImageData for full grid repaints and fillRect for dirty-rect incremental updates. Implement color ramps as statically-defined 256-entry Uint8Array LUTs with no runtime dependencies.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Smooth pan/zoom with lerp-based momentum/inertia on release
- Zoom centered on cursor position, range 0.1x to 20x
- Touch support: pinch-zoom + two-finger pan
- Viewport exposure via onDraw callback (canvas context + viewport)
- Cells as filled rectangles with optional border (configurable borderWidth, default 0)
- Borders drawn on top of fills, not as gaps
- Hover highlight: semi-transparent white overlay (0.3 alpha)
- Selection highlight: solid 2px accent-colored border (--sim-accent)
- Cell size configurable via cellSize prop (default 8px, minimum 2px)
- Color mapping: continuous via 256-entry LUT, discrete via category10 with modulo
- Z-ordering: array order, bottom-to-top, absolute positioning
- SVG annotation overlay always topmost layer
- Rect selection: click-drag dashed rectangle, --sim-accent, 50% fill opacity
- Lasso selection: click-drag freeform path, closes on mouse-up
- Selection fires onSelect with world-coordinate bounds/vertices
- Pure function color ramp API: colorRamps.viridis(normalizedValue) returns CSS string
- Internal 256-entry Uint8Array (RGBA) LUT per ramp, cached on first call
- Performance path: getRampLUT('viridis') returns raw Uint8Array
- Custom ramps via createColorRamp(name, stops)
- Built-in 6: viridis, inferno, plasma, coolwarm, terrain, category10
- Exported from sim-kit/rendering

### Claude's Discretion
- Exact lerp damping constants for pan/zoom momentum
- Canvas devicePixelRatio scaling implementation details
- Dirty-rect optimization algorithm specifics
- Internal LUT interpolation method (linear RGB vs perceptual)
- SVG overlay DOM structure and event handling details
- Touch gesture threshold/dead-zone tuning

### Deferred Ideas (OUT OF SCOPE)
None
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| REND-01 | SimCanvas with mouse wheel zoom (cursor-centered), click-drag pan, touch pinch-zoom, devicePixelRatio | Canvas DPR pattern, affine transform math, wheel/pointer event handling |
| REND-02 | SimCanvas exposes Viewport with screenToWorld/worldToScreen via onDraw callback | Affine matrix inversion for coordinate transforms |
| REND-03 | GridRenderer renders 2D grid with configurable cell size, borders, highlighting, click/hover | fillRect-based cell rendering, event-to-grid coordinate mapping |
| REND-04 | GridRenderer achieves 500x500 at 30fps via dirty-rect optimization | ImageData for full repaint, fillRect for dirty rects, Set-based change tracking |
| REND-11 | LayerStack composites layers with z-ordering + SVG annotation overlay (rect, lasso) | Absolute positioned div container, SVG pointer events, path building |
| UTIL-01 | Six built-in color ramps as 256-entry LUTs returning CSS color strings | Static Uint8Array data, linear interpolation for custom ramps |
</phase_requirements>

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| React | ^19.0.0 | Component framework | Project peer dependency, already established |
| Canvas 2D API | Browser native | Grid/cell rendering | No dependencies needed; fillRect + ImageData cover all needs |
| SVG (inline) | Browser native | Selection overlays | Lightweight, CSS-styleable, perfect for annotation shapes |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| zustand | ^5.0.12 | Store access for entities | Already in deps; useSimulation reads grid data |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Hand-rolled color ramps | scale-color-perceptual (1.1.2) | External dep adds 256-entry data we can embed ourselves; no runtime benefit for 6 static ramps |
| Hand-rolled pan/zoom | react-zoom-pan-pinch (3.7.0) | Adds dependency for DOM transforms; we need canvas-native transforms with ctx.setTransform() |
| Canvas 2D fillRect | OffscreenCanvas + Worker | Overkill for 500x500; save for ADV-04 (v2) |

**No new dependencies needed.** Phase 2 uses only browser-native Canvas 2D and SVG APIs plus existing project deps. Color ramp data will be statically embedded.

## Architecture Patterns

### Recommended Project Structure
```
src/rendering/
  SimCanvas.tsx           # Canvas element + pan/zoom + viewport + rAF loop
  GridRenderer.tsx        # Grid cell rendering with dirty-rect optimization
  LayerStack.tsx          # Compositing container + SVG annotation overlay
  color-ramps.ts          # 256-entry LUT data + pure function API
  color-ramp-data.ts      # Static RGBA arrays for viridis/inferno/plasma/coolwarm/terrain/category10
  viewport.ts             # Viewport class: transform matrix, screenToWorld, worldToScreen
  types.ts                # Rendering-specific types (Viewport, GridConfig, LayerProps, etc.)
  index.ts                # Barrel exports
```

### Pattern 1: Canvas Animation Loop via useRef + rAF
**What:** SimCanvas owns a `<canvas>` element via ref, runs its own requestAnimationFrame loop decoupled from React renders. On each frame, it computes the viewport transform and calls `onDraw(ctx, viewport)` so child renderers can paint.
**When to use:** Any canvas component that needs smooth animation independent of React render cycle.
**Example:**
```typescript
// SimCanvas.tsx — simplified animation loop
const canvasRef = useRef<HTMLCanvasElement>(null);
const viewportRef = useRef<Viewport>(new Viewport());
const rafRef = useRef<number>(0);

useEffect(() => {
  const canvas = canvasRef.current!;
  const ctx = canvas.getContext('2d', { alpha: false })!;

  const loop = () => {
    const vp = viewportRef.current;
    vp.applyMomentum(); // lerp damping each frame
    ctx.save();
    ctx.setTransform(vp.dpr * vp.scale, 0, 0, vp.dpr * vp.scale, vp.dpr * vp.tx, vp.dpr * vp.ty);
    onDraw(ctx, vp);
    ctx.restore();
    rafRef.current = requestAnimationFrame(loop);
  };
  rafRef.current = requestAnimationFrame(loop);
  return () => cancelAnimationFrame(rafRef.current);
}, [onDraw]);
```

### Pattern 2: DevicePixelRatio Scaling
**What:** Scale canvas internal resolution to match display DPI while keeping CSS size unchanged. This prevents blurry rendering on Retina/HiDPI displays.
**When to use:** Every canvas element.
**Example:**
```typescript
// Source: web.dev/articles/canvas-hidipi (verified pattern)
function setupHiDPI(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext('2d', { alpha: false })!;
  ctx.scale(dpr, dpr);
  return ctx;
}
```

### Pattern 3: Viewport with Affine Transform
**What:** A Viewport class that maintains scale + translation as a 2D affine transform, providing screenToWorld/worldToScreen conversions.
**When to use:** SimCanvas coordinate mapping, GridRenderer hit testing.
**Example:**
```typescript
class Viewport {
  scale = 1;
  tx = 0;  // translation x in screen pixels
  ty = 0;  // translation y in screen pixels
  dpr = window.devicePixelRatio || 1;

  screenToWorld(sx: number, sy: number): [number, number] {
    return [(sx - this.tx) / this.scale, (sy - this.ty) / this.scale];
  }

  worldToScreen(wx: number, wy: number): [number, number] {
    return [wx * this.scale + this.tx, wy * this.scale + this.ty];
  }

  zoomAt(cx: number, cy: number, delta: number) {
    const factor = delta > 0 ? 1.1 : 1 / 1.1;
    const newScale = Math.max(0.1, Math.min(20, this.scale * factor));
    const ratio = newScale / this.scale;
    this.tx = cx - ratio * (cx - this.tx);
    this.ty = cy - ratio * (cy - this.ty);
    this.scale = newScale;
  }
}
```

### Pattern 4: Dirty-Rect Grid Update with Change Tracking
**What:** Track which cells changed since last frame using a Set of flat indices. On each frame, only repaint changed cells via fillRect. On first paint or zoom change, do full repaint via ImageData.
**When to use:** GridRenderer with large grids where most cells are static per frame.
**Example:**
```typescript
// GridRenderer — dirty rect strategy
const prevDataRef = useRef<ArrayLike<number> | null>(null);
const dirtySet = useRef<Set<number>>(new Set());

function findDirtyIndices(prev: ArrayLike<number>, next: ArrayLike<number>): Set<number> {
  const dirty = new Set<number>();
  for (let i = 0; i < next.length; i++) {
    if (prev[i] !== next[i]) dirty.add(i);
  }
  return dirty;
}

// In render callback:
if (needsFullRepaint || !prevDataRef.current) {
  // Full repaint via ImageData for maximum throughput
  renderFullGrid(ctx, data, width, height, cellSize, lutRGBA);
} else {
  // Incremental: only repaint dirty cells via fillRect
  const dirty = findDirtyIndices(prevDataRef.current, data);
  for (const idx of dirty) {
    const col = idx % gridWidth;
    const row = Math.floor(idx / gridWidth);
    ctx.fillStyle = lookupColor(data[idx]!, lut);
    ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
  }
}
prevDataRef.current = data;
```

### Pattern 5: Static Color Ramp LUT
**What:** Embed 256-entry RGBA data as static Uint8Array for each ramp. Provide both CSS string API (for general use) and raw LUT API (for ImageData manipulation in GridRenderer).
**When to use:** All color mapping in the rendering layer.
**Example:**
```typescript
// color-ramps.ts
const viridisData = new Uint8Array([/* 256 * 4 = 1024 values */]);

export const colorRamps = {
  viridis: (t: number): string => {
    const i = Math.max(0, Math.min(255, Math.round(t * 255))) * 4;
    return `rgb(${viridisData[i]},${viridisData[i+1]},${viridisData[i+2]})`;
  },
  // ... inferno, plasma, coolwarm, terrain, category10
};

export function getRampLUT(name: string): Uint8Array {
  return rampRegistry[name]!; // Returns raw Uint8Array for ImageData path
}
```

### Anti-Patterns to Avoid
- **fillRect per cell on full repaint:** 250K fillRect calls is far slower than a single ImageData putImageData. Use ImageData for full repaints.
- **React state for pan/zoom transform:** Triggers re-render on every mouse move. Keep transform in a ref/mutable object, only call ctx.setTransform in the rAF loop.
- **Reading canvas context properties:** ctx.fillStyle getter is expensive. Cache the last-set value in a local variable instead.
- **Floating-point coordinates for grid cells:** Canvas anti-aliases at sub-pixel boundaries. Use `Math.round()` or `| 0` for pixel-aligned cell coordinates.
- **SVG overlay re-render on every mouse move during selection:** Use imperative DOM updates (setAttribute) during drag, only setState on mouse-up.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Perceptually uniform color data | Compute viridis/inferno/plasma from math | Embed static 256-entry arrays extracted from matplotlib | Color science is subtle; matplotlib's data is peer-reviewed and standard |
| Touch gesture recognition | Custom touch event parsing | Pointer Events API (pointerdown/move/up) | Handles mouse + touch + pen uniformly; isPrimary + pointerId for multi-touch |
| Point-in-polygon (lasso) | Custom winding algorithm | Ray-casting algorithm (10 lines) | Well-known O(n) algorithm, but must handle edge cases correctly |

**Key insight:** The rendering itself is all browser-native APIs (Canvas 2D, SVG, Pointer Events). The only "data" that should be embedded rather than computed is the color ramp tables, which come from scientific sources.

## Common Pitfalls

### Pitfall 1: Canvas Blurriness on HiDPI
**What goes wrong:** Canvas renders at 1x resolution on 2x+ DPI displays, producing blurry output.
**Why it happens:** Canvas logical size (CSS pixels) and physical size (canvas.width/height) are independent. Default canvas.width matches CSS width, which is half the physical pixels on Retina.
**How to avoid:** Always multiply canvas.width/height by devicePixelRatio and scale context by dpr. Re-check on resize.
**Warning signs:** Text or lines look soft/blurry on macOS or mobile devices.

### Pitfall 2: Infinite React Re-renders from Object Selectors
**What goes wrong:** Components using useSimulation with object selectors re-render every frame.
**Why it happens:** `useSimulation(s => ({ entities: s.entities }))` creates a new object reference each call. Even useShallow compares shallowly.
**How to avoid:** Select primitive values or use stable references. For GridRenderer, read entities outside React (store.getState()) in the rAF callback, not via hook.
**Warning signs:** React DevTools shows continuous re-renders on static grids.

### Pitfall 3: putImageData Ignores Canvas Transform
**What goes wrong:** ImageData rendered via putImageData appears at wrong position/scale when viewport is transformed.
**Why it happens:** putImageData always writes to physical canvas coordinates, ignoring ctx.setTransform().
**How to avoid:** Two strategies: (1) render grid to an offscreen canvas at native resolution, then drawImage() the offscreen canvas onto the main canvas (respects transforms), or (2) apply transforms manually when calculating putImageData coordinates.
**Warning signs:** Grid doesn't pan/zoom with viewport, appears fixed in corner.

### Pitfall 4: Wheel Event Passive Listener Default
**What goes wrong:** Calling `e.preventDefault()` in a wheel handler throws a console error and doesn't prevent page scroll.
**Why it happens:** Modern browsers default wheel listeners to `{ passive: true }` on document/window. Canvas wheel handlers need `{ passive: false }` to prevent page scroll while zooming.
**How to avoid:** Use `addEventListener('wheel', handler, { passive: false })` explicitly, not React's onWheel prop (which uses passive listeners).
**Warning signs:** Page scrolls behind the canvas during wheel zoom.

### Pitfall 5: Touch Event Conflicts
**What goes wrong:** Browser performs default pinch-zoom or scroll instead of canvas zoom.
**Why it happens:** Touch events have default browser behavior (scroll, zoom) that fires alongside pointer events.
**How to avoid:** Set `touch-action: none` CSS on the canvas element. This disables browser touch handling and gives full control to pointer events.
**Warning signs:** Double-zoom effect, or canvas zoom plus page zoom simultaneously.

### Pitfall 6: Memory Leak from rAF Loop
**What goes wrong:** Animation continues running after component unmount, causing memory leaks and errors.
**Why it happens:** requestAnimationFrame callback references stale component state/refs.
**How to avoid:** Always cancelAnimationFrame in useEffect cleanup. Use a mounted flag ref for safety.
**Warning signs:** Console errors about state updates on unmounted components.

## Code Examples

### Full Grid Repaint via ImageData (Performance Path)
```typescript
// For 500x500 grid, this is 10-50x faster than 250K fillRect calls
function renderFullGrid(
  ctx: CanvasRenderingContext2D,
  data: ArrayLike<number>,
  gridW: number,
  gridH: number,
  cellSize: number,
  lut: Uint8Array  // 256 * 4 RGBA entries
) {
  const pixelW = gridW * cellSize;
  const pixelH = gridH * cellSize;
  const imageData = ctx.createImageData(pixelW, pixelH);
  const buf = imageData.data;

  for (let row = 0; row < gridH; row++) {
    for (let col = 0; col < gridW; col++) {
      const value = data[row * gridW + col]!;
      const lutIdx = Math.max(0, Math.min(255, Math.round(value * 255))) * 4;
      const r = lut[lutIdx]!;
      const g = lut[lutIdx + 1]!;
      const b = lut[lutIdx + 2]!;

      // Fill cellSize x cellSize block
      for (let py = 0; py < cellSize; py++) {
        const rowStart = ((row * cellSize + py) * pixelW + col * cellSize) * 4;
        for (let px = 0; px < cellSize; px++) {
          const i = rowStart + px * 4;
          buf[i] = r;
          buf[i + 1] = g;
          buf[i + 2] = b;
          buf[i + 3] = 255;
        }
      }
    }
  }
  ctx.putImageData(imageData, 0, 0);
}
```

### Cursor-Centered Zoom with Momentum
```typescript
// Zoom centered on cursor: the point under cursor stays fixed
function handleWheel(e: WheelEvent, viewport: Viewport) {
  e.preventDefault();
  const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
  const cx = e.clientX - rect.left;  // cursor x in CSS pixels
  const cy = e.clientY - rect.top;

  const factor = e.deltaY > 0 ? 1 / 1.08 : 1.08;
  const newScale = Math.max(0.1, Math.min(20, viewport.scale * factor));
  const ratio = newScale / viewport.scale;

  // Keep point under cursor fixed
  viewport.tx = cx - ratio * (cx - viewport.tx);
  viewport.ty = cy - ratio * (cy - viewport.ty);
  viewport.scale = newScale;
}
```

### SVG Rect Selection Overlay
```typescript
// During drag, update SVG rect imperatively for performance
function handleSelectionDrag(svgRect: SVGRectElement, startX: number, startY: number, curX: number, curY: number) {
  const x = Math.min(startX, curX);
  const y = Math.min(startY, curY);
  const w = Math.abs(curX - startX);
  const h = Math.abs(curY - startY);
  svgRect.setAttribute('x', String(x));
  svgRect.setAttribute('y', String(y));
  svgRect.setAttribute('width', String(w));
  svgRect.setAttribute('height', String(h));
}
```

### Lasso Selection with Point-in-Polygon
```typescript
// Ray-casting algorithm for point-in-polygon test
function pointInPolygon(px: number, py: number, polygon: [number, number][]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]!;
    const [xj, yj] = polygon[j]!;
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Mouse events only | Pointer Events API | ~2020 (all browsers) | Unified mouse/touch/pen handling, simpler code |
| canvas.getContext('2d') | getContext('2d', { alpha: false }) | Chrome 32+ | Skips alpha compositing, ~15% faster for opaque canvases |
| Manual DPR detection | window.devicePixelRatio (stable) | Long-standing | Standard across all modern browsers |
| setTimeout-based animation | requestAnimationFrame | Long-standing | Vsync-aligned, auto-pauses on hidden tabs |
| Event-based touch handling | CSS touch-action: none + Pointer Events | ~2022 best practice | Eliminates browser gesture interference |

**Deprecated/outdated:**
- `MouseEvent` for canvas interaction: Use `PointerEvent` instead (unified API)
- Separate touch event listeners: Pointer Events handle both
- `canvas.toDataURL()` for pixel reads: Use `getImageData()` for typed array access

## Open Questions

1. **ImageData + viewport transform interaction**
   - What we know: putImageData ignores canvas transforms (setTransform). For the full-grid ImageData path, we need the grid to move with pan/zoom.
   - What's unclear: Performance tradeoff between offscreen canvas + drawImage vs computing pixel offsets manually.
   - Recommendation: Use an offscreen canvas for the grid layer. Render grid cells to offscreen at 1:1, then drawImage onto main canvas where drawImage respects the current transform. This is the cleanest approach and avoids manual coordinate math in the ImageData loop.

2. **Lerp momentum constants**
   - What we know: Smooth inertia requires a damping factor applied per frame.
   - Recommendation: Start with damping = 0.92 (velocity *= 0.92 per frame). This gives ~50 frames (~830ms at 60fps) of visible deceleration. Expose as an internal constant, easy to tune.

3. **Color ramp data sourcing**
   - What we know: matplotlib's viridis/inferno/plasma are the gold standard. coolwarm is Moreland's diverging. terrain is a custom continuous ramp.
   - Recommendation: Extract 256-entry RGB data from matplotlib source (public domain / CC0), convert to Uint8Array literals. category10 uses 10 distinct colors from D3's categorical palette. This avoids runtime dependencies.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.0 + jsdom |
| Config file | vitest.config.ts |
| Quick run command | `npx vitest run tests/rendering/` |
| Full suite command | `npx vitest run` |

### Phase Requirements to Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REND-01 | SimCanvas renders canvas, handles wheel/pointer events | unit | `npx vitest run tests/rendering/SimCanvas.test.tsx -t "zoom"` | No - Wave 0 |
| REND-02 | Viewport screenToWorld/worldToScreen accuracy | unit | `npx vitest run tests/rendering/viewport.test.ts` | No - Wave 0 |
| REND-03 | GridRenderer renders cells, fires click/hover events | unit | `npx vitest run tests/rendering/GridRenderer.test.tsx` | No - Wave 0 |
| REND-04 | Dirty-rect optimization only repaints changed cells | unit | `npx vitest run tests/rendering/GridRenderer.test.tsx -t "dirty"` | No - Wave 0 |
| REND-11 | LayerStack z-ordering, SVG selection modes | unit | `npx vitest run tests/rendering/LayerStack.test.tsx` | No - Wave 0 |
| UTIL-01 | Color ramps produce correct 256-entry LUT values | unit | `npx vitest run tests/rendering/color-ramps.test.ts` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `npx vitest run tests/rendering/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before /gsd:verify-work

### Wave 0 Gaps
- [ ] `tests/rendering/viewport.test.ts` -- covers REND-02 (coordinate transforms, math purity)
- [ ] `tests/rendering/color-ramps.test.ts` -- covers UTIL-01 (LUT correctness, boundary values)
- [ ] `tests/rendering/SimCanvas.test.tsx` -- covers REND-01 (canvas mount, event wiring)
- [ ] `tests/rendering/GridRenderer.test.tsx` -- covers REND-03, REND-04 (rendering, dirty-rect)
- [ ] `tests/rendering/LayerStack.test.tsx` -- covers REND-11 (z-ordering, selection)

Note: Canvas 2D operations in jsdom are limited (no actual pixel rendering). Tests should focus on: (1) component mounting and DOM structure, (2) event handler wiring (pointer/wheel), (3) viewport math (pure functions), (4) color ramp output correctness (pure functions), (5) callback invocation patterns. Visual/performance testing requires Storybook stories or browser-based tests.

## Sources

### Primary (HIGH confidence)
- [MDN Canvas Optimization](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas) -- dirty rect, alpha:false, integer coords, rAF
- [web.dev HiDPI Canvas](https://web.dev/articles/canvas-hidipi) -- devicePixelRatio setup pattern
- [MDN putImageData](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/putImageData) -- ImageData dirty rect parameter
- [MDN devicePixelRatio](https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio) -- DPR property reference

### Secondary (MEDIUM confidence)
- [AG Grid Canvas Optimization](https://blog.ag-grid.com/optimising-html5-canvas-rendering-best-practices-and-techniques/) -- real-world grid rendering patterns
- [scale-color-perceptual](https://github.com/politiken-journalism/scale-color-perceptual) -- matplotlib color ramp data in JS (256 entries per ramp)
- [react-lasso-select](https://github.com/akcyp/react-lasso-select) -- lasso selection UX patterns in React

### Tertiary (LOW confidence)
- Lerp momentum damping constant (0.92) -- based on common game dev patterns, needs tuning

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- all browser-native APIs, no external deps needed
- Architecture: HIGH -- Canvas 2D patterns are well-established, project structure follows Phase 1 conventions
- Pitfalls: HIGH -- each pitfall verified against MDN/official docs
- Color ramps: HIGH -- matplotlib data is the de facto standard; embedding static arrays is the correct approach
- Performance (500x500 at 30fps): MEDIUM -- ImageData approach should work but needs validation with actual browser benchmarking; 250K cells * 8px = 4000x4000 pixel ImageData which is within browser limits

**Research date:** 2026-03-18
**Valid until:** 2026-04-18 (stable domain, browser APIs don't change frequently)
