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

  /**
   * Arc with straight tangent extensions at both ends (e.g. Catalog Elbow with 125mm tangents).
   */
  static arcWithTangents(radiusMm: number, angleDeg: number, tangentLengthMm: number = 0): number {
    return 2 * tangentLengthMm + this.circularArc(radiusMm, angleDeg);
  }

  /**
   * Reducer with straight tangent sections at inlet and outlet (e.g. 200mm + taper + 200mm).
   */
  static reducerWithTangents(
    totalLengthMm: number,
    lateralOffsetMm: number = 0,
    inletTangentMm: number = 0,
    outletTangentMm: number = 0
  ): number {
    const transitionLength = Math.max(0, totalLengthMm - inletTangentMm - outletTangentMm);
    const transitionHypot = Math.hypot(transitionLength, lateralOffsetMm);
    return inletTangentMm + transitionHypot + outletTangentMm;
  }

  /**
   * Cross 90-degree turn branch route length (Straight tangent + Arc + Straight tangent).
   */
  static crossBranch(spanMm: number, radiusMm: number): number {
    const straightArm = Math.max(0, spanMm / 2 - radiusMm);
    const arc = (radiusMm * Math.PI) / 2;
    return 2 * straightArm + arc;
  }
}
