// src/demos/ecosystem/index.tsx
// EcosystemDemo: Lotka-Volterra predator-prey dashboard with full sim-kit component suite.

import { useEffect, useRef } from 'react';
import { SimulationProvider } from '../../core/SimulationProvider';
import { useSimulation } from '../../core/useSimulation';
import { GridRenderer } from '../../rendering/GridRenderer';
import { ParameterPanel } from '../../controls/ParameterPanel';
import { TimelineControl } from '../../controls/TimelineControl';
import { PresetSelector } from '../../controls/PresetSelector';
import { StatsPanel } from '../../data/StatsPanel';
import { MiniChart } from '../../data/MiniChart';
import { EventLog } from '../../data/EventLog';
import { DemoLayout } from '../shared/DemoLayout';

import { ecosystemTick, ecosystemSchema, createEcosystem } from './simulation';
import type { EcosystemEntities } from './simulation';
import { ecosystemPresets } from './presets';
import type { StatConfig } from '../../data/types';
import type { GridConfig } from '../../rendering/types';

// Selectors for MiniCharts -- defined outside component to keep stable references
const selectGrass = (s: { entities: EcosystemEntities }) => s.entities.stats.grass;
const selectRabbits = (s: { entities: EcosystemEntities }) => s.entities.stats.rabbits;
const selectFoxes = (s: { entities: EcosystemEntities }) => s.entities.stats.foxes;

function EcosystemDemoInner() {
  const entities = useSimulation((s) => s.entities) as EcosystemEntities;
  const logEvent = useSimulation((s) => s.logEvent);

  // Track previous stats for event detection
  const prevStatsRef = useRef(entities.stats);
  const historyRef = useRef<Array<{ grass: number; rabbits: number; foxes: number }>>([]);

  // Event logging: extinction, population boom, periodic snapshot
  useEffect(() => {
    const prev = prevStatsRef.current;
    const curr = entities.stats;
    prevStatsRef.current = curr;

    // Track last 10 ticks for boom detection
    historyRef.current.push({ grass: curr.grass, rabbits: curr.rabbits, foxes: curr.foxes });
    if (historyRef.current.length > 10) {
      historyRef.current.shift();
    }

    // Skip tick 0
    if (curr.tick === 0) return;

    // Extinction events
    if (curr.grass === 0 && prev.grass > 0) {
      logEvent({ tick: curr.tick, type: 'extinction', severity: 'critical', message: 'Grass extinct!' });
    }
    if (curr.rabbits === 0 && prev.rabbits > 0) {
      logEvent({ tick: curr.tick, type: 'extinction', severity: 'critical', message: 'Rabbits extinct!' });
    }
    if (curr.foxes === 0 && prev.foxes > 0) {
      logEvent({ tick: curr.tick, type: 'extinction', severity: 'critical', message: 'Foxes extinct!' });
    }

    // Population boom: species doubles compared to 10 ticks ago
    const history = historyRef.current;
    if (history.length >= 10) {
      const old = history[0]!;
      if (old.grass > 0 && curr.grass >= old.grass * 2) {
        logEvent({ tick: curr.tick, type: 'boom', severity: 'warning', message: 'Grass population boom' });
      }
      if (old.rabbits > 0 && curr.rabbits >= old.rabbits * 2) {
        logEvent({ tick: curr.tick, type: 'boom', severity: 'warning', message: 'Rabbits population boom' });
      }
      if (old.foxes > 0 && curr.foxes >= old.foxes * 2) {
        logEvent({ tick: curr.tick, type: 'boom', severity: 'warning', message: 'Foxes population boom' });
      }
    }

    // Periodic snapshot every 100 ticks
    if (curr.tick % 100 === 0) {
      logEvent({
        tick: curr.tick,
        type: 'snapshot',
        severity: 'info',
        message: `Tick ${curr.tick}: Grass=${curr.grass} Rabbits=${curr.rabbits} Foxes=${curr.foxes}`,
      });
    }
  }, [entities.stats, logEvent]);

  // Build grid config for GridRenderer
  const gridConfig: GridConfig = {
    data: entities.grid,
    width: entities.width,
    height: entities.height,
    cellSize: 4,
    colorRamp: 'category10',
  };

  // Build stats for StatsPanel
  const stats: StatConfig[] = [
    { label: 'Grass', value: entities.stats.grass },
    { label: 'Rabbits', value: entities.stats.rabbits },
    { label: 'Foxes', value: entities.stats.foxes },
  ];

  return (
    <DemoLayout
      title="Ecosystem: Lotka-Volterra Predator-Prey"
      renderer={
        <div data-testid="grid-renderer">
          <GridRenderer config={gridConfig} />
        </div>
      }
      sidebar={
        <>
          <div data-testid="preset-selector" style={{ marginBottom: 16 }}>
            <PresetSelector presets={ecosystemPresets} variant="pills" />
          </div>
          <ParameterPanel schema={ecosystemSchema} />
        </>
      }
      bottom={
        <>
          <StatsPanel stats={stats} columns={1} />
          <MiniChart
            selector={selectGrass as (s: Record<string, unknown>) => number}
            label="Grass"
            color="#4ade80"
            windowSize={50}
          />
          <MiniChart
            selector={selectRabbits as (s: Record<string, unknown>) => number}
            label="Rabbits"
            color="#a78bfa"
            windowSize={50}
          />
          <MiniChart
            selector={selectFoxes as (s: Record<string, unknown>) => number}
            label="Foxes"
            color="#f87171"
            windowSize={50}
          />
          <EventLog />
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

const initialEntities = createEcosystem(100, 100, 0.5);

export function EcosystemDemo() {
  return (
    <SimulationProvider
      tickFn={ecosystemTick}
      initialEntities={initialEntities}
      parameters={ecosystemSchema}
    >
      <EcosystemDemoInner />
    </SimulationProvider>
  );
}
