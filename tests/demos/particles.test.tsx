// Requirement traceability: DEMO-03, DEMO-04
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

describe('DEMO-03: Particles demo', () => {
  it('renders ParticlesDemo without crashing', async () => {
    const { ParticlesDemo } = await import('../../src/demos/particles');
    render(
      <SimulationProvider tickFn={(e: unknown) => e}>
        <ParticlesDemo />
      </SimulationProvider>
    );
    expect(screen.getAllByText(/particles/i).length).toBeGreaterThan(0);
  });

  it('includes ParticleRenderer component', async () => {
    const { ParticlesDemo } = await import('../../src/demos/particles');
    const { container } = render(
      <SimulationProvider tickFn={(e: unknown) => e}>
        <ParticlesDemo />
      </SimulationProvider>
    );
    expect(container.querySelector('[data-testid="particle-renderer"]')).toBeInTheDocument();
  });

  it('includes ParameterPanel component', async () => {
    const { ParticlesDemo } = await import('../../src/demos/particles');
    render(
      <SimulationProvider tickFn={(e: unknown) => e}>
        <ParticlesDemo />
      </SimulationProvider>
    );
    expect(screen.getByTestId('parameter-panel')).toBeInTheDocument();
  });

  it('includes PlaybackBar component', async () => {
    const { ParticlesDemo } = await import('../../src/demos/particles');
    render(
      <SimulationProvider tickFn={(e: unknown) => e}>
        <ParticlesDemo />
      </SimulationProvider>
    );
    expect(screen.getByTestId('playback-bar')).toBeInTheDocument();
  });

  it('includes StatsPanel component', async () => {
    const { ParticlesDemo } = await import('../../src/demos/particles');
    render(
      <SimulationProvider tickFn={(e: unknown) => e}>
        <ParticlesDemo />
      </SimulationProvider>
    );
    expect(screen.getByTestId('stats-panel')).toBeInTheDocument();
  });

  it('particleTick returns Float32Array-based entities', async () => {
    const { particleTick } = await import('../../src/demos/particles/simulation');

    const initial = {
      particles: new Float32Array(4000), // 1000 particles * stride 4
      count: 1000,
      attractors: [],
      stats: { avgSpeed: 0, avgDistance: 0, tick: 0 },
    };

    const params = {
      gravity: 1.0,
      timeStep: 0.016,
      damping: 0.001,
      particleCount: 1000,
      boidsEnabled: false,
      separation: 1.5,
      alignment: 1.0,
      cohesion: 1.0,
    };

    const next = particleTick(initial, params);
    expect(next.particles).toBeInstanceOf(Float32Array);
  });
});

describe('DEMO-04: Particles presets', () => {
  it('exports 4 presets', async () => {
    const { particlePresets } = await import('../../src/demos/particles/presets');
    expect(particlePresets).toHaveLength(4);
  });

  it('presets have correct names', async () => {
    const { particlePresets } = await import('../../src/demos/particles/presets');
    const names = particlePresets.map((p: { name: string }) => p.name);
    expect(names).toContain('Galaxy spiral');
    expect(names).toContain('Boids flocking');
    expect(names).toContain('Orbit chaos');
    expect(names).toContain('Fireworks');
  });

  it('Galaxy spiral preset has trails: true and blendMode: additive', async () => {
    const { particlePresets } = await import('../../src/demos/particles/presets');
    const galaxy = particlePresets.find((p: { name: string }) => p.name === 'Galaxy spiral');
    expect(galaxy).toBeDefined();
    expect(galaxy!.config._trails).toBe(true);
    expect(galaxy!.config._blendMode).toBe('additive');
  });
});
