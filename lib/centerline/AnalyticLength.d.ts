/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * Mathematical formulas for exact analytic centerline length calculations.
 * All outputs are in millimeters (mm).
 */
export declare class AnalyticLength {
    /**
     * Straight route length.
     */
    static straight(lengthMm: number): number;
    /**
     * Circular arc route length (for elbows and risers).
     * L = R * theta (in radians)
     *
     * @param radiusMm Bend centerline radius in mm
     * @param angleDeg Bend sweep angle in degrees
     */
    static circularArc(radiusMm: number, angleDeg: number): number;
    /**
     * Reducer transition physical centerline length.
     * For eccentric reducers with lateral offset: sqrt(length^2 + offset^2).
     */
    static reducer(lengthMm: number, lateralOffsetMm?: number): number;
    /**
     * Tee branch route length (from inlet A to branch C).
     * Standard geometry: half length of main run + branch projection.
     */
    static teeBranch(mainLengthMm: number, branchLengthMm: number, radiusMm?: number): number;
    /**
     * Arc with straight tangent extensions at both ends (e.g. Catalog Elbow with 125mm tangents).
     */
    static arcWithTangents(radiusMm: number, angleDeg: number, tangentLengthMm?: number): number;
    /**
     * Reducer with straight tangent sections at inlet and outlet (e.g. 200mm + taper + 200mm).
     */
    static reducerWithTangents(totalLengthMm: number, lateralOffsetMm?: number, inletTangentMm?: number, outletTangentMm?: number): number;
    /**
     * Cross 90-degree turn branch route length (Straight tangent + Arc + Straight tangent).
     */
    static crossBranch(spanMm: number, radiusMm: number): number;
}
