// Requirement traceability: DEMO-05, DEMO-06
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

describe('DEMO-05: Social network demo', () => {
  it('renders NetworkDemo without crashing', async () => {
    const { NetworkDemo } = await import('../../src/demos/network');
    render(
      <SimulationProvider tickFn={(e: unknown) => e}>
        <NetworkDemo />
      </SimulationProvider>
    );
    expect(screen.getByText(/network/i)).toBeInTheDocument();
  });

  it('includes ForceGraph component', async () => {
    const { NetworkDemo } = await import('../../src/demos/network');
    const { container } = render(
      <SimulationProvider tickFn={(e: unknown) => e}>
        <NetworkDemo />
      </SimulationProvider>
    );
    expect(container.querySelector('[data-testid="force-graph"]')).toBeInTheDocument();
  });

  it('includes ParameterPanel component', async () => {
    const { NetworkDemo } = await import('../../src/demos/network');
    render(
      <SimulationProvider tickFn={(e: unknown) => e}>
        <NetworkDemo />
      </SimulationProvider>
    );
    expect(screen.getByTestId('parameter-panel')).toBeInTheDocument();
  });

  it('includes TimelineControl component', async () => {
    const { NetworkDemo } = await import('../../src/demos/network');
    render(
      <SimulationProvider tickFn={(e: unknown) => e}>
        <NetworkDemo />
      </SimulationProvider>
    );
    expect(screen.getByTestId('timeline-control')).toBeInTheDocument();
  });

  it('includes EventLog component', async () => {
    const { NetworkDemo } = await import('../../src/demos/network');
    render(
      <SimulationProvider tickFn={(e: unknown) => e}>
        <NetworkDemo />
      </SimulationProvider>
    );
    expect(screen.getByTestId('event-log')).toBeInTheDocument();
  });

  it('includes EntityInspector component', async () => {
    const { NetworkDemo } = await import('../../src/demos/network');
    render(
      <SimulationProvider tickFn={(e: unknown) => e}>
        <NetworkDemo />
      </SimulationProvider>
    );
    expect(screen.getByTestId('entity-inspector')).toBeInTheDocument();
  });

  it('opinionTick updates node opinions', async () => {
    const { opinionTick } = await import('../../src/demos/network/simulation');

    const initial = {
      nodes: [
        { id: '0', group: 0, opinion: 0.2 },
        { id: '1', group: 0, opinion: 0.8 },
      ],
      links: [{ source: '0', target: '1' }],
    };

    const params = {
      confidenceThreshold: 1.0, // high threshold so opinions always interact
      convergenceRate: 0.5,
      interactionsPerTick: 10,
      nodeCount: 2,
      connectionsPerNode: 1,
      mediaNode: false,
      mediaBias: 0.8,
      mediaReach: 0.5,
    };

    const next = opinionTick(initial, params);
    expect(next.nodes).toBeDefined();
    // With high threshold and convergence, opinions should have moved closer together
    const diff = Math.abs(next.nodes[0].opinion - next.nodes[1].opinion);
    expect(diff).toBeLessThan(0.6); // original diff was 0.6
  });
});

describe('DEMO-06: Network presets', () => {
  it('exports 4 presets', async () => {
    const { networkPresets } = await import('../../src/demos/network/presets');
    expect(networkPresets).toHaveLength(4);
  });

  it('presets have correct names', async () => {
    const { networkPresets } = await import('../../src/demos/network/presets');
    const names = networkPresets.map((p: { name: string }) => p.name);
    expect(names).toContain('Echo chambers');
    expect(names).toContain('Consensus');
    expect(names).toContain('Polarization');
    expect(names).toContain('Media influence');
  });

  it('Media influence preset has mediaNode: true', async () => {
    const { networkPresets } = await import('../../src/demos/network/presets');
    const media = networkPresets.find((p: { name: string }) => p.name === 'Media influence');
    expect(media).toBeDefined();
    expect(media!.parameters.mediaNode).toBe(true);
  });
});
