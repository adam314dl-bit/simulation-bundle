import '@testing-library/jest-dom';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Clean up after each test to prevent memory leaks
afterEach(() => {
  cleanup();
});

// jsdom does not implement CSS custom properties on :root by default.
// This helper lets tests set and read --sim-* vars on document.documentElement.
// Real CSS parsing is tested via build output inspection (tests/build.test.ts),
// not via jsdom computed style (which does not support custom properties).
Object.defineProperty(window, 'CSS', {
  value: { supports: () => false },
  writable: true,
});
