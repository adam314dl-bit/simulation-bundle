// Requirement traceability: DOCS-06
import { describe, it, expect } from 'vitest';
import { existsSync } from 'fs';
import { resolve } from 'path';

const storiesRoot = resolve(__dirname, '../../stories');

describe('DOCS-06: Storybook stories', () => {
  const storyFiles = [
    'Core/SimulationProvider.stories.tsx',
    'Core/useSimulation.stories.tsx',
    'Rendering/SimCanvas.stories.tsx',
    'Rendering/GridRenderer.stories.tsx',
    'Rendering/LayerStack.stories.tsx',
    'Rendering/ParticleRenderer.stories.tsx',
    'Rendering/ForceGraph.stories.tsx',
    'Controls/ParameterPanel.stories.tsx',
    'Controls/TimelineControl.stories.tsx',
    'Controls/PlaybackBar.stories.tsx',
    'Controls/PresetSelector.stories.tsx',
    'Data/StatsPanel.stories.tsx',
    'Data/MiniChart.stories.tsx',
    'Data/EventLog.stories.tsx',
    'Data/HeatmapOverlay.stories.tsx',
    'Data/EntityInspector.stories.tsx',
    'Rendering/ColorRamps.stories.tsx',
    'Core/RingBuffer.stories.tsx',
  ];

  for (const storyFile of storyFiles) {
    it(`story file exists: ${storyFile}`, () => {
      const fullPath = resolve(storiesRoot, storyFile);
      expect(existsSync(fullPath)).toBe(true);
    });
  }
});
