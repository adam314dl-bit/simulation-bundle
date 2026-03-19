// src/demos/network/simulation.ts
// Opinion dynamics simulation using the Deffuant bounded confidence model
// on a Barabasi-Albert scale-free graph.

import type { TickFn, ParameterSchema } from '../../types/index';
import type { GraphNode, GraphLink } from '../../rendering/types';

/** Network simulation entity state */
export interface NetworkEntities {
  nodes: GraphNode[];
  links: GraphLink[];
  stats: {
    avgOpinion: number;
    clusters: number;
    variance: number;
    tick: number;
  };
}

/**
 * Generate a scale-free graph using the Barabasi-Albert preferential attachment algorithm.
 * @param n Total number of nodes
 * @param m Number of edges each new node creates (also seed = complete graph of m+1 nodes)
 */
export function generateScaleFreeGraph(
  n: number,
  m: number,
): { nodes: GraphNode[]; links: GraphLink[] } {
  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const degree: number[] = [];

  // Seed: complete graph of m+1 nodes
  for (let i = 0; i <= m; i++) {
    nodes.push({ id: `${i}`, group: 0, opinion: Math.random() });
    degree.push(m); // each node in complete graph has degree m
    for (let j = 0; j < i; j++) {
      links.push({ source: `${i}`, target: `${j}` });
    }
  }

  // Preferential attachment: each new node connects to m existing nodes
  for (let i = m + 1; i < n; i++) {
    nodes.push({ id: `${i}`, group: 0, opinion: Math.random() });
    degree.push(0);

    const totalDegree = degree.reduce((a, b) => a + b, 0);
    const targets = new Set<number>();

    while (targets.size < m) {
      let r = Math.random() * totalDegree;
      let cumulative = 0;
      for (let j = 0; j < i; j++) {
        cumulative += (degree[j] ?? 0);
        if (cumulative > r) {
          targets.add(j);
          break;
        }
      }
    }

    for (const t of targets) {
      links.push({ source: `${i}`, target: `${t}` });
      degree[i] = (degree[i] ?? 0) + 1;
      degree[t] = (degree[t] ?? 0) + 1;
    }
  }

  return { nodes, links };
}

/** Parameter schema for the network demo: 8 parameters */
export const networkSchema: ParameterSchema = {
  nodeCount: {
    type: 'select',
    options: ['30', '50', '100', '200'],
    default: '50',
    label: 'Node Count',
  },
  connectionsPerNode: {
    type: 'range',
    min: 1,
    max: 5,
    step: 1,
    default: 3,
    label: 'Connections/Node',
  },
  confidenceThreshold: {
    type: 'range',
    min: 0.05,
    max: 1.0,
    step: 0.05,
    default: 0.3,
    label: 'Confidence Threshold',
  },
  convergenceRate: {
    type: 'range',
    min: 0.01,
    max: 0.5,
    step: 0.01,
    default: 0.1,
    label: 'Convergence Rate',
  },
  interactionsPerTick: {
    type: 'range',
    min: 1,
    max: 20,
    step: 1,
    default: 5,
    label: 'Interactions/Tick',
  },
  mediaNode: {
    type: 'toggle',
    default: false,
    label: 'Media Node',
  },
  mediaBias: {
    type: 'range',
    min: 0,
    max: 1,
    step: 0.05,
    default: 0.8,
    label: 'Media Bias',
  },
  mediaReach: {
    type: 'range',
    min: 0.1,
    max: 1.0,
    step: 0.05,
    default: 0.5,
    label: 'Media Reach',
  },
};

/** Compute stats from node opinions */
function computeStats(
  nodes: GraphNode[],
  tick: number,
): NetworkEntities['stats'] {
  const opinions = nodes.map((n) => n.opinion as number);
  const avg = opinions.reduce((a, b) => a + b, 0) / opinions.length;

  // Variance (standard deviation)
  const variance = Math.sqrt(
    opinions.reduce((sum, o) => sum + (o - avg) ** 2, 0) / opinions.length,
  );

  // Clusters: group = Math.floor(opinion * 5), count groups with >= 3 members
  const groupCounts = new Map<number, number>();
  for (const o of opinions) {
    const g = Math.min(Math.floor(o * 5), 4);
    groupCounts.set(g, (groupCounts.get(g) ?? 0) + 1);
  }
  let clusters = 0;
  for (const count of groupCounts.values()) {
    if (count >= 3) clusters++;
  }

  return { avgOpinion: avg, clusters, variance, tick };
}

