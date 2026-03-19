import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SimulationProvider } from 'sim-kit/core';
import { StatsPanel } from 'sim-kit/data';
import type { StatConfig } from 'sim-kit/data';

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

function renderWithProvider(ui: React.ReactElement) {
  return render(
    <SimulationProvider tickFn={(entities: unknown) => entities}>
      {ui}
    </SimulationProvider>
  );
}

describe('DATA-01: StatsPanel', () => {
  const basicStats: StatConfig[] = [
    { label: 'Population', value: 1234.567, format: { minimumFractionDigits: 2, maximumFractionDigits: 2 } },
    { label: 'Energy', value: 99, unit: '%' },
  ];

  it('renders formatted stat values', () => {
    renderWithProvider(<StatsPanel stats={basicStats} />);
    expect(screen.getByText('1,234.57')).toBeInTheDocument();
  });

  it('renders stat labels', () => {
    renderWithProvider(<StatsPanel stats={basicStats} />);
    expect(screen.getByText('Population')).toBeInTheDocument();
    expect(screen.getByText('Energy')).toBeInTheDocument();
  });

  it('renders inline SVG sparkline when sparkline data provided', () => {
    const stats: StatConfig[] = [
      { label: 'Metric', value: 3, sparkline: [1, 2, 3] },
    ];
    const { container } = renderWithProvider(<StatsPanel stats={stats} />);
    const svg = container.querySelector('svg');
    expect(svg).not.toBeNull();
    expect(svg?.getAttribute('width')).toBe('60');
    expect(svg?.getAttribute('height')).toBe('20');
    const polyline = container.querySelector('polyline');
    expect(polyline).not.toBeNull();
  });

  it('hides sparkline when no sparkline data', () => {
    const stats: StatConfig[] = [
      { label: 'Metric', value: 42 },
    ];
    const { container } = renderWithProvider(<StatsPanel stats={stats} />);
    expect(container.querySelector('svg')).toBeNull();
  });

  it('shows up arrow for positive change', () => {
    const stats: StatConfig[] = [
      { label: 'Growth', value: 20, sparkline: [10, 20] },
    ];
    const { container } = renderWithProvider(<StatsPanel stats={stats} />);
    expect(container.textContent).toContain('\u25B2');
  });

  it('shows down arrow for negative change', () => {
    const stats: StatConfig[] = [
      { label: 'Decline', value: 10, sparkline: [20, 10] },
    ];
    const { container } = renderWithProvider(<StatsPanel stats={stats} />);
    expect(container.textContent).toContain('\u25BC');
  });

  it('respects changeThreshold', () => {
    const stats: StatConfig[] = [
      { label: 'Stable', value: 101, sparkline: [100, 101] },
    ];
    const { container } = renderWithProvider(
      <StatsPanel stats={stats} changeThreshold={5} />
    );
    // 1% change is below 5% threshold -- no arrow
    expect(container.textContent).not.toContain('\u25B2');
    expect(container.textContent).not.toContain('\u25BC');
  });

  it('renders 1-column layout', () => {
    const { container } = renderWithProvider(
      <StatsPanel stats={basicStats} columns={1} />
    );
    const panel = container.querySelector('[data-testid="stats-panel"]') as HTMLElement;
    expect(panel.style.gridTemplateColumns).toBe('repeat(1, 1fr)');
  });

  it('renders 2-column layout by default', () => {
    const { container } = renderWithProvider(
      <StatsPanel stats={basicStats} />
    );
    const panel = container.querySelector('[data-testid="stats-panel"]') as HTMLElement;
    expect(panel.style.gridTemplateColumns).toBe('repeat(2, 1fr)');
  });

  it('displays unit suffix', () => {
    renderWithProvider(<StatsPanel stats={basicStats} />);
    expect(screen.getByText('%')).toBeInTheDocument();
  });
});
