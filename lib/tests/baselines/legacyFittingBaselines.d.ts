/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
export interface LegacyVisualBaseline {
    id: string;
    childMeshCount: number;
    vertexCount: number;
    triangleCount: number;
    bounds: [number, number, number, number, number, number];
    projectedCentroid: [number, number];
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
export declare const LEGACY_FITTING_BASELINES: Record<string, LegacyVisualBaseline>;
