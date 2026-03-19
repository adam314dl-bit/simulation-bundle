import type { Meta, StoryObj } from '@storybook/react';
import { StatsPanel } from '../../src/data/StatsPanel';
import type { StatConfig } from '../../src/data/types';

const sampleStats: StatConfig[] = [
  {
    label: 'Population',
    value: 1234,
    unit: 'agents',
    sparkline: [100, 200, 400, 800, 1234],
  },
  {
    label: 'Growth Rate',
    value: 0.034,
    format: { style: 'percent', maximumFractionDigits: 1 },
    sparkline: [0.01, 0.02, 0.03, 0.034],
  },
  {
    label: 'Temperature',
    value: 23.7,
    unit: 'C',
    sparkline: [22, 23, 23.5, 23.7],
  },
];

function StatsPanelDemo({ columns, showChange }: { columns: 1 | 2; showChange: boolean }) {
  return <StatsPanel stats={sampleStats} columns={columns} showChange={showChange} />;
}

const meta: Meta<typeof StatsPanelDemo> = {
  title: 'Data/StatsPanel',
  component: StatsPanelDemo,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    columns: { control: 'select', options: [1, 2] },
    showChange: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof StatsPanelDemo>;

export const Default: Story = {
  args: {
    columns: 2,
    showChange: true,
  },
};

export const SingleColumn: Story = {
  args: {
    columns: 1,
    showChange: true,
  },
};

export const NoChange: Story = {
  args: {
    columns: 2,
    showChange: false,
  },
};
