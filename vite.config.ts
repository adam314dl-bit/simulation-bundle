import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import { libInjectCss } from 'vite-plugin-lib-inject-css';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    libInjectCss(),
    dts({
      rollupTypes: false,
      tsconfigPath: './tsconfig.build.json',
      include: ['src'],
      outDir: 'dist',
    }),
  ],
  build: {
    lib: {
      entry: {
        index:              resolve(__dirname, 'src/index.ts'),
        'core/index':       resolve(__dirname, 'src/core/index.ts'),
        'rendering/index':  resolve(__dirname, 'src/rendering/index.ts'),
        'controls/index':   resolve(__dirname, 'src/controls/index.ts'),
        'data/index':       resolve(__dirname, 'src/data/index.ts'),
        'demos/index':      resolve(__dirname, 'src/demos/index.ts'),
        'utils/index':      resolve(__dirname, 'src/utils/index.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      external: [
        'react',
        'react/jsx-runtime',
        'react-dom',
        /^react-dom\//,
        'zustand',
        /^zustand\//,
        'recharts',
        /^recharts\//,
        'd3-force',
        'd3-quadtree',
      ],
      output: {
        assetFileNames: 'style[extname]',
      },
    },
    target: 'es2022',
    minify: false,
    cssCodeSplit: false,
  },
});
