// src/demos/particles/index.tsx
// Particles demo: N-body + Boids with click-to-place attractors (DEMO-03, DEMO-04)

import { useState, useRef, useCallback } from 'react';
import { SimulationProvider } from '../../core/SimulationProvider';
import { useSimulation } from '../../core/useSimulation';
import { DemoLayout } from '../shared/DemoLayout';
import { ParticleRenderer } from '../../rendering/ParticleRenderer';
import { ParameterPanel } from '../../controls/ParameterPanel';
import { PlaybackBar } from '../../controls/PlaybackBar';
import { StatsPanel } from '../../data/StatsPanel';
import type { TickFn, ParameterValue } from '../../types/index';
import type { StatConfig } from '../../data/types';
import { particleTick, particleSchema, createParticles } from './simulation';
import type { ParticleEntities, Attractor } from './simulation';
import { particlePresets } from './presets';

export { particleTick, particleSchema, createParticles } from './simulation';
export type { ParticleEntities, Attractor } from './simulation';
export { particlePresets } from './presets';

const MAX_ATTRACTORS = 5;

// Triangle vertices for Orbit chaos preset auto-placed attractors
const ORBIT_ATTRACTORS: Attractor[] = [
  { x: 0, y: 0.5, strength: 1.0 },
  { x: -0.433, y: -0.25, strength: 1.0 },
  { x: 0.433, y: -0.25, strength: 1.0 },
];

// Pattern map: preset name -> initial particle distribution
function patternForPreset(presetConfig: Record<string, ParameterValue>): 'random' | 'ring' | 'burst' {
  const p = presetConfig._pattern as string | undefined;
  if (p === 'ring' || p === 'burst') return p;
  return 'random';
}

/**
 * ParticlesDemo: N-body + Boids particle simulation with click-to-place attractors.
 * Self-contained component with its own SimulationProvider.
 */
export function ParticlesDemo() {
  const attractorsRef = useRef<Attractor[]>([]);
  const [trailsEnabled, setTrailsEnabled] = useState(true);
  const [blendMode, setBlendMode] = useState<'additive' | 'normal'>('additive');
  const [initialEntities, setInitialEntities] = useState<ParticleEntities>(() =>
    createParticles(1000, 'ring'),
  );

  // Wrap particleTick to inject current attractors from ref
  const wrappedTick = useCallback<TickFn<ParticleEntities>>(
    (entities, params) => {
      return particleTick(
        { ...entities, attractors: attractorsRef.current! },
        params,
      );
    },
    [],
  );

  // Handle preset selection: update trails/blend, reset attractors, reinit particles
  const handlePresetSelect = useCallback(
    (presetIndex: number) => {
      const preset = particlePresets[presetIndex];
      if (!preset) return;

      const config = preset.config;

      // Update renderer props from preset metadata
      setTrailsEnabled(config._trails === true);
      setBlendMode(
        config._blendMode === 'additive' ? 'additive' : 'normal',
      );

      // Determine particle count and pattern
      const count = parseInt(config.particleCount as string, 10) || 1000;
      const pattern = patternForPreset(config);

      // Reset attractors (auto-place for Orbit chaos)
      if (preset.name === 'Orbit chaos') {
        attractorsRef.current = [...ORBIT_ATTRACTORS];
      } else {
        attractorsRef.current = [];
      }

      // Reinitialize particles with new pattern
      const newEntities = createParticles(count, pattern);
      newEntities.attractors = attractorsRef.current;
      setInitialEntities(newEntities);
    },
    [],
  );

  // We need to listen for preset changes. PresetSelector calls setParameter
  // internally. We use a key to force remount of SimulationProvider when
  // initialEntities changes (new preset selected).
  const [providerKey, setProviderKey] = useState(0);

  // Override handlePresetSelect to also bump provider key
  const onPresetSelect = useCallback(
    (index: number) => {
      handlePresetSelect(index);
      setProviderKey((k) => k + 1);
    },
    [handlePresetSelect],
  );

  // We need PresetSelector to call our handler. Since PresetSelector uses
  // useSimulation internally and doesn't support an external onSelect callback,
  // we need to handle it differently. The approach: use a PresetSelector that
  // applies params (it does this internally), and we track preset changes via state.
  // But for reinitializing, we need the provider to remount.
  //
  // Simplification: We won't use PresetSelector's internal setParameter.
  // Instead, we render custom preset cards that call our onPresetSelect.

  return (
    <SimulationProvider
      key={providerKey}
      tickFn={wrappedTick}
      initialEntities={initialEntities}
      parameters={particleSchema}
    >
      <ParticlesDemoWithPresets
        trailsEnabled={trailsEnabled}
        blendMode={blendMode}
        attractorsRef={attractorsRef}
        onPresetSelect={onPresetSelect}
      />
    </SimulationProvider>
  );
}

