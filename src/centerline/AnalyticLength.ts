/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Mathematical formulas for exact analytic centerline length calculations.
 * All outputs are in millimeters (mm).
 */
export class AnalyticLength {
  /**
   * Straight route length.
   */
  static straight(lengthMm: number): number {
    return Math.abs(lengthMm);
  }

  /**
   * Circular arc route length (for elbows and risers).
   * L = R * theta (in radians)
   *
   * @param radiusMm Bend centerline radius in mm
   * @param angleDeg Bend sweep angle in degrees
   */
  static circularArc(radiusMm: number, angleDeg: number): number {
    const thetaRad = (Math.abs(angleDeg) * Math.PI) / 180;
    return Math.abs(radiusMm) * thetaRad;
  }

  /**
   * Reducer transition physical centerline length.
   * For eccentric reducers with lateral offset: sqrt(length^2 + offset^2).
   */
  static reducer(lengthMm: number, lateralOffsetMm: number = 0): number {
    return Math.hypot(lengthMm, lateralOffsetMm);
  }

  /**
   * Tee branch route length (from inlet A to branch C).
   * Standard geometry: half length of main run + branch projection.
   */
  static teeBranch(mainLengthMm: number, branchLengthMm: number, radiusMm: number = 0): number {
    if (radiusMm <= 0) {
      return mainLengthMm / 2 + branchLengthMm;
    }
    // Arc transition variant: straight + 90° arc + branch straight
    const straight1 = Math.max(0, mainLengthMm / 2 - radiusMm);
    const arc = (radiusMm * Math.PI) / 2;
    const straight2 = Math.max(0, branchLengthMm - radiusMm);
    return straight1 + arc + straight2;
  }
}
