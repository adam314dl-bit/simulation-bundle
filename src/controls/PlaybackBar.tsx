import React from 'react';
import { usePlayback } from '../core/useSimulation';
import { SPEED_PRESETS } from '../types/index';
import type { SpeedPreset } from '../types/index';

export interface PlaybackBarProps {
  className?: string;
}

function cycleSpeed(current: SpeedPreset, backward: boolean): SpeedPreset {
  const idx = SPEED_PRESETS.indexOf(current);
  const next = backward
    ? (idx - 1 + SPEED_PRESETS.length) % SPEED_PRESETS.length
    : (idx + 1) % SPEED_PRESETS.length;
  return SPEED_PRESETS[next]!;
}

export function PlaybackBar({
  className,
}: PlaybackBarProps): React.ReactElement {
  const { running, tick, speed, toggle, setSpeed } = usePlayback();

  return (
    <div
      data-testid="playback-bar"
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        maxHeight: '40px',
        height: '40px',
        padding: '0 12px',
        gap: '12px',
        background: 'var(--sim-surface)',
        borderRadius: 'var(--sim-radius-md)',
        border: '1px solid var(--sim-border)',
        fontFamily: 'var(--sim-font-family)',
        color: 'var(--sim-text)',
      }}
    >
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
        }}
      >
        {speed}x
      </button>

      <span
        style={{
          color: 'var(--sim-text-muted)',
          fontSize: '12px',
          fontFamily: 'var(--sim-font-mono)',
          marginLeft: 'auto',
        }}
      >
        {tick}
      </span>
    </div>
  );
}
