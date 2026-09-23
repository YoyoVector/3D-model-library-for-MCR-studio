import { EngineeringPlacement } from './Schema.ts';
/**
 * Geometric Transformation Engine for MCR-Studio.
 * Uses Quaternion as the canonical representation for all 3D rotations.
 */
export declare class Transforms {
    /**
     * Returns a standard identity placement.
     */
    static identityPlacement(): EngineeringPlacement;
    /**
     * Transforms a local 3D point (mm) by an EngineeringPlacement into world space.
     */
    static transformPoint(point: [number, number, number], placement: EngineeringPlacement): [number, number, number];
    /**
     * Transforms a local 3D direction vector by an EngineeringPlacement (rotation only).
     */
    static transformDirection(direction: [number, number, number], placement: EngineeringPlacement): [number, number, number];
    /**
     * Inversely transforms a world point back into local space of the placement.
     */
    static inverseTransformPoint(worldPoint: [number, number, number], placement: EngineeringPlacement): [number, number, number];
    /**
     * Multiplies two quaternions (q1 * q2).
     */
    static quaternionMultiply(q1: [number, number, number, number], q2: [number, number, number, number]): [number, number, number, number];
    /**
     * Constructs a canonical quaternion from an axis and angle in radians.
     */
    static fromAxisAngle(axis: [number, number, number], angleRad: number): [number, number, number, number];
    /**
     * Constructs a canonical quaternion from Euler angles (XYZ order) in radians.
     */
    static fromEuler(rxRad: number, ryRad: number, rzRad: number, order?: string): [number, number, number, number];
    /**
     * Converts a canonical quaternion to Euler angles in degrees (strictly for UI display/debug).
     */
    static toEulerDeg(q: [number, number, number, number], order?: string): [number, number, number];
    /**
     * Computes a canonical quaternion given an orthonormal basis (direction vector along Z, up vector along Y).
     */
    static fromBasis(direction: [number, number, number], up: [number, number, number]): [number, number, number, number];
    /**
     * Computes Euclidean distance between two 3D points.
     */
    static distance(p1: [number, number, number], p2: [number, number, number]): number;
    /**
     * Computes dot product between two 3D vectors.
     */
    static dot(v1: [number, number, number], v2: [number, number, number]): number;
    /**
     * Computes cross product between two 3D vectors.
     */
    static cross(v1: [number, number, number], v2: [number, number, number]): [number, number, number];
    /**
     * Normalizes a vector.
     */
    static normalize(v: [number, number, number]): [number, number, number];
}