/**
 * Create a network with optional media node.
 */
export function createNetwork(
  nodeCount: number,
  m: number,
  mediaEnabled: boolean,
  mediaBias: number,
  mediaReach: number,
): NetworkEntities {
  const { nodes, links } = generateScaleFreeGraph(nodeCount, m);

  if (mediaEnabled) {
    // Add a special media node with fixed opinion
    nodes.push({
      id: 'media',
      group: 99,
      opinion: mediaBias,
      radius: 12,
      label: 'Media',
    });

    // Connect media node to a fraction of random nodes
    const targetCount = Math.floor(nodeCount * mediaReach);
    const indices = Array.from({ length: nodeCount }, (_, i) => i);
    // Fisher-Yates shuffle to pick random subset
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = indices[i]!;
      indices[i] = indices[j]!;
      indices[j] = tmp;
    }
    for (let i = 0; i < targetCount && i < indices.length; i++) {
      links.push({ source: 'media', target: `${indices[i]!}` });
    }
  }

  // Assign initial groups and colors based on opinion
  for (const node of nodes) {
    const o = node.opinion as number;
    node.group = Math.min(Math.floor(o * 5), 4);
    node.color = `rgb(${Math.round(o * 255)}, 0, ${Math.round((1 - o) * 255)})`;
  }

  const stats = computeStats(nodes, 0);
  return { nodes, links, stats };
}

/**
 * Opinion dynamics tick function implementing the Deffuant bounded confidence model.
 * For each tick, random pairs of connected nodes interact:
 *   If |opinion_i - opinion_j| < confidenceThreshold,
 *     both opinions move toward each other by convergenceRate * diff
 * Media node opinion stays fixed.
 */
export const opinionTick: TickFn<NetworkEntities> = (entities, params) => {
  const confidenceThreshold = params.confidenceThreshold as number;
  const convergenceRate = params.convergenceRate as number;
  const interactionsPerTick = params.interactionsPerTick as number;
  const mediaEnabled = params.mediaNode as boolean;
  const mediaBias = params.mediaBias as number;

  const { nodes, links, stats } = entities;

  // Deep copy nodes to avoid mutation
  const nextNodes = nodes.map((n) => ({ ...n }));

  // Build a map for fast ID lookup
  const nodeMap = new Map<string, GraphNode>();
  for (const node of nextNodes) {
    nodeMap.set(node.id, node);
  }

  // Random interactions along existing links
  for (let k = 0; k < interactionsPerTick; k++) {
    if (links.length === 0) break;
    const link = links[Math.floor(Math.random() * links.length)]!;
    const srcId = typeof link.source === 'string' ? link.source : link.source.id;
    const tgtId = typeof link.target === 'string' ? link.target : link.target.id;
    const nodeI = nodeMap.get(srcId);
    const nodeJ = nodeMap.get(tgtId);
    if (!nodeI || !nodeJ) continue;

    const opI = nodeI.opinion as number;
    const opJ = nodeJ.opinion as number;

    if (Math.abs(opI - opJ) < confidenceThreshold) {
      const diff = opJ - opI;
      // Update opinions, but media node stays fixed
      if (nodeI.id !== 'media') {
        (nodeI as Record<string, unknown>).opinion = opI + convergenceRate * diff;
      }
      if (nodeJ.id !== 'media') {
        (nodeJ as Record<string, unknown>).opinion = opJ - convergenceRate * diff;
      }
    }
  }

  // If media node is enabled, ensure its opinion stays fixed
  if (mediaEnabled) {
    const mediaNode = nodeMap.get('media');
    if (mediaNode) {
      (mediaNode as Record<string, unknown>).opinion = mediaBias;
    }
  }

  // Update groups and colors by opinion
  for (const node of nextNodes) {
    const o = node.opinion as number;
    node.group = Math.min(Math.floor(o * 5), 4);
    // Media node keeps its special group
    if (node.id === 'media') node.group = 99;
    node.color = `rgb(${Math.round(o * 255)}, 0, ${Math.round((1 - o) * 255)})`;
  }

  const currentTick = stats?.tick ?? 0;
  const nextStats = computeStats(nextNodes, currentTick + 1);

  return { nodes: nextNodes, links, stats: nextStats };
};
