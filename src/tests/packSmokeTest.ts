/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Smoke test that packs the package into a tarball, installs it into a standalone
 * directory, and verifies consuming the package via both ESM import and CJS require.
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function runSmokeTest() {
  console.log('===============================================================');
  console.log('  Pack & Tarball Consumer Smoke Test');
  console.log('===============================================================');

  const projectRoot = process.cwd();

  // 1. Pack tarball
  console.log('Packing tarball via npm pack...');
  const packOutput = execSync('npm pack', { cwd: projectRoot, encoding: 'utf-8' }).trim();
  const tarballName = packOutput.split('\n').pop()?.trim() || '';
  const tarballPath = path.resolve(projectRoot, tarballName);

  if (!fs.existsSync(tarballPath)) {
    throw new Error(`Tarball not found at ${tarballPath}`);
  }
  console.log(`Generated tarball: ${tarballName}`);

  // 2. Create isolated consumer test directory
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'smoke-test-'));
  console.log(`Setting up consumer sandbox in ${tempDir}...`);

  try {
    // Initialize consumer package.json
    fs.writeFileSync(
      path.join(tempDir, 'package.json'),
      JSON.stringify({
        name: 'test-consumer',
        version: '1.0.0',
        type: 'module',
      })
    );

    // Install three and the local packed tarball
    console.log('Installing packed tarball in isolated consumer environment...');
    execSync(`npm install --no-package-lock three "${tarballPath}"`, {
      cwd: tempDir,
      stdio: 'inherit',
    });

    // 3. Test ESM Consumer
    console.log('Verifying ESM consumer import from installed package...');
    const esmConsumerScript = `
      import * as THREE from 'three';
      import {
        ComponentRegistry,
        ComponentInstance,
        MateEngine,
        BomManager,
        BomScope
      } from '@mcr-studio/parametric-3d';

      // 1. Registry verification
      const trayDef = ComponentRegistry.get('TRAY_STRAIGHT');
      if (!trayDef) throw new Error('Smoke: TRAY_STRAIGHT not found in ComponentRegistry');

      // 2. Instance & Mesh verification
      const tray = new ComponentInstance('tray_test', trayDef, { length: 3000, width: 600 });
      const mesh = tray.getThreeMesh();
      if (!mesh || mesh.children.length === 0) {
        throw new Error('Smoke: Generated mesh is invalid');
      }

      // 3. Mate verification
      const elbowDef = ComponentRegistry.get('FITTING_ELBOW_90');
      const elbow = new ComponentInstance('elbow_test', elbowDef, { radius: 600 });
      const mate = MateEngine.computeMateTransform(tray, 'PORT_B', elbow, 'PORT_A');
      if (!mate.success) {
        throw new Error('Smoke: MateEngine failed');
      }

      // 4. BOM verification
      const bom = BomManager.generateBom([tray, elbow], {
        scope: BomScope.MCR_CABLE_TRAY_BOM,
        filterBundledChildren: true,
      });
      if (bom.totalItems !== 2) {
        throw new Error('Smoke: Expected 2 BOM items, got ' + bom.totalItems);
      }

      console.log('SMOKE_ESM_SUCCESS');
    `;

    fs.writeFileSync(path.join(tempDir, 'test-esm.js'), esmConsumerScript);
    const esmResult = execSync('node test-esm.js', { cwd: tempDir, encoding: 'utf-8' });
    if (!esmResult.includes('SMOKE_ESM_SUCCESS')) {
      throw new Error(`ESM smoke test failed: ${esmResult}`);
    }
    console.log('\x1b[32m[PASS]\x1b[0m ESM consumer test passed');

    // 4. Test CJS Consumer
    console.log('Verifying CommonJS consumer require from installed package...');
    const cjsConsumerScript = `
      const {
        ComponentRegistry,
        ComponentInstance,
        BomManager,
        BomScope
      } = require('@mcr-studio/parametric-3d');

      const def = ComponentRegistry.get('STRUCT_COLUMN');
      if (!def) throw new Error('Smoke CJS: STRUCT_COLUMN not found');

      const col = new ComponentInstance('col_01', def, { height: 8000 });
      const bounds = col.getBounds();
      if (bounds.max[1] < 8000) {
        throw new Error('Smoke CJS: Column bounds invalid');
      }

      console.log('SMOKE_CJS_SUCCESS');
    `;

    fs.writeFileSync(path.join(tempDir, 'test-cjs.cjs'), cjsConsumerScript);
    const cjsResult = execSync('node test-cjs.cjs', { cwd: tempDir, encoding: 'utf-8' });
    if (!cjsResult.includes('SMOKE_CJS_SUCCESS')) {
      throw new Error(`CJS smoke test failed: ${cjsResult}`);
    }
    console.log('\x1b[32m[PASS]\x1b[0m CommonJS consumer test passed');

    console.log('---------------------------------------------------------------');
    console.log('\x1b[32m>>> TARBALL PACKAGE CONSUMER SMOKE TEST PASSED! <<<\x1b[0m');
  } finally {
    // Cleanup temporary consumer directory and root tarball
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
      if (fs.existsSync(tarballPath)) {
        fs.unlinkSync(tarballPath);
      }
    } catch {
      // ignore cleanup errors
    }
  }
}

runSmokeTest();
