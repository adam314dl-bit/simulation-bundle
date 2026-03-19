import type { Meta, StoryObj } from '@storybook/react';
import { colorRamps } from '../../src/rendering/color-ramps';

const RAMP_NAMES = ['viridis', 'inferno', 'plasma', 'coolwarm', 'terrain', 'category10'] as const;

function ColorRampBar({ name, rampFn }: { name: string; rampFn: (t: number) => string }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ fontSize: 12, color: 'var(--sim-text-muted)', fontFamily: 'var(--sim-font-mono)', marginBottom: 4 }}>
        {name}
      </div>
      <div style={{ display: 'flex', height: 30, borderRadius: 'var(--sim-radius-sm)', overflow: 'hidden' }}>
        {Array.from({ length: 256 }, (_, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: rampFn(i / 255),
            }}
          />
        ))}
      </div>
    </div>
  );
}

function ColorRampsCatalog() {
  return (
    <div
      style={{
        padding: '24px',
        border: '1px solid var(--sim-border)',
        borderRadius: 'var(--sim-radius-md)',
        background: 'var(--sim-surface)',
        maxWidth: 500,
        color: 'var(--sim-text)',
      }}
    >
      <h2 style={{ margin: '0 0 16px', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--sim-text-muted)' }}>
        Color Ramps
      </h2>
      {RAMP_NAMES.map((name) => (
        <ColorRampBar key={name} name={name} rampFn={colorRamps[name]} />
      ))}
    </div>
  );
}

const meta: Meta = {
  title: 'Rendering/ColorRamps',
  component: ColorRampsCatalog,
  parameters: {
    layout: 'centered',
  },
};
export default meta;

type Story = StoryObj;

export const Default: Story = {};
