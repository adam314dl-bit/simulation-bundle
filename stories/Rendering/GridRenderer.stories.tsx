import type { Meta, StoryObj } from '@storybook/react';
import { GridRenderer } from '../../src/rendering/GridRenderer';
import type { GridConfig } from '../../src/rendering/types';
import { useMemo } from 'react';

function GridRendererDemo({
  cellSize,
  colorRamp,
  borderWidth,
  gridWidth,
  gridHeight,
}: {
  cellSize: number;
  colorRamp: string;
  borderWidth: number;
  gridWidth: number;
  gridHeight: number;
}) {
  const config = useMemo<GridConfig>(() => {
    const total = gridWidth * gridHeight;
    const data = new Float64Array(total);
    for (let i = 0; i < total; i++) {
      data[i] = colorRamp === 'category10'
        ? Math.floor(Math.random() * 4) / 3
        : Math.random();
    }
    return { width: gridWidth, height: gridHeight, data, cellSize, borderWidth, colorRamp };
  }, [gridWidth, gridHeight, cellSize, borderWidth, colorRamp]);

  return <GridRenderer config={config} />;
}

const meta: Meta<typeof GridRendererDemo> = {
  title: 'Rendering/GridRenderer',
  component: GridRendererDemo,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    cellSize: { control: { type: 'range', min: 4, max: 40, step: 2 } },
    colorRamp: {
      control: 'select',
      options: ['viridis', 'inferno', 'plasma', 'coolwarm', 'terrain', 'category10'],
    },
    borderWidth: { control: { type: 'range', min: 0, max: 3, step: 0.5 } },
    gridWidth: { control: { type: 'range', min: 5, max: 50, step: 5 } },
    gridHeight: { control: { type: 'range', min: 5, max: 50, step: 5 } },
  },
};
export default meta;

type Story = StoryObj<typeof GridRendererDemo>;

export const Default: Story = {
  args: {
    cellSize: 20,
    colorRamp: 'category10',
    borderWidth: 1,
    gridWidth: 20,
    gridHeight: 20,
  },
};

export const Viridis: Story = {
  args: {
    cellSize: 20,
    colorRamp: 'viridis',
    borderWidth: 0,
    gridWidth: 20,
    gridHeight: 20,
  },
};
