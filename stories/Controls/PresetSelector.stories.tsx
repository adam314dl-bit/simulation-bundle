import type { Meta, StoryObj } from '@storybook/react';
import { PresetSelector } from '../../src/controls/PresetSelector';
import type { Preset } from '../../src/controls/PresetSelector';
import { MockSimulationProvider } from '../helpers/MockSimulationProvider';

const samplePresets: Preset[] = [
  { name: 'Low', config: { speed: 1 }, description: 'Conservative settings' },
  { name: 'Medium', config: { speed: 5 }, description: 'Balanced performance' },
  { name: 'High', config: { speed: 10 }, description: 'Maximum throughput' },
];

function PresetSelectorDemo({ variant }: { variant: 'pills' | 'dropdown' | 'cards' }) {
  return (
    <MockSimulationProvider>
      <div style={{ maxWidth: 500 }}>
        <PresetSelector presets={samplePresets} variant={variant} />
      </div>
    </MockSimulationProvider>
  );
}

const meta: Meta<typeof PresetSelectorDemo> = {
  title: 'Controls/PresetSelector',
  component: PresetSelectorDemo,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['pills', 'dropdown', 'cards'],
    },
  },
};
export default meta;

type Story = StoryObj<typeof PresetSelectorDemo>;

export const Pills: Story = {
  args: {
    variant: 'pills',
  },
};

export const Dropdown: Story = {
  args: {
    variant: 'dropdown',
  },
};

export const Cards: Story = {
  args: {
    variant: 'cards',
  },
};
