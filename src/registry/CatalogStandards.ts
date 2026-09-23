/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Commercial Catalog Nominal Standards for Cable Trays & Fittings.
 * Reference: NEMA VE 1 / CSA C22.2 No. 126.1 / Oglaend / Eaton B-Line catalogs.
 */
export const CatalogStandards = {
  standardWidthsMm: [150, 200, 300, 450, 600, 750, 900],
  standardDepthsMm: [100, 150],
  standardBendAnglesDeg: [45, 90],
  standardBendRadiiMm: [300, 450, 600, 900],
  standardLengthsMm: [1500, 2000, 3000, 6000],

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
  }): { isStandard: boolean; warnings: string[] } {
    const warnings: string[] = [];

    if (params.width !== undefined && !this.standardWidthsMm.includes(params.width)) {
      warnings.push(`Width ${params.width}mm is a non-standard custom width.`);
    }
    if (params.depth !== undefined && !this.standardDepthsMm.includes(params.depth)) {
      warnings.push(`Depth ${params.depth}mm is non-standard.`);
    }
    if (params.angleDeg !== undefined && !this.standardBendAnglesDeg.includes(params.angleDeg)) {
      warnings.push(`Angle ${params.angleDeg}° is a Non-standard Catalog Preset (field cut / special order required).`);
    }
    if (params.radius !== undefined && !this.standardBendRadiiMm.includes(params.radius)) {
      warnings.push(`Bend radius ${params.radius}mm is non-standard.`);
    }

    return {
      isStandard: warnings.length === 0,
      warnings,
    };
  },
};
