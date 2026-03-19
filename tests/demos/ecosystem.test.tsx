// Requirement traceability: DEMO-01, DEMO-02
import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SimulationProvider } from 'sim-kit/core';

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

describe('DEMO-01: Ecosystem demo', () => {
  it('renders EcosystemDemo without crashing', async () => {
    const { EcosystemDemo } = await import('../../src/demos/ecosystem');
    render(
      <SimulationProvider tickFn={(e: unknown) => e}>
        <EcosystemDemo />
      </SimulationProvider>
    );
    expect(screen.getByText(/ecosystem/i)).toBeInTheDocument();
  });

  it('includes GridRenderer component', async () => {
    const { EcosystemDemo } = await import('../../src/demos/ecosystem');
    const { container } = render(
      <SimulationProvider tickFn={(e: unknown) => e}>
        <EcosystemDemo />
      </SimulationProvider>
    );
    expect(container.querySelector('[data-testid="grid-renderer"]')).toBeInTheDocument();
  });

  it('includes ParameterPanel component', async () => {
    const { EcosystemDemo } = await import('../../src/demos/ecosystem');
    render(
      <SimulationProvider tickFn={(e: unknown) => e}>
        <EcosystemDemo />
      </SimulationProvider>
    );
    expect(screen.getByTestId('parameter-panel')).toBeInTheDocument();
  });

  it('includes TimelineControl component', async () => {
    const { EcosystemDemo } = await import('../../src/demos/ecosystem');
    render(
      <SimulationProvider tickFn={(e: unknown) => e}>
        <EcosystemDemo />
      </SimulationProvider>
    );
    expect(screen.getByTestId('timeline-control')).toBeInTheDocument();
  });

  it('includes StatsPanel component', async () => {
    const { EcosystemDemo } = await import('../../src/demos/ecosystem');
    render(
      <SimulationProvider tickFn={(e: unknown) => e}>
        <EcosystemDemo />
      </SimulationProvider>
    );
    expect(screen.getByTestId('stats-panel')).toBeInTheDocument();
  });

  it('includes EventLog component', async () => {
    const { EcosystemDemo } = await import('../../src/demos/ecosystem');
    render(
      <SimulationProvider tickFn={(e: unknown) => e}>
        <EcosystemDemo />
      </SimulationProvider>
    );
    expect(screen.getByTestId('event-log')).toBeInTheDocument();
  });

  it('includes PresetSelector component', async () => {
    const { EcosystemDemo } = await import('../../src/demos/ecosystem');
    render(
      <SimulationProvider tickFn={(e: unknown) => e}>
        <EcosystemDemo />
      </SimulationProvider>
    );
    expect(screen.getByTestId('preset-selector')).toBeInTheDocument();
  });

  it('renders 3 MiniChart components (grass, rabbits, foxes)', async () => {
    const { EcosystemDemo } = await import('../../src/demos/ecosystem');
    const { container } = render(
      <SimulationProvider tickFn={(e: unknown) => e}>
        <EcosystemDemo />
      </SimulationProvider>
    );
    const miniCharts = container.querySelectorAll('[data-testid="mini-chart"]');
    expect(miniCharts.length).toBe(3);
  });

  it('ecosystemTick produces new EcosystemEntities with stats', async () => {
    const { ecosystemTick } = await import('../../src/demos/ecosystem/simulation');
    const { EcosystemEntities } = await import('../../src/demos/ecosystem/simulation') as {
      EcosystemEntities: unknown;
      ecosystemTick: (entities: Record<string, unknown>, params: Record<string, unknown>) => Record<string, unknown>;
    };

    const initial = {
      grid: new Uint8Array(100),
      width: 10,
      height: 10,
      stats: { grass: 0, rabbits: 0, foxes: 0, tick: 0 },
    };

    const params = {
      grassGrowth: 0.03,
      rabbitBreed: 0.05,
      rabbitStarve: 0.02,
      foxHunt: 0.04,
      foxDeath: 0.08,
      foxBreed: 0.03,
      initialDensity: 0.5,
      gridSize: 10,
    };

    const next = ecosystemTick(initial, params);
    expect(next).toHaveProperty('grid');
    expect(next).toHaveProperty('stats');
    expect(next.stats).toHaveProperty('tick');
  });
});

describe('DEMO-02: Ecosystem presets', () => {
  it('exports 4 presets', async () => {
    const { ecosystemPresets } = await import('../../src/demos/ecosystem/presets');
    expect(ecosystemPresets).toHaveLength(4);
  });

  it('presets have correct names', async () => {
    const { ecosystemPresets } = await import('../../src/demos/ecosystem/presets');
    const names = ecosystemPresets.map((p: { name: string }) => p.name);
    expect(names).toContain('Stable coexistence');
    expect(names).toContain('Fox extinction');
    expect(names).toContain('Overpopulation crash');
    expect(names).toContain('Chaos');
  });

  it('each preset has all 8 required parameter keys', async () => {
    const { ecosystemPresets } = await import('../../src/demos/ecosystem/presets');
    const requiredKeys = [
      'grassGrowth', 'rabbitBreed', 'rabbitStarve',
      'foxHunt', 'foxDeath', 'foxBreed',
      'initialDensity', 'gridSize',
    ];

    for (const preset of ecosystemPresets) {
      for (const key of requiredKeys) {
        expect(preset.parameters).toHaveProperty(key);
      }
    }
  });
});
