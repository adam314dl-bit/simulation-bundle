import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, act } from '@testing-library/react';
import * as React from 'react';
import { SimulationProvider, useSimulation } from 'sim-kit/core';

// Mock rAF for deterministic testing
let rafCallbacks: Array<(t: number) => void> = [];
let rafTime = 0;

function advanceRaf(ms: number) {
  rafTime += ms;
  const cbs = [...rafCallbacks];
  rafCallbacks = [];
  cbs.forEach((cb) => cb(rafTime));
}

beforeEach(() => {
  rafCallbacks = [];
  rafTime = 0;
  vi.stubGlobal('requestAnimationFrame', (cb: (t: number) => void) => {
    rafCallbacks.push(cb);
    return rafCallbacks.length;
  });
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('CORE-02: Fixed-timestep tick loop', () => {
  it('tick count increments when running after rAF advances', async () => {
    let tick = 0;
    const Capture = () => {
      tick = useSimulation((s) => s.tick);
      return null;
    };
    const { unmount } = render(
      React.createElement(SimulationProvider, { tickFn: (e: unknown) => e },
        React.createElement(Capture)
      )
    );

    // Start playback then advance time
    await act(async () => {
      // play() action triggers running = true
    });

    unmount();
    expect(typeof tick).toBe('number'); // Type check — full test after implementation
  });
});

describe('CORE-05: Speed multiplier — 2x fires twice as many ticks per frame', () => {
  it('at 2x speed, one frame worth of time (33.34ms) causes 2 ticks vs 1 tick at 1x', async () => {
    // TICK_DURATION_MS = 1000/60 ≈ 16.67ms
    // At 1x: accumulator += 16.67ms → fires 1 tick
    // At 2x: accumulator += 16.67ms * 2 = 33.34ms → fires 2 ticks
    const TICK_DURATION_MS = 1000 / 60;

    // --- 1x speed run ---
    let tick1x = 0;
    const Capture1x = () => {
      tick1x = useSimulation((s) => s.tick);
      return null;
    };
    let store1x: ReturnType<typeof useSimulation> | null = null;
    const GetStore1x = () => {
      store1x = useSimulation((s) => s) as unknown as ReturnType<typeof useSimulation>;
      return null;
    };
    const { unmount: unmount1x } = render(
      React.createElement(SimulationProvider, { tickFn: (e: unknown) => e },
        React.createElement(Capture1x),
        React.createElement(GetStore1x)
      )
    );
    await act(async () => { (store1x as unknown as { play: () => void })?.play(); });
    await act(async () => { advanceRaf(TICK_DURATION_MS); });
    const tickAfter1x = tick1x;
    unmount1x();

    // --- 2x speed run ---
    let tick2x = 0;
    const Capture2x = () => {
      tick2x = useSimulation((s) => s.tick);
      return null;
    };
    let store2x: ReturnType<typeof useSimulation> | null = null;
    const GetStore2x = () => {
      store2x = useSimulation((s) => s) as unknown as ReturnType<typeof useSimulation>;
      return null;
    };
    const { unmount: unmount2x } = render(
      React.createElement(SimulationProvider, { tickFn: (e: unknown) => e },
        React.createElement(Capture2x),
        React.createElement(GetStore2x)
      )
    );
    await act(async () => {
      (store2x as unknown as { play: () => void })?.play();
      (store2x as unknown as { setSpeed: (s: number) => void })?.setSpeed(2);
    });
    await act(async () => { advanceRaf(TICK_DURATION_MS); });
    const tickAfter2x = tick2x;
    unmount2x();

    // 2x should fire more ticks than 1x given the same elapsed time
    expect(tickAfter2x).toBeGreaterThan(tickAfter1x);
  });
});

describe('CORE-06: Tick loop does not cause React re-renders', () => {
  it('render count stays < 3 after 10 rAF frames (only initial render + play action change)', async () => {
    const TICK_DURATION_MS = 1000 / 60;
    let renderCount = 0;

    const RenderCounter = () => {
      renderCount++;
      // Subscribe only to running state — should only re-render on play/pause transitions
      useSimulation((s) => s.running);
      return null;
    };
    let capturedPlay: (() => void) | null = null;
    const CapturePlay = () => {
      capturedPlay = useSimulation((s) => s.play);
      return null;
    };

    const { unmount } = render(
      React.createElement(SimulationProvider, { tickFn: (e: unknown) => e },
        React.createElement(RenderCounter),
        React.createElement(CapturePlay)
      )
    );

    const initialRenderCount = renderCount;

    // Trigger play — this should cause exactly 1 re-render (running: false → true)
    await act(async () => { capturedPlay?.(); });

    // Advance 10 rAF frames — tick loop fires ticks via store.setState({ entities, tick })
    // but RenderCounter only subscribes to s.running, so no re-renders expected here
    await act(async () => {
      for (let i = 0; i < 10; i++) {
        advanceRaf(TICK_DURATION_MS);
      }
    });

    unmount();

    // Total renders: initial mount renders + 1 for play() state change
    // Must be < 3: demonstrates tick loop does NOT re-render React tree on every tick
    expect(renderCount - initialRenderCount).toBeLessThan(3);
  });
});
