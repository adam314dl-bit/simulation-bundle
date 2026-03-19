import type { Meta, StoryObj } from '@storybook/react';
import { SimulationProvider, useSimulation } from '../src/core';

/**
 * Smoke test story: verifies SimulationProvider + useSimulation work end-to-end.
 * Click Play -- tick counter should increment at 60 ticks/sec.
 * Click Pause -- counter should stop.
 * Used as the primary Phase 1 INFRA-06 verification.
 */
function TickCounter() {
  const tick = useSimulation((s) => s.tick);
  const running = useSimulation((s) => s.running);
  const play = useSimulation((s) => s.play);
  const pause = useSimulation((s) => s.pause);
  const speed = useSimulation((s) => s.speed);
  const setSpeed = useSimulation((s) => s.setSpeed);

  return (
    <div
      style={{
        color: 'var(--sim-text)',
        fontFamily: 'var(--sim-font-mono)',
        padding: '24px',
        border: '1px solid var(--sim-border)',
        borderRadius: 'var(--sim-radius-md)',
        background: 'var(--sim-surface)',
        maxWidth: 320,
      }}
    >
      <h2 style={{ margin: '0 0 16px', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sim-text-muted)' }}>
        SimulationProvider Smoke Test
      </h2>
      <p style={{ margin: '0 0 8px', fontSize: 32, fontWeight: 700 }}>
        Tick: {tick}
      </p>
      <p style={{ margin: '0 0 16px', fontSize: 12, color: 'var(--sim-text-muted)' }}>
        Status: {running ? '\u25b6 running' : '\u23f8 paused'} \u00b7 {speed}x
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={running ? pause : play}
          style={{
            padding: '6px 16px',
            background: running ? 'transparent' : 'var(--sim-accent)',
            color: running ? 'var(--sim-text)' : '#fff',
            border: `1px solid ${running ? 'var(--sim-border)' : 'var(--sim-accent)'}`,
            borderRadius: 'var(--sim-radius-sm)',
            cursor: 'pointer',
            fontFamily: 'inherit',
            fontSize: 13,
          }}
        >
          {running ? 'Pause' : 'Play'}
        </button>
        <select
          value={speed}
          onChange={(e) => setSpeed(Number(e.target.value) as Parameters<typeof setSpeed>[0])}
          style={{
            padding: '6px 8px',
            background: 'var(--sim-surface-raised)',
            color: 'var(--sim-text)',
            border: '1px solid var(--sim-border)',
            borderRadius: 'var(--sim-radius-sm)',
            fontFamily: 'inherit',
            fontSize: 13,
          }}
        >
          {[0.25, 0.5, 1, 2, 4, 8, 16].map((s) => (
            <option key={s} value={s}>{s}x</option>
          ))}
        </select>
      </div>
    </div>
  );
}

const meta: Meta<typeof SimulationProvider> = {
  title: 'Core/SimulationProvider',
  component: SimulationProvider,
  parameters: {
    layout: 'centered',
  },
};
export default meta;

type Story = StoryObj<typeof SimulationProvider>;

export const Smoke: Story = {
  render: () => (
    <SimulationProvider tickFn={(entities: unknown) => entities}>
      <TickCounter />
    </SimulationProvider>
  ),
};
