# Phase 4: Advanced Rendering - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

WebGL2 ParticleRenderer for visualizing up to 100k particles at 60fps with trail effects, and D3-force ForceGraph with React-managed SVG rendering for interactive node/link graphs. Includes Canvas2D fallback for ParticleRenderer when WebGL2 is unavailable, and optional Canvas2D mode for ForceGraph with >500 nodes. Also includes WebGL helper utilities (UTIL-03).

</domain>

<decisions>
## Implementation Decisions

### Particle visual style
- Soft circle particles via GL_POINTS with fragment shader discard for circular shape + gaussian edge falloff
- Looks like glowing orbs against the #0a0a0f dark background — ideal for Galaxy spiral hero visual
- Default point size: 4px, configurable range 1-32px, clamped to GPU max at init
- Color mapping: velocity-based by default — particle speed normalized to [0,1] maps through selected color ramp. Buyer can override with custom colorMap function returning 0-1
- Props: colorRamp="viridis", colorMap="velocity" | (particle) => number, pointSize={4}

### Trail rendering
- Full-canvas alpha fade technique: each frame draws semi-transparent dark rect over entire canvas before drawing particles
- Trail length controlled by trailAlpha prop (0.02-0.15 range, default 0.05 for long dreamy trails)
- Two blending modes: "additive" (bright overlapping trails, ideal for galaxy) and "normal" (solid color trails, ideal for flocking)
- Props: trails={true}, trailAlpha={0.05}, blendMode="additive" | "normal"

### WebGL2 fallback strategy
- Silent auto-detection: try canvas.getContext('webgl2') at mount, fall back to Canvas2D with console.warn
- No UI notification — buyer can detect via onFallback?: (reason: string) => void callback
- Same API in both modes, reduced fidelity in Canvas2D: hard circles (no soft edge), practical max ~10k particles at 30fps
- Trails and both blending modes work in Canvas2D (globalCompositeOperation)
- Renderer prop: renderer="auto" (default) | "webgl2" | "canvas2d" — forcing 'webgl2' when unavailable triggers fallback + onFallback callback

### ForceGraph node appearance
- Filled circles with configurable radius (default 8px), optional text label below node
- Fill color from category10 ramp by group, or custom nodeColor function
- Subtle 1.5px --sim-border stroke outline
- Labels in --sim-text-muted, optional via nodeLabel prop, configurable font size
- Props: nodeRadius={8} | (node) => number, nodeColor=(node) => string, nodeLabel=(node) => string, labelSize={10}

### ForceGraph link styling
- Thin 1px straight lines, --sim-border color at 40% opacity
- Configurable width, color, opacity, and curvature (0=straight, >0=curved)
- Props: linkWidth={1} | (link) => number, linkColor, linkOpacity={0.4}, linkCurvature={0}

### ForceGraph large graph mode
- Auto-switch from SVG to Canvas2D when node count exceeds canvasThreshold (default 500, configurable)
- Same visual appearance in Canvas2D, but labels are hover-only (not always visible)
- Drag, hover, and click work in Canvas2D via hit-testing
- Practical performance: SVG ~500 nodes, Canvas2D ~5000 nodes

### ForceGraph interaction model
- Node drag: fix position (fx/fy) while dragging, unfix on release (node drifts back to natural position). Shift+release to pin permanently. Click pinned node to unpin
- Drag reheats simulation alpha to 0.3, cursor shows 'grabbing'
- Hover: highlight node (1.2x scale, brighter fill) + connected neighbors at full opacity, dim everything else to 0.2 opacity. Connected links go full opacity + thicker
- Tooltip on hover with node label + custom data via tooltipContent prop
- Click: fire onNodeClick callback — no built-in selection state, buyer controls what happens
- Props: onNodeHover?, onNodeClick?, tooltipContent?: (node) => ReactNode

### ForceGraph auto-pause
- Silent stop when alpha < 0.001 (alphaMin), no visual indicator
- Reheat triggers: node drag (alpha=0.3), new data (alpha=0.3), force parameter change (alpha=0.3), buyer's reheat() call (alpha=1.0)
- Props: alphaDecay={0.0228}, alphaMin={0.001}, onStabilize?: () => void

