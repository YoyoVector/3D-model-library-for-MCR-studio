/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LegacyVisualBaseline {
  id: string;
  childMeshCount: number;
  vertexCount: number;
  triangleCount: number;
  bounds: [number, number, number, number, number, number]; // [minX, minY, minZ, maxX, maxY, maxZ] in meters
  projectedCentroid: [number, number]; // 2D screen coordinate under canonical camera (2.6, 2.0, 3.0) looking at (0,0,0)
}

/**
 * Deterministic baseline signatures for the 8 LEGACY_FITTING_LIBRARY models.
 * Generated under fixed camera:
 * - Position: [2.6, 2.0, 3.0]
 * - Target: [0, 0, 0]
 * - FOV: 45°
 * - Viewport: 800x600
 * - Default Parameters Single Source of Truth
 */
export const LEGACY_FITTING_BASELINES: Record<string, LegacyVisualBaseline> = {
  TRAY_STRAIGHT: {
    id: 'TRAY_STRAIGHT',
    childMeshCount: 17,
    vertexCount: 616,
    triangleCount: 332,
    bounds: [-0.3275, -0.05, -1.5175, 0.3275, 0.05, 1.56],
    projectedCentroid: [-0.0057, -0.0039],
  },
  TRAY_STRAIGHT_DIVIDER: {
    id: 'TRAY_STRAIGHT_DIVIDER',
    childMeshCount: 18,
    vertexCount: 640,
    triangleCount: 344,
    bounds: [-0.3275, -0.05, -1.5175, 0.3275, 0.05, 1.56],
    projectedCentroid: [-0.0057, -0.0039],
  },
  FITTING_SPLICE_PLATE: {
    id: 'FITTING_SPLICE_PLATE',
    childMeshCount: 3,
    vertexCount: 128,
    triangleCount: 76,
    bounds: [-0.0275, -0.04, -0.06, 0.0275, 0.04, 0.06],
    projectedCentroid: [0, 0],
  },
  SUPPORT_CANTILEVER: {
    id: 'SUPPORT_CANTILEVER',
    childMeshCount: 4,
    vertexCount: 96,
    triangleCount: 48,
    bounds: [-0.37, -0.295, -0.03, 0.4, -0.04, 0.03],
    projectedCentroid: [0.0045, -0.0824],
  },
  FITTING_ELBOW_90: {
    id: 'FITTING_ELBOW_90',
    childMeshCount: 7,
    vertexCount: 3216,
    triangleCount: 1092,
    bounds: [0, -0.05, -0.8739, 0.92, 0.05, 0.92],
    projectedCentroid: [0.1447, -0.0832],
  },
  FITTING_TEE: {
    id: 'FITTING_TEE',
    childMeshCount: 9,
    vertexCount: 216,
    triangleCount: 108,
    bounds: [-0.7, -0.05, -0.32, 0.7, 0.05, 0.7],
    projectedCentroid: [-0.0522, -0.0361],
  },
  FITTING_RISER_IN_90: {
    id: 'FITTING_RISER_IN_90',
    childMeshCount: 7,
    vertexCount: 3216,
    triangleCount: 1092,
    bounds: [0, 0, -0.32, 0.65, 0.65, 0.32],
    projectedCentroid: [0.1082, 0.1143],
  },
  FITTING_RISER_OUT_90: {
    id: 'FITTING_RISER_OUT_90',
    childMeshCount: 7,
    vertexCount: 3216,
    triangleCount: 1092,
    bounds: [0, -0.65, -0.32, 0.65, 0, 0.32],
    projectedCentroid: [0.101, -0.2117],
  },
};
