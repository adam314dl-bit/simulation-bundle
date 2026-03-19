import type { Meta, StoryObj } from '@storybook/react';
import { useState, useCallback } from 'react';
import { RingBuffer } from '../../src/core';

function RingBufferDemo({ capacity }: { capacity: number }) {
  const [buffer] = useState(() => new RingBuffer<number>(capacity));
  const [, setRenderTick] = useState(0);
  const [input, setInput] = useState('');

  const forceRender = useCallback(() => setRenderTick((t) => t + 1), []);

  const handlePush = () => {
    const val = input ? Number(input) : Math.round(Math.random() * 100);
    buffer.push(val);
    setInput('');
    forceRender();
  };

  const handleClear = () => {
    buffer.clear();
    forceRender();
  };

  const items: (number | undefined)[] = [];
  for (let i = 0; i < buffer.size; i++) {
    items.push(buffer.get(i));
  }

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
        RingBuffer Demo
      </h2>
      <div style={{ display: 'grid', gap: 4, marginBottom: 16, fontSize: 13 }}>
        <div>Capacity: <strong>{buffer.capacity}</strong></div>
        <div>Size: <strong>{buffer.size}</strong></div>
        <div>Full: <strong>{buffer.isFull ? 'yes' : 'no'}</strong></div>
        <div>Latest: <strong>{buffer.latest ?? 'empty'}</strong></div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <input
          type="number"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="value (or random)"
          style={{
            padding: '6px 8px',
            background: 'var(--sim-surface-raised)',
            color: 'var(--sim-text)',
            border: '1px solid var(--sim-border)',
            borderRadius: 'var(--sim-radius-sm)',
            fontFamily: 'inherit',
            width: 140,
          }}
        />
        <button
          onClick={handlePush}
          style={{
            padding: '6px 16px',
            background: 'var(--sim-accent)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--sim-radius-sm)',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          Push
        </button>
        <button
          onClick={handleClear}
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
          Clear
        </button>
      </div>
      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
        {items.map((val, i) => (
          <div
            key={i}
            style={{
              width: 36,
              height: 36,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: i === items.length - 1 ? 'var(--sim-accent)' : 'var(--sim-surface-raised)',
              color: i === items.length - 1 ? '#fff' : 'var(--sim-text)',
              borderRadius: 'var(--sim-radius-sm)',
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {val}
          </div>
        ))}
        {items.length === 0 && (
          <div style={{ color: 'var(--sim-text-muted)', fontSize: 12 }}>Empty -- push some values</div>
        )}
      </div>
    </div>
  );
}

const meta: Meta = {
  title: 'Core/RingBuffer',
  component: RingBufferDemo,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    capacity: { control: { type: 'range', min: 3, max: 20, step: 1 } },
  },
};
export default meta;

type Story = StoryObj<typeof RingBufferDemo>;

export const Default: Story = {
  args: {
    capacity: 8,
  },
};
