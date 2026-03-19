import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    include: ['tests/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.stories.*', 'src/**/*.test.*'],
    },
  },
  resolve: {
    alias: {
      'sim-kit/core': '/src/core/index.ts',
      'sim-kit/rendering': '/src/rendering/index.ts',
      'sim-kit/controls': '/src/controls/index.ts',
      'sim-kit/data': '/src/data/index.ts',
      'sim-kit/demos': '/src/demos/index.ts',
      'sim-kit/utils': '/src/utils/index.ts',
      'sim-kit': '/src/index.ts',
    },
  },
});