/**
 * Inner component that wires preset selection.
 * Renders PresetSelector with custom handling.
 */
function ParticlesDemoWithPresets({
  trailsEnabled,
  blendMode,
  attractorsRef,
  onPresetSelect,
}: {
  trailsEnabled: boolean;
  blendMode: 'additive' | 'normal';
  attractorsRef: React.RefObject<Attractor[]>;
  onPresetSelect: (index: number) => void;
}) {
  const entities = useSimulation((s) => s.entities) as ParticleEntities;

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const worldX = ((e.clientX - rect.left) / rect.width) * 4 - 2;
      const worldY = ((e.clientY - rect.top) / rect.height) * 4 - 2;

      const attractors = attractorsRef.current!;
      if (attractors.length >= MAX_ATTRACTORS) {
        attractors.shift();
      }
      attractors.push({ x: worldX, y: worldY, strength: 1.0 });
    },
    [attractorsRef],
  );

  const stats: StatConfig[] = [
    { label: 'Particles', value: entities.count },
    {
      label: 'Avg Speed',
      value: entities.stats.avgSpeed,
      format: { maximumFractionDigits: 3 },
    },
    { label: 'Attractors', value: entities.attractors.length },
  ];

  const [activePreset, setActivePreset] = useState<number | null>(0);

  return (
    <DemoLayout
      title="Particles"
      renderer={
        <div
          data-testid="particle-renderer"
          onClick={handleClick}
          style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
        >
          <ParticleRenderer
            data={entities.particles}
            count={entities.count}
            pointSize={2}
            colorRamp="inferno"
            trails={trailsEnabled}
            blendMode={blendMode}
            trailAlpha={0.05}
          />
        </div>
      }
      sidebar={
        <>
          <PresetCards
            activePreset={activePreset}
            onSelect={(index) => {
              setActivePreset(index);
              onPresetSelect(index);
            }}
          />
          <div style={{ marginTop: 16 }}>
            <ParameterPanel schema={particleSchema} />
          </div>
        </>
      }
      bottom={<StatsPanel stats={stats} columns={1} />}
      timeline={<PlaybackBar />}
    />
  );
}

/**
 * Custom preset cards that call an external handler instead of
 * relying on PresetSelector's internal setParameter.
 */
function PresetCards({
  activePreset,
  onSelect,
}: {
  activePreset: number | null;
  onSelect: (index: number) => void;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '8px',
      }}
    >
      {particlePresets.map((preset, index) => {
        const isActive = index === activePreset;
        return (
          <button
            key={preset.name}
            data-active={isActive}
            onClick={() => onSelect(index)}
            style={{
              padding: '12px 16px',
              borderRadius: 'var(--sim-radius-md)',
              textAlign: 'left' as const,
              background: isActive
                ? 'var(--sim-accent)'
                : 'var(--sim-surface)',
              color: isActive ? 'white' : 'var(--sim-text)',
              border: `1px solid ${isActive ? 'var(--sim-accent)' : 'var(--sim-border)'}`,
              cursor: 'pointer',
            }}
          >
            <div style={{ fontWeight: 600, fontSize: '14px' }}>
              {preset.name}
            </div>
            {preset.description ? (
              <div
                style={{
                  fontSize: '12px',
                  color: isActive
                    ? 'rgba(255,255,255,0.8)'
                    : 'var(--sim-text-muted)',
                  marginTop: '4px',
                }}
              >
                {preset.description}
              </div>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
