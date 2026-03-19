import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SimulationProvider } from 'sim-kit/core';
import { EntityInspector } from 'sim-kit/data';

// jsdom does not provide ResizeObserver — stub it for tests
beforeAll(() => {
  if (typeof globalThis.ResizeObserver === 'undefined') {
    globalThis.ResizeObserver = class ResizeObserver {
      observe() { /* noop */ }
      unobserve() { /* noop */ }
      disconnect() { /* noop */ }
    } as unknown as typeof globalThis.ResizeObserver;
  }
});

const mockEntity = {
  name: 'Fox #42',
  health: 85,
  alive: true,
  position: [10, 20],
  type: 'predator',
};

function renderWithProvider(ui: React.ReactElement) {
  return render(
    <SimulationProvider tickFn={(entities: unknown) => entities}>
      {ui}
    </SimulationProvider>
  );
}

describe('DATA-06: EntityInspector', () => {
  it('renders entity property names', () => {
    renderWithProvider(<EntityInspector entity={mockEntity} />);
    expect(screen.getByText('name')).toBeInTheDocument();
    expect(screen.getByText('health')).toBeInTheDocument();
    expect(screen.getByText('alive')).toBeInTheDocument();
    expect(screen.getByText('position')).toBeInTheDocument();
    expect(screen.getByText('type')).toBeInTheDocument();
  });

  it('renders property values with formatting', () => {
    renderWithProvider(<EntityInspector entity={mockEntity} />);
    // String value
    expect(screen.getByText('Fox #42')).toBeInTheDocument();
    // Number value (formatted to 2 decimal places)
    expect(screen.getByText('85.00')).toBeInTheDocument();
    // Boolean value
    expect(screen.getByText('true')).toBeInTheDocument();
    // Array value
    expect(screen.getByText('10, 20')).toBeInTheDocument();
    // String enum
    expect(screen.getByText('predator')).toBeInTheDocument();
  });

  it('renders title when provided', () => {
    renderWithProvider(<EntityInspector entity={mockEntity} title="Fox #42" />);
    // Title should appear in header
    expect(screen.getByText('Fox #42')).toBeInTheDocument();
  });

  it('renders "Inspector" as default title', () => {
    renderWithProvider(<EntityInspector entity={mockEntity} />);
    expect(screen.getByText('Inspector')).toBeInTheDocument();
  });

  it('renders track toggle button', () => {
    renderWithProvider(<EntityInspector entity={mockEntity} />);
    const toggle = screen.getByTestId('track-toggle');
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveTextContent('Track');
  });

  it('clicking track toggle calls onTrack with toggled value', () => {
    const onTrack = vi.fn();
    renderWithProvider(
      <EntityInspector entity={mockEntity} onTrack={onTrack} tracked={false} />
    );
    const toggle = screen.getByTestId('track-toggle');
    fireEvent.click(toggle);
    expect(onTrack).toHaveBeenCalledWith(true);
  });

  it('renders track toggle as active when tracked=true', () => {
    renderWithProvider(
      <EntityInspector entity={mockEntity} tracked={true} />
    );
    const toggle = screen.getByTestId('track-toggle');
    expect(toggle).toHaveTextContent('Tracking');
  });

  it('renders inline sparkline chart for chartKeys', () => {
    renderWithProvider(
      <EntityInspector
        entity={mockEntity}
        chartKeys={['health']}
        chartData={{ health: [80, 82, 85] }}
      />
    );
    const chart = screen.getByTestId('chart-health');
    expect(chart).toBeInTheDocument();
    // Should contain an SVG sparkline
    expect(chart.querySelector('svg')).not.toBeNull();
  });

  it('does not render chart for non-chartKeys', () => {
    renderWithProvider(
      <EntityInspector
        entity={mockEntity}
        chartKeys={['health']}
        chartData={{ health: [80, 82, 85] }}
      />
    );
    expect(screen.queryByTestId('chart-name')).toBeNull();
    expect(screen.queryByTestId('chart-alive')).toBeNull();
  });

  it('uses right position by default', () => {
    const { container } = renderWithProvider(
      <EntityInspector entity={mockEntity} />
    );
    const panel = container.querySelector('[data-testid="entity-inspector"]') as HTMLElement;
    expect(panel).not.toBeNull();
    // Right position: absolute, right: 0
    expect(panel.style.position).toBe('absolute');
    expect(panel.style.right).toBe('0px');
    // Should NOT have transform (that's floating mode)
    expect(panel.style.transform).toBe('');
  });

  it('uses bottom position', () => {
    const { container } = renderWithProvider(
      <EntityInspector entity={mockEntity} position="bottom" />
    );
    const panel = container.querySelector('[data-testid="entity-inspector"]') as HTMLElement;
    expect(panel).not.toBeNull();
    expect(panel.style.position).toBe('absolute');
    expect(panel.style.bottom).toBe('0px');
  });

  it('uses floating position', () => {
    const { container } = renderWithProvider(
      <EntityInspector entity={mockEntity} position="floating" />
    );
    const panel = container.querySelector('[data-testid="entity-inspector"]') as HTMLElement;
    expect(panel).not.toBeNull();
    expect(panel.style.position).toBe('fixed');
  });

  it('renders drag handle in floating mode', () => {
    renderWithProvider(
      <EntityInspector entity={mockEntity} position="floating" />
    );
    const handle = screen.getByTestId('drag-handle');
    expect(handle).toBeInTheDocument();
    expect(handle.style.cursor).toBe('grab');
    expect(handle.style.touchAction).toBe('none');
  });
});
