/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import * as THREE from 'three';
import type { EngineeringPlacement } from './Schema.ts';

/**
 * Geometric Transformation Engine for MCR-Studio.
 * Uses Quaternion as the canonical representation for all 3D rotations.
 */
export class Transforms {
  /**
   * Returns a standard identity placement.
   */
  static identityPlacement(): EngineeringPlacement {
    return {
      position: [0, 0, 0],
      quaternion: [0, 0, 0, 1], // [x, y, z, w]
    };
  }

  /**
   * Transforms a local 3D point (mm) by an EngineeringPlacement into world space.
   */
  static transformPoint(
    point: [number, number, number],
    placement: EngineeringPlacement
  ): [number, number, number] {
    const p = new THREE.Vector3(point[0], point[1], point[2]);
    const q = new THREE.Quaternion(
      placement.quaternion[0],
      placement.quaternion[1],
      placement.quaternion[2],
      placement.quaternion[3]
    );
    p.applyQuaternion(q);
    p.add(new THREE.Vector3(placement.position[0], placement.position[1], placement.position[2]));
    return [p.x, p.y, p.z];
  }

  /**
   * Transforms a local 3D direction vector by an EngineeringPlacement (rotation only).
   */
  static transformDirection(
    direction: [number, number, number],
    placement: EngineeringPlacement
  ): [number, number, number] {
    const d = new THREE.Vector3(direction[0], direction[1], direction[2]).normalize();
    const q = new THREE.Quaternion(
      placement.quaternion[0],
      placement.quaternion[1],
      placement.quaternion[2],
      placement.quaternion[3]
    );
    d.applyQuaternion(q);
    d.normalize();
    return [d.x, d.y, d.z];
  }

  /**
   * Inversely transforms a world point back into local space of the placement.
   */
  static inverseTransformPoint(
    worldPoint: [number, number, number],
    placement: EngineeringPlacement
  ): [number, number, number] {
    const p = new THREE.Vector3(worldPoint[0], worldPoint[1], worldPoint[2]);
    p.sub(new THREE.Vector3(placement.position[0], placement.position[1], placement.position[2]));
    const q = new THREE.Quaternion(
      placement.quaternion[0],
      placement.quaternion[1],
      placement.quaternion[2],
      placement.quaternion[3]
    ).invert();
    p.applyQuaternion(q);
    return [p.x, p.y, p.z];
  }

  /**
   * Multiplies two quaternions (q1 * q2).
   */
  static quaternionMultiply(
    q1: [number, number, number, number],
    q2: [number, number, number, number]
  ): [number, number, number, number] {
    const a = new THREE.Quaternion(q1[0], q1[1], q1[2], q1[3]);
    const b = new THREE.Quaternion(q2[0], q2[1], q2[2], q2[3]);
    a.multiply(b);
    return [a.x, a.y, a.z, a.w];
  }

  /**
   * Constructs a canonical quaternion from an axis and angle in radians.
   */
  static fromAxisAngle(
    axis: [number, number, number],
    angleRad: number
  ): [number, number, number, number] {
    const ax = new THREE.Vector3(axis[0], axis[1], axis[2]).normalize();
    const q = new THREE.Quaternion().setFromAxisAngle(ax, angleRad);
    return [q.x, q.y, q.z, q.w];
  }

  /**
   * Constructs a canonical quaternion from Euler angles (XYZ order) in radians.
   */
  static fromEuler(
    rxRad: number,
    ryRad: number,
    rzRad: number,
    order: string = 'XYZ'
  ): [number, number, number, number] {
    const e = new THREE.Euler(rxRad, ryRad, rzRad, order as any);
    const q = new THREE.Quaternion().setFromEuler(e);
    return [q.x, q.y, q.z, q.w];
  }

  /**
   * Converts a canonical quaternion to Euler angles in degrees (strictly for UI display/debug).
   */
  static toEulerDeg(
    q: [number, number, number, number],
    order: string = 'XYZ'
  ): [number, number, number] {
    const quat = new THREE.Quaternion(q[0], q[1], q[2], q[3]);
    const e = new THREE.Euler().setFromQuaternion(quat, order as any);
    return [
      (e.x * 180) / Math.PI,
      (e.y * 180) / Math.PI,
      (e.z * 180) / Math.PI,
    ];
  }

  /**
   * Computes a canonical quaternion given an orthonormal basis (direction vector along Z, up vector along Y).
   */
  static fromBasis(
    direction: [number, number, number],
    up: [number, number, number]
  ): [number, number, number, number] {
    const zAxis = new THREE.Vector3(direction[0], direction[1], direction[2]).normalize();
    let yAxis = new THREE.Vector3(up[0], up[1], up[2]).normalize();
    const xAxis = new THREE.Vector3().crossVectors(yAxis, zAxis).normalize();
    yAxis = new THREE.Vector3().crossVectors(zAxis, xAxis).normalize();

    const m = new THREE.Matrix4();
    m.makeBasis(xAxis, yAxis, zAxis);
    const q = new THREE.Quaternion().setFromRotationMatrix(m);
    return [q.x, q.y, q.z, q.w];
  }

  /**
   * Computes Euclidean distance between two 3D points.
   */
  static distance(p1: [number, number, number], p2: [number, number, number]): number {
    return Math.hypot(p1[0] - p2[0], p1[1] - p2[1], p1[2] - p2[2]);
  }

  /**
   * Computes dot product between two 3D vectors.
   */
  static dot(v1: [number, number, number], v2: [number, number, number]): number {
    return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2];
  }

  /**
   * Computes cross product between two 3D vectors.
   */
  static cross(
    v1: [number, number, number],
    v2: [number, number, number]
  ): [number, number, number] {
    const a = new THREE.Vector3(v1[0], v1[1], v1[2]);
    const b = new THREE.Vector3(v2[0], v2[1], v2[2]);
    const c = a.cross(b);
    return [c.x, c.y, c.z];
  }

  /**
   * Normalizes a vector.
   */
  static normalize(v: [number, number, number]): [number, number, number] {
    const len = Math.hypot(v[0], v[1], v[2]);
    if (len === 0) return [0, 0, 0];
    return [v[0] / len, v[1] / len, v[2] / len];
  }
}
