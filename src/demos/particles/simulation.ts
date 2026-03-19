// src/demos/particles/simulation.ts
// N-body + Boids flocking particle simulation (DEMO-03)

import type { TickFn, ParameterSchema, ParameterValue } from '../../types/index';

export interface Attractor {
  x: number;
  y: number;
  strength: number;
}

export interface ParticleEntities {
  particles: Float32Array; // interleaved [x, y, vx, vy] stride 4
  count: number;
  attractors: Attractor[];
  stats: { avgSpeed: number; avgDistance: number; tick: number };
}

export const particleSchema: ParameterSchema = {
  gravity: { type: 'range', min: 0, max: 5, step: 0.1, default: 1.0, label: 'Gravity' },
  timeStep: { type: 'range', min: 0.001, max: 0.05, step: 0.001, default: 0.016, label: 'Time Step' },
  damping: { type: 'range', min: 0, max: 0.1, step: 0.001, default: 0.001, label: 'Damping' },
  particleCount: { type: 'select', options: ['500', '1000', '2000', '5000'], default: '1000', label: 'Particle Count' },
  boidsEnabled: { type: 'toggle', default: false, label: 'Boids Flocking' },
  separation: { type: 'range', min: 0, max: 5, step: 0.1, default: 1.5, label: 'Separation' },
  alignment: { type: 'range', min: 0, max: 5, step: 0.1, default: 1.0, label: 'Alignment' },
  cohesion: { type: 'range', min: 0, max: 5, step: 0.1, default: 1.0, label: 'Cohesion' },
};

const STRIDE = 4;
const EPSILON = 0.01; // softening to prevent singularity
const BOIDS_RADIUS = 0.1;
const BOUNDS = 2.0;

/**
 * Create initial particle state with a given pattern.
 * Coordinates are in [-1, 1] world space (ParticleRenderer maps via orthographic projection).
 */
export function createParticles(
  count: number,
  pattern: 'random' | 'ring' | 'burst',
): ParticleEntities {
  const particles = new Float32Array(count * STRIDE);

  switch (pattern) {
    case 'random':
      for (let i = 0; i < count; i++) {
        const off = i * STRIDE;
        particles[off] = Math.random() * 2 - 1;     // x in [-1, 1]
        particles[off + 1] = Math.random() * 2 - 1;  // y in [-1, 1]
        particles[off + 2] = 0;                       // vx = 0
        particles[off + 3] = 0;                       // vy = 0
      }
      break;

    case 'ring':
      for (let i = 0; i < count; i++) {
        const off = i * STRIDE;
        const angle = (i / count) * Math.PI * 2;
        const r = 0.3 + Math.random() * 0.4; // ring radius 0.3-0.7
        particles[off] = Math.cos(angle) * r;
        particles[off + 1] = Math.sin(angle) * r;
        // tangential velocity for spiral
        const tangentialSpeed = 0.3 + Math.random() * 0.2;
        particles[off + 2] = -Math.sin(angle) * tangentialSpeed;
        particles[off + 3] = Math.cos(angle) * tangentialSpeed;
      }
      break;

    case 'burst':
      for (let i = 0; i < count; i++) {
        const off = i * STRIDE;
        // Start at center with small random offset
        particles[off] = (Math.random() - 0.5) * 0.05;
        particles[off + 1] = (Math.random() - 0.5) * 0.05;
        // Radial outward velocity
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.5 + Math.random() * 1.5;
        particles[off + 2] = Math.cos(angle) * speed;
        particles[off + 3] = Math.sin(angle) * speed;
      }
      break;
  }

  return {
    particles,
    count,
    attractors: [],
    stats: { avgSpeed: 0, avgDistance: 0, tick: 0 },
  };
}

/**
 * Main particle tick function implementing N-body gravity + optional Boids flocking.
 * Returns a new ParticleEntities (immutable pattern -- never mutates input).
 */
