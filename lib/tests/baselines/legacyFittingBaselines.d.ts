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
export declare const LEGACY_FITTING_BASELINES: Record<string, LegacyVisualBaseline>;
