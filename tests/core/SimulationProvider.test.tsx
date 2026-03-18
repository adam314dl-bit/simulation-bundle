import { describe, it, expect } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { SimulationProvider, useSimulation } from 'sim-kit/core';

describe('CORE-01: SimulationProvider renders children', () => {
  it('renders children without crashing', () => {
    render(
      <SimulationProvider tickFn={(entities: unknown) => entities}>
        <div data-testid="child">hello</div>
      </SimulationProvider>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('throws when useSimulation is called outside provider', () => {
    const Broken = () => {
      useSimulation((s) => s.tick);
      return null;
    };
    expect(() => render(<Broken />)).toThrow('useSimulation must be used inside SimulationProvider');
  });
});

describe('CORE-04: useSimulation hook API', () => {
  it('exposes play, pause, step, stepBack, setSpeed, setParameter, resetParameters, seekToTick, logEvent actions', () => {
    let capturedApi: Record<string, unknown> = {};
    const Capture = () => {
      capturedApi = useSimulation((s) => ({
        play: s.play,
        pause: s.pause,
        step: s.step,
        stepBack: s.stepBack,
        setSpeed: s.setSpeed,
        setParameter: s.setParameter,
        resetParameters: s.resetParameters,
        seekToTick: s.seekToTick,
        logEvent: s.logEvent,
        subscribe: s.subscribe,
      }));
      return null;
    };
    render(
      <SimulationProvider tickFn={(e: unknown) => e}>
        <Capture />
      </SimulationProvider>
    );
    expect(typeof capturedApi.play).toBe('function');
    expect(typeof capturedApi.pause).toBe('function');
    expect(typeof capturedApi.step).toBe('function');
    expect(typeof capturedApi.stepBack).toBe('function');
    expect(typeof capturedApi.setSpeed).toBe('function');
    expect(typeof capturedApi.setParameter).toBe('function');
    expect(typeof capturedApi.resetParameters).toBe('function');
    expect(typeof capturedApi.seekToTick).toBe('function');
    expect(typeof capturedApi.logEvent).toBe('function');
    expect(typeof capturedApi.subscribe).toBe('function');
  });
});
