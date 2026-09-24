/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

async function runPackageContractTests() {
  console.log('===============================================================');
  console.log('  Package Contract & Exports Verification Test Suite');
  console.log('===============================================================');

  let passed = true;

  // 1. Test Root ESM Import from ./lib/index.js
  try {
    const esmPath = path.resolve(projectRoot, 'lib/index.js');
    const esmModule = await import(`file://${esmPath}`);

    const expectedExports = [
      'ComponentRegistry',
      'ComponentInstance',
      'MateEngine',
      'BomManager',
      'BomScope',
      'JsonExporter',
      'Units',
      'Transforms',
      'CatalogStandards',
      'AcceptanceTestSuite',
      'PlanFrames',
      'trayNetworkFromPlan',
      'normalizeTrayNetwork',
      'resolveTrayNetwork',
      'updateRouteForChanges',
    ];

    for (const exp of expectedExports) {
      if (!(exp in esmModule) || esmModule[exp] === undefined) {
        throw new Error(`ESM root export missing or undefined: ${exp}`);
      }
    }

    // Verify functionality: Instantiate component
    const def = esmModule.ComponentRegistry.get('TRAY_STRAIGHT');
    if (!def) throw new Error('ESM: ComponentRegistry.get("TRAY_STRAIGHT") returned undefined');
    const inst = new esmModule.ComponentInstance('contract_tray_esm', def, { length: 2000, width: 600 });
    const bounds = inst.getBounds();
    if (!bounds || typeof bounds.max[0] !== 'number') {
      throw new Error('ESM: ComponentInstance.getBounds() returned invalid bounds');
    }

    console.log('\x1b[32m[PASS]\x1b[0m Root ESM import (./lib/index.js): All public APIs verified');
  } catch (err: any) {
    console.error('\x1b[31m[FAIL]\x1b[0m Root ESM import failed:', err.message);
    passed = false;
  }

  // 2. Test Root CJS Require from ./lib/index.cjs
  try {
    const require = createRequire(import.meta.url);
    const cjsPath = path.resolve(projectRoot, 'lib/index.cjs');
    const cjsModule = require(cjsPath);

    const expectedExports = [
      'ComponentRegistry',
      'ComponentInstance',
      'MateEngine',
      'BomManager',
      'BomScope',
      'JsonExporter',
      'Units',
      'Transforms',
      'CatalogStandards',
      'AcceptanceTestSuite',
      'PlanFrames',
      'trayNetworkFromPlan',
      'normalizeTrayNetwork',
      'resolveTrayNetwork',
      'updateRouteForChanges',
    ];

    for (const exp of expectedExports) {
      if (!(exp in cjsModule) || cjsModule[exp] === undefined) {
        throw new Error(`CJS root export missing or undefined: ${exp}`);
      }
    }

    // Verify functionality: Instantiate component
    const defCol = cjsModule.ComponentRegistry.get('STRUCT_COLUMN');
    if (!defCol) throw new Error('CJS: ComponentRegistry.get("STRUCT_COLUMN") returned undefined');
    const instCol = new cjsModule.ComponentInstance('contract_col_cjs', defCol, { height: 8000 });
    const colBounds = instCol.getBounds();
    if (!colBounds || colBounds.max[1] < 8000) {
      throw new Error('CJS: ComponentInstance.getBounds() returned invalid bounds for column');
    }

    const defElbow = cjsModule.ComponentRegistry.get('FITTING_ELBOW_90');
    if (!defElbow) throw new Error('CJS: ComponentRegistry.get("FITTING_ELBOW_90") returned undefined');
    const instElbow = new cjsModule.ComponentInstance('contract_elbow_cjs', defElbow, { radius: 600 });
    const ports = instElbow.getWorldPorts();
    if (!Array.isArray(ports) || ports.length === 0) {
      throw new Error('CJS: ComponentInstance.getWorldPorts() returned invalid ports for elbow');
    }

    console.log('\x1b[32m[PASS]\x1b[0m Root CJS require (./lib/index.cjs): All public APIs verified');
  } catch (err: any) {
    console.error('\x1b[31m[FAIL]\x1b[0m Root CJS require failed:', err.message);
    passed = false;
  }

  console.log('---------------------------------------------------------------');
  if (passed) {
    console.log('\x1b[32m>>> ALL PACKAGE CONTRACT TESTS PASSED SUCCESSFULLY! <<<\x1b[0m');
  } else {
    console.error('\x1b[31m>>> PACKAGE CONTRACT TESTS FAILED! <<<\x1b[0m');
    process.exit(1);
  }
}

runPackageContractTests().catch((e) => {
  console.error(e);
  process.exit(1);
});
