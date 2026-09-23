/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Commercial Catalog Nominal Standards for Cable Trays & Fittings.
 * Reference: NEMA VE 1 / CSA C22.2 No. 126.1 / Oglaend / Eaton B-Line catalogs.
 */
export declare const CatalogStandards: {
    standardWidthsMm: number[];
    standardDepthsMm: number[];
    standardBendAnglesDeg: number[];
    standardBendRadiiMm: number[];
    standardLengthsMm: number[];
    /**
     * Checks if given parameters conform to standard catalog presets.
     * If non-standard, generates engineering notice warnings without blocking geometry generation.
     */
    checkConformance(params: {
        width?: number;
        depth?: number;
        angleDeg?: number;
        radius?: number;
        length?: number;
    }): {
        isStandard: boolean;
        warnings: string[];
    };
};
