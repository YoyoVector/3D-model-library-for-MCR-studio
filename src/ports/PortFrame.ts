/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';

/**
 * Represents an orthonormal 3D coordinate frame for a connection port.
 * P: Origin position (mm)
 * D: Normal direction pointing outward (unit vector)
 * U: Up vector orthogonal to D (unit vector)
 * R: Right vector (D x U) completing the right-handed orthonormal basis
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
    let tempUp = new THREE.Vector3(up[0], up[1], up[2]).normalize();

    // Ensure strict orthonormality
    this.right = new THREE.Vector3().crossVectors(this.direction, tempUp).normalize();
    this.up = new THREE.Vector3().crossVectors(this.right, this.direction).normalize();
  }

  /**
   * Constructs the 3x3 rotation matrix for this frame relative to identity.
   */
  public getRotationMatrix(): THREE.Matrix4 {
    const m = new THREE.Matrix4();
    m.makeBasis(this.right, this.up, this.direction);
    return m;
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
