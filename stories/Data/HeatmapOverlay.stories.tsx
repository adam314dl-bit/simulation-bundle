import type { Meta, StoryObj } from '@storybook/react';
import { HeatmapOverlay } from '../../src/data/HeatmapOverlay';
import { useMemo } from 'react';

function HeatmapOverlayDemo({
  colorRamp,
  opacity,
  interpolate,
  showLegend,
}: {
  colorRamp: string;
  opacity: number;
  interpolate: boolean;
  showLegend: boolean;
}) {
  const data = useMemo(
    () => Float64Array.from({ length: 100 }, (_, i) => Math.sin(i / 10) * Math.cos((i % 10) / 5)),
    [],
  );

  return (
    <div style={{ maxWidth: 300 }}>
      <HeatmapOverlay
        data={data}
        gridWidth={10}
        gridHeight={10}
        colorRamp={colorRamp}
        opacity={opacity}
        interpolate={interpolate}
        showLegend={showLegend}
        range={[-1, 1]}
      />
    </div>
  );
}

const meta: Meta<typeof HeatmapOverlayDemo> = {
  title: 'Data/HeatmapOverlay',
  component: HeatmapOverlayDemo,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    colorRamp: {
      control: 'select',
      options: ['viridis', 'inferno', 'plasma', 'coolwarm', 'terrain'],
    },
    opacity: { control: { type: 'range', min: 0, max: 1, step: 0.1 } },
    interpolate: { control: 'boolean' },
    showLegend: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof HeatmapOverlayDemo>;

export const Default: Story = {
  args: {
    colorRamp: 'viridis',
    opacity: 0.8,
    interpolate: true,
    showLegend: true,
  },
};

export const Inferno: Story = {
  args: {
    colorRamp: 'inferno',
    opacity: 0.8,
    interpolate: true,
    showLegend: true,
  },
};

export const NoInterpolation: Story = {
  args: {
    colorRamp: 'viridis',
    opacity: 0.8,
    interpolate: false,
    showLegend: true,
  },
};
