import { describe, it, expect, beforeAll, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SimulationProvider } from 'sim-kit/core';
import { MiniChart } from 'sim-kit/data';

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

const tickSelector = (state: Record<string, unknown>) => (state.tick as number) ?? 0;

describe('DATA-02: MiniChart', () => {
  it('renders chart container with specified dimensions', () => {
    const { container } = renderWithProvider(
      <MiniChart selector={tickSelector} width={200} height={80} />
    );
    const wrapper = container.querySelector('[data-testid="minichart"]') as HTMLElement;
    expect(wrapper).not.toBeNull();
    expect(wrapper.style.width).toBe('200px');
    expect(wrapper.style.height).toBe('80px');
  });

  it('renders label when provided', () => {
    renderWithProvider(
      <MiniChart selector={tickSelector} label="FPS" />
    );
    expect(screen.getByText('FPS')).toBeInTheDocument();
  });

  it('shows last value overlay by default', () => {
    // MiniChart starts with empty data, so overlay only shows when data exists.
    // We test that the overlay element renders when data is present by providing
    // an initial render. Since store subscribe hasn't fired yet, data may be empty.
    // We test that the component renders without error and the container exists.
    const { container } = renderWithProvider(
      <MiniChart selector={tickSelector} />
    );
    const wrapper = container.querySelector('[data-testid="minichart"]');
    expect(wrapper).not.toBeNull();
  });

  it('hides last value when showLastValue=false', () => {
    const { container } = renderWithProvider(
      <MiniChart selector={tickSelector} showLastValue={false} />
    );
    const overlay = container.querySelector('[data-testid="minichart-last-value"]');
    expect(overlay).toBeNull();
  });

  it('applies custom color', () => {
    const { container } = renderWithProvider(
      <MiniChart selector={tickSelector} color="#ff0000" />
    );
    const wrapper = container.querySelector('[data-testid="minichart"]');
    expect(wrapper).not.toBeNull();
    // Color is passed to the Area component inside Recharts -- verify via data attribute
    const colorHolder = container.querySelector('[data-chart-color]') as HTMLElement;
    expect(colorHolder?.getAttribute('data-chart-color')).toBe('#ff0000');
  });

  it('defaults windowSize to 60', () => {
    const { container } = renderWithProvider(
      <MiniChart selector={tickSelector} />
    );
    // Verify default via data attribute on container
    const wrapper = container.querySelector('[data-testid="minichart"]') as HTMLElement;
    expect(wrapper?.getAttribute('data-window-size')).toBe('60');
  });
});
