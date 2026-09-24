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
  PlanFrames,
  trayNetworkFromPlan,
  normalizeTrayNetwork,
  resolveTrayNetwork,
  updateRouteForChanges,
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

  // Snippet 4: tray network → catalog fittings
  const network = trayNetworkFromPlan(
    [
      { id: 'A', x: 0, y: 0, z: 6.4 }, { id: 'T', x: 10, y: 0, z: 6.4 }, { id: 'E', x: 20, y: 0, z: 6.4 },
      { id: 'B', x: 10, y: 6, z: 6.4 }, { id: 'J', x: 10, y: 6, z: 1.4 },
    ],
    [
      { id: 'main1', from: 'A', to: 'T', width: 600 }, { id: 'main2', from: 'T', to: 'E', width: 600 },
      { id: 'branch', from: 'T', to: 'B', width: 300 }, { id: 'riser', from: 'B', to: 'J', width: 300 },
    ],
    PlanFrames.PAGE_Y_DOWN_METRES
  );
  const normalized = normalizeTrayNetwork(network, ladder);
  const layout = resolveTrayNetwork(normalized.network, ladder);
  if (layout.issues.length !== 0) throw new Error(`README Snippet 4: unexpected issues ${layout.issues.map((i) => i.code).join(',')}`);
  const fittings = layout.fittings.map((f) => `${f.nodeId}:${f.definitionId}:${f.role === 'REDUCER' ? f.instance.effectiveParameters.outletWidth : f.instance.effectiveParameters.width}`).sort().join(',');
  if (fittings !== 'B:FITTING_RISER_OUT_90:300,T:FITTING_REDUCER_CENTER:300,T:FITTING_TEE:600') {
    throw new Error(`README Snippet 4: fittings ${fittings}`);
  }
  const route = layout.pathCenterline(updateRouteForChanges(['main1', 'branch', 'riser'], normalized));
  if (!route.ok || route.lengthMm.toFixed(2) !== '20581.53' || route.polylineMm !== 21000) {
    throw new Error(`README Snippet 4: route ${JSON.stringify(route)}`);
  }
  if (layout.pathPoints(['main1', 'branch', 'riser']).length < 10) throw new Error('README Snippet 4: pathPoints');
  const trayMaterial = new THREE.MeshStandardMaterial();
  for (const item of layout.instances()) scene.add(item.getThreeMesh({ materials: { body: trayMaterial } }));
  if (layout.bom().straights.length !== 2) throw new Error('README Snippet 4: BOM straights');

  // Snippet 4b: designer choices
  const options = { bendWidth: 'NARROWEST_LEG' as const, nodeOverrides: { T: { radius: 600 } } };
  const layout2 = resolveTrayNetwork(normalizeTrayNetwork(network, ladder, options).network, ladder, options);
  const ch = layout2.fittingChoices('T');
  if (!layout2.ok || !ch || ch.definitionId !== 'FITTING_TEE' || ch.width !== 600 || ch.widthChoices.join(',') !== '300,400,500,600' || ch.radius !== 600 || ch.radiusChoices.join(',') !== '300,600,900') {
    throw new Error(`README Snippet 4b: fittingChoices ${JSON.stringify(ch)}`);
  }

  const _units = Units.mmToM(1000);
  const _dist = Transforms.distance([0, 0, 0], [1, 1, 1]);
  if (_units !== 1.0 || _dist <= 0) {
    throw new Error('Basic transforms failed');
  }
}