export const particleTick: TickFn<ParticleEntities> = (
  entities: ParticleEntities,
  params: Record<string, ParameterValue>,
): ParticleEntities => {
  const { particles, count, attractors } = entities;
  const G = params.gravity as number;
  const dt = params.timeStep as number;
  const damping = params.damping as number;
  const boidsEnabled = params.boidsEnabled as boolean;
  const separationStrength = params.separation as number;
  const alignmentStrength = params.alignment as number;
  const cohesionStrength = params.cohesion as number;

  const next = new Float32Array(particles.length);

  // For N-body inter-particle gravity: only if count <= 2000
  const doInterParticle = count <= 2000;

  let totalSpeed = 0;
  let totalDist = 0;

  for (let i = 0; i < count; i++) {
    const ix = i * STRIDE;
    const px = particles[ix]!;
    const py = particles[ix + 1]!;
    let vx = particles[ix + 2]!;
    let vy = particles[ix + 3]!;

    let ax = 0;
    let ay = 0;

    // Gravitational acceleration from attractors
    for (let a = 0; a < attractors.length; a++) {
      const att = attractors[a]!;
      const dx = att.x - px;
      const dy = att.y - py;
      const distSq = dx * dx + dy * dy + EPSILON;
      const force = G * att.strength / distSq;
      const dist = Math.sqrt(distSq);
      ax += force * dx / dist;
      ay += force * dy / dist;
    }

    // Inter-particle N-body gravity (O(n^2), only for count <= 2000)
    if (doInterParticle && G > 0) {
      for (let j = 0; j < count; j++) {
        if (i === j) continue;
        const jx = j * STRIDE;
        const dx = particles[jx]! - px;
        const dy = particles[jx + 1]! - py;
        const distSq = dx * dx + dy * dy + EPSILON;
        // Mass = 1 for all particles, scale down force for stability
        const force = (G * 0.001) / distSq;
        const dist = Math.sqrt(distSq);
        ax += force * dx / dist;
        ay += force * dy / dist;
      }
    }

    // Boids flocking forces
    if (boidsEnabled) {
      let sepX = 0, sepY = 0;
      let alignX = 0, alignY = 0;
      let cohX = 0, cohY = 0;
      let neighborCount = 0;

      for (let j = 0; j < count; j++) {
        if (i === j) continue;
        const jx = j * STRIDE;
        const dx = particles[jx]! - px;
        const dy = particles[jx + 1]! - py;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < BOIDS_RADIUS && dist > 0) {
          neighborCount++;
          // Separation: repel from nearby neighbors
          sepX -= dx / dist;
          sepY -= dy / dist;
          // Alignment: match velocity of neighbors
          alignX += particles[jx + 2]!;
          alignY += particles[jx + 3]!;
          // Cohesion: move toward center of nearby neighbors
          cohX += particles[jx]!;
          cohY += particles[jx + 1]!;
        }
      }

      if (neighborCount > 0) {
        // Separation force
        ax += sepX * separationStrength;
        ay += sepY * separationStrength;
        // Alignment force (steer toward average velocity)
        alignX /= neighborCount;
        alignY /= neighborCount;
        ax += (alignX - vx) * alignmentStrength;
        ay += (alignY - vy) * alignmentStrength;
        // Cohesion force (steer toward average position)
        cohX /= neighborCount;
        cohY /= neighborCount;
        ax += (cohX - px) * cohesionStrength;
        ay += (cohY - py) * cohesionStrength;
      }
    }

    // Apply damping
    vx *= (1 - damping);
    vy *= (1 - damping);

    // Euler integration
    vx += ax * dt;
    vy += ay * dt;
    let nx = px + vx * dt;
    let ny = py + vy * dt;

    // Wrap positions to [-BOUNDS, BOUNDS] (toroidal)
    if (nx > BOUNDS) nx -= BOUNDS * 2;
    else if (nx < -BOUNDS) nx += BOUNDS * 2;
    if (ny > BOUNDS) ny -= BOUNDS * 2;
    else if (ny < -BOUNDS) ny += BOUNDS * 2;

    next[ix] = nx;
    next[ix + 1] = ny;
    next[ix + 2] = vx;
    next[ix + 3] = vy;

    // Accumulate stats
    const speed = Math.sqrt(vx * vx + vy * vy);
    totalSpeed += speed;
    totalDist += Math.sqrt(nx * nx + ny * ny);
  }

  const avgSpeed = count > 0 ? totalSpeed / count : 0;
  const avgDistance = count > 0 ? totalDist / count : 0;

  return {
    particles: next,
    count,
    attractors,
    stats: { avgSpeed, avgDistance, tick: entities.stats.tick + 1 },
  };
};
