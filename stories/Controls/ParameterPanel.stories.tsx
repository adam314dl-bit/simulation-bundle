import type { Meta, StoryObj } from '@storybook/react';
import { ParameterPanel } from '../../src/controls/ParameterPanel';
import { MockSimulationProvider } from '../helpers/MockSimulationProvider';
import type { ParameterSchema } from '../../src/types';

const sampleSchema: ParameterSchema = {
  speed: { type: 'range', min: 0, max: 10, step: 0.5, default: 5, label: 'Speed' },
  wrap: { type: 'toggle', default: true, label: 'Wrap Edges' },
  algorithm: { type: 'select', options: ['naive', 'optimized', 'gpu'], default: 'optimized', label: 'Algorithm' },
  accentColor: { type: 'color', default: '#6366f1', label: 'Accent Color' },
  gravity: { type: 'vec2', min: -10, max: 10, default: [0, -9.8], label: 'Gravity' },
  advanced: {
    type: 'group',
    label: 'Advanced',
    children: {
      friction: { type: 'range', min: 0, max: 1, step: 0.01, default: 0.3, label: 'Friction' },
      debug: { type: 'toggle', default: false, label: 'Debug Mode' },
    },
  },
};

function ParameterPanelDemo({ columns, compact }: { columns?: 1 | 2; compact?: boolean }) {
  return (
    <MockSimulationProvider parameters={sampleSchema}>
      <div style={{ maxWidth: 500 }}>
        <ParameterPanel schema={sampleSchema} columns={columns} compact={compact} />
      </div>
    </MockSimulationProvider>
  );
}

const meta: Meta<typeof ParameterPanelDemo> = {
  title: 'Controls/ParameterPanel',
  component: ParameterPanelDemo,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    columns: { control: 'select', options: [1, 2] },
    compact: { control: 'boolean' },
  },
};
export default meta;

type Story = StoryObj<typeof ParameterPanelDemo>;

export const Default: Story = {
  args: {
    columns: 2,
    compact: false,
  },
};

export const Compact: Story = {
  args: {
    columns: 1,
    compact: true,
  },
};

export const SingleColumn: Story = {
  args: {
    columns: 1,
    compact: false,
  },
};
