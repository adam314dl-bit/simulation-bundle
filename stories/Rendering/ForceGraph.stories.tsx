import type { Meta, StoryObj } from '@storybook/react';
import { ForceGraph } from '../../src/rendering/ForceGraph';
import type { GraphNode, GraphLink } from '../../src/rendering/types';
import { useMemo } from 'react';

function generateGraph(nodeCount: number, linkCount: number) {
  const nodes: GraphNode[] = Array.from({ length: nodeCount }, (_, i) => ({
    id: `node-${i}`,
    label: `N${i}`,
    group: Math.floor(Math.random() * 4),
  }));

  const links: GraphLink[] = [];
  const seen = new Set<string>();
  for (let i = 0; i < linkCount; i++) {
    const a = Math.floor(Math.random() * nodeCount);
    let b = Math.floor(Math.random() * nodeCount);
    if (a === b) b = (b + 1) % nodeCount;
    const key = `${Math.min(a, b)}-${Math.max(a, b)}`;
    if (!seen.has(key)) {
      seen.add(key);
      links.push({ source: `node-${a}`, target: `node-${b}` });
    }
  }
  return { nodes, links };
}

function ForceGraphDemo({
  charge,
  linkDistance,
  centerStrength,
  collisionRadius,
}: {
  charge: number;
  linkDistance: number;
  centerStrength: number;
  collisionRadius: number;
}) {
  const { nodes, links } = useMemo(() => generateGraph(20, 30), []);

  return (
    <ForceGraph
      nodes={nodes}
      links={links}
      width={600}
      height={400}
      charge={charge}
      linkDistance={linkDistance}
      centerStrength={centerStrength}
      collisionRadius={collisionRadius}
      nodeLabel={(n) => n.label ?? n.id}
      onNodeClick={(n) => console.log('Clicked:', n.id)}
    />
  );
}

const meta: Meta<typeof ForceGraphDemo> = {
  title: 'Rendering/ForceGraph',
  component: ForceGraphDemo,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    charge: { control: { type: 'range', min: -100, max: 0, step: 5 } },
    linkDistance: { control: { type: 'range', min: 10, max: 100, step: 5 } },
    centerStrength: { control: { type: 'range', min: 0, max: 2, step: 0.1 } },
    collisionRadius: { control: { type: 'range', min: 0, max: 30, step: 2 } },
  },
};
export default meta;

type Story = StoryObj<typeof ForceGraphDemo>;

export const Default: Story = {
  args: {
    charge: -30,
    linkDistance: 40,
    centerStrength: 0.1,
    collisionRadius: 8,
  },
};
