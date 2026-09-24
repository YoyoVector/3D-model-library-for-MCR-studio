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
      exclude: [
        'src/App.tsx',
        'src/app/**',
        'src/main.tsx',
        'src/tests/runCliTests.ts',
        'src/tests/packageContractTest.ts',
        'src/tests/readmeCompilationTest.ts',
        'src/tests/packSmokeTest.ts',
        'src/tests/scriptTagTest.ts',
      ],
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
      // iife: plain <script> build for offline hosts without npm; reads the global THREE and
      // defines the global McrParametric3D (tested against three r128 by `npm run test:script`).
      formats: ['es', 'cjs', 'iife'],
      fileName: (format) => `index.${format === 'es' ? 'js' : format === 'cjs' ? 'cjs' : 'iife.js'}`,
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
