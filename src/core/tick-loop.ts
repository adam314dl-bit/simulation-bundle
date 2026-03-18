import type { StoreApi } from 'zustand/vanilla';
import type { SimStore } from './store';

const TICK_DURATION_MS = 1000 / 60; // 16.67ms per tick at 1x speed
const MAX_DELTA_MS = 250; // Clamp: prevents spiral-of-death after tab unfocus

/**
 * Starts the requestAnimationFrame tick loop for a SimulationProvider instance.
 * Uses vanilla Zustand API (getState/setState) -- never React hooks.
 * Returns a cleanup function that cancels the loop.
 *
 * CORE-02: Fixed-timestep accumulator pattern
 * CORE-05: Speed multiplier via accumulator scaling
 * CORE-06: No React re-renders from tick loop (getState/setState bypass React)
 */
export function startTickLoop<TEntities>(
  store: StoreApi<SimStore<TEntities>>,
  keepRunning?: boolean
): () => void {
  let rafId: number;
  let lastTime = 0;
  let accumulator = 0;

  const loop = (timestamp: number) => {
    const rawDelta = timestamp - lastTime;
    lastTime = timestamp;

    // Clamp delta to prevent catchup after long gaps (background tab resume, etc.)
    const delta = Math.min(rawDelta, MAX_DELTA_MS);
    const { running, speed } = store.getState();

    if (running) {
      accumulator += delta * speed;

      while (accumulator >= TICK_DURATION_MS) {
        const currentState = store.getState();
        const nextEntities = currentState.tickFn(currentState.entities, currentState.parameters);
        currentState.history.push(nextEntities);
        store.setState({
          entities: nextEntities,
          tick: currentState.tick + 1,
        });
        accumulator -= TICK_DURATION_MS;
      }
    }

    rafId = requestAnimationFrame(loop);
  };

  rafId = requestAnimationFrame(loop);

  // Background tab pause: reset accumulator to prevent catch-up jank on tab return
  const onVisibilityChange = () => {
    if (document.hidden && !keepRunning) {
      store.setState({ running: false });
      lastTime = 0;
      accumulator = 0;
    }
  };

  document.addEventListener('visibilitychange', onVisibilityChange);

  return () => {
    cancelAnimationFrame(rafId);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  };
}
