/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Plain <script> build test: lib/index.iife.js loaded the way an offline host page loads it —
 * a global THREE first, then the library script, no module system, no DOM at load time.
 * Runs the acceptance suite on three r128 (the oldest supported global build) and on the current
 * three, and requires identical component geometry on both.
 */

import vm from 'node:vm';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const root = process.cwd();
const require = createRequire(import.meta.url);
const iife = fs.readFileSync(path.resolve(root, 'lib/index.iife.js'), 'utf8');

type Lib = any;

async function loadLibrary(three: 'r128' | 'current'): Promise<{ lib: Lib; THREE: any; revision: string }> {
  const ctx: Record<string, any> = { console };
  ctx.globalThis = ctx;
  ctx.self = ctx;
  ctx.window = ctx;
  vm.createContext(ctx);
  if (three === 'r128') {
    // Exactly what a host page does: <script src="three.min.js"> defines the global THREE.
    vm.runInContext(fs.readFileSync(require.resolve('three-r128/build/three.min.js'), 'utf8'), ctx);
  } else {
    ctx.THREE = await import('three');
  }
  vm.runInContext(iife, ctx, { filename: 'index.iife.js' });
  if (!ctx.McrParametric3D) throw new Error('lib/index.iife.js did not define the global McrParametric3D');
  return { lib: ctx.McrParametric3D, THREE: ctx.THREE, revision: String(ctx.THREE.REVISION) };
}

function componentBounds(lib: Lib, THREE: any): Record<string, number[]> {
  const out: Record<string, number[]> = {};
  for (const def of lib.ComponentRegistry.getAll()) {
    const mesh = new lib.ComponentInstance(`b_${def.id}`, def, {}).getThreeMesh();
    mesh.updateMatrixWorld(true);
    const b = new THREE.Box3().setFromObject(mesh);
    out[def.id] = [b.min.x, b.min.y, b.min.z, b.max.x, b.max.y, b.max.z];
  }
  return out;
}

function networkSummary(lib: Lib): string {
  const net = lib.trayNetworkFromPlan(
    [
      { id: 'a', x: 0, y: 0, z: 6.4 },
      { id: 't', x: 10, y: 0, z: 6.4 },
      { id: 'e', x: 20, y: 0, z: 6.4 },
      { id: 'b', x: 10, y: 6, z: 6.4 },
      { id: 'j', x: 10, y: 6, z: 1.4 },
      { id: 'f', x: 20, y: 8, z: 6.4 },
    ],
    [
      { id: 's1', from: 'a', to: 't', width: 600 },
      { id: 's2', from: 't', to: 'e', width: 600 },
      { id: 's3', from: 'e', to: 'f', width: 600 },
      { id: 'br', from: 't', to: 'b', width: 300 },
      { id: 'rs', from: 'b', to: 'j', width: 300 },
    ],
    lib.PlanFrames.PAGE_Y_DOWN_METRES
  );
  const profile = lib.TraySystemProfiles.get('LADDER_PROFILE_STANDARD');
  const lay = lib.resolveTrayNetwork(lib.normalizeTrayNetwork(net, profile).network, profile);
  if (!lay.ok) throw new Error(`network errors: ${lay.issues.map((i: any) => i.code).join(',')}`);
  const fittings = lay.fittings.map((f: any) => `${f.nodeId}:${f.definitionId}`).sort().join(',');
  const length = lay.pathCenterline(['s1', 'br', 'rs']).lengthMm.toFixed(6);
  return `${fittings} | ${length}`;
}

async function run(): Promise<void> {
  console.log('===============================================================');
  console.log('  Plain <script> Build Test (lib/index.iife.js on global THREE)');
  console.log('===============================================================');
  let ok = true;
  const results: Record<string, { bounds: Record<string, number[]>; network: string }> = {};

  for (const three of ['r128', 'current'] as const) {
    try {
      const { lib, THREE, revision } = await loadLibrary(three);
      const required = ['ComponentRegistry', 'ComponentInstance', 'TraySystemProfiles', 'resolveTrayNetwork', 'normalizeTrayNetwork', 'trayNetworkFromPlan', 'PlanFrames', 'AcceptanceTestSuite'];
      const missing = required.filter((k) => lib[k] === undefined);
      if (missing.length) throw new Error(`missing globals: ${missing.join(', ')}`);
      const report = lib.AcceptanceTestSuite.runAll();
      if (!report.allPassed) {
        throw new Error(`acceptance ${report.totalPassed}/${report.totalCases}: ${report.cases.filter((c: any) => !c.passed).map((c: any) => `${c.id} ${c.actual}`).join(' | ')}`);
      }
      results[three] = { bounds: componentBounds(lib, THREE), network: networkSummary(lib) };
      console.log(`\x1b[32m[PASS]\x1b[0m three r${revision}: global McrParametric3D loaded, ${report.totalCases}/${report.totalCases} acceptance cases, ${Object.keys(results[three].bounds).length} components built`);
    } catch (err: any) {
      ok = false;
      console.error(`\x1b[31m[FAIL]\x1b[0m three ${three}: ${err?.message ?? err}`);
    }
  }

  if (results.r128 && results.current) {
    let maxDiff = 0;
    for (const [id, b] of Object.entries(results.current.bounds)) {
      const o = results.r128.bounds[id];
      if (!o) {
        ok = false;
        console.error(`\x1b[31m[FAIL]\x1b[0m ${id} missing on r128`);
        continue;
      }
      b.forEach((v, i) => (maxDiff = Math.max(maxDiff, Math.abs(v - o[i]))));
    }
    const sameNetwork = results.r128.network === results.current.network;
    if (maxDiff > 1e-9 || !sameNetwork) {
      ok = false;
      console.error(`\x1b[31m[FAIL]\x1b[0m r128 vs current: max bounds difference ${maxDiff} m, network ${sameNetwork ? 'same' : `${results.r128.network} != ${results.current.network}`}`);
    } else {
      console.log(`\x1b[32m[PASS]\x1b[0m r128 and current three: identical geometry (max bounds difference ${maxDiff} m) and identical network layout`);
    }
  }

  console.log('---------------------------------------------------------------');
  if (!ok) {
    console.error('\x1b[31m>>> PLAIN SCRIPT BUILD TEST FAILED <<<\x1b[0m');
    process.exit(1);
  }
  console.log('\x1b[32m>>> PLAIN SCRIPT BUILD TEST PASSED <<<\x1b[0m');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
