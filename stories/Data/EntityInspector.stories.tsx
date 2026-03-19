import type { Meta, StoryObj } from '@storybook/react';
import { EntityInspector } from '../../src/data/EntityInspector';

const sampleEntity: Record<string, unknown> = {
  id: 'agent-42',
  name: 'Agent 42',
  health: 87.5,
  speed: 1.2,
  position: [120, 340],
  active: true,
};

const sampleChartKeys = ['health', 'speed'];
const sampleChartData: Record<string, number[]> = {
  health: [80, 82, 85, 87, 87.5],
  speed: [1.0, 1.1, 1.15, 1.2, 1.2],
};

function EntityInspectorDemo({
  title,
  position,
}: {
  title: string;
  position: 'right' | 'bottom' | 'floating';
}) {
  return (
    <div style={{ position: 'relative', width: 600, height: 400, background: 'var(--sim-bg)', border: '1px dashed var(--sim-border)', borderRadius: 'var(--sim-radius-md)' }}>
      <div style={{ padding: 16, color: 'var(--sim-text-muted)', fontSize: 12 }}>
        Simulation viewport area
      </div>
      <EntityInspector
        entity={sampleEntity}
        title={title}
        position={position}
        chartKeys={sampleChartKeys}
        chartData={sampleChartData}
      />
    </div>
  );
}

const meta: Meta<typeof EntityInspectorDemo> = {
  title: 'Data/EntityInspector',
  component: EntityInspectorDemo,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    title: { control: 'text' },
    position: {
      control: 'select',
      options: ['right', 'bottom', 'floating'],
    },
  },
};
export default meta;

type Story = StoryObj<typeof EntityInspectorDemo>;

export const Default: Story = {
  args: {
    title: 'Entity Inspector',
    position: 'right',
  },
};

export const Floating: Story = {
  args: {
    title: 'Entity Inspector',
    position: 'floating',
  },
};

export const Bottom: Story = {
  args: {
    title: 'Entity Inspector',
    position: 'bottom',
  },
};
