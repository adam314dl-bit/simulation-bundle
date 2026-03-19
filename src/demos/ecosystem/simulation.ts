// src/demos/ecosystem/simulation.ts
// Lotka-Volterra predator-prey cellular automaton on a 2D grid.
// Cell values: 0=empty, 1=grass, 2=rabbit, 3=fox

import type { TickFn, ParameterSchema, ParameterValue } from '../../types/index';

export interface EcosystemEntities {
  grid: Uint8Array;        // 0=empty, 1=grass, 2=rabbit, 3=fox
  width: number;
  height: number;
  stats: { grass: number; rabbits: number; foxes: number; tick: number };
}

export const ecosystemSchema: ParameterSchema = {
  grassGrowth:    { type: 'range', min: 0, max: 0.1, step: 0.01, default: 0.03, label: 'Grass Growth' },
  rabbitBreed:    { type: 'range', min: 0, max: 0.2, step: 0.01, default: 0.05, label: 'Rabbit Breed Rate' },
  rabbitStarve:   { type: 'range', min: 0, max: 0.1, step: 0.01, default: 0.02, label: 'Rabbit Starvation' },
  foxHunt:        { type: 'range', min: 0, max: 0.15, step: 0.01, default: 0.04, label: 'Fox Hunt Rate' },
  foxDeath:       { type: 'range', min: 0, max: 0.2, step: 0.01, default: 0.08, label: 'Fox Death Rate' },
  foxBreed:       { type: 'range', min: 0, max: 0.1, step: 0.01, default: 0.03, label: 'Fox Breed Rate' },
  initialDensity: { type: 'range', min: 0.1, max: 0.9, step: 0.05, default: 0.5, label: 'Initial Density' },
  gridSize:       { type: 'select', options: ['50', '100', '150', '200'], default: '100', label: 'Grid Size' },
};

/** Returns up to 4 cardinal neighbor indices (no diagonals). */
function getNeighbors(index: number, width: number, height: number): number[] {
  const col = index % width;
  const row = (index / width) | 0;
  const neighbors: number[] = [];
  if (row > 0) neighbors.push((row - 1) * width + col);           // up
  if (row < height - 1) neighbors.push((row + 1) * width + col);  // down
  if (col > 0) neighbors.push(row * width + (col - 1));           // left
  if (col < width - 1) neighbors.push(row * width + (col + 1));   // right
  return neighbors;
}

/** Initialize a grid with random cell placement. ~50% grass, ~35% rabbits, ~15% foxes among filled cells. */
export function createEcosystem(width: number, height: number, density: number): EcosystemEntities {
  const size = width * height;
  const grid = new Uint8Array(size);
  let grass = 0;
  let rabbits = 0;
  let foxes = 0;

  for (let i = 0; i < size; i++) {
    if (Math.random() < density) {
      const r = Math.random();
      if (r < 0.50) {
        grid[i] = 1; // grass
        grass++;
      } else if (r < 0.85) {
        grid[i] = 2; // rabbit
        rabbits++;
      } else {
        grid[i] = 3; // fox
        foxes++;
      }
    }
    // else grid[i] = 0 (empty, already default)
  }

  return { grid, width, height, stats: { grass, rabbits, foxes, tick: 0 } };
}

/**
 * Fisher-Yates shuffle of an index array. Reuses the same array across ticks
 * for performance -- caller must keep a reference.
 */
function shuffleIndices(indices: Uint32Array): void {
  for (let i = indices.length - 1; i > 0; i--) {
    const j = (Math.random() * (i + 1)) | 0;
    const tmp = indices[i]!;
    indices[i] = indices[j]!;
    indices[j] = tmp;
  }
}

// Reusable index array (lazily allocated)
let _indices: Uint32Array | null = null;
let _indicesSize = 0;

function getShuffledIndices(size: number): Uint32Array {
  if (!_indices || _indicesSize !== size) {
    _indices = new Uint32Array(size);
    for (let i = 0; i < size; i++) _indices[i] = i;
    _indicesSize = size;
  }
  shuffleIndices(_indices);
  return _indices;
}

/**
 * Stochastic cellular automaton tick implementing Lotka-Volterra dynamics.
 * Returns a NEW EcosystemEntities -- never mutates input.
 */
export const ecosystemTick: TickFn<EcosystemEntities> = (
  entities: EcosystemEntities,
  params: Record<string, ParameterValue>,
): EcosystemEntities => {
  const { grid, width, height } = entities;
  const size = width * height;

  const grassGrowth = params.grassGrowth as number;
  const rabbitBreed = params.rabbitBreed as number;
  const rabbitStarve = params.rabbitStarve as number;
  const foxHunt = params.foxHunt as number;
  const foxDeath = params.foxDeath as number;
  const foxBreed = params.foxBreed as number;

  // Allocate new grid (immutable pattern)
  const next = new Uint8Array(grid);
  const indices = getShuffledIndices(size);

  for (let k = 0; k < size; k++) {
    const i = indices[k]!;
    const cell = next[i]!;
    const neighbors = getNeighbors(i, width, height);

    switch (cell) {
      case 0: {
        // Empty cell: grows grass with probability grassGrowth
        if (Math.random() < grassGrowth) {
          next[i] = 1;
        }
        break;
      }
      case 1: {
        // Grass cell: adjacent rabbit may move in
        const adjacentRabbit = neighbors.find((n) => next[n] === 2);
        if (adjacentRabbit !== undefined && Math.random() < rabbitBreed) {
          // Rabbit reproduces: rabbit stays at original, new rabbit at grass cell
          next[i] = 2;
        }
        break;
      }
      case 2: {
        // Rabbit cell
        const adjacentFox = neighbors.find((n) => next[n] === 3);
        if (adjacentFox !== undefined && Math.random() < foxHunt) {
          // Fox eats rabbit: rabbit cell becomes fox, fox breeds to empty neighbor
          next[i] = 3;
          // Fox breed chance: place offspring on adjacent empty cell
          if (Math.random() < foxBreed) {
            const emptyNeighbors = neighbors.filter((n) => next[n] === 0);
            if (emptyNeighbors.length > 0) {
              const target = emptyNeighbors[(Math.random() * emptyNeighbors.length) | 0]!;
              next[target] = 3;
            }
          }
        } else if (Math.random() < rabbitStarve) {
          // Rabbit starves
          next[i] = 0;
        }
        break;
      }
      case 3: {
        // Fox cell: fox dies with probability foxDeath
        if (Math.random() < foxDeath) {
          next[i] = 0;
        }
        break;
      }
    }
  }

  // Count populations
  let grass = 0;
  let rabbits = 0;
  let foxes = 0;
  for (let i = 0; i < size; i++) {
    switch (next[i]) {
      case 1: grass++; break;
      case 2: rabbits++; break;
      case 3: foxes++; break;
    }
  }

  return {
    grid: next,
    width,
    height,
    stats: { grass, rabbits, foxes, tick: entities.stats.tick + 1 },
  };
};
