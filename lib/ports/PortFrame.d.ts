/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import * as THREE from 'three';
/**
 * Represents an orthonormal 3D coordinate frame for a connection port.
 * Local Coordinate Convention:
 * +X = Right
 * +Y = Up
 * +Z = Forward (Direction)
 *
 * P: Origin position (mm)
 * D: Normal direction pointing outward (unit vector along +Z)
 * U: Up vector orthogonal to D (unit vector along +Y)
 * R: Right vector (U x D) completing the true right-handed orthonormal basis (+X)
 */
export declare class PortFrame {
    readonly position: THREE.Vector3;
    readonly direction: THREE.Vector3;
    readonly up: THREE.Vector3;
    readonly right: THREE.Vector3;
    constructor(pos: [number, number, number], dir: [number, number, number], up: [number, number, number]);
    /**
     * Constructs the 3x3 rotation matrix for this frame relative to identity.
     * Columns: [right, up, direction]
     */
    getRotationMatrix(): THREE.Matrix4;
    /**
     * Calculates the determinant of the basis matrix.
     * Must strictly equal +1.0 for a right-handed basis without reflection.
     */
    getDeterminant(): number;
    /**
     * Constructs the canonical quaternion for this frame.
     */
    getQuaternion(): [number, number, number, number];
}
