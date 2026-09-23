/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Units and Conversions for MCR-Studio Parametric Engineering Library.
 * Canonical Engineering Data Unit: Millimeter (mm)
 * 3D Engine Render Unit: Meter (m)
 */
export declare class Units {
    /**
     * Converts millimeters to meters.
     */
    static mmToM(mm: number): number;
    /**
     * Converts meters to millimeters.
     */
    static mToMm(m: number): number;
    /**
     * Converts degrees to radians.
     */
    static degToRad(deg: number): number;
    /**
     * Converts radians to degrees.
     */
    static radToDeg(rad: number): number;
    /**
     * Formats a millimeter dimension for display.
     */
    static formatMm(mm: number, precision?: number): string;
    /**
     * Formats an elevation value in engineering convention (EL +X.Xm).
     */
    static formatElevation(mm: number): string;
}
