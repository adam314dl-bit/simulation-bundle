import type { Meta, StoryObj } from '@storybook/react';
import { TimelineControl } from '../../src/controls/TimelineControl';
import { MockSimulationProvider } from '../helpers/MockSimulationProvider';

/**
 * Full timeline with transport controls, scrubber, speed badge, and FPS counter.
 *
 * **Keyboard shortcuts (when enabled):**
 * - Space: Play/Pause
 * - Arrow Right: Step forward (Shift+Right: +10 ticks)
 * - Arrow Left: Step back (Shift+Left: -10 ticks)
 */
function TimelineControlDemo() {
  return (
    <MockSimulationProvider>
      <div style={{ maxWidth: 500 }}>
        <TimelineControl />
      </div>
    </MockSimulationProvider>
  );
}

const meta: Meta = {
  title: 'Controls/TimelineControl',
  component: TimelineControlDemo,
  parameters: {
    layout: 'centered',
  },
};
export default meta;

type Story = StoryObj;

export const Default: Story = {
  render: () => <TimelineControlDemo />,
};
