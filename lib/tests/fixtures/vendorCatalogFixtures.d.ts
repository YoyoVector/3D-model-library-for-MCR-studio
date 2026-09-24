/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Golden fixtures read directly from the vendor catalog PDF (`CABLE TRAY CATALOGS_Code 1.pdf`).
 *
 * Every expected value below is written from the catalog DIMENSION CHAINS and TABLES — never
 * copied from library output — so the suite catches any drift between the library and the drawing.
 * Page numbers are PDF page indices (printed catalog page in brackets).
 *
 * Coordinate conventions of the library (documented in geometry/TrayLayouts.ts):
 * - Ladder overall width = W + 26 (p.4 section "W+26") → body half width W/2 + 13.
 * - Ventilated: W is the outer width (p.30 / p.41) → body half width W/2.
 * - Horizontal bends: arc centre at origin, inlet PORT_A at (R + W/2, 0, T) heading into −Z.
 * - Tee / cross: origin at the crossing of the run centerlines, back rail at z = −W/2 (tee).
 * - Vertical bends: arc centre at origin, inlet PORT_A at (−T, ∓(R + H/2), 0).
 * - Reducers: PORT_A (wide) at z = −L/2, travel +Z; LEFT = +X (left when viewed toward the narrow end).
 */
type V3 = [number, number, number];
export interface GoldenPort {
    id: string;
    position: V3;
    direction: V3;
    up?: V3;
    width?: number;
}
export interface GoldenFixture {
    id: string;
    description: string;
    sourcePage: number;
    printedPage: string;
    profileId: 'LADDER_PROFILE_STANDARD' | 'VENTILATED_PROFILE_A' | 'VENTILATED_PROFILE_B';
    definitionId: string;
    /** Catalog parameters (W, H, R, angle, tangent, …) — overrides applied on top of the profile. */
    params: Record<string, number | string>;
    /** Catalog dimension chain as printed, for the reader. */
    catalogChain: string;
    expectedPorts: GoldenPort[];
    /** Route lengths by route id (mm). */
    expectedRouteLengths: Record<string, number>;
    /** Body bounds (mm), when the drawing fixes them unambiguously. */
    expectedBounds?: {
        min: V3;
        max: V3;
    };
    /** Resolved engineering dimensions that must match (subset of getEngineeringDimensions). */
    expectedDims?: Record<string, number>;
}
export declare const VENDOR_GOLDEN_FIXTURES: GoldenFixture[];
export {};