### Claude's Discretion
- WebGL shader compilation and buffer management details (UTIL-03)
- Exact gaussian falloff formula for soft circles
- D3-force tick scheduling (requestAnimationFrame vs setTimeout)
- SVG-to-Canvas2D switch animation/transition
- Tooltip positioning logic and overflow handling
- WebGL context loss recovery strategy
- Interleaved Float32Array layout for particle data
- ForceGraph zoom/pan implementation (if needed beyond node interaction)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project specs
- `.planning/PROJECT.md` — Product vision, tech stack (React + TypeScript + Tailwind + Zustand), performance targets (100k particles at 60fps)
- `.planning/REQUIREMENTS.md` — REND-05 through REND-10, UTIL-03 are Phase 4 scope
- `.planning/ROADMAP.md` — Phase 4 goal and 4 success criteria

### Phase 1 foundation
- `.planning/phases/01-infrastructure-core-engine/01-CONTEXT.md` — Theme tokens (deep space dark, --sim-* vars, indigo accent), package structure (src/rendering/), tick loop defaults
- `src/types/index.ts` — SimConfig, TickFn, ParameterValue, SimEvent types that renderers consume
- `src/core/store.ts` — SimStore shape that renderers read via useSimulation

### Phase 2 rendering foundation
- `.planning/phases/02-canvas-rendering/02-CONTEXT.md` — Canvas interaction patterns, color ramp API, viewport architecture, rendering patterns
- `src/rendering/color-ramps.ts` — Existing color ramp API: colorRamps.viridis(t), getRampLUT('viridis') for raw Uint8Array — ParticleRenderer uses getRampLUT for WebGL texture
- `src/rendering/viewport.ts` — Viewport class with pan/zoom/momentum — reference for coordinate transforms
- `src/rendering/SimCanvas.tsx` — Canvas component pattern: rAF loop, DPR handling, PointerEvents — ParticleRenderer follows similar structure but with WebGL context

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `colorRamps` + `getRampLUT()`: Color ramp functions and raw Uint8Array LUTs — ParticleRenderer uploads LUT as WebGL texture for GPU-side color mapping
- `createColorRamp()`: Custom ramp creation — buyers can create custom particle color schemes
- `Viewport` class: Pan/zoom/momentum math — reference pattern, though ParticleRenderer manages its own WebGL transforms
- `useSimulation` hook + convenience selectors: Standard state access for both components
- `SimCanvas` component: Reference architecture for canvas components (rAF loop, DPR, pointer events)

### Established Patterns
- PointerEvents for unified mouse/touch/pen — single code path (Phase 2)
- Zustand vanilla API outside React render cycle for performance (Phase 1/2)
- useShallow for selector equality — prevents infinite re-renders (Phase 1)
- Tailwind for layout, CSS custom properties for colors/theming (Phase 1)
- TypeScript strict mode with exactOptionalPropertyTypes (Phase 1)
- Inline styles + CSS custom properties for component styling, no separate CSS files (Phase 3)

### Integration Points
- `src/rendering/index.ts`: Barrel file — will add ParticleRenderer and ForceGraph exports
- ParticleRenderer consumed by Particles demo (Phase 6) with click-to-place attractors
- ForceGraph consumed by Social Network demo (Phase 6) with EntityInspector integration (Phase 5)
- Both components need SimulationProvider as ancestor for state access

</code_context>

<specifics>
## Specific Ideas

- Galaxy spiral preset with additive blending trails is the marketing hero visual — it needs to look striking against the dark background
- Soft circle particles with gaussian falloff create a glowing orb effect that sells the premium aesthetic
- ForceGraph neighbor highlighting on hover is a key UX touch — it makes the social network demo feel interactive and explorable
- The velocity-based color mapping makes particle physics intuitive: fast particles glow hot, slow ones cool

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-advanced-rendering*
*Context gathered: 2026-03-19*
