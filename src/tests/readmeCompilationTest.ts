/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Verifies that all snippets in README.md are strictly type-safe and compile.
 */

import * as THREE from 'three';
import {
  ComponentRegistry,
  ComponentInstance,
  MateEngine,
  BomManager,
  BomScope,
  RouteGenerator,
  AnalyticLength,
  ConnectionValidator,
  JsonExporter,
  AcceptanceTestSuite,
  AssemblyRegistry,
  CatalogStandards,
  Units,
  Transforms,
} from '../index.ts';

export function testReadmeSnippets() {
  const scene = new THREE.Scene();

  // Snippet 1: Instantiate and Render a Component
  const trayDef = ComponentRegistry.get('TRAY_STRAIGHT')!;
  const trayInstance = new ComponentInstance('tray_01', trayDef, {
    length: 3000,
    width: 600,
    depth: 100,
  });

  trayInstance.setPlacement({
    position: [0, 6400, 0],
    quaternion: [0, 0, 0, 1],
  });

  const mesh = trayInstance.getThreeMesh();
  scene.add(mesh);

  // Snippet 2: Snap & Mate Components via Ports
  const elbowDef = ComponentRegistry.get('FITTING_ELBOW_90')!;
  const elbowInstance = new ComponentInstance('elbow_01', elbowDef, {
    radius: 600,
    width: 600,
    depth: 100,
  });

  const mateResult = MateEngine.computeMateTransform(
    trayInstance,
    'PORT_B',
    elbowInstance,
    'PORT_A',
    0.5
  );

  if (mateResult.success) {
    elbowInstance.setPlacement(mateResult.placement);
    scene.add(elbowInstance.getThreeMesh());
  }

  // Snippet 3: Generate Procurement BOM
  const instances = [trayInstance, elbowInstance];
  const bom = BomManager.generateBom(instances, {
    scope: BomScope.MCR_CABLE_TRAY_BOM,
    filterBundledChildren: true,
  });

  if (!Array.isArray(bom.items) || typeof bom.totalItems !== 'number') {
    throw new Error('README Snippet 3 failed runtime check');
  }

  // Verify other exported items are usable
  const _units = Units.mmToM(1000);
  const _dist = Transforms.distance([0, 0, 0], [1, 1, 1]);
  if (_units !== 1.0 || _dist <= 0) {
    throw new Error('Basic transforms failed');
  }
}
