import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

// THEME-01 verification: The CSS file declares all required --sim-* custom properties.
// jsdom does not evaluate @import "tailwindcss" blocks, so we inspect the source CSS file
// directly rather than querying computed styles. Production verification is via browser.
describe('THEME-01: --sim-* CSS custom properties declared', () => {
  const cssPath = resolve(__dirname, '../../src/theme/index.css');

  it('src/theme/index.css exists', () => {
    expect(existsSync(cssPath)).toBe(true);
  });

  const requiredTokens = [
    '--sim-bg',
    '--sim-surface',
    '--sim-surface-raised',
    '--sim-border',
    '--sim-text',
    '--sim-text-muted',
    '--sim-accent',
    '--sim-danger',
    '--sim-warning',
    '--sim-success',
    '--sim-font-family',
    '--sim-font-mono',
    '--sim-radius-sm',
    '--sim-radius-md',
    '--sim-spacing',
  ];

  requiredTokens.forEach((token) => {
    it(`declares ${token}`, () => {
      const css = readFileSync(cssPath, 'utf-8');
      expect(css).toContain(token);
    });
  });

  it('--sim-bg has value #0a0a0f (deep space dark)', () => {
    const css = readFileSync(cssPath, 'utf-8');
    expect(css).toContain('--sim-bg: #0a0a0f');
  });

  it('--sim-accent has value #6366f1 (indigo)', () => {
    const css = readFileSync(cssPath, 'utf-8');
    expect(css).toContain('--sim-accent: #6366f1');
  });
});
