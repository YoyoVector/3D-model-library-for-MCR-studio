/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { defineConfig } from 'vite';
import path from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    dts({
      include: ['src/**/*.ts'],
      exclude: ['src/App.tsx', 'src/main.tsx', 'src/tests/runCliTests.ts'],
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), '.'),
    },
  },
  build: {
    outDir: 'lib',
    emptyOutDir: true,
    lib: {
      entry: path.resolve(process.cwd(), 'src/index.ts'),
      name: 'McrParametric3D',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`,
    },
    rollupOptions: {
      external: [
        'three',
        'three/examples/jsm/utils/BufferGeometryUtils.js',
        'three/examples/jsm/controls/OrbitControls.js',
        'react',
        'react-dom',
        'react/jsx-runtime',
      ],
      output: {
        globals: {
          three: 'THREE',
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
  },
});
