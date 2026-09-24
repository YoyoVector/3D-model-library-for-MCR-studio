/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import type { ComponentDefinition, ComponentBoundsDefinition } from '../core/Schema.ts';

/**
 * Computes bounding box directly from Three.js procedural geometry meshes in millimeters.
 *
 * NOTE: This utility is dedicated strictly to:
 * - Invariant testing (e.g. Case R bounds consistency)
 * - Debugging & visual inspection
 * - Visual validation & regression prevention
 *
 * It MUST NOT be used as the production runtime implementation for ComponentDefinition.getBounds(),
 * ensuring ComponentDefinition remains the independent Source of Truth (SOT) and avoids circular validation.
 *
 * @param definition The component definition to evaluate.
 * @param params Millimeter parameters applied to buildGeometry.
 * @returns Millimeter bounding box { min: [x, y, z], max: [x, y, z] }
 */
export function computeGeometryBounds(
  definition: ComponentDefinition,
  params?: Record<string, any>
): ComponentBoundsDefinition {
  const effectiveParams = {
    ...definition.defaultParameters,
    ...params,
  };

  const mesh = definition.buildGeometry(effectiveParams);
  mesh.updateMatrixWorld(true);

  // Engineering bounds describe the component body. Small accessory visuals
  // (userData.isAccessory, e.g. optional splice plates) are excluded.
  const box = new THREE.Box3();
  mesh.traverse((obj) => {
    const m = obj as THREE.Mesh;
    if (m.isMesh && !m.userData?.isAccessory) box.expandByObject(m);
  });
  if (box.isEmpty()) box.setFromObject(mesh);

  return {
    min: [box.min.x * 1000, box.min.y * 1000, box.min.z * 1000],
    max: [box.max.x * 1000, box.max.y * 1000, box.max.z * 1000],
  };
}
