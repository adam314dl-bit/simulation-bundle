// src/demos/network/index.tsx
// Social network demo: bounded confidence opinion dynamics on a
// Barabasi-Albert scale-free graph with ForceGraph visualization,
// EntityInspector for node selection, and 4 presets.

import { useState, useEffect, useRef } from 'react';
import { SimulationProvider } from '../../core/SimulationProvider';
import { useSimulation } from '../../core/useSimulation';
import { ForceGraph } from '../../rendering/ForceGraph';
import { ParameterPanel } from '../../controls/ParameterPanel';
import { TimelineControl } from '../../controls/TimelineControl';
import { PresetSelector } from '../../controls/PresetSelector';
import { EventLog } from '../../data/EventLog';
import { EntityInspector } from '../../data/EntityInspector';
import { StatsPanel } from '../../data/StatsPanel';
import { MiniChart } from '../../data/MiniChart';
import { DemoLayout } from '../shared/DemoLayout';
import type { GraphNode } from '../../rendering/types';
import type { NetworkEntities } from './simulation';
import { opinionTick, networkSchema, createNetwork } from './simulation';
import { networkPresets } from './presets';

/**
 * Inner component that uses useSimulation -- must be inside SimulationProvider.
 */
function NetworkDemoInner() {
  const entities = useSimulation((s) => s.entities) as NetworkEntities;
  const logEvent = useSimulation((s) => s.logEvent);

  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  // Track opinion history for EntityInspector charts
  const opinionHistoryRef = useRef<Record<string, number[]>>({});

  // Track previous stats for event detection
  const prevClustersRef = useRef<number>(entities.stats?.clusters ?? 0);
  const prevNodeOpinionsRef = useRef<Map<string, number>>(new Map());

  // Update opinion history when entities change
  useEffect(() => {
    if (!entities?.nodes) return;

    // Update opinion history for all nodes
    for (const node of entities.nodes) {
      const history = opinionHistoryRef.current[node.id] ?? [];
      history.push(node.opinion as number);
      // Keep last 50 values
      if (history.length > 50) history.shift();
      opinionHistoryRef.current[node.id] = history;
    }

    // Event detection: cluster count change
    const currentClusters = entities.stats?.clusters ?? 0;
    if (currentClusters !== prevClustersRef.current && entities.stats?.tick > 0) {
      logEvent({
        tick: entities.stats.tick,
        type: 'cluster-change',
        severity: 'info',
        message: `Clusters: ${currentClusters}`,
      });
    }
    prevClustersRef.current = currentClusters;

    // Event detection: near consensus
    if ((entities.stats?.variance ?? 1) < 0.01 && entities.stats?.tick > 0) {
      // Only log once per consensus event
      if (prevClustersRef.current > 0) {
        logEvent({
          tick: entities.stats.tick,
          type: 'consensus',
          severity: 'warning',
          message: 'Near consensus reached',
        });
      }
    }

    // Event detection: dramatic opinion shift
    for (const node of entities.nodes) {
      const prevOpinion = prevNodeOpinionsRef.current.get(node.id);
      const currentOpinion = node.opinion as number;
      if (prevOpinion !== undefined) {
        if (
          (prevOpinion < 0.3 && currentOpinion > 0.7) ||
          (prevOpinion > 0.7 && currentOpinion < 0.3)
        ) {
          logEvent({
            tick: entities.stats?.tick ?? 0,
            type: 'opinion-shift',
            severity: 'warning',
            message: `Node ${node.id} opinion shifted dramatically`,
          });
        }
      }
      prevNodeOpinionsRef.current.set(node.id, currentOpinion);
    }
  }, [entities, logEvent]);

  // Build selected node entity data for EntityInspector
  const selectedEntityData = selectedNode
    ? {
        id: selectedNode.id,
        opinion: (selectedNode.opinion as number).toFixed(3),
        group: selectedNode.group ?? 0,
        connections: entities.links.filter((l) => {
          const srcId =
            typeof l.source === 'string' ? l.source : l.source.id;
          const tgtId =
            typeof l.target === 'string' ? l.target : l.target.id;
          return srcId === selectedNode.id || tgtId === selectedNode.id;
        }).length,
      }
    : { id: '-', opinion: '-', group: '-', connections: '-' };

  // Stats for StatsPanel
  const stats = [
    {
      label: 'Avg Opinion',
      value: entities.stats?.avgOpinion ?? 0,
      format: { maximumFractionDigits: 3 } as Intl.NumberFormatOptions,
    },
    {
      label: 'Clusters',
      value: entities.stats?.clusters ?? 0,
    },
    {
      label: 'Variance',
      value: entities.stats?.variance ?? 0,
      format: { maximumFractionDigits: 4 } as Intl.NumberFormatOptions,
    },
  ];

  return (
    <DemoLayout
      title="Social Network - Opinion Dynamics"
      renderer={
        <div data-testid="force-graph">
          <ForceGraph
            nodes={entities.nodes ?? []}
            links={entities.links ?? []}
            charge={-30}
            linkDistance={40}
            centerStrength={0.1}
            collisionRadius={8}
            nodeColor={(node: GraphNode) =>
              node.color as string ??
              `rgb(${Math.round((node.opinion as number) * 255)}, 0, ${Math.round((1 - (node.opinion as number)) * 255)})`
            }
            nodeRadius={(node: GraphNode) =>
              node.id === 'media' ? 12 : 8
            }
            onNodeClick={(node: GraphNode) => setSelectedNode(node)}
            onNodeHover={() => {
              // cursor feedback handled by ForceGraph internally
            }}
          />
        </div>
      }
      sidebar={
        <>
          <div data-testid="preset-selector" style={{ marginBottom: 16 }}>
            <PresetSelector
              presets={networkPresets}
              variant="pills"
            />
          </div>
          <ParameterPanel schema={networkSchema} />
          <div style={{ marginTop: 16 }}>
            <EntityInspector
              entity={selectedEntityData}
              title="Node Inspector"
              position="right"
              chartKeys={['opinion']}
              chartData={
                selectedNode
                  ? {
                      opinion:
                        opinionHistoryRef.current[selectedNode.id] ?? [],
                    }
                  : {}
              }
            />
          </div>
        </>
      }
      bottom={
        <>
          <StatsPanel stats={stats} />
          <MiniChart
            selector={(s: Record<string, unknown>) => {
              const ent = s.entities as NetworkEntities | undefined;
              return ent?.stats?.avgOpinion ?? 0;
            }}
            label="Avg Opinion"
            color="var(--sim-accent)"
          />
          <div data-testid="event-log">
            <EventLog maxHeight={200} />
          </div>
        </>
      }
      timeline={
        <div data-testid="timeline-control">
          <TimelineControl />
        </div>
      }
    />
  );
}

/**
 * NetworkDemo: Self-contained social network opinion dynamics demo.
 * Creates its own SimulationProvider with opinionTick and networkSchema.
 */
export function NetworkDemo() {
  const initialEntities = createNetwork(50, 3, false, 0.8, 0.5);

  return (
    <SimulationProvider
      tickFn={opinionTick}
      initialEntities={initialEntities}
      parameters={networkSchema}
    >
      <NetworkDemoInner />
    </SimulationProvider>
  );
}
