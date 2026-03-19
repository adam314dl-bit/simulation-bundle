// Requirement traceability: DOCS-01, DOCS-02, DOCS-03, DOCS-04, DOCS-05
import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const readmePath = resolve(__dirname, '../../README.md');

function getReadme(): string {
  if (!existsSync(readmePath)) {
    throw new Error('README.md does not exist');
  }
  return readFileSync(readmePath, 'utf-8');
}

describe('DOCS-01: Quick Start', () => {
  it('README.md exists', () => {
    expect(existsSync(readmePath)).toBe(true);
  });

  it('contains Quick Start heading', () => {
    const content = getReadme();
    expect(content).toMatch(/#+\s+Quick Start/);
  });

  it('contains npm install sim-kit', () => {
    const content = getReadme();
    expect(content).toContain('npm install sim-kit');
  });
});

describe('DOCS-02: Component Reference', () => {
  it('contains Component Reference heading', () => {
    const content = getReadme();
    expect(content).toMatch(/#+\s+Component Reference/);
  });

  it('mentions all 18 component names', () => {
    const content = getReadme();
    const components = [
      'SimulationProvider',
      'useSimulation',
      'SimCanvas',
      'GridRenderer',
      'LayerStack',
      'ParticleRenderer',
      'ForceGraph',
      'ParameterPanel',
      'TimelineControl',
      'PlaybackBar',
      'PresetSelector',
      'StatsPanel',
      'MiniChart',
      'EventLog',
      'HeatmapOverlay',
      'EntityInspector',
      'ColorRamps',
      'RingBuffer',
    ];
    for (const name of components) {
      expect(content.toLowerCase()).toContain(name.toLowerCase());
    }
  });
});

describe('DOCS-03: Creating Your Own Simulation', () => {
  it('contains Creating Your Own Simulation heading', () => {
    const content = getReadme();
    expect(content).toMatch(/#+\s+Creating Your Own Simulation/);
  });

  it('mentions tickFn', () => {
    const content = getReadme();
    expect(content).toContain('tickFn');
  });

  it('mentions ParameterSchema', () => {
    const content = getReadme();
    expect(content).toContain('ParameterSchema');
  });
});

describe('DOCS-04: Theming', () => {
  it('contains Theming heading', () => {
    const content = getReadme();
    expect(content).toMatch(/#+\s+Theming/);
  });

  it('contains --sim- variable references', () => {
    const content = getReadme();
    expect(content).toContain('--sim-');
  });
});

describe('DOCS-05: Performance', () => {
  it('contains Performance heading', () => {
    const content = getReadme();
    expect(content).toMatch(/#+\s+Performance/);
  });
});
