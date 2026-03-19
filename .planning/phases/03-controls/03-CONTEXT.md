# Phase 3: Controls - Context

**Gathered:** 2026-03-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Four interactive control components for simulation playback and parameter adjustment: ParameterPanel (auto-generated controls from ParameterSchema), TimelineControl (scrubber with keyframes and keyboard shortcuts), PlaybackBar (minimal 40px playback bar), and PresetSelector (parameter configuration switching with dropdown/cards/pills variants). All components consume the existing SimStore actions (play/pause/step/stepBack/setSpeed/setParameter/resetParameters/seekToTick) via useSimulation hook.

</domain>

<decisions>
## Implementation Decisions

### Parameter panel controls & styling
- Thin 4px track with --sim-accent colored thumb for range sliders
- Numeric value displayed inline to the right of each slider
- Toggle controls: pill-shaped ON/OFF switch with --sim-accent fill when active
- Select controls: custom dropdown styled with --sim-surface background and --sim-border
- Color controls: small swatch + native HTML5 color input (no custom picker)
- Vec2 controls: two horizontal sliders stacked, labeled X/Y
- Width-based auto column switching: single column below 320px, 2 columns above. Buyers can override via columns={1|2} prop
- Compact mode: reduced vertical spacing (8px vs 16px gap), labels inline with controls instead of stacked above, forced single column
- Collapsible groups: chevron toggle (▸/▾), all groups start expanded, smooth height transition on collapse/expand
- Reset All: ghost/text button at bottom-right of panel, resets all params to ParameterSchema defaults, no confirmation dialog

### Timeline scrubber design
- Filled progress bar style: current tick position shown as --sim-accent filled portion, dimmed track for future/unvisited region
- Draggable thumb for seeking, click-to-seek on track
- Transport controls on the left: step-back, play/pause, step-forward buttons
- Tick counter (420/1000 format) right-aligned at top
- FPS counter in --sim-text-muted below tick counter, always visible
- Speed badge: clickable, cycles through SPEED_PRESETS on click, Shift+click cycles backward
- Keyframe markers: small 4px colored dots below the scrubber track, colored by event severity (info/warning/critical using --sim-accent/--sim-warning/--sim-danger). Tooltip on hover shows event message. Click seeks to that tick

### Keyboard shortcuts
- Global when TimelineControl is mounted — shortcuts fire regardless of focus
- Space: play/pause toggle
- Left/Right arrows: step back/forward
- Shift+Left/Right: ±10 ticks
- preventDefault on matched keys, but check activeElement tag first — skip capture when user is in an input/textarea/select
- Buyers can disable via enableShortcuts={false} prop
- PlaybackBar has NO keyboard shortcuts — only TimelineControl owns them to avoid duplicate listeners

### PlaybackBar (minimal bar)
- Fixed 40px height
- Play/pause button (icon toggle), speed badge (same click-to-cycle behavior as TimelineControl), tick counter
- No scrubber, no step buttons, no keyframe markers, no keyboard shortcuts
- Designed for embedding in tight spaces where TimelineControl would be too large

### Preset selector UX
- Default layout: pills (horizontal row of pill buttons)
- Active preset highlighted with --sim-accent fill, inactive with --sim-surface background
- Pills wrap to second row if needed
- Three layout variants via variant prop: "pills" (default), "dropdown", "cards"
- Preset API: array of {name: string, config: Record<string, ParameterValue>} objects — config keys match ParameterSchema keys
- Switching presets: instant parameter swap via setParameter calls, no UI animation
- Buyers can add optional description field for cards variant

### Claude's Discretion
- Exact slider thumb size, border radius, and shadow styling
- Internal focus ring styling for accessibility
- FPS calculation method (rolling average window size)
- Keyframe marker clustering for dense event regions
- Touch interaction details for mobile scrubber dragging
- Dropdown and cards variant styling details for PresetSelector
- Vec2 control exact layout and label placement

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project specs
- `.planning/PROJECT.md` — Product vision, tech stack (React + TypeScript + Tailwind + Zustand), theming approach
- `.planning/REQUIREMENTS.md` — CTRL-01 through CTRL-06 are Phase 3 scope
- `.planning/ROADMAP.md` — Phase 3 goal, success criteria (4 criteria covering ParameterPanel, TimelineControl, PlaybackBar, PresetSelector)

### Phase 1 foundation
- `.planning/phases/01-infrastructure-core-engine/01-CONTEXT.md` — Theme tokens (deep space dark, --sim-* vars, indigo accent), package structure (src/controls/), tick loop defaults (60 tps, auto-pause on blur)
- `src/types/index.ts` — ParameterSchema, ParameterDef (discriminated union with range/toggle/select/color/vec2/group), ParameterValue, SpeedPreset, SPEED_PRESETS, SimEvent, PlaybackState
- `src/core/store.ts` — SimStore shape and all playback actions (play, pause, step, stepBack, setSpeed, setParameter, resetParameters, seekToTick)
- `src/core/useSimulation.ts` — useSimulation hook, useIsRunning, useTick, useSpeed, usePlaybackControls convenience selectors

### Phase 2 patterns
- `.planning/phases/02-canvas-rendering/02-CONTEXT.md` — Established patterns: useShallow for selectors, Zustand vanilla API outside React, PointerEvents for unified input

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `useSimulation` hook: All controls will consume simulation state and actions through this hook
- `usePlaybackControls`: Convenience selector returning {tick, running, speed, historySize, play, pause, step, stepBack, setSpeed} — direct fit for TimelineControl and PlaybackBar
- `useIsRunning`, `useTick`, `useSpeed`: Fine-grained selectors for minimal re-renders
- `SPEED_PRESETS` constant: Runtime array [0.25, 0.5, 1, 2, 4, 8, 16] — ready for speed badge cycling
- `ParameterSchema` / `ParameterDef` types: Discriminated union already defines all control types with defaults, labels, min/max — ParameterPanel auto-generation maps directly to these

### Established Patterns
- `useShallow` for selector equality — ParameterPanel reading parameters object must use this to avoid infinite re-renders
- Zustand vanilla API (getState/setState) — consider for FPS counter updates to avoid React re-render overhead at measurement frequency
- Tailwind for layout, CSS custom properties for colors/theming — all controls follow this pattern
- TypeScript strict mode with exactOptionalPropertyTypes — new prop interfaces must comply

### Integration Points
- `src/controls/index.ts`: Empty barrel file — will export ParameterPanel, TimelineControl, PlaybackBar, PresetSelector
- SimulationProvider must be ancestor — all controls throw if useSimulation context missing
- ParameterSchema passed to SimulationProvider via SimConfig.parameters — ParameterPanel reads this same schema
- SimStore.events array provides data for TimelineControl keyframe markers

</code_context>

<specifics>
## Specific Ideas

- Controls should match the Linear/Raycast premium dev-tool aesthetic established in Phase 1
- Thin accent-colored slider tracks feel precise and scientific — appropriate for a simulation kit
- Global keyboard shortcuts (Space for play/pause) make the simulation feel responsive and app-like, not widget-like
- PlaybackBar exists specifically for tight embeddings — it's the "mini player" while TimelineControl is the "full player"

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-controls*
*Context gathered: 2026-03-19*
