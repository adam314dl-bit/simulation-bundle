import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';
import { EventLog } from '../../src/data/EventLog';
import { MockSimulationProvider } from '../helpers/MockSimulationProvider';
import { useSimulation } from '../../src/core/useSimulation';

const severities = ['info', 'warning', 'critical'] as const;
const messages = [
  'Population threshold reached',
  'Resource depleted in sector 7',
  'Agent collision detected',
  'Temperature anomaly observed',
  'Network latency spike',
  'Memory pressure warning',
  'Simulation checkpoint saved',
  'New agent spawned at origin',
  'Boundary condition triggered',
  'Convergence reached in 42 steps',
];

function EventSeeder({ count }: { count: number }) {
  const logEvent = useSimulation((s) => s.logEvent);
  useEffect(() => {
    for (let i = 0; i < count; i++) {
      logEvent({
        type: 'sim',
        severity: severities[i % 3]!,
        message: messages[i % messages.length]!,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function EventLogDemo({
  maxHeight,
  autoScroll,
  eventCount,
}: {
  maxHeight: number;
  autoScroll: boolean;
  eventCount: number;
}) {
  return (
    <MockSimulationProvider>
      <EventSeeder count={eventCount} />
      <div style={{ maxWidth: 500 }}>
        <EventLog maxHeight={maxHeight} autoScroll={autoScroll} />
      </div>
    </MockSimulationProvider>
  );
}

const meta: Meta<typeof EventLogDemo> = {
  title: 'Data/EventLog',
  component: EventLogDemo,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    maxHeight: { control: { type: 'range', min: 100, max: 600, step: 50 } },
    autoScroll: { control: 'boolean' },
    eventCount: { control: { type: 'range', min: 5, max: 50, step: 5 } },
  },
};
export default meta;

type Story = StoryObj<typeof EventLogDemo>;

export const Default: Story = {
  args: {
    maxHeight: 300,
    autoScroll: true,
    eventCount: 20,
  },
};
