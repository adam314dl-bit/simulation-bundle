import type { Meta, StoryObj } from '@storybook/react';
import { ParticleRenderer } from '../../src/rendering/ParticleRenderer';
import { useMemo } from 'react';

function ParticleRendererDemo({
  particleCount,
  pointSize,
  colorRamp,
  trails,
  trailAlpha,
  blendMode,
}: {
  particleCount: number;
  pointSize: number;
  colorRamp: string;
  trails: boolean;
  trailAlpha: number;
  blendMode: 'additive' | 'normal';
}) {
  const data = useMemo(() => {
    const arr = new Float32Array(particleCount * 4);
    for (let i = 0; i < particleCount; i++) {
      const off = i * 4;
      arr[off] = Math.random() * 600;       // x in [0, 600]
      arr[off + 1] = Math.random() * 400;   // y in [0, 400]
      arr[off + 2] = (Math.random() - 0.5) * 2; // vx
      arr[off + 3] = (Math.random() - 0.5) * 2; // vy
    }
    return arr;
  }, [particleCount]);

  return (
    <ParticleRenderer
      data={data}
      count={particleCount}
      width={600}
      height={400}
      pointSize={pointSize}
      colorRamp={colorRamp}
      trails={trails}
      trailAlpha={trailAlpha}
      blendMode={blendMode}
      renderer="canvas2d"
    />
  );
}

const meta: Meta<typeof ParticleRendererDemo> = {
  title: 'Rendering/ParticleRenderer',
  component: ParticleRendererDemo,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    particleCount: { control: { type: 'range', min: 50, max: 2000, step: 50 } },
    pointSize: { control: { type: 'range', min: 1, max: 10, step: 1 } },
    colorRamp: {
      control: 'select',
      options: ['viridis', 'inferno', 'plasma', 'coolwarm', 'terrain'],
    },
    trails: { control: 'boolean' },
    trailAlpha: { control: { type: 'range', min: 0.02, max: 0.15, step: 0.01 } },
    blendMode: { control: 'select', options: ['additive', 'normal'] },
  },
};
export default meta;

type Story = StoryObj<typeof ParticleRendererDemo>;

export const Default: Story = {
  args: {
    particleCount: 500,
    pointSize: 3,
    colorRamp: 'viridis',
    trails: false,
    trailAlpha: 0.05,
    blendMode: 'normal',
  },
};

export const WithTrails: Story = {
  args: {
    particleCount: 500,
    pointSize: 3,
    colorRamp: 'plasma',
    trails: true,
    trailAlpha: 0.05,
    blendMode: 'additive',
  },
};
