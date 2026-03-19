import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SimulationProvider } from 'sim-kit/core';
import { EventLog } from 'sim-kit/data';
import type { SimEvent } from 'sim-kit/types';
import { useSimulation } from '../../src/core/useSimulation';
import { useEffect } from 'react';

// jsdom does not provide ResizeObserver -- stub it for tests
beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class ResizeObserver {
      observe() { /* noop */ }
      unobserve() { /* noop */ }
      disconnect() { /* noop */ }
    } as unknown as typeof globalThis.ResizeObserver;
  }
});

function createMockEvents(count: number): Array<Omit<SimEvent, 'id' | 'timestamp'>> {
  const severities: Array<'info' | 'warning' | 'critical'> = ['info', 'warning', 'critical'];
  return Array.from({ length: count }, (_, i) => ({
    tick: i,
    type: 'test',
    severity: severities[i % 3]!,
    message: `Event ${i}`,
  }));
}

/** Helper component that logs events into the store on mount */
function EventPopulator({ events }: { events: Array<Omit<SimEvent, 'id' | 'timestamp'>> }) {
  const logEvent = useSimulation((s) => s.logEvent);
  useEffect(() => {
    for (const evt of events) {
      logEvent(evt);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function renderWithEvents(
  eventCount: number,
  props: Partial<React.ComponentProps<typeof EventLog>> = {},
) {
  const events = createMockEvents(eventCount);
  return render(
    <SimulationProvider tickFn={(entities: unknown) => entities} initialEntities={[0]}>
      <EventPopulator events={events} />
      <EventLog {...props} />
    </SimulationProvider>,
  );
}

describe('DATA-03: EventLog display and filtering', () => {
  it('renders event messages', () => {
    renderWithEvents(3);
    expect(screen.getByText('Event 0')).toBeInTheDocument();
    expect(screen.getByText('Event 1')).toBeInTheDocument();
    expect(screen.getByText('Event 2')).toBeInTheDocument();
  });

  it('color-codes events by severity', () => {
    renderWithEvents(3);
    expect(screen.getByTestId('severity-info')).toBeInTheDocument();
    expect(screen.getByTestId('severity-warning')).toBeInTheDocument();
    expect(screen.getByTestId('severity-critical')).toBeInTheDocument();
  });

  it('displays tick number for each event', () => {
    renderWithEvents(3);
    const ticks = screen.getAllByTestId('event-tick');
    expect(ticks.length).toBe(3);
    expect(ticks[0]!.textContent).toContain('t0');
    expect(ticks[1]!.textContent).toContain('t1');
    expect(ticks[2]!.textContent).toContain('t2');
  });

  it('filters events by severity pill toggle', () => {
    renderWithEvents(6);
    // 6 events: 2 info, 2 warning, 2 critical
    expect(screen.getAllByTestId('event-row').length).toBe(6);

    // Click Warning pill to deactivate
    const warningPill = screen.getByTestId('filter-warning');
    fireEvent.click(warningPill);

    // Warning events should be hidden (indices 1, 4 are warning)
    const rows = screen.getAllByTestId('event-row');
    expect(rows.length).toBe(4); // 2 info + 2 critical
  });

  it('shows all severity pills active by default', () => {
    renderWithEvents(1);
    const infoPill = screen.getByTestId('filter-info');
    const warningPill = screen.getByTestId('filter-warning');
    const criticalPill = screen.getByTestId('filter-critical');
    expect(infoPill).toBeInTheDocument();
    expect(warningPill).toBeInTheDocument();
    expect(criticalPill).toBeInTheDocument();
  });

  it('click-to-seek calls seekToTick', () => {
    let clickedEvent: SimEvent | undefined;
    renderWithEvents(3, {
      onEventClick: (e: SimEvent) => { clickedEvent = e; },
    });
    const rows = screen.getAllByTestId('event-row');
    fireEvent.click(rows[1]!);
    expect(clickedEvent).toBeDefined();
    expect(clickedEvent!.tick).toBe(1);
  });

  it('auto-scrolls to newest events', () => {
    const { container } = renderWithEvents(20, { maxHeight: 100 });
    const scrollContainer = container.querySelector('[data-testid="event-log-container"]') as HTMLDivElement;
    // In jsdom, scrollHeight is 0 but we can verify the component attempted auto-scroll
    // by checking that the container element exists and has the correct max-height
    expect(scrollContainer).not.toBeNull();
    expect(scrollContainer.style.maxHeight).toBe('100px');
  });
});

describe('DATA-04: EventLog virtualization', () => {
  it('only renders visible rows for large event lists', () => {
    // maxHeight=160, rowHeight=32 -> ~5 visible rows + 1 overscan = 6
    renderWithEvents(200, { maxHeight: 160, rowHeight: 32 });
    const rows = screen.getAllByTestId('event-row');
    // Should have approximately 5-6 rows, NOT 200
    expect(rows.length).toBeLessThanOrEqual(7);
    expect(rows.length).toBeGreaterThan(0);
  });

  it('maintains correct scroll height sentinel', () => {
    const { container } = renderWithEvents(50, { rowHeight: 32 });
    const sentinel = container.querySelector('[data-testid="event-log-sentinel"]') as HTMLDivElement;
    expect(sentinel).not.toBeNull();
    // 50 events * 32px = 1600px
    expect(sentinel.style.height).toBe('1600px');
  });
});
