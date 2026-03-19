import type { Meta, StoryObj } from '@storybook/react';
import { SimulationProvider, useSimulation } from '../../src/core';

function UseSimulationDemo() {
  const tick = useSimulation((s) => s.tick);
  const running = useSimulation((s) => s.running);
  const speed = useSimulation((s) => s.speed);
  const parameters = useSimulation((s) => s.parameters);
  const play = useSimulation((s) => s.play);
  const pause = useSimulation((s) => s.pause);
  const step = useSimulation((s) => s.step);
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
        maxWidth: 400,
      }}
    >
      <h2 style={{ margin: '0 0 16px', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sim-text-muted)' }}>
        useSimulation Hook Demo
      </h2>
      <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
        <div>Tick: <strong>{tick}</strong></div>
        <div>Running: <strong>{running ? 'true' : 'false'}</strong></div>
        <div>Speed: <strong>{speed}x</strong></div>
        <div>Parameters: <code>{JSON.stringify(parameters)}</code></div>
      </div>
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
          }}
        >
          {running ? 'Pause' : 'Play'}
        </button>
        <button
          onClick={step}
          style={{
            padding: '6px 16px',
            background: 'transparent',
            color: 'var(--sim-text)',
            border: '1px solid var(--sim-border)',
            borderRadius: 'var(--sim-radius-sm)',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Step
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

function Wrapper() {
  return (
    <SimulationProvider tickFn={(e: unknown) => e} initialEntities={{ counter: 0 }}>
      <UseSimulationDemo />
    </SimulationProvider>
  );
}

const meta: Meta = {
  title: 'Core/useSimulation',
  component: Wrapper,
  parameters: {
    layout: 'centered',
  },
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => <Wrapper />,
};
