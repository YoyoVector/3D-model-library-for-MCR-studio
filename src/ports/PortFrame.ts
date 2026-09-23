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
export class PortFrame {
  public readonly position: THREE.Vector3;
  public readonly direction: THREE.Vector3;
  public readonly up: THREE.Vector3;
  public readonly right: THREE.Vector3;

  constructor(
    pos: [number, number, number],
    dir: [number, number, number],
    up: [number, number, number]
  ) {
    this.position = new THREE.Vector3(pos[0], pos[1], pos[2]);
    this.direction = new THREE.Vector3(dir[0], dir[1], dir[2]).normalize();
    const tempUp = new THREE.Vector3(up[0], up[1], up[2]).normalize();

    // Canonical Right-Handed Basis (+X = Up x Direction)
    // Up x Direction = (+Y) x (+Z) = +X (Right)
    this.right = new THREE.Vector3().crossVectors(tempUp, this.direction).normalize();
    // Direction x Right = (+Z) x (+X) = +Y (Up)
    this.up = new THREE.Vector3().crossVectors(this.direction, this.right).normalize();
  }

  /**
   * Constructs the 3x3 rotation matrix for this frame relative to identity.
   * Columns: [right, up, direction]
   */
  public getRotationMatrix(): THREE.Matrix4 {
    const m = new THREE.Matrix4();
    m.makeBasis(this.right, this.up, this.direction);
    return m;
  }

  /**
   * Calculates the determinant of the basis matrix.
   * Must strictly equal +1.0 for a right-handed basis without reflection.
   */
  public getDeterminant(): number {
    return this.getRotationMatrix().determinant();
  }

  /**
   * Constructs the canonical quaternion for this frame.
   */
  public getQuaternion(): [number, number, number, number] {
    const m = this.getRotationMatrix();
    const q = new THREE.Quaternion().setFromRotationMatrix(m);
    return [q.x, q.y, q.z, q.w];
  }
}
