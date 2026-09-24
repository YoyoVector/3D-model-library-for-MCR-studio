/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 * Verifies that the README.md snippets are type-safe and behave as documented.
 */

import * as THREE from 'three';
import {
  TraySystemProfiles,
  createComponentFromProfile,
  buildMatedAssembly,
  MateEngine,
  AssemblyValidator,
  BomManager,
  BomScope,
  Units,
  Transforms,
} from '../index.ts';

export function testReadmeSnippets() {
  const scene = new THREE.Scene();

  // Snippet 1: catalog-true components from a vendor profile
  const ladder = TraySystemProfiles.get('LADDER_PROFILE_STANDARD')!;
  const tray = createComponentFromProfile('TRAY_STRAIGHT', ladder, {}, 'tray_01');
  const tee = createComponentFromProfile('FITTING_TEE', ladder, { width: 300, radius: 600 }, 'tee_01');
  scene.add(tray.getThreeMesh(), tee.getThreeMesh());
  const dims = tee.definition.getEngineeringDimensions!(tee.effectiveParameters);
  if (dims.mainSpan !== 1750 || dims.branchProjection !== 875 || dims.centerlineRadius !== 750) {
    throw new Error('README Snippet 1: tee dimensions differ from the README');
  }

  // Snippet 2: mate and validate the physical joints
  const result = buildMatedAssembly(
    [
      { definitionId: 'TRAY_STRAIGHT' },
      { definitionId: 'FITTING_ELBOW_90', port: 'PORT_A' },
      { definitionId: 'TRAY_STRAIGHT', port: 'PORT_A' },
    ],
    { profile: ladder }
  );
  if (!result.passed) throw new Error(`README Snippet 2 failed: ${result.issues.join('; ')}`);

  const tee600 = createComponentFromProfile('FITTING_TEE', ladder, {}, 'tee_02');
  MateEngine.placeComponentByPort(tray, 'PORT_B', tee600, 'PORT_A');
  const joint = AssemblyValidator.checkJoint(tray, 'PORT_B', tee600, 'PORT_A');
  if (!joint.passed) throw new Error(`README Snippet 2 joint failed: ${joint.issues.join('; ')}`);

  // Snippet 3: BOM
  const bom = BomManager.generateBom(result.instances, { scope: BomScope.MCR_CABLE_TRAY_BOM });
  if (!bom.items.some((it) => it.spec.includes('R=300mm 90° T=125mm'))) {
    throw new Error('README Snippet 3: elbow BOM spec differs from the README');
  }

  const _units = Units.mmToM(1000);
  const _dist = Transforms.distance([0, 0, 0], [1, 1, 1]);
  if (_units !== 1.0 || _dist <= 0) {
    throw new Error('Basic transforms failed');
  }
}
