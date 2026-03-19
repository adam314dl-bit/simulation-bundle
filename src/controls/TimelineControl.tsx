import React, { useEffect, useRef, useCallback } from 'react';
import { usePlayback, useEvents } from '../core/useSimulation';
import { SPEED_PRESETS } from '../types/index';
import type { SpeedPreset, SimEvent } from '../types/index';

export interface TimelineControlProps {
  enableShortcuts?: boolean;
  className?: string;
}

function cycleSpeed(current: SpeedPreset, backward: boolean): SpeedPreset {
  const idx = SPEED_PRESETS.indexOf(current);
  const next = backward
    ? (idx - 1 + SPEED_PRESETS.length) % SPEED_PRESETS.length
    : (idx + 1) % SPEED_PRESETS.length;
  return SPEED_PRESETS[next]!;
}

function severityColor(severity: SimEvent['severity']): string {
  switch (severity) {
    case 'info': return 'var(--sim-accent)';
    case 'warning': return 'var(--sim-warning)';
    case 'critical': return 'var(--sim-danger)';
  }
}

export function TimelineControl({
  enableShortcuts = true,
  className,
}: TimelineControlProps): React.ReactElement {
  const {
    running,
    tick,
    speed,
    historySize,
    toggle,
    step,
    stepBack,
    setSpeed,
    seekToTick,
  } = usePlayback();

  const events = useEvents();

  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const fpsRef = useRef<HTMLSpanElement>(null);
  const frameTimesRef = useRef<number[]>([]);

  // FPS counter - throttled DOM update
  useEffect(() => {
    let animId: number;
    const update = () => {
      const now = performance.now();
      const times = frameTimesRef.current;
      times.push(now);
      // Keep last 30 frames
      while (times.length > 30) {
        times.shift();
      }
      if (times.length >= 2) {
        const elapsed = now - times[0]!;
        const fps = elapsed > 0 ? Math.round(((times.length - 1) / elapsed) * 1000) : 0;
        if (fpsRef.current) {
          fpsRef.current.textContent = `FPS: ${fps}`;
        }
      }
      animId = requestAnimationFrame(update);
    };
    animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, []);

  // Keyboard shortcuts
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
          if (e.shiftKey) seekToTick(Math.min(tick + 10, historySize - 1));
          else step();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (e.shiftKey) seekToTick(Math.max(tick - 10, 0));
          else stepBack();
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enableShortcuts, toggle, step, stepBack, seekToTick, tick, historySize]);

  // Scrubber seek logic
  const seekFromPointer = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const track = trackRef.current;
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const targetTick = Math.round(ratio * Math.max(historySize - 1, 0));
      seekToTick(targetTick);
    },
    [historySize, seekToTick]
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      draggingRef.current = true;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      seekFromPointer(e);
    },
    [seekFromPointer]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!draggingRef.current) return;
      seekFromPointer(e);
    },
    [seekFromPointer]
  );

  const onPointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  // Compute scrubber ratio
  const maxTick = Math.max(historySize - 1, 0);
  const ratio = maxTick > 0 ? tick / maxTick : 0;
  const filledPercent = ratio * 100;

  // Cluster keyframe markers by pixel position
  const markerMap = new Map<number, SimEvent>();
  const severityRank = { info: 0, warning: 1, critical: 2 } as const;
  for (const event of events) {
    const pos = maxTick > 0 ? Math.round((event.tick / maxTick) * 1000) : 0;
    const existing = markerMap.get(pos);
    if (!existing || severityRank[event.severity] > severityRank[existing.severity]) {
      markerMap.set(pos, event);
    }
  }

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        padding: '8px 12px',
        background: 'var(--sim-surface)',
        borderRadius: 'var(--sim-radius-md)',
        border: '1px solid var(--sim-border)',
        fontFamily: 'var(--sim-font-family)',
        color: 'var(--sim-text)',
      }}
    >
      {/* Top row: transport buttons, speed badge, tick counter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          aria-label="Step back"
          onClick={stepBack}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--sim-text)',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '4px',
            lineHeight: 1,
          }}
        >
          &#x23EE;
        </button>

        <button
          aria-label={running ? 'Pause' : 'Play'}
          onClick={toggle}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--sim-text)',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '4px',
            lineHeight: 1,
          }}
        >
          {running ? '\u23F8' : '\u25B6'}
        </button>

        <button
          aria-label="Step forward"
          onClick={step}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--sim-text)',
            cursor: 'pointer',
            fontSize: '14px',
            padding: '4px',
            lineHeight: 1,
          }}
        >
          &#x23ED;
        </button>

        <button
          onClick={(e) => setSpeed(cycleSpeed(speed, e.shiftKey))}
          style={{
            background: 'var(--sim-surface-raised)',
            border: '1px solid var(--sim-border)',
            borderRadius: 'var(--sim-radius-sm)',
            color: 'var(--sim-text)',
            padding: '2px 8px',
            fontSize: '12px',
            fontFamily: 'var(--sim-font-mono)',
            cursor: 'pointer',
            marginLeft: '4px',
          }}
        >
          {speed}x
        </button>

        <span
          style={{
            marginLeft: 'auto',
            fontSize: '12px',
            fontFamily: 'var(--sim-font-mono)',
            color: 'var(--sim-text-muted)',
          }}
        >
          {tick}/{historySize}
        </span>
      </div>

      {/* Scrubber track */}
      <div
        data-testid="scrubber-track"
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          position: 'relative',
          height: '6px',
          background: 'var(--sim-border)',
          borderRadius: '3px',
          cursor: 'pointer',
        }}
      >
        {/* Filled portion */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: `${filledPercent}%`,
            height: '100%',
            background: 'var(--sim-accent)',
            borderRadius: '3px',
            pointerEvents: 'none',
          }}
        />
        {/* Thumb */}
        <div
          style={{
            position: 'absolute',
            left: `${filledPercent}%`,
            top: '50%',
            width: '14px',
            height: '14px',
            borderRadius: '50%',
            background: 'var(--sim-accent)',
            border: '2px solid var(--sim-surface)',
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Keyframe markers */}
      <div style={{ position: 'relative', height: '8px' }}>
        {Array.from(markerMap.entries()).map(([pos, event]) => (
          <div
            key={event.id}
            title={event.message}
            onClick={() => seekToTick(event.tick)}
            style={{
              position: 'absolute',
              left: `${pos / 10}%`,
              bottom: 0,
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: severityColor(event.severity),
              cursor: 'pointer',
            }}
          />
        ))}
      </div>

      {/* Bottom row: FPS counter */}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <span
          ref={fpsRef}
          style={{
            color: 'var(--sim-text-muted)',
            fontSize: '11px',
            fontFamily: 'var(--sim-font-mono)',
          }}
        >
          FPS: 0
        </span>
      </div>
    </div>
  );
}
