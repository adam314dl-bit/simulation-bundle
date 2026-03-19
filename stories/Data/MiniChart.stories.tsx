import type { Meta, StoryObj } from '@storybook/react';
import { MiniChart } from '../../src/data/MiniChart';
import { MockSimulationProvider } from '../helpers/MockSimulationProvider';

const tickSelector = (s: Record<string, unknown>) => (s as { tick: number }).tick;

function MiniChartDemo({
  windowSize,
  color,
  label,
}: {
  windowSize: number;
  color: string;
  label: string;
}) {
  return (
    <MockSimulationProvider>
      <MiniChart
        selector={tickSelector}
        windowSize={windowSize}
        color={color}
        label={label}
      />
    </MockSimulationProvider>
  );
}

const meta: Meta<typeof MiniChartDemo> = {
  title: 'Data/MiniChart',
  component: MiniChartDemo,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    windowSize: { control: { type: 'range', min: 10, max: 200, step: 10 } },
    color: { control: 'color' },
    label: { control: 'text' },
  },
};
export default meta;

type Story = StoryObj<typeof MiniChartDemo>;

export const Default: Story = {
  args: {
    windowSize: 50,
    color: 'var(--sim-accent)',
    label: 'Tick',
  },
};
