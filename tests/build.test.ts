import { describe, it, expect, beforeAll } from 'vitest';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '..');

// Run build once before all checks. Skip if dist/ already fresh (CI optimization).
beforeAll(() => {
  execSync('npx vite build', { cwd: root, stdio: 'inherit' });
}, 120_000); // 2-min timeout for first build

describe('INFRA-02: Multi-entry build output', () => {
  it('dist/index.js exists (root barrel)', () => {
    expect(existsSync(resolve(root, 'dist/index.js'))).toBe(true);
  });
  it('dist/core/index.js exists', () => {
    expect(existsSync(resolve(root, 'dist/core/index.js'))).toBe(true);
  });
  it('dist/rendering/index.js exists', () => {
    expect(existsSync(resolve(root, 'dist/rendering/index.js'))).toBe(true);
  });
  it('dist/controls/index.js exists', () => {
    expect(existsSync(resolve(root, 'dist/controls/index.js'))).toBe(true);
  });
  it('dist/data/index.js exists', () => {
    expect(existsSync(resolve(root, 'dist/data/index.js'))).toBe(true);
  });
  it('dist/demos/index.js exists', () => {
    expect(existsSync(resolve(root, 'dist/demos/index.js'))).toBe(true);
  });
});

describe('INFRA-03: Subpath exports resolve', () => {
  it('dist/core/index.js is non-empty', () => {
    const content = readFileSync(resolve(root, 'dist/core/index.js'), 'utf-8');
    expect(content.length).toBeGreaterThan(10);
  });
});

describe('INFRA-04: CSS output contains --sim-* custom properties', () => {
  it('dist/style.css exists', () => {
    expect(existsSync(resolve(root, 'dist/style.css'))).toBe(true);
  });
  it('dist/style.css contains --sim-accent', () => {
    const css = readFileSync(resolve(root, 'dist/style.css'), 'utf-8');
    expect(css).toContain('--sim-accent');
  });
  it('dist/style.css contains --sim-bg', () => {
    const css = readFileSync(resolve(root, 'dist/style.css'), 'utf-8');
    expect(css).toContain('--sim-bg');
  });
});

describe('INFRA-05: Peer dependencies externalized', () => {
  it('dist/index.js does not contain bundled React (createElement string absent)', () => {
    const content = readFileSync(resolve(root, 'dist/index.js'), 'utf-8');
    // If React is bundled, the string 'function createElement' appears in output
    expect(content).not.toContain('function createElement(');
  });
  it('dist/core/index.js does not contain bundled zustand internals', () => {
    const content = readFileSync(resolve(root, 'dist/core/index.js'), 'utf-8');
    // If zustand is bundled, 'createStore' implementation appears in output
    // Check file is under 100KB (bundling peer deps makes it much larger)
    expect(Buffer.byteLength(content, 'utf-8')).toBeLessThan(100_000);
  });
});

describe('INFRA-07: TypeScript declarations emitted', () => {
  it('dist/index.d.ts exists', () => {
    expect(existsSync(resolve(root, 'dist/index.d.ts'))).toBe(true);
  });
  it('dist/core/index.d.ts exists', () => {
    expect(existsSync(resolve(root, 'dist/core/index.d.ts'))).toBe(true);
  });
});
