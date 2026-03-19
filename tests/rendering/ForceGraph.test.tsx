import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { render, cleanup, fireEvent, act } from '@testing-library/react';
import { ForceGraph } from '../../src/rendering/ForceGraph';
import type { GraphNode, GraphLink } from '../../src/rendering/types';

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const testNodes: GraphNode[] = [
  { id: 'a', group: 0 },
  { id: 'b', group: 0 },
  { id: 'c', group: 1 },
];

const testLinks: GraphLink[] = [
  { source: 'a', target: 'b' },
  { source: 'b', target: 'c' },
];

// ---------------------------------------------------------------------------
// Timer setup: d3-force uses internal timers, we need fake timers
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// Advance timers enough for d3-force simulation ticks + rAF batching
async function advanceSim(ms = 500): Promise<void> {
  await act(async () => {
    vi.advanceTimersByTime(ms);
  });
}

// ---------------------------------------------------------------------------
// REND-08: D3-force layout with React SVG
// ---------------------------------------------------------------------------

describe('REND-08: D3-force layout with React SVG', () => {
  it('renders SVG with circle elements for nodes', async () => {
    const { container } = render(
      <ForceGraph nodes={testNodes} links={testLinks} />,
    );
    await advanceSim();
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(3);
  });

  it('renders line or path elements for links', async () => {
    const { container } = render(
      <ForceGraph nodes={testNodes} links={testLinks} />,
    );
    await advanceSim();
    const lines = container.querySelectorAll('line');
    expect(lines.length).toBe(2);
  });

  it('does not use D3 DOM manipulation (SVG elements are React-rendered)', async () => {
    const { container } = render(
      <ForceGraph nodes={testNodes} links={testLinks} />,
    );
    await advanceSim();
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    const circles = svg!.querySelectorAll('circle');
    expect(circles.length).toBe(3);
    // Each circle should have data-node-id (React attribute)
    for (const c of circles) {
      expect(c.getAttribute('data-node-id')).toBeTruthy();
    }
  });

  it('positions nodes via d3-force simulation', async () => {
    const { container } = render(
      <ForceGraph nodes={testNodes} links={testLinks} />,
    );
    await advanceSim();
    const circles = container.querySelectorAll('circle');
    // After simulation ticks, at least one circle should have numeric cx/cy
    const cxValues = Array.from(circles).map((c) =>
      parseFloat(c.getAttribute('cx') ?? ''),
    );
    const validPositions = cxValues.filter((v) => !isNaN(v));
    expect(validPositions.length).toBeGreaterThan(0);
  });

  it('deep-clones input nodes to prevent mutation', async () => {
    const originalNodes: GraphNode[] = [
      { id: 'x', group: 0 },
      { id: 'y', group: 1 },
    ];
    const originalLinks: GraphLink[] = [{ source: 'x', target: 'y' }];

    render(
      <ForceGraph nodes={originalNodes} links={originalLinks} />,
    );
    await advanceSim();

    // d3-force would have set x, y, vx, vy on the node objects if not cloned
    expect(originalNodes[0]!.x).toBeUndefined();
    expect(originalNodes[0]!.y).toBeUndefined();
    expect(originalNodes[0]!.vx).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// REND-09: Interaction + configurable forces
// ---------------------------------------------------------------------------

describe('REND-09: Interaction + configurable forces', () => {
  it('fires onNodeClick on node click', async () => {
    const onClick = vi.fn();
    const { container } = render(
      <ForceGraph
        nodes={testNodes}
        links={testLinks}
        onNodeClick={onClick}
      />,
    );
    await advanceSim();

    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(3);
    fireEvent.click(circles[0]!);
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0]![0]).toHaveProperty('id');
  });

  it('fires onNodeHover on node pointer enter/leave', async () => {
    const onHover = vi.fn();
    const { container } = render(
      <ForceGraph
        nodes={testNodes}
        links={testLinks}
        onNodeHover={onHover}
      />,
    );
    await advanceSim();

    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBeGreaterThan(0);

    fireEvent.pointerEnter(circles[0]!);
    expect(onHover).toHaveBeenCalledWith(
      expect.objectContaining({ id: expect.any(String) }),
    );

    fireEvent.pointerLeave(circles[0]!);
    expect(onHover).toHaveBeenCalledWith(null);
  });

  it('accepts configurable force props without error', async () => {
    const { container } = render(
      <ForceGraph
        nodes={testNodes}
        links={testLinks}
        charge={-100}
        linkDistance={50}
        centerStrength={0.5}
        collisionRadius={10}
      />,
    );
    await advanceSim();
    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(3);
  });

  it('dims non-connected nodes on hover', async () => {
    const { container } = render(
      <ForceGraph nodes={testNodes} links={testLinks} />,
    );
    await advanceSim();

    const circles = container.querySelectorAll('circle');
    expect(circles.length).toBe(3);

    // Find node 'a' circle
    const nodeA = Array.from(circles).find(
      (c) => c.getAttribute('data-node-id') === 'a',
    )!;
    const nodeC = Array.from(circles).find(
      (c) => c.getAttribute('data-node-id') === 'c',
    )!;
    expect(nodeA).toBeTruthy();
    expect(nodeC).toBeTruthy();

    // Hover node 'a'
    await act(async () => {
      fireEvent.pointerEnter(nodeA);
    });
    await advanceSim(100);

    // Re-query after re-render
    const updatedCircles = container.querySelectorAll('circle');
    const updatedNodeC = Array.from(updatedCircles).find(
      (c) => c.getAttribute('data-node-id') === 'c',
    )!;
    const updatedNodeA = Array.from(updatedCircles).find(
      (c) => c.getAttribute('data-node-id') === 'a',
    )!;

    // Node 'c' is not connected to 'a' (only b-c link), so should be dimmed
    expect(updatedNodeC.getAttribute('opacity')).toBe('0.2');

    // Node 'a' should not be dimmed
    expect(updatedNodeA.getAttribute('opacity')).not.toBe('0.2');
  });
});

// ---------------------------------------------------------------------------
// REND-10: Auto-pause + Canvas2D mode
// ---------------------------------------------------------------------------

describe('REND-10: Auto-pause + Canvas2D mode', () => {
  it('calls onStabilize when simulation ends', async () => {
    // Test that the component wires up onStabilize to the simulation 'end' event.
    // We verify this by importing d3-force directly and checking the sim.on('end')
    // callback triggers onStabilize. Since d3-timer doesn't cooperate with fake
    // timers, we test the wiring by checking that the onStabilize prop is accepted
    // and the component configures alphaMin correctly.
    //
    // We render with alphaMin > 1.0 so the simulation immediately ends (alpha
    // starts at 1.0 which is below alphaMin=2.0). The manual sim.tick() in the
    // component sets positions and triggers the end event synchronously.
    const onStabilize = vi.fn();

    render(
      <ForceGraph
        nodes={testNodes}
        links={testLinks}
        onStabilize={onStabilize}
        alphaMin={2}
      />,
    );

    // The simulation was created with alphaMin=2 but alpha starts at 1.
    // d3-force's sim.tick() (called in useEffect) will detect alpha < alphaMin
    // and fire the 'end' event. Give a tick for the event to propagate.
    await advanceSim(100);

    expect(onStabilize).toHaveBeenCalled();
  });

  it('switches to Canvas2D when nodes exceed canvasThreshold', async () => {
    const manyNodes: GraphNode[] = Array.from({ length: 10 }, (_, i) => ({
      id: `n${i}`,
      group: 0,
    }));
    const manyLinks: GraphLink[] = [{ source: 'n0', target: 'n1' }];

    const { container } = render(
      <ForceGraph
        nodes={manyNodes}
        links={manyLinks}
        canvasThreshold={5}
      />,
    );
    await advanceSim();

    const canvas = container.querySelector('canvas');
    const svg = container.querySelector('svg');
    expect(canvas).toBeTruthy();
    expect(svg).toBeNull();
  });

  it('renders SVG when nodes below canvasThreshold', async () => {
    const { container } = render(
      <ForceGraph
        nodes={testNodes}
        links={testLinks}
        canvasThreshold={500}
      />,
    );
    await advanceSim();

    const svg = container.querySelector('svg');
    const canvas = container.querySelector('canvas');
    expect(svg).toBeTruthy();
    expect(canvas).toBeNull();
  });
});
