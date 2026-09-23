/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Units and Conversions for MCR-Studio Parametric Engineering Library.
 * Canonical Engineering Data Unit: Millimeter (mm)
 * 3D Engine Render Unit: Meter (m)
 */

export class Units {
  /**
   * Converts millimeters to meters.
   */
  static mmToM(mm: number): number {
    return mm / 1000;
  }

  /**
   * Converts meters to millimeters.
   */
  static mToMm(m: number): number {
    return m * 1000;
  }

  /**
   * Converts degrees to radians.
   */
  static degToRad(deg: number): number {
    return (deg * Math.PI) / 180;
  }

  /**
   * Converts radians to degrees.
   */
  static radToDeg(rad: number): number {
    return (rad * 180) / Math.PI;
  }

  /**
   * Formats a millimeter dimension for display.
   */
  static formatMm(mm: number, precision: number = 1): string {
    return `${Number(mm.toFixed(precision))} mm`;
  }

  /**
   * Formats an elevation value in engineering convention (EL +X.Xm).
   */
  static formatElevation(mm: number): string {
    const meters = mm / 1000;
    const sign = meters >= 0 ? '+' : '';
    return `EL ${sign}${meters.toFixed(2)}m`;
  }
}
