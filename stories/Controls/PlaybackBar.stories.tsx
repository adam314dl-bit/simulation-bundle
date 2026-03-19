import type { Meta, StoryObj } from '@storybook/react';
import { PlaybackBar } from '../../src/controls/PlaybackBar';
import { MockSimulationProvider } from '../helpers/MockSimulationProvider';

/**
 * Minimal 40px playback bar with play/pause, speed badge, and tick counter.
 */
function PlaybackBarDemo() {
  return (
    <MockSimulationProvider>
      <div style={{ maxWidth: 400 }}>
        <PlaybackBar />
      </div>
    </MockSimulationProvider>
  );
}

const meta: Meta = {
  title: 'Controls/PlaybackBar',
  component: PlaybackBarDemo,
  parameters: {
    layout: 'centered',
  },
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => <PlaybackBarDemo />,
};
