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
 * Deterministic baseline signatures for the 8 LEGACY_FITTING_LIBRARY component IDs (generic defaults).
 * Generated under fixed camera:
 * - Position: [2.6, 2.0, 3.0]
 * - Target: [0, 0, 0]
 * - FOV: 45°
 * - Viewport: 800x600
 * - Default Parameters Single Source of Truth
 *
 * Regenerated 2026-09-24 after the vendor-geometry correction (docs/handoff/recovery-audit.md):
 * trays / fittings are now built from the TrayLayouts formula layer (I-profile rails, catalog rung
 * pitch, curved tee transitions, correctly oriented vertical bends, no splice-plate overhang).
 * Overall generic footprints are unchanged within 7 mm (e.g. elbow 0.913 m vs 0.920 m, tee ±0.700 m).
 * The splice plate and cantilever support signatures are unchanged.
 */
export const LEGACY_FITTING_BASELINES: Record<string, LegacyVisualBaseline> = {
  TRAY_STRAIGHT: {
    id: 'TRAY_STRAIGHT',
    childMeshCount: 2,
    vertexCount: 432,
    triangleCount: 216,
    bounds: [-0.313, -0.05, -1.5, 0.313, 0.05, 1.5],
    projectedCentroid: [0, 0],
  },
  TRAY_STRAIGHT_DIVIDER: {
    id: 'TRAY_STRAIGHT_DIVIDER',
    childMeshCount: 3,
    vertexCount: 456,
    triangleCount: 228,
    bounds: [-0.313, -0.05, -1.5, 0.313, 0.05, 1.5],
    projectedCentroid: [0, 0],
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
    childMeshCount: 2,
    vertexCount: 1632,
    triangleCount: 1512,
    bounds: [0, -0.05, -0.913, 0.913, 0.05, 0],
    projectedCentroid: [0.2599, 0.0111],
  },
  FITTING_TEE: {
    id: 'FITTING_TEE',
    childMeshCount: 2,
    vertexCount: 1872,
    triangleCount: 1680,
    bounds: [-0.7, -0.05, -0.313, 0.7, 0.05, 0.7],
    projectedCentroid: [-0.0532, -0.0368],
  },
  FITTING_RISER_IN_90: {
    id: 'FITTING_RISER_IN_90',
    childMeshCount: 2,
    vertexCount: 1608,
    triangleCount: 1500,
    bounds: [0, -0.4, -0.313, 0.4, 0, 0.313],
    projectedCentroid: [0.0619, -0.1298],
  },
  FITTING_RISER_OUT_90: {
    id: 'FITTING_RISER_OUT_90',
    childMeshCount: 2,
    vertexCount: 1608,
    triangleCount: 1500,
    bounds: [0, 0, -0.313, 0.4, 0.4, 0.313],
    projectedCentroid: [0.0646, 0.0682],
  },
};
