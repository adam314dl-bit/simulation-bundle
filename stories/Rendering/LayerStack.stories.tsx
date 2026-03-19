import type { Meta, StoryObj } from '@storybook/react';
import { LayerStack } from '../../src/rendering/LayerStack';
import type { SelectionMode } from '../../src/rendering/types';

function LayerStackDemo({ selectionMode }: { selectionMode: SelectionMode }) {
  return (
    <LayerStack
      selectionMode={selectionMode}
      onSelect={(selection) => console.log('Selection:', selection)}
    >
      <div
        style={{
          width: 400,
          height: 300,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(168,85,247,0.3))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--sim-text-muted)',
          fontFamily: 'var(--sim-font-mono)',
          fontSize: 12,
        }}
      >
        Layer 1 (Bottom)
      </div>
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          width: 200,
          height: 150,
          background: 'rgba(251,146,60,0.3)',
          border: '1px dashed rgba(251,146,60,0.6)',
          borderRadius: 'var(--sim-radius-sm)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--sim-text-muted)',
          fontFamily: 'var(--sim-font-mono)',
          fontSize: 12,
        }}
      >
        Layer 2 (Top)
      </div>
    </LayerStack>
  );
}

const meta: Meta<typeof LayerStackDemo> = {
  title: 'Rendering/LayerStack',
  component: LayerStackDemo,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    selectionMode: {
      control: 'select',
      options: ['none', 'rect', 'lasso'] as SelectionMode[],
    },
  },
};
export default meta;

type Story = StoryObj<typeof LayerStackDemo>;

export const Default: Story = {
  args: {
    selectionMode: 'none',
  },
};

export const RectSelection: Story = {
  args: {
    selectionMode: 'rect',
  },
};

export const LassoSelection: Story = {
  args: {
    selectionMode: 'lasso',
  },
};
